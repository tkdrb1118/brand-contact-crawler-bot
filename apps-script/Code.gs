const CONFIG = {
  menuName: '브랜드 DB 수집',
  batchSize: 30,
  targetSpreadsheetId: '14_wDg1O9qfNaCtgQU8FJQVj_3ItCFVykMbdWXHd5Mxo',
  targetSheetName: '김윤아',
  controlSheetName: '브랜드DB수집',
  controlCheckboxCell: 'B2',
  controlStatusCell: 'B4',
  controlLastResultCell: 'B5',
  headerRow: 2,
  dataStartRow: 3,
  excludeSpreadsheetId: '1o1ji4gYXu9iPqBNZaWOBhPH8wMjlpz3jRMXWoDrnux8',
  excludeSheetName: '영업금지리스트',
  excludeHeaderRow: 4,
  excludeDataStartRow: 5,
  stateSheetName: '_brandCrawlerState',
  logSheetName: '_brandCrawlerRuns',
  blockedLogSheetName: '_brandCrawlerBlockedMatches',
  invalidUrlLogSheetName: '_brandCrawlerInvalidUrls',
  requestTimeoutMs: 7000,
  maxPagesPerBrand: 2,
  maxRuntimeMs: 4 * 60 * 1000,
  runtimeStopBufferMs: 45 * 1000,
  overwrite: false,
  refreshExisting: false,
  collectOnlyMissingRows: true,
  discoverNewBrands: true,
  discoverySeedCount: 3,
  discoverySearchesPerRun: 4,
  discoveryCandidateLimit: 80,
  enrichDiscoveredRowsImmediately: false,
  defaultGithubRepo: 'tkdrb1118/brand-contact-crawler-bot',
};

const DISCOVERY_KEYWORDS = [
  '생활가전 브랜드스토어',
  '주방가전 브랜드스토어',
  '이미용가전 브랜드스토어',
  '소형가전 스마트스토어',
  '뷰티디바이스 브랜드스토어',
  '음식물처리기 브랜드스토어',
  '커피머신 브랜드스토어',
  '청소기 브랜드스토어',
  '헤어드라이어 브랜드스토어',
  '정수기 브랜드스토어',
  '마사지기 브랜드스토어',
  '건강가전 스마트스토어',
];

const DISCOVERY_FALLBACK_STORES = [
  'https://brand.naver.com/pulmuone_cooking',
  'https://smartstore.naver.com/clickstore',
  'https://smartstore.naver.com/jadamteo',
  'https://smartstore.naver.com/cosmoenc1',
  'https://smartstore.naver.com/lequip',
  'https://brand.naver.com/kdnavien',
  'https://smartstore.naver.com/braunhousehold',
  'https://smartstore.naver.com/designers',
  'https://smartstore.naver.com/joasnt',
  'https://smartstore.naver.com/inigma',
  'https://smartstore.naver.com/tefal_official',
  'https://smartstore.naver.com/ecot',
  'https://smartstore.naver.com/9ooditem',
  'https://smartstore.naver.com/modo-home',
  'https://smartstore.naver.com/mionic',
  'https://smartstore.naver.com/lamostore',
  'https://smartstore.naver.com/invio',
  'https://smartstore.naver.com/phoenix',
  'https://smartstore.naver.com/deximkorea',
  'https://smartstore.naver.com/musetech',
  'https://smartstore.naver.com/no1bestshop',
  'https://smartstore.naver.com/indderia',
  'https://smartstore.naver.com/dawon-mall',
  'https://smartstore.naver.com/rosevie',
  'https://smartstore.naver.com/kpage',
  'https://brand.naver.com/homethera',
  'https://brand.naver.com/cnpcosmetics',
  'https://smartstore.naver.com/joncare',
  'https://brand.naver.com/da_room',
  'https://smartstore.naver.com/wellsing',
  'https://smartstore.naver.com/ecoce_shop',
  'https://smartstore.naver.com/celticmall',
  'https://brand.naver.com/smegkorea',
  'https://brand.naver.com/nespressokorea',
  'https://brand.naver.com/breville',
  'https://smartstore.naver.com/delonghikorea',
  'https://smartstore.naver.com/themachine',
  'https://smartstore.naver.com/lineup',
  'https://brand.naver.com/braun',
  'https://brand.naver.com/narwal',
  'https://smartstore.naver.com/haaneasytech',
  'https://smartstore.naver.com/roborockstore',
  'https://smartstore.naver.com/mgtec',
  'https://brand.naver.com/patech',
  'https://brand.naver.com/hyundaiquming',
  'https://brand.naver.com/chungho',
  'https://brand.naver.com/cozyma',
  'https://smartstore.naver.com/_blueing',
  'https://smartstore.naver.com/philipsmassage',
  'https://smartstore.naver.com/brams',
  'https://brand.naver.com/pulio_official',
  'https://smartstore.naver.com/proseller',
  'https://smartstore.naver.com/ventilationmall',
];

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

const SHARED_HOSTS = {
  'blog.naver.com': true,
  'map.naver.com': true,
  'cafe.naver.com': true,
  'smartstore.naver.com': true,
  'brand.naver.com': true,
  'modoo.at': true,
};

function onOpen() {
  const ui = getUiOrNull_();
  if (!ui) return;
  ui
    .createMenu(CONFIG.menuName)
    .addItem('30개 즉시 수집', 'runCrawlerBatch')
    .addItem('실행 버튼 설치/갱신', 'setupAutomation')
    .addItem('수집 트리거 중지', 'removeBatchTriggers')
    .addItem('영업금지/URL 유효성 점검', 'auditBlockedAndInvalidUrls')
    .addSeparator()
    .addItem('현재 시트를 수집 대상으로 지정', 'setActiveSheetAsTarget')
    .addItem('진행 상태 초기화', 'resetCrawlerState')
    .addItem('실행 로그 열기', 'openRunLog')
    .addSeparator()
    .addItem('GitHub 자동 로그 동기화 설정', 'configureGithubSync')
    .addItem('GitHub 자동 로그 동기화 해제', 'disableGithubSync')
    .addToUi();
}

