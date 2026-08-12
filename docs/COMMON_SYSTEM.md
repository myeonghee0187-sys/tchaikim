# Common system guide

## Source of truth

Shared files live only in the repository-level `common/` directory. Do not copy them into individual page folders.

```text
common/
├─ css/
│  ├─ tokens.css
│  ├─ reset.css
│  ├─ common.css
│  └─ layout.css
├─ components/
│  ├─ header.html
│  └─ footer.html
└─ js/
   └─ common.js
```

## CSS responsibilities

- `tokens.css`: colors, typography, layout dimensions, radii, and motion values.
- `reset.css`: browser-default normalization only.
- `common.css`: body defaults, accessibility helpers, focus styles, and shared small components such as `.top_button`.
- `layout.css`: shared header and footer layout.
- Page CSS (`main.css`, `shop.css`, `bespoke.css`): page-specific sections and intentional page overrides only.

Load shared CSS before page CSS:

```html
<link rel="stylesheet" href="../../common/css/tokens.css">
<link rel="stylesheet" href="../../common/css/reset.css">
<link rel="stylesheet" href="../../common/css/common.css">
<link rel="stylesheet" href="../../common/css/layout.css">
<link rel="stylesheet" href="css/page.css">
```

## JavaScript responsibilities

`common/js/common.js` loads the shared header/footer and owns global navigation, newsletter, top-button, product-card, and smooth-scroll behavior. Lenis, GSAP, and ScrollTrigger are shared page dependencies; Three.js and section animations remain page-specific dependencies.

```html
<script src="../../common/js/common.js"></script>
<script src="js/page.js"></script>
```

## Top button

`common/js/common.js`가 초기화될 때 `.top_button`을 `body` 끝에 한 번만 자동 생성합니다.
페이지 HTML에 버튼을 직접 추가하지 않습니다. 공통 CSS·JS를 불러오는 모든 화면 크기에서
600px 이상 스크롤하면 나타나며, 모션 감소 설정에서는 즉시 맨 위로 이동합니다.

## Header and footer HTML

The header and footer each have one source of truth:

```text
common/components/header.html
common/components/footer.html
```

Add page and header-variant settings to the body:

```html
<!-- White header over imagery: Main and Shop -->
<body data-page="shop" data-header-variant="white">

<!-- Black header over a light background: Bespoke -->
<body class="page_bespoke" data-page="bespoke" data-header-variant="black">
```

Load the header with this slot:

```html
<div class="common_header_slot" data-component="../../common/components/header.html">
  <span class="a11y_hidden">Loading header</span>
</div>
```

`common.js` applies `is_white` or `is_black`, switches the matching logo, and marks the current navigation item from `data-page`. The shared `.header_menu_link` size is `20px` for both variants.

Each page loads it with this slot:

```html
<div class="common_footer_slot" data-component="../../common/components/footer.html">
  <span class="a11y_hidden">Loading footer</span>
</div>
```

The slot requires an HTTP server. Opening an HTML file directly with `file://` will not load the footer.

### 경로 규칙 — 루트 절대경로(`/common/...`)를 쓰지 않습니다

**슬롯 경로, 공통 CSS·JS, `header.html`·`footer.html` 안의 모든 `src`·`href`는 상대경로여야
합니다.** 루트로 쓰면 사이트가 도메인 최상위에 있을 때만 동작하고, GitHub Pages처럼
`/저장소이름/` 아래에 배포하거나 다른 사람이 다른 폴더 구조에서 열면 전부 404가 됩니다.
현재 저장소에는 루트 절대경로가 한 곳도 없습니다.

- **`header.html`·`footer.html` 안의 경로는 그 파일이 아니라 "불러가는 페이지" 기준으로
  풀립니다.** 컴포넌트가 `fetch` 후 `innerHTML`로 주입되기 때문입니다. 그래서 컴포넌트
  안에 `../../asset/...`이라고 적으면 `common/components/` 기준이 아니라
  `pages/<페이지>/` 기준으로 해석됩니다.
