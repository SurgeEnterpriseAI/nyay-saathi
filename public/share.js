// "Send on WhatsApp" links. A plain wa.me link with the text in the URL: no API, no
// phone number, no third-party script. WhatsApp opens and the person picks who to send to.
// Nothing here talks to our server; analytics only records that a share button was used.

export const WA_MAX_CHARS = 2000;
const SITE = 'https://nyaysaathi.surgesoftware.co.in';

// Trim to at most `max` characters (counting code points, so Hindi/Telugu letters are not
// split into broken bytes), preferring to cut at a line break, and mark the cut with "…".
export function trimForShare(text, max = WA_MAX_CHARS) {
  const chars = Array.from(String(text ?? ''));
  if (chars.length <= max) return chars.join('');
  let cut = chars.slice(0, max - 2).join('');
  const nl = cut.lastIndexOf('\n');
  if (nl > cut.length * 0.6) cut = cut.slice(0, nl);
  return `${cut.trimEnd()}\n…`;
}

export function whatsappLink(text, max = WA_MAX_CHARS) {
  return `https://wa.me/?text=${encodeURIComponent(trimForShare(text, max))}`;
}

// The steps shown on screen, as a plain-text message.
export function stepsShareText(g, labels = {}) {
  if (!g) return '';
  const lines = [g.title, '', `${labels.steps || 'Next steps'}:`, ...g.steps.map((s, i) => `${i + 1}. ${s}`)];
  if (g.helplines?.length) lines.push('', `${labels.helplines || 'Helplines'}:`, ...g.helplines.map((h) => `${h.number}: ${h.name}`));
  if (g.disclaimer) lines.push('', g.disclaimer);
  lines.push(`Nyay Saathi: ${SITE}`);
  return lines.join('\n');
}