function setupAutomation() {
  setConfiguredTarget_();
  resetCrawlerProgress_();
  createControlSheet_();
  removeBatchTriggers();
  ScriptApp.newTrigger('handleControlEdit')
    .forSpreadsheet(CONFIG.targetSpreadsheetId)
    .onEdit()
    .create();
  const message = `설정 완료: '${CONFIG.controlSheetName}' 시트의 체크박스를 누를 때마다 최대 ${CONFIG.batchSize}개 업체를 수집합니다.`;
  notify_(message);
  return message;
}

function installBatchTrigger() {
  return setupAutomation();
}

function removeBatchTriggers() {
  const handlers = {
    runCrawlerBatch: true,
    handleControlEdit: true,
  };
  ScriptApp.getProjectTriggers()
    .filter((trigger) => handlers[trigger.getHandlerFunction()])
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
}

function handleControlEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.controlSheetName) return;
  if (e.range.getA1Notation() !== CONFIG.controlCheckboxCell) return;
  if (String(e.value).toUpperCase() !== 'TRUE') return;

  sheet.getRange(CONFIG.controlStatusCell).setValue(`실행 중: ${new Date()}`);
  SpreadsheetApp.flush();
  try {
    const summary = runCrawlerBatch();
    sheet.getRange(CONFIG.controlStatusCell).setValue(`완료: ${new Date()}`);
    sheet.getRange(CONFIG.controlLastResultCell).setValue(formatRunSummary_(summary));
  } catch (error) {
    sheet.getRange(CONFIG.controlStatusCell).setValue(`오류: ${error.message}`);
    sheet.getRange(CONFIG.controlLastResultCell).setValue(`오류: ${error.message}`);
    throw error;
  } finally {
    e.range.setValue(false);
  }
}

function setActiveSheetAsTarget() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    setConfiguredTarget_();
    notify_(`수집 대상 시트: ${CONFIG.targetSheetName}`);
    return;
  }
  const sheet = active.getActiveSheet();
  PropertiesService.getDocumentProperties().setProperty('TARGET_SHEET_NAME', sheet.getName());
  PropertiesService.getDocumentProperties().setProperty('TARGET_SPREADSHEET_ID', active.getId());
  notify_(`수집 대상 시트: ${sheet.getName()}`);
}

function resetCrawlerState() {
  resetCrawlerProgress_();
  notify_('진행 상태를 3행부터 다시 시작하도록 초기화했습니다.');
}

function openRunLog() {
  if (!SpreadsheetApp.getActiveSpreadsheet()) {
    getRunLogSheet_();
    notify_('실행 로그 시트를 생성/확인했습니다. 대상 Google Sheet에서 확인하세요.');
    return;
  }
  SpreadsheetApp.setActiveSheet(getRunLogSheet_());
}

function auditBlockedAndInvalidUrls() {
  const sheet = getTargetSheet_();
  const columns = resolveTargetColumns_(sheet);
  const exclusions = loadExclusions_();
  const lastRow = sheet.getLastRow();
  const summary = {
    blocked: 0,
    invalidBrandStoreUrls: 0,
    checked: 0,
  };

  for (let rowNumber = CONFIG.dataStartRow; rowNumber <= lastRow; rowNumber += 1) {
    const row = readBrandRow_(sheet, columns, rowNumber);
    if (!row.brandName) continue;
    summary.checked += 1;

    const exclusion = exclusions.isExcluded(row);
    if (exclusion.excluded) {
      summary.blocked += 1;
      appendBlockedMatchLog_(row, exclusion);
    }

    const urlStatus = checkBrandStoreUrl_(row.brandUrl);
    if (urlStatus.invalid) {
      summary.invalidBrandStoreUrls += 1;
      appendInvalidUrlLog_(row, urlStatus);
    }
  }

  const message = `점검 완료: ${summary.checked}개 확인, 영업금지 매칭 ${summary.blocked}개, 사라진 브랜드스토어 URL ${summary.invalidBrandStoreUrls}개`;
  notify_(message);
  return message;
}

function configureGithubSync() {
  const ui = SpreadsheetApp.getUi();
  const repoPrompt = ui.prompt('GitHub 저장소', 'owner/repo 형식으로 입력하세요.', ui.ButtonSet.OK_CANCEL);
  if (repoPrompt.getSelectedButton() !== ui.Button.OK) return;

  const tokenPrompt = ui.prompt('GitHub 토큰', 'repo contents 쓰기 권한이 있는 fine-grained token 또는 PAT를 입력하세요. Script Properties에 저장됩니다.', ui.ButtonSet.OK_CANCEL);
  if (tokenPrompt.getSelectedButton() !== ui.Button.OK) return;

  const props = PropertiesService.getScriptProperties();
  props.setProperty('GITHUB_REPO', repoPrompt.getResponseText().trim() || CONFIG.defaultGithubRepo);
  props.setProperty('GITHUB_TOKEN', tokenPrompt.getResponseText().trim());
  ui.alert('GitHub 자동 로그 동기화를 설정했습니다. 이후 배치 실행마다 logs/apps-script-runs/*.json 파일이 커밋됩니다.');
}

function disableGithubSync() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('GITHUB_REPO');
  props.deleteProperty('GITHUB_TOKEN');
  notify_('GitHub 자동 로그 동기화를 해제했습니다.');
}

