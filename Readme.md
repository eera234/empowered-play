# Empowered Play — Setup Guide

## Run locally first (test on your laptop)

### Step 1 — Install dependencies
Open Terminal, navigate to this folder, then run:
```
cd /path/to/empowered-play
npm install
```
You'll see it download express and socket.io. Takes ~30 seconds.

### Step 2 — Start the server
```
npm start
```
You should see:
```
Empowered Play server running on http://localhost:3000
```

### Step 3 — Open the game
Go to http://localhost:3000 in Chrome.

### Step 4 — Test with your phone on the same WiFi
Find your laptop's local IP address:
- Mac: System Preferences → Network → look for something like 192.168.1.x
- Then open http://192.168.1.x:3000 on your phone

---

## Deploy to the internet (so anyone can join from anywhere)

### Backend (server) — Railway (free)
1. Go to railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
   - OR click "Empty project" → drag and drop this whole folder
3. Railway will detect it's a Node app and deploy automatically
4. Copy the URL it gives you (something like https://empowered-play-production.up.railway.app)

### Frontend — update the socket connection
In public/index.html, find this line near the top of the script:
```
const socket = io();
```
Change it to:
```
const socket = io('https://your-railway-url.up.railway.app');
```

### That's it
Share the Railway URL with your team. They open it on their phones. 
The facilitator creates a session, gets a code, shares it with the team.

---

## How the game works

### Facilitator flow
1. Open the app → click FACILITATOR
2. A session code is generated automatically (e.g. NOVA7)
3. Share the code with your team
4. As players join, you see them appear in your list
5. For each player, pick their constraint card from the dropdown
   - Read the HR note next to each card to decide who gets what
   - Click SEND — the card goes only to that player's screen
6. Once all cards are sent, click ADVANCE → the game begins
7. You control every phase transition from your dashboard

### Player flow
1. Open the app on phone → click PLAYER
2. Enter name + session code
3. Wait in lobby until facilitator sends your card
4. Tap the sealed envelope to open your constraint card
5. Build your LEGO district following your constraint (15 min timer)
6. Upload a photo of your district
7. Place your district on the shared city map — drag freely
8. Chat with teammates about placement
9. Constraint reveal → Debrief → Done

---

## The 8 constraint cards

| Card | Icon | Best assigned to |
|------|------|-----------------|
| The Bridge Keeper | 🌉 | Someone who stays on the sidelines |
| The Centre Node | ⚡ | Someone who tends to dominate |
| The Last Builder | 🏛️ | Most junior / quietest person |
| Double Resource | 💎 | Senior leader — forces generosity |
| Vertical Only | 🏗️ | Someone who takes up too much space |
| The Connector | 🔗 | Adaptable team members |
| The Gatekeeper | 🚪 | Quiet person with good judgment |
| The Architect's Debt | 📐 | Very independent workers |