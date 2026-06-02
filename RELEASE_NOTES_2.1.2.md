# MES 2.1.2 Release Notes

MES 2.1.2는 iframe 안에서 MES 버튼과 패널이 중복 표시되는 문제를 정리한 패치입니다.

## 변경 사항

- iframe 내부에서는 MES 버튼, 패널, 토스트, UI 스타일을 생성하지 않도록 변경
- iframe 내부에서도 저장된 차단 규칙과 DOM 변경 감시는 계속 적용
- 같은 출처 iframe 내부 요소는 부모 페이지 UI에서 더 안정적으로 탐색하도록 보강
- iframe 작업자 모드 회귀 테스트 추가

## 검증

- 원본/미니파이 문법 검사
- UI 잡음 검사
- iframe 작업자 모드 smoke test
- 전체 smoke test
