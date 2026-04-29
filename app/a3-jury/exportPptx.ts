import type PptxGenJSType from "pptxgenjs";
import type { Slide, SlideImage } from "./slides";

type PSlide = ReturnType<PptxGenJSType["addSlide"]>;

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const COLORS = {
  bg: "06061A",
  bg2: "0C0C28",
  ink: "FFFFFF",
  inkd: "B8B8C8",
  inkdd: "6B6B82",
  acc: "FFD700",
  accRed: "E3000B",
};

const FONT_HEAD = "Arial Black";
const FONT_BODY = "Calibri";

type FetchedImage = { dataUrl: string; w: number; h: number };

async function fetchImage(src: string): Promise<FetchedImage | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 16, h: 9 });
      img.src = dataUrl;
    });
    return { dataUrl, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

function fitInto(box: { w: number; h: number }, img: { w: number; h: number }) {
  const r = Math.min(box.w / img.w, box.h / img.h);
  const w = img.w * r;
  const h = img.h * r;
  return { w, h, x: (box.w - w) / 2, y: (box.h - h) / 2 };
}

function coverInto(box: { w: number; h: number }, _img: { w: number; h: number }) {
  return { w: box.w, h: box.h, x: 0, y: 0 };
}

export async function exportPptx(slides: Slide[]) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "Empowered Play · A3 Jury · Eera Dubey";
  pptx.author = "Eera Dubey";

  const allImages = Array.from(
    new Set(slides.flatMap((s) => (s.images ?? []).map((i) => i.src))),
  );
  const imageCache = new Map<string, FetchedImage>();
  await Promise.all(
    allImages.map(async (src) => {
      const fetched = await fetchImage(src);
      if (fetched) imageCache.set(src, fetched);
    }),
  );

  for (const slide of slides) {
    const ps = pptx.addSlide();
    ps.background = { color: COLORS.bg };

    if (slide.layout === "title") {
      renderTitle(ps, slide, imageCache);
    } else {
      renderHeader(ps, slide);
      switch (slide.layout) {
        case "text":
          renderBodyText(ps, slide);
          break;
        case "text-image":
          renderBodyTextImage(ps, slide, imageCache);
          break;
        case "image-text":
          renderBodyImageText(ps, slide, imageCache);
          break;
        case "image-grid":
          renderBodyImageGrid(ps, slide, imageCache);
          break;
        case "split-3":
          renderBodySplit3(ps, slide);
          break;
      }
    }

    if (slide.notes) ps.addNotes(slide.notes);

    ps.addText(String(slide.id).padStart(2, "0"), {
      x: SLIDE_W - 0.7,
      y: SLIDE_H - 0.4,
      w: 0.5,
      h: 0.25,
      fontFace: FONT_HEAD,
      fontSize: 9,
      color: COLORS.inkdd,
      align: "right",
      charSpacing: 2,
    });
  }

  await pptx.writeFile({ fileName: "EeraDubey_A3.pptx" });
}

function renderTitle(ps: PSlide, slide: Slide, cache: Map<string, FetchedImage>) {
  const bgImg = slide.images?.[0];
  if (bgImg) {
    const fetched = cache.get(bgImg.src);
    if (fetched) {
      const { w, h, x, y } = coverInto({ w: SLIDE_W, h: SLIDE_H }, fetched);
      ps.addImage({ data: fetched.dataUrl, x, y, w, h, transparency: 78 });
    }
  }
  ps.addShape("rect", {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: COLORS.bg, transparency: 25 },
    line: { color: COLORS.bg, transparency: 100 },
  });

  const padX = 1.0;
  const padY = 1.0;

  ps.addText(slide.eyebrow, {
    x: padX,
    y: padY,
    w: SLIDE_W - padX * 2,
    h: 0.4,
    fontFace: FONT_HEAD,
    fontSize: 13,
    color: COLORS.acc,
    bold: true,
    charSpacing: 4,
  });

  ps.addText(slide.title, {
    x: padX,
    y: padY + 0.5,
    w: SLIDE_W - padX * 2,
    h: 1.6,
    fontFace: FONT_HEAD,
    fontSize: 64,
    color: COLORS.ink,
    bold: true,
    valign: "top",
  });

  if (slide.subtitle) {
    ps.addText(slide.subtitle, {
      x: padX,
      y: padY + 2.2,
      w: SLIDE_W - padX * 2,
      h: 0.6,
      fontFace: FONT_BODY,
      fontSize: 22,
      color: COLORS.inkd,
      bold: false,
    });
  }

  if (slide.bullets) {
    const lines = slide.bullets.map((b) => ({ text: b, options: { breakLine: true } }));
    ps.addText(lines, {
      x: padX,
      y: padY + 3.2,
      w: SLIDE_W - padX * 2,
      h: 2.8,
      fontFace: FONT_BODY,
      fontSize: 16,
      color: COLORS.inkd,
      bold: true,
      paraSpaceAfter: 4,
    });
  }
}

