# faultdecode-social

Turns one [FaultDecode](https://faultdecode.com) guide into a 25 to 40 second vertical YouTube Short
(1080x1920, Hindi voice, Hinglish and Hindi on screen, the code on a display like the site).

## Rules
- Every fact on screen and in the voice comes from the guide JSON (`glance`, `hindi.summary`, `hindi.steps`,
  `safety`). Those guides are already checked against the brand's own manual or support page.
  The fixed lines in `src/script.js` (hook, safety line, outro) only frame them and carry no facts.
- Safety codes always get the "switch off, do not open it, call a technician" scene.
- Steps are shown in order. If they do not fit in 40 s, the Short stops early and points to the full guide.
- A person watches every Short before it goes up. Upload by hand, about one a day, until the
  YouTube API app passes Google's audit (unaudited apps can only upload private videos).
- Three looks (device, cream, teal) and two voices, picked per guide, so the channel does not look stamped out.

## Make one on GitHub (no install)
Actions > **Make a Short** > Run workflow > type `ac/lg/ch38`. Download the zip from the finished run:
`short.mp4`, `title.txt`, `description.txt` (with the official sources), `tags.txt`.

## Make one on your computer
Needs Node 22, ffmpeg and `pip install edge-tts`.
```
npm ci && npx playwright install chromium
node bin/make-short.js ac/lg/ch38 --guides-url https://faultdecode.com/data/guides.json
```
Options: `--theme device|cream|teal`, `--voice edge|silent|dir`, `--voice-dir <folder>` (your own recordings,
`scene-01.mp3`, `scene-02.mp3` ..., one per line in `out/<id>/script.json`), `--guides <folder of guide JSON>`.

## Voice
`edge` uses Microsoft Edge's free neural voices (hi-IN Swara and Madhur) through the unofficial edge-tts tool.
Before the channel is monetised, switch to a voice with clear commercial terms (Azure Speech, which has a
free tier with the same voices) or record your own with `--voice dir`.

## Upload to YouTube from GitHub
Add three repository secrets (Settings > Secrets and variables > Actions): `YT_CLIENT_ID`, `YT_CLIENT_SECRET`
(the same Google OAuth client as parachar-social works) and `YT_REFRESH_TOKEN`, made while signed in as the
**FaultDecode** channel. Optional repository variable `YT_CHANNEL_ID` pins the channel exactly; without it the
upload refuses any channel whose name does not contain "FaultDecode".
Then run **Make a Short** with `upload` = `now` (public in about 15 minutes), `private` (test) or `2026-10-29 19:30` (IST).
The video goes up Private with a publish time, so YouTube makes it public at that time.
