// Opens the native file picker with the environment-facing camera hint. On
// iOS Safari this surfaces "Take Photo / Photo Library" directly. Used as a
// fallback when getUserMedia fails (non-HTTPS contexts, in-app browsers, PWAs).
export function pickPhotoFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.setAttribute("capture", "environment");
    input.style.display = "none";

    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return done(null);
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        done(result);
      };
      reader.onerror = () => done(null);
      reader.readAsDataURL(file);
    });

    // If the user cancels, no change event fires. Resolve null the next time
    // the window regains focus so callers can reset their UI.
    const onFocus = () => {
      window.removeEventListener("focus", onFocus);
      setTimeout(() => {
        if (!settled && !input.files?.length) done(null);
      }, 300);
    };
    window.addEventListener("focus", onFocus);

    document.body.appendChild(input);
    input.click();
  });
}
