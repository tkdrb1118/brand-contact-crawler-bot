#!/usr/bin/env node
import { DEFAULTS, getSpreadsheetId, parseArgs } from './config.js';
import { getSheetsClient } from './googleAuth.js';
import { crawlRows } from './crawler.js';
import { readSheetContext, updateBrandRows } from './sheets.js';
import { loadExclusions } from './exclusions.js';

async function main() {
  const args = parseArgs(process.argv);
  const spreadsheetId = getSpreadsheetId(args['sheet-url'] || args['spreadsheet-id'] || process.env.SPREADSHEET_URL);
  const sheetName = args['sheet-name'] || process.env.SHEET_NAME || '김윤아';
  const limit = Number(args.limit || 50);
  const startRow = Number(args['start-row'] || DEFAULTS.dataStartRow);
  const endRow = Number(args['end-row'] || startRow + limit - 1);
  const overwrite = Boolean(args.overwrite || DEFAULTS.overwrite);
  const excludeSheetUrl = args['exclude-sheet-url'] || args['exclude-spreadsheet-id'] || process.env.EXCLUDE_SPREADSHEET_URL;

  if (!spreadsheetId) {
    throw new Error('--sheet-url 또는 SPREADSHEET_URL이 필요합니다.');
  }

  const sheets = await getSheetsClient();
  const exclusions = await loadExclusions(sheets, {
    spreadsheetUrl: excludeSheetUrl,
    sheetName: args['exclude-sheet-name'] || DEFAULTS.excludeSheetName,
    headerRow: args['exclude-header-row'] || DEFAULTS.excludeHeaderRow,
    dataStartRow: args['exclude-data-start-row'] || DEFAULTS.excludeDataStartRow,
  });
  const context = await readSheetContext(sheets, spreadsheetId, sheetName, {
    dataStartRow: startRow,
    endRow,
    limit,
  });

  let excludedCount = 0;
  const targetRows = context.rows.filter((row) => {
    if (!row.brandName) return false;
    const exclusion = exclusions.isExcluded(row);
    if (exclusion.excluded) {
      excludedCount += 1;
      return false;
    }
    return overwrite || !row.brandUrl || !row.phone || !row.email;
  });

  console.log(`대상 행: ${targetRows.length}개, 제외 행: ${excludedCount}개 (${sheetName}!${startRow}:${endRow}, overwrite=${overwrite})`);
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
