#!/usr/bin/env node
// Usage: node bin/make-short.js ac/lg/ch38 [--voice edge|silent|dir] [--voice-dir path] [--theme device|cream|teal] [--no-music]
//        [--guides <folder of guide JSON> | --guides-url <url>] [--out out]
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildScript } from '../src/script.js';
import { buildMeta } from '../src/meta.js';
import { themeFor, THEMES } from '../src/stage.js';
import { makeVoice, speak, duration } from '../src/voice.js';
import { renderVideo } from '../src/render.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const id = args.find((a) => !a.startsWith('--') && a.split('/').length === 3 && !args[args.indexOf(a) - 1]?.startsWith('--'));
if (!id) { console.error('Give a guide id like ac/lg/ch38'); process.exit(1); }

const [appliance, brand, code] = id.toLowerCase().split('/');
const guides = opt('guides', process.env.FD_GUIDES || '../faultdecode/src/data/codes');
const guidesUrl = opt('guides-url', process.env.FD_GUIDES_URL);

async function loadGuide() {
  if (guidesUrl) {
    // Live site first; if it is not up yet, the snapshot in data/ (copied from the site's guides).
    let all;
    try {
      const res = await fetch(guidesUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      all = await res.json();
    } catch (e) {
      console.warn(`${guidesUrl} failed (${e.message}), using data/guides.json`);
      all = JSON.parse(readFileSync(new URL('../data/guides.json', import.meta.url), 'utf8'));
    }
    const g = all.find((x) => x.appliance === appliance && x.brand === brand && x.code.toLowerCase() === code);
    if (!g) throw new Error(`${id} not in ${guidesUrl}`);
    return g;
  }
  const file = join(guides, `${appliance}-${brand}-${code}.json`);
  if (!existsSync(file)) throw new Error(`no guide file ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const guide = await loadGuide();
for (const k of ['code', 'brandName', 'applianceName', 'glance', 'hindi', 'sources', 'checked']) {
  if (!guide[k]) throw new Error(`guide ${id} has no ${k}: not ready for a Short`);
}
if (!guide.sources.length) throw new Error(`guide ${id} has no official source: not ready for a Short`);

const out = join(opt('out', 'out'), `${appliance}-${brand}-${code}`);
const work = join(out, 'work');
mkdirSync(work, { recursive: true });

const mode = opt('voice', 'edge');
// With a real voice, choose how many steps fit by measuring the spoken lines.
let script = buildScript(guide);
if (mode === 'edge') script = buildScript(guide, (text) => duration(speak(text, script.seed, work)));
const theme = opt('theme', themeFor(script.seed));
if (!THEMES[theme]) throw new Error(`unknown theme ${theme}`);
console.log(`${id}: ${script.scenes.length} scenes, ${script.stepsShown}/${guide.hindi.steps.length} steps, theme ${theme}, voice ${mode}`);
const audio = makeVoice(script, mode, work, opt('voice-dir'));
const secs = await renderVideo(script, theme, audio, work, join(out, 'short.mp4'), { music: !args.includes('--no-music') });

const meta = buildMeta(guide, script);
writeFileSync(join(out, 'title.txt'), meta.title + '\n');
writeFileSync(join(out, 'description.txt'), meta.description + '\n');
writeFileSync(join(out, 'tags.txt'), meta.tags.join(', ') + '\n');
writeFileSync(join(out, 'script.json'), JSON.stringify({ id, theme, voice: mode, seconds: +secs.toFixed(1), scenes: script.scenes }, null, 2));
const warn = secs < 25 || secs > 40 ? `  WARNING: ${secs.toFixed(1)}s is outside 25-40s` : '';
console.log(`done: ${join(out, 'short.mp4')} (${secs.toFixed(1)}s)${warn}`);