function renderHeader(ps: PSlide, slide: Slide) {
  const padX = 0.6;
  ps.addText(slide.eyebrow, {
    x: padX,
    y: 0.5,
    w: SLIDE_W - padX * 2,
    h: 0.3,
    fontFace: FONT_HEAD,
    fontSize: 11,
    color: COLORS.accRed,
    bold: true,
    charSpacing: 4,
  });
  ps.addText(slide.title, {
    x: padX,
    y: 0.85,
    w: SLIDE_W - padX * 2,
    h: 0.85,
    fontFace: FONT_HEAD,
    fontSize: 32,
    color: COLORS.ink,
    bold: true,
    valign: "top",
  });
  if (slide.subtitle) {
    ps.addText(slide.subtitle, {
      x: padX,
      y: 1.7,
      w: SLIDE_W - padX * 2,
      h: 0.4,
      fontFace: FONT_BODY,
      fontSize: 16,
      color: COLORS.inkd,
      bold: false,
    });
  }
}

function bodyBox(slide: Slide) {
  const padX = 0.6;
  const top = slide.subtitle ? 2.15 : 1.85;
  const h = SLIDE_H - top - 0.6;
  return { x: padX, y: top, w: SLIDE_W - padX * 2, h };
}

function bulletObjects(bullets: string[]) {
  return bullets.map((b) => ({
    text: b,
    options: { bullet: { code: "25A0" }, breakLine: true },
  }));
}

function renderBodyText(ps: PSlide, slide: Slide) {
  if (!slide.bullets) return;
  const box = bodyBox(slide);
  ps.addText(bulletObjects(slide.bullets), {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fontFace: FONT_BODY,
    fontSize: 17,
    color: COLORS.ink,
    bold: false,
    paraSpaceAfter: 8,
    valign: "top",
  });
}

function renderBodyTextImage(ps: PSlide, slide: Slide, cache: Map<string, FetchedImage>) {
  const box = bodyBox(slide);
  const gap = 0.4;
  const textW = box.w * 0.55;
  const imgX = box.x + textW + gap;
  const imgW = box.w - textW - gap;

  if (slide.bullets) {
    ps.addText(bulletObjects(slide.bullets), {
      x: box.x,
      y: box.y,
      w: textW,
      h: box.h,
      fontFace: FONT_BODY,
      fontSize: 14,
      color: COLORS.ink,
      paraSpaceAfter: 8,
      valign: "top",
    });
  }

  drawImagesInBox(ps, slide.images ?? [], cache, { x: imgX, y: box.y, w: imgW, h: box.h });
}

function renderBodyImageText(ps: PSlide, slide: Slide, cache: Map<string, FetchedImage>) {
  const box = bodyBox(slide);
  const gap = 0.4;
  const imgW = box.w * 0.45;
  const textX = box.x + imgW + gap;
  const textW = box.w - imgW - gap;

  drawImagesInBox(ps, slide.images ?? [], cache, { x: box.x, y: box.y, w: imgW, h: box.h });

  if (slide.bullets) {
    ps.addText(bulletObjects(slide.bullets), {
      x: textX,
      y: box.y,
      w: textW,
      h: box.h,
      fontFace: FONT_BODY,
      fontSize: 14,
      color: COLORS.ink,
      paraSpaceAfter: 8,
      valign: "top",
    });
  }
}

