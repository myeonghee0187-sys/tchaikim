/* =========================================================
   intro — 영상 자동 재생 + 3초에 START 버튼 등장

   스크롤 스크럽(ScrollTrigger pin)을 걷어낸 자리입니다. 이 페이지에는
   스크롤이 없습니다. 들어오면 영상이 한 번 재생되고(loop 없음, 끝나면
   마지막 프레임에서 멈춤), 3초 지점에서 오버레이가 나타납니다.

   ★ 오버레이는 첫 페인트부터 숨겨져 있고, 이 스크립트가 .is_visible을
     붙이면 나타납니다. 스크립트가 실패해도 별도 SKIP 링크로 진입할 수 있습니다.

   ★ 자동재생은 거절될 수 있습니다(브라우저 정책·절전 모드). 그래서 영상
     시간(timeupdate)만 믿지 않고, 로드 시점부터 도는 예비 타이머도 함께
     둡니다. 둘 중 먼저 오는 쪽이 버튼을 띄웁니다.
   ========================================================= */
(function () {
  "use strict";

  /* 조절값 — 숫자만 바꾸면 됩니다 */
  var OVERLAY_AT_SECONDS = 3; /* 버튼이 나타나는 영상 시점(초). 영상은 약 4.04초입니다 */
  var FALLBACK_DELAY_MS = 3600; /* 자동재생이 막혔을 때 대신 쓰는 대기 시간 */
  var EXIT_DURATION_MS = 420;

  var intro = document.querySelector(".intro");
  var section = document.querySelector(".scroll");
  var video = document.querySelector(".scroll_video");
  var overlay = document.querySelector(".scroll_overlay");
  var skipLink = document.querySelector(".intro_skip");
  var isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!intro || !section || !video || !overlay) {
    return;
  }

  var isRevealed = false;
  var fallbackTimerId = null;

  function revealOverlay() {
    if (isRevealed) {
      return;
    }

    isRevealed = true;
    overlay.classList.add("is_visible");
    video.removeEventListener("timeupdate", handleTimeUpdate);

    if (fallbackTimerId !== null) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }
  }

  function handleTimeUpdate() {
    if (video.currentTime >= OVERLAY_AT_SECONDS) {
      revealOverlay();
    }
  }

  function handleSkipClick(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    intro.classList.add("is_leaving");
    video.pause();

    window.setTimeout(function () {
      window.location.assign(skipLink.href);
    }, isReducedMotion ? 0 : EXIT_DURATION_MS);
  }

  if (skipLink) {
    skipLink.addEventListener("click", handleSkipClick);
  }

  window.addEventListener("pageshow", function (event) {
    intro.classList.remove("is_leaving");

    if (event.persisted && !isReducedMotion) {
      var resumedPlay = video.play();
      if (resumedPlay && typeof resumedPlay.catch === "function") {
        resumedPlay.catch(function () {});
      }
    }
  });

  /* 모션 감소 설정이면 영상을 재생하지 않고 버튼을 바로 보여줍니다.
     기다릴 이유가 없고, 기다리게 하면 들어갈 방법이 늦어집니다. */
  if (isReducedMotion) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  /* 시간 제어가 활성화된 상태임을 표시합니다 */
  section.classList.add("is_timed");

  video.addEventListener("timeupdate", handleTimeUpdate);
  fallbackTimerId = window.setTimeout(revealOverlay, FALLBACK_DELAY_MS);

  /* 영상이 끝까지 갔는데 3초 지점을 못 잡은 경우(짧은 영상으로 교체 등) */
  video.addEventListener("ended", revealOverlay);

  var played = video.play();

  if (played && typeof played.catch === "function") {
    played.catch(function () {
      /* 자동재생이 거절되면 첫 프레임에 멈춘 채로 남습니다.
         기다릴 것이 없으므로 버튼을 바로 띄웁니다. */
      revealOverlay();
    });
  }
})();
