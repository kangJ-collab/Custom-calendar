# Custom Calendar

일반 일정, 교대근무, 업무 기록, 루틴을 하나의 구조에서 직접 구성하는 빌드 없는 오프라인 우선 웹 달력입니다.

## 주요 기능

- 42칸 고정 월간 달력
- 날짜 상태, 메모, 사용자 기록 항목
- 반복 패턴과 날짜별 직접 변경
- 안전한 사용자 계산 결과
- 기본 템플릿과 사용자 템플릿
- 테마와 화면 구성
- 날짜 기록 자동 저장
- JSON 백업·복원
- PWA 설치와 오프라인 실행

## 실행

저장소 루트의 파일을 정적 호스팅에 그대로 배포합니다. 빌드 명령과 데이터베이스가 필요하지 않습니다.

```text
index.html
css/app.css
js/app.js
js/pwa.js
manifest.webmanifest
sw.js
icons/
```

서비스 워커는 `file://`에서 동작하지 않으므로 localhost, GitHub Pages, Cloudflare Pages처럼 HTTPS 또는 로컬 HTTP 서버에서 실행해야 합니다.

## 개인정보

데이터는 브라우저 LocalStorage에만 저장되며 앱 자체는 사용자 데이터를 외부 서버로 전송하지 않습니다. 외부 요청은 SUIT 오픈소스 폰트 CDN 한 건이며 실패해도 시스템 글꼴로 앱 기능이 유지됩니다.

## 라이선스

MIT License. 자세한 내용은 `LICENSE`를 확인하세요.
