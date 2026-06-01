# MES 2.0.1 Release Notes

MES 2.0.1은 2.0.0 이후 발견된 저장소 감지 문제와 문서/배포 경로를 정리한 패치 릴리즈입니다.

## 변경 사항

- userscript 매니저가 GM API를 전역 객체 속성이 아니라 sandbox 바인딩으로 제공하는 경우도 감지하도록 수정했습니다.
- 레거시 MES 저장소 식별자를 유지해 업데이트 후 기존 GM 저장소 규칙이 사라진 것처럼 보이는 문제를 줄였습니다.
- GM 저장소가 정상으로 잡힌 뒤에도 예전 사이트별 `localStorage` fallback 규칙이 남아 있으면 자동으로 GM 저장소에 병합합니다.
- GitHub raw 주소를 설치/업데이트 URL로 사용하도록 메타데이터와 README를 정리했습니다.
- README 기본 문서를 한국어로 바꾸고, 기능별 실제 UI 캡처 갤러리를 추가했습니다.
- 타 MES(Picky)에서 기존 필터 데이터가 감지될 때 마이그레이션하는 방법을 README에 이미지와 함께 추가했습니다.
- smoke test에 sandbox GM 저장소 감지와 fallback 규칙 마이그레이션 경로를 추가해 다른 사이트 규칙이 `다른 사이트`로 표시되는지 검증합니다.

## 검증

- `npm test` 통과
- GitHub Actions Validate 통과 대상: `main`, `stable`
