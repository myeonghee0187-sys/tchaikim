(function () {
  "use strict";

  /* =========================================================
     부드러운 스크롤 (Lenis 1.3.26) — 모든 페이지 공통

     ★ 스크롤 감각을 바꾸려면 아래 숫자만 고치면 됩니다.
       이 파일은 공통 파일이라 여기를 고치면 전 페이지가 함께 바뀝니다.
       페이지별 CSS나 JS에 따로 복사하지 마세요.

     ─────────────────────────────────────────────────────────
     ★ Lenis에는 감각을 정하는 방식이 두 가지 있고, 둘은 함께 못 씁니다.

       lerp 방식     — 매 프레임 목표까지 남은 거리의 일정 비율만큼 따라갑니다.
                      항상 같은 비율이라 "끝맺음"이 흐릿하고, 휠을 굴리는
                      내내 같은 속도로 끌려오는 느낌입니다.
       duration 방식 — 정해진 시간 동안 이징 곡선을 그리며 도착합니다.  ← 지금 이 방식
                      곡선을 고를 수 있어서 "처음엔 성큼, 끝에서 천천히
                      내려앉는" 무게감을 만들 수 있습니다.

       ※ 둘 다 넘기면 Lenis는 lerp를 우선합니다. duration을 쓰려면 lerp를
         빼야 합니다 — 아래 생성자에 lerp가 없는 것은 그래서입니다.
         lerp 방식으로 되돌리려면 SCROLL_DURATION/SCROLL_EASING을 지우고
         lerp: 0.035 정도를 넣으면 됩니다.

     ─────────────────────────────────────────────────────────
     SCROLL_DURATION — 목표 지점까지 도착하는 데 걸리는 시간(초)

       길수록 관성이 오래 남아 묵직해지고, 짧을수록 즉각적입니다.

       0.8  가벼움 — 일반 웹사이트에 가깝습니다
       1.2  Lenis 공식 데모 기본값
       1.5  묵직함  ← 현재 값. 디자이너 포트폴리오에서 흔한 구간입니다
       2.0  아주 무거움 — 긴 페이지에서는 답답하게 느껴질 수 있습니다

       ※ 2.0을 넘기면 스크롤을 멈춰도 계속 흘러서, 원하는 위치에 세우기가
         어려워집니다. 이 사이트는 pin·scrub 구간(shop garment_story,
         brand, collection)이 있어 특히 길게 잡지 않는 편이 좋습니다.

     ─────────────────────────────────────────────────────────
     SCROLL_EASING — 그 시간 동안 그리는 속도 곡선

       "묵직함"의 정체는 사실 시간보다 이 곡선입니다.
       지금 쓰는 것은 지수 감속(expo out)입니다 — 시작하자마자 크게 움직이고
       끝으로 갈수록 급격히 느려지면서 소리 없이 멎습니다. Lenis 공식 데모와
       같은 곡선이고, 포트폴리오 사이트의 그 느낌이 대부분 이것입니다.

       더 부드럽게(끝맺음을 더 길게) 하려면 -10을 -8로,
       더 또렷하게(빨리 멎게) 하려면 -12나 -14로 바꾸면 됩니다.

     ─────────────────────────────────────────────────────────
     SCROLL_WHEEL — 휠 한 칸에 움직이는 거리 배수

       1이 브라우저 기본 거리입니다. 낮출수록 한 칸이 조금씩만 움직여
       묵직하고 정교한 느낌이 되고, 높이면 성큼성큼 넘어갑니다.
       0.55 아주 묵직  /  0.8 현재 값  /  1 기본  /  1.5 빠름

       ※ 이 값을 낮추면 페이지 끝까지 가는 데 휠을 더 많이 굴려야 합니다.
         페이지가 긴 편이라 0.5 아래로는 권하지 않습니다.

     ─────────────────────────────────────────────────────────
     SCROLL_TOUCH — 터치(모바일) 손가락 이동 거리 배수

       ※ 터치는 기본적으로 브라우저 native 스크롤을 씁니다.
         syncTouch를 켜지 않는 한 이 값은 거의 영향이 없습니다.
         모바일 관성 스크롤은 OS가 이미 잘 처리하므로 건드리지 않는 것을
         권합니다 — 켜면 iOS에서 오히려 끊겨 보이는 경우가 많습니다.
     ─────────────────────────────────────────────────────────

     조정 후에는 실제 마우스 휠로 확인하세요. 숫자만 보고는 판단할 수 없습니다.
     새로고침 없이 콘솔에서 바로 시험하는 방법은 이 함수 맨 아래에 적어 두었습니다.
     ========================================================= */
  var SCROLL_DURATION = 1;
  var SCROLL_EASING = function (t) {
    /* expo out — 1에서 2^(-10t)를 뺀 곡선입니다. t가 0→1로 갈 때
       0 → 0.9 → 0.99 → 1처럼 앞에서 크게, 뒤로 갈수록 잘게 움직입니다.
       Math.min으로 1을 넘지 않게 막아 미세한 튐을 없앱니다. */
    return Math.min(1, 1.001 - Math.pow(2, -10 * t));
  };
  var SCROLL_WHEEL = 1;
  var SCROLL_TOUCH = 1.6;

  function initSmoothScroll() {
    /* Lenis나 GSAP이 없으면(CDN 차단 등) 브라우저 기본 스크롤을 그대로 씁니다.
       모션 최소화 설정에서는 일부러 켜지 않습니다 — 부드러운 스크롤은
       사용자가 끄고 싶어 하는 종류의 움직임입니다. */
    if (
      typeof window.Lenis === "undefined" ||
      typeof window.gsap === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    var gsap = window.gsap;
    var weightedWheelSections = Array.prototype.slice.call(
      document.querySelectorAll("[data-lenis-wheel-multiplier]")
    );

    /* 특정 스토리텔링 섹션에서만 휠 한 칸의 이동 거리를 줄입니다.
       duration을 늘리는 방식과 달리 현재 스크롤 좌표를 뒤늦게 따라오지 않습니다.
       데스크톱 마우스 휠에만 적용하며 터치 스크롤은 OS 기본 감각을 유지합니다. */
    function adjustSectionWheel(input) {
      if (
        window.innerWidth < 1280 ||
        !input.event ||
        input.event.type !== "wheel" ||
        !weightedWheelSections.length
      ) {
        return;
      }

      weightedWheelSections.some(function (section) {
        var rect = section.getBoundingClientRect();
        var isSectionActive = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;

        if (!isSectionActive) {
          return false;
        }

        var multiplier = Number(section.dataset.lenisWheelMultiplier);
        if (Number.isFinite(multiplier) && multiplier > 0 && multiplier <= 1) {
          input.deltaY *= multiplier;
        }

        return true;
      });
    }

    var lenis = new window.Lenis({
      /* GSAP 티커가 프레임을 돌리므로 Lenis 자체 rAF는 끕니다.
         둘 다 켜면 한 프레임에 두 번 계산돼 속도가 어긋납니다. */
      autoRaf: false,
      /* lerp를 넘기지 않습니다 — 넘기면 Lenis가 lerp를 우선해서
         duration/easing이 무시됩니다. 위 주석의 "방식 두 가지" 참고. */
      duration: SCROLL_DURATION,
      easing: SCROLL_EASING,
      wheelMultiplier: SCROLL_WHEEL,
      touchMultiplier: SCROLL_TOUCH,
      virtualScroll: adjustSectionWheel
    });

    /* ScrollTrigger에 스크롤이 움직였다고 알려줍니다. 이게 없으면 pin·scrub이
       Lenis가 만든 위치를 못 따라와 한 박자씩 늦게 반응합니다. */
    if (window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
    }

    /* Lenis를 GSAP 티커에 물립니다. 시간 단위가 초(GSAP) / 밀리초(Lenis)로
       달라 1000을 곱합니다. */
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });

    /* 탭을 오래 비웠다 돌아오면 프레임 간격이 몇 초씩 벌어지는데, GSAP이 그걸
       보정하려고 시간을 건너뛰면 스크롤이 뚝뚝 끊깁니다. 보정을 끕니다. */
    gsap.ticker.lagSmoothing(0);

    /* ★ 새로고침 없이 콘솔(F12)에서 바로 시험해 볼 수 있습니다.

         window.tchaikimmLenis.options.duration = 2;      // 더 무겁게
         window.tchaikimmLenis.options.wheelMultiplier = 0.5;  // 한 칸을 더 짧게

       이징 곡선까지 바꿔 보려면:

         window.tchaikimmLenis.options.easing = t => Math.min(1, 1.001 - Math.pow(2, -8 * t));

       새로고침하면 위 상수 값으로 돌아갑니다 — 마음에 드는 조합을 찾은 뒤
       이 파일의 상수를 고치세요. */
    window.tchaikimmLenis = lenis;
  }

  function initProductCards() {
    var mediaBoxes = Array.prototype.slice.call(
      document.querySelectorAll(".card_product_media")
    );

    mediaBoxes.forEach(function (media) {
      var actions = Array.prototype.slice.call(
        media.querySelectorAll(".card_product_action")
      );

      actions.forEach(function (action, index) {
        action.style.setProperty("--card_action_index", String(index));
      });
    });

    var productImages = Array.prototype.slice.call(
      document.querySelectorAll(".card_product_img[data-hover-src]")
    );

    /* hover 이미지를 실제로 내려받아 카드에 끼워 넣습니다.
       기존 동작(미리 받아 두고 hover 시 즉시 전환)은 그대로입니다 — 언제
       시작하느냐만 달라집니다. */
    function attachHoverImage(defaultImage) {
      var hoverSrc = (defaultImage.getAttribute("data-hover-src") || "").trim();
      var media = defaultImage.closest(".card_product_media");

      if (!hoverSrc || !media || media.classList.contains("has_hover_image")) {
        return;
      }

      /* 같은 카드가 두 번 들어오지 않도록 먼저 표시합니다. onload를 기다리면
         그 사이에 다시 호출될 수 있습니다. */
      media.classList.add("has_hover_image");

      var preload = new Image();

      preload.onload = function () {
        var hoverImage = document.createElement("img");
        hoverImage.className = "card_product_img card_product_img_hover";
        hoverImage.src = hoverSrc;
        hoverImage.alt = "";
        hoverImage.setAttribute("aria-hidden", "true");

        defaultImage.classList.add("card_product_img_default");
        defaultImage.parentNode.insertBefore(hoverImage, defaultImage.nextSibling);
      };

      preload.onerror = function () {
        /* 파일이 없으면 hover 전환만 생기지 않고 카드는 그대로 동작합니다 */
        media.classList.remove("has_hover_image");
      };

      preload.src = hoverSrc;
    }

    /* ★ 예전에는 페이지가 열리자마자 hover 이미지를 전부 내려받았습니다.
       shop 페이지 기준 10장 32MB로, 사용자가 카드에 마우스를 올리지 않아도
       첫 화면 로딩과 대역폭을 그만큼 잡아먹었습니다.
       지금은 카드가 화면 근처(200px 앞)에 왔을 때 받습니다 — 화면에 보이는
       카드는 hover 전에 이미 준비되므로 체감 동작은 같습니다.
       IntersectionObserver가 없는 환경에서는 예전처럼 전부 받습니다. */
    if (typeof window.IntersectionObserver === "undefined") {
      productImages.forEach(attachHoverImage);
      return;
    }

    var hoverObserver = new window.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          hoverObserver.unobserve(entry.target);
          attachHoverImage(entry.target);
        });
      },
      { rootMargin: "200px" }
    );

    productImages.forEach(function (defaultImage) {
      hoverObserver.observe(defaultImage);
    });
  }

  initSmoothScroll();

  /* 모든 페이지가 같은 스크롤 안내 마크업을 사용하도록 공통 JS에서 한 번만 만듭니다.
     페이지 HTML에 복사하지 않으므로 문구·선 디자인 변경도 여기와 common.css만 보면 됩니다. */
  function ensureCommonScrollHint() {
    var existingHint = document.querySelector(".common_scroll_hint");
    var pageHintMode = document.body.getAttribute("data-scroll-hint-mode");

    if (existingHint) {
      if (pageHintMode && !existingHint.hasAttribute("data-scroll-hint-mode")) {
        existingHint.setAttribute("data-scroll-hint-mode", pageHintMode);
      }
      return existingHint;
    }

    var hint = document.createElement("div");
    var label = document.createElement("span");
    var line = document.createElement("span");

    hint.className = "common_scroll_hint";
    hint.setAttribute("aria-hidden", "true");
    if (pageHintMode) {
      hint.setAttribute("data-scroll-hint-mode", pageHintMode);
    }
    label.className = "common_scroll_hint_label";
    label.textContent = "Scroll";
    line.className = "common_scroll_hint_line";

    hint.appendChild(label);
    hint.appendChild(line);
    document.body.appendChild(hint);

    return hint;
  }

  var commonScrollHint = ensureCommonScrollHint();

  var componentSlots = Array.prototype.slice.call(document.querySelectorAll("[data-component]"));

  function loadComponent(slot) {
    var componentUrl = slot.getAttribute("data-component");

    /* 헤더·푸터는 작은 HTML 조각이고 모든 페이지에서 같은 파일을 공유합니다.
       브라우저 캐시에 이전 마크업이 남아 수정 직후 페이지마다 다른 헤더가 보이지
       않도록, 컴포넌트는 항상 현재 파일을 다시 가져옵니다. */
    return fetch(componentUrl, { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load shared component: " + componentUrl);
      }

      return response.text();
    }).then(function (markup) {
      slot.innerHTML = markup;
      slot.removeAttribute("data-component");
    });
  }

  var HEADER_LOGO_BLACK = "../../asset/logos/header_logo-01.svg";
  var HEADER_LOGO_WHITE = "../../asset/logos/header_logo-02.svg";

  // data-header-variant로 정한 페이지 기본값. 배경색을 읽지 못할 때 여기로 돌아갑니다.
  var pageHeaderTheme = "white";

  function setHeaderTheme(header, theme) {
    if (!header) {
      return;
    }

    var isBlack = theme === "black";

    if (commonScrollHint && commonScrollHint.getAttribute("data-scroll-hint-mode") !== "custom") {
      commonScrollHint.classList.toggle("is_on_light", isBlack);
    }

    if (header.classList.contains(isBlack ? "is_black" : "is_white")) {
      return;
    }

    header.classList.toggle("is_black", isBlack);
    header.classList.toggle("is_white", !isBlack);

    /* 페이지 전용 연출이 색상을 직접 정하는 동안에는 공통 판정을 덮어쓰지 않습니다. */
    var headerLogo = document.querySelector("[data-header-logo]");
    if (headerLogo) {
      headerLogo.src = isBlack ? HEADER_LOGO_BLACK : HEADER_LOGO_WHITE;
    }
  }

  function applyHeaderVariant() {
    var currentPage = document.body.getAttribute("data-page");
    var header = document.querySelector(".header");
    var currentLink = document.querySelector('[data-nav-page="' + currentPage + '"]');

    pageHeaderTheme = document.body.getAttribute("data-header-variant") === "black" ? "black" : "white";
    setHeaderTheme(header, pageHeaderTheme);

    if (currentLink) {
      currentLink.classList.add("is_active");
      currentLink.setAttribute("aria-current", "page");
    }
  }

  function initCommonBehavior() {

  var DESKTOP_MIN_WIDTH = 1280;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var headerToggle = document.getElementById("header_toggle");
  var headerInner = document.getElementById("header_inner");
  var header = document.querySelector(".header");
  var currency = document.querySelector("[data-currency-menu]");
  var currencyTrigger = document.getElementById("header_currency_trigger");
  var currencyValue = document.querySelector("[data-currency-value]");
  var currencyOptions = Array.prototype.slice.call(document.querySelectorAll("[data-currency]"));
  var lastScrollY = window.scrollY;
  var headerScrollTicking = false;
  var CURRENCY_STORAGE_KEY = "tchaikimm_currency";
  var CART_SESSION_KEY = "tchaikim_cart_count";
  var headerCart = document.querySelector(".header_cart");
  var headerCartCount = document.querySelector("[data-cart-count]");
  var cartDrawer = document.getElementById("cart_drawer");
  var cartDrawerCloseButtons = cartDrawer
    ? Array.prototype.slice.call(cartDrawer.querySelectorAll("[data-cart-drawer-close]"))
    : [];
  var cartDrawerStatus = cartDrawer && cartDrawer.querySelector("[data-cart-drawer-status]");
  var cartDrawerHeading = cartDrawer && cartDrawer.querySelector("[data-cart-drawer-heading]");
  var cartDrawerDescription = cartDrawer && cartDrawer.querySelector("[data-cart-drawer-description]");
  var cartCount = 0;
  var scrollHintTicking = false;

  /* 공통 모드에서는 첫 화면을 안내하는 동안만 보이고 자연스럽게 사라집니다.
     persistent 모드는 페이지 전체에서 계속 표시하며 색상은 헤더 판정을 공유합니다.
     bespoke처럼 더 긴 구간이 필요하면 data-scroll-hint-mode="custom"을 붙이고
     페이지 타임라인에서 opacity와 is_on_light만 제어하면 됩니다. */
  function updateCommonScrollHint() {
    if (!commonScrollHint || commonScrollHint.getAttribute("data-scroll-hint-mode") === "custom") {
      scrollHintTicking = false;
      return;
    }

    var hasScrollableContent = document.documentElement.scrollHeight > window.innerHeight + 80;
    var hideAt = Math.max(480, window.innerHeight * 0.72);
    var isPersistent = commonScrollHint.getAttribute("data-scroll-hint-mode") === "persistent";

    commonScrollHint.classList.toggle(
      "is_visible",
      hasScrollableContent && (isPersistent || window.scrollY < hideAt)
    );
    scrollHintTicking = false;
  }

  function handleCommonScrollHint() {
    if (scrollHintTicking) {
      return;
    }

    scrollHintTicking = true;
    window.requestAnimationFrame(updateCommonScrollHint);
  }

  function readCartCount() {
    try {
      var storedCount = parseInt(window.sessionStorage.getItem(CART_SESSION_KEY), 10);
      return Number.isFinite(storedCount) && storedCount > 0 ? storedCount : 0;
    } catch (error) {
      return 0;
    }
  }

  function renderCartCount() {
    if (headerCartCount) {
      headerCartCount.textContent = cartCount > 99 ? "99+" : String(cartCount);
      headerCartCount.hidden = cartCount === 0;
    }

    if (headerCart) {
      headerCart.setAttribute(
        "aria-label",
        "Shopping bag, " + cartCount + (cartCount === 1 ? " item" : " items")
      );
    }

    if (cartDrawerStatus) {
      cartDrawerStatus.textContent = cartCount + (cartCount === 1 ? " ITEM" : " ITEMS");
    }

    if (cartDrawerHeading && cartDrawerDescription) {
      cartDrawerHeading.textContent = cartCount === 0
        ? "Your bag is empty."
        : cartCount + (cartCount === 1 ? " item in your bag." : " items in your bag.");
      cartDrawerDescription.textContent = cartCount === 0
        ? "Discover pieces from the latest collection."
        : "Checkout is not available yet. You can continue exploring the collection.";
    }
  }

  function setCartDrawerOpen(isOpen) {
    if (!cartDrawer || !headerCart) {
      return;
    }

    if (isOpen) {
      setCurrencyOpen(false, false);
      renderCartCount();

      if (!cartDrawer.open) {
        cartDrawer.showModal();
      }

      headerCart.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("has_cart_drawer");

      if (header) {
        header.classList.remove("is_hidden");
      }
      if (window.tchaikimmLenis) {
        window.tchaikimmLenis.stop();
      }
      return;
    }

    if (cartDrawer.open) {
      cartDrawer.close();
    }
  }

  function handleCartDrawerClick(event) {
    if (event.target === cartDrawer) {
      setCartDrawerOpen(false);
    }
  }

  function handleCartDrawerClose() {
    headerCart.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("has_cart_drawer");

    if (window.tchaikimmLenis) {
      window.tchaikimmLenis.start();
    }

    headerCart.focus();
  }

  function setCartCount(nextCount) {
    cartCount = Math.max(0, Math.floor(Number(nextCount) || 0));

    try {
      window.sessionStorage.setItem(CART_SESSION_KEY, String(cartCount));
    } catch (error) {
      /* The in-page count still works when session storage is unavailable. */
    }

    renderCartCount();
    document.dispatchEvent(new CustomEvent("cart:updated", {
      detail: { count: cartCount }
    }));
    return cartCount;
  }

  /* 이전 버전에서 남긴 영구 장바구니 수는 더 이상 사용하지 않습니다.
     sessionStorage는 같은 탭의 페이지 이동·새로고침 동안만 유지되고 탭을 닫으면 초기화됩니다. */
  try {
    window.localStorage.removeItem(CART_SESSION_KEY);
  } catch (error) {
    /* Storage may be blocked; the in-memory counter still works. */
  }

  cartCount = readCartCount();
  renderCartCount();
  window.tchaikimCart = {
    add: function (amount) {
      return setCartCount(cartCount + (Number(amount) || 1));
    },
    getCount: function () {
      return cartCount;
    },
    setCount: setCartCount
  };

  window.addEventListener("storage", function (event) {
    if (event.storageArea === window.sessionStorage && event.key === CART_SESSION_KEY) {
      cartCount = readCartCount();
      renderCartCount();
    }
  });

  if (headerCart && cartDrawer && cartDrawerCloseButtons.length > 0) {
    headerCart.addEventListener("click", function () {
      setCartDrawerOpen(true);
    });
    cartDrawerCloseButtons.forEach(function (closeButton) {
      closeButton.addEventListener("click", function () {
        setCartDrawerOpen(false);
      });
    });
    cartDrawer.addEventListener("click", handleCartDrawerClick);
    cartDrawer.addEventListener("close", handleCartDrawerClose);
  }

  // 헤더가 fixed라 아래로 지나가는 배경이 밝은지 어두운지에 따라 글씨가 안 보일 수 있습니다.
  // 헤더가 덮고 있는 지점의 배경색을 읽어 밝기로 흑/백 변형을 고릅니다.
  // 배경이 이미지·영상·그라디언트면 색을 읽을 수 없으므로 페이지 기본값을 씁니다.
  var BACKDROP_SAMPLE_RATIOS = [0.12, 0.5, 0.88];
  var LIGHT_LUMINANCE_THRESHOLD = 0.55;
  var OPAQUE_ALPHA_MIN = 0.5;
  var MEDIA_TAGS = ["IMG", "VIDEO", "CANVAS", "SVG", "PICTURE"];

  function parseRgb(value) {
    var match = /rgba?\(([^)]+)\)/.exec(value);
    if (!match) {
      return null;
    }

    var parts = match[1].split(",").map(function (part) {
      return parseFloat(part);
    });

    if (parts.length < 3 || parts.slice(0, 3).some(isNaN)) {
      return null;
    }

    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 && !isNaN(parts[3]) ? parts[3] : 1
    };
  }

  function relativeLuminance(rgb) {
    var channels = [rgb.r, rgb.g, rgb.b].map(function (value) {
      var ratio = value / 255;
      return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function coversPoint(element, x, y) {
    var rect = element.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0 &&
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom;
  }

  // 이미지에 pointer-events: none이 걸려 있으면 elementsFromPoint가 그 이미지를 건너뜁니다.
  // (main hero가 이 경우라 사진 위인데도 뒤쪽 크림색 body를 읽어 버렸습니다.)
  // 그래서 자식 중에 그 지점을 덮는 미디어가 있는지 직접 확인합니다.
  function hasMediaCovering(element, x, y) {
    var children = element.children;

    for (var index = 0; index < children.length; index++) {
      var child = children[index];

      if (MEDIA_TAGS.indexOf(child.tagName.toUpperCase()) === -1) {
        continue;
      }

      if (coversPoint(child, x, y)) {
        return true;
      }
    }

    return false;
  }

  // elementsFromPoint는 그 지점의 요소를 위에서부터 조상 순으로 돌려줍니다.
  // 헤더 자신은 건너뛰고, 처음 만나는 불투명한 배경색을 그 지점의 배경으로 봅니다.
  function backdropLuminanceAt(x, y) {
    var stack = document.elementsFromPoint(x, y);

    for (var index = 0; index < stack.length; index++) {
      var element = stack[index];

      if (header.contains(element)) {
        continue;
      }

      if (MEDIA_TAGS.indexOf(element.tagName.toUpperCase()) !== -1) {
        return null;
      }

      if (hasMediaCovering(element, x, y)) {
        return null;
      }

      var style = window.getComputedStyle(element);
      if (style.backgroundImage !== "none") {
        return null;
      }

      var rgb = parseRgb(style.backgroundColor);
      if (rgb && rgb.a >= OPAQUE_ALPHA_MIN) {
        return relativeLuminance(rgb);
      }
    }

    return null;
  }

  function explicitHeaderThemeAt(x, y) {
    var stack = document.elementsFromPoint(x, y);

    for (var index = 0; index < stack.length; index++) {
      var element = stack[index];

      if (header.contains(element)) {
        continue;
      }

      var themedSection = element.closest("[data-header-theme]");
      if (themedSection) {
        return themedSection.getAttribute("data-header-theme");
      }
    }

    return null;
  }

  function updateHeaderTheme() {
    var sampleY = Math.max(header.offsetHeight / 2, 1);
    var viewportWidth = document.documentElement.clientWidth;
    var explicitThemes = [];
    var total = 0;
    var found = 0;

    for (var themeIndex = 0; themeIndex < BACKDROP_SAMPLE_RATIOS.length; themeIndex++) {
      var explicitTheme = explicitHeaderThemeAt(
        Math.round(viewportWidth * BACKDROP_SAMPLE_RATIOS[themeIndex]),
        sampleY
      );

      if (explicitTheme === "black" || explicitTheme === "white") {
        explicitThemes.push(explicitTheme);
      }
    }

    if (explicitThemes.length > 0) {
      var blackThemeCount = explicitThemes.filter(function (theme) {
        return theme === "black";
      }).length;
      setHeaderTheme(header, blackThemeCount > explicitThemes.length / 2 ? "black" : "white");
      return;
    }

    for (var index = 0; index < BACKDROP_SAMPLE_RATIOS.length; index++) {
      var luminance = backdropLuminanceAt(
        Math.round(viewportWidth * BACKDROP_SAMPLE_RATIOS[index]),
        sampleY
      );

      if (luminance !== null) {
        total += luminance;
        found += 1;
      }
    }

    if (found === 0) {
      setHeaderTheme(header, pageHeaderTheme);
      return;
    }

    setHeaderTheme(header, total / found > LIGHT_LUMINANCE_THRESHOLD ? "black" : "white");
  }

  function updateHeaderOnScroll() {
    if (!header) {
      return;
    }

    var currentScrollY = Math.max(window.scrollY, 0);
    var scrollDelta = currentScrollY - lastScrollY;
    var menuIsOpen = (headerInner && headerInner.classList.contains("is_open")) ||
      (currency && currency.classList.contains("is_open"));

    header.classList.toggle("is_scrolled", currentScrollY > 16);

    if (currentScrollY <= 16) {
      setHeaderTheme(header, pageHeaderTheme);
    } else {
      updateHeaderTheme();
    }

    if (currentScrollY <= 16 || menuIsOpen) {
      header.classList.remove("is_hidden");
    } else if (scrollDelta > 6 && currentScrollY > 80) {
      header.classList.add("is_hidden");
    } else if (scrollDelta < -6) {
      header.classList.remove("is_hidden");
    }

    lastScrollY = currentScrollY;
    headerScrollTicking = false;
  }

  function handleHeaderScroll() {
    if (headerScrollTicking) {
      return;
    }

    headerScrollTicking = true;
    window.requestAnimationFrame(updateHeaderOnScroll);
  }

  function setMenuOpen(isOpen) {
    if (!headerToggle || !headerInner) {
      return;
    }

    headerInner.classList.toggle("is_open", isOpen);
    headerToggle.setAttribute("aria-expanded", String(isOpen));

    if (header) {
      header.classList.toggle("has_open_menu", isOpen);
    }
    document.body.classList.toggle("has_open_menu", isOpen);

    if (isOpen && header) {
      header.classList.remove("is_hidden");
    }

    var toggleLabel = headerToggle.querySelector(".header_toggle_label");
    if (toggleLabel) {
      toggleLabel.textContent = isOpen ? "Close menu" : "Open menu";
    }
  }

  function setCurrencyOpen(isOpen, shouldFocusOption) {
    if (!currency || !currencyTrigger) {
      return;
    }

    currency.classList.toggle("is_open", isOpen);
    currencyTrigger.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      header.classList.remove("is_hidden");
    }

    if (isOpen && shouldFocusOption) {
      var selectedOption = currencyOptions.filter(function (option) {
        return option.getAttribute("aria-checked") === "true";
      })[0];
      (selectedOption || currencyOptions[0]).focus();
    }
  }

  function setCurrency(currencyCode, shouldStore) {
    var selectedOption = currencyOptions.filter(function (option) {
      return option.getAttribute("data-currency") === currencyCode;
    })[0];

    if (!selectedOption || selectedOption.disabled || !currencyValue || !currencyTrigger) {
      return;
    }

    currencyOptions.forEach(function (option) {
      option.setAttribute("aria-checked", String(option === selectedOption));
    });
    currencyValue.textContent = currencyCode;
    currencyTrigger.setAttribute("aria-label", "Currency, " + currencyCode);

    if (shouldStore) {
      try {
        window.localStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);
      } catch (error) {
        // 저장소가 차단된 환경에서도 현재 페이지의 선택 동작은 유지합니다.
      }
    }
  }

  function getStoredCurrency() {
    try {
      return window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function moveCurrencyFocus(currentOption, direction) {
    var enabledOptions = currencyOptions.filter(function (option) {
      return !option.disabled;
    });
    var currentIndex = enabledOptions.indexOf(currentOption);
    var nextIndex = (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
    enabledOptions[nextIndex].focus();
  }

  function handleCurrencyTriggerClick() {
    setCurrencyOpen(!currency.classList.contains("is_open"), false);
  }

  function handleCurrencyOptionClick(event) {
    setCurrency(event.currentTarget.getAttribute("data-currency"), true);
    setCurrencyOpen(false, false);
    currencyTrigger.focus();
  }

  function handleCurrencyKeydown(event) {
    var currentOption = event.target.closest("[data-currency]");

    if (event.target === currencyTrigger && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      var enabledOptions = currencyOptions.filter(function (option) {
        return !option.disabled;
      });

      event.preventDefault();
      setCurrencyOpen(true, true);
      if (event.key === "ArrowUp") {
        enabledOptions[enabledOptions.length - 1].focus();
      }
      return;
    }

    if (!currentOption) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveCurrencyFocus(currentOption, event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      var focusableOptions = currencyOptions.filter(function (option) {
        return !option.disabled;
      });

      event.preventDefault();
      focusableOptions[event.key === "Home" ? 0 : focusableOptions.length - 1].focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setCurrencyOpen(false, false);
      currencyTrigger.focus();
    }
  }

  function handleToggleClick() {
    var isOpen = headerToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  }

  function handleDocumentKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    if (cartDrawer && cartDrawer.open) {
      event.preventDefault();
      setCartDrawerOpen(false);
    } else if (currency && currency.classList.contains("is_open")) {
      setCurrencyOpen(false, false);
      currencyTrigger.focus();
    } else if (headerInner && headerInner.classList.contains("is_open")) {
      setMenuOpen(false);
      headerToggle.focus();
    }
  }

  function handleDocumentClick(event) {
    if (currency && currency.classList.contains("is_open") && !event.target.closest(".header_currency")) {
      setCurrencyOpen(false, false);
    }

    if (headerInner && headerInner.classList.contains("is_open") && !event.target.closest(".header")) {
      setMenuOpen(false);
    }
  }

  function handleWindowResize() {
    if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
      setMenuOpen(false);
    }
  }

  if (headerToggle && headerInner) {
    headerToggle.addEventListener("click", handleToggleClick);
    window.addEventListener("resize", handleWindowResize);
  }

  if (currency && currencyTrigger && currencyOptions.length > 0) {
    var storedCurrency = getStoredCurrency();
    setCurrency(storedCurrency || "USD", false);
    currencyTrigger.addEventListener("click", handleCurrencyTriggerClick);
    currency.addEventListener("keydown", handleCurrencyKeydown);
    currencyOptions.forEach(function (option) {
      option.addEventListener("click", handleCurrencyOptionClick);
    });
  }

  if ((headerToggle && headerInner) || (currency && currencyTrigger) || cartDrawer) {
    document.addEventListener("keydown", handleDocumentKeydown);
    document.addEventListener("click", handleDocumentClick);
  }

  if (header) {
    updateHeaderOnScroll();
    window.addEventListener("scroll", handleHeaderScroll, { passive: true });
    // 폭이 바뀌면 헤더 아래에 오는 요소도 달라집니다.
    window.addEventListener("resize", handleHeaderScroll);
  }

  updateCommonScrollHint();
  window.addEventListener("scroll", handleCommonScrollHint, { passive: true });
  window.addEventListener("resize", handleCommonScrollHint);

  var newsletterForm = document.getElementById("footer_newsletter");
  var emailInput = document.getElementById("footer_email_input");
  var emailMessage = document.getElementById("footer_email_message");

  function setEmailMessage(message, hasError) {
    if (!emailMessage) {
      return;
    }

    emailMessage.textContent = message;
    emailMessage.classList.toggle("has_error", hasError);
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    var emailValue = emailInput.value.trim();

    if (emailValue === "") {
      setEmailMessage("Please enter your email address.", true);
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }

    if (!EMAIL_PATTERN.test(emailValue)) {
      setEmailMessage("Please enter a valid email address.", true);
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }

    emailInput.removeAttribute("aria-invalid");
    setEmailMessage("Thank you. You are on the list.", false);
    newsletterForm.reset();
  }

  function handleEmailInput() {
    if (emailMessage && emailMessage.textContent !== "") {
      setEmailMessage("", false);
      emailInput.removeAttribute("aria-invalid");
    }
  }

  if (newsletterForm && emailInput && emailMessage) {
    newsletterForm.addEventListener("submit", handleNewsletterSubmit);
    emailInput.addEventListener("input", handleEmailInput);
  }

  /* 모든 페이지가 같은 버튼을 쓰도록 공통 JS에서 한 번만 생성합니다.
     이전 페이지 마크업이 남아 있어도 중복 생성하지 않습니다. */
  var topButton = document.querySelector(".top_button");

  if (!topButton) {
    topButton = document.createElement("button");
    topButton.className = "top_button";
    topButton.type = "button";
    topButton.setAttribute("aria-label", "Back to top");
    topButton.textContent = "Top";
    document.body.appendChild(topButton);
  }

  function updateTopButton() {
    if (topButton) {
      topButton.classList.toggle("is_visible", window.scrollY > 600);
    }
  }

  function handleTopButtonClick() {
    if (window.tchaikimmLenis) {
      window.tchaikimmLenis.scrollTo(0);
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }

  if (topButton) {
    updateTopButton();
    window.addEventListener("scroll", updateTopButton, { passive: true });
    topButton.addEventListener("click", handleTopButtonClick);
  }

  initProductCards();

  }

  Promise.all(componentSlots.map(loadComponent)).then(function () {
    applyHeaderVariant();
    initCommonBehavior();
    document.dispatchEvent(new CustomEvent("common:ready"));
  }).catch(function (error) {
    console.error(error);
  });
})();
