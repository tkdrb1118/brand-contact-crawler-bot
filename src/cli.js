#!/usr/bin/env node
import { DEFAULTS, getSpreadsheetId, parseArgs } from './config.js';
import { getSheetsClient } from './googleAuth.js';
import { crawlRows } from './crawler.js';
import { readSheetContext, updateBrandRows } from './sheets.js';

async function main() {
  const args = parseArgs(process.argv);
  const spreadsheetId = getSpreadsheetId(args['sheet-url'] || args['spreadsheet-id'] || process.env.SPREADSHEET_URL);
  const sheetName = args['sheet-name'] || process.env.SHEET_NAME || '김윤아';
  const limit = Number(args.limit || 50);
  const startRow = Number(args['start-row'] || DEFAULTS.dataStartRow);
  const endRow = Number(args['end-row'] || startRow + limit - 1);
  const overwrite = Boolean(args.overwrite || DEFAULTS.overwrite);

  if (!spreadsheetId) {
    throw new Error('--sheet-url 또는 SPREADSHEET_URL이 필요합니다.');
  }

  const sheets = await getSheetsClient();
  const context = await readSheetContext(sheets, spreadsheetId, sheetName, {
    dataStartRow: startRow,
    endRow,
    limit,
  });

  const targetRows = context.rows.filter((row) => {
    if (!row.brandName) return false;
    return overwrite || !row.brandUrl || !row.phone || !row.email;
  });

  console.log(`대상 행: ${targetRows.length}개 (${sheetName}!${startRow}:${endRow}, overwrite=${overwrite})`);
  const results = await crawlRows(targetRows, {
    concurrency: Number(args.concurrency || DEFAULTS.concurrency),
    requestTimeoutMs: Number(args.timeout || DEFAULTS.requestTimeoutMs),
  });

  await updateBrandRows(sheets, spreadsheetId, sheetName, context.columns, results, { overwrite });
  console.log(`완료: ${results.length}개 행 업데이트`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
