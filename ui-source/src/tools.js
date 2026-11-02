// Screen tools the voice bot can call. The bot never knows page addresses: each tool decides
// here whether to change page (goTo) or, if the customer is already there, just move the
// screen through the store. Every tool returns a `hint` telling the model what to say next.
import { goTo, currentPath } from "./nav.js";
import { setState, getState } from "./store.js";
import { computeFill, FUEL_NAMES, jod, site, stationsIn, AREA_NAMES, ISSUE_NAMES, PAGE_TITLES } from "./pages.js";

let onToolNavigate = () => {};
export function setToolNavigateHandler(fn) { onToolNavigate = fn; }

/**
 * Bring a page (and optionally one of its sections) on screen.
 * Off-page: client-side goTo with the section as anchor. On-page: no navigation, only state.
 */
async function showOn(page, { section = null, highlight = null, spotlight = null } = {}) {
  const navigated = currentPath() !== page;
  if (navigated) {
    await goTo(page + (section ? "#" + section : ""));
    onToolNavigate(page);
    // The router already scrolled to `section`; only add the emphasis.
    setState({ highlightId: highlight, spotlightId: spotlight });
  } else {
    setState({ focusSectionId: section, highlightId: highlight, spotlightId: spotlight });
  }
  return navigated;
}

/** For tools that change state: make sure the customer is looking at the screen that shows it. */
async function ensureScreen(page, section = null) {
  if (currentPath() !== page) {
    await goTo(page + (section ? "#" + section : ""));
    onToolNavigate(page);
    return true;
  }
  if (section) setState({ focusSectionId: section });
  return false;
}

const num = (v) => { const n = typeof v === "string" ? parseFloat(v) : v; return Number.isFinite(n) && n > 0 ? n : 0; };
const pick = (v, allowed) => (allowed.includes(v) ? v : null);

