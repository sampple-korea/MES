# MES 2.1.0 Release Notes

MES 2.1.0은 선택자 후보 품질, 성능 선택권, 배포 파일 크기를 개선한 기능 릴리즈입니다.

## 변경 사항

- 동적 광고 ID, class, 리소스 URL, 링크 패턴을 분석하는 고급 차단 후보를 추가했습니다.
- 고급 후보도 기존 MES 후보 목록 안에서 매칭 수, 위험도, 미리보기, 저장 확인 흐름을 그대로 거치도록 했습니다.
- 설정에 저사양 모드를 추가했습니다. 이 모드는 동적 감시 강도를 낮춰 부담을 줄이지만, 차단 성능이 저하될 수 있습니다.
- `MES.min.js` minified 배포 파일을 추가했습니다.
- 설치/업데이트 URL을 GitHub raw의 `MES.min.js`로 변경했습니다.
- `npm test`가 minified 파일을 빌드하고 source/minified 양쪽 smoke test를 모두 실행하도록 검증 흐름을 강화했습니다.

## 검증

- `npm test` 통과 필요
- GitHub Actions Validate 통과 대상: `main`, `stable`
