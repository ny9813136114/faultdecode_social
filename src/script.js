// Guide JSON -> list of scenes for one Short.
// Facts come only from the guide (glance, hindi.summary, hindi.steps, safety).
// The fixed Hinglish lines below carry no facts: they only frame the guide text.
//
// Formats (one guide can get one Short of each, on different days):
//   meaning: what the code means, then the steps.
//   danger:  safety codes only. Opens on the warning, safety before the steps.
//   quiz:    "A or B?" The wrong option is the real meaning of another code of the
//            same appliance, so nothing on screen is made up. Then the answer and steps.
//   story:   "the machine was running and the code came up", then meaning and steps.

const pick = (list, seed) => list[seed % list.length];

// Small stable number from the guide id, so the same guide always gets the same look.
export function seedOf(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

// Roughly how long the Hindi voice takes for a line (about 2.6 words a second).
export const estimateSeconds = (text) => text.trim().split(/\s+/).length / 2.6 + 0.5;

const MAX_SECONDS = 39; // the video adds about 0.8 s of lead-in and tail
const HARD_MAX = 52; // only to fit the first step
export const OUTRO = 'पूरी गाइड, हिंदी और इंग्लिश में, फॉल्ट डीकोड डॉट कॉम पर।';
export const OUTRO_MORE = 'बाकी स्टेप्स और पूरी गाइड फॉल्ट डीकोड डॉट कॉम पर।';
export const OUTRO_QUIZ = 'आपका जवाब सही था? कमेंट में बताइए। पूरी गाइड फॉल्ट डीकोड डॉट कॉम पर।';

// secondsOf(text) gives the real voice length when the audio is already made.
export const FORMATS = ['meaning', 'danger', 'quiz', 'story'];

// Which formats suit a guide, best first. Safety codes lead with the warning.
export const formatsFor = (c) => (c.safety ? ['danger', 'quiz', 'story'] : ['meaning', 'quiz', 'story']);

// Wrong quiz option: another guide for the same appliance whose meaning is clearly different.
export function distractorFor(c, guides, seed) {
  const words = (s) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) || []);
  const mine = words(c.glance.problem);
  const pool = guides.filter((g) => g.appliance === c.appliance && g.glance?.problem && !(g.brand === c.brand && g.code === c.code)
    && ![...words(g.glance.problem)].some((w) => mine.has(w)) && g.glance.problem.length <= 70);
  return pool.length ? pool[seed % pool.length] : null;
}

// opts.format picks the format (default: the first that suits the guide);
// opts.guides is the list of all guides, needed for the quiz.
export function buildScript(c, secondsOf = estimateSeconds, opts = {}) {
  const id = `${c.appliance}/${c.brand}/${c.code.toLowerCase()}`;
  const seed = seedOf(id);
  const where = `${c.brandName} ${c.applianceName}`;
  const url = `faultdecode.com/${id}`;

  const hooks = [
    { say: `${where} पर ${c.code} दिख रहा है? चलिए समझते हैं।`, caption: `${where} pe ${c.code} aa raha hai?` },
    { say: `${where} में ${c.code} एरर आया? घबराइए मत।`, caption: `${where} mein ${c.code} error? Ghabraiye mat.` },
    { say: `${c.code} कोड का मतलब क्या है? ${where} वाले ध्यान दें।`, caption: `${c.code} ka matlab kya hai?` },
  ];

  let format = opts.format || formatsFor(c)[0];
  if (format === 'danger' && !c.safety) throw new Error(`${id} has no safety note: no danger Short`);
  const wrong = format === 'quiz' ? distractorFor(c, opts.guides || [], seed) : null;
  if (format === 'quiz' && !wrong) throw new Error(`${id}: no other ${c.applianceName} guide to use as the wrong quiz option`);

  const safety = {
    kind: 'safety',
    say: `ध्यान दें, यह सेफ्टी वाला कोड है। ${c.applianceName} खुद न खोलें। बंद करें और टेक्नीशियन बुलाएं।`,
    caption: 'Khud mat kholiye. Band kijiye, technician bulaiye.',
  };
  const meaning = { kind: 'meaning', say: c.hindi.summary, caption: c.glance.problem, hindi: c.hindi.summary };

  const scenes = [];
  if (format === 'meaning') {
    scenes.push({ kind: 'hook', ...pick(hooks, seed) }, meaning);
    if (c.safety) scenes.push(safety);
  } else if (format === 'danger') {
    scenes.push({ kind: 'alert', say: `रुकिए! ${where} पर ${c.code} दिखे, तो पहले ये सुनिए।`, caption: `${c.code} dikhe to ruk jaiye!` }, safety, meaning);
  } else if (format === 'quiz') {
    const right = seed % 2; // 0: right answer is A, 1: it is B
    const options = right === 0 ? [c.glance.problem, wrong.glance.problem] : [wrong.glance.problem, c.glance.problem];
    const letter = 'AB'[right];
    scenes.push(
      { kind: 'quiz', say: `क्विज़ टाइम! ${where} पर ${c.code} का मतलब क्या है? ऑप्शन A या ऑप्शन B?`, caption: `${c.code} ka matlab kya hai?`, options },
      { kind: 'countdown', say: 'सोचिए... तीन, दो, एक।', options },
      { kind: 'reveal', say: `सही जवाब है ${letter}। ${c.hindi.summary}`, caption: c.glance.problem, hindi: c.hindi.summary, options, right },
    );
    if (c.safety) scenes.push(safety);
  } else if (format === 'story') {
    scenes.push(
      { kind: 'hook', say: `${c.applianceName} चल रहा था, और अचानक डिस्प्ले पर आया ${c.code}। अब क्या करें?`, caption: `Achanak display pe ${c.code}. Ab kya karein?` },
      { ...meaning, say: `इसका मतलब: ${c.hindi.summary}` },
    );
    if (c.safety) scenes.push(safety);
  } else {
    throw new Error(`unknown format ${format}`);
  }

  const outro = { kind: 'outro', say: format === 'quiz' ? OUTRO_QUIZ : OUTRO, caption: url };

  // Add steps in order while the Short stays under MAX_SECONDS. Never skip a step
  // in the middle: a partial list stops early and points to the full guide.
  let total = [...scenes, { say: outro.say === OUTRO ? OUTRO_MORE : outro.say }].reduce((t, s) => t + secondsOf(s.say) + 0.35, 0);
  const steps = c.hindi.steps;
  let shown = 0;
  for (const step of steps) {
    const need = secondsOf(step) + 0.35;
    // Always show the first step, even if that runs a little past MAX_SECONDS
    // (not in a quiz: there the answer is the point, and it is already long).
    if (total + need > (shown === 0 && format !== 'quiz' ? HARD_MAX : MAX_SECONDS)) break;
    scenes.push({ kind: 'step', n: shown + 1, of: steps.length, say: step, hindi: step });
    total += need;
    shown++;
  }
  if (shown < steps.length) {
    if (outro.say === OUTRO) outro.say = OUTRO_MORE;
    outro.more = steps.length - shown;
  }
  scenes.push(outro);

  return { id, seed, format, guide: c, scenes, stepsShown: shown, estimate: Math.round(total), wrong: wrong && `${wrong.appliance}/${wrong.brand}/${wrong.code.toLowerCase()}` };
}
