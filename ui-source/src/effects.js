// Components react to the store: scroll a section into view, outline an item, or spotlight it.
import { subscribe } from "./store.js";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const byId = (id) => (id ? document.getElementById(id) : null);

let hlTimer = null, spTimer = null;

function clearSpotlight() {
  clearTimeout(spTimer);
  document.querySelectorAll(".is-spotlight").forEach((el) => el.classList.remove("is-spotlight"));
  document.body.classList.remove("spotlight-on");
}

export function startEffects() {
  subscribe((s, changed) => {
    if (changed.includes("focusSectionId")) {
      const el = byId(s.focusSectionId);
      if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    }
    if (changed.includes("highlightId")) {
      clearTimeout(hlTimer);
      document.querySelectorAll(".is-highlight").forEach((el) => el.classList.remove("is-highlight"));
      const el = byId(s.highlightId);
      if (el) {
        void el.offsetWidth; // restart the animation when the same item is highlighted again
        el.classList.add("is-highlight");
        if (!changed.includes("focusSectionId")) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
        hlTimer = setTimeout(() => el.classList.remove("is-highlight"), 6000);
      }
    }
    if (changed.includes("spotlightId")) {
      clearSpotlight();
      const el = byId(s.spotlightId);
      if (el) {
        el.classList.add("is-spotlight");
        document.body.classList.add("spotlight-on");
        spTimer = setTimeout(clearSpotlight, 5000);
      }
    }
  });
  document.addEventListener("pointerdown", clearSpotlight);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") clearSpotlight(); });
}
