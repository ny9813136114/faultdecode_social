// Title, description and tags for the upload, from the guide JSON only.
export function buildMeta(c, script) {
  const id = script.id;
  const title = `${c.brandName} ${c.applianceName} ${c.code} error ka matlab | ${c.glance.problem}`.slice(0, 95) + ' #shorts';
  const description = [
    `${c.brandName} ${c.applianceName} ${c.code}: ${c.glance.problem}.`,
    c.quickAnswer,
    '',
    `Poori guide (English + हिंदी): https://faultdecode.com/${id}/`,
    '',
    'Official source:',
    ...c.sources.map((s) => `- ${s.title}: ${s.url}`),
    `Checked: ${c.checked}`,
    '',
    ...(c.safety ? ['Safety: band kijiye aur technician bulaiye. Unit khud mat kholiye.', ''] : []),
    'Apna error code comment mein likhiye.',
    `#shorts #errorcode #${c.brandName.replace(/\s+/g, '')}`,
  ].join('\n');
  const tags = [
    `${c.brandName} ${c.applianceName} ${c.code}`,
    `${c.brandName} ${c.code} error`,
    `${c.code} error code`,
    ...(c.aliases || []).map((a) => `${c.brandName} ${a}`),
    `${c.brandName} ${c.applianceName} error code`,
    'error code in hindi',
  ];
  return { title, description, tags };
}
