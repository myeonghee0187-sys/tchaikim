# [프로젝트명] 작업 규칙

## 작업 전 확인

- PRD.md와 디자인 자료를 먼저 읽습니다.
- package.json, lock 파일, 빌드 설정, 기존 폴더 구조를 확인합니다.
- 기존 공통 스타일, CSS 변수, 컴포넌트, 이미지, 아이콘, 폰트를 확인합니다.
- 확인된 사실과 추정을 구분합니다.

## 변경 원칙

- 사용자가 요청한 범위만 수정합니다.
- 기존 코드와 디자인 규칙을 최대한 유지합니다.
- 관련 없는 리팩터링, 파일명 변경, 기능 재작성을 하지 않습니다.
- 기존에 있는 기능과 공통 코드를 먼저 재사용합니다.
- 존재하지 않는 API, 파일, 경로, 에셋을 만들지 않습니다.
- 요청 없이 라이브러리를 설치하지 않습니다.

## 기술 스택

- HTML
- CSS
- JavaScript
- [프로젝트에서 이미 사용하는 라이브러리]
- React, Vue, TypeScript, Tailwind는 추가하지 않습니다.

## Repository documents

- Product requirements: `docs/PRD.md`
- Current implementation context: `docs/PROJECT_CONTEXT.md`
- Design analysis: `docs/design-analysis.md`
- Shared system guide: `docs/COMMON_SYSTEM.md`

## HTML

- 의미에 맞는 header, nav, main, section, article, footer를 사용합니다.
- 동작은 button, 페이지 이동은 a 요소를 사용합니다.
- 모든 입력은 label과 연결합니다.
- 아이콘 대신 이모지를 사용하지 않습니다.

## CSS

- 기존 CSS 변수와 디자인 토큰을 먼저 사용합니다.
- CSS class와 HTML id는 snake_case를 사용합니다.
- 상태 class는 is_active, is_open, is_selected 형식으로 작성합니다.
- 오류 class는 has_error 형식으로 작성합니다.
- 불필요한 !important를 사용하지 않습니다.
- 모바일부터 작성하고 360px, 768px, 1280px을 확인합니다.

## JavaScript

- 변수와 함수는 camelCase를 사용합니다.
- 불리언은 is, has, can, should로 시작합니다.
- 이벤트 함수는 handleXxx 형식으로 작성합니다.
- 전역 고정 상수만 UPPER_SNAKE_CASE를 사용합니다.
- 중복 로직은 목적이 분명한 함수로 분리합니다.
- 사용자 입력과 localStorage 데이터는 사용 전에 확인합니다.
- 임시 console.log는 완료 전에 제거합니다.

## 디자인 구현

- 디자인 원본을 시각 기준으로 사용합니다.
- 화면 구조, 간격, 정렬, 색상, 폰트, 상태를 임의로 재해석하지 않습니다.
- 실제 에셋을 우선 사용하고 placeholder URL을 만들지 않습니다.
- 디자인에 없는 기능이나 장식 모션을 추가하지 않습니다.

## Figma MCP

- 구조, 스크린샷, 변수, 디자인 컨텍스트를 순서대로 확인합니다.
- 생성된 코드를 그대로 붙이지 않고 현재 기술 스택에 맞게 해석합니다.
- 실제 에셋은 제공된 다운로드 기능으로 가져옵니다.
- 구현 후 브라우저 화면을 Figma 스크린샷과 비교합니다.

## 접근성과 상태

- 키보드 focus-visible을 확인합니다.
- 로딩, 빈 상태, 오류, 비활성 상태를 구현합니다.
- 색상만으로 상태를 전달하지 않습니다.
- prefers-reduced-motion을 반영합니다.

## 검증과 결과 보고

- [실제 lint 명령]
- [실제 테스트 명령]
- [실제 build 명령]
- 실행하지 않은 검증은 통과했다고 말하지 않습니다.
- 결과에는 변경 파일, 구현 내용, 주요 판단, 검증 결과, 확인하지 못한 부분을 구분해 작성합니다.
