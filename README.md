# Brand Contact Crawler Bot

Google Sheets의 `브랜드명`, `브랜드URL`, `연락처`, `이메일` 컬럼을 기준으로 브랜드 공식 URL과 연락처를 수집해 채우는 Node.js 자동화 봇입니다.

기본 동작은 안전하게 `빈 브랜드URL/연락처/이메일`만 채웁니다. 기존 값을 다시 수집해 덮어쓰려면 `--overwrite`를 사용합니다.

## 시트 기준

- 헤더 행: 2행
- 데이터 시작 행: 3행
- 필수 헤더: `브랜드명`, `브랜드URL`, `연락처`, `이메일`
- 현재 대상 예시: `AI_영업 시트` > `김윤아`

## 설치

```bash
git clone <GITHUB_URL>
cd brand-contact-crawler-bot
npm install
cp .env.example .env
```

Google Sheets 쓰기 권한은 둘 중 하나로 설정합니다.

1. 서비스 계정 JSON을 `credentials/service-account.json`에 저장하고, 해당 서비스 계정 이메일을 Google Sheet에 편집자로 공유합니다.
2. OAuth Desktop Client JSON을 `credentials/oauth-client.json`에 저장합니다. 첫 실행 시 브라우저 인증 URL이 출력되고 토큰은 `.tokens/`에 저장됩니다.

## 바로 실행

```bash
npm run crawl -- --sheet-url "https://docs.google.com/spreadsheets/d/14_wDg1O9qfNaCtgQU8FJQVj_3ItCFVykMbdWXHd5Mxo/edit" --sheet-name "김윤아" --start-row 3 --limit 50
```

옵션:

- `--start-row 3`: 처리 시작 행
- `--limit 50`: 처리 행 수
- `--end-row 120`: 종료 행을 직접 지정
- `--overwrite`: 기존 브랜드URL/연락처/이메일도 다시 덮어쓰기
- `--concurrency 3`: 동시 요청 수

## Apps Script 버튼 설치

1. Google Sheet에서 `확장 프로그램` > `Apps Script`를 엽니다.
2. `apps-script/Code.gs` 내용을 붙여넣고 저장합니다.
3. 시트를 새로고침하면 상단 메뉴에 `브랜드 크롤러`가 생깁니다.
4. `선택 행 크롤링 요청` 또는 `빈 연락처/이메일 100행 요청`을 누릅니다.
5. 로컬 PC 또는 Codex 작업공간에서 아래 명령을 실행합니다.

```bash
npm run worker
```

Apps Script는 `_brandCrawlerJobs` 숨김 시트에 작업 요청을 남기고, Node.js worker가 해당 요청을 읽어 실제 크롤링과 업데이트를 수행합니다.

## 크롤링 정책

1. 기존 `브랜드URL`이 있으면 우선 확인합니다.
2. `brand.naver.com` 또는 `smartstore.naver.com` 링크는 네이버 브랜드스토어/스마트스토어 우선 소스로 취급합니다.
3. 네이버 스토어가 없거나 연락처가 부족하면 공식몰, 회사소개, 고객센터, 문의 페이지 링크를 추가 확인합니다.
4. 이메일과 한국 전화번호 패턴을 추출해 `연락처`, `이메일` 컬럼에 기록합니다.

웹사이트 구조와 차단 정책에 따라 일부 브랜드는 자동 수집이 실패할 수 있습니다. 실패 행은 행 범위를 줄여 재시도하거나 `--overwrite`로 재검증하세요.
