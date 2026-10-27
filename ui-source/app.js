import { PipecatClient } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport, WavMediaManager } from "@pipecat-ai/small-webrtc-transport";

const $ = (id) => document.getElementById(id);
const ui = {
  call: $("callBtn"), callLabel: $("callLabel"), mic: $("micToggle"),
  micSelect: $("micSelect"), status: $("status"), statusText: $("statusText"),
  caption: $("caption"), timer: $("timer"), log: $("log"), empty: $("empty"),
  audio: $("botAudio"), error: $("error"), canvas: $("flame"),
};

// ---------- state ----------
let client = null;
let phase = "idle"; // idle | connecting | live | ending
let speaker = "none"; // none | user | bot
let localLevel = 0, remoteLevel = 0;
let timerId = null, startedAt = 0;
let userBubble = null, botBubble = null;
let gotBotOutput = false;

const CAPTIONS = {
  idle: "اضغط «ابدأ المكالمة» وابدأ الحكي",
  connecting: "عم نوصلك بخدمة العملاء…",
  listening: "تفضّل، عم بسمعك",
  user: "عم بسمعك…",
  bot: "الموظف عم يحكي",
  ending: "عم نسكّر المكالمة…",
};

function setStatus(kind, text) {
  ui.status.dataset.kind = kind;
  ui.statusText.textContent = text;
}

function setPhase(next) {
  phase = next;
  if (next !== "connecting") clearTimeout(connectTimer);
  document.body.dataset.phase = next;
  const live = next === "live";
  ui.call.disabled = next === "connecting" || next === "ending";
  ui.callLabel.textContent = live ? "إنهاء المكالمة" : next === "connecting" ? "عم نوصل…" : "ابدأ المكالمة";
  ui.call.setAttribute("aria-pressed", String(live));
  ui.mic.disabled = !live;
  if (next === "idle") { setStatus("off", "غير متصل"); speaker = "none"; }
  if (next === "connecting") setStatus("wait", "عم نوصل");
  if (live) setStatus("on", "متصل");
  updateCaption();
}

function updateCaption() {
  if (phase !== "live") { ui.caption.textContent = CAPTIONS[phase] || CAPTIONS.idle; return; }
  ui.caption.textContent = speaker === "bot" ? CAPTIONS.bot : speaker === "user" ? CAPTIONS.user : CAPTIONS.listening;
}

function showError(msg) {
  ui.error.textContent = msg;
  ui.error.hidden = !msg;
}

// ---------- timer ----------
function startTimer() {
  startedAt = Date.now();
  ui.timer.textContent = "00:00";
  timerId = setInterval(() => {
    const s = Math.floor((Date.now() - startedAt) / 1000);
    ui.timer.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }, 1000);
}
function stopTimer() { clearInterval(timerId); timerId = null; }

