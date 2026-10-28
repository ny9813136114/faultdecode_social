#!/usr/bin/env node
// Usage: node bin/upload.js out/ac-lg-ch38 [when]
//   when: "now" (public in about 15 minutes), "2026-10-29 19:30" (IST), or "private" (stays private, for a test).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ready, upload } from '../src/youtube.js';
import { fileVideo } from '../src/channel.js';

const [dir, when = 'private'] = process.argv.slice(2);
if (!dir) { console.error('Give the output folder, e.g. out/ac-lg-ch38'); process.exit(1); }
if (!ready()) { console.error('YT_CLIENT_ID, YT_CLIENT_SECRET and YT_REFRESH_TOKEN are not set: nothing uploaded'); process.exit(1); }

function publishAt(w) {
  if (w === 'private') return '';
  if (w === 'now') return new Date(Date.now() + 15 * 60e3).toISOString().replace(/\.\d+Z$/, 'Z');
  const m = w.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) throw new Error(`bad time "${w}": use now, private or YYYY-MM-DD HH:MM (IST)`);
  const t = new Date(`${m[1]}T${m[2]}:${m[3]}:00+05:30`);
  if (t < Date.now() + 10 * 60e3) throw new Error(`${w} IST is in the past or too soon`);
  return t.toISOString().replace(/\.\d+Z$/, 'Z');
}

const read = (f) => readFileSync(join(dir, f), 'utf8').trim();
const r = await upload({
  file: join(dir, 'short.mp4'),
  title: read('title.txt'),
  description: read('description.txt'),
  tags: read('tags.txt').split(',').map((t) => t.trim()).filter(Boolean),
  publishAt: publishAt(when),
});
writeFileSync(join(dir, 'youtube.json'), JSON.stringify(r, null, 2) + '\n');
console.log(`uploaded to ${r.channel}: https://youtube.com/shorts/${r.videoId} (${r.privacy}${r.publishAt ? `, public at ${r.publishAt}` : ''})`);

// Into the playlists for its appliance and format.
const sc = JSON.parse(read('script.json'));
await fileVideo(r.videoId, sc.id.split('/')[0], sc.format || 'meaning');
