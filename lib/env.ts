// Environment helpers used by client components.
//
// `isDevHost()` returns true when the page is being served from a local dev
// host (localhost, 127.0.0.1, or any *.local mDNS hostname). It's used to
// gate paid third-party calls — the LEGO/build-block detector hits Anthropic
// and burns credits, so we skip it in dev and silently auto-pass uploads.

export function isDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}
