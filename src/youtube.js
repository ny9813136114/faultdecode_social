// Upload one Short with the YouTube Data API, straight from GitHub Actions (same way as parachar-social/yt.js).
// Secrets: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (a token made while signed in as the FaultDecode channel).
import { readFileSync } from 'node:fs';

const env = (k) => (process.env[k] || '').trim(); // pasted secrets may carry spaces
export const ready = () => !!(env('YT_CLIENT_ID') && env('YT_CLIENT_SECRET') && env('YT_REFRESH_TOKEN'));

export async function token() {
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({
    grant_type: 'refresh_token', refresh_token: env('YT_REFRESH_TOKEN'), client_id: env('YT_CLIENT_ID'), client_secret: env('YT_CLIENT_SECRET') }) });
  const j = await res.json();
  if (!j.access_token) throw new Error(`Google token: ${res.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

// Guard: never upload to another channel (the owner also runs Parachar and TaazaBhav).
// YT_CHANNEL_ID pins it exactly; without it the channel title must contain "FaultDecode".
export async function checkChannel(tok) {
  const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${tok}` } });
  const ch = ((await res.json()).items || [])[0];
  const ok = ch && (env('YT_CHANNEL_ID') ? ch.id === env('YT_CHANNEL_ID') : /fault\s*decode/i.test(ch.snippet.title));
  if (!ok) throw new Error(`token is for channel ${ch ? `${ch.snippet.title} (${ch.id})` : '(none)'}, not FaultDecode`);
  return ch;
}

// Private with publishAt: YouTube makes it public at that time. Without publishAt it stays private (test).
export async function upload({ file, title, description, tags, publishAt }) {
  const tok = await token();
  const ch = await checkChannel(tok);
  const meta = {
    snippet: { title, description, tags, categoryId: '26', defaultLanguage: 'hi', defaultAudioLanguage: 'hi' },
    status: { privacyStatus: 'private', ...(publishAt ? { publishAt } : {}), embeddable: true, selfDeclaredMadeForKids: false, containsSyntheticMedia: false },
  };
  const data = readFileSync(file);
  const start = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&notifySubscribers=true', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(data.length) },
    body: JSON.stringify(meta),
  });
  const loc = start.headers.get('location');
  if (!loc) throw new Error(`upload start: ${start.status} ${(await start.text()).slice(0, 300)}`);
  const put = await fetch(loc, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body: data });
  const v = await put.json().catch(() => ({}));
  if (!put.ok || !v.id) throw new Error(`upload: ${put.status} ${JSON.stringify(v).slice(0, 300)}`);
  return { videoId: v.id, channel: ch.snippet.title, privacy: v.status.privacyStatus, publishAt: v.status.publishAt || '' };
}

// Privacy and publish time of uploaded videos (to see whether YouTube kept them private).
export async function status(ids) {
  const tok = await token();
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,snippet,statistics&id=${ids.join(',')}`, { headers: { Authorization: `Bearer ${tok}` } });
  return ((await res.json()).items || []).map((v) => ({ id: v.id, title: v.snippet.title, privacy: v.status.privacyStatus, publishAt: v.status.publishAt || '', uploadStatus: v.status.uploadStatus, rejection: v.status.rejectionReason || '', views: v.statistics?.viewCount }));
}
