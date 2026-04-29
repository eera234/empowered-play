"use client";

export default function FacilitatorManualPage() {
  return (
    <div className="manual-page">
      <article className="manual-doc">
        {/* ─────────── PAGE 1 ─────────── */}
        <section className="manual-sheet">
          <header className="manual-masthead">
            <div className="manual-eyebrow">Empowered Play</div>
            <h1 className="manual-title">Facilitator Manual</h1>
            <p className="manual-subtitle">
              Everything you need to host a session, from the kit arriving
              at your players&apos; doors to the last question of the
              debrief. Read it once before your first session; keep it
              beside you while you run.
            </p>
            <div className="manual-stamp">Version 1.0 &middot; Two-page edition</div>
          </header>

          <section className="manual-block">
            <h2><span className="num">01</span>What this is</h2>
            <p>
              A hybrid team-building game for groups of three to seven
              adults. Each player gets a small LEGO kit. They join a web
              app on their phones, you join as facilitator on your laptop,
              and over forty-five minutes the team builds, photographs,
              decides, and reflects together. Your job is to host. The app
              teaches the rules; you set the pace and read the room.
            </p>
          </section>

          <section className="manual-block">
            <h2><span className="num">02</span>What ships, what you need</h2>
            <p>
              Each player gets a branded box: a baseplate, around thirty
              mixed bricks, and a printed welcome card. They keep it. You
              don&apos;t get a kit; you don&apos;t build during the
              session.
            </p>
            <ul>
              <li>
                <strong>Players need:</strong> phone with working camera,
                stable internet, your session link, decent light.
              </li>
              <li>
                <strong>You need:</strong> laptop with modern browser, the
                same link, a notebook, water, a clock you can see without
                your phone.
              </li>
            </ul>
          </section>

          <section className="manual-block">
            <h2><span className="num">03</span>Two days before</h2>
            <ul>
              <li>
                Confirm headcount; the game runs three to seven players.
              </li>
              <li>
                Ship kits so they arrive the day before, not the morning
                of.
              </li>
              <li>
                Send a one-line preview: a 45-minute team game, kit in the
                post, no prep needed, phone charged.
              </li>
              <li>
                Block thirty minutes after for the debrief. No meeting
                straight after; the room needs to breathe.
              </li>
            </ul>
          </section>

          <section className="manual-block">
            <h2><span className="num">04</span>Thirty minutes before</h2>
            <ul>
              <li>
                Open the app on your laptop, click <strong>Facilitator</strong>,
                verify the empty lobby loads.
              </li>
              <li>
                Close other tabs. Mute notifications. The app is real-time
                and a calendar ping will pull you out.
              </li>
              <li>
                Water in reach, notebook open, clock visible. The app
                times the players; you time yourself.
              </li>
            </ul>
          </section>

          <section className="manual-block">
            <h2><span className="num">05</span>Assigning roles</h2>
            <p>
              After the team votes on a scenario, you&apos;ll see a grid
              of role cards. Tap <strong>View details</strong> on any card
              for the assignment cue, then assign before you commit.
            </p>
            <div className="manual-callout">
              <strong>The most important sentence in this manual</strong>
              Assign each role to the player most likely to be quiet by
              default, not the loudest. Each role gives its holder a
              structurally essential job. Powerful roles to loud people
              replicates the room&apos;s hierarchy. Powerful roles to
              quieter people bends it.
            </div>
          </section>

          <div className="manual-pagefoot">
            <span>Empowered Play</span>
            <span>Facilitator Manual</span>
            <span>1 / 2</span>
          </div>
        </section>

        <div className="manual-page-break" />

        {/* ─────────── PAGE 2 ─────────── */}
        <section className="manual-sheet">
          <section className="manual-block">
            <h2><span className="num">06</span>Pacing &amp; tone</h2>
            <p>
              The session moves through three chapters and a debrief.
              You only advance at four points: kicking off, dealing each
              of the two crisis moments, and starting the debrief. Each
              is a button on your screen with clear copy. Don&apos;t rush.
              A team that talked through a problem without finishing on
              time is in better shape than a team that finished on time
              without talking. Use force-advance only when a player has
              gone unresponsive.
            </p>
            <p>
              Coach, don&apos;t direct. If a player asks &ldquo;what do I
              do?&rdquo; answer with a question that sends them back to
              their screen. If they ask permission, turn it back: &ldquo;you
              tell me.&rdquo; Players will look to you for hierarchy out
              of habit; your job is to refuse to be it. When the team goes
              quiet, don&apos;t fill it. Wait. Silence is data.
            </p>
          </section>

          <section className="manual-block">
            <h2><span className="num">07</span>What to watch for</h2>
            <ul>
              <li>Who narrates their build out loud, and who builds silently.</li>
              <li>Who asks for help, and who waits to be asked.</li>
              <li>
                How the team reacts when something they built together is
                taken away mid-game.
              </li>
              <li>
                Who steps into a leadership move under time pressure, and
                whether it&apos;s the same person each time.
              </li>
              <li>
                Who goes quiet after their role does its job, and who
                keeps engaging.
              </li>
            </ul>
            <p>
              Specific names, specific moments, specific decisions. Not
              labels.
            </p>
          </section>

          <section className="manual-block">
            <h2><span className="num">08</span>The debrief</h2>
            <p>
              Plan ten to fifteen minutes. Ask a few open questions and
              get out of the way. Hold each silence for ten seconds before
              you move on.
            </p>
            <ul>
              <li>&ldquo;Who surprised you in there?&rdquo;</li>
              <li>&ldquo;What was the hardest call you had to make?&rdquo;</li>
              <li>
                &ldquo;What did your role push you to do that you wouldn&apos;t
                normally do?&rdquo;
              </li>
              <li>
                &ldquo;Was there a moment the team got something right, or
                got it wrong?&rdquo;
              </li>
            </ul>
          </section>

          <section className="manual-block">
            <h2><span className="num">09</span>Quick reference</h2>
            <table className="manual-table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>What to do</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Player can&apos;t join</td>
                  <td>Re-send link. Confirm phone, not desktop.</td>
                </tr>
                <tr>
                  <td>Camera denied</td>
                  <td>Refresh and re-allow camera access.</td>
                </tr>
                <tr>
                  <td>Photo keeps rejecting</td>
                  <td>Brighten the room, frame squarely, retake.</td>
                </tr>
                <tr>
                  <td>Player silent for a chapter</td>
                  <td>DM privately. If no response, mark absent.</td>
                </tr>
                <tr>
                  <td>Phase taking too long</td>
                  <td>Use force-advance, sparingly.</td>
                </tr>
                <tr>
                  <td>Tied scenario vote</td>
                  <td>App prompts you. Pick whichever you&apos;re drawn to.</td>
                </tr>
                <tr>
                  <td>Player drops connection</td>
                  <td>Progress saved. They rejoin where they left off.</td>
                </tr>
                <tr>
                  <td>Whole session glitching</td>
                  <td>Everyone refresh. Session resumes from server state.</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="manual-pagefoot">
            <span>Empowered Play</span>
            <span>Facilitator Manual</span>
            <span>2 / 2</span>
          </div>
        </section>
      </article>
    </div>
  );
}