- **그 결과 모든 페이지는 `pages/<페이지>/` 한 단계 깊이에 있어야 합니다.**
  `common/js/common.js`의 `HEADER_LOGO_BLACK` / `HEADER_LOGO_WHITE`도 같은 이유로
  `../../asset/logos/...`로 고정돼 있습니다. 깊이가 다른 곳(저장소 루트의 `index.html`,
  `pages/shop/detail/` 같은 하위 폴더)에 페이지를 만들면 **헤더 로고와 아이콘이 깨집니다.**
  깊이를 바꿔야 한다면 컴포넌트 두 개와 `common.js`의 로고 상수를 같이 고쳐야 합니다.

## Shared JavaScript behaviors

`common/js/common.js` owns behavior that should stay identical across pages:

- Lenis smooth scrolling connected to the GSAP ticker and ScrollTrigger
- Header navigation and responsive menu behavior
- Header colour switching driven by the backdrop (see below)
- Footer newsletter validation
- Top button visibility and smooth return to the top
- Product-card action ordering and `data-hover-src` image preloading

### Header colour switching

The header is `position: fixed`, so a white header can become unreadable once a light
section scrolls underneath it. `updateHeaderTheme()` samples three points across the
header band on every scroll frame, reads the backdrop's background colour, and applies
`is_white` or `is_black` from its relative luminance. The logo swaps with the variant.

`data-header-variant` on `<body>` is no longer the final answer — it is the **fallback**
used whenever the backdrop colour cannot be read.

The backdrop colour cannot be read when the sampled point sits on an image, video,
canvas, or a `background-image`. Images with `pointer-events: none` do not appear in
`document.elementsFromPoint`, so the code also checks each candidate's direct children
for media covering the point. Main's hero relies on this — without it the detector
walked past the photo and read the cream `body` behind it.

Tuning constants sit together above `updateHeaderOnScroll()`:

| Constant | Value | Meaning |
|---|---|---|
| `BACKDROP_SAMPLE_RATIOS` | `[0.12, 0.5, 0.88]` | Sample positions across the viewport width |
| `LIGHT_LUMINANCE_THRESHOLD` | `0.55` | Above this the backdrop counts as light, so the header goes black |
| `OPAQUE_ALPHA_MIN` | `0.5` | Minimum alpha before a background colour is trusted |

Measured cost is about 0.09 ms per frame (roughly 0.5% of a 60fps budget).

Load Lenis, GSAP, and ScrollTrigger before `common.js`.

### 스크롤 감각 조정 (Lenis)

**`common/js/common.js` 맨 위 상수만 고칩니다.** 페이지 CSS나 페이지 JS에
복사하지 마세요 — 여기를 고치면 전 페이지가 함께 바뀝니다. 각 상수 위에 값 범위와
느낌을 주석으로 적어 두었습니다.

| 상수 | 현재 | 의미 |
|---|---|---|
| `SCROLL_DURATION` | `1.5` | 목표까지 도착하는 시간(초). **길수록 묵직**(1.2 Lenis 데모 기본 / 2.0 아주 무거움) |
| `SCROLL_EASING` | expo out | 그 시간 동안의 속도 곡선. **"묵직함"의 정체는 시간보다 이 곡선입니다** |
| `SCROLL_WHEEL` | `0.65` | 휠 한 칸의 이동 거리 배수. 낮을수록 묵직 (1 = 브라우저 기본) |
| `SCROLL_TOUCH` | `1.6` | 터치 이동 배수. `syncTouch`를 켜지 않는 한 거의 영향 없음 |

**★ `lerp`와 `duration`은 함께 쓸 수 없습니다.** 둘 다 넘기면 Lenis가 `lerp`를
우선해서 `duration`/`easing`이 무시됩니다. 지금은 `duration` 방식이라 생성자에
`lerp`가 없습니다 — `lerp` 방식으로 되돌리려면 `SCROLL_DURATION`/`SCROLL_EASING`을
빼고 `lerp: 0.035` 정도를 넣으면 됩니다.

값을 찾을 때는 브라우저 콘솔에서 바로 시험해 볼 수 있습니다:

```js
window.tchaikimmLenis.options.duration = 2;
```

새로고침하면 파일의 상수 값으로 돌아갑니다. 마음에 드는 값을 찾은 뒤 파일을 고치세요.

