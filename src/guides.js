// All guide JSON, from the live site (faultdecode.com/data/guides.json) or a folder of guide files.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export async function loadGuides(url, dir) {
  if (url) {
    // Live site first; if it is not up, the snapshot in data/ (copied from the site's guides).
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`${url} failed (${e.message}), using data/guides.json`);
      return JSON.parse(readFileSync(new URL('../data/guides.json', import.meta.url), 'utf8'));
    }
  }
  return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

export const guideId = (g) => `${g.appliance}/${g.brand}/${g.code.toLowerCase()}`;

// A guide can become a Short only with an official source and Hindi text.
export const ready = (g) => g.code && g.brandName && g.applianceName && g.glance?.problem && g.hindi?.summary && g.hindi?.steps?.length && g.sources?.length && g.checked;
