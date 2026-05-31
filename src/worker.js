#!/usr/bin/env node
import { DEFAULTS, getSpreadsheetId } from './config.js';
import { getSheetsClient } from './googleAuth.js';
import { crawlRows } from './crawler.js';
import { getPendingJobs, readSheetContext, updateBrandRows, updateJobStatus } from './sheets.js';

async function main() {
  const spreadsheetId = getSpreadsheetId(process.env.SPREADSHEET_URL);
  const jobsSheetName = process.env.JOBS_SHEET_NAME || DEFAULTS.jobsSheetName;
  if (!spreadsheetId) throw new Error('SPREADSHEET_URL이 필요합니다.');

  const sheets = await getSheetsClient();
  const jobs = await getPendingJobs(sheets, spreadsheetId, jobsSheetName);
  console.log(`대기 중인 작업: ${jobs.length}개`);

  for (const job of jobs) {
    await updateJobStatus(sheets, spreadsheetId, jobsSheetName, job, 'RUNNING', 'Codex worker started');
    try {
      const endRow = job.endRow || job.startRow + (job.limit || 50) - 1;
      const context = await readSheetContext(sheets, spreadsheetId, job.sheetName, {
        dataStartRow: job.startRow,
        endRow,
        limit: job.limit || 50,
      });
      const rows = context.rows.filter((row) => row.brandName && (job.overwrite || !row.brandUrl || !row.phone || !row.email));
      const results = await crawlRows(rows);
      await updateBrandRows(sheets, spreadsheetId, job.sheetName, context.columns, results, { overwrite: job.overwrite });
      await updateJobStatus(sheets, spreadsheetId, jobsSheetName, job, 'DONE', `${results.length}개 행 업데이트`);
    } catch (error) {
      await updateJobStatus(sheets, spreadsheetId, jobsSheetName, job, 'FAILED', error.message);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
