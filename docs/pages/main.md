# main 페이지 작업 기록

`pages/main/` 페이지의 작업 내역입니다.
페이지 전체 구조(hero, intro, brand, korea, shop, 코디, 클로징 등)와 첫 구현 내용은
`docs/PROJECT_CONTEXT.md`에 있습니다. 이 문서는 그 이후 main 페이지에서 진행하는 작업을 기록합니다.

---

## hero — 호버 시 패널 전체 채움 + 영상 전환 (2026-08-06)

`hero_panel_bespoke` / `hero_panel_shop` 중 하나에 호버하면 그 패널이 hero 전체 폭을
채우도록 커지고(반대쪽은 사라짐), 정지 사진이 해당 영상 재생으로 바뀝니다. 시안에는 없는
인터랙션이며, 사용자가 이번 작업에서 새로 요청했습니다("호버하면 아예 풀로 사진이 꽉
차보이는 인터렉션", "호버해서 꽉채워지면 영상이 재생되는걸로").

### 변경 파일

- `pages/main/index.html` — 두 hero_panel 안에 `<video class="hero_panel_video">` 추가
- `pages/main/css/main.css` — `.hero_panel_video` 스타일 추가
- `pages/main/js/main.js` — `setupHeroHoverFill()` 추가
- `.claude/launch.json` — 이 세션에서 쓴 로컬 서버 설정(`main_dev`, 5611) 추가.
  기존 `tchaikimm`(5610) 항목은 다른 세션의 스크래치패드 경로를 가리키고 있어 그대로 두었습니다.

### 1. 영상은 새로 만들지 않고 기존 promo 영상을 재사용

hero 전용 영상 에셋은 없습니다. 대신 페이지 아래 bespoke/shop 프로모 섹션에서 이미 쓰고 있는
`assets/main/bespoke/bespokevod.mp4`(1.3MB), `assets/main/shop/shopbanner.mp4`(2.4MB)를
그대로 참조했습니다 — 내용이 각 패널과 정확히 대응합니다(bespoke 패널 → bespoke 영상,
shop 패널 → shop 영상). `preload="none"`으로 두어 실제로 호버하기 전에는 내려받지 않습니다.

### 2. 히트 영역은 "현재 보이는 폭"이 아니라 "hero의 고정된 절반"

처음 시도한 방식은 `.hero_panel`에 직접 `mouseenter`/`mouseleave`를 붙이는 것이었는데,
문제가 있었습니다. 한쪽이 100%로 커지고 반대쪽이 0%가 되면, 0%가 된 패널은 더 이상 마우스가
들어갈 수 있는 영역이 없어 **반대쪽으로 전환할 방법이 없어집니다**(hero를 완전히 벗어났다가
다시 들어와야만 전환됩니다).

그래서 이벤트를 패널이 아니라 `.hero` 컨테이너 하나에 `mousemove`로 붙이고, 커서의 x좌표가
`hero` 폭의 왼쪽 절반인지 오른쪽 절반인지로 활성 패널을 계산합니다(`handleHeroPointerMove`).
이 절반은 항상 고정이라 패널이 시각적으로 얼마나 늘어나 있든 커서를 반대쪽으로 옮기면 바로
전환됩니다. `mouseleave`는 `.hero` 전체에 붙어 있어 hero를 벗어나면 50/50으로 복귀합니다.

이 구조는 스크립트로 검증했습니다 — 왼쪽 패널이 100%(오른쪽 0%)인 상태에서 커서를 hero
오른쪽 끝 근처로 옮기면, 오른쪽 패널의 실제 렌더 폭이 0px임에도 정확히 오른쪽으로 전환됩니다.

### 3. 애니메이션 대상과 값

GSAP으로 다음 네 가지를 함께 움직입니다(대상마다 duration 다름 — 폭은 크게 움직이므로
0.7s, 나머지는 0.5s, 둘 다 `power` 계열 ease):

| 대상 | 비활성(반대쪽이 커질 때) | 기본(호버 없음) | 활성(이 패널이 커질 때) |
|---|---|---|---|
| `.hero_panel` width | `0%` | `50%` | `100%` |
| `.hero_panel_img` opacity | `0.9`(그대로) | `0.9` | `0` |
| `.hero_panel_video` opacity | `0` | `0` | `1` |
| `.hero_panel_body` opacity | `0` | `1` | `1` |

영상 재생/정지는 opacity 트윈과 별개로 JS에서 직접 호출합니다 — 활성화되면 `video.play()`,
비활성화되면 `video.pause()` + `currentTime = 0`(다음에 다시 호버했을 때 처음부터 재생).
`play()`가 실패해도(브라우저 정책 등) 페이지가 멈추지 않도록 반환된 Promise를 `.catch(() => {})`로
흡수합니다. `video.muted`는 HTML 속성과 JS 프로퍼티 양쪽에 모두 설정해 자동재생 정책에
안전하게 걸리도록 했습니다.

### 4. 적용 조건 (터치 기기·모션 감소 제외)

`gsap.matchMedia()`에 `(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)`
조건을 걸었습니다.

- `hover: hover`가 없으면 터치 기기에서 탭했을 때 어색하게 동작할 수 있어 제외했습니다
  (`main.js`의 다른 스크롤 인터랙션들은 `hover` 조건이 필요 없어 안 씁니다 — hero만 다릅니다).
- 768px 미만은 hero가 세로 스택 레이아웃(`flex-direction: column`)이라 좌우 분할 개념이
  없습니다. 조건에 안 걸려 있어도 자연스럽게 비활성입니다.
- 모션 감소 설정에서는 이 인터랙션 전체가 아예 초기화되지 않습니다(폭 애니메이션도,
  영상 자동재생도 없음) — 별도 정지 상태를 만들지 않고 시안 그대로인 50/50 정적 레이아웃만
  보이는 것이 가장 안전하다고 판단했습니다.
- 조건을 벗어나면(창 크기 변경 등) `matchMedia`의 cleanup 함수가 리스너를 떼고
  `width`/`opacity` 인라인 스타일을 `clearProps`로 지우고 재생 중인 영상을 멈춥니다.

### 검증 결과 (2026-08-06)

- 실행: `.claude/launch.json`의 `main_dev`(PowerShell 정적 서버, http://localhost:5611, 저장소 루트 서빙).
- lint / test / build: 이 저장소에 설정된 도구가 없어 실행하지 않았습니다.
- 네트워크: hero 관련 요청 전부 200 OK, 두 영상은 `preload="none"`인데도 206 Partial Content로
  잡혔습니다 — 확인해보니 이건 페이지 아래 promo 섹션의 `autoplay` 영상이 같은 URL을 먼저
  요청한 것이고(개발자도구 network 패널은 URL당 한 번만 표시), hero의 `preload="none"` 자체가
  별도로 추가 요청을 만들지는 않았습니다.
- **이 세션에서는 미리보기 브라우저 창이 화면에 표시되지 않아 실제 마우스 hover와 화면
  캡처를 볼 수 없었습니다**(기존에도 반복된 제약입니다). 대신 `MouseEvent`를 `.hero`에 직접
  `dispatchEvent`하고, `requestAnimationFrame`이 이 세션에서 돌지 않는 문제를 우회하기 위해
  생성된 GSAP 트윈을 `tween.progress(1)`로 강제 종료시켜 최종 상태를 읽었습니다.
  - 왼쪽(bespoke) 절반에 커서 → 왼쪽 785px / 오른쪽 0px, 왼쪽 `video opacity 1` + `paused:false`,
    오른쪽 `video opacity 0` + `paused:true`, 왼쪽 `img opacity 0` / 오른쪽 `0.9`, 본문 opacity `1 / 0`.
  - 커서를 오른쪽(shop) 절반으로 이동(왼쪽 패널이 여전히 0px로 시각적으로 사라진 상태에서) →
    정확히 반대로 전환(오른쪽 785px, 왼쪽 0px, 영상 재생/정지도 반대). 위 2번 항목이 실제로
    동작하는 것을 확인했습니다.
  - `.hero`에서 `mouseleave` → 양쪽 모두 392.5px(50%)로 복귀, 두 영상 모두 `paused:true`,
    본문 opacity 둘 다 `1`.
  - 375px 창(모바일 프리셋, reload 후): `matchMedia` 쿼리가 `matches:false`, hero가
    `flex-direction:column`, 같은 mousemove를 보내도 폭이 그대로(375px, 375px) — 인터랙션이
    아예 붙지 않는 것을 확인했습니다.
- 콘솔 오류 없음(두 번의 리사이즈·리로드 전체에서).
- 구조 검사(브라우저에서 실제 파일을 받아 확인 — node가 없어 W3C validator 대신 이 방식을 씁니다):
  `js/main.js` `new Function()` 컴파일 통과, `css/main.css` 중괄호 161쌍 균형, 중복 id 0개,
  `alt` 없는 `img` 0개.

### 확인하지 못한 부분

- **실제 마우스로 호버했을 때의 체감 속도·전환 느낌**입니다. 위 검증은 모두 이벤트 디스패치와
  트윈 강제 진행(`progress(1)`)으로 최종 상태만 확인했고, `requestAnimationFrame`이 이 세션의
  미리보기 탭에서 진행되지 않아 0.5~0.7초짜리 전환 애니메이션이 실제로 재생되는 모습 자체는
  보지 못했습니다. `http://localhost:5611/pages/main/index.html`을 직접 열어 확인이 필요합니다.
- `prefers-reduced-motion: reduce` 환경의 실제 동작(이 환경을 흉내 낼 방법이 없었습니다).
  코드상으로는 `matchMedia` 조건에 없어 인터랙션 자체가 초기화되지 않습니다.
- 768~1279px 구간(태블릿 폭)에서의 실제 터치스크린 동작 — `hover: hover` 조건으로 걸러지긴
  하지만, hover가 가능한 터치 기기(일부 노트북 터치스크린 등)에서 손가락으로 짚었을 때의
  체감은 확인하지 못했습니다.
- 영상이 처음 재생될 때(아직 캐시되지 않은 상태) 로딩이 얼마나 걸려 정지 사진 → 영상 전환이
  얼마나 매끄러운지는 실제 네트워크 환경에서 봐야 합니다(localhost라 이번 확인은 의미가 적습니다).

---

## hero — 100/0 → 70/30 비율 + lerp 스무딩으로 수정 (2026-08-06)

바로 위 hero 항목의 후속 수정입니다. 사용자 피드백 두 가지를 반영했습니다.

> "호버되는게 화면의 100%로 차게하지말고 각각 70퍼센트씩만 가도록하고 덜그럭 거리지 않게
> 레니스 같은거 걸어줘"

### 변경 파일

- `pages/main/js/main.js` — `setupHeroHoverFill()` 폭 로직을 전부 다시 작성

CSS(`main.css`)와 HTML은 그대로입니다. 비율과 애니메이션 방식만 JS 안에서 바뀌었습니다.

### 1. 100/0 → 70/30

`EXPANDED_RATIO = 0.7`. 호버한 패널이 70%, 반대쪽이 30%(`1 - EXPANDED_RATIO`)를 가져갑니다.
사라지지 않아서, 반대쪽 패널의 사진과 문구(제목/설명/버튼)가 계속 일부 보입니다.

### 2. "덜그럭거림"의 원인과 수정 — tween을 매번 새로 만들지 않고 lerp로 따라가기

기존 방식은 호버 대상이 바뀔 때마다 `gsap.to(panel, { width: ... })`로 **새 tween을 만들었습니다.**
마우스가 두 패널 경계 근처에서 빠르게 오가면(정상적인 마우스 움직임에서 흔합니다) 진행 중이던
tween이 매번 죽고 새 tween이 시작되는데, 이 경계에서 속도가 매끄럽게 이어지지 않고 순간적으로
방향이 꺾이는 느낌이 났습니다 — 사용자가 말한 "덜그럭거림"입니다.

**레니스는 스크롤 라이브러리라 이 상자 크기 애니메이션에는 그대로 붙일 수 없습니다.**
대신 레니스가 부드러움을 만드는 원리(매 프레임 `현재값 += (목표값 - 현재값) * lerp`로 목표를
살짝씩 따라가는 것 — `common.js`가 Lenis에 쓰는 `lerp: 0.06`과 같은 방식)를 GSAP
`ticker`(Lenis가 동기화하는 것과 같은 시계) 위에 직접 구현했습니다.

```js
function updateRatio() {
  currentRatio += (targetRatio - currentRatio) * SMOOTH_LERP; // SMOOTH_LERP = 0.08
  panelA.style.width = currentRatio * 100 + "%";
  panelB.style.width = (1 - currentRatio) * 100 + "%";
}
```

목표(`targetRatio`)가 바뀌어도(반대쪽으로 마우스 이동, hero 이탈) 지금 위치에서부터 이어서
따라가기만 하므로 끊기거나 튀는 지점이 없습니다. 목표에 충분히 가까워지면(`SETTLE_THRESHOLD`)
정확한 값으로 스냅하고 `gsap.ticker`에서 자기 자신을 제거해, 정지 상태에서는 매 프레임 스타일을
다시 쓰지 않습니다(불필요한 레이아웃 비용 방지).

이미지/영상/본문 텍스트의 opacity 크로스페이드는 폭과 달리 이런 문제가 없어(합성 레이어라
reflow가 없고, 목표가 둘뿐이라 GSAP의 기본 `overwrite`로도 자연스럽게 이어집니다) 기존처럼
`gsap.to()`를 그대로 씁니다.

### 검증 결과 (2026-08-06, 1440 × 900)

- 실행: `main_dev`(http://localhost:5611).
- `requestAnimationFrame`이 이 세션에서 돌지 않아, `gsap.ticker.tick()`을 직접 여러 번 호출해
  프레임을 강제로 진행시키며 확인했습니다(`tick()`이 등록된 리스너를 실제로 호출하는 것도
  별도로 확인).
- 왼쪽 절반 hover 후 60프레임 진행 — 폭이 735→874→944→974→987→993→995.6px로 **매끄럽게
  감속하며** 목표인 997.5px(hero 1425px의 70%)에 점근. 100프레임 더 진행하면 정확히
  997.5 / 427.5px(70% / 30%)로 정착.
- 정착 상태에서 crossfade 확인 — 활성 쪽 `img opacity 0` / `video opacity 1` / `paused:false`,
  비활성 쪽 `img opacity 0.9` / `video opacity 0` / `paused:true`, 본문 opacity `1 / 0`.
- **정착된 상태에서 바로 반대쪽으로 마우스를 옮겨 재검증** — 폭이 951→909→871→835→803px로
  끊기지 않고 감소하다가 정확히 427.5 / 997.5px(반대 비율)로 정착. 도중에 값이 튀거나
  역행하지 않았습니다.
- `.hero`에서 벗어나면 712.5 / 712.5px(1425의 정확히 50%)로 복귀.
- 375px 창(reload 후): `matchMedia` `matches:false`, `flex-direction:column`, mousemove를
  보내도 폭이 375/375px 그대로 — 이번 수정 후에도 모바일 비활성 확인.
- `js/main.js` `new Function()` 컴파일 통과, 콘솔 오류 없음(리사이즈·리로드 전체에서).

### 확인하지 못한 부분

- 실제 마우스로 움직였을 때 `SMOOTH_LERP = 0.08`이 느낌상 적당한 속도인지는 사람이 봐야
  압니다. 값을 낮추면(예: 0.05) 더 느긋하고 관성이 강해지고, 높이면(예: 0.15) 더 즉각적으로
  반응합니다 — `main.js`의 `setupHeroHoverFill()` 상단 상수만 바꾸면 됩니다.
- `prefers-reduced-motion: reduce` 환경(이전과 같은 이유로 이번에도 확인하지 못했습니다).

---

## hero — 더 느리게 (2026-08-06)

> "각 섹션별로 호버시 너무 빨리 기계같이 움직여서 혹시 느리게 가능해?"

바로 위 lerp 스무딩은 적용됐지만 속도(`SMOOTH_LERP`)와 crossfade 길이(`FADE_DURATION`)가
여전히 빠른 편이라 "기계 같다"는 인상이 남아 있었습니다. 두 상수만 낮춰 늦췄습니다.

- `SMOOTH_LERP` `0.08 → 0.045` — 폭이 목표(70/30 또는 50/50)까지 따라가는 속도.
  값이 작을수록 한 프레임에 좁히는 거리 비율이 작아져 전체적으로 더 오래, 더 완만하게 움직입니다.
- `FADE_DURATION` `0.5s → 0.7s` — 사진 ↔ 영상 crossfade와 본문 텍스트 fade 길이.

다른 로직(70/30 비율, hero 고정 절반 히트 영역, 정착 시 ticker 정리 등)은 그대로입니다.

### 검증 결과 (2026-08-06, 1440 × 900)

- `gsap.ticker.tick()`을 160회 강제 진행하며 20프레임마다 폭을 측정 —
  725.3 → 884.0 → 952.3 → 979.5 → 990.3 → 994.6 → 997.5px(목표 997.5px, hero 1425px의 70%)로
  점근. 이전 `SMOOTH_LERP 0.08` 때는 프레임 60 근처에서 거의 다 도착했던 것과 비교해,
  지금은 프레임 100~120대에서 도착 — 눈에 보이는 진행 구간이 뚜렷하게 길어졌습니다.
  최종적으로는 이전과 동일하게 정확히 997.5 / 427.5px에 정착합니다.
- `js/main.js` `new Function()` 컴파일 통과, 콘솔 오류 없음.

### 확인하지 못한 부분

- 실제 사람이 마우스로 움직였을 때 지금 속도가 충분히 느긋한지, 혹은 더 늦춰야 하는지는
  `http://localhost:5611/pages/main/index.html`에서 직접 확인이 필요합니다.
  더 늦추려면 `SMOOTH_LERP`를 더 낮추면 됩니다(예: 0.03).

---

## hero — 왼쪽 ↔ 오른쪽 전환도 느리게 (2026-08-06)

> "왼쪽 섹션 호버되었다가 오른쪽 섹션쪽으로 갖다대면 너무빨리 전환되는데 이것도 느리게 낮출수있니"

`SMOOTH_LERP`는 하나의 값으로 폭 전체를 제어하는데, lerp는 "남은 거리에 비례해" 움직이므로
**왼→오 전환처럼 남은 거리가 큰 경우(70%→30%, 40%p)가 중립에서 처음 호버할 때(50%→70%,
20%p)보다 초반 절대 이동 속도가 더 빠릅니다.** 그래서 바로 이전 수정 이후에도 좌우 전환만
유독 빠르게 느껴진 것으로 보입니다.

전환 전용 값을 따로 만드는 대신(로직이 복잡해지고 두 값이 어긋나면 다시 덜그럭거릴 위험이
있어서), 같은 원리로 전체를 한 번 더 낮췄습니다.

- `SMOOTH_LERP` `0.045 → 0.028`
- `FADE_DURATION` `0.7s → 0.9s` (사진 ↔ 영상 crossfade, 본문 fade)

### 검증 결과 (2026-08-06, 1440 × 900)

- 왼쪽에 호버해 70/30으로 완전히 정착시킨 뒤(`gsap.ticker.tick()` 400회), 바로 오른쪽으로
  마우스를 옮기고 30프레임마다 폭을 측정 — 981.5 → 670.6 → 531.2 → 471.7 → 446.4 → 435.5 →
  430.9 → 429.0 → 427.5px(반대 목표)로 점근. **완전히 정착하기까지 약 230프레임(60fps 기준
  약 3.8초)** — 이전 수정(`0.045`) 때 중립→호버 전환이 약 120프레임(약 2초)이었던 것과 비교해
  전환 구간이 뚜렷하게 더 길어졌습니다. 최종적으로는 정확히 427.5 / 997.5px(반대 비율)에 정착.
- `js/main.js` `new Function()` 컴파일 통과, 콘솔 오류 없음.

### 확인하지 못한 부분

- 3.8초가 실제로 만족스러운 속도인지, 혹은 더/덜 늦춰야 하는지는 사람이 직접 봐야 압니다.
  `http://localhost:5611/pages/main/index.html`에서 확인해 주세요. 전체 인터랙션(첫 호버 +
  좌우 전환 + hero 이탈)이 같은 `SMOOTH_LERP` 값을 공유하므로, 이 값을 더 낮추면 세 가지가
  모두 함께 느려집니다.

---

## hero — 왼쪽(bespoke) 이미지가 "축소되며 돌아오는" 문제 (2026-08-06)

> "왼쪽 섹션만 호버해서 영상 재생되었다가 이미지로 돌아올때 이미지가 축소되며 돌아오는
> 느낌인데 이거 없애줘. 오른쪽이랑 똑같이 맞춰"

### 원인

`.hero_panel_img`/`.hero_panel_video`는 지금까지 `width: 100%`(패널 기준)로, 패널 자체의
폭이 30%~70% 사이에서 계속 움직이는 동안 `object-fit: cover`가 **매 프레임 다시 계산**되고
있었습니다. 계산값이 실제로 사람 눈에 "확대/축소"로 보이는지는 사진 원본 비율과 패널의
가로세로 비율이 어느 지점에서 서로 위아래(어느 축 기준으로 채울지)가 뒤바뀌는지에 달려 있는데,
왼쪽 bespoke 사진(`bespoke.png`, 1920×1972, 거의 정사각형)이 하필 패널이 70% 근처로 커질 때
그 경계를 넘어서 — 폭이 좁아질수록 사진이 실제로 작게 렌더링되는 구간에 걸렸습니다.
오른쪽 shop 사진·양쪽 영상은 원본이 더 가로로 넓어서(1.4~1.8:1) 이 구간에 걸리지 않아
동일한 코드로도 문제가 드러나지 않았던 것입니다 — "왼쪽만" 그리고 "오른쪽은 괜찮다"는
사용자의 관찰과 정확히 일치합니다.

지난 수정으로 폭 전환을 몇 초로 늦추면서(느린 lerp), 이 프레임별 재계산이 **오래, 눈에 보이게**
일어나게 된 것도 원인 중 하나입니다. 빠르게 스냅하던 예전에는 같은 계산이 일어나도 너무 짧아
알아채기 어려웠습니다.

### 수정

사진/영상 자체의 렌더 크기를 패널 폭에 더 이상 묶지 않았습니다. 대신 **hero 전체 폭의 70%
(`EXPANDED_RATIO`, 각 패널이 가장 커졌을 때의 크기)로 고정**해 두고, 패널은 그중 일부만
보여주는 "창"(overflow: hidden) 역할만 하도록 바꿨습니다. 왼쪽은 왼쪽 끝(`left: 0`),
오른쪽은 오른쪽 끝(`right: 0`)에 고정해 창이 넓어질수록 반대쪽 안쪽이 더 드러나는 방식이라
양쪽이 똑같은 방식으로 동작합니다. 패널이 30%~70% 사이 어디에 있든 사진/영상 자체의 크기는
전혀 바뀌지 않으므로 `object-fit: cover`가 다시 계산될 일 자체가 없어집니다.

- `pages/main/js/main.js` — `applyFixedMediaSize()` 추가(가로/세로 최초 1회 계산 +
  `window resize`에서 재계산), cleanup에서 `width/left/right`도 함께 `clearProps`
- `pages/main/css/main.css` — `.hero_panel_img`, `.hero_panel_video`에 `max-width: none` 추가

**`max-width: none`이 없으면 이 수정 전체가 조용히 무효화됩니다.** `common/css/reset.css`가
모든 `img`/`video`에 `max-width: 100%`를 걸어 두고 있어서(Collection 페이지의 `arc.svg`에서
이미 한 번 겪은 것과 같은 원인 — `docs/pages/collection.md` 참고할 필요는 없고 이 문서의
`PROJECT_CONTEXT.md` hero 관련 내용과 같은 종류의 함정입니다), JS가 `width: 997px`를
인라인으로 넣어도 reset.css가 그걸 다시 패널 폭(100%)으로 눌러 버립니다. 처음 구현했을 때
정확히 이 증상으로 한 번 막혔다가(인라인 스타일에는 997px가 찍혀 있는데 실제 렌더링은
계속 패널 폭을 따라감) 원인을 찾아 고쳤습니다.

### 검증 결과 (2026-08-06, 1440 × 900)

- `max-width: none` 추가 전: `imgA`의 `style` 속성에는 `width: 997px`가 정상적으로 찍혀 있는데
  `getComputedStyle`/`getBoundingClientRect`는 계속 패널 폭(712.5px)을 보고했습니다 —
  reset.css가 이기고 있다는 것을 확인.
- `max-width: none` 추가 후: 네 요소(양쪽 `img`/`video`) 모두 `width: 997px`(hero 1425px의 정확히
  70%)로 렌더링 확인.
- **핵심 검증** — 왼쪽에 호버해 300프레임(70%까지 성장) 진행하며 40프레임마다 측정 —
  `panelA`(창) 폭은 720.5 → 908.5 → 968.9 → 988.3 → 994.5 → 997.5px로 계속 움직이는 동안,
  `imgA`/`vidA`(내용물) 폭은 **처음부터 끝까지 정확히 997.0px로 고정**. 반대 방향(호버 해제 →
  712.5px로 복귀)도 동일하게 확인 — 창 폭은 989.5 → 830.7 → 762.9 → … → 712.5px로 계속
  줄어드는 동안 이미지 폭은 그 어떤 프레임에서도 997.0px에서 벗어나지 않았습니다
  (400프레임 전체에서 관측된 고유값이 `["997.0"]` 하나뿐).
- 오른쪽(shop)도 같은 검증 — 400프레임 전체에서 `imgB` 렌더 폭의 고유값이 `["997.0"]` 하나.
  좌우가 동일한 방식으로 동작하는 것을 확인했습니다.
- 375px(모바일, reload 후): `imgA`의 `style` 속성이 `null`(JS가 아예 손대지 않음) —
  `width: 100%`(패널 기준) CSS 기본값 그대로 렌더링, 가로 스크롤 없음. 인터랙션이 없는
  화면에서는 이번 수정으로 아무것도 달라지지 않는 것을 확인.
- `js/main.js` `new Function()` 컴파일 통과, `css/main.css` 중괄호 161쌍 균형, 콘솔 오류 없음.

### 확인하지 못한 부분

- 이번 수정으로 hero가 아무것도 호버되지 않은 기본(50/50) 상태의 가로 크롭이 아주 미세하게
  달라집니다 — 이전에는 "그 순간의 50% 폭"에 맞춰 다시 계산된 크롭이었고, 지금은 "70% 폭에
  맞춘 크롭 중 절반만 보이는" 크롭입니다. 계산상 왼쪽 사진 기준 확대율 차이는 약 4%로 크지
  않지만, 실제로 봤을 때 인물 위치가 어색해 보이는지는 `http://localhost:5611/pages/main/index.html`에서
  기본 화면(호버하지 않은 상태)을 직접 봐야 압니다.

---

## hero_panel_img 위치를 CSS에서 직접 조정할 수 있게 (2026-08-06)

> "hero_panel_img 내가 직접 위치 조정하게 css에서 만들어놔"

바로 위 항목에서 사진 크기를 hero 폭의 70%로 고정한 뒤 `object-position`으로 어느 부분을
보여줄지 정하는 구조로 바꿨는데, 지금까지 `object-position: bottom` 한 줄이 두 패널에
공통으로 걸려 있어 조정하려면 CSS 선택자 구조를 알아야 했습니다. 패널마다 개별 CSS 변수로
빼서 값만 보면 바로 조정할 수 있게 했습니다.

### 변경 파일

- `pages/main/css/main.css` — `.hero_panel_bespoke`/`.hero_panel_shop`에
  `--hero_img_position` 변수 추가, `.hero_panel_img`가 그 변수를 사용하도록 변경

```css
.hero_panel_bespoke {
  --hero_img_position: center bottom;
}

.hero_panel_shop {
  --hero_img_position: center bottom;
}
```

두 값만 바꾸면 됩니다 — "가로 세로" 순서고, 가로는 `left`(0%)~`right`(100%)/`center`(가운데),
세로는 `top`(0%)~`bottom`(100%)/`center`(가운데)입니다. 퍼센트 값도 가능합니다
(`center 30%`처럼 쓰면 지금보다 사진이 더 위쪽 기준으로 잘립니다). JS는 건드리지 않았습니다.

### 검증 결과 (2026-08-06)

- `getComputedStyle`로 확인 — 양쪽 패널 모두 `object-position: 50% 100%`(= `center bottom`,
  변경 전과 같은 값). 이번 변경으로 화면이 달라지지 않는 것을 확인했습니다.
- `css/main.css` 중괄호 161 → 163쌍(새 규칙 2개만큼 증가), 여전히 균형. `js/main.js` 문법 검사 통과.
  콘솔 오류 없음.

---

## 새 시안 전체 교체 (Figma node 1712:4222, 2026-08-07)

기존 `index.html`(hero·intro·banner·brand 5패널·korea·instagram·bespoke·marquee·shop·
코디·셀럽착용·클로징 12섹션)을 새 Figma 프레임(`1712:4222`, "main", 1920 × 29308,
20개 이상 섹션)에 맞춰 전체 교체했습니다. 사용자가 "전체 교체(새 시안이 최신 버전)"로
명확히 지시했습니다.

### 대응 관계

| 기존 | 새 시안 |
|---|---|
| hero | 동일(카피 그대로) |
| (없음) | model — 신규, "Heritage Redefined, Effortlessly Worn." |
| intro + banner | brand_story — 카피 동일 |
| korea(4행 압축형) | detail_collar/sleeve/body/skirt(개별 풀 섹션, 이후 다시 통합 — 아래 항목 참고) |
| brand(5패널 가로스크롤) | brand_01~06 — 초대형 워드마크(01~04) + 이미지 콜라주(05/06) |
| (없음) | kyj_brand_story — 신규, 반복 2쌍 |
| promo_bespoke / marquee / shop | 동일 계열, 무드 영상 배경 추가 |
| celeb | collection — 신규, "Two lines. One extraordinary aesthetic." |
| closing / footer | 동일 |
| codi, instagram | 새 시안에 없어 제거 |

### 인터랙션 (`js/main.js`, GSAP + ScrollTrigger, `gsap.matchMedia()`로 768px 이상·
모션 감소 아닐 때만 동작 — 그 외에는 각 섹션 기본 정적 레이아웃)

- **brand_01~04** — `brand_word_pin`으로 감싸 한 화면에 고정한 채 스크롤에 따라
  4단계 텍스트가 크로스페이드됩니다.
- **brand_05/06** — 스크롤해 들어오면 사진 4장이 서서히 나타나고(opacity+scale),
  이름 두 줄("TCHAI Kim" / "TCHAI Kim Young Jin")이 진행률에 따라 벌어지며 갈라집니다.
- **kyj_brand_story** — 단일 사진이 페이드아웃되며 3장이 벌어져 나타나고, 마지막에
  3장이 함께 확대되며 페이드아웃됩니다(시안 주석 "1장→3장→확대→페이드아웃→영상 전환"
  그대로 구현, 아래가 실제로 bespoke 무드 영상/shop 섹션이라 자연스럽게 이어짐).

### 에셋 관련

- 팀에서 `assets/images/main/*` → `assets/main/*`로 자산 구조를 재편하는 중이었고
  헤더/푸터 로고가 그 과정에서 깨져 있었습니다 — 이번 세션 초반에는 프로젝트 루트
  `asset/logos/`에서 복사해 임시로 복구했습니다(이후 공통 시스템 마이그레이션으로 대체 — 아래 항목).
- **의도적으로 비워둔 것**: "Create_a_cinematic_luxury_fash" 구간(kyj_brand_story 두 번째
  쌍과 shop 사이)은 로컬 에셋이 없어 제외했습니다. 실제 에셋 없이 임의로 만들지 않았습니다.

### 검증 결과

- 이미지 전량 200 OK, 콘솔 실제 에러 없음(뜬 404는 헤더 로고 경로 수정 전 캐시된 잔여
  로그였고 재확인 시 전부 200 OK), 1920px에서 가로 스크롤 없음.
- GSAP 인터랙션은 이 세션의 미리보기 탭이 백그라운드 상태(`document.hasFocus()`/
  `visibilityState`가 계속 비활성)라 `requestAnimationFrame` 기반 애니메이션이 실제로
  재생되는 것은 못 봤습니다(이 문서 위쪽 hero 항목 및 `docs/PROJECT_CONTEXT.md`의
  shop 페이지 항목과 같은, 이미 여러 번 문서화된 환경 제약입니다). 대신 ScrollTrigger
  인스턴스가 정상 생성되는 것(5개: 고정 시퀀스 1 + 콜라주 2 + kyj 2), 스크롤 전 초기
  상태값이 의도대로인 것(brand_collage 카드 opacity 0, kyj solo opacity 1 · 나머지 0)을 확인했습니다.

### 확인하지 못한 부분

- 실제 스크롤 시 애니메이션이 눈으로 봤을 때 자연스러운지 — `http://localhost:5606/pages/main/`
  (또는 저장소 루트를 서빙하는 서버)에서 직접 확인 필요.
- detail_sleeve/body/skirt의 원래 헤더 카피(당시엔 collar와 같을 것으로 추정만 하고
  아래 통합 작업에서 실제 Figma 조회로 확인함).

---

## detail 섹션 — collar/sleeve/body/skirt를 사진 한 장 + 호버 확대로 통합 (2026-08-07)

> "Figma에서 보면 detail 섹션들처럼 Collar, sleeve, body, skirt에 마우스를 올리면
> 확대된 모습과 설명이 나오도록 만들어야해"
>
> (이어서) "지금 detail_collar에 그 부분에 호버하면 확대가 되고 옆에 텍스트 설명이 잘
> 뜨는데 다른 detail_(각 부위)섹션들의 확대 부분과 텍스트만 가지고 와서 하나의 섹션에서
> 다 해결하도록 해"

### 진행 순서

1. 처음에는 위 "새 시안 전체 교체" 항목대로 collar/sleeve/body/skirt를 각각 별도의
   풀 섹션(헤더 "Traditional motifs, reimagined" 반복 포함)으로 만들고, collar만
   실제 확대 크롭 에셋(`assets/main/detail/collar/zoom.png`)이 있어 collar만 구현하고
   나머지 3개는 보류했습니다.
2. 사용자가 호버 인터랙션을 요청해 Figma에서 detail_sleeve/body/skirt의 `get_design_context`를
   다시 조회 — 세 부위 모두 collar와 **같은 원본 사진**(`imgRectangle`, 동일 URL)을 쓰고
   확대 크롭(`zoom` Ellipse)만 다르다는 것을 확인하고, 해당 3개 확대 크롭 이미지를
   Figma 로컬 서버(`localhost:3845`)에서 내려받아 `assets/main/detail/{sleeve,body,skirt}/zoom.png`로 저장했습니다.
   → collar/sleeve/body/skirt 4개 섹션으로 우선 완성.
3. 사용자가 "하나의 섹션에서 다 해결"을 요청해, 반복되던 헤더 3벌과 사진 3벌을 걷어내고
   **사진 한 장 위에 4개의 보이지 않는 호버 영역**을 얹는 구조로 재구성했습니다.

### 최종 구조 (`pages/main/index.html`, `css/main.css`)

`.detail_stage` 안에 이미지 1장 + `.detail_hotspot`(부위별 호버/포커스 트리거, `data-part`
속성으로 구분) 4개 + 부위별 `.detail_text`/`.detail_zoom` 쌍 4벌. 확대컷·설명의 위치는
각 부위 Figma 좌표(`get_design_context`에서 조회한 실제 값)를 그대로 씁니다. 호버 영역
자체(경계)는 Figma에 없는, 이번 통합을 위해 새로 정한 것입니다 — collar(상단 가로띠),
sleeve(우측 상단), body(좌측 중단), skirt(하단 넓은 영역).

호버 감지는 형제 결합자(`~`)로 구현했습니다 — `.detail_hotspot[data-part="collar"]:hover
~ .detail_text[data-part="collar"]` 식으로 부위별 호버 영역과 부위별 확대컷/설명을
`data-part` 값으로 짝지었습니다. 부위마다 4쌍(hover/focus-visible × text/zoom)씩 총 16개
선택자가 필요했습니다.

### 잡은 버그 두 가지

1. **형제 vs 자식 구조 실수**: 처음 구현에서 `.detail_text`/`.detail_zoom`을
   `.detail_figure`의 형제로 둬서, 퍼센트 좌표가 이미지가 아니라 훨씬 큰 `.detail_stage`
   기준으로 계산돼 텍스트가 크게 어긋났습니다. 이미지 안(자식)으로 옮겨 고쳤습니다.
2. **퍼센트 padding은 폭 기준**: 4부위를 한 섹션에 합치며 위/아래로 겹쳐 걸리는 내용이
   위아래 섹션과 부딪히지 않게 `.detail_stage`에 `padding: 27% 0 32%`를 줬는데,
   CSS는 요소의 위/아래 padding도 **자기 자신의 너비** 기준으로 퍼센트를 계산해서
   의도한 여백과 전혀 다르게 나왔습니다. `padding` 대신 `margin`(고정값 기반
   `clamp(140px, 20vw, 400px) 0 clamp(160px, 24vw, 470px)`)으로 바꾸고, 부위별
   좌표는 원래 Figma 값 그대로 되돌렸습니다.

### 검증 결과

- `.matches(':hover')`로 4개 영역 각각 확인 — collar 호버 시 collar만, sleeve 호버 시
  sleeve만 정확히 `true`(다른 부위와 안 섞임), CSS 선택자 자체도 `element.matches(선택자)`로
  높은 우선순위 규칙(`opacity: 1`)이 매치되는 것 확인.
- 이미지 깨짐 0개, 새 가로 스크롤 없음.
- **미확인**: 이 프리뷰 탭이 `visibilityState: "hidden"`(백그라운드)이라 `getComputedStyle`이
  스타일 재계산을 미루는 것으로 보여, 선택자는 매치되는데 실제 `opacity` 최종값을
  숫자로는 확인하지 못했습니다(`pointer-events: none`처럼 애니메이션과 무관한 속성도
  똑같이 갱신되지 않는 것으로 재확인 — 트랜지션 타이밍 문제가 아니라 탭 자체의
  스타일 재계산 유예로 판단). 실제 브라우저에서 직접 호버해 확인 필요.
- **미완료**: `detail_img`를 가운데 정렬로 바꿔 달라는 요청을 받았으나, 이 문서를 쓰는
  시점까지 아직 적용 전입니다(`.detail_stage`의 `margin-left: 10.99%`가 그대로 남아
  왼쪽 정렬 상태) — 다음 작업으로 남깁니다.

---

## 공통 시스템(`common/`) 마이그레이션 (2026-08-07)

팀이 `common/css/{tokens,reset,common,layout}.css`, `common/components/{header,footer}.html`,
`common/js/common.js`로 페이지 공통 요소를 분리하는 작업을 진행 중이었습니다. 사용자가
`AGENTS.md`/`CLAUDE.md`/`docs/COMMON_SYSTEM.md`/`docs/PROJECT_CONTEXT.md`/
`templates/default.html`를 먼저 읽고 규칙을 따르라고 지시했고, `pages/main/`만 이
마이그레이션이 안 된 상태였습니다(shop/bespoke는 이미 완료돼 있었음).

### 변경 내용 (`pages/main/index.html`, `css/main.css`만 — 공통 파일은 읽기만 함)

- 하드코딩된 `<header>`/`<footer>` 마크업 → `common_header_slot`/`common_footer_slot`
  (`data-component`로 `common/js/common.js`가 `fetch`해 주입). 진행 도중 footer가
  절반만 슬롯으로 바뀌고 나머지 절반이 고아 마크업으로 남아있던 것도 같이 정리했습니다.
- Lenis JS 스크립트 태그 추가(CSS만 링크돼 있고 JS 라이브러리 태그가 빠져 있었음).
- `.common_container`(팀이 그 사이 `common/css/common.css`에 이미 추가해 둔
  `max-width: var(--layout_canvas, 1920px); margin-inline: auto; padding-inline: var(--layout_gutter)`)로
  텍스트·카드·버튼을 감싸고, 배경 이미지·영상은 section 전체 폭 유지 — model/intro/
  detail 헤더/collection/bespoke·shop 프로모/closing에 적용.
- `.promo_bespoke`/`.promo_shop`의 고정폭(`width: 746px` 등 px 하드코딩)을 반응형
  flex(`flex: 1 1 320px`, `max-width`)로 교체 — 1440px 이하에서 가로 스크롤 나던
  실제 원인이었습니다.
- `.closing`의 옛 "1920px 고정 프레임 + `translateX(-50%)`" 방식을 `.common_container`
  기반 흐름 배치로 전환(시안은 글/아이콘이 겹쳐있지만 흐름 배치로 단순화).

### 검증 결과 (1440 / 1920 / 2560px, 각각 새로고침 상태에서)

- 셋 다 가로 스크롤 없음, 리소스 로드 에러 없음, 이미지 깨짐 0개, 헤더·푸터 정확히 1개씩.
- `.common_container`가 2560px에서도 1920px로 캡 되고 가운데 정렬, 배경 영상/이미지는
  뷰포트 꽉 채우는 것 확인.
- **환경 특이사항**: 브라우저 뷰포트를 리사이즈 툴로 바꾼 직후 확인하면 GSAP가 pin한
  섹션의 폭이 이전 크기로 남아 가로 스크롤처럼 보였는데, 새로고침하면 사라졌습니다
  (리사이즈 자동화 툴이 GSAP `ScrollTrigger`의 리프레시 타이밍과 어긋나는 것으로 보이고,
  실제 사용자가 그 폭으로 페이지를 열거나 로드하는 경우엔 문제없음). 브라우저 창을
  드래그해 실시간으로 좁히는 경우까지는 이 환경에서 확인 못 했습니다.

### 보류한 것

- `.top_button` — `common/css/common.css`에 스타일은 이미 있지만 `shop`/`bespoke`에도
  아직 마크업이 없어서, 다른 페이지와 다르게 main만 먼저 넣는 게 맞는지 확인 차 보류했습니다.

---

## 다음 작업

1. `detail_img` 가운데 정렬(요청 받았으나 미적용 — 위 항목 참고)
2. 위 각 항목의 "확인하지 못한 부분"을 실제 브라우저에서 직접 확인
   (GSAP 인터랙션 재생 느낌, detail 호버 확대 실제 동작, hero 관련 항목들)
3. `.top_button` 추가 여부 결정
4. 나머지 섹션의 반응형(360 / 768 / 1280) 대응은 `docs/PROJECT_CONTEXT.md`의
   "다음 작업" 목록을 따릅니다.