// ---------- transcript ----------
function addBubble(who) {
  ui.empty.hidden = true;
  const li = document.createElement("li");
  li.className = `msg msg--${who}`;
  const name = document.createElement("span");
  name.className = "msg__who";
  name.textContent = who === "user" ? "إنت" : "خدمة العملاء";
  const body = document.createElement("p");
  body.className = "msg__text";
  li.append(name, body);
  ui.log.append(li);
  li.scrollIntoView({ block: "end", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return body;
}

function onUserTranscript(data) {
  if (!data?.text) return;
  botBubble = null;
  if (!userBubble) userBubble = addBubble("user");
  userBubble.textContent = data.text;
  userBubble.parentElement.classList.toggle("is-interim", !data.final);
  if (data.final) userBubble = null;
}

function onBotText(text) {
  if (!text) return;
  userBubble = null;
  if (!botBubble) botBubble = addBubble("bot");
  const cur = botBubble.textContent;
  botBubble.textContent = cur ? `${cur}${/[\s]$/.test(cur) || /^[\s.,،؟!?]/.test(text) ? "" : " "}${text}` : text;
  botBubble.parentElement.scrollIntoView({ block: "end" });
}

// ---------- mic devices ----------
function fillMics(mics) {
  const sel = ui.micSelect;
  const current = client?.selectedMic?.deviceId;
  sel.innerHTML = "";
  if (!mics?.length) {
    sel.append(new Option("ما في مايكروفون", ""));
    sel.disabled = true;
    return;
  }
  mics.forEach((m, i) => sel.append(new Option(m.label || `مايكروفون ${i + 1}`, m.deviceId)));
  if (current) sel.value = current;
  sel.disabled = false;
}

function setMicUI(on) {
  ui.mic.setAttribute("aria-checked", String(on));
  ui.mic.querySelector(".switch__label").textContent = on ? "المايك شغّال" : "المايك مسكّر";
}

// ---------- bot audio ----------
function playBotTrack(track) {
  const cur = ui.audio.srcObject?.getAudioTracks?.()[0];
  if (cur && cur.id === track.id) { ui.audio.play().catch(() => {}); return; }
  ui.audio.srcObject = new MediaStream([track]);
  ui.audio.muted = false;
  ui.audio.volume = 1;
  ui.audio.play().catch((e) => {
    console.warn("Bot audio play blocked", e);
    showError("المتصفح منع صوت الموظف. اضغط أي مكان بالصفحة عشان يشتغل الصوت.");
    addEventListener("pointerdown", () => { ui.audio.play().then(() => showError("")).catch(() => {}); }, { once: true });
  });
}

function attachBotAudioFromClient() {
  try {
    const t = client?.tracks?.()?.bot?.audio;
    if (t) playBotTrack(t);
  } catch {}
}

// ---------- client ----------
// Default media handling is the same as the original /client page. If it can't
// load (offline or a blocked CDN), we retry once with the fully local manager.
const forceLocal = new URLSearchParams(location.search).get("audio") === "local";

function buildClient(local = forceLocal) {
  return new PipecatClient({
    transport: new SmallWebRTCTransport(local ? { mediaManager: new WavMediaManager() } : {}),
    enableMic: true,
    enableCam: false,
    callbacks: {
      onConnected: () => { attachBotAudioFromClient(); if (phase !== "live") { setPhase("live"); startTimer(); setMicUI(client.isMicEnabled); } },
      onDisconnected: () => {
        const wasConnecting = phase === "connecting";
        stopTimer(); setPhase("idle"); localLevel = remoteLevel = 0;
        if (wasConnecting) showError("البوت سكّر الاتصال قبل ما تبدأ المكالمة. شوف النافذة السوداء إذا في رسالة خطأ.");
      },
      onTransportStateChanged: (s) => { if (s === "error") setPhase("idle"); },
      onBotReady: () => {
        attachBotAudioFromClient(); if (phase === "connecting") { setPhase("live"); if (!timerId) startTimer(); setMicUI(client.isMicEnabled); } updateCaption(); },
      // The SmallWebRTC transport reports the bot's track WITHOUT a participant,
      // so anything that isn't explicitly our own (local) track is the bot.
      onTrackStarted: (track, participant) => {
        if (track.kind === "audio" && participant?.local !== true) playBotTrack(track);
      },
      onAvailableMicsUpdated: fillMics,
      onMicUpdated: (mic) => { if (mic?.deviceId) ui.micSelect.value = mic.deviceId; },
      onLocalAudioLevel: (l) => { localLevel = l; },
      onRemoteAudioLevel: (l) => { remoteLevel = l; },
      onUserStartedSpeaking: () => { speaker = "user"; updateCaption(); },
      onUserStoppedSpeaking: () => { if (speaker === "user") speaker = "none"; updateCaption(); },
      onBotStartedSpeaking: () => { speaker = "bot"; updateCaption(); },
      onBotStoppedSpeaking: () => { if (speaker === "bot") speaker = "none"; updateCaption(); },
      onUserTranscript,
      onBotOutput: (d) => { gotBotOutput = true; onBotText(d?.text); },
      // Older/other bots only send TTS text; use it only if bot-output never arrives.
      onBotTtsText: (d) => { if (!gotBotOutput) onBotText(d?.text); },
      onDeviceError: () => showError("ما قدرنا نوصل للمايكروفون. اسمح للمتصفح يستعمله من أيقونة القفل جنب الرابط، وبعدين جرّب مرة ثانية."),
      onError: (m) => {
        const t = m?.data?.message || m?.data?.error || "";
        showError(t ? `صار خطأ بالمكالمة: ${t}` : "صار خطأ بالمكالمة. تأكد إن البوت شغّال بالنافذة السوداء وجرّب مرة ثانية.");
      },
    },
  });
}

let connectTimer = null;

async function startCall() {
  showError("");
  setPhase("connecting");
  clearTimeout(connectTimer);
  connectTimer = setTimeout(async () => {
    if (phase !== "connecting") return;
    try { await client?.disconnect(); } catch {}
    setPhase("idle");
    showError("البوت ما ردّ. شوف النافذة السوداء: إذا في خطأ بمفتاح OpenAI، شغّل 4-change-key.bat وجرّب مرة ثانية.");
  }, 30000);
  const attempt = async (local) => {
    gotBotOutput = false;
    client = buildClient(local);
    await client.initDevices?.();
    await client.connect({ webrtcRequestParams: { endpoint: "/api/offer" } });
  };
  try {
    try {
      await attempt(forceLocal);
    } catch (first) {
      if (forceLocal) throw first;
      console.warn("Default audio manager failed, retrying with local one", first);
      try { await client?.disconnect(); } catch {}
      await attempt(true);
    }
  } catch (e) {
    console.error(e);
    setPhase("idle");
    showError("ما قدرنا نبدأ المكالمة. تأكد إن البوت شغّال بالنافذة السوداء، وإن المتصفح مسموحله يستعمل المايكروفون.");
  }
}

async function endCall() {
  setPhase("ending");
  try { await client?.disconnect(); } catch (e) { console.error(e); }
  ui.audio.srcObject = null;
  stopTimer();
  setPhase("idle");
}

ui.call.addEventListener("click", () => (phase === "live" ? endCall() : startCall()));
ui.mic.addEventListener("click", () => {
  if (!client || phase !== "live") return;
  const next = !client.isMicEnabled;
  client.enableMic(next);
  setMicUI(next);
});
ui.micSelect.addEventListener("change", () => { if (client && ui.micSelect.value) client.updateMic(ui.micSelect.value); });
addEventListener("beforeunload", () => { try { client?.disconnect(); } catch {} });

// ---------- hero "start call" shortcuts ----------
document.querySelectorAll("[data-start-call]").forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("call")?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
    if (phase === "idle") startCall();
  })
);
function reduceMotion() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

