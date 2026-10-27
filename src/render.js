// Animated page + voice -> one vertical MP4 (1080x1920, 30 fps, H.264 + AAC).
import { chromium } from 'playwright';
import { execFileSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { duration } from './voice.js';
import { stageHtml } from './stage.js';

const FPS = 30;
const PAD = 0.3; // breath after each line
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });

export function timeline(audio) {
  let t = 0.4; // a beat for the beeps before the first word
  const timings = audio.map((file) => {
    const dur = duration(file) + PAD;
    const at = { t0: t, dur };
    t += dur;
    return at;
  });
  return { timings, total: t + 0.4 };
}

// Short sound effects, made with ffmpeg so there is nothing to license.
function makeSfx(dir) {
  const sfx = {
    beep: 'sine=f=1760:d=0.09,volume=0.35,apad=pad_dur=0.08[a];sine=f=1760:d=0.09,volume=0.35[b];[a][b]concat=n=2:v=0:a=1',
    whoosh: 'anoisesrc=d=0.4:c=pink:a=0.5,highpass=f=600,lowpass=f=3500,afade=t=in:d=0.18,afade=t=out:st=0.18:d=0.22,volume=0.35',
    tick: 'sine=f=1320:d=0.07,afade=t=out:d=0.07,volume=0.4[a];sine=f=1980:d=0.1,afade=t=out:d=0.1,volume=0.35,adelay=70[b];[a][b]amix=inputs=2:normalize=0',
    alarm: 'sine=f=880:d=0.16,volume=0.3,apad=pad_dur=0.06[a];sine=f=660:d=0.16,volume=0.3[b];[a][b]concat=n=2:v=0:a=1',
    pop: 'sine=f=520:d=0.08,afade=t=out:d=0.08,volume=0.35',
  };
  const files = {};
  for (const [name, graph] of Object.entries(sfx)) {
    files[name] = join(dir, `sfx-${name}.wav`);
    ff(['-filter_complex', `${graph},aformat=sample_rates=44100:channel_layouts=mono[o]`, '-map', '[o]', files[name]]);
  }
  return files;
}

// A quiet four-on-the-floor beat (kick + off-beat hat), 100 BPM, generated, so no music rights.
function makeBeat(dir, total) {
  const file = join(dir, 'beat.wav');
  const b = 0.6; // seconds per beat
  const kick = `sin(2*PI*(45*mod(t,${b})+55/18*(1-exp(-18*mod(t,${b})))*1))*exp(-7*mod(t,${b}))`;
  const hat = `(random(0)*2-1)*exp(-70*mod(t+${b / 2},${b}))*0.35`;
  ff(['-f', 'lavfi', '-i', `aevalsrc='0.5*${kick}+${hat}':s=44100:d=${total.toFixed(2)}`, '-af', 'highpass=f=35,volume=0.16,afade=t=in:d=0.5,afade=t=out:st=' + Math.max(total - 1, 0).toFixed(2) + ':d=1', file]);
  return file;
}

function mixAudio(script, audio, timings, total, dir, music) {
  const sfx = makeSfx(dir);
  const cues = [{ f: sfx.beep, t: 0.05 }, { f: sfx.beep, t: 0.75 }];
  script.scenes.forEach((sc, i) => {
    const { t0, dur } = timings[i];
    if (i > 0) cues.push({ f: sfx.whoosh, t: Math.max(t0 - 0.15, 0) });
    if (sc.kind === 'safety') cues.push({ f: sfx.alarm, t: t0 + 0.05 });
    if (sc.kind === 'step') cues.push({ f: sfx.tick, t: t0 + Math.max(dur - 0.45, 0.55) });
    if (sc.kind === 'outro') cues.push({ f: sfx.pop, t: t0 + 1.2 });
  });
  const inputs = [];
  const parts = [];
  audio.forEach((file, i) => { inputs.push('-i', file); parts.push({ t: timings[i].t0 + 0.1, gain: 1 }); });
  cues.forEach((c) => { inputs.push('-i', c.f); parts.push({ t: c.t, gain: 1 }); });
  if (music) { inputs.push('-i', makeBeat(dir, total)); parts.push({ t: 0, gain: 1 }); }
  const chains = parts.map((p, i) => `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round(p.t * 1000)}[p${i}]`);
  const out = join(dir, 'mix.wav');
  ff([...inputs, '-filter_complex', `${chains.join(';')};${parts.map((_, i) => `[p${i}]`).join('')}amix=inputs=${parts.length}:duration=longest:normalize=0,atrim=0:${total.toFixed(2)},alimiter=limit=0.9[a]`, '-map', '[a]', out]);
  return out;
}

export async function renderVideo(script, theme, audio, dir, outFile, { music = true } = {}) {
  const { timings, total } = timeline(audio);
  const html = join(dir, 'stage.html');
  writeFileSync(html, stageHtml(script, theme, timings, total));
  const mix = mixAudio(script, audio, timings, total, dir, music);

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', (m) => m.type() === 'warning' && console.warn(m.text()));
  await page.goto(pathToFileURL(resolve(html)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const enc = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', mix,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => enc.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))));
  const frames = Math.ceil(total * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 90 });
    if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r));
  }
  enc.stdin.end();
  await done;
  await browser.close();
  return total;
}
