#!/usr/bin/env node
// What to make next.
//   node bin/next.js            the next 14 days as a table
//   node bin/next.js --one      just tomorrow's pick, as id=... and format=... lines (for the workflow)
//   [--days 30] [--guides <folder> | --guides-url <url>]
import { readFileSync } from 'node:fs';
import { loadGuides } from '../src/guides.js';
import { plan, volumes } from '../src/plan.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const guides = await loadGuides(opt('guides-url', process.env.FD_GUIDES_URL), opt('guides', process.env.FD_GUIDES || '../faultdecode/src/data/codes'));
const published = JSON.parse(readFileSync(new URL('../data/published.json', import.meta.url), 'utf8'));
const days = args.includes('--one') ? 1 : +opt('days', 14);
const picks = plan(guides, volumes(), published, days);

if (args.includes('--one')) {
  if (!picks.length) { console.error('Every guide has all its Shorts. Add guides to the site.'); process.exit(1); }
  console.log(`id=${picks[0].id}\nformat=${picks[0].format}`);
} else {
  console.log(`${published.length} Shorts out; ${guides.length} guides.\n\n| Day | Guide | Format | Searches/month |\n|---|---|---|---:|`);
  picks.forEach((p, i) => console.log(`| ${i + 1} | ${p.id} | ${p.format} | ${p.volume} |`));
}