// ---------- sunburst voice visual (echoes the Manaseer mark) ----------
const ctx = ui.canvas.getContext("2d");
const PALETTE = {
  idle: [[154, 196, 222], [208, 228, 240]],
  user: [[4, 180, 228], [110, 217, 242]],
  bot: [[0, 90, 200], [0, 123, 255]],
};
let col = [...PALETTE.idle[0], ...PALETTE.idle[1]];
let energy = 0, spin = 0;

function resize() {
  const r = ui.canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  ui.canvas.width = Math.max(1, r.width * dpr); ui.canvas.height = Math.max(1, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);

function ray(cx, cy, a, r0, r1, width, bend) {
  // a curved, tapered ray from r0 to r1, bending clockwise
  const steps = 14, left = [], right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = r0 + (r1 - r0) * t;
    const ang = a + bend * t * t;
    const w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.55);
    const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
    left.push([x + nx * w, y + ny * w]); right.push([x - nx * w, y - ny * w]);
  }
  ctx.beginPath();
  ctx.moveTo(...left[0]);
  left.forEach((p) => ctx.lineTo(...p));
  right.reverse().forEach((p) => ctx.lineTo(...p));
  ctx.closePath();
  ctx.fill();
}

function frame(t) {
  const w = ui.canvas.clientWidth, h = ui.canvas.clientHeight;
  const key = phase !== "live" ? "idle" : speaker === "user" ? "user" : speaker === "bot" ? "bot" : remoteLevel > localLevel ? "bot" : "user";
  const target = [...PALETTE[key][0], ...PALETTE[key][1]];
  col = col.map((c, i) => c + (target[i] - c) * 0.07);
  const lvl = phase === "live" ? Math.max(localLevel, remoteLevel) : 0;
  energy += (Math.min(lvl * 2.4, 1) - energy) * 0.14;
  const rm = reduceMotion();
  spin += rm ? 0.0004 : 0.0025 + energy * 0.02 + (phase === "connecting" ? 0.02 : 0);

  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.44;

  // soft halo
  const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.05);
  g.addColorStop(0, `rgba(${col[3] | 0},${col[4] | 0},${col[5] | 0},${0.16 + energy * 0.22})`);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = spin + (i / N) * Math.PI * 2;
    const pulse = rm ? 0 : Math.sin(t * 0.004 + i * 0.9) * 0.05 * (0.3 + energy);
    const r1 = R * (0.78 + energy * 0.2 + pulse);
    const k = i % 2 ? 0 : 1;
    const c0 = k ? [col[0], col[1], col[2]] : [col[3], col[4], col[5]];
    ctx.fillStyle = `rgba(${c0[0] | 0},${c0[1] | 0},${c0[2] | 0},${0.82 + energy * 0.18})`;
    ray(cx, cy, a, R * 0.14, r1, R * (0.085 + energy * 0.02), 0.9);
  }
  // core
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},1)`;
  ctx.beginPath(); ctx.arc(cx, cy, R * (0.05 + energy * 0.03), 0, Math.PI * 2); ctx.fill();

  requestAnimationFrame(frame);
}

resize();
setPhase("idle");
requestAnimationFrame(frame);
