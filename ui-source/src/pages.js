// The site's pages. Every section/item a voice tool can point at has a stable id.
import { getState, setState, subscribe } from "./store.js";

export const site = {
  prices: {}, gas: null, month: "", phone: "0797803780",
};
const IMG = window.__IMG || {};

export const FUEL_NAMES = {
  benzene_90: "بنزين 90", benzene_95: "بنزين 95", diesel: "ديزل (سولار)", kerosene: "كاز", gas_cylinder: "جرة الغاز المنزلي",
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const jod = (fils) => (fils / 1000).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const link = (path, text, cls = "") => `<a href="/client${path === "/" ? "/" : path}" data-link class="${cls}">${text}</a>`;

/** Shared by the calculator UI and the calculate_fill_cost tool. */
export const MAX_LITERS = 1000, MAX_JOD = 1000; // one fill, not a tanker

export function computeFill(fuel, liters, amountJod) {
  const p = site.prices[fuel];
  if (!p) return null;
  if (liters > MAX_LITERS || amountJod > MAX_JOD) return { fuel, tooBig: true, priceFils: p };
  if (liters > 0) return { fuel, liters: +liters, totalJod: +(liters * p / 1000).toFixed(3), priceFils: p };
  if (amountJod > 0) return { fuel, liters: +(amountJod * 1000 / p).toFixed(2), totalJod: +amountJod, priceFils: p };
  return { fuel, liters: null, totalJod: null, priceFils: p };
}

const icon = {
  fuel: '<path d="M3 22V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17M3 22h11M6 8h5"/><path d="M14 10h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  truck: '<path d="M1 16V6h13v10M14 9h4l4 4v3h-8"/><circle cx="5.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon[k]}</svg>`;

const pageHead = (title, lede) => `<header class="page-head wrap"><h1>${title}</h1>${lede ? `<p>${lede}</p>` : ""}</header>`;

// ---------------------------------------------------------------- home
const home = {
  title: "",
  render: () => `
  <section class="hero" aria-label="مقدمة">
    <img class="hero__img" src="${IMG.station || ""}" alt="محطة المناصير للزيوت والمحروقات وقت المغرب">
    <div class="wrap"><div class="hero__copy">
      <h1>خدمة عملاء المناصير، صار فيك تحكي معنا</h1>
      <p>اسأل بالصوت عن الأسعار، الدفع وأبشر، واصل والشحن الكهربائي. المساعد بيجاوبك وبيفرجيك الجواب على الشاشة.</p>
      <div class="hero__cta">
        <button class="btn btn--primary" type="button" data-start-call>${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>'}كلّم المساعد الآن</button>
        <a class="btn btn--ghost" href="tel:${site.phone}">اتصل بخدمة العملاء</a>
      </div>
    </div></div>
  </section>
  <section class="block wrap" id="home-services" aria-labelledby="home-services-h">
    <div class="block__head"><h2 id="home-services-h">شو بتقدر تسأل عنه</h2><p>كل خدمة إلها صفحة. المساعد بينقّلك عليها لحاله وهو بيحكي، والمكالمة ما بتنقطع.</p></div>
    <div class="tiles">
      ${[["/prices", "fuel", "أسعار المحروقات", "أسعار هالشهر وحاسبة التعبئة."],
         ["/payment", "card", "الدفع وأبشر", "eCash وeFill وAman Fill ونقاط أبشر."],
         ["/wasel", "truck", "واصل", "البنزين بيوصل لمكانك."],
         ["/ev", "bolt", "الشحن الكهربائي", "لاقي شاحن واحجز دورك."],
         ["/stations", "pin", "المحطات", "أحدث المحطات وكيف تلاقي الأقرب."],
         ["/contact", "chat", "تواصل وشكاوى", "الأرقام ونموذج شكوى جاهز."]]
        .map(([p, ic, t, d]) => `<a class="tile" href="/client${p}" data-link>${svg(ic)}<span class="tile__t">${t}</span><span class="tile__d">${d}</span></a>`).join("")}
    </div>
  </section>
  <section class="block wrap" id="home-how" aria-labelledby="home-how-h">
    <div class="block__head"><h2 id="home-how-h">كيف بتشتغل المكالمة</h2></div>
    <ol class="steps">
      <li><b>اضغط «ابدأ المكالمة»</b><span>واسمح للمتصفح يستعمل المايكروفون.</span></li>
      <li><b>احكي بالعامي</b><span>مثلاً «كم بتكلّفني تعبئة 30 لتر 95؟».</span></li>
      <li><b>شوف الجواب قدّامك</b><span>المساعد بيفتحلك القسم المناسب ويعلّم عليه.</span></li>
    </ol>
  </section>
  <section class="block wrap" id="home-facts" aria-label="أرقام عن الشركة">
    <div class="facts">
      <div class="fact"><b>+126</b><span>محطة بكل المملكة</span></div>
      <div class="fact"><b>+95</b><span>محطة على الطاقة الشمسية</span></div>
      <div class="fact"><b>+35</b><span>شاحن كهربائي سريع</span></div>
      <div class="fact"><b>+85</b><span>فرع لومي ماركت</span></div>
    </div>
  </section>`,
};

// ---------------------------------------------------------------- prices
const prices = {
  title: "أسعار المحروقات",
  render: () => {
    const rows = ["benzene_90", "benzene_95", "diesel", "kerosene"].map((k) => {
      const p = site.prices[k];
      return `<tr id="price-${k}"><th scope="row">${FUEL_NAMES[k]}</th><td>${p ? `${p} فلس` : "—"}</td><td>${p ? `${jod(p)} دينار` : "—"}</td></tr>`;
    }).join("");
    const gas = site.gas ? `${site.gas} دنانير` : "—";
    return `${pageHead("أسعار المحروقات", `الأسعار رسمية من لجنة تسعير المشتقات النفطية، وهي نفسها بكل محطات المملكة.${site.month ? ` أسعار شهر ${esc(site.month)}.` : ""}`)}
    <section class="block wrap" id="prices-table" aria-labelledby="prices-table-h">
      <h2 id="prices-table-h" class="sr-only">جدول الأسعار</h2>
      <table class="price-table">
        <thead><tr><th scope="col">النوع</th><th scope="col">لليتر</th><th scope="col">بالدينار</th></tr></thead>
        <tbody>${rows}<tr id="price-gas_cylinder"><th scope="row">جرة الغاز المنزلي (12.5 كيلو)</th><td colspan="2">${gas}</td></tr></tbody>
      </table>
      <p class="note">الأسعار بتتغيّر أول كل شهر.</p>
    </section>
    <section class="block wrap" id="calculator" aria-labelledby="calc-h">
      <div class="block__head"><h2 id="calc-h">كم بتكلّفني التعبئة؟</h2><p>اختار النوع، واكتب اللترات أو المبلغ.</p></div>
      <form class="calc" id="calc-form" novalidate>
        <label class="field">نوع الوقود
          <select id="calc-fuel">${["benzene_90", "benzene_95", "diesel", "kerosene"].map((k) => `<option value="${k}">${FUEL_NAMES[k]}</option>`).join("")}</select>
        </label>
        <fieldset class="seg"><legend>بدّي أحسب حسب</legend>
          <label><input type="radio" name="calc-mode" value="liters" checked> اللترات</label>
          <label><input type="radio" name="calc-mode" value="amount"> المبلغ</label>
        </fieldset>
        <label class="field"><span id="calc-input-label">عدد اللترات</span>
          <input id="calc-input" type="number" inputmode="decimal" min="0" step="0.5" placeholder="مثلاً 30">
        </label>
        <output class="calc__result" id="calc-result" for="calc-fuel calc-input" aria-live="polite">اكتب رقم لتشوف النتيجة.</output>
      </form>
    </section>`;
  },
  mount(view) {
    const fuel = view.querySelector("#calc-fuel"), input = view.querySelector("#calc-input"), out = view.querySelector("#calc-result"), lab = view.querySelector("#calc-input-label");
    const mode = () => view.querySelector('input[name="calc-mode"]:checked').value;
    const update = () => {
      lab.textContent = mode() === "liters" ? "عدد اللترات" : "المبلغ بالدينار";
      const v = parseFloat(input.value);
      const r = computeFill(fuel.value, mode() === "liters" ? v : 0, mode() === "amount" ? v : 0);
      if (!r) { out.textContent = "السعر مش متوفر هلأ."; return; }
      if (r.tooBig) { out.textContent = `الرقم كبير كثير. الحاسبة لتعبئة وحدة لحد ${mode() === "liters" ? MAX_LITERS + " لتر" : MAX_JOD + " دينار"}.`; return; }
      out.textContent = r.liters && r.totalJod
        ? (mode() === "liters" ? `${r.liters} لتر ${FUEL_NAMES[r.fuel]} = ${jod(r.totalJod * 1000)} دينار` : `${jod(r.totalJod * 1000)} دينار = ${r.liters} لتر ${FUEL_NAMES[r.fuel]}`)
        : "اكتب رقم لتشوف النتيجة.";
    };
    view.querySelector("#calc-form").addEventListener("input", update);
    view.querySelector("#calc-form").addEventListener("submit", (e) => e.preventDefault());
    const apply = (c) => {
      if (!c) return;
      fuel.value = c.fuel;
      view.querySelector(`input[name="calc-mode"][value="${c.amountJod > 0 && !(c.liters > 0) ? "amount" : "liters"}"]`).checked = true;
      input.value = c.liters > 0 ? c.liters : c.amountJod > 0 ? c.amountJod : "";
      update();
    };
    apply(getState().calc);
    const off = subscribe((s, ch) => { if (ch.includes("calc") && document.body.contains(input)) apply(s.calc); });
    view.addEventListener("unmount", off, { once: true });
  },
};

// ---------------------------------------------------------------- payment & absher
const payment = {
  title: "الدفع وأبشر",
  render: () => `${pageHead("الدفع وبرنامج أبشر", "كل طرق الدفع بمحطات المناصير، وكيف تجمع نقاط أبشر وتستبدلها.")}
    <section class="block wrap" id="payment-methods" aria-labelledby="pm-h">
      <div class="block__head"><h2 id="pm-h">طرق الدفع</h2></div>
      <div class="cards">
        <article class="card" id="pay-cash_card"><h3>كاش وبطاقات البنوك</h3><p>بتقدر تدفع كاش أو بأي بطاقة بنكية بكل المحطات.</p></article>
        <article class="card" id="pay-ecash"><h3>eCash</h3><p>بطاقة مسبقة الدفع، بتعبّي رصيدها وبتدفع فيها.</p></article>
        <article class="card" id="pay-efill"><h3>eFill</h3><p>بطاقة تعبئة إلكترونية للأفراد والشركات.</p></article>
        <article class="card" id="pay-aman_fill"><h3>Aman Fill</h3><p>نظام بيتعرّف على السيارة بموجات الراديو، والتعبئة بتصير بدون كاش ولا بطاقة. مناسب للشركات والأساطيل.</p></article>
        <article class="card" id="pay-efawateercom"><h3>إي فواتيركم</h3><p>بتدفع فواتير الديزل إلكترونياً، والمبلغ بينخصم من حسابك البنكي مباشرة.</p></article>
      </div>
      <p class="note">للاشتراك ببطاقات eFill أو eCash أو Aman Fill اتصل على <a href="tel:${site.phone}">${site.phone}</a>.</p>
    </section>
    <section class="block wrap" id="absher" aria-labelledby="absher-h">
      <div class="block__head"><h2 id="absher-h">برنامج مكافآت أبشر</h2><p>بتجمع نقاط على كل تعبئة وقود بمحطات المناصير، مهما كانت طريقة الدفع.</p></div>
      <ol class="steps">
        <li id="absher-join"><b>اشترك</b><span>إذا عندك eFill أو eCash أو Aman Fill، النقاط بتنضاف تلقائياً بعد ما تربط بطاقتك عن طريق خدمة العملاء. غير هيك، خذ بطاقة أبشر مجاناً من أي محطة وفعّلها على موقع الشركة.</span></li>
        <li id="absher-points"><b>اجمع واعرف نقاطك</b><span>فرجي البطاقة للعامل <strong>قبل</strong> التعبئة، وإلا النقاط ما بتنحسب. لتعرف رصيدك سجّل دخول على الموقع برقم تلفونك وكلمة السر.</span></li>
        <li id="absher-redeem"><b>استبدل</b><span>اختار الهدية من الموقع، وبتستلم الكوبون والهدية من مكاتب إدارة الشركة.</span></li>
      </ol>
      <p class="note" id="absher-partners">في كمان خصومات عند محلات شريكة لما تفرجيهم البطاقة.</p>
    </section>`,
};

// ---------------------------------------------------------------- wasel
const wasel = {
  title: "واصل",
  render: () => `${pageHead("واصل: البنزين لعندك", "بتطلب بنزين 90 أو 95 لمكانك: بالبيت، بالشغل، بالمعرض أو بالكراج.")}
    <section class="block wrap" id="wasel-how" aria-labelledby="wasel-how-h">
      <div class="block__head"><h2 id="wasel-how-h">كيف بتطلب</h2></div>
      <ol class="steps">
        <li><b>نزّل التطبيق</b><span>«Manaseer Wasel» على أندرويد وآيفون.</span></li>
        <li><b>اختار التفاصيل</b><span>نوع البنزين، الكمية، والوقت اللي بناسبك.</span></li>
        <li><b>استلم</b><span>الفريق بيوصل، بيعبّي، وبيعطيك فاتورة.</span></li>
      </ol>
    </section>
    <h2 class="sr-only wrap">تفاصيل الخدمة</h2>
    <section class="block wrap two" aria-label="تفاصيل الخدمة">
      <article class="card" id="wasel-pay"><h3>الدفع</h3><p>بطاقات المناصير، إي فواتيركم، أو بطاقات البنوك.</p></article>
      <article class="card" id="wasel-areas"><h3>المناطق</h3><p>لما انطلقت الخدمة كانت بعمّان ومنطقة المنطقة الحرة/الضليل. للتأكد من منطقتك اتصل على <a href="tel:${site.phone}">${site.phone}</a>.</p></article>
    </section>
    <p class="note wrap">الرسوم والحد الأدنى للطلب: اسأل خدمة العملاء.</p>`,
};

// ---------------------------------------------------------------- ev
const ev = {
  title: "الشحن الكهربائي",
  render: () => `${pageHead("شحن السيارات الكهربائية", "شواحن سريعة بمحطات المناصير بكل المناطق، وتطبيق «Manaseer EV» بيرتّبلك كل إشي.")}
    <section class="block wrap" aria-labelledby="ev-features-h">
      <h2 id="ev-features-h" class="sr-only">ميزات التطبيق</h2>
      <div class="cards">
        <article class="card" id="ev-find"><h3>لاقي شاحن</h3><p>أقرب محطة شحن على الخريطة، عدد الشواحن فيها، وأي شاحن بيناسب سيارتك.</p></article>
        <article class="card" id="ev-book"><h3>احجز دورك</h3><p>شوف إذا الشاحن فاضي وكم سيارة بالدور، احجز مسبقاً وتابع الوقت المتوقع لبدء الشحن.</p></article>
        <article class="card" id="ev-pay"><h3>ادفع</h3><p>إلكترونياً عن طريق إي فواتيركم، أو اشحن رصيد حسابك بالتطبيق.</p></article>
      </div>
    </section>
    <section class="block wrap" id="ev-stats" aria-label="أرقام">
      <div class="facts"><div class="fact"><b>+35</b><span>شاحن سريع شغّال</span></div><div class="fact"><b>20–30</b><span>شاحن جديد جاي</span></div></div>
      <p class="note">سعر الكيلوواط بيبيّن بالتطبيق.</p>
    </section>`,
};

// ---------------------------------------------------------------- stations
const STATIONS = [
  { id: "station-just", area: "irbid", name: "محطة جامعة العلوم والتكنولوجيا", where: "إربد، لواء الرمثا، طريق الرمثا–عمّان، بعد إشارة سايبر سيتي بحوالي كيلو باتجاه عمّان.", when: "أيلول 2026" },
  { id: "station-shuna", area: "balqa", name: "محطة الشونة الجنوبية", where: "البلقاء، طريق الأغوار، قبل حاجز الشونة الجنوبية بحوالي 2 كيلو باتجاه الكرامة.", when: "آب 2026" },
  { id: "station-hussein", area: "amman", name: "محطة جبل الحسين", where: "عمّان.", when: "" },
  { id: "station-douqara", area: "", name: "محطة دوقرة", where: "الموقع بالتفصيل عند خدمة العملاء.", when: "" },
];
export const AREA_NAMES = { all: "الكل", amman: "عمّان", irbid: "إربد", balqa: "البلقاء" };
export const stationsIn = (area) => STATIONS.filter((s) => area === "all" || s.area === area);

const stations = {
  title: "المحطات",
  render: () => `${pageHead("محطات المناصير", "أكثر من 126 محطة بكل محافظات المملكة. هون أحدث المحطات اللي افتتحت.")}
    <section class="block wrap" id="stations-list" aria-labelledby="st-h">
      <h2 id="st-h" class="sr-only">أحدث المحطات</h2>
      <div class="chips" id="stations-filter" role="group" aria-label="فلترة حسب المحافظة">
        ${Object.entries(AREA_NAMES).map(([k, v]) => `<button type="button" class="chip" data-area="${k}" aria-pressed="false">${v}</button>`).join("")}
      </div>
      <div class="cards" id="stations-cards">
        ${STATIONS.map((s) => `<article class="card" id="${s.id}" data-area="${s.area}"><h3>${s.name}</h3><p>${s.where}</p>${s.when ? `<p class="meta">افتتحت ${s.when}</p>` : ""}</article>`).join("")}
      </div>
      <p class="empty-note" id="stations-empty" hidden>ما عنا محطات جديدة مسجّلة بهاي المنطقة. استعمل الخريطة تحت.</p>
    </section>
    <section class="block wrap" id="stations-map" aria-labelledby="map-h">
      <div class="block__head"><h2 id="map-h">لاقي أقرب محطة</h2><p>كل المحطات على الخريطة. ساعات العمل بتختلف حسب المحطة.</p></div>
      <div class="hero__cta">
        <a class="btn btn--primary" href="https://www.google.com/maps/search/%D9%85%D8%AD%D8%B7%D8%A9+%D8%A7%D9%84%D9%85%D9%86%D8%A7%D8%B5%D9%8A%D8%B1" target="_blank" rel="noopener">افتح خرائط جوجل</a>
        <a class="btn btn--line" href="https://mgc-gas.jo" target="_blank" rel="noopener">موقع الشركة</a>
      </div>
    </section>`,
  mount(view) {
    const apply = (area) => {
      view.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.area === area)));
      let shown = 0;
      view.querySelectorAll("#stations-cards .card").forEach((c) => {
        const on = area === "all" || c.dataset.area === area;
        c.hidden = !on; if (on) shown++;
      });
      view.querySelector("#stations-empty").hidden = shown > 0;
    };
    view.querySelector("#stations-filter").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (b) setState({ stationsArea: b.dataset.area });
    });
    apply(getState().stationsArea || "all");
    const off = subscribe((s, ch) => { if (ch.includes("stationsArea") && view.querySelector("#stations-filter")) apply(s.stationsArea); });
    view.addEventListener("unmount", off, { once: true });
  },
};

