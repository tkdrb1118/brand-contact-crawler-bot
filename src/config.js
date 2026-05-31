import 'dotenv/config';

export const DEFAULTS = {
  headerRow: 2,
  dataStartRow: 3,
  jobsSheetName: process.env.JOBS_SHEET_NAME || '_brandCrawlerJobs',
  concurrency: Number(process.env.CONCURRENCY || 3),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 12000),
  overwrite: String(process.env.OVERWRITE || '').toLowerCase() === 'true',
};

export function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) continue;
    const key = raw.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function getSpreadsheetId(input) {
  if (!input) return '';
  const match = String(input).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : String(input).trim();
}
