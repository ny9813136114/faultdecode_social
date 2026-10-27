// Frames + voice -> one vertical MP4 (1080x1920, 30 fps, H.264 + AAC).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { duration } from './voice.js';

const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });
const PAD = 0.35; // breath after each line

export function renderVideo(frames, audio, outDir, outFile) {
  const parts = [];
  frames.forEach((png, i) => {
    const d = duration(audio[i]) + PAD;
    const part = join(outDir, `part-${String(i + 1).padStart(2, '0')}.mp4`);
    // Slow push-in (about 3%) and a short fade, so stills do not feel frozen.
    const zoom = `scale=1080*(1+0.03*t/${d.toFixed(2)}):-1:eval=frame,crop=1080:1920`;
    const vf = `${zoom},fade=t=in:st=0:d=0.15,format=yuv420p`;
    // Two short beeps under the first scene, like the appliance showing the code.
    const af = i === 0
      ? '[1:a]apad[v];sine=f=1760:d=0.09,volume=0.25,apad=pad_dur=0.09[b1];sine=f=1760:d=0.09,volume=0.25[b2];[b1][b2]concat=n=2:v=0:a=1,adelay=0[b];[b][v]amix=inputs=2:duration=longest:normalize=0[a]'
      : '[1:a]apad[a]';
    ff(['-loop', '1', '-framerate', '30', '-i', png, '-i', audio[i], '-filter_complex', `[0:v]${vf}[vo];${af}`,
      '-map', '[vo]', '-map', '[a]', '-t', d.toFixed(2), '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '1', part]);
    parts.push(part);
  });
  const list = join(outDir, 'parts.txt');
  writeFileSync(list, parts.map((p) => `file '${resolve(p)}'`).join('\n'));
  const total = parts.reduce((t, p) => t + duration(p), 0);
  // Thin marigold progress line along the top.
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-filter_complex',
    `color=c=0xf4a81d:s=1080x14:r=30[bar];[0:v][bar]overlay=x='-W+W*t/${total.toFixed(2)}':y=0:shortest=1[v]`, '-map', '[v]', '-map', '0:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', outFile]);
  return total;
}
