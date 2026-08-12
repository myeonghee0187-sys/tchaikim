(function preparePageTransitionEntry() {
  "use strict";

  var PAGE_TRANSITION_KEY = "tchaikim_page_transition";
  var SHOP_TRANSITION_KEY = "tchaikim_shop_transition";

  function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/, "/").replace(/\/{2,}/g, "/");
  }

  try {
    var serializedEntry = window.sessionStorage.getItem(PAGE_TRANSITION_KEY);
    var entry = serializedEntry ? JSON.parse(serializedEntry) : null;
    var currentPath = normalizePath(window.location.pathname);
    var targetPath = entry && typeof entry.targetPath === "string"
      ? normalizePath(entry.targetPath)
      : "";
    var hasGenericEntry = targetPath && targetPath === currentPath;
    var hasLegacyShopEntry = /\/pages\/shop\/$/.test(currentPath) &&
      window.sessionStorage.getItem(SHOP_TRANSITION_KEY) === "1";

    if (hasGenericEntry || hasLegacyShopEntry) {
      /* 첫 페인트 전에 붙어야 도착 페이지가 잠깐 노출되지 않습니다. */
      document.documentElement.classList.add("has_shop_transition_entry");
    }
  } catch (error) {
    /* 저장소 접근이나 데이터 파싱이 실패하면 일반 페이지 진입으로 계속합니다. */
  }
})();