// ---------------------------------------------------------------- group
const group = {
  title: "عن المجموعة",
  render: () => `${pageHead("جزء من مجموعة المناصير", "مجموعة أردنية أسّسها المهندس زياد المناصير سنة 1999، وبتشتغل بالصناعة والطاقة والتجارة.")}
    <section class="block wrap" id="group-about" aria-label="عن الشركة">
      <div class="group">
        <figure class="group__photo"><img src="${IMG.plant || ""}" alt="منظر جوي لموقع صناعي تابع لمجموعة المناصير في الصحراء الأردنية"><figcaption>من مواقع المجموعة الصناعية في الأردن</figcaption></figure>
        <div class="group__text" id="group-values">
          <h2>المناصير للزيوت والمحروقات</h2>
          <p>أول شركة بالأردن تدير سلسلة محطات وقود. أول محطة افتتحت سنة 2001.</p>
          <ul class="values">
            <li>أكثر من 126 محطة، وأكثر من 3000 موظف.</li>
            <li>أكثر من 95 محطة شغّالة بالكامل على الطاقة الشمسية.</li>
            <li>شهادات ISO 9001 و14001 و45001.</li>
          </ul>
        </div>
      </div>
    </section>
    <section class="block wrap" id="group-posters" aria-label="من حملات المجموعة">
      <div class="posters">
        <figure><img src="${IMG["poster-future"] || ""}" alt="بوستر مجموعة المناصير: Building the Future"></figure>
        <figure><img src="${IMG["poster-safety"] || ""}" alt="بوستر مجموعة المناصير: Safety Without Compromise"></figure>
        <figure><img src="${IMG["poster-growing"] || ""}" alt="بوستر مجموعة المناصير: Growing Responsibly"></figure>
      </div>
    </section>`,
};

