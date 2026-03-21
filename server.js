const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Serve the frontend HTML file
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory session store ──
// sessions[code] = { code, facilitatorId, players: {socketId: {name, cardIndex}}, phase, districts: [] }
const sessions = {};

// ── The 8 Cityscape constraint cards ──
const CITYSCAPE_CARDS = [
  {
    id: 0,
    title: 'The Bridge Keeper',
    icon: '🌉',
    color: '#006DB7',
    rule: 'You hold the only bridge pieces in the city. Nothing can connect across the river without you. Your cooperation is not optional — it is structural.',
    hrNote: 'Give to someone who tends to stay on the sidelines. This card makes them structurally unmissable.'
  },
  {
    id: 1,
    title: 'The Centre Node',
    icon: '⚡',
    color: '#F47B20',
    rule: 'Your district must sit at the exact centre of the city grid. Every route passes through you, whether anyone planned it or not.',
    hrNote: 'Good for someone who dominates — being fixed at the centre means others must design around them, not for them.'
  },
  {
    id: 2,
    title: 'The Last Builder',
    icon: '🏛️',
    color: '#E3000B',
    rule: 'You build last. Before finishing your district, you must physically incorporate one visible element from every other person\'s build into yours. You complete the city.',
    hrNote: 'Assign to the most junior or quietest person. They literally finish the city — a structural guarantee their contribution matters most.'
  },
  {
    id: 3,
    title: 'Double Resource',
    icon: '💎',
    color: '#00A650',
    rule: 'Your LEGO kit has twice the pieces of everyone else. You may only use half of them. The rest must be distributed to other players before you start building.',
    hrNote: 'Good for senior leaders. Forces generosity and active attention to what others need — not just what they want to build.'
  },
  {
    id: 4,
    title: 'Vertical Only',
    icon: '🏗️',
    color: '#FFD700',
    rule: 'You can only build upward, never outward. Your district rises into the sky — it does not spread across the ground. Height is your entire contribution.',
    hrNote: 'Good for someone who tends to take up a lot of space in discussions. Physically constrains their footprint.'
  },
  {
    id: 5,
    title: 'The Connector',
    icon: '🔗',
    color: '#9B59B6',
    rule: 'Your district has no fixed position in the city. You go last in placement and fill whatever gap the city most needs. Your power is total flexibility — and total dependency on others going first.',
    hrNote: 'Good for adaptable team members. Also useful for someone who always waits for others to decide before acting.'
  },
  {
    id: 6,
    title: 'The Gatekeeper',
    icon: '🚪',
    color: '#C0392B',
    rule: 'Your district controls the only entry and exit point to the city. Before any other player places their district on the city map, they must describe their district to you and get your verbal approval. You may ask one question.',
    hrNote: 'Give to someone quiet who has good judgment but rarely gets to exercise it formally. This card gives them structural authority.'
  },
  {
    id: 7,
    title: "The Architect's Debt",
    icon: '📐',
    color: '#16A085',
    rule: 'Before placing any LEGO piece, you must first ask two other players for one piece each. You cannot start until both have given you something. Your district is literally built from the team.',
    hrNote: 'Good for someone who works very independently. Forces them to initiate contact and depend on others from the very first move.'
  }
];

