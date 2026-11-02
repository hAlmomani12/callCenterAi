// Navigation bridge.
// Tools run outside the page's own code paths (they are triggered by the voice bot), so they
// can't call the router directly. The router registers itself here once at startup; tools
// only ever use goTo() / currentPath().
//
// CRITICAL: navigation must stay client-side (history.pushState). A full page load
// (window.location / reload) tears down the WebRTC connection and ends the call mid-sentence.
// window.location is used ONLY if no navigator has been registered yet.

export const BASE = "/client";

let navigator = null;

/** Called once by the router at startup. */
export function registerNavigator(fn) {
  navigator = typeof fn === "function" ? fn : null;
}

/** "/prices#calculator" -> { path: "/prices", hash: "calculator" } */
export function splitHref(href = "/") {
  const [rawPath, hash = ""] = String(href).split("#");
  let path = rawPath || "/";
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return { path, hash };
}

/** Current page inside the site, e.g. "/" or "/prices". */
export function currentPath() {
  let p = location.pathname;
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  if (!p || p === "/index.html") p = "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p === "/ui" ? "/" : p;
}

/** Go to a page (and optional section). Resolves once the new page is on screen. */
export function goTo(href) {
  if (navigator) return Promise.resolve(navigator(href));
  // Last resort only: no router yet. This reloads the page and would end a call.
  console.warn("goTo before the router registered; falling back to a full page load");
  const { path, hash } = splitHref(href);
  window.location.assign(BASE + (path === "/" ? "/" : path) + (hash ? "#" + hash : ""));
  return Promise.resolve(false);
}
