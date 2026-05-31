const JOBS_SHEET_NAME = '_brandCrawlerJobs';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('브랜드 크롤러')
    .addItem('선택 행 크롤링 요청', 'requestSelectedRows')
    .addItem('빈 연락처/이메일 100행 요청', 'requestMissingContactRows')
    .addItem('작업 시트 열기', 'openJobsSheet')
    .addToUi();
}

function requestSelectedRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const range = sheet.getActiveRange();
  if (!range || range.getRow() < 3) {
    SpreadsheetApp.getUi().alert('데이터 행(3행 이후)을 선택해 주세요.');
    return;
  }

  appendJob_({
    sheetName: sheet.getName(),
    startRow: Math.max(range.getRow(), 3),
    endRow: range.getLastRow(),
    limit: range.getNumRows(),
    overwrite: false,
  });
  SpreadsheetApp.getUi().alert('크롤링 요청을 등록했습니다. Codex worker에서 npm run worker를 실행하면 처리됩니다.');
}

function requestMissingContactRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(3, 2, Math.max(lastRow - 2, 0), 6).getValues();
  let startRow = null;
  let endRow = null;
  let count = 0;

  for (let i = 0; i < values.length; i += 1) {
    const rowNumber = i + 3;
    const [brandName, brandUrl, , , phone, email] = values[i];
    const missing = brandName && (!brandUrl || !phone || !email);
    if (!missing) continue;
    if (startRow === null) startRow = rowNumber;
    endRow = rowNumber;
    count += 1;
    if (count >= 100) break;
  }

  if (!count) {
    SpreadsheetApp.getUi().alert('크롤링할 빈 브랜드URL/연락처/이메일 행이 없습니다.');
    return;
  }

  appendJob_({
    sheetName: sheet.getName(),
    startRow,
    endRow,
    limit: count,
    overwrite: false,
  });
  SpreadsheetApp.getUi().alert(`${count}개 행 크롤링 요청을 등록했습니다.`);
}

function openJobsSheet() {
  const sheet = getJobsSheet_();
  SpreadsheetApp.setActiveSheet(sheet);
}

function appendJob_(job) {
  const sheet = getJobsSheet_();
  sheet.appendRow([
    Utilities.getUuid(),
    new Date(),
    'PENDING',
    job.sheetName,
    job.startRow,
    job.endRow,
    job.limit,
    job.overwrite,
    '',
    '',
  ]);
}

function getJobsSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(JOBS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(JOBS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 10).setValues([[
      'job_id',
      'created_at',
      'status',
      'sheet_name',
      'start_row',
      'end_row',
      'limit',
      'overwrite',
      'message',
      'updated_at',
    ]]);
    sheet.hideSheet();
  }
  return sheet;
}
