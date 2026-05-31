import { DEFAULTS } from './config.js';

const REQUIRED_HEADERS = {
  brandName: '브랜드명',
  brandUrl: '브랜드URL',
  phone: '연락처',
  email: '이메일',
};

export async function readSheetContext(sheets, spreadsheetId, sheetName, options = {}) {
  const headerRow = Number(options.headerRow || DEFAULTS.headerRow);
  const dataStartRow = Number(options.dataStartRow || DEFAULTS.dataStartRow);
  const endRow = Number(options.endRow || dataStartRow + Number(options.limit || 100) - 1);
  const range = `${quoteSheet(sheetName)}!A${headerRow}:Z${endRow}`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  const values = response.data.values || [];
  const headers = values[0] || [];
  const columns = resolveColumns(headers);
  const rows = values.slice(dataStartRow - headerRow).map((cells, index) => ({
    rowNumber: dataStartRow + index,
    brandName: clean(cells[columns.brandName]),
    brandUrl: clean(cells[columns.brandUrl]),
    phone: clean(cells[columns.phone]),
    email: clean(cells[columns.email]),
    raw: cells,
  }));

  return { headers, columns, rows };
}

export async function updateBrandRows(sheets, spreadsheetId, sheetName, columns, results, options = {}) {
  const overwrite = Boolean(options.overwrite);
  const data = [];
  for (const result of results) {
    const row = result.input;
    const values = [
      shouldWrite(row.brandUrl, overwrite) ? result.brandUrl || row.brandUrl || '' : row.brandUrl,
      shouldWrite(row.phone, overwrite) ? result.phone || row.phone || '' : row.phone,
      shouldWrite(row.email, overwrite) ? result.email || row.email || '' : row.email,
    ];
    const cols = [columns.brandUrl, columns.phone, columns.email].map((col) => col + 1);
    for (let i = 0; i < cols.length; i += 1) {
      data.push({
        range: `${quoteSheet(sheetName)}!${columnLetter(cols[i])}${row.rowNumber}`,
        values: [[values[i]]],
      });
    }
  }

  if (!data.length) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
}

export async function ensureJobsSheet(sheets, spreadsheetId, jobsSheetName = DEFAULTS.jobsSheetName) {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties?.title === jobsSheetName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: jobsSheetName } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteSheet(jobsSheetName)}!A1:J1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['job_id', 'created_at', 'status', 'sheet_name', 'start_row', 'end_row', 'limit', 'overwrite', 'message', 'updated_at']],
      },
    });
  }
}

export async function getPendingJobs(sheets, spreadsheetId, jobsSheetName = DEFAULTS.jobsSheetName) {
  await ensureJobsSheet(sheets, spreadsheetId, jobsSheetName);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheet(jobsSheetName)}!A2:J500`,
  });
  const values = response.data.values || [];
  return values
    .map((row, index) => ({
      rowNumber: index + 2,
      jobId: row[0],
      status: row[2],
      sheetName: row[3],
      startRow: Number(row[4]),
      endRow: Number(row[5]),
      limit: Number(row[6]),
      overwrite: String(row[7]).toLowerCase() === 'true',
    }))
    .filter((job) => job.status === 'PENDING' && job.sheetName && job.startRow);
}

export async function updateJobStatus(sheets, spreadsheetId, jobsSheetName, job, status, message = '') {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${quoteSheet(jobsSheetName)}!C${job.rowNumber}`, values: [[status]] },
        { range: `${quoteSheet(jobsSheetName)}!I${job.rowNumber}:J${job.rowNumber}`, values: [[message, new Date().toISOString()]] },
      ],
    },
  });
}

function resolveColumns(headers) {
  const columns = {};
  for (const [key, label] of Object.entries(REQUIRED_HEADERS)) {
    const index = headers.findIndex((header) => clean(header) === label);
    if (index === -1) throw new Error(`필수 헤더를 찾지 못했습니다: ${label}`);
    columns[key] = index;
  }
  return columns;
}

function shouldWrite(currentValue, overwrite) {
  return overwrite || !clean(currentValue);
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function quoteSheet(sheetName) {
  return `'${String(sheetName).replaceAll("'", "''")}'`;
}

function columnLetter(number) {
  let result = '';
  let current = number;
  while (current > 0) {
    const mod = (current - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    current = Math.floor((current - mod) / 26);
  }
  return result;
}
