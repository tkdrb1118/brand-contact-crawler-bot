import assert from 'node:assert/strict';
import test from 'node:test';
import { createMatcher, extractBrandNames, extractUrls, normalizeBrandName } from '../src/exclusions.js';

test('extractBrandNames removes notice prefixes', () => {
  assert.deepEqual(extractBrandNames('★주의: 2회이상공지 업체\n 파이브온'), ['파이브온']);
});

test('extractUrls finds multiple URLs in one cell', () => {
  assert.deepEqual(extractUrls('http://a.co.kr\r\nhttps://smartstore.naver.com/storeid'), [
    'http://a.co.kr',
    'https://smartstore.naver.com/storeid',
  ]);
});

test('normalizeBrandName ignores company suffixes and spacing', () => {
  assert.equal(normalizeBrandName('(주) 아트앤디자인 인터내셔널'), '아트앤디자인인터내셔널');
});

test('matcher excludes by brand, host, and naver store id', () => {
  const matcher = createMatcher(['파이브온'], ['https://smartstore.naver.com/fiveon', 'http://redhouseoceanhills.com/']);

  assert.equal(matcher.isExcluded({ brandName: '파이브온', brandUrl: '' }).excluded, true);
  assert.equal(matcher.isExcluded({ brandName: '다른브랜드', brandUrl: 'https://smartstore.naver.com/fiveon/profile?cp=2' }).excluded, true);
  assert.equal(matcher.isExcluded({ brandName: '레드하우스', brandUrl: 'https://www.redhouseoceanhills.com/path' }).excluded, true);
  assert.equal(matcher.isExcluded({ brandName: '허용브랜드', brandUrl: 'https://allowed.example' }).excluded, false);
});

test('matcher does not exclude whole shared platform hosts', () => {
  const matcher = createMatcher([], ['https://blog.naver.com/blocked-brand']);

  assert.equal(matcher.isExcluded({ brandName: '다른브랜드', brandUrl: 'https://blog.naver.com/other-brand' }).excluded, false);
});
