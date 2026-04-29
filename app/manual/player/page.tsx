"use client";

import { LEGO_KIT, LEGO_KIT_TOTAL } from "../../../lib/constants";

export default function PlayerManualPage() {
  return (
    <div className="manual-page">
      <article className="manual-doc">
        {/* ─────────── PAGE 1 ─────────── */}
        <section className="manual-sheet">
          <header className="manual-masthead">
            <div className="manual-eyebrow">Empowered Play</div>
            <h1 className="manual-title">Player Welcome</h1>
            <p className="manual-subtitle">
              A short guide that ships inside your kit box. It covers
              what&apos;s in the box, what you&apos;ll need on your end, and
              how the session begins. The game itself takes care of the rest.
            </p>
            <div className="manual-stamp">Print-ready &middot; Two-page edition</div>
          </header>

          <div className="manual-cols manual-cols--player">
            <div className="manual-col">
              <section className="manual-block">
                <h2><span className="num">01</span>What this is</h2>
                <p>
                  Empowered Play is a hybrid team game. Half of it lives on
                  your phone; the other half lives on your table. You build
                  small things with the LEGO bricks in your box and play
                  alongside the rest of your team through the web app. The
                  two halves talk to each other through your camera.
                </p>
                <p>
                  The session takes around forty-five minutes and is led by
                  your facilitator. You don&apos;t need to prepare anything
                  in advance.
                </p>
              </section>

              <section className="manual-block">
                <h2><span className="num">02</span>What you need</h2>
                <ul>
                  <li>A phone with a working camera (front or back).</li>
                  <li>
                    The session link from your facilitator, opened on the
                    phone, not a laptop.
                  </li>
                  <li>A flat surface for your kit and a small build.</li>
                  <li>
                    Decent light. Dim rooms make photos harder to verify.
                  </li>
                </ul>
              </section>

              <section className="manual-block">
                <h2><span className="num">03</span>About the camera</h2>
                <p>
                  The app asks for camera permission once or twice; allow
                  it. You can&apos;t upload from your gallery. Live photos
                  only. What you build today is what&apos;s in the game
                  today.
                </p>
                <div className="manual-callout">
                  <strong>If a photo gets rejected</strong>
                  Almost always lighting or framing. Brighten the room,
                  move closer, hold steady, retake. Retakes are free.
                </div>
              </section>
            </div>

            <aside className="manual-col">
              <div className="manual-card">
                <div className="manual-card__title">In your box</div>
                <div className="manual-card__total">
                  {LEGO_KIT_TOTAL}
                  <small>pieces</small>
                </div>
                <div className="manual-kit">
                  {LEGO_KIT.map((p) => (
                    <div key={p.piece} className="manual-kit__row">
                      <span className="manual-kit__qty">{p.qty}&times;</span>
                      <span>
                        <span className="manual-kit__name">{p.piece}</span>
                        <span className="manual-kit__color">{p.color}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="manual-pagefoot">
            <span>Empowered Play</span>
            <span>Player Welcome</span>
            <span>1 / 2</span>
          </div>
        </section>

        <div className="manual-page-break" />

        {/* ─────────── PAGE 2 ─────────── */}
        <section className="manual-sheet">
          <section className="manual-block">
            <h2><span className="num">04</span>On the day</h2>
            <ul>
              <li>
                Tip your kit out onto a flat surface near a light source.
              </li>
              <li>
                Open the session link on your phone, type your name, wait
                in the lobby. The facilitator starts when the team is
                ready.
              </li>
              <li>
                Allow camera access when the app asks. Follow the prompt
                on your screen.
              </li>
              <li>
                If something stops working, refresh the page. Your
                progress is saved on the server.
              </li>
            </ul>
          </section>

          <section className="manual-block">
            <h2><span className="num">05</span>Ground rules</h2>
            <ul>
              <li>
                Don&apos;t peek at other players&apos; screens. Some of
                what you see is meant just for you.
              </li>
              <li>
                Follow the prompt on your screen. If it asks you to wait,
                wait. If it asks you to build, build.
              </li>
              <li>
                Roughly an hour with no interruptions. Headphones if
                you&apos;re not in a private room.
              </li>
              <li>If something is genuinely broken, tell the facilitator.</li>
            </ul>
          </section>

          <section className="manual-block">
            <h2><span className="num">06</span>That&apos;s it</h2>
            <p>
              The game tells you the rest as it goes. Show up, play
              honestly, and have fun.
            </p>
          </section>

          <div className="manual-pagefoot">
            <span>Empowered Play</span>
            <span>Ships inside each kit box</span>
            <span>2 / 2</span>
          </div>
        </section>
      </article>
    </div>
  );
}