`prefers-reduced-motion: reduce`이거나 Lenis·GSAP이 없으면 초기화하지 않고 브라우저
기본 스크롤을 씁니다.

Page-specific motion remains in each page script. For example, the Shop 3D hero,
Garment Story, category selector, and Motif interactions stay in `pages/shop/js/shop.js`.

## 1920px layout baseline

Figma screens use a 1920px canvas. Keep full-width backgrounds, images, and videos on
the section itself, then place the section's text, cards, and controls inside
`.common_container`.

```html
<section class="page_section">
  <div class="common_container">
    <!-- Text, cards, and controls -->
  </div>
</section>
```

`.common_container` is fluid below 1920px, includes the shared responsive gutter, and
stops growing at 1920px on wider displays. On a 2560px display the background remains
full width while the content stays centered instead of being forcibly enlarged.

Do not scale an entire page with `transform: scale()` and do not copy this container
rule into a page stylesheet. Check new pages at browser zoom 100% at these widths:

- 1440px: narrower desktop check
- 1920px: Figma reference check
- 2560px: wide-display check

## Local development

Serve the repository root, not an individual page folder. Shared URLs cannot load when the server root is `pages/shop` or another nested folder.

Example page URLs:

```text
/pages/main/index.html
/pages/shop/index.html
/pages/bespoke/index.html
```

## Open Graph image

The `og:image` value must be an absolute HTTPS URL that a social crawler can access. A Windows filesystem path and a relative URL are invalid for deployed OG metadata.

```html
<!-- Repository file: common/assets/og/og-default.jpg -->
<meta property="og:image" content="https://YOUR-DOMAIN.com/common/assets/og/og-default.jpg">
```

Replace `YOUR-DOMAIN.com` when the deployment domain is confirmed. Put the image itself at `common/assets/og/og-default.jpg`.

## Team rule

1. Change shared styles and behavior only in `common/`.
2. Keep page-specific behavior in the page folder.
3. Announce shared breaking changes before merging.
4. Verify Main, Shop, and Bespoke after every shared-file change.
# 공통 페이지 진입 전환

Shop 진입에서 사용하는 8단 크림 패널과 문구 리빌을 다른 페이지에서도 선택적으로
쓸 수 있습니다. 파일을 불러오기만 해서는 실행되지 않고, **출발 링크와 도착 페이지를
둘 다 명시적으로 설정한 경우에만** 작동합니다.

## 1. 출발·도착 페이지 공통

`head`에서 스타일을 불러오고, `body` 끝에서 런타임을 불러옵니다.

```html
<link rel="stylesheet" href="../../common/css/shop_transition.css?v=3">
<!-- body 끝 -->
<script src="../../common/js/shop_transition.js?v=5"></script>
```

## 2. 도착 페이지

첫 화면이 전환 패널 아래에서 잠깐 보이지 않도록 `head` 안에서 스타일 링크 다음,
페이지 전용 스타일보다 앞에 초기 감지 스크립트를 둡니다.

```html
<script src="../../common/js/page_transition_boot.js?v=1"></script>
```

도착 화면에서 이미지 로딩까지 기다린 뒤 패널을 열고 싶으면 해당 이미지에
`data-page-transition-critical`을 붙입니다. 없으면 최소 연출 시간만 기다립니다.

```html
<img src="..." alt="..." data-page-transition-critical>
```

## 3. 출발 링크

효과를 적용할 링크에만 `data-page-transition`과 문구를 설정합니다.

```html
<a href="../brand/index.html"
   data-page-transition
   data-transition-kicker="The house · Seoul"
   data-transition-line-one="One house,"
   data-transition-line-two="two expressions.">
  Discover our story
</a>
```

- 같은 출처의 실제 페이지 링크에만 작동합니다.
- `data-transition-line-one`, `data-transition-line-two`가 큰 중앙 문구입니다.
- 문구를 생략하면 공통 기본 문구가 사용됩니다.
- 새 페이지에 자동 적용되지 않습니다. 위 설정을 복사한 페이지와 링크만 참여합니다.
- 기존 Shop 링크의 `data-shop-transition`은 호환을 위해 그대로 지원합니다.
