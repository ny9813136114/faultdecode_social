// One 1080x1920 PNG per scene, drawn as HTML in Chromium (it shapes Devanagari,
// which satori cannot). Colours and fonts follow faultdecode.com (src/styles/site.css).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const font = (pkg, file) => pathToFileURL(join(root, 'node_modules/@fontsource', pkg, 'files', file)).href;
const mark = `data:image/svg+xml;base64,${readFileSync(join(root, 'assets/favicon.svg')).toString('base64')}`;

// Three looks, picked by the guide's seed, so a row of Shorts does not look stamped out.
export const THEMES = {
  device: { bg: '#0d1411', card: '#141d19', line: '#2a3631', ink: '#e6eee9', muted: '#9aa8a0', accent: '#f4a81d', hi: '#ffffff' },
  cream: { bg: '#fbf6ec', card: '#ffffff', line: '#ece3d2', ink: '#1d2321', muted: '#5f6964', accent: '#0e4d4a', hi: '#0e4d4a' },
  teal: { bg: '#0e4d4a', card: '#12605c', line: '#1f7a74', ink: '#eef7f4', muted: '#bfe0d8', accent: '#f4a81d', hi: '#ffffff' },
};
export const themeFor = (seed) => Object.keys(THEMES)[seed % 3];

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

function css(t) {
  return `
@font-face { font-family: Archivo; font-weight: 800; src: url(${font('archivo', 'archivo-latin-800-normal.woff2')}); }
@font-face { font-family: Plex; font-weight: 500; src: url(${font('ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2')}); }
@font-face { font-family: Mono; src: url(${font('share-tech-mono', 'share-tech-mono-latin-400-normal.woff2')}); }
@font-face { font-family: Deva; font-weight: 500; src: url(${font('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-500-normal.woff2')}); }
@font-face { font-family: Deva; font-weight: 700; src: url(${font('noto-sans-devanagari', 'noto-sans-devanagari-devanagari-700-normal.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1920px; background: ${t.bg}; color: ${t.ink}; font-family: Plex, Deva, sans-serif; overflow: hidden; position: relative; }
/* Shorts UI covers the bottom ~380px and the right ~140px: keep text out of there. */
.wrap { position: absolute; left: 72px; right: 150px; top: 230px; bottom: 420px; display: flex; flex-direction: column; justify-content: center; gap: 52px; }
.glow { position: absolute; inset: 0; background: radial-gradient(900px 700px at 20% 30%, ${t.line}88, transparent 70%); }
.top { position: absolute; left: 72px; top: 110px; display: flex; align-items: center; gap: 18px; font-family: Archivo; font-size: 48px; color: ${t.hi}; }
.top img { width: 76px; height: 76px; }
.top b { color: ${t.accent}; }
.tag { font-family: Archivo; font-size: 40px; letter-spacing: 4px; text-transform: uppercase; color: ${t.accent}; }
.lcd { align-self: flex-start; background: #07100b; border: 5px solid #2a3631; border-radius: 40px; padding: 30px 56px; font-family: Mono; color: #9dffb6; text-shadow: 0 0 28px rgba(120,255,160,.65); letter-spacing: 10px; line-height: 1; }
.big { font-size: 280px; padding: 44px 70px; } .small { font-size: 130px; }
h1 { font-family: Archivo, Deva; font-weight: 800; font-size: calc(100px * var(--k, 1)); line-height: 1.08; color: ${t.hi}; letter-spacing: -1px; }
.card { background: ${t.card}; border: 3px solid ${t.line}; border-radius: 36px; padding: 44px 48px; }
.hindi { font-family: Plex, Deva; font-weight: 500; font-size: calc(64px * var(--k, 1)); line-height: 1.5; }
.cap { font-size: 46px; line-height: 1.3; color: ${t.muted}; }
.lamp { display: inline-block; width: 30px; height: 30px; border-radius: 50%; margin-right: 18px; vertical-align: middle; }
.red { background: #ff4d3d; box-shadow: 0 0 22px #ff4d3d; } .green { background: #4ade80; box-shadow: 0 0 22px #4ade80; }
.safety { background: #2f1712; border-color: #ff7a66; color: #ffd5cd; }
.dots { display: flex; gap: 14px; } .dots i { width: 70px; height: 12px; border-radius: 6px; background: ${t.line}; } .dots i.on { background: ${t.accent}; }
.url { font-family: Mono; font-size: 52px; color: ${t.hi}; word-break: break-all; }`;
}

function body(scene, s, i) {
  const c = s.guide;
  const head = `<div class="top"><img src="${mark}">Fault<b>Decode</b></div><div class="wrap">`;
  const tag = `<div class="tag">${esc(c.brandName)} ${esc(c.applianceName)} error</div>`;
  const lcd = (size) => `<div class="lcd ${size}">${esc(c.code)}</div>`;
  const steps = s.scenes.filter((x) => x.kind === 'step');
  switch (scene.kind) {
    case 'hook':
      return `${head}${tag}${lcd('big')}<h1>${esc(scene.caption)}</h1>`;
    case 'meaning':
      return `${head}${lcd('small')}<div class="tag">Matlab</div><h1>${esc(scene.caption)}</h1><div class="card hindi">${esc(scene.hindi)}</div>`;
    case 'safety':
      return `${head}${lcd('small')}<div class="card safety"><div class="tag" style="color:#ff7a66"><span class="lamp red"></span>Safety</div><h1 style="color:#fff;margin-top:24px">${esc(scene.caption)}</h1></div>`;
    case 'step': {
      const dots = steps.map((x) => `<i class="${x.n <= scene.n ? 'on' : ''}"></i>`).join('');
      return `${head}${lcd('small')}<div class="tag"><span class="lamp green"></span>Step ${scene.n}</div><div class="dots">${dots}</div><div class="card hindi" style="font-size:calc(68px * var(--k, 1))">${esc(scene.hindi)}</div>`;
    }
    case 'outro':
      return `${head}${lcd('small')}<h1>${scene.more ? `Baaki ${scene.more} ${scene.more === 1 ? 'step' : 'steps'} website pe` : 'Poori guide website pe'}</h1><div class="tag">English + हिंदी</div><div class="card url">${esc(scene.caption)}</div><div class="cap">Official brand source se checked · ${esc(c.checked)}</div><div class="cap">Apna code comment kijiye</div>`;
  }
  throw new Error(`unknown scene ${scene.kind} (${i})`);
}

export function sceneHtml(script, i, theme) {
  const t = THEMES[theme];
  return `<!doctype html><meta charset="utf-8"><style>${css(t)}</style><body><div class="glow"></div>${body(script.scenes[i], script, i)}</div></body>`;
}

export async function renderFrames(script, theme, outDir) {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const files = [];
  for (let i = 0; i < script.scenes.length; i++) {
    // Load from a file: an about:blank page may not read the file:// fonts.
    const html = join(outDir, `scene-${i + 1}.html`);
    writeFileSync(html, sceneHtml(script, i, theme));
    await page.goto(pathToFileURL(resolve(html)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // Long text: shrink it until it fits above the Shorts buttons.
    const k = await page.evaluate(() => {
      const w = document.querySelector('.wrap');
      let k = 1;
      while (w.scrollHeight > w.clientHeight + 1 && k > 0.55) document.body.style.setProperty('--k', (k -= 0.05));
      return k;
    });
    if (k <= 0.55) console.warn(`scene ${i + 1}: text still too long for the frame`);
    const file = join(outDir, `scene-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }
  await browser.close();
  return files;
}
