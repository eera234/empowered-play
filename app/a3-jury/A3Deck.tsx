"use client";

import { useCallback, useEffect, useState } from "react";
import { SLIDES, type Slide, type SlideImage } from "./slides";
import { exportPptx } from "./exportPptx";

export default function A3Deck() {
  const [idx, setIdx] = useState(0);
  const [exporting, setExporting] = useState(false);

  const go = useCallback((delta: number) => {
    setIdx((i) => Math.max(0, Math.min(SLIDES.length - 1, i + delta)));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setIdx(0);
      } else if (e.key === "End") {
        setIdx(SLIDES.length - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  const onDownload = async () => {
    setExporting(true);
    try {
      await exportPptx(SLIDES);
    } catch (err) {
      console.error(err);
      alert("PPTX export failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  const slide = SLIDES[idx];

  return (
    <div className="a3deck-root">
      <header className="a3-toolbar">
        <div className="a3-tb-left">
          <span className="a3-brand">Empowered Play · A3 Jury</span>
          <span className="a3-counter">
            {String(idx + 1).padStart(2, "0")} / {SLIDES.length}
          </span>
        </div>
        <div className="a3-tb-mid">
          <button className="a3-btn" onClick={() => go(-1)} disabled={idx === 0} aria-label="previous slide">
            ←
          </button>
          <button
            className="a3-btn"
            onClick={() => go(1)}
            disabled={idx === SLIDES.length - 1}
            aria-label="next slide"
          >
            →
          </button>
        </div>
        <div className="a3-tb-right">
          <button className="a3-download" onClick={onDownload} disabled={exporting}>
            {exporting ? "Building .pptx…" : "Download as PPTX"}
          </button>
        </div>
      </header>

      <main className="a3-stage">
        <div className="a3-slide" key={slide.id}>
          <SlideBody slide={slide} />
          <span className="a3-page-num">{String(slide.id).padStart(2, "0")}</span>
        </div>
      </main>

      <footer className="a3-thumbs">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            className={"a3-thumb" + (i === idx ? " a3-thumb-active" : "")}
            onClick={() => setIdx(i)}
            aria-label={`go to slide ${s.id}`}
            title={s.title}
          >
            {String(s.id).padStart(2, "0")}
          </button>
        ))}
      </footer>

      <style>{deckCss}</style>
    </div>
  );
}

function SlideBody({ slide }: { slide: Slide }) {
  if (slide.layout === "title") {
    return (
      <div className="lay-title">
        {slide.images?.[0] && (
          <div className="lay-title-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.images[0].src} alt="" />
          </div>
        )}
        <div className="lay-title-content">
          <span className="eyebrow">{slide.eyebrow}</span>
          <h1>{slide.title}</h1>
          {slide.subtitle && <p className="subtitle">{slide.subtitle}</p>}
          {slide.bullets && (
            <ul className="title-meta">
              {slide.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`lay lay-${slide.layout}`}>
      <header className="lay-head">
        <span className="eyebrow">{slide.eyebrow}</span>
        <h2>{slide.title}</h2>
        {slide.subtitle && <p className="subtitle">{slide.subtitle}</p>}
      </header>

      <div className="lay-body">
        {slide.layout === "text" && slide.bullets && <BulletList bullets={slide.bullets} large />}

        {slide.layout === "text-image" && (
          <>
            {slide.bullets && (
              <div className="lay-text-col">
                <BulletList bullets={slide.bullets} />
              </div>
            )}
            {slide.images && slide.images.length > 0 && (
              <div className="lay-image-col">
                <ImageStack images={slide.images} />
              </div>
            )}
          </>
        )}

        {slide.layout === "image-text" && (
          <>
            {slide.images && slide.images.length > 0 && (
              <div className="lay-image-col">
                <ImageStack images={slide.images} />
              </div>
            )}
            {slide.bullets && (
              <div className="lay-text-col">
                <BulletList bullets={slide.bullets} />
              </div>
            )}
          </>
        )}

        {slide.layout === "image-grid" && (
          <>
            {slide.bullets && (
              <div className="lay-grid-text">
                <BulletList bullets={slide.bullets} />
              </div>
            )}
            {slide.images && (
              <div className={`lay-grid-images grid-${slide.images.length}`}>
                {slide.images.map((img, i) => (
                  <div className="lay-grid-cell" key={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.caption || ""} />
                    {img.caption && <span className="img-cap">{img.caption}</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {slide.layout === "split-3" && slide.bullets && (
          <div className="lay-split-3">
            {slide.bullets.slice(0, 3).map((b, i) => (
              <div className="split-col" key={i}>
                <p>{b}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BulletList({ bullets, large = false }: { bullets: string[]; large?: boolean }) {
  return (
    <ul className={`bullets${large ? " bullets-lg" : ""}`}>
      {bullets.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

function ImageStack({ images }: { images: SlideImage[] }) {
  if (images.length === 1) {
    return (
      <div className="img-single">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0].src} alt={images[0].caption || ""} />
      </div>
    );
  }
  return (
    <div className={`img-stack stack-${Math.min(images.length, 4)}`}>
      {images.slice(0, 4).map((img, i) => (
        <div className="stack-cell" key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src} alt={img.caption || ""} />
        </div>
      ))}
    </div>
  );
}

const deckCss = `
.a3deck-root{
  --slide-w: 1280px;
  --slide-h: 720px;
  --bg: #06061a;
  --bg2: #0f0f2a;
  --ink: #ffffff;
  --inkd: rgba(255,255,255,.62);
  --inkdd: rgba(255,255,255,.32);
  --acc: #FFD700;
  --acc-red: #E3000B;
  position: fixed; inset: 0;
  display: grid;
  grid-template-rows: 56px 1fr 64px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Nunito', system-ui, sans-serif;
  overflow: hidden;
}
.a3-toolbar{
  display:flex; align-items:center; justify-content:space-between;
  padding: 0 18px;
  background: #0a0a22;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.a3-tb-left, .a3-tb-mid, .a3-tb-right{ display:flex; align-items:center; gap:14px; }
.a3-brand{ font-family:'Black Han Sans', sans-serif; letter-spacing:2px; font-size:13px; color:var(--inkd); }
.a3-counter{ font-family:'Black Han Sans', sans-serif; font-size:13px; color:var(--acc); letter-spacing:2px; }
.a3-btn{
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.18);
  color: var(--ink); width:36px; height:32px; border-radius:6px; cursor:pointer;
  font-size:16px; font-weight:800;
}
.a3-btn:hover:not(:disabled){ background: rgba(255,255,255,.12); }
.a3-btn:disabled{ opacity:.3; cursor:not-allowed; }
.a3-download{
  background: var(--acc); color:#0a0a12;
  font-family:'Black Han Sans', sans-serif; letter-spacing:1.5px;
  border:none; padding:9px 18px; border-radius:6px; cursor:pointer;
  font-size:13px; box-shadow: 0 3px 0 rgba(0,0,0,.4);
}
.a3-download:hover:not(:disabled){ filter: brightness(1.05); }
.a3-download:disabled{ opacity:.5; cursor:not-allowed; }

.a3-stage{
  display:grid; place-items:center;
  padding: 24px;
  overflow: hidden;
  position: relative;
}
.a3-slide{
  width: var(--slide-w);
  height: var(--slide-h);
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 56px - 64px - 48px);
  aspect-ratio: 16/9;
  background: linear-gradient(180deg, #08081e 0%, #0c0c28 100%);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  box-shadow: 0 24px 60px rgba(0,0,0,.55);
  position:relative;
  overflow:hidden;
  container-type: inline-size;
}
.a3-page-num{
  position:absolute; right:18px; bottom:14px;
  font-family:'Black Han Sans', sans-serif; letter-spacing:2px;
  font-size:11px; color: rgba(255,255,255,.18);
}

.a3-thumbs{
  display:flex; align-items:center; gap:4px; padding: 12px 18px;
  background: #0a0a22; border-top: 1px solid rgba(255,255,255,.08);
  overflow-x:auto;
}
.a3-thumb{
  flex: 0 0 auto;
  background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
  color: var(--inkdd); font-family:'Black Han Sans', sans-serif; letter-spacing:1px;
  font-size:11px; padding:6px 10px; border-radius:4px; cursor:pointer;
  min-width: 38px;
}
.a3-thumb:hover{ color: var(--inkd); border-color: rgba(255,255,255,.25); }
.a3-thumb-active{ color:#0a0a12; background: var(--acc); border-color: var(--acc); }

/* ──────────── slide layouts ──────────── */
.lay, .lay-title{ width:100%; height:100%; padding: 56px 64px; display:flex; flex-direction:column; }

.eyebrow{
  font-family:'Black Han Sans', sans-serif; letter-spacing:3px;
  font-size: 13px; color: var(--acc-red);
  text-transform: uppercase;
}
h1, h2 { font-family:'Black Han Sans', sans-serif; line-height:1.05; letter-spacing:1px; color: var(--ink); margin-top:6px; }
h1 { font-size: clamp(36px, 6cqw, 72px); }
h2 { font-size: clamp(28px, 4.4cqw, 48px); }
.subtitle{ color: var(--inkd); font-size: clamp(15px, 1.6cqw, 20px); font-weight:700; margin-top:6px; max-width:90%; }

.lay-head{ flex: 0 0 auto; margin-bottom: 22px; }

.lay-body{ flex:1; min-height:0; display:flex; gap:36px; align-items:stretch; }

.bullets{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px; }
.bullets li{
  font-size: clamp(13px, 1.45cqw, 18px); line-height:1.45; color: var(--ink);
  padding-left: 18px; position:relative; font-weight:600;
}
.bullets li::before{
  content:''; position:absolute; left:0; top: .55em;
  width: 8px; height: 8px; background: var(--acc); border-radius: 1px;
}
.bullets-lg li{ font-size: clamp(15px, 1.65cqw, 22px); }

.lay-text-col{ flex: 1.1; display:flex; align-items:flex-start; }
.lay-image-col{ flex: 1; display:flex; align-items:center; justify-content:center; }

.img-single{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.img-single img{ max-width:100%; max-height:100%; object-fit:contain; border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,.4); }

.img-stack{ width:100%; height:100%; display:grid; gap:10px; }
.img-stack.stack-2{ grid-template-rows: 1fr 1fr; }
.img-stack.stack-3{ grid-template-rows: 1fr 1fr 1fr; }
.img-stack.stack-4{ grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.stack-cell{ position:relative; overflow:hidden; border-radius:6px; background:#000; }
.stack-cell img{ width:100%; height:100%; object-fit:cover; display:block; }

.lay-grid-text{ flex: 0 0 38%; }
.lay-grid-images{ flex: 1; display:grid; gap:10px; }
.lay-grid-images.grid-2{ grid-template-columns: 1fr 1fr; }
.lay-grid-images.grid-3{ grid-template-columns: 1fr 1fr 1fr; }
.lay-grid-images.grid-4{ grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.lay-grid-images.grid-5,
.lay-grid-images.grid-6{ grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; }
.lay-grid-cell{ position:relative; overflow:hidden; border-radius:6px; background:#000; }
.lay-grid-cell img{ width:100%; height:100%; object-fit:cover; display:block; }
.img-cap{
  position:absolute; left:8px; bottom:8px; right:8px;
  font-size:10px; color:#fff; background: rgba(0,0,0,.5);
  padding: 3px 6px; border-radius: 3px; font-weight:700;
}

/* slide 13 has a 6-image map grid — wider grid */
.lay-image-grid > .lay-grid-images.grid-6{ grid-template-columns: repeat(3, 1fr); }

.lay-split-3{ flex:1; display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
.split-col{
  background: rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:8px; padding: 22px;
  font-size: clamp(13px, 1.4cqw, 17px); line-height:1.5; font-weight:600;
}

/* title slide */
.lay-title{ position:relative; padding:0; }
.lay-title-bg{
  position:absolute; inset:0; opacity: .22; pointer-events:none;
}
.lay-title-bg img{ width:100%; height:100%; object-fit:cover; filter: blur(2px) saturate(.8); }
.lay-title-bg::after{
  content:''; position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(6,6,26,.65) 0%, rgba(6,6,26,.92) 100%);
}
.lay-title-content{
  position:absolute; inset:0; padding: 80px 96px;
  display:flex; flex-direction:column; justify-content:center; gap:14px;
}
.lay-title-content .eyebrow{ color: var(--acc); }
.lay-title-content h1{ font-size: clamp(44px, 7.5cqw, 96px); }
.title-meta{ list-style:none; margin: 24px 0 0; padding:0; display:flex; flex-direction:column; gap:6px; }
.title-meta li{ font-size: clamp(13px, 1.4cqw, 18px); color: var(--inkd); font-weight:700; }
`;