// ---------------------------------------------------------------- contact & complaint
export const ISSUE_NAMES = { service: "الخدمة بالمحطة", fuel_quality: "جودة الوقود", payment: "الدفع أو البطاقات", wasel: "خدمة واصل", ev_charging: "الشحن الكهربائي", other: "إشي ثاني" };

const contact = {
  title: "تواصل وشكاوى",
  render: () => `${pageHead("تواصل معنا", "بنحب نسمع منك، سواء سؤال أو شكوى أو اقتراح.")}
    <section class="block wrap" id="contact-phones" aria-labelledby="contact-phones-h">
      <h2 id="contact-phones-h" class="sr-only">أرقام التواصل</h2>
      <div class="cards">
        <article class="card"><h3>خدمة العملاء</h3><p><a class="big-tel" href="tel:${site.phone}">${site.phone}</a></p></article>
        <article class="card"><h3>الإدارة</h3><p><a href="tel:065734030">06 573 4030</a></p></article>
        <article class="card"><h3>أونلاين</h3><p><a href="https://mgc-gas.jo" target="_blank" rel="noopener">mgc-gas.jo</a><br>فيسبوك: ManaseerGas · إنستغرام: manaseergas</p></article>
        <article class="card card--alert"><h3>طوارئ</h3><p>حريق أو تسرّب غاز أو حادث: اتصل فوراً على <a href="tel:911">911</a>.</p></article>
      </div>
    </section>
    <section class="block wrap" id="complaint" aria-labelledby="cmp-h">
      <div class="block__head"><h2 id="cmp-h">جهّز شكوى</h2><p>عبّي التفاصيل، وبنجهّزلك ملخص تحكيه أو تبعته لخدمة العملاء. ما بننشر ولا بنبعت إشي من هون.</p></div>
      <form class="complaint" id="complaint-form" novalidate>
        <label class="field">نوع المشكلة<select id="cmp-type">${Object.entries(ISSUE_NAMES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
        <label class="field">المحطة أو المكان<input id="cmp-station" type="text" autocomplete="off" placeholder="مثلاً محطة جبل الحسين"></label>
        <label class="field">إيمتى صارت<input id="cmp-when" type="datetime-local"></label>
        <label class="field field--wide">شو صار (مطلوب)<textarea id="cmp-details" rows="4" placeholder="احكيلنا باختصار" aria-describedby="cmp-error"></textarea></label>
        <p class="form-error" id="cmp-error" role="alert" hidden>اكتب شو صار معك حتى نجهّز الملخص.</p>
        <div class="field--wide form-actions"><button class="btn btn--primary" type="submit">جهّز الملخص</button></div>
      </form>
      <div class="summary" id="complaint-summary" hidden>
        <h3>ملخص الشكوى</h3>
        <pre id="cmp-summary-text"></pre>
        <div class="hero__cta"><button class="btn btn--line" type="button" id="cmp-copy">انسخ الملخص</button><a class="btn btn--primary" href="tel:${site.phone}">اتصل على ${site.phone}</a></div>
      </div>
    </section>`,
  mount(view) {
    const f = (id) => view.querySelector(id);
    const summary = () => {
      const missing = !f("#cmp-details").value.trim();
      f("#cmp-error").hidden = !missing;
      f("#cmp-details").setAttribute("aria-invalid", String(missing));
      if (missing) { f("#complaint-summary").hidden = true; f("#cmp-details").focus({ preventScroll: true }); return; }
      const lines = [
        `نوع المشكلة: ${ISSUE_NAMES[f("#cmp-type").value]}`,
        f("#cmp-station").value.trim() && `المحطة: ${f("#cmp-station").value.trim()}`,
        f("#cmp-when").value && `الوقت: ${f("#cmp-when").value.replace("T", " ")}`,
        f("#cmp-details").value.trim() && `التفاصيل: ${f("#cmp-details").value.trim()}`,
      ].filter(Boolean);
      f("#cmp-summary-text").textContent = lines.join("\n");
      f("#complaint-summary").hidden = false;
    };
    f("#complaint-form").addEventListener("submit", (e) => { e.preventDefault(); summary(); });
    f("#cmp-copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(f("#cmp-summary-text").textContent); f("#cmp-copy").textContent = "انتسخ"; } catch { f("#cmp-copy").textContent = "ما قدرنا ننسخ"; }
    });
    const apply = (d) => {
      if (!d) return;
      if (d.issue_type && ISSUE_NAMES[d.issue_type]) f("#cmp-type").value = d.issue_type;
      if (d.station) f("#cmp-station").value = d.station;
      if (d.details) f("#cmp-details").value = d.details;
      if (d.details) summary();
    };
    apply(getState().complaint);
    const off = subscribe((s, ch) => { if (ch.includes("complaint") && view.contains(f("#complaint-form"))) apply(s.complaint); });
    view.addEventListener("unmount", off, { once: true });
  },
};

export const routes = { "/": home, "/prices": prices, "/payment": payment, "/wasel": wasel, "/ev": ev, "/stations": stations, "/group": group, "/contact": contact };
export const PAGE_TITLES = Object.fromEntries(Object.entries(routes).map(([k, v]) => [k, v.title || "الرئيسية"]));
export { link };
