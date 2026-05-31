import assert from 'node:assert/strict';
import test from 'node:test';
import { extractContacts, normalizeBrandUrl } from '../src/extract.js';

test('extractContacts finds Korean phone numbers and emails', () => {
  const result = extractContacts('고객센터 031-928-7328 / 이메일 trini87@naver.com, help@example.com');
  assert.equal(result.phone, '031-928-7328');
  assert.equal(result.email, 'trini87@naver.com');
});

test('normalizeBrandUrl removes tracking parameters', () => {
  const url = normalizeBrandUrl('https://example.com/?utm_source=naver&NaPm=abc&keep=1#top');
  assert.equal(url, 'https://example.com/?keep=1');
});
