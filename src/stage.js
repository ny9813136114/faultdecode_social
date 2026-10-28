// The whole Short as one animated HTML page. Chromium renders it frame by frame:
// window.seek(t) puts every scene and CSS animation at time t (seconds), so the
// video is the same on every run and every machine.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = (pkg, file) => pathToFileURL(join(root, 'node_modules/@fontsource', pkg, 'files', file)).href;
const mark = `data:image/svg+xml;base64,${readFileSync(join(root, 'assets/favicon.svg')).toString('base64')}`;

// Looks. "studio" (black) and "paper" (light grey) are the main ones: calm, one idea per
// screen, big type, soft motion, Apple keynote style. The first three are the older,
// louder looks, kept for --theme. Colours follow faultdecode.com (src/styles/site.css).
export const THEMES = {
  device: { bg: '#0b1310', blob1: '#0e4d4a', blob2: '#3a2a07', blob3: '#123d2a', card: 'rgba(20,29,25,.92)', line: '#2a3631', ink: '#e6eee9', muted: '#9aa8a0', accent: '#f4a81d', hi: '#ffffff', grid: 'rgba(157,255,182,.05)' },
  cream: { bg: '#fbf6ec', blob1: '#f9dfa6', blob2: '#cfe6df', blob3: '#ffe9c2', card: 'rgba(255,255,255,.94)', line: '#ece3d2', ink: '#1d2321', muted: '#5f6964', accent: '#0e4d4a', hi: '#0e4d4a', grid: 'rgba(14,77,74,.06)' },
  teal: { bg: '#0b3d3a', blob1: '#137a72', blob2: '#7a5208', blob3: '#0e5a55', card: 'rgba(10,52,49,.92)', line: '#1f7a74', ink: '#eef7f4', muted: '#bfe0d8', accent: '#f4a81d', hi: '#ffffff', grid: 'rgba(255,255,255,.05)' },
  studio: { calm: true, bg: '#000000', blob1: '#1c1c1e', blob2: '#000', blob3: '#000', card: 'rgba(255,255,255,.07)', line: 'rgba(255,255,255,.14)', ink: '#f5f5f7', muted: '#86868b', accent: '#f4a81d', hi: '#f5f5f7', grid: 'transparent', grad: 'linear-gradient(180deg,#ffffff 20%,#a1a1a6)' },
  paper: { calm: true, bg: '#f5f5f7', blob1: '#ffffff', blob2: '#f5f5f7', blob3: '#f5f5f7', card: 'rgba(255,255,255,.9)', line: 'rgba(0,0,0,.08)', ink: '#1d1d1f', muted: '#6e6e73', accent: '#0e4d4a', hi: '#1d1d1f', grid: 'transparent', grad: 'linear-gradient(180deg,#1d1d1f 30%,#515154)' },
};
export const themeFor = (seed) => ['studio', 'paper'][seed % 2];

// One colour per format, so a viewer can tell the series apart at a glance.
export const FORMAT_GLOW = { meaning: '#f4a81d', danger: '#ff453a', quiz: '#bf5af2', story: '#30d158' };

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

// Words as spans for the karaoke highlight. Each word gets a share of the line's
// time by its length, which tracks speech closely enough for Hindi.
function karaoke(text, t0, dur) {
  const words = text.trim().split(/\s+/);
  const weight = words.map((w) => w.length + 2);
  const total = weight.reduce((a, b) => a + b, 0);
  let at = t0 + 0.15;
  const span = Math.max(dur - 0.35, 0.5);
  return words
    .map((w, i) => {
      const s = `<span class="w" data-w="${at.toFixed(3)}">${esc(w)}</span>`;
      at += (span * weight[i]) / total;
      return s;
    })
    .join(' ');
}

