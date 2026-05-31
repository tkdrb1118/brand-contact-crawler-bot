export const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const PHONE_RE = /(?:\+82[-.\s]?)?(?:0\d{1,2}|1[568]\d{2})[-.\s)]?\d{3,4}[-.\s]?\d{4}/g;

const BLOCKED_EMAIL_PREFIXES = new Set(['example', 'test', 'email', 'privacy', 'master']);
const BLOCKED_EMAIL_DOMAINS = new Set(['example.com', 'example.co.kr', 'test.com', 'domain.com']);

export function extractContacts(text) {
  const normalized = decodeHtml(String(text || '')).replace(/\u00a0/g, ' ');
  const emails = unique((normalized.match(EMAIL_RE) || []).filter(isUsableEmail));
  const phones = unique((normalized.match(PHONE_RE) || []).map(normalizePhone).filter(Boolean));

  return {
    email: emails.join(' / '),
    phone: phones.join(' / '),
  };
}

export function normalizeBrandUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(na|n_|utm_|fbclid|gclid|NaPm)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return String(url).trim();
  }
}

function normalizePhone(phone) {
  const normalized = String(phone)
    .replace(/^\+82[-.\s]?/, '0')
    .replace(/[.\s]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/-$/, '')
    .trim();
  if (/^0+-0+-0+$/.test(normalized)) return '';
  return normalized;
}

function isUsableEmail(email) {
  const lower = email.toLowerCase();
  const [prefix, domain] = lower.split('@');
  if (BLOCKED_EMAIL_PREFIXES.has(prefix)) return false;
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return false;
  return !lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.gif');
}

function unique(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 4);
}

function decodeHtml(text) {
  return text
    .replace(/&#64;|&#x40;/gi, '@')
    .replace(/&commat;/gi, '@')
    .replace(/&amp;/gi, '&')
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(at\)\s*/gi, '@');
}