// ── Generate a random 5-char session code ──
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Socket.io event handling ──
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // ── FACILITATOR: Create a new session ──
  socket.on('create_session', (data, callback) => {
    let code = makeCode();
    while (sessions[code]) code = makeCode(); // ensure unique
    sessions[code] = {
      code,
      facilitatorId: socket.id,
      players: {},
      phase: 'waiting', // waiting → card_reveal → building → uploading → city_map → constraint_reveal → debrief → complete
      districts: [],
      scenario: data.scenario || 'The Flooded City'
    };
    socket.join(code);
    socket.sessionCode = code;
    socket.role = 'facilitator';
    console.log('Session created:', code);
    callback({ success: true, code, cards: CITYSCAPE_CARDS });
  });

  // ── PLAYER: Join a session ──
  socket.on('join_session', (data, callback) => {
    const { code, name } = data;
    const session = sessions[code];
    if (!session) return callback({ success: false, error: 'Session not found. Check your code.' });
    if (Object.keys(session.players).length >= 10) return callback({ success: false, error: 'Session is full (max 10 players).' });

    // Check name not already taken
    const takenNames = Object.values(session.players).map(p => p.name.toLowerCase());
    if (takenNames.includes(name.toLowerCase())) return callback({ success: false, error: 'That name is already taken in this session.' });

    session.players[socket.id] = { name, cardIndex: null, uploaded: false, districtName: '', placed: false };
    socket.join(code);
    socket.sessionCode = code;
    socket.role = 'player';
    socket.playerName = name;

    // Tell facilitator a new player joined
    io.to(session.facilitatorId).emit('player_joined', {
      id: socket.id,
      name,
      players: session.players
    });

    console.log(`${name} joined session ${code}`);
    callback({ success: true, phase: session.phase, players: Object.values(session.players).map(p => p.name) });
  });

  // ── FACILITATOR: Assign a card to a player ──
  socket.on('assign_card', (data) => {
    // data: { playerSocketId, cardIndex }
    const session = sessions[socket.sessionCode];
    if (!session || socket.role !== 'facilitator') return;
    const player = session.players[data.playerSocketId];
    if (!player) return;

    player.cardIndex = data.cardIndex;

    // Send card ONLY to that player — nobody else gets this event
    io.to(data.playerSocketId).emit('card_assigned', {
      card: CITYSCAPE_CARDS[data.cardIndex]
    });

    // Tell facilitator the assignment was confirmed
    io.to(session.facilitatorId).emit('card_assignment_confirmed', {
      playerName: player.name,
      cardTitle: CITYSCAPE_CARDS[data.cardIndex].title
    });

    console.log(`Card "${CITYSCAPE_CARDS[data.cardIndex].title}" assigned to ${player.name}`);
  });

  // ── FACILITATOR: Advance the phase ──
  socket.on('advance_phase', (data) => {
    const session = sessions[socket.sessionCode];
    if (!session || socket.role !== 'facilitator') return;

    const phases = ['waiting', 'card_reveal', 'building', 'uploading', 'city_map', 'constraint_reveal', 'debrief', 'complete'];
    const currentIndex = phases.indexOf(session.phase);
    if (currentIndex < phases.length - 1) {
      session.phase = phases[currentIndex + 1];
    }

    // Broadcast new phase to ALL players in session
    io.to(session.code).emit('phase_changed', { phase: session.phase });
    console.log(`Session ${session.code} → phase: ${session.phase}`);
  });

  // ── PLAYER: Upload district photo + name ──
  socket.on('upload_district', (data, callback) => {
    // data: { districtName, photoDataUrl }
    const session = sessions[socket.sessionCode];
    if (!session) return;
    const player = session.players[socket.id];
    if (!player) return;

    player.districtName = data.districtName;
    player.uploaded = true;
    player.photoDataUrl = data.photoDataUrl;

    // Tell facilitator upload happened
    io.to(session.facilitatorId).emit('player_uploaded', {
      id: socket.id,
      name: player.name,
      districtName: data.districtName,
      uploaded: Object.values(session.players).filter(p => p.uploaded).length,
      total: Object.keys(session.players).length
    });

    callback({ success: true });
  });

  // ── PLAYER: Place/move district on city map ──
  socket.on('place_district', (data) => {
    // data: { x, y, districtName }
    const session = sessions[socket.sessionCode];
    if (!session) return;
    const player = session.players[socket.id];
    if (!player) return;

    player.placed = true;
    player.x = data.x;
    player.y = data.y;

    // Broadcast to everyone in session (including the player who moved, for consistency)
    io.to(session.code).emit('district_moved', {
      id: socket.id,
      name: player.name,
      districtName: player.districtName,
      photoDataUrl: player.photoDataUrl,
      x: data.x,
      y: data.y
    });
  });

  // ── PLAYER: Send chat message ──
  socket.on('chat_message', (data) => {
    const session = sessions[socket.sessionCode];
    if (!session) return;
    const player = session.players[socket.id];
    const senderName = player ? player.name : 'Facilitator';

    io.to(session.code).emit('chat_message', {
      sender: senderName,
      text: data.text,
      isFacilitator: socket.role === 'facilitator'
    });
  });

  // ── PLAYER: Submit debrief answer ──
  socket.on('submit_debrief', (data) => {
    const session = sessions[socket.sessionCode];
    if (!session) return;
    // Broadcast anonymised answer to facilitator only
    io.to(session.facilitatorId).emit('debrief_answer', {
      answer: data.answer,
      question: data.question
    });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const code = socket.sessionCode;
    if (!code || !sessions[code]) return;
    const session = sessions[code];

    if (socket.role === 'player' && session.players[socket.id]) {
      const name = session.players[socket.id].name;
      delete session.players[socket.id];
      io.to(session.facilitatorId).emit('player_left', { name, players: session.players });
      console.log(`${name} left session ${code}`);
    }

    if (socket.role === 'facilitator') {
      // Notify all players facilitator disconnected
      io.to(code).emit('facilitator_disconnected');
      console.log(`Facilitator left session ${code}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`(Em)Powered Play server running on http://localhost:${PORT}`));