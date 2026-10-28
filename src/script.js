// Guide JSON -> list of scenes for one Short.
// Facts come only from the guide (glance, hindi.summary, hindi.steps, safety).
// The fixed Hinglish lines below carry no facts: they only frame the guide text.

const pick = (list, seed) => list[seed % list.length];

// Small stable number from the guide id, so the same guide always gets the same look.
export function seedOf(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

// Roughly how long the Hindi voice takes for a line (about 2.6 words a second).
export const estimateSeconds = (text) => text.trim().split(/\s+/).length / 2.6 + 0.5;

const MAX_SECONDS = 39;
const HARD_MAX = 52; // the video adds about 0.8 s of lead-in and tail
export const OUTRO = 'पूरी गाइड, हिंदी और इंग्लिश में, फॉल्ट डीकोड डॉट कॉम पर।';
export const OUTRO_MORE = 'बाकी स्टेप्स और पूरी गाइड फॉल्ट डीकोड डॉट कॉम पर।';

// secondsOf(text) gives the real voice length when the audio is already made.
export function buildScript(c, secondsOf = estimateSeconds) {
  const id = `${c.appliance}/${c.brand}/${c.code.toLowerCase()}`;
  const seed = seedOf(id);
  const where = `${c.brandName} ${c.applianceName}`;
  const url = `faultdecode.com/${id}`;

  const hooks = [
    { say: `${where} पर ${c.code} दिख रहा है? चलिए समझते हैं।`, caption: `${where} pe ${c.code} aa raha hai?` },
    { say: `${where} में ${c.code} एरर आया? घबराइए मत।`, caption: `${where} mein ${c.code} error? Ghabraiye mat.` },
    { say: `${c.code} कोड का मतलब क्या है? ${where} वाले ध्यान दें।`, caption: `${c.code} ka matlab kya hai?` },
  ];

  const scenes = [];
  scenes.push({ kind: 'hook', ...pick(hooks, seed) });
  scenes.push({ kind: 'meaning', say: c.hindi.summary, caption: c.glance.problem, hindi: c.hindi.summary });

  if (c.safety) {
    scenes.push({
      kind: 'safety',
      say: `ध्यान दें, यह सेफ्टी वाला कोड है। ${c.applianceName} खुद न खोलें। बंद करें और टेक्नीशियन बुलाएं।`,
      caption: 'Khud mat kholiye. Band kijiye, technician bulaiye.',
    });
  }

  const outro = { kind: 'outro', say: OUTRO, caption: url };

  // Add steps in order while the Short stays under MAX_SECONDS. Never skip a step
  // in the middle: a partial list stops early and points to the full guide.
  let total = [...scenes, { say: OUTRO_MORE }].reduce((t, s) => t + secondsOf(s.say) + 0.35, 0);
  const steps = c.hindi.steps;
  let shown = 0;
  for (const step of steps) {
    const need = secondsOf(step) + 0.35;
    // Always show the first step, even if that runs a little past MAX_SECONDS.
    if (total + need > (shown === 0 ? HARD_MAX : MAX_SECONDS)) break;
    scenes.push({ kind: 'step', n: shown + 1, of: steps.length, say: step, hindi: step });
    total += need;
    shown++;
  }
  if (shown < steps.length) {
    outro.say = OUTRO_MORE;
    outro.more = steps.length - shown;
  }
  scenes.push(outro);

  return { id, seed, guide: c, scenes, stepsShown: shown, estimate: Math.round(total) };
}
