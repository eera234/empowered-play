// Compress a data URL by drawing it onto a canvas and re-exporting as JPEG.
// Convex storage has a 1MB-per-value cap; native camera photos are often
// 2-4 MB. We downscale to `maxDim` max dimension and re-encode at 0.8 JPEG
// quality, which reliably lands under 600 KB for typical photos.
// If the source is already small enough we still re-encode because most gains
// come from JPEG quality, not just dimensions.
export function compressDataUrl(
  dataUrl: string,
  maxDim = 960,
  quality = 0.78,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) { resolve(dataUrl); return; }
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));
      const c = document.createElement("canvas");
      c.width = tw; c.height = th;
      const ctx = c.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, tw, th);
      try {
        resolve(c.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// NOTE: pickPhotoFile was removed in Pass #19. The game is camera-only: every
// upload goes through the InAppCamera component in app/components/InAppCamera.tsx,
// which uses getUserMedia and never falls back to a file picker or photo library.