// Simple drawings of the machine, with the code on its display.
function machine(c) {
  const code = esc(c.code);
  if (c.appliance === 'ac') {
    return `<svg viewBox="0 0 760 420" class="machine">
      <rect x="20" y="40" width="720" height="230" rx="46" fill="#f7f9f8" stroke="#cfd8d3" stroke-width="6"/>
      <rect x="20" y="200" width="720" height="70" rx="0" fill="#e6ece9"/>
      <rect x="20" y="230" width="720" height="40" rx="20" fill="#dfe6e2"/>
      <path d="M70 222 H690" stroke="#c4cfc9" stroke-width="6" stroke-linecap="round"/>
      <rect x="470" y="86" width="200" height="88" rx="14" fill="#07100b"/>
      <text x="570" y="146" text-anchor="middle" class="svgcode blink">${code}</text>
      <circle cx="440" cy="130" r="10" class="led"/>
      <g class="air"><path d="M140 300 q30 40 0 80" /><path d="M300 300 q30 40 0 80"/><path d="M460 300 q30 40 0 80"/><path d="M620 300 q30 40 0 80"/></g>
    </svg>`;
  }
  if (c.appliance === 'washing-machine') {
    return `<svg viewBox="0 0 520 600" class="machine tall">
      <rect x="20" y="20" width="480" height="560" rx="40" fill="#f7f9f8" stroke="#cfd8d3" stroke-width="6"/>
      <rect x="20" y="20" width="480" height="110" rx="40" fill="#e6ece9"/>
      <circle cx="90" cy="75" r="30" fill="#cfd8d3"/>
      <rect x="250" y="42" width="200" height="66" rx="12" fill="#07100b"/>
      <text x="350" y="92" text-anchor="middle" class="svgcode blink">${code}</text>
      <circle cx="210" cy="75" r="9" class="led"/>
      <circle cx="260" cy="350" r="170" fill="#dfe6e2" stroke="#b9c5bf" stroke-width="14"/>
      <circle cx="260" cy="350" r="130" fill="#9fb8c9"/>
      <g class="drum"><ellipse cx="220" cy="320" rx="50" ry="30" fill="#f4a81d" opacity=".8"/><ellipse cx="300" cy="390" rx="55" ry="28" fill="#0e4d4a" opacity=".7"/><ellipse cx="300" cy="300" rx="30" ry="20" fill="#fff" opacity=".7"/></g>
    </svg>`;
  }
  return `<svg viewBox="0 0 560 560" class="machine tall">
    <rect x="30" y="20" width="500" height="520" rx="36" fill="#2b3531" stroke="#46534d" stroke-width="6"/>
    <rect x="80" y="80" width="400" height="150" rx="18" fill="#07100b"/>
    <text x="280" y="185" text-anchor="middle" class="svgcode big blink">${code}</text>
    <circle cx="110" cy="290" r="14" class="led"/>
    <g fill="#46534d"><rect x="90" y="340" width="110" height="70" rx="14"/><rect x="225" y="340" width="110" height="70" rx="14"/><rect x="360" y="340" width="110" height="70" rx="14"/></g>
    <circle cx="280" cy="470" r="34" fill="#46534d"/>
  </svg>`;
}

const warnIcon = `<svg viewBox="0 0 100 90" class="warn"><path d="M50 4 L96 86 H4 Z" fill="#ff4d3d" stroke="#ffd5cd" stroke-width="4" stroke-linejoin="round"/><rect x="45" y="30" width="10" height="32" rx="4" fill="#fff"/><circle cx="50" cy="73" r="6" fill="#fff"/></svg>`;
const tick = `<svg viewBox="0 0 60 60" class="tick"><circle cx="30" cy="30" r="27" fill="#4ade80"/><path d="M17 31 L26 40 L44 21" fill="none" stroke="#0b1310" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" class="tickpath"/></svg>`;

