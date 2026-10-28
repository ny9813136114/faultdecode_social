// Channel setup through the YouTube Data API: description, keywords, banner, watermark, playlists.
// The API cannot change the profile picture, the links, the contact email or Studio's upload defaults:
// those stay by hand (see the channel setup doc).
import { readFileSync } from 'node:fs';
import { token, checkChannel } from './youtube.js';

const API = 'https://www.googleapis.com/youtube/v3';
const UP = 'https://www.googleapis.com/upload/youtube/v3';

export const DESCRIPTION = `Display pe error code aaya? FaultDecode har code ka matlab aur kya karna hai, 40 second mein samjhata hai. Hindi mein, simple bhasha mein.

AC, washing machine, inverter, VFD drive aur bhi: LG, Samsung, Voltas, Carrier, Lloyd, Haier, Bosch, IFB, Delta, Microtek.

✔ Har meaning brand ke apne manual ya support page se checked
✔ Kya khud kar sakte hain, aur kab technician bulana hai
✔ Gas, current aur leak wale codes pe pehle safety

Roz shaam 6 baje naya Short.

Poori guide (English + हिंदी): https://faultdecode.com

अपनी मशीन का एरर कोड कमेंट करें, अगला वीडियो उसी पर।

FaultDecode is not linked to any brand. Business: contact@faultdecode.com`;

export const KEYWORDS = '"error code" "error code in hindi" "ac error code" "washing machine error code" "lg washing machine error code" "samsung washing machine error code" "voltas ac error code" "lg ac error code" "carrier ac error code" "inverter error code" "vfd fault code" faultdecode';

// Each Short goes in the playlist for its appliance, and in a series playlist for its format.
export const PLAYLISTS = [
  { title: 'AC Error Codes Hindi', description: 'AC ke display pe error code? Har code ka matlab aur kya karein, Hindi mein. Brand manual se checked.', match: (a) => a === 'ac' },
  { title: 'Washing Machine Error Codes Hindi', description: 'Washing machine ka error code samjhiye: matlab, kya khud karein, kab technician.', match: (a) => a === 'washing-machine' },
  { title: 'Inverter and VFD Codes', description: 'Inverter, UPS aur VFD drive ke fault codes, Hindi mein.', match: (a) => ['inverter-ups', 'vfd', 'solar-pump'].includes(a) },
  { title: 'Danger Codes: Turant Band Karo', description: 'Ye codes dikhe to machine band karein aur technician bulayein.', match: (a, f) => f === 'danger' },
  { title: 'Error Code Quiz', description: 'Kitne codes pehchante ho? A ya B, comment mein batao.', match: (a, f) => f === 'quiz' },
];

async function api(tok, method, url, body, type = 'application/json') {
  const res = await fetch(url, { method, headers: { Authorization: `Bearer ${tok}`, ...(body ? { 'Content-Type': type } : {}) }, body: body && type === 'application/json' ? JSON.stringify(body) : body });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url.split('?')[0]}: ${res.status} ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
}

// Playlists by title, made if missing.
export async function ensurePlaylists(tok) {
  const have = {};
  let page = '';
  do {
    const j = await api(tok, 'GET', `${API}/playlists?part=snippet&mine=true&maxResults=50${page && `&pageToken=${page}`}`);
    for (const p of j.items || []) have[p.snippet.title] = p.id;
    page = j.nextPageToken || '';
  } while (page);
  for (const p of PLAYLISTS) {
    if (have[p.title]) continue;
    const j = await api(tok, 'POST', `${API}/playlists?part=snippet,status`, { snippet: { title: p.title, description: p.description, defaultLanguage: 'hi' }, status: { privacyStatus: 'public' } });
    have[p.title] = j.id;
    console.log(`playlist made: ${p.title}`);
  }
  return have;
}

// Put a video in the playlists that fit it. Never fails the upload.
export async function fileVideo(videoId, appliance, format) {
  try {
    const tok = await token();
    const ids = await ensurePlaylists(tok);
    for (const p of PLAYLISTS.filter((p) => p.match(appliance, format))) {
      await api(tok, 'POST', `${API}/playlistItems?part=snippet`, { snippet: { playlistId: ids[p.title], resourceId: { kind: 'youtube#video', videoId } } });
      console.log(`added to playlist: ${p.title}`);
    }
  } catch (e) {
    console.warn(`playlist step skipped: ${e.message}`);
  }
}

export async function setupChannel({ banner, watermark }) {
  const tok = await token();
  const ch = await checkChannel(tok);
  const cur = (await api(tok, 'GET', `${API}/channels?part=brandingSettings&id=${ch.id}`)).items[0].brandingSettings;

  const up = await api(tok, 'POST', `${UP}/channelBanners/insert?uploadType=media`, readFileSync(banner), 'image/png');
  console.log('banner uploaded');

  const brandingSettings = {
    ...cur,
    channel: { ...cur.channel, description: DESCRIPTION, keywords: KEYWORDS, country: 'IN', defaultLanguage: 'hi' },
    image: { ...(cur.image || {}), bannerExternalUrl: up.url },
  };
  await api(tok, 'PUT', `${API}/channels?part=brandingSettings`, { id: ch.id, brandingSettings });
  console.log('description, keywords, country, language and banner set');

  // Watermark: multipart/related, JSON part then the image.
  const b = 'fdwm' + Date.now();
  const meta = JSON.stringify({ timing: { type: 'offsetFromStart', offsetMs: 0 }, position: { type: 'corner', cornerPosition: 'topRight' }, imageUrl: '' });
  const body = Buffer.concat([
    Buffer.from(`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: image/png\r\n\r\n`),
    readFileSync(watermark),
    Buffer.from(`\r\n--${b}--`),
  ]);
  const wm = await fetch(`${UP}/watermarks/set?channelId=${ch.id}&uploadType=multipart`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': `multipart/related; boundary=${b}` }, body });
  console.log(wm.ok ? 'watermark set' : `watermark failed: ${wm.status} ${(await wm.text()).slice(0, 300)}`);

  // Shorts already out (data/published.json) go into their playlists too, once.
  const ids = await ensurePlaylists(tok);
  const published = JSON.parse(readFileSync(new URL('../data/published.json', import.meta.url), 'utf8'));
  for (const p of PLAYLISTS) {
    const inside = new Set(((await api(tok, 'GET', `${API}/playlistItems?part=contentDetails&maxResults=50&playlistId=${ids[p.title]}`)).items || []).map((i) => i.contentDetails.videoId));
    for (const v of published.filter((v) => p.match(v.id.split('/')[0], v.format) && !inside.has(v.videoId))) {
      await api(tok, 'POST', `${API}/playlistItems?part=snippet`, { snippet: { playlistId: ids[p.title], resourceId: { kind: 'youtube#video', videoId: v.videoId } } });
      console.log(`${v.id} added to ${p.title}`);
    }
  }
  console.log(`done for ${ch.snippet.title} (https://youtube.com/channel/${ch.id})`);
}
