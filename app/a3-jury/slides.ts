export type Bullet = string;

export type SlideImage = {
  src: string;
  caption?: string;
};

export type SlideLayout =
  | "title"
  | "text"
  | "text-image"
  | "image-text"
  | "image-grid"
  | "split-3";

export type Slide = {
  id: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  bullets?: Bullet[];
  images?: SlideImage[];
  layout: SlideLayout;
  notes?: string;
};

export const SLIDES: Slide[] = [
  {
    id: 1,
    eyebrow: "A3 JURY · 2026",
    title: "Empowered Play",
    subtitle: "A LEGO-Based Hybrid Workshop for Balanced Team Participation",
    bullets: [
      "Eera Dubey · 225306004 · Semester 8 (AY 2025-2026)",
      "Client: Azpire Mind Gym (Productive Play)",
      "Guides: Kavita Arvind, Abhimanyu Ghimiray",
    ],
    images: [{ src: "/a3/s01-title.png" }],
    layout: "title",
    notes: "Open with the artefact. The deck is process-driven; the title slide should signal the final state of the work.",
  },

  {
    id: 2,
    eyebrow: "01 · PROJECT FOCUS",
    title: "Who, Why & What",
    bullets: [
      "WHO  ·  Facilitators and corporate teams in Indian organisations; adult learners navigating power dynamics across startups, MNCs, and mid-size companies.",
      "WHY  ·  Hierarchical culture silences participation. Cultural conditioning around seniority suppresses open communication. Existing team-building tools fail to address structural inequality.",
      "WHAT  ·  A hybrid digital + physical LEGO collaborative platform. Scenario-based play that surfaces and rebalances power dynamics. Behavioural reflection captured during gameplay, not after.",
    ],
    layout: "text",
    notes: "Compress the A2 Who/Why/What into one slide. The shift since A2 is the move from 'measurable post-session reflection' to reflection embedded in gameplay.",
  },

  {
    id: 3,
    eyebrow: "02 · PROBLEM STATEMENT",
    title: "Hierarchy is Functional and Limiting",
    subtitle: "Research Question",
    bullets: [
      "How can digital play-based collaborative systems be designed to reduce and rebalance power dynamics, hierarchy, and personality barriers in adult teams?",
      "Hierarchy in Indian workplaces enables clarity and accountability, and simultaneously restricts voice.",
      "Participation is not just personality. It is shaped by ethnicity, upbringing, and power-distance norms.",
      "Designer's role: not to remove hierarchy, but to give junior employees structurally essential roles inside it.",
    ],
    layout: "text",
  },

  {
    id: 4,
    eyebrow: "03 · LEARNING & PROCESS",
    title: "Workshops & Masterclasses",
    bullets: [
      "Murali Krishna (27 Jan)  ·  Toy design history, moulding techniques, speculative design for the year 3020. Shifted my thinking: building blocks as a designed system, not just material.",
      "Clients Umesh & Praveen (23 Jan, 30 Jan)  ·  Productive play. Games should change behaviour measurably; impact must be captured during play, not via post-session surveys.",
      "Shyam (30 Jan)  ·  Career arc through Clean Label, PRFM, Productive Play. Organisations want immersive experiences, not just engagement.",
      "Kavita  ·  Ongoing reviews; mock jury before A2 narrowed delivery to 20 minutes and pushed clearer rationale for the digital platform.",
      "Kumkum (13 Apr)  ·  Docbook design session. Hierarchy, typography, and balance of visual + text shaped how I structured both the docbook and this deck.",
    ],
    images: [
      { src: "/a3/s04-master-1.png" },
      { src: "/a3/s04-master-2.png" },
    ],
    layout: "text-image",
  },

  {
    id: 5,
    eyebrow: "03 · LEARNING & PROCESS",
    title: "Visits · What Each One Showed",
    bullets: [
      "Buddhi School (3 Feb)  ·  Experiential learning shapes confidence; agency comes before content.",
      "Azpire centre (30 Jan)  ·  Bridge activity: tallest individual tower → collaborative bridge. Praveen's pizza-box LEGO kit revealed the hybrid format I would later build for.",
      "Venttup Ventures (2 Mar)  ·  Equal participation during build. Founders dominated the explanation phase. Larger shapes were instinctively used to represent leadership.",
      "Unicorn India Ventures (6 Mar)  ·  Same group, three different mental models of collaboration. Role determines worldview.",
    ],
    images: [
      { src: "/a3/s05-buddhi-1.png" },
      { src: "/a3/s05-azpire-1.png" },
      { src: "/a3/s05-venttup.png" },
      { src: "/a3/s05-unicorn.png" },
    ],
    layout: "image-grid",
    notes: "Lead with insight, not documentation. Each visit gets an insight callout, not a description.",
  },

  {
    id: 6,
    eyebrow: "03 · LEARNING & PROCESS",
    title: "Sprints & Ideation Journey",
    bullets: [
      "Boot-up notes  ·  revisited four research areas: collaboration tools, adult learning, creative spaces, hierarchy.",
      "Crazy 8s + Heat-mapping  ·  rapid iteration; peers marked the scalable digital system as the strongest direction.",
      "A1 jury feedback  ·  hybrid of physical + digital, scenario-grounded prototype, storytelling and playfulness.",
      "A2 peer playtest (24 Mar)  ·  drag-and-drop broke; rejoin bug; mobile UX issues; over-restrictive shape prompts removed.",
      "A2 jury (30 Mar)  ·  asked for broader research, clearer storyboard, tighter link between research and design decisions.",
      "A3 architecture pivot (17-24 Apr)  ·  build-then-place flow replaced by story-mode chapters.",
    ],
    images: [
      { src: "/a3/s06-jan-19.jpeg" },
      { src: "/a3/s06-sprint.png" },
    ],
    layout: "text-image",
  },

  {
    id: 7,
    eyebrow: "04 · DECISIONS",
    title: "Three Difficult Choices",
    bullets: [
      "Hybrid over fully digital.  ·  Online-only formats lose the embodied negotiation that makes LEGO work. Pizza-box kit at Azpire showed the hybrid was actually shippable.",
      "Static map over interactive coded map.  ·  Coded interactivity broke during the 24 Mar playtest and pulled focus from the social mechanic. Pixel-art stills made the world readable in a glance.",
      "Story-mode chapters over single-session flow.  ·  A2 jury asked for clearer activity structure; client review (10 Apr) asked for layered gameplay. Three-chapter arc (build → crisis → recovery) gave the asymmetry a place to surface.",
    ],
    layout: "text",
    notes: "This is the 'Decision-Making Moments' slide the rubric asks for. State the choice, the trigger, and what informed it.",
  },

  {
    id: 8,
    eyebrow: "04 · TESTING & INSIGHTS",
    title: "Testing · What Worked, What Failed",
    bullets: [
      "Peer playtest (24 Mar)  ·  Constraint cards and scenarios drove engagement. Drag-and-drop map broke. Rejoin bug. Mobile UX unclear.",
      "Playtest #1 (25 Apr morning)  ·  Connection drops; 30s pair-build window too tight; map completion logic mis-firing on correct placements.",
      "Playtest #2 (25 Apr evening)  ·  System ran cleanly. Instructions and prompts read as too dense; world-building copy was overwhelming participants.",
      "Pattern  ·  Mechanics work. Communication of the mechanics is where players drop out.",
    ],
    images: [
      { src: "/a3/s08-playtest-1.png" },
      { src: "/a3/s08-playtest-2.png" },
      { src: "/a3/s08-playtest-3.png" },
    ],
    layout: "text-image",
  },

  {
    id: 9,
    eyebrow: "04 · INSIGHTS",
    title: "Patterns Across Field & Lab",
    bullets: [
      "Physical collaboration levels hierarchy temporarily.  ·  Verbal space does not.",
      "Different roles within the same organisation produce radically different mental models.",
      "Frustration transforms into coordination under non-verbal constraints (Silent Builders, 22 Jan).",
      "Asymmetry is not a bug.  ·  When each player's experience of the same event is different, the question of who has power becomes playable rather than just stated.",
    ],
    layout: "text",
  },

  {
    id: 10,
    eyebrow: "05 · EARLY PROTOTYPES",
    title: "HTML Prototypes v1 → v4",
    bullets: [
      "Built with Claude (12-17 Mar)  ·  iterative versions covering constraint card logic, camera permissions, chat, scenario prompts, navigation.",
      "Deployed (18-23 Mar)  ·  Vercel + Convex backend. Real-time multi-user with facilitator dashboard and cross-device join.",
      "Each version stripped a feature that wasn't carrying weight.  ·  Shape prompts came in at v3; out by the next playtest.",
    ],
    images: [
      { src: "/a3/s10-html-v1.png" },
      { src: "/a3/s10-html-v2.png" },
      { src: "/a3/s10-html-v3.png" },
      { src: "/a3/s10-html-v4.png" },
    ],
    layout: "image-grid",
  },

  {
    id: 11,
    eyebrow: "05 · EARLY PROTOTYPES",
    title: "Wireframes, Flow Maps, Paper Builds",
    bullets: [
      "Crash assignment · Silent Builders (22 Jan)  ·  Non-verbal + no-sight LEGO game. Constraint cards, prompt cards, guesser. The rule structure for this thesis began here.",
      "Platform flow mapping (10-12 Mar)  ·  45-60 minute session storyboarded: Facilitator login → constraint cards → individual build → collaborative map → debrief.",
      "Paper constraint cards  ·  iterated rules and number of cards across three rounds before locking the mechanic.",
    ],
    images: [
      { src: "/a3/s11-silent-builders.jpg" },
      { src: "/a3/s11-flow.png" },
    ],
    layout: "text-image",
  },

  {
    id: 12,
    eyebrow: "06 · LOOK & FEEL",
    title: "Visual Direction · Dark + LEGO Bold",
    bullets: [
      "Palette  ·  Near Black · Card Dark · LEGO Yellow · Signal Red · District Blue · Signal Green.",
      "Typography  ·  Black Han Sans / Arial Black for headlines; Nunito / Calibri for body.",
      "Inspiration  ·  Game UI and city-building genre, not childish toy aesthetics.",
      "Reasoning  ·  Dark visual mirrors serious play. Workshop tool for adults; playful but purposeful.",
    ],
    images: [
      { src: "/a3/s12-moodboard.jpg" },
      { src: "/a3/s12-gemini-1.png" },
    ],
    layout: "text-image",
  },

  {
    id: 13,
    eyebrow: "06 · LOOK & FEEL",
    title: "Map Visual Direction · 12 Worlds in 3 States",
    bullets: [
      "Four scenarios × three states  ·  Rising Tides, Deep Space, Ocean Depths, Rainforest, each shown intact / damaged / rebuilt.",
      "Generated with Gemini  ·  iterated prompts and reference images until each set read as the same world in three lives.",
      "Hardest call: damaged-but-not-abandoned.  ·  Too destroyed and the world feels lost; too tidy and the crisis loses weight.",
      "These twelve images became the visual backbone for every playtest from 20 Apr onwards.",
    ],
    images: [
      { src: "/maps/rising-tides-intact.png" },
      { src: "/maps/rising-tides-damaged.png" },
      { src: "/maps/rising-tides-rebuilt.png" },
      { src: "/maps/deep-space-intact.png" },
      { src: "/maps/ocean-depths-intact.png" },
      { src: "/maps/rainforest-intact.png" },
    ],
    layout: "image-grid",
  },

  {
    id: 14,
    eyebrow: "07 · ITERATIONS",
    title: "A2 → A3  ·  The Architecture Pivot",
    bullets: [
      "BEFORE (A2)  ·  Facilitator assigns cards → individual build → collaborative map → debrief → reveal. Linear, single-session.",
      "AFTER (A3)  ·  Pair Build → Guess → Chapter 1 placement → Chapter 2 crisis → Chapter 3 hidden-pattern recovery → final Vote.",
      "Why  ·  A2 jury asked for clearer activity structure and storyboard; client review (10 Apr) asked for layered gameplay and embedded reflection.",
      "Story Map screen consolidates three older screens (build, city map, debrief) into one shell that hosts all three chapters.",
    ],
    images: [
      { src: "/a3/s14-pair-build.png" },
      { src: "/a3/s14-guess.png" },
      { src: "/a3/s14-storymap.png" },
      { src: "/a3/s14-vote.png" },
    ],
    layout: "image-grid",
    notes: "This is the headline shift since A2. The deck pivots here.",
  },

  {
    id: 15,
    eyebrow: "07 · ROLE ABILITIES",
    title: "Crisis Chapter · Asymmetry by Design",
    bullets: [
      "Scout  ·  previews the next crisis card. Chooses between showing the team or warning one targeted teammate. Transparency vs. protection trade-off.",
      "Engineer  ·  shields part of the map before the crisis, then picks which damaged district rebuilds first. The move that made Engineer structurally essential, not just protective.",
      "Anchor  ·  makes one teammate immune to the incoming crisis. Spent and gone.",
      "Mender  ·  heals a teammate's district after the crisis lands.",
      "Diplomat  ·  the team is muted by the crisis. 15-second window to tap each teammate and bring their voice back, while the crisis re-mutes every 2s.",
      "Citizen  ·  votes on what happens at the end of the chapter.",
    ],
    images: [
      { src: "/a3/s15-role-1.png" },
      { src: "/a3/s15-role-3.png" },
      { src: "/a3/s17-diplomat-mini.png" },
    ],
    layout: "text-image",
    notes: "The asymmetry is the point. Each player's experience of the same crisis is different; only some of them have the information they need to act.",
  },

  {
    id: 16,
    eyebrow: "07 · CRISIS & RECOVERY",
    title: "Crisis Cards · Hidden-Pattern Recovery",
    bullets: [
      "Crisis cards  ·  defined target districts, damage states (damaged or destroyed), and an upper limit on how many can be active at once so the chapter never spirals beyond recovery.",
      "Chapter 3 recovery  ·  the team has a hidden geometric shape to recreate by placing rebuilt districts. No individual player sees the whole shape; each only sees their own slot.",
      "The shape becomes visible to the group only when enough districts are placed for the pattern to be unmistakable.",
      "Generous 18% placement tolerance  ·  close-enough placements still count, so the recovery feels collaborative, not punishing.",
    ],
    images: [
      { src: "/a3/s16-crisis.png" },
      { src: "/a3/s16-hidden.png" },
    ],
    layout: "text-image",
  },

  {
    id: 17,
    eyebrow: "07 · ITERATIONS & FINAL TESTING",
    title: "What Changed Between Playtests",
    bullets: [
      "Force-upload fallback  ·  if the timer expires before a photo lands, players can still submit. Stops half-built sessions.",
      "Timing eased across phases  ·  30s Pair Build was too tight; extended across multiple stages to reduce pressure.",
      "Map completion logic fixed  ·  correct placements now register reliably, no false-negative stalls.",
      "Dead end · Pathfinder retired.  ·  Replaced by Mender. Mender carries a clearer purpose: triggered ability for the crisis, repair-connection ability for the recovery.",
      "Dead end · Camera shape-prompt removed.  ·  Felt restrictive in 24 Mar playtest; gone by 25 Mar build.",
      "Carry-forward · Simplify language.  ·  25 Apr evening playtest showed dense world-building copy was the bottleneck, not the mechanics.",
    ],
    images: [
      { src: "/a3/s17-iter-1.png" },
      { src: "/a3/s17-playtest.png" },
    ],
    layout: "text-image",
    notes: "This slide carries the 'Failures / Dead Ends' load that the rubric asks for.",
  },

  {
    id: 18,
    eyebrow: "08 · CLIENT INTERACTION",
    title: "Client Review · 10 April 2026",
    bullets: [
      "Accepted  ·  Layered gameplay and deeper interaction. Drove the move to crisis-and-recovery chapters.",
      "Reinterpreted  ·  'Measure long-term impact' translated into reflection embedded inside gameplay (role abilities, asymmetric crisis), not a post-session survey employees skip.",
      "Rejected  ·  Adding a separate evaluative dashboard at this stage; observation lives inside the facilitator screen instead.",
      "Also acted on from A2 jury (30 Mar)  ·  expanded primary engagement; tightened the link between research insight and design decision; built a representative storyboard via the Story Map.",
    ],
    layout: "text",
    notes: "Be specific about accept/reject/reinterpret. The rubric explicitly asks for this framing.",
  },

  {
    id: 19,
    eyebrow: "09 · FINAL ARTEFACT",
    title: "The System in Use",
    bullets: [
      "Digital  ·  facilitator dashboard, role reveal, Pair Build, Story Map across three chapters, Diplomat unmute mini-game, Chapter 3 hidden-pattern recovery.",
      "Physical  ·  branded LEGO kit box. Cardboard box measured face-by-face, branding printed on adhesive sheets sized to each face, applied flush.",
      "Live deployment  ·  Vercel + Convex; players join via link or code; runs on phones.",
    ],
    images: [
      { src: "/a3/s19-final-1.png" },
      { src: "/a3/s19-final-3.png" },
      { src: "/a3/s19-kit-1.png" },
      { src: "/a3/s19-kit-2.png" },
      { src: "/a3/s19-playtest-action-1.png" },
      { src: "/a3/s19-playtest-action-2.png" },
    ],
    layout: "image-grid",
  },

  {
    id: 20,
    eyebrow: "10 · TG · PLACEMENT · SCALE",
    title: "Where the Artefact Lives",
    bullets: [
      "Audience  ·  Corporate teams of 3-10 players. Facilitator-led. 45-60 minute workshop format.",
      "Placement  ·  Web app, join via link or code. Runs on phones; no install. Facilitator runs the session from a laptop or tablet.",
      "Cost  ·  LEGO kit is a one-time per facilitator. Hosting (Vercel + Convex) is effectively free at corporate-workshop volumes; AI vision check (Claude Haiku 4.5) is metered and runs only on photo upload.",
      "Scale  ·  Four scenarios shipped; architecture supports adding scenarios without changing the chapter framework. Future: cross-session scenario unlocks and evolving constraints.",
    ],
    images: [{ src: "/a3/s20-playtest-team.png" }],
    layout: "text-image",
  },
];
