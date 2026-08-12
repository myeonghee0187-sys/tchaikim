# Tchai Kim 디자인 분석표

## 확인한 자료

- 디자인 원본: Figma `4조 한복판 - 차이킴` (fileKey `u0V6wCko0e6rElSeEOokvu`)
- 확인한 화면: main(`902:33`), collection(`1109:1391`) 구조 / 그 외 6개 노드는 렌더 접근만 확인
- 실제 에셋 위치: `assets/images`, `assets/images/main`, `assets/icons`

## 화면 목록

| 화면 | node-id | 원본 크기 | 상태 |
|---|---|---|---|
| main | 902:33 | 1920 × 15960 | 구현 중 |
| shop | 1523:1094 | 1920 × 13110.68 | 구현 중 (hero/banner/new_arrivals/shop 완료, garment_story·motif_detail 남음) |
| collection | 1109:1391 | 1920 × 17204 | 미구현 |
| (미확인) | 920:2608 | 1920 × 11459 | 미구현 |
| (미확인) | 590:30 | 1920 × 10373 | 미구현 |
| (미확인) | 650:20 | 1920 × 7707 | 미구현 |
| (미확인) | 660:119 | 1920 × 3571 | 미구현 |
| (미확인) | 1085:2210 | 13440 × 8485 | 미구현 |
| (미확인) | 948:21 | 1920 × 8553 | 미구현 |

### main 섹션 순서 (metadata 기준)

header / hero / textbox / 배너 / brand(brand1~5 가로) / korea(section1·section2) /
Instagram / Bespoke / 롤링 텍스트 / Shop / 코디(3-5 캐러셀) / 셀럽착용 / 클로징 / footer

## 공통 영역

- 헤더(`902:362`): hero 위에 겹치는 투명 헤더. 로고 + COLLECTION/SHOP/BESPOKE/BRAND + USD + 장바구니.
  - Figma 주석: "영문 사이트 단일버전 리디자인이라 영문 표시는 빼고 통화표시를 페르소나 기준으로 usd로만 해보았습니다"
- 푸터(`1024:1174`): 메뉴 5개 / 뉴스레터 / 소셜 3개 / TCHAI 워드마크 / 약관 4개 / 저작권
- 공통 버튼(hero): border 1px `rgba(255,255,255,0.6)`, radius 5px, padding 10px 20px

## 디자인 토큰

Figma 변수에서 확인한 값입니다.

- 본문색: `main/text` = `#0a0a0a`
- 강조색: `main/point` = `#1f433f`
- 푸터 배경: `#fffdf9`
- 보조 본문색: `#2e2e2e` (textbox), `#dddddd` (hero 어두운 배경 위)
- 헤더 메뉴색: `rgba(255,255,255,0.85)`
- 제목 폰트: Trirong — SemiBold 48/62/-2%, SemiBold 32/45/-1%, Bold 64/96/-2%
- 본문 폰트: Montserrat — Regular 20/32, Medium 24/38
- UI 폰트: Pretendard Variable — 14 / 15 / 16px
- 로고 폰트: Lamoric Rowen (폰트 파일 없음 → 이미지 에셋으로 대체)
- 라운드: 버튼 5px

## 반응형

시안은 1920px 단일 사이즈만 제공됩니다. 아래는 구현 시 정한 기준입니다.

- 360px: hero 2패널 세로 적층, 헤더 메뉴는 토글 패널
- 768px: hero 2패널 가로 배치(각 50%, height 100vh), 푸터 뉴스레터 행 가로 배치
- 1280px: 헤더 메뉴 상시 노출, hero 높이 986px 고정, 시안 좌표 그대로 적용
- 1920px: 콘텐츠 1600px + 좌우 여백 160px (푸터 기준)

## 인터랙션

- 헤더 메뉴: 1280px 미만에서 토글 (시안에 없음, 반응형 대응으로 추가)
- 버튼 hover: 시안에 상태 정의 없음 → border/배경 변화로 구현
- 스크롤: brand 가로 5패널, korea 스크롤 시퀀스, 롤링 텍스트, 코디·셀럽 캐러셀 (GSAP + ScrollTrigger 예정)

## 에셋

- 헤더 로고: `assets/images/header_logo_02.png` (흰색), `header_logo_1.png` (검정)
- 푸터 워드마크: `assets/images/footer_logo 2.png`
- hero 이미지: `assets/images/main/hero_bespoke.jpg`, `hero_shop.png`, `hero_shop_logo.png`
- 아이콘: `assets/icons/caret_down.svg`, `shopping_bag.svg`, `arrow_right.svg`, `arrow_up_right.svg`
- 폰트: Google Fonts(Trirong, Montserrat), jsDelivr(Pretendard Variable)

## 확인된 사실

- Figma 변수는 색상 2개(main/text, main/point)와 폰트 6개만 정의되어 있습니다. 나머지 색상은 각 노드의 하드코딩 값입니다.
- hero 두 패널은 각각 960 × 986이며, 이미지는 `opacity: 0.9`가 적용되어 있습니다.
- textbox는 1920 전체 폭에 하단 1px `rgba(0,0,0,0.5)` 선이 있고, 콘텐츠는 한 줄로 표시됩니다.

## 아직 확인하지 못한 내용

- `hero_bespoke.jpg` 원본에 "HanbokWave" 워터마크가 포함되어 있습니다. 교체용 원본이 있는지 확인이 필요합니다.
- hero의 `差 / 異 / 김영진` 텍스트(`902:40`)는 Figma에서 색상이 `transparent`입니다. 의도인지 확인이 필요합니다.
- 나머지 6개 노드가 어떤 화면인지 확인하지 않았습니다.
- 배너(`902:54`), brand, korea 등 이후 섹션의 상세 스펙은 아직 조회하지 않았습니다.
