// The content engine: which Short to make on which day.
// Order: what India searches most (Semrush volumes in data/volumes.csv), each guide's best
// format first, its other formats later at lower priority. No two days in a row with the
// same brand, and mostly not the same format, so the channel does not look stamped out.
import { readFileSync } from 'node:fs';
import { formatsFor, distractorFor, seedOf } from './script.js';
import { guideId, ready } from './guides.js';

const WEIGHT = [1, 0.5, 0.35]; // a guide's 1st, 2nd and 3rd format
const NO_VOLUME = 20; // guides Semrush had no row for

export function volumes(file = new URL('../data/volumes.csv', import.meta.url)) {
  const vol = {};
  for (const line of readFileSync(file, 'utf8').trim().split('\n').slice(1)) {
    const [v, appliance, brand, code] = line.split(',');
    vol[`${appliance}/${brand}/${code.toLowerCase()}`] = +v;
  }
  return vol;
}

// published: [{ date, id, format, videoId }], oldest first. Returns the next `days` picks.
export function plan(guides, vol, published, days = 14) {
  const done = new Set(published.map((p) => `${p.id}|${p.format}`));
  const left = [];
  for (const g of guides.filter(ready)) {
    const id = guideId(g);
    formatsFor(g).forEach((format, rank) => {
      if (done.has(`${id}|${format}`)) return;
      if (format === 'quiz' && !distractorFor(g, guides, seedOf(id))) return;
      left.push({ id, brand: g.brand, format, rank, volume: vol[id] || NO_VOLUME, score: (vol[id] || NO_VOLUME) * WEIGHT[rank] });
    });
  }
  left.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const out = [];
  let prev = published.at(-1);
  const prevBrand = () => (prev ? prev.id.split('/')[1] : '');
  for (let d = 0; d < days && left.length; d++) {
    // A guide's later format waits until its earlier ones are out.
    const open = left.filter((c) => !left.some((o) => o.id === c.id && o.rank < c.rank));
    // Other brand than yesterday, not a guide from the last 6 days; among the top 3 of
    // those, prefer a different format than yesterday's. Search volume still leads.
    const ok = open.filter((c) => c.brand !== prevBrand() && !out.slice(-6).some((o) => o.id === c.id));
    const top = (ok.length ? ok : open).slice(0, 3);
    const pick = top.find((c) => c.format !== prev?.format) || top[0];
    out.push(pick);
    left.splice(left.indexOf(pick), 1);
    prev = pick;
  }
  return out;
}