function renderBodyImageGrid(ps: PSlide, slide: Slide, cache: Map<string, FetchedImage>) {
  const box = bodyBox(slide);
  const gap = 0.3;
  const hasText = !!slide.bullets && slide.bullets.length > 0;
  const textW = hasText ? box.w * 0.36 : 0;
  const imgX = box.x + (hasText ? textW + gap : 0);
  const imgW = box.w - (hasText ? textW + gap : 0);

  if (hasText && slide.bullets) {
    ps.addText(bulletObjects(slide.bullets), {
      x: box.x,
      y: box.y,
      w: textW,
      h: box.h,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLORS.ink,
      paraSpaceAfter: 6,
      valign: "top",
    });
  }

  const imgs = slide.images ?? [];
  const n = imgs.length;
  if (n === 0) return;

  let cols = 2;
  let rows = 2;
  if (n === 1) { cols = 1; rows = 1; }
  else if (n === 2) { cols = 2; rows = 1; }
  else if (n === 3) { cols = 3; rows = 1; }
  else if (n === 4) { cols = 2; rows = 2; }
  else if (n <= 6) { cols = 3; rows = 2; }
  else { cols = 4; rows = Math.ceil(n / 4); }

  const cellW = (imgW - gap * (cols - 1)) / cols;
  const cellH = (box.h - gap * (rows - 1)) / rows;

  imgs.forEach((img, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = imgX + c * (cellW + gap);
    const cy = box.y + r * (cellH + gap);
    placeImage(ps, img, cache, { x: cx, y: cy, w: cellW, h: cellH }, "cover");
  });
}

function renderBodySplit3(ps: PSlide, slide: Slide) {
  if (!slide.bullets) return;
  const box = bodyBox(slide);
  const gap = 0.3;
  const colW = (box.w - gap * 2) / 3;
  slide.bullets.slice(0, 3).forEach((b, i) => {
    const cx = box.x + i * (colW + gap);
    ps.addShape("roundRect", {
      x: cx,
      y: box.y,
      w: colW,
      h: box.h,
      fill: { color: COLORS.bg2 },
      line: { color: COLORS.inkdd, width: 0.5 },
      rectRadius: 0.08,
    });
    ps.addText(b, {
      x: cx + 0.25,
      y: box.y + 0.25,
      w: colW - 0.5,
      h: box.h - 0.5,
      fontFace: FONT_BODY,
      fontSize: 14,
      color: COLORS.ink,
      paraSpaceAfter: 6,
      valign: "top",
    });
  });
}

function drawImagesInBox(
  ps: PSlide,
  images: SlideImage[],
  cache: Map<string, FetchedImage>,
  box: { x: number; y: number; w: number; h: number },
) {
  if (images.length === 0) return;
  if (images.length === 1) {
    placeImage(ps, images[0], cache, box, "fit");
    return;
  }
  const gap = 0.2;
  const n = Math.min(images.length, 4);
  let cols = 1;
  let rows = n;
  if (n === 4) { cols = 2; rows = 2; }
  if (n === 3) { cols = 1; rows = 3; }
  if (n === 2) { cols = 1; rows = 2; }
  const cellW = (box.w - gap * (cols - 1)) / cols;
  const cellH = (box.h - gap * (rows - 1)) / rows;
  images.slice(0, n).forEach((img, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    placeImage(ps, img, cache, {
      x: box.x + c * (cellW + gap),
      y: box.y + r * (cellH + gap),
      w: cellW,
      h: cellH,
    }, "cover");
  });
}

function placeImage(
  ps: PSlide,
  image: SlideImage,
  cache: Map<string, FetchedImage>,
  box: { x: number; y: number; w: number; h: number },
  mode: "fit" | "cover",
) {
  const fetched = cache.get(image.src);
  if (!fetched) {
    ps.addShape("rect", {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      fill: { color: COLORS.bg2 },
      line: { color: COLORS.inkdd, width: 0.5 },
    });
    ps.addText(`(missing image: ${image.src})`, {
      x: box.x,
      y: box.y + box.h / 2 - 0.2,
      w: box.w,
      h: 0.4,
      fontFace: FONT_BODY,
      fontSize: 10,
      color: COLORS.inkdd,
      align: "center",
    });
    return;
  }
  if (mode === "fit") {
    const fit = fitInto(box, fetched);
    ps.addImage({ data: fetched.dataUrl, x: box.x + fit.x, y: box.y + fit.y, w: fit.w, h: fit.h });
  } else {
    ps.addImage({
      data: fetched.dataUrl,
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      sizing: { type: "cover", w: box.w, h: box.h },
    });
  }
}
