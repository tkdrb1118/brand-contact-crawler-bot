# Brand Contact Crawler Bot

Google Sheets의 `브랜드명`, `브랜드URL`, `연락처`, `이메일` 컬럼을 기준으로 브랜드 공식 URL과 연락처를 수집해 채우는 자동화입니다.

현재는 두 가지 실행 방식을 지원합니다.

- Apps Script 단독 실행: 시트 메뉴에서 트리거를 설치하면 10분마다 최대 30개 업체를 직접 수집합니다.
- Node.js/Codex 실행: 로컬이나 Codex에서 `npm run crawl`, `npm run worker`로 실행합니다.

기본 동작은 안전하게 `빈 브랜드URL/연락처/이메일`만 채웁니다. 기존 값을 다시 수집해 덮어쓰려면 코드의 `overwrite` 또는 CLI의 `--overwrite`를 사용합니다.

## Apps Script 설치

1. 대상 Google Sheet에서 `확장 프로그램` > `Apps Script`를 엽니다.
2. `apps-script/Code.gs` 전체 내용을 붙여넣고 저장합니다.
3. Apps Script 편집기에서 `onOpen`을 한 번 실행하고 권한을 승인합니다.
4. 시트를 새로고침합니다.
5. 상단 메뉴 `브랜드 DB 수집`을 사용합니다.

메뉴:

- `30개 즉시 수집`: 현재 지정된 시트에서 최대 30개 업체를 바로 수집합니다.
- `자동 트리거 설치(10분마다 30개)`: 시간 기반 트리거를 만들고 10분마다 30개씩 처리합니다.
- `자동 트리거 중지`: 설치된 자동 트리거를 제거합니다.
- `현재 시트를 수집 대상으로 지정`: 트리거가 처리할 대상 탭을 현재 탭으로 고정합니다.
- `진행 상태 초기화`: 다음 실행 행을 3행으로 되돌립니다.
- `실행 로그 열기`: `_brandCrawlerRuns` 로그 시트를 엽니다.
- `GitHub 자동 로그 동기화 설정`: 배치 실행마다 GitHub에 실행 로그 JSON을 자동 커밋하도록 설정합니다.

## Apps Script 기준

대상 영업 시트:

- 헤더 행: 2행
- 데이터 시작 행: 3행
- 필수 헤더: `브랜드명`, `브랜드URL`, `연락처`, `이메일`
- 배치 크기: 30개
- 기본 트리거: 10분마다 실행

영업금지/크롤링 제외 시트:

- URL: `https://docs.google.com/spreadsheets/d/1o1ji4gYXu9iPqBNZaWOBhPH8wMjlpz3jRMXWoDrnux8/edit`
- 탭: `영업금지리스트`
- 헤더 행: 4행
- 데이터 시작 행: 5행
- 기준 헤더: `광고주 업체명`, `사이트`
- 매칭 기준: 브랜드명 정규화 매칭, URL 정규화 매칭, 네이버 스마트스토어/브랜드스토어 ID 매칭, 자사몰 도메인 매칭
- `blog.naver.com`, `map.naver.com` 같은 공용 플랫폼 도메인은 전체 호스트 제외로 처리하지 않습니다.

## GitHub 자동 로그 동기화

Apps Script 메뉴에서 `GitHub 자동 로그 동기화 설정`을 누르면 저장소와 토큰을 입력합니다.

- 저장소 기본값: `tkdrb1118/brand-contact-crawler-bot`
- 토큰 권한: 해당 저장소의 contents 쓰기 권한
- 저장 위치: `logs/apps-script-runs/YYYYMMDD-HHmmss.json`

토큰은 Apps Script의 Script Properties에 저장됩니다. 코드 자체의 Git 업데이트는 이 저장소에서 관리하고, 시트 실행 결과는 로그 JSON으로 GitHub에 자동 커밋됩니다.

## Node.js 설치

```bash
git clone https://github.com/tkdrb1118/brand-contact-crawler-bot.git
cd brand-contact-crawler-bot
npm install
cp .env.example .env
```

Google Sheets 쓰기 권한은 둘 중 하나로 설정합니다.

1. 서비스 계정 JSON을 `credentials/service-account.json`에 저장하고, 해당 서비스 계정 이메일을 Google Sheet에 편집자로 공유합니다.
2. OAuth Desktop Client JSON을 `credentials/oauth-client.json`에 저장합니다. 첫 실행 시 브라우저 인증 URL이 출력되고 토큰은 `.tokens/`에 저장됩니다.

## Node.js 실행

```bash
npm run crawl -- --sheet-url "https://docs.google.com/spreadsheets/d/14_wDg1O9qfNaCtgQU8FJQVj_3ItCFVykMbdWXHd5Mxo/edit" --sheet-name "김윤아" --start-row 3 --limit 50
```

제외 시트를 명령어에서 직접 지정할 수도 있습니다.

```bash
npm run crawl -- --sheet-url "대상_영업시트_URL" --sheet-name "김윤아" --exclude-sheet-url "https://docs.google.com/spreadsheets/d/1o1ji4gYXu9iPqBNZaWOBhPH8wMjlpz3jRMXWoDrnux8/edit" --exclude-sheet-name "영업금지리스트" --start-row 3 --limit 100
```

옵션:

- `--start-row 3`: 처리 시작 행
- `--limit 50`: 처리 행 수
- `--end-row 120`: 종료 행을 직접 지정
- `--overwrite`: 기존 브랜드URL/연락처/이메일도 다시 덮어쓰기
- `--concurrency 3`: 동시 요청 수
- `--exclude-sheet-url`: 크롤링 제외 목록 Google Sheet URL
- `--exclude-sheet-name`: 제외 목록 탭 이름
- `--exclude-header-row 4`: 제외 목록 헤더 행
- `--exclude-data-start-row 5`: 제외 목록 데이터 시작 행

## 크롤링 정책

1. 기존 `브랜드URL`이 있으면 우선 확인합니다.
2. `brand.naver.com` 또는 `smartstore.naver.com` 링크는 네이버 브랜드스토어/스마트스토어 우선 소스로 취급합니다.
3. 네이버 스토어가 없거나 연락처가 부족하면 공식몰, 회사소개, 고객센터, 문의 페이지 링크를 추가 확인합니다.
4. 영업금지 리스트의 `광고주 업체명` 또는 `사이트`와 매칭되면 크롤링하지 않습니다.
5. 이메일과 한국 전화번호 패턴을 추출해 `연락처`, `이메일` 컬럼에 기록합니다.

웹사이트 구조와 차단 정책에 따라 일부 브랜드는 자동 수집이 실패할 수 있습니다. 실패 행은 행 범위를 줄여 재시도하거나 덮어쓰기 옵션으로 재검증하세요.