function runCrawlerBatch() {
  const startedAt = new Date();
  const ss = getTargetSpreadsheet_();
  const sheet = getTargetSheet_();
  const columns = resolveTargetColumns_(sheet);
  const exclusions = loadExclusions_();
  const lastRow = getLastDataRow_(sheet, columns.brandName + 1);
  let nextRow = Number(PropertiesService.getDocumentProperties().getProperty('NEXT_ROW') || CONFIG.dataStartRow);
  if (nextRow < CONFIG.dataStartRow || nextRow > lastRow) nextRow = CONFIG.dataStartRow;

  const deadline = Date.now() + CONFIG.maxRuntimeMs;
  const summary = {
    startedAt: startedAt.toISOString(),
    finishedAt: '',
    sheetName: sheet.getName(),
    startRow: nextRow,
    nextRow,
    lastScannedRow: nextRow - 1,
    reachedEnd: false,
    scanned: 0,
    processed: 0,
    updated: 0,
    skippedExcluded: 0,
    skippedComplete: 0,
    invalidBrandStoreUrls: 0,
    discovered: 0,
    stoppedByTimeLimit: false,
    errors: [],
  };

  if (CONFIG.discoverNewBrands && !hasRowsNeedingCollection_(sheet, columns)) {
    const seedSummary = appendFallbackSeedRows_(sheet, columns, exclusions);
    summary.scanned = seedSummary.scanned;
    summary.discovered = seedSummary.discovered;
    summary.updated = seedSummary.discovered;
    summary.skippedExcluded = seedSummary.skippedExcluded;
    summary.invalidBrandStoreUrls = seedSummary.invalidBrandStoreUrls || 0;
    summary.errors = summary.errors.concat(seedSummary.errors);
    summary.nextRow = CONFIG.dataStartRow;
    summary.lastScannedRow = lastRow;
    summary.reachedEnd = true;
    persistProgress_(summary);
    summary.finishedAt = new Date().toISOString();
    appendRunLog_(summary);
    syncGithubRunLog_(summary);
    updateControlSheetResult_(summary);
    notify_(formatRunSummary_(summary));
    return summary;
  }

  if (lastRow < CONFIG.dataStartRow) {
    if (CONFIG.discoverNewBrands && !shouldStopBeforeNextRow_(deadline)) {
      const discoverySummary = discoverNewBrandRows_(sheet, columns, exclusions, deadline);
      if (discoverySummary.discovered === 0 && !shouldStopBeforeNextRow_(deadline)) {
        const seedSummary = appendFallbackSeedRows_(sheet, columns, exclusions);
        discoverySummary.discovered += seedSummary.discovered;
        discoverySummary.scanned += seedSummary.scanned;
        discoverySummary.skippedExcluded += seedSummary.skippedExcluded;
        discoverySummary.invalidBrandStoreUrls = (discoverySummary.invalidBrandStoreUrls || 0) + (seedSummary.invalidBrandStoreUrls || 0);
        discoverySummary.errors = discoverySummary.errors.concat(seedSummary.errors);
      }
      summary.discovered = discoverySummary.discovered;
      summary.updated += discoverySummary.discovered;
      summary.scanned += discoverySummary.scanned;
      summary.skippedExcluded += discoverySummary.skippedExcluded;
      summary.invalidBrandStoreUrls += discoverySummary.invalidBrandStoreUrls || 0;
      summary.errors = summary.errors.concat(discoverySummary.errors);
    }
    summary.nextRow = CONFIG.dataStartRow;
    summary.reachedEnd = true;
    summary.finishedAt = new Date().toISOString();
    appendRunLog_(summary);
    syncGithubRunLog_(summary);
    updateControlSheetResult_(summary);
    notify_(formatRunSummary_(summary));
    return summary;
  }

  for (let rowNumber = nextRow; rowNumber <= lastRow; rowNumber += 1) {
    if (summary.processed >= CONFIG.batchSize || shouldStopBeforeNextRow_(deadline)) {
      summary.nextRow = rowNumber;
      summary.stoppedByTimeLimit = summary.processed < CONFIG.batchSize;
      break;
    }

    summary.scanned += 1;
    summary.lastScannedRow = rowNumber;
    summary.nextRow = rowNumber + 1;
    const row = readBrandRow_(sheet, columns, rowNumber);
    if (!row.brandName) continue;

    if (shouldSkipCompleteRow_(row)) {
      summary.skippedComplete += 1;
      persistProgress_(summary);
      continue;
    }

    const exclusion = exclusions.isExcluded(row);
    if (exclusion.excluded) {
      summary.skippedExcluded += 1;
      appendBlockedMatchLog_(row, exclusion);
      persistProgress_(summary);
      continue;
    }

    const urlStatus = checkBrandStoreUrl_(row.brandUrl);
    if (urlStatus.invalid) {
      summary.invalidBrandStoreUrls += 1;
      row.brandUrlInvalid = true;
      appendInvalidUrlLog_(row, urlStatus);
    }

    if (!CONFIG.refreshExisting && !CONFIG.overwrite && !row.brandUrlInvalid && row.brandUrl && row.phone && row.email) {
      summary.skippedComplete += 1;
      persistProgress_(summary);
      continue;
    }

    summary.processed += 1;
    try {
      const result = crawlBrand_(row);
      const changed = writeBrandResult_(sheet, columns, rowNumber, row, result);
      if (changed) summary.updated += 1;
    } catch (error) {
      summary.errors.push(`row ${rowNumber}: ${error.message}`);
    }
    persistProgress_(summary);
  }

  if (summary.nextRow > lastRow) {
    summary.nextRow = CONFIG.dataStartRow;
    summary.reachedEnd = true;
  }

  if (CONFIG.discoverNewBrands && summary.processed === 0 && summary.reachedEnd && !shouldStopBeforeNextRow_(deadline)) {
    const discoverySummary = discoverNewBrandRows_(sheet, columns, exclusions, deadline);
    if (discoverySummary.discovered === 0 && !shouldStopBeforeNextRow_(deadline)) {
      const seedSummary = appendFallbackSeedRows_(sheet, columns, exclusions);
      discoverySummary.discovered += seedSummary.discovered;
      discoverySummary.scanned += seedSummary.scanned;
      discoverySummary.skippedExcluded += seedSummary.skippedExcluded;
      discoverySummary.invalidBrandStoreUrls = (discoverySummary.invalidBrandStoreUrls || 0) + (seedSummary.invalidBrandStoreUrls || 0);
      discoverySummary.errors = discoverySummary.errors.concat(seedSummary.errors);
    }
    summary.discovered = discoverySummary.discovered;
    summary.updated += discoverySummary.discovered;
    summary.scanned += discoverySummary.scanned;
    summary.skippedExcluded += discoverySummary.skippedExcluded;
    summary.invalidBrandStoreUrls += discoverySummary.invalidBrandStoreUrls || 0;
    summary.errors = summary.errors.concat(discoverySummary.errors);
  }

  persistProgress_(summary);
  summary.finishedAt = new Date().toISOString();
  const skipGithubSync = shouldStopBeforeNextRow_(deadline);
  if (skipGithubSync) {
    summary.errors.push('GitHub 로그 동기화는 실행시간 보호를 위해 이번 회차에서 건너뜀');
  }
  appendRunLog_(summary);
  if (!skipGithubSync) {
    syncGithubRunLog_(summary);
  }
  updateControlSheetResult_(summary);
  notify_(formatRunSummary_(summary));
  return summary;
}