const TOOLS = {
  async show_fuel_prices({ fuel } = {}) {
    const f = pick(fuel, ["benzene_90", "benzene_95", "diesel", "kerosene", "gas_cylinder"]);
    const navigated = await showOn("/prices", { section: "prices-table", highlight: f ? `price-${f}` : null });
    const price = f === "gas_cylinder" ? (site.gas ? `${site.gas} دنانير للجرة` : null) : f && site.prices[f] ? `${site.prices[f]} فلس لليتر` : null;
    return {
      ok: true, navigated, shown: "prices", month: site.month, fuel: f, price,
      hint: f
        ? `السعر معلّم على الشاشة. احكي سعر ${FUEL_NAMES[f]} بس${price ? ` (${price})` : ""}، مش الجدول كله.`
        : "جدول الأسعار ظاهر قدّامه. اذكر سعرين بالكثير واحكيله إنه الباقي على الشاشة.",
    };
  },

  async calculate_fill_cost({ fuel, liters, amount_jod } = {}) {
    const f = pick(fuel, ["benzene_90", "benzene_95", "diesel", "kerosene"]);
    if (!f) return { ok: false, hint: "ما عرفت نوع الوقود. اسأله أي نوع بدّه." };
    const L = num(liters), A = num(amount_jod);
    const navigated = await ensureScreen("/prices", "calculator");
    setState({ calc: { fuel: f, liters: L, amountJod: A }, highlightId: "calc-result" });
    const r = computeFill(f, L, A);
    if (!r) return { ok: false, navigated, hint: "السعر مش متوفر هلأ. اعتذر وعطيه رقم خدمة العملاء." };
    if (r.tooBig) return { ok: true, navigated, too_big: true, hint: "الرقم اللي سمعته كبير كثير على تعبئة وحدة. تأكد منه شو قصده بالزبط." };
    if (!r.liters || !r.totalJod) return { ok: true, navigated, price_fils: r.priceFils, hint: "الحاسبة مفتوحة. اسأله كم لتر أو كم دينار بدّه يعبّي." };
    return {
      ok: true, navigated, fuel: f, liters: r.liters, total_jod: r.totalJod, total_text: `${jod(r.totalJod * 1000)} دينار`,
      hint: `النتيجة ظاهرة بالحاسبة. احكيله النتيجة بجملة وحدة: ${r.liters} لتر = ${jod(r.totalJod * 1000)} دينار. الأسعار رسمية لهالشهر.`,
    };
  },

  async show_payment_methods({ method } = {}) {
    const m = pick(method, ["cash_card", "ecash", "efill", "aman_fill", "efawateercom"]);
    const navigated = await showOn("/payment", { section: "payment-methods", highlight: m ? `pay-${m}` : null });
    return { ok: true, navigated, method: m, hint: m ? "الطريقة معلّمة على الشاشة. اشرحها بجملتين بالكثير." : "طرق الدفع ظاهرة. اذكر طريقتين بس واسأله شو بيناسبه." };
  },

  async open_absher_section({ topic } = {}) {
    const t = pick(topic, ["join", "points", "redeem", "partners"]) || "join";
    const navigated = await showOn("/payment", { section: "absher", spotlight: `absher-${t}`, highlight: `absher-${t}` });
    const say = { join: "كيف يشترك", points: "كيف يعرف نقاطه، وذكّره يفرجي البطاقة قبل التعبئة", redeem: "كيف يستبدل النقاط", partners: "خصومات المحلات الشريكة" }[t];
    return { ok: true, navigated, topic: t, hint: `الخطوة معلّمة على الشاشة. احكيله ${say} بجملة أو جملتين، ولا تعيد كل الخطوات.` };
  },

  async show_wasel_delivery() {
    const navigated = await showOn("/wasel", { section: "wasel-how" });
    return { ok: true, navigated, hint: "خطوات واصل ظاهرة. احكي إنه بيطلب من تطبيق Manaseer Wasel، واسأله إذا بدّه يعرف عن المناطق أو الدفع." };
  },

  async show_ev_charging({ topic } = {}) {
    const t = pick(topic, ["find", "book", "pay"]);
    const navigated = await showOn("/ev", { section: t ? `ev-${t}` : null, highlight: t ? `ev-${t}` : null });
    return { ok: true, navigated, topic: t, hint: t ? "الميزة معلّمة على الشاشة. اشرحها بجملة واذكر تطبيق Manaseer EV." : "صفحة الشحن ظاهرة. احكي إنه في أكثر من 35 شاحن سريع وإنه التطبيق بيلاقيله الأقرب." };
  },

  async show_stations({ area } = {}) {
    const a = pick(area, ["amman", "irbid", "balqa", "all"]) || "all";
    const navigated = await ensureScreen("/stations", "stations-list");
    const list = stationsIn(a);
    setState({ stationsArea: a, highlightId: list[0]?.id || "stations-map" });
    return {
      ok: true, navigated, area: a, stations: list.map((s) => s.name),
      hint: list.length
        ? `المحطات ${a === "all" ? "الجديدة" : `بـ${AREA_NAMES[a]}`} ظاهرة. اذكر ${list.length > 1 ? "محطتين بالكثير" : "المحطة"}، وقله إنه زر خرائط جوجل بيلاقيله الأقرب.`
        : `ما عنا محطات جديدة مسجّلة بـ${AREA_NAMES[a]}. لا تخترع محطة؛ قله إنه في أكثر من 126 محطة وإنه زر الخريطة على الشاشة بيلاقيله الأقرب.`,
    };
  },

  async show_group_info() {
    const navigated = await showOn("/group", { section: "group-about", highlight: "group-values" });
    return { ok: true, navigated, hint: "معلومات الشركة ظاهرة. اذكر معلومتين بس، مثل أول محطة سنة 2001 والطاقة الشمسية." };
  },

  async open_complaint_form({ issue_type, station, details } = {}) {
    const navigated = await ensureScreen("/contact", "complaint");
    const draft = {
      issue_type: pick(issue_type, Object.keys(ISSUE_NAMES)) || "other",
      station: typeof station === "string" ? station.slice(0, 120) : "",
      details: typeof details === "string" ? details.slice(0, 600) : "",
    };
    setState({ complaint: draft, highlightId: "complaint-summary" });
    const missing = [!draft.station && "المحطة", !draft.details && "شو صار"].filter(Boolean);
    return {
      ok: true, navigated, filled: draft,
      hint: missing.length
        ? `النموذج انفتح وتعبّى جزئياً. اسأله عن ${missing.join(" و")}، وبعدها نادِ الأداة مرة ثانية بالتفاصيل.`
        : `الملخص جاهز على الشاشة. اطلب منه يتأكد منه، وقله يتصل على ${site.phone} ويحكيه، أو ينسخه بالزر.`,
    };
  },

  async go_to_contact() {
    const navigated = await showOn("/contact", { section: "contact-phones", highlight: "contact-phones" });
    return { ok: true, navigated, phone: site.phone, hint: `الأرقام ظاهرة. احكي رقم خدمة العملاء ${site.phone} ببطء، رقم رقم.` };
  },

  async go_to_home() {
    const navigated = await showOn("/", {});
    return { ok: true, navigated, hint: "رجع للبداية. اسأله كيف بتقدر تساعده." };
  },
};

/** Run one tool safely; always resolves to an object for the model. */
export async function runTool(name, args) {
  const fn = TOOLS[name];
  if (!fn) return { ok: false, hint: "هاي الأداة مش موجودة. كمّل بالكلام." };
  try {
    const r = await fn(args && typeof args === "object" ? args : {});
    return { ...r, page: PAGE_TITLES[currentPath()] };
  } catch (e) {
    console.error("tool failed", name, e);
    return { ok: false, hint: "صار خطأ بعرض الشاشة. كمّل الجواب بالكلام بس." };
  }
}

export const TOOL_NAMES = Object.keys(TOOLS);
export { ensureScreen, getState };
