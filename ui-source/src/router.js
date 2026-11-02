// Client-side router: swaps the page inside #view with history.pushState.
// The call UI lives outside #view, so changing page never touches the WebRTC connection.
import { BASE, registerNavigator, splitHref, currentPath } from "./nav.js";
import { setState } from "./store.js";

let routes = {};
let view = null;
let onRendered = () => {};

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const urlFor = (path, hash) => BASE + (path === "/" ? "/" : path) + (hash ? "#" + hash : "");

function render(path, hash, { fromTool = false } = {}) {
  const route = routes[path] || routes["/"];
  view.dispatchEvent(new Event("unmount")); // let the old page drop its store subscriptions
  view.innerHTML = route.render();
  view.dataset.page = path in routes ? path : "/";
  document.title = route.title ? `${route.title} | خدمة عملاء المناصير` : "خدمة عملاء المناصير";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const on = a.getAttribute("data-nav") === view.dataset.page;
    a.classList.toggle("is-current", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  route.mount?.(view);
  if (hash) {
    setState({ focusSectionId: hash });
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  // Move keyboard/screen-reader focus to the new page heading without scrolling.
  const h1 = view.querySelector("h1");
  if (h1 && !fromTool) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
  onRendered(view.dataset.page, { fromTool });
}

/** Navigate inside the site. Returns once the new page is rendered. */
function navigate(href, opts = {}) {
  const { path, hash } = splitHref(href);
  const target = path in routes ? path : "/";
  if (target === currentPath() && !opts.force) {
    if (hash) setState({ focusSectionId: hash });
    return new Promise((r) => requestAnimationFrame(() => r(true)));
  }
  history.pushState({ path: target, hash }, "", urlFor(target, hash));
  render(target, hash, opts);
  return new Promise((r) => requestAnimationFrame(() => r(true)));
}

export function startRouter({ routes: r, view: v, onRendered: cb }) {
  routes = r;
  view = v;
  if (cb) onRendered = cb;

  // Links marked data-link stay inside the page: no reload, the call keeps going.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-link]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(a.getAttribute("href").replace(BASE, "") || "/");
  });
  window.addEventListener("popstate", () => {
    render(currentPath(), location.hash.slice(1));
  });

  registerNavigator((href) => navigate(href, { fromTool: true }));

  // First render. /ui is an alias of the home page: normalise the address silently.
  const start = currentPath() in routes ? currentPath() : "/";
  const hash = location.hash.slice(1);
  if (location.pathname !== urlFor(start, "").split("#")[0]) history.replaceState({ path: start }, "", urlFor(start, hash));
  render(start, hash);
  return { navigate, reduced };
}
