#!/usr/bin/env node
// Usage: node bin/status.js <videoId> [videoId ...]   prints privacy, publish time and views
import { ready, status } from '../src/youtube.js';
if (!ready()) { console.error('YouTube secrets are not set'); process.exit(1); }
console.log(JSON.stringify(await status(process.argv.slice(2)), null, 2));