function setConfiguredTarget_() {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('TARGET_SPREADSHEET_ID', CONFIG.targetSpreadsheetId);
  props.setProperty('TARGET_SHEET_NAME', CONFIG.targetSheetName);
}

function getTargetSpreadsheet_() {
  const props = PropertiesService.getDocumentProperties();
  const spreadsheetId = props.getProperty('TARGET_SPREADSHEET_ID') || CONFIG.targetSpreadsheetId;
  return SpreadsheetApp.openById(spreadsheetId);
}

function getTargetSheet_() {
  const ss = getTargetSpreadsheet_();
  const targetName = PropertiesService.getDocumentProperties().getProperty('TARGET_SHEET_NAME') || CONFIG.targetSheetName;
  if (targetName && ss.getSheetByName(targetName)) return ss.getSheetByName(targetName);
  return ss.getActiveSheet();
}

function createControlSheet_() {
  const ss = getTargetSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.controlSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.controlSheetName, 0);
  }

  sheet.clear();
  sheet.getRange('A1:D1').merge().setValue('브랜드 DB 수집 컨트롤').setFontWeight('bold').setFontSize(14);
  sheet.getRange('A2').setValue('수집 실행');
  sheet.getRange(CONFIG.controlCheckboxCell).insertCheckboxes().setValue(false);
  sheet.getRange('A3').setValue('동작');
  sheet.getRange('B3').setValue(`체크박스를 누를 때마다 기존 빈값 보강 후 신규 브랜드 DB를 최대 ${CONFIG.batchSize}개 발굴/추가`);
  sheet.getRange('A4').setValue('상태');
  sheet.getRange(CONFIG.controlStatusCell).setValue('대기');
  sheet.getRange('A5').setValue('최근 결과');
  sheet.getRange(CONFIG.controlLastResultCell).setValue('');
  sheet.getRange('A6').setValue('항상 적용되는 조건');
  sheet.getRange('B6').setValue('영업금지 리스트 브랜드/URL 매칭 시 수집 제외');
  sheet.getRange('B7').setValue('브랜드스토어 URL 404/410 등 사라진 URL이면 기존 URL을 사용하지 않고 재탐색');
  sheet.getRange('B8').setValue('기존 보강 대상이 없으면 네이버 브랜드스토어/스마트스토어 후보를 발굴해 마지막 행 아래에 추가');
  sheet.setColumnWidths(1, 4, 220);
  sheet.getRange('A1:D8').setWrap(true);
  sheet.activate();
}

function formatRunSummary_(summary) {
  const endRow = Math.max(summary.lastScannedRow || summary.nextRow - 1, summary.startRow);
  const noTargets = summary.processed === 0 && summary.discovered === 0 && summary.skippedComplete > 0 && summary.reachedEnd;
  const suffix = noTargets
    ? ' / 수집 대상 없음'
    : (summary.reachedEnd ? ' / 마지막 행 도달' : (summary.stoppedByTimeLimit ? ' / 시간보호 중단' : ''));
  return `행 ${summary.startRow}~${endRow} / 스캔 ${summary.scanned}개 / 보강수집 ${summary.processed}개 / 신규발굴 ${summary.discovered || 0}개 / 업데이트 ${summary.updated}개 / 완성행스킵 ${summary.skippedComplete}개 / 제외 ${summary.skippedExcluded}개 / 무효URL ${summary.invalidBrandStoreUrls}개${suffix}`;
}

function updateControlSheetResult_(summary) {
  try {
    const sheet = getTargetSpreadsheet_().getSheetByName(CONFIG.controlSheetName);
    if (!sheet) return;
    sheet.getRange(CONFIG.controlLastResultCell).setValue(formatRunSummary_(summary));
  } catch (error) {
    Logger.log(`control sheet update failed: ${error.message}`);
  }
}

function getLastDataRow_(sheet, columnNumber) {
  const maxRows = sheet.getLastRow();
  if (maxRows < CONFIG.dataStartRow) return maxRows;
  const values = sheet.getRange(CONFIG.dataStartRow, columnNumber, maxRows - CONFIG.dataStartRow + 1, 1).getDisplayValues();
  for (let i = values.length - 1; i >= 0; i -= 1) {
    if (clean_(values[i][0])) return CONFIG.dataStartRow + i;
  }
  return CONFIG.dataStartRow - 1;
}

function shouldStopBeforeNextRow_(deadline) {
  return Date.now() >= deadline - CONFIG.runtimeStopBufferMs;
}

function persistProgress_(summary) {
  PropertiesService.getDocumentProperties().setProperty('NEXT_ROW', String(summary.nextRow));
}

function resetCrawlerProgress_() {
  PropertiesService.getDocumentProperties().deleteProperty('NEXT_ROW');
}

function shouldSkipCompleteRow_(row) {
  return CONFIG.collectOnlyMissingRows
    && !CONFIG.overwrite
    && !CONFIG.refreshExisting
    && row.brandUrl
    && row.phone
    && row.email;
}

function hasRowsNeedingCollection_(sheet, columns) {
  const lastRow = getLastDataRow_(sheet, columns.brandName + 1);
  if (lastRow < CONFIG.dataStartRow) return false;
  const values = sheet.getRange(CONFIG.dataStartRow, 1, lastRow - CONFIG.dataStartRow + 1, sheet.getLastColumn()).getDisplayValues();
  for (let i = 0; i < values.length; i += 1) {
    const row = {
      brandName: clean_(values[i][columns.brandName]),
      brandUrl: clean_(values[i][columns.brandUrl]),
      phone: clean_(values[i][columns.phone]),
      email: clean_(values[i][columns.email]),
    };
    if (row.brandName && !shouldSkipCompleteRow_(row)) return true;
  }
  return false;
}

