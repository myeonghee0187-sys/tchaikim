(function initShopTransition() {
  "use strict";

  if (window.tchaikimShopTransitionInitialized) {
    return;
  }

  window.tchaikimShopTransitionInitialized = true;

  var TRANSITION_KEY = "tchaikim_shop_transition";
  var PAGE_TRANSITION_KEY = "tchaikim_page_transition";
  var DETAIL_TRANSITION_KEY = "tchaikim_shop_detail_transition";
  /* Resource warm-up runs in parallel with these shorter editorial intro timings. */
  var MIN_EXIT_DELAY_MS = 450;
  var MIN_NAVIGATION_DELAY_MS = 1350;
  var MAX_WAIT_MS = 2200;
  var EXIT_DURATION_MS = 850;
  var DETAIL_NAVIGATION_DELAY_MS = 420;
  var DETAIL_MAX_WAIT_MS = 800;
  var DETAIL_ENTRY_DURATION_MS = 620;
  var isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/, "/").replace(/\/{2,}/g, "/");
  }

  function createTransition() {
    var element = document.createElement("div");
    element.className = "shop_transition";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = [
      '<div class="shop_transition_steps" aria-hidden="true">',
      "<span></span><span></span><span></span><span></span>",
      "<span></span><span></span><span></span><span></span>",
      "</div>",
      '<div class="shop_transition_inner" role="status" aria-live="polite">',
      '<p class="shop_transition_kicker"><span>Ready-to-wear · Seoul</span></p>',
      '<p class="shop_transition_phrase" aria-label="Where tradition finds freedom.">',
      '<span class="shop_transition_line" aria-hidden="true">',
      '<span class="shop_transition_word">Where</span>',
      '<span class="shop_transition_word">tradition</span>',
      "</span>",
      '<span class="shop_transition_line" aria-hidden="true">',
      '<span class="shop_transition_word">finds</span>',
      '<span class="shop_transition_word">freedom.</span>',
      "</span>",
      "</p>",
      "</div>"
    ].join("");
    document.body.appendChild(element);
    return element;
  }

  var transition = document.querySelector(".shop_transition") || createTransition();

  function setTransitionCopy(config) {
    if (!config) {
      return;
    }

    var kicker = transition.querySelector(".shop_transition_kicker span");
    var phrase = transition.querySelector(".shop_transition_phrase");
    var requestedLines = Array.isArray(config.lines) ? config.lines : [];
    var lines = requestedLines
      .filter(function (line) { return typeof line === "string" && line.trim(); })
      .slice(0, 2);

    if (typeof config.kicker === "string" && config.kicker.trim()) {
      kicker.textContent = config.kicker.trim();
    }

    if (!lines.length) {
      return;
    }

    phrase.textContent = "";
    phrase.setAttribute("aria-label", lines.join(" "));

    lines.forEach(function (line) {
      var lineElement = document.createElement("span");
      lineElement.className = "shop_transition_line";

      line.trim().split(/\s+/).forEach(function (word) {
        var wordElement = document.createElement("span");
        wordElement.className = "shop_transition_word";
        wordElement.textContent = word;
        lineElement.appendChild(wordElement);
      });

      phrase.appendChild(lineElement);
    });
  }

  function getPendingPageTransition() {
    try {
      var serializedEntry = window.sessionStorage.getItem(PAGE_TRANSITION_KEY);
      var entry = serializedEntry ? JSON.parse(serializedEntry) : null;

      if (!entry || normalizePath(entry.targetPath || "") !== normalizePath(window.location.pathname)) {
        return null;
      }

      return entry;
    } catch (error) {
      return null;
    }
  }

  function wait(delay) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, delay);
    });
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      var image = new Image();

      function finish() {
        resolve();
      }

      image.addEventListener("load", function () {
        if (typeof image.decode === "function") {
          image.decode().catch(function () {}).then(finish);
          return;
        }

        finish();
      }, { once: true });
      image.addEventListener("error", finish, { once: true });
      image.src = url;
    });
  }

  function fetchResource(url) {
    return window.fetch(url, { credentials: "same-origin" }).catch(function () {});
  }

  function setTransitionVisible() {
    transition.hidden = false;
    document.documentElement.classList.add("is_shop_transitioning");
    transition.classList.remove("is_exiting");
    transition.classList.add("is_active");
    transition.setAttribute("aria-hidden", "false");
  }

  function warmShopEntry(targetUrl) {
    var shopUrl = new URL(targetUrl, window.location.href);
    var baseUrl = new URL("./", shopUrl);

    return Promise.allSettled([
      fetchResource(shopUrl.href),
      fetchResource(new URL("css/shop.css", baseUrl).href),
      fetchResource(new URL("js/shop.js", baseUrl).href),
      loadImage(new URL("assets/images/hero_bg.png", baseUrl).href),
      loadImage(new URL("assets/images/gallery_image1.jpg", baseUrl).href)
    ]);
  }

  function warmPageEntry(targetUrl) {
    return fetchResource(new URL(targetUrl, window.location.href).href);
  }

  function getPageTransitionConfig(link) {
    var targetUrl;

    if (!link.hasAttribute("data-page-transition")) {
      return null;
    }

    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (error) {
      return null;
    }

    if (targetUrl.origin !== window.location.origin) {
      return null;
    }

    return {
      targetPath: normalizePath(targetUrl.pathname),
      kicker: link.getAttribute("data-transition-kicker") || "Tchai Kim · Seoul",
      lines: [
        link.getAttribute("data-transition-line-one") || "Where tradition",
        link.getAttribute("data-transition-line-two") || "finds freedom."
      ]
    };
  }

  function isShopLink(link) {
    var targetUrl;
    var href = link.getAttribute("href");

    if (!link.hasAttribute("data-shop-transition") || !href || href.charAt(0) === "#") {
      return false;
    }

    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    return targetUrl.origin === window.location.origin &&
      /\/pages\/shop\/(?:index\.html)?$/.test(targetUrl.pathname);
  }

  function isShopDetailLink(link) {
    var targetUrl;

    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    return targetUrl.origin === window.location.origin &&
      /\/pages\/shop_detail\/(?:index\.html)?$/.test(targetUrl.pathname);
  }

  function isCurrentShopPage() {
    return /\/pages\/shop\/(?:index\.html)?$/.test(window.location.pathname);
  }

  function warmShopDetail(targetUrl) {
    var detailUrl = new URL(targetUrl, window.location.href);
    var baseUrl = new URL("./", detailUrl);

    return Promise.allSettled([
      fetchResource(detailUrl.href),
      fetchResource(new URL("css/shop_detail.css", baseUrl).href),
      loadImage(new URL("assets/shop1.png", baseUrl).href)
    ]);
  }

  function navigateToShopDetail(link) {
    document.documentElement.classList.add("is_shop_detail_leaving");

    try {
      window.sessionStorage.setItem(DETAIL_TRANSITION_KEY, "1");
    } catch (error) {
      /* Navigation continues when sessionStorage is unavailable. */
    }

    var minimumDelay = wait(isReducedMotion ? 80 : DETAIL_NAVIGATION_DELAY_MS);
    var preload = warmShopDetail(link.href);

    Promise.race([
      Promise.all([minimumDelay, preload]),
      wait(DETAIL_MAX_WAIT_MS)
    ]).then(function () {
      window.location.assign(link.href);
    });
  }

  function handleDocumentClick(event) {
    var link = event.target.closest("a[href]");
    var pageTransitionConfig;

    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank"
    ) {
      return;
    }

    if (isCurrentShopPage() && isShopDetailLink(link)) {
      event.preventDefault();
      navigateToShopDetail(link);
      return;
    }

    pageTransitionConfig = getPageTransitionConfig(link);

    if (pageTransitionConfig) {
      if (pageTransitionConfig.targetPath === normalizePath(window.location.pathname)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      setTransitionCopy(pageTransitionConfig);
      setTransitionVisible();

      try {
        window.sessionStorage.setItem(PAGE_TRANSITION_KEY, JSON.stringify(pageTransitionConfig));
      } catch (error) {
        /* 저장소가 막혀도 출발 화면의 전환과 페이지 이동은 계속합니다. */
      }

      Promise.race([
        Promise.all([
          wait(isReducedMotion ? 120 : MIN_NAVIGATION_DELAY_MS),
          warmPageEntry(link.href)
        ]),
        wait(MAX_WAIT_MS)
      ]).then(function () {
        window.location.assign(link.href);
      });
      return;
    }

    if (!isShopLink(link)) {
      return;
    }

    /* A Shop link inside the current Shop page is a no-op, so the intro cannot restart. */
    if (isCurrentShopPage()) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setTransitionVisible();

    try {
      window.sessionStorage.setItem(TRANSITION_KEY, "1");
    } catch (error) {
      /* 저장소가 막힌 환경에서도 현재 페이지의 전환은 그대로 진행합니다. */
    }

    var minimumDelay = wait(isReducedMotion ? 120 : MIN_NAVIGATION_DELAY_MS);
    var preload = warmShopEntry(link.href);

    Promise.race([
      Promise.all([minimumDelay, preload]),
      wait(MAX_WAIT_MS)
    ]).then(function () {
      window.location.assign(link.href);
    });
  }

  function revealShopPage() {
    var hasTransitionEntry = document.documentElement.classList.contains("has_shop_transition_entry");
    var pendingPageTransition = getPendingPageTransition();

    if (!hasTransitionEntry) {
      return;
    }

    document.documentElement.classList.add("is_shop_transition_ready");
    setTransitionCopy(pendingPageTransition);
    transition.hidden = false;
    transition.classList.add("is_active");
    transition.setAttribute("aria-hidden", "false");

    try {
      window.sessionStorage.removeItem(TRANSITION_KEY);
      if (pendingPageTransition) {
        window.sessionStorage.removeItem(PAGE_TRANSITION_KEY);
      }
    } catch (error) {
      /* 저장소가 막혀 있어도 아래 화면 공개는 계속합니다. */
    }

    /* The 3D gallery uses optimized JPG textures. Its large PNG fallback is not
       allowed to hold the intro open in browsers where WebGL is available. */
    var criticalImages = Array.prototype.slice.call(document.querySelectorAll(
      "[data-page-transition-critical], .hero_section_bg"
    ));
    var imagePromises = criticalImages.map(function (image) {
      if (image.complete) {
        return typeof image.decode === "function" ? image.decode().catch(function () {}) : Promise.resolve();
      }

      return new Promise(function (resolve) {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    });
    var minimumDelay = wait(isReducedMotion ? 80 : MIN_EXIT_DELAY_MS);

    Promise.race([
      Promise.all([minimumDelay, Promise.allSettled(imagePromises)]),
      wait(MAX_WAIT_MS)
    ]).then(function () {
      transition.classList.add("is_exiting");

      window.setTimeout(function () {
        /* 조각이 화면 위로 완전히 빠진 뒤 즉시 숨겨, 클래스를 정리할 때
           기본 위치(화면 아래)로 되돌아오는 프레임이 다시 보이지 않게 합니다. */
        transition.hidden = true;
        transition.classList.remove("is_active", "is_exiting");
        transition.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove(
          "has_shop_transition_entry",
          "is_shop_transition_entry",
          "is_shop_transition_ready"
        );
      }, isReducedMotion ? 140 : EXIT_DURATION_MS);
    });
  }

  function revealShopDetailPage() {
    var root = document.documentElement;

    if (!root.classList.contains("has_shop_detail_transition_entry")) {
      return;
    }

    try {
      window.sessionStorage.removeItem(DETAIL_TRANSITION_KEY);
    } catch (error) {
      /* The page reveal does not depend on storage access. */
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add("is_shop_detail_ready");

        window.setTimeout(function () {
          root.classList.remove(
            "has_shop_detail_transition_entry",
            "is_shop_detail_ready"
          );
        }, isReducedMotion ? 160 : DETAIL_ENTRY_DURATION_MS);
      });
    });
  }

  window.addEventListener("pageshow", function (event) {
    document.documentElement.classList.remove("is_shop_detail_leaving");

    if (!event || !event.persisted) {
      return;
    }

    /* ★ 뒤로 가기로 bfcache에서 되살아난 문서는 스크립트가 다시 실행되지 않습니다.
       그래서 Shop으로 떠날 때 켜 둔 오버레이(`is_active`)와 스크롤 잠금
       (`is_shop_transitioning`)이 그대로 남아, 돌아온 화면을 크림색 조각 8개가
       덮은 채 스크롤도 막힙니다("돌아오면 아무것도 안 보인다"). 되살아난
       순간 걷어냅니다. 새로 로드된 경우에는 스크립트가 다시 돌아 이 상태가
       애초에 남지 않으므로 persisted일 때만 처리합니다. */
    document.documentElement.classList.remove("is_shop_transitioning");
    transition.hidden = true;
    transition.classList.remove("is_active", "is_exiting");
    transition.setAttribute("aria-hidden", "true");
  });

  /* 이벤트 위임이라 common.js가 나중에 주입하는 헤더·푸터 링크도 잡힙니다. */
  /* capture 단계에서 먼저 받아 헤더 메뉴 등 다른 클릭 핸들러가 버블링을
     중단하더라도 Shop 전환을 놓치지 않습니다. */
  document.addEventListener("click", handleDocumentClick, true);

  revealShopPage();
  revealShopDetailPage();
})();
