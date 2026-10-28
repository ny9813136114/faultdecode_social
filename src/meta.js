// Title, description and tags for YouTube, from the guide JSON only.
// Search terms first (brand + appliance + code + "error"), then the meaning, then Hindi for Hindi search.
const HINDI = { ac: 'एसी', 'washing-machine': 'वॉशिंग मशीन', vfd: 'वीएफडी ड्राइव', induction: 'इंडक्शन', microwave: 'माइक्रोवेव', 'inverter-ups': 'इन्वर्टर' };
const tagify = (s) => '#' + s.replace(/[^\p{L}\p{N}]+/gu, '');

export function buildMeta(c, script) {
  const id = script.id;
  const name = `${c.brandName} ${c.applianceName} ${c.code}`;
  const hi = HINDI[c.appliance] || c.applianceName;
  // YouTube allows 100 characters; keep the code and "#shorts" whatever the meaning's length.
  const head = `${name} Error Kya Hai?`;
  const tail = ' | Hindi #shorts';
  let problem = c.glance.problem;
  const room = 100 - head.length - tail.length - 1;
  if (problem.length > room) problem = problem.slice(0, room - 1).replace(/\s+\S*$/, '') + '…';
  const title = `${head} ${problem}${tail}`;

  const description = [
    `${name} error ka matlab: ${c.glance.problem}. ${c.brandName} ${c.applianceName} pe ${c.code} code aaye to kya karein, Hindi mein.`,
    '',
    c.hindi.summary,
    '',
    c.quickAnswer,
    '',
    `Poori guide (steps, English + हिंदी): https://faultdecode.com/${id}/`,
    `${c.brandName} ke saare error codes: https://faultdecode.com/${c.appliance}/${c.brand}/`,
    '',
    ...(c.safety ? ['⚠ Safety: band kijiye aur technician bulaiye. Unit khud mat kholiye.', ''] : []),
    'Official source (brand ki apni site / manual):',
    ...c.sources.map((s) => `- ${s.title}: ${s.url}`),
    `Checked: ${c.checked}`,
    '',
    'Apna error code comment mein likhiye, agla video usi pe.',
    '',
    [tagify(`${c.brandName}${c.applianceName}`), tagify(c.code), tagify(`${c.applianceName}error`), '#errorcode', '#shorts'].join(' '),
  ].join('\n');

  const tags = [...new Set([
    `${name} error`,
    `${name}`,
    `${c.brandName} ${c.code} error`,
    `${c.code} error code`,
    `${c.code} error in ${c.applianceName}`,
    ...(c.aliases || []).map((a) => `${c.brandName} ${c.applianceName} ${a}`),
    `${c.brandName} ${c.applianceName} error code`,
    `${c.brandName} ${c.applianceName} error code in hindi`,
    `${c.applianceName} error code`,
    `${c.brandName} ${hi} ${c.code}`,
    `${hi} एरर कोड`,
    'error code in hindi',
    'faultdecode',
  ])];
  // YouTube caps tags at 500 characters in total.
  while (tags.join(',').length > 480) tags.pop();
  return { title, description, tags };
}