function discoverNewBrandRows_(sheet, columns, exclusions, deadline) {
  const summary = {
    scanned: 0,
    discovered: 0,
    skippedExcluded: 0,
    invalidBrandStoreUrls: 0,
    errors: [],
  };
  const existing = loadExistingTargetKeys_(sheet, columns);
  const candidates = discoverBrandCandidates_(deadline);
  const appendRows = [];

  for (let i = 0; i < candidates.length && appendRows.length < CONFIG.batchSize; i += 1) {
    if (shouldStopBeforeNextRow_(deadline)) break;
    const candidate = candidates[i];
    summary.scanned += 1;

    const row = {
      rowNumber: '',
      brandName: candidate.brandName,
      brandUrl: candidate.brandUrl,
      phone: '',
      email: '',
    };
    const brandKey = normalizeBrandName_(row.brandName);
    const urlKey = normalizeUrlKey_(row.brandUrl);
    const storeId = naverStoreId_(row.brandUrl);
    if (!row.brandName || !row.brandUrl || existing.brands[brandKey] || existing.urlKeys[urlKey] || existing.storeIds[storeId]) {
      continue;
    }

    const exclusion = exclusions.isExcluded(row);
    if (exclusion.excluded) {
      summary.skippedExcluded += 1;
      appendBlockedMatchLog_(row, exclusion);
      continue;
    }

    try {
      const result = CONFIG.enrichDiscoveredRowsImmediately ? crawlBrand_(row) : row;
      const resolved = {
        brandName: result.brandName || row.brandName,
        brandUrl: result.brandUrl || row.brandUrl,
        phone: result.phone || '',
        email: result.email || '',
      };
      const resolvedBrandKey = normalizeBrandName_(resolved.brandName);
      const resolvedUrlKey = normalizeUrlKey_(resolved.brandUrl);
      const resolvedStoreId = naverStoreId_(resolved.brandUrl);
      if (existing.brands[resolvedBrandKey] || existing.urlKeys[resolvedUrlKey] || existing.storeIds[resolvedStoreId]) continue;
      appendRows.push(resolved);
      existing.brands[resolvedBrandKey] = true;
      existing.urlKeys[resolvedUrlKey] = true;
      if (resolvedStoreId) existing.storeIds[resolvedStoreId] = true;
    } catch (error) {
      summary.errors.push(`discover ${row.brandName}: ${error.message}`);
    }
  }

  if (appendRows.length) {
    appendDiscoveredRows_(sheet, columns, appendRows);
    summary.discovered = appendRows.length;
  }
  return summary;
}

