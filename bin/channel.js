#!/usr/bin/env node
// Set up the FaultDecode channel: description, keywords, banner, watermark, playlists.
// Usage: node bin/channel.js   (needs the YT_* secrets; refuses any channel not named FaultDecode)
import { ready } from '../src/youtube.js';
import { setupChannel } from '../src/channel.js';
if (!ready()) { console.error('YouTube secrets are not set'); process.exit(1); }
await setupChannel({ banner: 'assets/channel/banner-2560x1440.png', watermark: 'assets/channel/watermark-150.png' });
