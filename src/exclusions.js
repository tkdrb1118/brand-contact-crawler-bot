import { getSpreadsheetId } from './config.js';
import { normalizeBrandUrl } from './extract.js';

const BRAND_HEADERS = ['광고주 업체명', '브랜드명', '업체명', '광고주'];
const URL_HEADERS = ['사이트', '브랜드URL', 'URL', 'url'];
const SHARED_HOSTS = new Set([
  'blog.naver.com',
  'map.naver.com',
  'cafe.naver.com',
  'smartstore.naver.com',
  'brand.naver.com',
  'modoo.at',
]);

export async function loadExclusions(sheets, options = {}) {
  const spreadsheetId = getSpreadsheetId(options.spreadsheetUrl || options.spreadsheetId);
  if (!spreadsheetId) return createMatcher([], []);

  const sheetName = options.sheetName || '영업금지리스트';
  const headerRow = Number(options.headerRow || 4);
  const dataStartRow = Number(options.dataStartRow || headerRow + 1);
  const endRow = Number(options.endRow || 10000);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: quoteSheet(sheetName) + `!A${headerRow}:Z${endRow}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const values = response.data.values || [];
  const headers = values[0] || [];
  const brandColumn = findHeader(headers, BRAND_HEADERS);
  const urlColumn = findHeader(headers, URL_HEADERS);
  if (brandColumn === -1 && urlColumn === -1) {
    throw new Error(`제외 시트에서 브랜드/URL 헤더를 찾지 못했습니다: ${sheetName}!A${headerRow}:Z${endRow}`);
  }

  const brands = [];
  const urls = [];
  for (const row of values.slice(dataStartRow - headerRow)) {
    if (brandColumn !== -1) brands.push(...extractBrandNames(row[brandColumn]));
    if (urlColumn !== -1) urls.push(...extractUrls(row[urlColumn]));
  }

  return createMatcher(brands, urls);
}

export function createMatcher(brands, urls) {
  const brandSet = new Set(brands.map(normalizeBrandName).filter(Boolean));
  const urlKeys = new Set(urls.map(normalizeUrlKey).filter(Boolean));
  const naverStoreIds = new Set(urls.map(naverStoreId).filter(Boolean));
  const hosts = new Set(urls.map(normalizeHost).filter((host) => host && !SHARED_HOSTS.has(host)));

  return {
    size: brandSet.size + urlKeys.size,
    isExcluded(row) {
      const rowBrand = normalizeBrandName(row.brandName);
      if (rowBrand && brandSet.has(rowBrand)) {
        return { excluded: true, reason: 'brand', value: row.brandName };
      }

      const rowUrl = row.brandUrl || '';
      const rowUrlKey = normalizeUrlKey(rowUrl);
      if (rowUrlKey && urlKeys.has(rowUrlKey)) {
        return { excluded: true, reason: 'url', value: row.brandUrl };
      }

      const storeId = naverStoreId(rowUrl);
      if (storeId && naverStoreIds.has(storeId)) {
        return { excluded: true, reason: 'naver_store', value: storeId };
      }

      const host = normalizeHost(rowUrl);
      if (host && hosts.has(host)) {
        return { excluded: true, reason: 'host', value: host };
      }

      return { excluded: false };
    },
  };
}

export function extractBrandNames(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^.*주의[:：]\s*/u, '').replace(/^[★◆*\-\s]+/u, '').trim())
    .filter((item) => !/공지|주의|업체$/u.test(item))
    .filter((item) => item.length >= 2);
}

export function extractUrls(value) {
  return String(value || '').match(/https?:\/\/[^\s,]+/gi) || [];
}

export function normalizeBrandName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\(주\)|주식회사|㈜/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
}

function findHeader(headers, candidates) {
  return headers.findIndex((header) => candidates.includes(String(header || '').trim()));
}

function normalizeUrlKey(value) {
  const normalized = normalizeBrandUrl(value).replace(/\/$/, '');
  try {
    const parsed = new URL(normalized);
    return `${parsed.hostname.replace(/^www\./, '').toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

function normalizeHost(value) {
  try {
    const parsed = new URL(normalizeBrandUrl(value));
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function naverStoreId(value) {
  try {
    const parsed = new URL(normalizeBrandUrl(value));
    if (!/(?:brand|smartstore)\.naver\.com$/i.test(parsed.hostname)) return '';
    return parsed.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
  } catch {
    return '';
  }
}

function quoteSheet(sheetName) {
  return `'${String(sheetName).replaceAll("'", "''")}'`;
}