function discoverBrandCandidates_(deadline) {
  const prop = PropertiesService.getDocumentProperties();
  let index = Number(prop.getProperty('DISCOVERY_QUERY_INDEX') || '0');
  let fallbackIndex = Number(prop.getProperty('DISCOVERY_FALLBACK_INDEX') || '0');
  const candidates = [];

  for (let i = 0; i < CONFIG.discoveryCandidateLimit && i < DISCOVERY_FALLBACK_STORES.length; i += 1) {
    const url = normalizeUrl_(DISCOVERY_FALLBACK_STORES[(fallbackIndex + i) % DISCOVERY_FALLBACK_STORES.length]);
    candidates.push({
      brandName: brandNameFromStoreUrl_(url),
      brandUrl: isNaverStore_(url) && url.indexOf('/profile') === -1 ? url.replace(/\/$/, '') + '/profile' : url,
    });
  }
  fallbackIndex = (fallbackIndex + CONFIG.batchSize) % DISCOVERY_FALLBACK_STORES.length;

  for (let attempts = 0; attempts < CONFIG.discoverySearchesPerRun && !shouldStopBeforeNextRow_(deadline); attempts += 1) {
    const keyword = DISCOVERY_KEYWORDS[index % DISCOVERY_KEYWORDS.length];
    index += 1;
    const urls = [
      `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
      `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword + ' 공식몰')}`,
    ];
    urls.forEach((url) => {
      const html = fetchPage_(url);
      if (!html) return;
      candidates.push.apply(candidates, extractDiscoveryCandidates_(html));
    });
  }

  prop.setProperty('DISCOVERY_QUERY_INDEX', String(index % DISCOVERY_KEYWORDS.length));
  prop.setProperty('DISCOVERY_FALLBACK_INDEX', String(fallbackIndex));
  return uniqueCandidates_(candidates).slice(0, CONFIG.discoveryCandidateLimit);
}

function extractDiscoveryCandidates_(html) {
  const candidates = [];
  const regex = /https?:\/\/(?:brand|smartstore)\.naver\.com\/[A-Za-z0-9._-]+(?:\/profile)?(?:\?[^"'\s<>]*)?/gi;
  let match;
  while ((match = regex.exec(String(html || ''))) !== null) {
    const url = normalizeUrl_(match[0].replace(/\\u0026/g, '&').replace(/&amp;/g, '&'));
    const storeId = naverStoreId_(url);
    if (!storeId) continue;
    candidates.push({
      brandName: brandNameFromStoreUrl_(url),
      brandUrl: isNaverStore_(url) && url.indexOf('/profile') === -1 ? url.replace(/\/$/, '') + '/profile' : url,
    });
  }
  return candidates;
}

function brandNameFromStoreUrl_(url) {
  const storeId = naverStoreId_(url);
  return storeId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function uniqueCandidates_(candidates) {
  const seen = {};
  return candidates.filter((candidate) => {
    const key = naverStoreId_(candidate.brandUrl) || normalizeUrlKey_(candidate.brandUrl);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function loadExistingTargetKeys_(sheet, columns) {
  const lastRow = getLastDataRow_(sheet, columns.brandName + 1);
  const existing = { brands: {}, urlKeys: {}, storeIds: {} };
  if (lastRow < CONFIG.dataStartRow) return existing;
  const values = sheet.getRange(CONFIG.dataStartRow, 1, lastRow - CONFIG.dataStartRow + 1, sheet.getLastColumn()).getDisplayValues();
  values.forEach((row) => {
    const brand = clean_(row[columns.brandName]);
    const url = clean_(row[columns.brandUrl]);
    const brandKey = normalizeBrandName_(brand);
    const urlKey = normalizeUrlKey_(url);
    const storeId = naverStoreId_(url);
    if (brandKey) existing.brands[brandKey] = true;
    if (urlKey) existing.urlKeys[urlKey] = true;
    if (storeId) existing.storeIds[storeId] = true;
  });
  return existing;
}

function appendDiscoveredRows_(sheet, columns, rows) {
  const startRow = Math.max(getLastDataRow_(sheet, columns.brandName + 1) + 1, CONFIG.dataStartRow);
  rows.forEach((row, index) => {
    const rowNumber = startRow + index;
    sheet.getRange(rowNumber, columns.brandName + 1).setValue(row.brandName);
    sheet.getRange(rowNumber, columns.brandUrl + 1).setValue(row.brandUrl);
    if (row.phone) sheet.getRange(rowNumber, columns.phone + 1).setValue(row.phone);
    if (row.email) sheet.getRange(rowNumber, columns.email + 1).setValue(row.email);
  });
}

function appendFallbackSeedRows_(sheet, columns, exclusions) {
  const summary = {
    scanned: 0,
    discovered: 0,
    skippedExcluded: 0,
    invalidBrandStoreUrls: 0,
    errors: [],
  };
  const existing = loadExistingTargetKeys_(sheet, columns);
  const rows = [];
  const prop = PropertiesService.getDocumentProperties();
  let index = Number(prop.getProperty('DISCOVERY_FORCE_INDEX') || '0');

  for (let i = 0; i < DISCOVERY_FALLBACK_STORES.length && rows.length < CONFIG.batchSize; i += 1) {
    const url = String(DISCOVERY_FALLBACK_STORES[(index + i) % DISCOVERY_FALLBACK_STORES.length] || '').trim();
    const storeMatch = url.match(/(?:brand|smartstore)\.naver\.com\/([^/?#]+)/i);
    const storeId = storeMatch ? storeMatch[1].toLowerCase() : '';
    if (!storeId) {
      summary.scanned += 1;
      continue;
    }
    const row = {
      brandName: storeId.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()).trim(),
      brandUrl: url.indexOf('/profile') === -1 ? url.replace(/\/$/, '') + '/profile' : url,
      phone: '',
      email: '',
    };
    summary.scanned += 1;

    if (existing.storeIds[storeId]) continue;

    const exclusion = exclusions.isExcluded(row);
    if (exclusion.excluded) {
      summary.skippedExcluded += 1;
      appendBlockedMatchLog_(row, exclusion);
      continue;
    }

    const urlStatus = checkBrandStoreUrl_(row.brandUrl);
    if (urlStatus.invalid) {
      summary.invalidBrandStoreUrls += 1;
      appendInvalidUrlLog_(row, urlStatus);
      continue;
    }

    rows.push(row);
    existing.storeIds[storeId] = true;
  }

  index = (index + Math.max(summary.scanned, CONFIG.batchSize)) % DISCOVERY_FALLBACK_STORES.length;
  prop.setProperty('DISCOVERY_FORCE_INDEX', String(index));
  if (rows.length) {
    appendDiscoveredRows_(sheet, columns, rows);
    summary.discovered = rows.length;
  } else {
    summary.errors.push('fallback seed candidates were exhausted or blocked before append');
  }
  return summary;
}

function resolveTargetColumns_(sheet) {
  const headers = sheet.getRange(CONFIG.headerRow, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return {
    brandName: findHeader_(headers, ['브랜드명']),
    brandUrl: findHeader_(headers, ['브랜드URL']),
    phone: findHeader_(headers, ['연락처']),
    email: findHeader_(headers, ['이메일']),
  };
}

function readBrandRow_(sheet, columns, rowNumber) {
  const values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  return {
    rowNumber,
    brandName: clean_(values[columns.brandName]),
    brandUrl: clean_(values[columns.brandUrl]),
    phone: clean_(values[columns.phone]),
    email: clean_(values[columns.email]),
  };
}

function writeBrandResult_(sheet, columns, rowNumber, row, result) {
  let changed = false;
  if ((CONFIG.overwrite || !row.brandUrl || row.brandUrlInvalid) && result.brandUrl && result.brandUrl !== row.brandUrl) {
    sheet.getRange(rowNumber, columns.brandUrl + 1).setValue(result.brandUrl);
    changed = true;
  }
  if ((CONFIG.overwrite || CONFIG.refreshExisting || !row.phone) && result.phone && result.phone !== row.phone) {
    sheet.getRange(rowNumber, columns.phone + 1).setValue(result.phone);
    changed = true;
  }
  if ((CONFIG.overwrite || CONFIG.refreshExisting || !row.email) && result.email && result.email !== row.email) {
    sheet.getRange(rowNumber, columns.email + 1).setValue(result.email);
    changed = true;
  }
  return changed;
}

function crawlBrand_(row) {
  const crawlUrl = row.brandUrlInvalid ? '' : row.brandUrl;
  const candidates = buildCandidateUrls_(row.brandName, crawlUrl);
  const pages = [];

  for (let i = 0; i < candidates.length && pages.length < CONFIG.maxPagesPerBrand; i += 1) {
    const url = candidates[i];
    const html = fetchPage_(url);
    if (!html) continue;

    if (isSearchPage_(url)) {
      const discovered = pickSearchResultLinks_(url, html);
      for (let j = 0; j < discovered.length && pages.length < CONFIG.maxPagesPerBrand; j += 1) {
        const discoveredHtml = fetchPage_(discovered[j]);
        if (discoveredHtml) pages.push({ url: discovered[j], html: discoveredHtml });
      }
      continue;
    }

    pages.push({ url, html });
    const contactLinks = pickContactLinks_(url, html);
    for (let j = 0; j < contactLinks.length && pages.length < CONFIG.maxPagesPerBrand; j += 1) {
      const contactHtml = fetchPage_(contactLinks[j]);
      if (contactHtml) pages.push({ url: contactLinks[j], html: contactHtml });
    }
  }

  const text = pages.map((page) => htmlToText_(page.html)).join('\n');
  const contacts = extractContacts_(text);
  return {
    brandName: extractBrandNameFromPages_(pages, row.brandName),
    brandUrl: chooseBestUrl_(crawlUrl, pages),
    phone: contacts.phone || row.phone,
    email: contacts.email || row.email,
  };
}

function extractBrandNameFromPages_(pages, fallback) {
  for (let i = 0; i < pages.length; i += 1) {
    const html = pages[i].html;
    const candidates = [
      pickMetaContent_(html, 'og:title'),
      pickMetaContent_(html, 'twitter:title'),
      (String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1],
    ];
    for (let j = 0; j < candidates.length; j += 1) {
      const name = cleanBrandTitle_(candidates[j]);
      if (name) return name;
    }
  }
  return fallback;
}

function pickMetaContent_(html, property) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const reversePattern = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
  return (String(html || '').match(pattern) || String(html || '').match(reversePattern) || [])[1] || '';
}

function cleanBrandTitle_(value) {
  return clean_(String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/\s*[:|-]\s*네이버\s*(?:브랜드스토어|스마트스토어|쇼핑).*$/i, '')
    .replace(/\s*네이버\s*(?:브랜드스토어|스마트스토어|쇼핑).*$/i, '')
    .replace(/\s*공식(?:몰|스토어).*$/i, '')
    .trim());
}

function buildCandidateUrls_(brandName, existingUrl) {
  const urls = [];
  if (existingUrl) {
    urls.push(normalizeUrl_(existingUrl));
    if (isNaverStore_(existingUrl) && existingUrl.indexOf('/profile') === -1) {
      urls.push(existingUrl.replace(/\/$/, '') + '/profile');
    }
    return unique_(urls);
  }

  const query = encodeURIComponent(brandName);
  urls.push(`https://search.naver.com/search.naver?query=${query}%20브랜드스토어`);
  urls.push(`https://search.naver.com/search.naver?query=${query}%20공식몰%20연락처`);
  return unique_(urls);
}

