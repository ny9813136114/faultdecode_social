#!/usr/bin/env node
// Usage: node bin/make-short.js ac/lg/ch38 [--format meaning|danger|quiz|story] [--voice edge|silent|dir] [--voice-dir path]
//        [--theme studio|paper|device|cream|teal] [--no-music]
//        [--guides <folder of guide JSON> | --guides-url <url>] [--out out]
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadGuides } from '../src/guides.js';
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

const all = await loadGuides(guidesUrl, guides);
const guide = all.find((x) => x.appliance === appliance && x.brand === brand && x.code.toLowerCase() === code);
if (!guide) throw new Error(`no guide ${id}`);
for (const k of ['code', 'brandName', 'applianceName', 'glance', 'hindi', 'sources', 'checked']) {
  if (!guide[k]) throw new Error(`guide ${id} has no ${k}: not ready for a Short`);
}
if (!guide.sources.length) throw new Error(`guide ${id} has no official source: not ready for a Short`);

const out = join(opt('out', 'out'), `${appliance}-${brand}-${code}`);
const work = join(out, 'work');
mkdirSync(work, { recursive: true });

const mode = opt('voice', 'edge');
// With a real voice, choose how many steps fit by measuring the spoken lines.
const sopts = { format: opt('format'), guides: all };
let script = buildScript(guide, undefined, sopts);
if (mode === 'edge') script = buildScript(guide, (text) => duration(speak(text, script.seed, work)), sopts);
const theme = opt('theme', themeFor(script.seed));
if (!THEMES[theme]) throw new Error(`unknown theme ${theme}`);
console.log(`${id} [${script.format}]: ${script.scenes.length} scenes, ${script.stepsShown}/${guide.hindi.steps.length} steps, theme ${theme}, voice ${mode}`);
const audio = makeVoice(script, mode, work, opt('voice-dir'));
const secs = await renderVideo(script, theme, audio, work, join(out, 'short.mp4'), { music: !args.includes('--no-music') });

const meta = buildMeta(guide, script);
writeFileSync(join(out, 'title.txt'), meta.title + '\n');
writeFileSync(join(out, 'description.txt'), meta.description + '\n');
writeFileSync(join(out, 'tags.txt'), meta.tags.join(', ') + '\n');
writeFileSync(join(out, 'script.json'), JSON.stringify({ id, format: script.format, wrong: script.wrong, theme, voice: mode, seconds: +secs.toFixed(1), scenes: script.scenes }, null, 2));
const warn = secs < 25 || secs > 52 ? `  WARNING: ${secs.toFixed(1)}s is outside 25-52s` : '';
console.log(`done: ${join(out, 'short.mp4')} (${secs.toFixed(1)}s)${warn}`);
