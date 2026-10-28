#!/usr/bin/env node
// Add an uploaded Short to data/published.json, so the plan moves on.
// Usage: node bin/log.js out/ac-lg-ch38
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const yt = JSON.parse(readFileSync(join(dir, 'youtube.json'), 'utf8'));
const sc = JSON.parse(readFileSync(join(dir, 'script.json'), 'utf8'));
const file = new URL('../data/published.json', import.meta.url);
const list = JSON.parse(readFileSync(file, 'utf8'));
const date = new Date(yt.publishAt || Date.now()).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
list.push({ date, id: sc.id, format: sc.format, videoId: yt.videoId });
writeFileSync(file, JSON.stringify(list, null, 1) + '\n');
console.log(`logged ${sc.id} [${sc.format}] ${yt.videoId}`);