function fetchPage_(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      followRedirects: true,
      muteHttpExceptions: true,
      validateHttpsCertificates: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
    });
    const code = response.getResponseCode();
    if (code < 200 || code >= 400) return '';
    return response.getContentText('UTF-8');
  } catch (error) {
    return '';
  }
}

function checkBrandStoreUrl_(url) {
  if (!url || !isNaverStore_(url)) return { checked: false, invalid: false };
  try {
    const response = UrlFetchApp.fetch(normalizeUrl_(url), {
      followRedirects: true,
      muteHttpExceptions: true,
      validateHttpsCertificates: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
    });
    const status = response.getResponseCode();
    const body = response.getContentText('UTF-8').slice(0, 3000);
    if (status === 404 || status === 410) {
      return { checked: true, invalid: true, status, reason: 'HTTP_NOT_FOUND' };
    }
    if (status >= 200 && status < 400) {
      if (/판매자의 사정으로|존재하지 않는|페이지를 찾을 수|없는 페이지|스토어가 없습니다|요청하신 페이지/i.test(body)) {
        return { checked: true, invalid: true, status, reason: 'STORE_NOT_AVAILABLE' };
      }
      return { checked: true, invalid: false, status, reason: 'OK' };
    }
    if (status === 403 || status === 429) {
      return { checked: true, invalid: false, status, reason: 'CHECK_BLOCKED_NOT_TREATED_AS_INVALID' };
    }
    return { checked: true, invalid: status >= 400, status, reason: `HTTP_${status}` };
  } catch (error) {
    return { checked: true, invalid: false, status: '', reason: `CHECK_FAILED_${error.message}` };
  }
}

function pickContactLinks_(baseUrl, html) {
  const baseHost = host_(baseUrl);
  const links = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const label = stripTags_(match[2]) + ' ' + href;
    if (!CONTACT_HINTS.some((hint) => label.toLowerCase().indexOf(hint.toLowerCase()) !== -1)) continue;
    const absolute = absoluteUrl_(baseUrl, href);
    if (absolute && host_(absolute) === baseHost) links.push(absolute);
  }
  return unique_(links).slice(0, 4);
}

function pickSearchResultLinks_(baseUrl, html) {
  const links = [];
  const regex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1].replace(/&amp;/g, '&');
    if (url.indexOf('adcr.naver.com') !== -1) continue;
    if (/brand\.naver\.com|smartstore\.naver\.com|official|mall/i.test(url)) links.push(url);
  }
  return unique_(links).slice(0, 4);
}

function chooseBestUrl_(inputUrl, pages) {
  if (inputUrl) return normalizeUrl_(inputUrl);
  const naver = pages.find((page) => isNaverStore_(page.url));
  if (naver) return normalizeUrl_(naver.url);
  return pages[0] ? normalizeUrl_(pages[0].url) : '';
}

function loadExclusions_() {
  const sheet = SpreadsheetApp.openById(CONFIG.excludeSpreadsheetId).getSheetByName(CONFIG.excludeSheetName);
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(CONFIG.excludeHeaderRow, 1, Math.max(lastRow - CONFIG.excludeHeaderRow + 1, 1), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0] || [];
  const brandColumn = findHeader_(headers, ['광고주 업체명', '브랜드명', '업체명', '광고주']);
  const urlColumn = findHeader_(headers, ['사이트', '브랜드URL', 'URL', 'url']);
  const brands = {};
  const urlKeys = {};
  const storeIds = {};
  const hosts = {};

  values.slice(CONFIG.excludeDataStartRow - CONFIG.excludeHeaderRow).forEach((row) => {
    extractBrandNames_(row[brandColumn]).forEach((brand) => {
      brands[normalizeBrandName_(brand)] = brand;
    });
    extractUrls_(row[urlColumn]).forEach((url) => {
      const key = normalizeUrlKey_(url);
      const storeId = naverStoreId_(url);
      const host = host_(url);
      if (key) urlKeys[key] = url;
      if (storeId) storeIds[storeId] = url;
      if (host && !SHARED_HOSTS[host]) hosts[host] = url;
    });
  });

  return {
    isExcluded(row) {
      const brand = normalizeBrandName_(row.brandName);
      if (brand && brands[brand]) return { excluded: true, reason: 'brand', value: brands[brand] };
      const urlKey = normalizeUrlKey_(row.brandUrl);
      if (urlKey && urlKeys[urlKey]) return { excluded: true, reason: 'url', value: urlKeys[urlKey] };
      const storeId = naverStoreId_(row.brandUrl);
      if (storeId && storeIds[storeId]) return { excluded: true, reason: 'naver_store', value: storeIds[storeId] };
      const rowHost = host_(row.brandUrl);
      if (rowHost && hosts[rowHost]) return { excluded: true, reason: 'host', value: hosts[rowHost] };
      return { excluded: false };
    },
  };
}

