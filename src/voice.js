// One audio file per scene.
//   edge:   Microsoft Edge neural voices via the edge-tts CLI (pip install edge-tts). Needs internet.
//   silent: silence as long as the estimated speech, for checking layout and timing.
//   dir:    your own recordings, scene-01.mp3, scene-02.mp3 ... in --voice-dir.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { estimateSeconds } from './script.js';

// Alternate a female and a male Hindi voice by guide, for variety.
const VOICES = ['hi-IN-SwaraNeural', 'hi-IN-MadhurNeural'];

export const duration = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

// Speak one line with edge-tts into a cache, so lines can be measured before the script is final.
export function speak(text, seed, cacheDir) {
  const voice = VOICES[seed % VOICES.length];
  const file = join(cacheDir, `tts-${createHash('sha1').update(voice + text).digest('hex').slice(0, 12)}.mp3`);
  if (!existsSync(file)) execFileSync('edge-tts', ['--voice', voice, '--rate=+12%', '--text', text, '--write-media', file], { stdio: 'pipe' });
  return file;
}

export function makeVoice(script, mode, outDir, voiceDir) {
  return script.scenes.map((scene, i) => {
    const name = `scene-${String(i + 1).padStart(2, '0')}`;
    if (mode === 'dir') {
      const file = join(voiceDir, `${name}.mp3`);
      if (!existsSync(file)) throw new Error(`missing recording ${file}`);
      return file;
    }
    const file = join(outDir, `${name}.mp3`);
    if (mode === 'edge') {
      copyFileSync(speak(scene.say, script.seed, outDir), file);
    } else {
      const secs = estimateSeconds(scene.say).toFixed(2);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', secs, '-q:a', '9', file]);
    }
    return file;
  });
}
