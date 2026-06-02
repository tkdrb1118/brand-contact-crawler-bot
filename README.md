# Brand Contact Crawler Bot

Google Sheets의 `브랜드명`, `브랜드URL`, `연락처`, `이메일` 컬럼을 기준으로 신규 브랜드 DB를 발굴하고 브랜드 공식 URL과 연락처를 수집해 채우는 자동화입니다.

현재는 두 가지 실행 방식을 지원합니다.

- Apps Script 단독 실행: 시트 안의 실행 체크박스를 누를 때마다 신규 브랜드 DB 발굴만 최대 30개 수행합니다.
- Node.js/Codex 실행: 로컬이나 Codex에서 `npm run crawl`, `npm run worker`로 실행합니다.

Apps Script 버튼 실행은 기존 행의 `브랜드URL`, `연락처`, `이메일` 빈값을 보강하지 않고 네이버 브랜드스토어/스마트스토어 후보를 발굴해 시트 마지막 브랜드 행 아래에 신규 브랜드 DB만 추가합니다. 신규 발굴 시에는 브랜드명/브랜드URL을 추가하고, 별도로 자사몰 후보를 찾아 접속해 고객센터 전화번호와 협업/마케팅/대표 이메일이 고지되어 있으면 `연락처`, `이메일`에 함께 기입합니다. 이때 자사몰 URL은 시트에 기입하지 않습니다.
컨트롤 시트의 `신규발굴`과 `업데이트`는 이번 실행에서 새로 추가된 업체 수입니다.
마지막 행 판단은 시트 전체가 아니라 `브랜드명` 컬럼의 마지막 입력 행을 기준으로 하므로, 뒤쪽 빈 행이나 서식 때문에 실행 위치가 밀리지 않습니다.
Apps Script 6분 제한을 피하기 위해 실행시간 여유가 부족하면 30개를 채우기 전이라도 자동 중단하고 다음 시작 행을 저장합니다. 이 경우 `브랜드DB수집!B5`에 `시간보호 중단`이 표시되며, 체크박스를 다시 누르면 이어서 진행합니다.

## Apps Script 설치

1. 대상 Google Sheet에서 `확장 프로그램` > `Apps Script`를 엽니다.
2. `apps-script/Code.gs` 전체 내용을 붙여넣고 저장합니다.
3. Apps Script 편집기 함수 드롭다운에서 `setupAutomation`을 선택해 실행하고 권한을 승인합니다.
4. `setupAutomation`은 대상 시트 ID를 저장하고 진행 위치를 3행으로 초기화한 뒤, `브랜드DB수집` 시트에 실행 체크박스를 만듭니다.
5. 이후 `브랜드DB수집` 시트의 `수집 실행` 체크박스를 누를 때마다 최대 30개 신규 브랜드를 발굴합니다.
6. 시트가 bound script로 연결된 경우에는 새로고침 후 상단 메뉴 `브랜드 DB 수집`도 사용할 수 있습니다.
7. 실행 후 `브랜드DB수집!B5`에서 `행 범위 / 스캔 수 / 수집 수 / 업데이트 수 / 완성행스킵 수 / 제외 수 / 무효URL 수`를 확인합니다.

주의: Apps Script 편집기에서 `onOpen`을 직접 실행하지 마세요. `onOpen`은 시트가 열릴 때 메뉴를 만들기 위한 함수라 독립 실행 컨텍스트에서는 `Cannot call SpreadsheetApp.getUi()` 오류가 날 수 있습니다.
시간 기반 자동 수집은 사용하지 않습니다. 수집은 사용자가 체크박스를 누를 때만 실행됩니다.

메뉴:

- `30개 즉시 수집`: 현재 지정된 시트에서 신규 브랜드 DB 발굴만 바로 실행합니다.
- `실행 버튼 설치/갱신`: `브랜드DB수집` 시트와 실행 체크박스를 만들고, 체크박스 onEdit 트리거를 설치합니다.
- `수집 트리거 중지`: 설치된 체크박스 트리거를 제거합니다.
- `영업금지/URL 유효성 점검`: 영업금지 리스트 중복과 사라진 브랜드스토어 URL을 점검합니다.
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
- 실행 방식: `브랜드DB수집` 시트의 체크박스를 누를 때만 실행

영업금지/크롤링 제외 시트:

- URL: `https://docs.google.com/spreadsheets/d/1o1ji4gYXu9iPqBNZaWOBhPH8wMjlpz3jRMXWoDrnux8/edit`
- 탭: `영업금지리스트`
- 헤더 행: 4행
- 데이터 시작 행: 5행
- 기준 헤더: `광고주 업체명`, `사이트`
- 매칭 기준: 브랜드명 정규화 매칭, URL 정규화 매칭, 네이버 스마트스토어/브랜드스토어 ID 매칭, 자사몰 도메인 매칭
- `blog.naver.com`, `map.naver.com` 같은 공용 플랫폼 도메인은 전체 호스트 제외로 처리하지 않습니다.
- 매 실행마다 영업금지 리스트와 중복되는 브랜드/URL은 수집하지 않고 `_brandCrawlerBlockedMatches`에 기록합니다.
- 브랜드스토어 URL이 404/410 또는 사라진 페이지로 확인되면 기존 URL을 신뢰하지 않고 재탐색하며 `_brandCrawlerInvalidUrls`에 기록합니다.
- 기존 행 보강은 하지 않습니다. 체크박스 실행 시 네이버 브랜드스토어/스마트스토어 후보를 발굴해 마지막 브랜드 행 아래에 신규 행만 추가합니다.
- 신규 발굴 브랜드명은 한글 매핑을 우선 사용하고, 가능한 경우 스토어 페이지 제목에서 한글명을 추출합니다.
- 자사몰 URL은 내부 조회용으로만 사용하고, 최하단/고객센터/제휴 페이지에 있는 고객센터 전화번호와 협업/마케팅/대표 이메일만 `연락처`, `이메일`에 기입합니다.
- `코지마`, `호무로`, `랩노쉬`, `한끼통살`은 영업금지 시트 누락 여부와 관계없이 항상 제외합니다.

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
5. 브랜드스토어 URL이 사라진 URL인지 확인하고, 사라진 URL이면 기존 URL을 사용하지 않습니다.
6. 이메일과 한국 전화번호 패턴을 추출해 `연락처`, `이메일` 컬럼에 기록합니다.

웹사이트 구조와 차단 정책에 따라 일부 브랜드는 자동 수집이 실패할 수 있습니다. 실패 행은 행 범위를 줄여 재시도하거나 덮어쓰기 옵션으로 재검증하세요.