// Quiz options A and B. With `right`, the answer is marked and the other is struck out.
const options = (opts, right) => `<div class="opts">${opts.map((o, i) => `<div class="opt${right === undefined ? '' : i === right ? ' right' : ' wrong'}"><b>${'AB'[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>`;

function sceneHtml(scene, s, timing) {
  const c = s.guide;
  const { t0, dur } = timing;
  const k = (text) => karaoke(text, t0, dur);
  switch (scene.kind) {
    case 'hook':
      return `<div class="pill pop">${esc(c.brandName)} ${esc(c.applianceName)}</div>
        <div class="shake">${machine(c)}</div>
        <div class="slam">${esc(c.code)}<span class="q">?</span></div>
        <h1 class="cap">${k(scene.caption)}</h1>`;
    case 'meaning':
      return `<div class="sticker">MATLAB</div>
        <h1 class="problem rise">${esc(scene.caption)}</h1>
        <div class="card hindi rise2">${k(scene.hindi)}</div>`;
    case 'alert':
      return `<div class="warnwrap">${warnIcon}</div>
        <div class="slam">${esc(c.code)}</div>
        <h1 class="cap big">${k(scene.caption)}</h1>`;
    case 'quiz':
      return `<div class="sticker">QUIZ</div>
        <div class="slam small">${esc(c.code)}<span class="q">?</span></div>
        <h1 class="cap">${k(scene.caption)}</h1>
        ${options(scene.options)}`;
    case 'countdown':
      return `<div class="count" style="--cd:${(dur / 3).toFixed(2)}s"><span>3</span><span>2</span><span>1</span></div>
        ${options(scene.options)}`;
    case 'reveal':
      return `<div class="sticker">JAWAB</div>
        ${options(scene.options, scene.right)}
        <div class="card hindi rise2">${k(scene.hindi)}</div>`;
    case 'safety':
      return `<div class="warnwrap">${warnIcon}</div>
        <div class="sticker red">SAFETY</div>
        <h1 class="cap big">${k(scene.caption)}</h1>`;
    case 'step':
      return `<div class="stepnum"><span class="n">${scene.n}</span><span class="of">/${scene.of}</span></div>
        <div class="dots">${Array.from({ length: scene.of }, (_, j) => `<i class="${j + 1 < scene.n ? 'on' : j + 1 === scene.n ? 'now' : ''}"></i>`).join('')}</div>
        <div class="card hindi slidein">${k(scene.hindi)}</div>
        <div class="tickwrap" style="--td:${Math.max(dur - 0.6, 0.4).toFixed(2)}s">${tick}</div>`;
    case 'outro':
      return `<h1 class="rise">${scene.more ? `Baaki ${scene.more} ${scene.more === 1 ? 'step' : 'steps'} website pe` : 'Poori guide website pe'}</h1>
        <div class="sticker">English + हिंदी</div>
        <div class="card url"><span class="type" data-text="${esc(scene.caption)}"></span><span class="cursor">|</span></div>
        <div class="muted rise2">Official brand source se checked · ${esc(c.checked)}</div>
        <div class="comment pop2">Apna code comment karo <span class="arrow">➜</span></div>`;
  }
  throw new Error(`unknown scene ${scene.kind}`);
}

function css(t, glow) {
  return `
@font-face { font-family: Inter; font-weight: 600; src: url(${font('inter', 'inter-latin-600-normal.woff2')}); }
@font-face { font-family: Inter; font-weight: 800; src: url(${font('inter', 'inter-latin-800-normal.woff2')}); }
@font-face { font-family: Archivo; font-weight: 800; src: url(${font('archivo', 'archivo-latin-800-normal.woff2')}); }
@font-face { font-family: Archivo; font-weight: 900; src: url(${font('archivo', 'archivo-latin-900-normal.woff2')}); }
@font-face { font-family: Plex; font-weight: 500; src: url(${font('ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2')}); }
@font-face { font-family: Mono; src: url(${font('share-tech-mono', 'share-tech-mono-latin-400-normal.woff2')}); }
@font-face { font-family: Deva; font-weight: 500; src: url(${font('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-500-normal.woff2')}); }
@font-face { font-family: Deva; font-weight: 700; src: url(${font('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-700-normal.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1920px; background: ${t.bg}; color: ${t.ink}; font-family: Plex, Deva, sans-serif; overflow: hidden; position: relative; }

/* Moving background: three slow colour blobs, a drifting grid and rising sparks. */
.bg { position: absolute; inset: 0; overflow: hidden; }
.blob { position: absolute; width: 1100px; height: 1100px; border-radius: 50%; opacity: .75; }
.b1 { background: radial-gradient(circle, ${t.blob1} 0%, transparent 65%); left: -400px; top: -200px; animation: drift1 14s ease-in-out infinite alternate; }
.b2 { background: radial-gradient(circle, ${t.blob2} 0%, transparent 65%); right: -500px; top: 700px; animation: drift2 17s ease-in-out infinite alternate; }
.b3 { background: radial-gradient(circle, ${t.blob3} 0%, transparent 65%); left: -200px; bottom: -600px; animation: drift1 19s ease-in-out infinite alternate-reverse; }
@keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(380px,300px) scale(1.25); } }
@keyframes drift2 { from { transform: translate(0,0) scale(1.1); } to { transform: translate(-420px,-380px) scale(.9); } }
.grid { position: absolute; inset: -120px; background-image: linear-gradient(${t.grid} 2px, transparent 2px), linear-gradient(90deg, ${t.grid} 2px, transparent 2px); background-size: 120px 120px; animation: gridmove 6s linear infinite; }
@keyframes gridmove { to { transform: translate(120px,120px); } }
.spark { position: absolute; bottom: -40px; width: 14px; height: 14px; border-radius: 50%; background: ${t.accent}; opacity: .5; animation: rise linear infinite; }
@keyframes rise { from { transform: translateY(0); opacity: 0; } 15% { opacity: .55; } to { transform: translateY(-2100px); opacity: 0; } }
.danger { position: absolute; inset: 0; background: radial-gradient(circle at 50% 45%, transparent 35%, rgba(255,40,20,.55)); opacity: 0; }

.top { position: absolute; left: 64px; top: 96px; display: flex; align-items: center; gap: 16px; font-family: Archivo; font-weight: 800; font-size: 44px; color: ${t.hi}; z-index: 5; }
.top img { width: 70px; height: 70px; } .top b { color: ${t.accent}; }
.progress { position: absolute; left: 0; top: 0; height: 16px; background: #f4a81d; z-index: 6; box-shadow: 0 0 18px #f4a81d; }
.lcd { position: absolute; right: 150px; top: 84px; background: #07100b; border: 4px solid #2a3631; border-radius: 22px; padding: 10px 26px; font-family: Mono; font-size: 64px; color: #9dffb6; text-shadow: 0 0 20px rgba(120,255,160,.7); letter-spacing: 6px; z-index: 5; }

/* Shorts buttons cover the bottom ~380px and the right ~140px: text stays out. */
.scene { position: absolute; left: 64px; right: 150px; top: 230px; bottom: 420px; display: flex; flex-direction: column; justify-content: center; gap: 46px; visibility: hidden; }
h1 { font-family: Archivo, Deva; font-weight: 900; font-size: calc(104px * var(--k, 1)); line-height: 1.05; color: ${t.hi}; letter-spacing: -1px; }
h1.big { font-size: calc(118px * var(--k, 1)); color: #fff; }
.card { background: ${t.card}; border: 3px solid ${t.line}; border-radius: 40px; padding: 46px 50px; box-shadow: 0 30px 80px rgba(0,0,0,.25); }
.hindi { font-family: Plex, Deva; font-weight: 700; font-size: calc(70px * var(--k, 1)); line-height: 1.45; }
.w { opacity: .35; display: inline-block; }
.w.on { opacity: 1; }
.w.now { opacity: 1; color: #f4a81d; transform: scale(1.08); }
.muted { font-size: 44px; color: ${t.muted}; }

.pill { align-self: flex-start; font-family: Archivo; font-weight: 800; font-size: 46px; letter-spacing: 3px; text-transform: uppercase; background: ${t.accent}; color: ${t.accent === '#f4a81d' ? '#1d2321' : '#fff'}; padding: 14px 30px; border-radius: 60px; }
.machine { width: 100%; height: auto; filter: drop-shadow(0 30px 40px rgba(0,0,0,.35)); }
.machine.tall { width: 62%; align-self: center; }
.svgcode { font-family: Mono; font-size: 64px; fill: #ff5a46; }
.svgcode.big { font-size: 110px; }
.led { fill: #ff4d3d; animation: blink .5s steps(1) infinite; }
.blink { animation: blink .5s steps(1) infinite; }
@keyframes blink { 50% { opacity: .15; } }
.air path { fill: none; stroke: ${t.muted}; stroke-width: 8; stroke-linecap: round; opacity: .5; animation: airflow 1.2s ease-in-out infinite; }
@keyframes airflow { 0% { transform: translateY(-20px); opacity: 0; } 50% { opacity: .6; } 100% { transform: translateY(30px); opacity: 0; } }
.drum { transform-origin: 260px 350px; animation: spin 1.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.shake { display: flex; justify-content: center; animation: shake .45s ease-in-out 3; animation-delay: .25s; }
@keyframes shake { 20% { transform: translateX(-16px) rotate(-1.5deg); } 40% { transform: translateX(14px) rotate(1.2deg); } 60% { transform: translateX(-10px); } 80% { transform: translateX(6px); } }
.slam { font-family: Mono; font-size: 240px; line-height: 1; color: #9dffb6; text-shadow: 0 0 40px rgba(120,255,160,.8); letter-spacing: 10px; animation: slam .5s cubic-bezier(.2,1.6,.4,1) both; animation-delay: .45s; }
.slam .q { color: #f4a81d; text-shadow: 0 0 30px rgba(244,168,29,.8); display: inline-block; animation: bob .9s ease-in-out infinite; }
@keyframes slam { from { transform: scale(2.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bob { 50% { transform: translateY(-24px) rotate(8deg); } }
.pop { animation: pop .45s cubic-bezier(.2,1.6,.4,1) both; }
.pop2 { animation: pop .45s cubic-bezier(.2,1.6,.4,1) both; animation-delay: 1.2s; }
@keyframes pop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.sticker { align-self: flex-start; font-family: Archivo; font-weight: 900; font-size: 54px; letter-spacing: 5px; background: #f4a81d; color: #1d2321; padding: 12px 30px; border-radius: 16px; transform: rotate(-4deg); animation: stick .5s cubic-bezier(.2,1.6,.4,1) both; }
.sticker.red { background: #ff4d3d; color: #fff; }
@keyframes stick { from { transform: rotate(-30deg) scale(0); } to { transform: rotate(-4deg) scale(1); } }
.rise { animation: riseIn .55s cubic-bezier(.2,1,.3,1) both; animation-delay: .15s; }
.rise2 { animation: riseIn .55s cubic-bezier(.2,1,.3,1) both; animation-delay: .4s; }
@keyframes riseIn { from { transform: translateY(80px); opacity: 0; } to { transform: none; opacity: 1; } }
.slidein { animation: slideIn .5s cubic-bezier(.2,1,.3,1) both; animation-delay: .2s; }
@keyframes slideIn { from { transform: translateX(900px) rotate(6deg); } to { transform: none; } }
.warnwrap { align-self: center; animation: pop .5s cubic-bezier(.2,1.6,.4,1) both; }
.warn { width: 330px; animation: pulse .6s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(1.12); filter: drop-shadow(0 0 40px #ff4d3d); } }
.stepnum { font-family: Archivo; font-weight: 900; color: ${t.hi}; line-height: .9; animation: flip .5s cubic-bezier(.2,1.4,.4,1) both; }
.stepnum .n { font-size: 260px; color: #f4a81d; text-shadow: 0 0 40px rgba(244,168,29,.5); } .stepnum .of { font-size: 110px; opacity: .6; }
@keyframes flip { from { transform: perspective(800px) rotateX(90deg); opacity: 0; } to { transform: none; opacity: 1; } }
.dots { display: flex; gap: 16px; } .dots i { width: 90px; height: 16px; border-radius: 8px; background: ${t.line}; } .dots i.on { background: #4ade80; } .dots i.now { background: #f4a81d; }
.tickwrap { align-self: flex-end; margin-top: -30px; animation: pop .4s cubic-bezier(.2,1.6,.4,1) both; animation-delay: var(--td); }
.tick { width: 150px; }
.tickpath { stroke-dasharray: 50; stroke-dashoffset: 50; animation: draw .35s ease-out forwards; animation-delay: calc(var(--td) + .15s); }
@keyframes draw { to { stroke-dashoffset: 0; } }
.url { font-family: Mono; font-size: 46px; color: ${t.hi}; word-break: break-all; }
.cursor { color: #f4a81d; animation: blink .8s steps(1) infinite; }
.comment { align-self: flex-end; font-family: Archivo; font-weight: 800; font-size: 50px; background: ${t.hi}; color: ${t.bg}; padding: 20px 34px; border-radius: 60px; }
.arrow { display: inline-block; animation: nudge .6s ease-in-out infinite; }
@keyframes nudge { 50% { transform: translateX(22px); } }

/* Quiz */
.opts { display: flex; flex-direction: column; gap: 26px; }
.opt { display: flex; align-items: center; gap: 30px; background: ${t.card}; border: 3px solid ${t.line}; border-radius: 34px; padding: 30px 36px; font-weight: 700; font-size: calc(54px * var(--k, 1)); line-height: 1.2; }
.opt b { flex: none; width: 92px; height: 92px; border-radius: 50%; display: grid; place-items: center; font-family: Archivo; font-weight: 900; font-size: 54px; background: ${glow}; color: #fff; }
.opt.right { border-color: #30d158; box-shadow: 0 0 0 6px rgba(48,209,88,.25); animation: pop .45s cubic-bezier(.2,1.6,.4,1) both; animation-delay: .2s; }
.opt.right b { background: #30d158; }
.opt.wrong { opacity: .35; text-decoration: line-through; }
.opt.wrong b { background: ${t.muted}; }
.count { position: relative; height: 420px; }
.count span { position: absolute; inset: 0; display: grid; place-items: center; font-family: Archivo; font-weight: 900; font-size: 400px; color: ${glow}; opacity: 0; animation: countin var(--cd) ease-out both; }
.count span:nth-child(2) { animation-delay: var(--cd); } .count span:nth-child(3) { animation-delay: calc(var(--cd) * 2); }
@keyframes countin { 0% { transform: scale(1.8); opacity: 0; } 20% { transform: scale(1); opacity: 1; } 80% { opacity: 1; } 100% { transform: scale(.8); opacity: 0; } }
.slam.small { font-size: 180px; }
${t.calm ? calmCss(t, glow) : ''}`;
}

// The calm look: no grid or sparks, one soft glow, big tight type, blur-in motion
// instead of bounces, small spaced labels instead of stickers.
function calmCss(t, glow) {
  const dark = t.bg === '#000000';
  const smooth = 'cubic-bezier(.22,1,.36,1)';
  return `
body { font-family: Inter, Deva, sans-serif; }
.grid, .spark, .b2, .b3 { display: none; }
.b1 { width: 1500px; height: 1500px; left: -210px; top: 200px; opacity: ${dark ? '.55' : '.35'}; background: radial-gradient(circle, ${glow} 0%, transparent 60%); animation: breathe 9s ease-in-out infinite alternate; }
@keyframes breathe { from { transform: translate(-80px,-60px) scale(.9); } to { transform: translate(80px,120px) scale(1.1); } }
.top { font-family: Inter; font-weight: 600; font-size: 40px; color: ${t.muted}; letter-spacing: -.5px; }
.top img { width: 56px; height: 56px; } .top b { color: ${t.hi}; font-weight: 600; }
.progress { height: 8px; background: ${glow}; box-shadow: none; }
.lcd { background: transparent; border: 2px solid ${t.line}; color: ${t.hi}; text-shadow: none; font-size: 54px; }
h1 { font-family: Inter, Deva; font-weight: 800; letter-spacing: -4px; line-height: 1.02; background: ${t.grad}; -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: 8px; }
h1.big { color: transparent; }
h1 .w.now { color: ${glow}; -webkit-text-fill-color: ${glow}; }
.card { background: ${t.card}; border: 2px solid ${t.line}; border-radius: 48px; box-shadow: ${dark ? 'none' : '0 20px 60px rgba(0,0,0,.08)'}; }
.hindi { font-family: Inter, Deva; font-weight: 700; color: ${t.ink}; }
.w { opacity: .28; } .w.now { color: ${glow}; transform: none; }
.pill, .sticker { align-self: flex-start; background: none; color: ${glow}; font-family: Inter; font-weight: 600; font-size: 42px; letter-spacing: 8px; text-transform: uppercase; padding: 0; border-radius: 0; transform: none; animation: blurin .9s ${smooth} both; }
.sticker.red { background: none; color: #ff453a; }
.slam { font-family: Inter; font-weight: 800; font-size: 300px; letter-spacing: -12px; color: transparent; background: ${t.grad}; -webkit-background-clip: text; background-clip: text; text-shadow: none; animation: zoomin 1.6s ${smooth} both; animation-delay: .1s; }
.slam .q { color: ${glow}; -webkit-text-fill-color: ${glow}; text-shadow: none; animation: none; }
.slam.small { font-size: 220px; }
@keyframes zoomin { from { transform: scale(1.25); opacity: 0; filter: blur(30px); } to { transform: scale(1); opacity: 1; filter: none; } }
@keyframes blurin { from { opacity: 0; filter: blur(24px); transform: translateY(30px); } to { opacity: 1; filter: none; transform: none; } }
.pop, .pop2, .rise, .rise2, .warnwrap, .tickwrap { animation-name: blurin; animation-duration: .9s; animation-timing-function: ${smooth}; }
.slidein { animation: blurin .9s ${smooth} both; animation-delay: .15s; }
.shake { animation: none; }
.machine { filter: ${dark ? 'drop-shadow(0 40px 80px rgba(0,0,0,.8))' : 'drop-shadow(0 30px 50px rgba(0,0,0,.12))'}; animation: blurin 1.2s ${smooth} both; }
.stepnum { font-family: Inter; font-weight: 800; letter-spacing: -8px; animation: blurin .9s ${smooth} both; }
.stepnum .n { color: ${glow}; text-shadow: none; } .stepnum .of { color: ${t.muted}; opacity: 1; }
.dots i { height: 10px; background: ${t.line}; } .dots i.on { background: ${t.hi}; } .dots i.now { background: ${glow}; }
.warn path { fill: #ff453a; stroke: none; }
.comment { font-family: Inter; font-weight: 600; background: ${t.hi}; color: ${t.bg}; }
.cursor { color: ${glow}; }
.opt { border-width: 2px; font-family: Inter, Deva; font-weight: 600; }
.opt b { font-family: Inter; }
.count span { font-family: Inter; font-weight: 800; letter-spacing: -10px; }
.danger { background: radial-gradient(circle at 50% 45%, transparent 45%, rgba(255,69,58,.35)); }`;
}

// timings: [{ t0, dur }] per scene, from the measured voice lines. total = video length.
export function stageHtml(script, theme, timings, total) {
  const t = THEMES[theme];
  const sparks = Array.from({ length: 18 }, (_, i) => {
    const r = (n) => ((script.seed * (i + 3) * n) % 997) / 997;
    return `<i class="spark" style="left:${(r(7) * 1080).toFixed(0)}px;width:${8 + r(11) * 14}px;height:${8 + r(11) * 14}px;animation-duration:${(7 + r(13) * 8).toFixed(1)}s;animation-delay:-${(r(17) * 12).toFixed(1)}s"></i>`;
  }).join('');
  const scenes = script.scenes
    .map((sc, i) => `<section class="scene" data-t0="${timings[i].t0.toFixed(3)}" data-t1="${(timings[i].t0 + timings[i].dur).toFixed(3)}" data-kind="${sc.kind}">${sceneHtml(sc, script, timings[i])}</section>`)
    .join('');
  const glow = t.calm ? FORMAT_GLOW[script.format] || t.accent : t.accent;
  return `<!doctype html><meta charset="utf-8"><style>${css(t, glow)}</style>
<body><div class="bg"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grid"></div>${sparks}<div class="danger"></div></div>
<div class="progress"></div><div class="top"><img src="${mark}">Fault<b>Decode</b></div><div class="lcd">${esc(script.guide.code)}</div>
${scenes}
<script>
const TOTAL = ${total.toFixed(3)};
const scenes = [...document.querySelectorAll('.scene')];
const words = [...document.querySelectorAll('.w')].map((el) => ({ el, at: +el.dataset.w }));
const typer = document.querySelector('.type');
const lcd = document.querySelector('.lcd');
const danger = document.querySelector('.danger');
// Shrink long text until it fits above the Shorts buttons.
for (const s of scenes) {
  s.style.visibility = 'visible';
  let k = 1;
  while (s.scrollHeight > s.clientHeight + 1 && k > 0.55) s.style.setProperty('--k', (k -= 0.05));
  if (k <= 0.55) console.warn('text too long in ' + s.dataset.kind);
  s.style.visibility = 'hidden';
}
const anims = document.getAnimations().map((a) => {
  a.pause();
  const sc = a.effect.target.closest('.scene');
  return { a, t0: sc ? +sc.dataset.t0 : 0 };
});
const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
window.seek = (t) => {
  for (const { a, t0 } of anims) a.currentTime = Math.max(0, t - t0) * 1000;
  let cur = null;
  for (const s of scenes) {
    const t0 = +s.dataset.t0, t1 = +s.dataset.t1;
    // In: rise and fade over 0.3 s. Out: the old scene zooms away over 0.3 s under the new one.
    const show = t >= t0 && t < t1 + 0.3;
    s.style.visibility = show ? 'visible' : 'hidden';
    if (!show) continue;
    if (t < t1) cur = s;
    const pin = ease((t - t0) / 0.3), pout = t >= t1 ? ease((t - t1) / 0.3) : 0;
    s.style.opacity = String(pin * (1 - pout));
    s.style.transform = 'translateY(' + (1 - pin) * 120 + 'px) scale(' + (1 + pout * 0.15) + ')';
  }
  for (const w of words) {
    const next = w.el.nextElementSibling;
    const end = next && next.classList.contains('w') ? +next.dataset.w : w.at + 0.45;
    w.el.className = 'w' + (t >= end ? ' on' : t >= w.at ? ' now' : '');
  }
  if (typer) {
    const sc = typer.closest('.scene');
    const n = Math.floor(Math.max(0, t - +sc.dataset.t0 - 0.3) * 28);
    typer.textContent = typer.dataset.text.slice(0, n);
  }
  // The small display stays hidden on the hook (the big code is on screen there).
  lcd.style.opacity = !cur || ['hook', 'alert', 'quiz'].includes(cur.dataset.kind) ? '0' : '1';
  danger.style.opacity = cur && ['safety', 'alert'].includes(cur.dataset.kind) ? String(0.6 + 0.4 * Math.sin(t * 9)) : '0';
  document.querySelector('.progress').style.width = (Math.min(t / TOTAL, 1) * 1080) + 'px';
};
window.seek(0);
</script></body>`;
}
