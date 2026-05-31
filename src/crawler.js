import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { DEFAULTS } from './config.js';
import { extractContacts, normalizeBrandUrl } from './extract.js';

const CONTACT_HINTS = [
  'contact',
  'company',
  'about',
  'cs',
  'customer',
  'service',
  'profile',
  '문의',
  '고객',
  '회사',
  '소개',
  '입점',
  '제휴',
];

export async function crawlRows(rows, options = {}) {
  const limit = pLimit(Number(options.concurrency || DEFAULTS.concurrency));
  return Promise.all(rows.map((row) => limit(() => crawlRow(row, options))));
}

export async function crawlRow(row, options = {}) {
  const inputUrl = normalizeBrandUrl(row.brandUrl);
  const candidates = buildCandidateUrls(row.brandName, inputUrl);
  const pages = [];

  for (const url of candidates) {
    const html = await fetchPage(url, options);
    if (!html) continue;
    if (!isSearchPage(url)) pages.push({ url, html });

    if (isSearchPage(url)) {
      const discovered = pickSearchResultLinks(url, html).slice(0, 3);
      for (const discoveredUrl of discovered) {
        const discoveredHtml = await fetchPage(discoveredUrl, options);
        if (discoveredHtml) pages.push({ url: discoveredUrl, html: discoveredHtml });
      }
      continue;
    }

    const links = pickContactLinks(url, html).slice(0, 5);
    for (const link of links) {
      const linkedHtml = await fetchPage(link, options);
      if (linkedHtml) pages.push({ url: link, html: linkedHtml });
    }
    if (pages.length >= 4) break;
  }

  if (inputUrl && pages.length === 0) {
    for (const url of buildCandidateUrls(row.brandName, '')) {
      const html = await fetchPage(url, options);
      if (!html || !isSearchPage(url)) continue;
      const discovered = pickSearchResultLinks(url, html).slice(0, 3);
      for (const discoveredUrl of discovered) {
        const discoveredHtml = await fetchPage(discoveredUrl, options);
        if (discoveredHtml) pages.push({ url: discoveredUrl, html: discoveredHtml });
      }
      if (pages.length) break;
    }
  }

  const combined = pages.map((page) => visibleText(page.html)).join('\n');
  const contacts = extractContacts(combined);
  const bestUrl = chooseBestUrl(inputUrl, pages);

  return {
    input: row,
    brandName: row.brandName,
    brandUrl: bestUrl,
    phone: contacts.phone || row.phone || '',
    email: contacts.email || row.email || '',
    sourceUrls: pages.map((page) => page.url),
  };
}

export function buildCandidateUrls(brandName, existingUrl = '') {
  const urls = [];
  if (existingUrl) {
    urls.push(existingUrl);
    if (isNaverStore(existingUrl) && !existingUrl.includes('/profile')) {
      urls.push(`${existingUrl.replace(/\/$/, '')}/profile`);
    }
    return [...new Set(urls)];
  }
  const cleanBrand = encodeURIComponent(String(brandName || '').trim());
  if (cleanBrand) {
    urls.push(`https://search.naver.com/search.naver?query=${cleanBrand}%20%EB%B8%8C%EB%9E%9C%EB%93%9C%EC%8A%A4%ED%86%A0%EC%96%B4`);
    urls.push(`https://search.naver.com/search.naver?query=${cleanBrand}%20%EA%B3%B5%EC%8B%9D%EB%AA%B0%20%EC%97%B0%EB%9D%BD%EC%B2%98`);
  }
  return [...new Set(urls)];
}

function chooseBestUrl(inputUrl, pages) {
  if (inputUrl) return normalizeBrandUrl(inputUrl);
  const naver = pages.find((page) => isNaverStore(page.url));
  if (naver) return normalizeBrandUrl(naver.url);
  const official = pages.find((page) => !page.url.includes('search.naver.com'));
  return normalizeBrandUrl(official?.url || inputUrl || '');
}

function pickContactLinks(baseUrl, html) {
  const $ = cheerio.load(html);
  const links = [];
  const baseHost = safeHost(baseUrl);
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const label = `${$(element).text()} ${href}`.toLowerCase();
    if (!CONTACT_HINTS.some((hint) => label.includes(hint.toLowerCase()))) return;
    try {
      const nextUrl = new URL(href, baseUrl).toString();
      if (safeHost(nextUrl) !== baseHost) return;
      links.push(nextUrl);
    } catch {
      // Ignore malformed links from storefront scripts.
    }
  });
  return [...new Set(links)].filter((url) => /^https?:\/\//i.test(url));
}

function pickSearchResultLinks(baseUrl, html) {
  const $ = cheerio.load(html);
  const links = [];
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const label = `${$(element).text()} ${href}`;
    if (!/brand\.naver\.com|smartstore\.naver\.com|공식몰|official/i.test(label)) return;
    try {
      const nextUrl = new URL(href, baseUrl).toString();
      if (isSearchPage(nextUrl) || nextUrl.includes('adcr.naver.com')) return;
      links.push(nextUrl);
    } catch {
      // Ignore malformed search result links.
    }
  });
  return [...new Set(links)].filter((url) => /^https?:\/\//i.test(url));
}

async function fetchPage(url, options = {}) {
  try {
    const response = await axios.get(url, {
      timeout: Number(options.requestTimeoutMs || DEFAULTS.requestTimeoutMs),
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
    if (!String(response.headers['content-type'] || '').includes('text/html')) return '';
    return response.data;
  } catch {
    return '';
  }
}

function visibleText(html) {
  const $ = cheerio.load(html);
  $('script,style,noscript,svg').remove();
  const bodyText = $('body').text();
  const meta = $('meta')
    .map((_, element) => `${$(element).attr('content') || ''}`)
    .get()
    .join('\n');
  return `${bodyText}\n${meta}`;
}

function isNaverStore(url) {
  return /https?:\/\/(?:brand|smartstore)\.naver\.com\//i.test(url);
}

function isSearchPage(url) {
  return /https?:\/\/search\.naver\.com\//i.test(url);
}

function safeHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