function extractContacts_(text) {
  const normalized = String(text || '')
    .replace(/&#64;|&#x40;|&commat;/gi, '@')
    .replace(/&amp;/gi, '&')
    .replace(/\s*\[at\]\s*/gi, '@')
    .replace(/\s*\(at\)\s*/gi, '@');
  const emails = unique_((normalized.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).filter(isUsableEmail_));
  const phones = unique_((normalized.match(/(?:\+82[-.\s]?)?(?:0\d{1,2}|1[568]\d{2})[-.\s)]?\d{3,4}[-.\s]?\d{4}/g) || []).map(normalizePhone_).filter(Boolean));
  return {
    email: emails.slice(0, 4).join(' / '),
    phone: phones.slice(0, 4).join(' / '),
  };
}

function appendRunLog_(summary) {
  const sheet = getRunLogSheet_();
  sheet.appendRow([
    new Date(),
    summary.sheetName,
    summary.startRow,
    summary.nextRow,
    summary.scanned,
    summary.processed,
    summary.updated,
    summary.skippedExcluded,
    summary.skippedComplete,
    summary.invalidBrandStoreUrls,
    summary.errors.join('\n'),
  ]);
}

function appendBlockedMatchLog_(row, exclusion) {
  const sheet = getOrCreateLogSheet_(CONFIG.blockedLogSheetName, [
    '기록시각',
    '행',
    '브랜드명',
    '브랜드URL',
    '차단사유',
    '매칭값',
  ]);
  sheet.appendRow([
    new Date(),
    row.rowNumber,
    row.brandName,
    row.brandUrl,
    exclusion.reason || '',
    exclusion.value || '',
  ]);
}

function appendInvalidUrlLog_(row, urlStatus) {
  const sheet = getOrCreateLogSheet_(CONFIG.invalidUrlLogSheetName, [
    '기록시각',
    '행',
    '브랜드명',
    '브랜드URL',
    'HTTP상태',
    '사유',
  ]);
  sheet.appendRow([
    new Date(),
    row.rowNumber,
    row.brandName,
    row.brandUrl,
    urlStatus.status || '',
    urlStatus.reason || '',
  ]);
}

function getRunLogSheet_() {
  return getOrCreateLogSheet_(CONFIG.logSheetName, [
      '실행시각',
      '시트',
      '시작행',
      '다음행',
      '스캔',
      '처리',
      '업데이트',
      '제외',
      '완료스킵',
      '무효URL',
      '오류',
    ]);
}

function getOrCreateLogSheet_(sheetName, headers) {
  const ss = getTargetSpreadsheet_();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.hideSheet();
  }
  return sheet;
}

function syncGithubRunLog_(summary) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const repo = props.getProperty('GITHUB_REPO') || CONFIG.defaultGithubRepo;
  if (!token || !repo) return;

  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd-HHmmss');
  const path = `logs/apps-script-runs/${stamp}.json`;
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const payload = {
    message: `Log Apps Script crawl run ${stamp}`,
    content: Utilities.base64Encode(JSON.stringify(summary, null, 2), Utilities.Charset.UTF_8),
  };
  UrlFetchApp.fetch(url, {
    method: 'put',
    muteHttpExceptions: true,
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    payload: JSON.stringify(payload),
  });
}

function getUiOrNull_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (error) {
    return null;
  }
}

function notify_(message) {
  const ui = getUiOrNull_();
  if (ui) {
    ui.alert(message);
    return;
  }
  try {
    getTargetSpreadsheet_().toast(message, CONFIG.menuName, 8);
  } catch (error) {
    Logger.log(message);
  }
}

function findHeader_(headers, candidates) {
  const index = headers.findIndex((header) => candidates.indexOf(clean_(header)) !== -1);
  if (index === -1) throw new Error(`필수 헤더를 찾지 못했습니다: ${candidates.join(', ')}`);
  return index;
}

function extractBrandNames_(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^.*주의[:：]\s*/u, '').replace(/^[★◆*\-\s]+/u, '').trim())
    .filter((item) => !/공지|주의|업체$/u.test(item))
    .filter((item) => item.length >= 2);
}

function extractUrls_(value) {
  return String(value || '').match(/https?:\/\/[^\s,]+/gi) || [];
}

function normalizeBrandName_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\(주\)|주식회사|㈜/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
}

function normalizeUrl_(value) {
  try {
    const url = new URL(String(value || '').trim());
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'NaPm', 'n_media', 'n_query', 'n_rank', 'n_ad_group', 'n_ad', 'n_keyword_id', 'n_keyword', 'n_campaign_type', 'n_contract', 'n_ad_group_type'].forEach((key) => url.searchParams.delete(key));
    return url.toString();
  } catch (error) {
    return clean_(value);
  }
}

function normalizeUrlKey_(value) {
  try {
    const url = new URL(normalizeUrl_(value));
    return url.hostname.replace(/^www\./, '').toLowerCase() + url.pathname.replace(/\/$/, '');
  } catch (error) {
    return '';
  }
}

function naverStoreId_(value) {
  try {
    const url = new URL(normalizeUrl_(value));
    if (!/(?:brand|smartstore)\.naver\.com$/i.test(url.hostname)) return '';
    return (url.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  } catch (error) {
    return '';
  }
}

function host_(value) {
  try {
    return new URL(normalizeUrl_(value)).hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
    return '';
  }
}

function absoluteUrl_(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch (error) {
    return '';
  }
}

function isNaverStore_(url) {
  return /^https?:\/\/(?:brand|smartstore)\.naver\.com\//i.test(url);
}

function isSearchPage_(url) {
  return /^https?:\/\/search\.naver\.com\//i.test(url);
}

function htmlToText_(html) {
  return stripTags_(String(html || '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, ' '));
}

function stripTags_(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function normalizePhone_(phone) {
  const normalized = String(phone || '')
    .replace(/^\+82[-.\s]?/, '0')
    .replace(/[.\s]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/-$/, '')
    .trim();
  if (/^0+-0+-0+$/.test(normalized)) return '';
  return normalized;
}

function isUsableEmail_(email) {
  const lower = String(email || '').toLowerCase();
  const parts = lower.split('@');
  const blockedPrefixes = { example: true, test: true, email: true, privacy: true, master: true };
  const blockedDomains = { 'example.com': true, 'example.co.kr': true, 'test.com': true, 'domain.com': true };
  return !blockedPrefixes[parts[0]] && !blockedDomains[parts[1]] && !/\.(png|jpg|gif)$/.test(lower);
}

function clean_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function unique_(values) {
  const seen = {};
  return values.filter((value) => {
    const key = clean_(value);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}
