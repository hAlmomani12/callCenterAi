// Small observable store for on-screen state the voice tools can drive.
// Components subscribe and react (scroll, highlight, fill forms) when a value changes.
// Not every "take me there" needs a page change: moving these values is often enough.

const state = {
  spotlightId: null,   // element to put a spotlight on (rest of the page dims briefly)
  highlightId: null,   // element to outline/pulse briefly
  focusSectionId: null, // section to scroll into view
  nonce: 0,            // bumps on every set so repeating the same id still re-triggers
  calc: null,          // { fuel, liters, amountJod } for the prices calculator
  stationsArea: "all", // station list filter
  complaint: null,     // prefilled complaint draft
  priceFocus: null,    // fuel row to emphasise on the prices table
};

const subs = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch, { nonce: state.nonce + 1 });
  const changed = Object.keys(patch);
  subs.forEach((fn) => {
    try { fn(state, changed); } catch (e) { console.error(e); }
  });
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
