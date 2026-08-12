/* 예약 폼 페이지 (reservation.html)
   - 진행 단계 띠가 현재 보고 있는 구간을 따라갑니다.
   - 달력 날짜를 고르면 숨은 입력값이 함께 바뀝니다.
   - 두 약관에 모두 동의해야 전송됩니다.

   폼은 실제로 어디에도 보내지 않습니다. 확인만 하고 완료 페이지로 넘깁니다.
   (프로젝트 정책: 뉴스레터와 같은 처리) */

(function () {
  "use strict";

  var DONE_URL = "reservation_done.html";
  /* 전송을 막는 조건은 두 가지뿐입니다: 시간 미선택, 약관 미동의.
     이름·연락처·이메일은 입력은 받되 검증하지 않습니다. */
  var AGREE_MESSAGE = "Both agreements above are required";
  var TIME_MESSAGE = "Please choose a meeting time.";

  /* ----------------------------------------------------------
     진행 단계 띠

     구간이 화면 위쪽에 들어오면 그 칸을 진하게 바꿉니다.
     띠 자체가 sticky라 화면 맨 위 60px 정도는 띠가 가립니다.
     그만큼 관찰 영역 위쪽을 잘라내야 한 칸 빨리 넘어가지 않습니다.
     ---------------------------------------------------------- */
  function initStepTracking() {
    var stepList = document.getElementById("reservation_steps");
    if (!stepList) {
      return;
    }

    var items = Array.prototype.slice.call(stepList.querySelectorAll("[data-step_for]"));
    var sections = items
      .map(function (item) {
        return document.getElementById(item.getAttribute("data-step_for"));
      })
      .filter(Boolean);

    if (sections.length === 0 || typeof IntersectionObserver !== "function") {
      return;
    }

    function setActiveStep(sectionId) {
      items.forEach(function (item) {
        var isActive = item.getAttribute("data-step_for") === sectionId;
        item.classList.toggle("is_active", isActive);
        var link = item.querySelector(".reservation_steps_link");
        if (link) {
          if (isActive) {
            link.setAttribute("aria-current", "step");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      });
    }

    /* 헤더 높이 토큰 + 띠의 실제 높이. 관찰자를 만들 때 한 번만 잽니다
       (rootMargin은 만든 뒤 바꿀 수 없습니다). 창 크기를 바꾸면 값이
       그대로 남지만, 폭별 차이가 125~190px이라 한 칸이 어긋날 정도는
       아닙니다. 사용자는 자기 화면 폭으로 페이지를 엽니다. */
    function bandHeight() {
      var token = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--header_height")
      );
      var headerHeight = isNaN(token) ? 72 : token;
      /* `stepList`는 안쪽 <ol>이라 띠의 padding이 빠집니다.
         화면을 실제로 가리는 것은 바깥 <nav>입니다. */
      var bar = stepList.closest(".reservation_steps") || stepList;

      return Math.round(headerHeight + bar.getBoundingClientRect().height);
    }

    var visible = {};

    var observer = new IntersectionObserver(
      function handleStepIntersect(entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });

        /* 여러 구간이 동시에 보일 수 있습니다.
           화면 순서상 가장 위에 있는 것을 현재 구간으로 봅니다. */
        for (var i = 0; i < sections.length; i += 1) {
          if (visible[sections[i].id]) {
            setActiveStep(sections[i].id);
            return;
          }
        }
      },
      /* 위쪽은 **헤더 + 띠**가 가리는 만큼 잘라냅니다. 그러지 않으면 아직
         띠 뒤에 숨어 있는 구간이 현재 구간으로 잡혀 한 칸 빨리 넘어갑니다.

         띠가 실제로 붙기 전에는 이 값이 -70px 고정이었습니다. 지금은 띠가
         화면을 차지하므로 실측해서 씁니다 — 360에서 190 · 768에서 144 ·
         1280에서 125로 폭마다 다릅니다(360은 단계 이름이 두 줄).
         헤더는 common.js가 나중에 끼워 넣어 아직 없을 수 있어, 높이는
         토큰에서 읽습니다. */
      { rootMargin: "-" + bandHeight() + "px 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------
     달력

     날짜는 버튼입니다(값 선택이 아니라 동작에 가까워 라디오로 두지 않았습니다).
     고른 날짜는 name="meeting_date" 숨은 입력에 넣어 폼과 함께 다닙니다.
     ---------------------------------------------------------- */
  function initCalendar() {
    var body = document.getElementById("reservation_calendar_body");
    var dateValue = document.getElementById("reservation_date_value");
    if (!body || !dateValue) {
      return;
    }

    body.addEventListener("click", function handleDayClick(event) {
      var day = event.target.closest(".reservation_day");
      if (!day || day.disabled) {
        return;
      }

      var previous = body.querySelector(".reservation_day.is_selected");
      if (previous) {
        previous.classList.remove("is_selected");
        previous.removeAttribute("aria-pressed");
      }

      day.classList.add("is_selected");
      day.setAttribute("aria-pressed", "true");
      dateValue.value = day.value;
    });
  }

  /* ----------------------------------------------------------
     전송 확인

     막는 조건은 두 가지입니다.
       1) 회의 시간을 안 골랐을 때  → 시간표 아래에 안내
       2) 약관 두 개를 다 체크 안 했을 때 → 전송 버튼 옆에 안내

     안내 문구를 각자 자기 자리에 두는 이유: 시간 문제를 페이지 맨 아래
     전송 버튼 옆에 띄우면, 화면이 시간표로 옮겨갔을 때 문구가 안 보입니다.

     실제 전송은 하지 않고 완료 페이지로 이동합니다.
     ---------------------------------------------------------- */
  function initSubmit() {
    var form = document.getElementById("reservation_form");
    var status = document.getElementById("reservation_status");
    if (!form || !status) {
      return;
    }

    var scheduleStatus = document.getElementById("schedule_status");
    var agreePrivacy = document.getElementById("agree_privacy");
    var agreeProduction = document.getElementById("agree_production");

    function getCheckedTime() {
      return form.querySelector('input[name="meeting_time"]:checked');
    }

    function isAgreed() {
      return Boolean(agreePrivacy && agreePrivacy.checked && agreeProduction && agreeProduction.checked);
    }

    function refreshAgreeStatus() {
      status.textContent = isAgreed() ? "" : AGREE_MESSAGE;
    }

    /* ----------------------------------------------------------
       모두 동의하기 — 개별 항목과 양방향으로 맞춥니다.

       · 부모를 켜면 개별 항목이 전부 켜지고, 끄면 전부 꺼집니다.
       · 개별 항목을 하나라도 끄면 부모가 꺼지고, 전부 켜면 부모가 켜집니다.
       · 일부만 켜진 동안에는 `indeterminate`(반쯤 찬 표시)로 둡니다 —
         켜짐/꺼짐 둘 중 하나로만 보이면 상태를 잘못 읽게 됩니다.

       `#agree_all`에는 `name`이 없어 폼 데이터에 들어가지 않습니다.
       전송을 막는 조건은 지금까지와 같이 **개별 두 항목**뿐입니다
       (`isAgreed()`를 건드리지 않았습니다).
       ---------------------------------------------------------- */
    var agreeAll = document.getElementById("agree_all");
    var agreeBoxes = [agreePrivacy, agreeProduction].filter(Boolean);

    function syncAgreeAll() {
      if (!agreeAll || agreeBoxes.length === 0) {
        return;
      }

      var checkedCount = agreeBoxes.filter(function (box) {
        return box.checked;
      }).length;

      agreeAll.checked = checkedCount === agreeBoxes.length;
      agreeAll.indeterminate = checkedCount > 0 && checkedCount < agreeBoxes.length;
    }

    if (agreeAll) {
      agreeAll.addEventListener("change", function handleAgreeAll() {
        agreeBoxes.forEach(function (box) {
          box.checked = agreeAll.checked;
        });

        agreeAll.indeterminate = false;
        refreshAgreeStatus();
      });
    }

    agreeBoxes.forEach(function (box) {
      box.addEventListener("change", function handleAgreeChange() {
        syncAgreeAll();
        refreshAgreeStatus();
      });
    });

    /* 시간을 고르는 순간 안내 문구를 지웁니다. */
    form.addEventListener("change", function handleTimeChange(event) {
      if (event.target.name === "meeting_time" && scheduleStatus) {
        scheduleStatus.textContent = "";
      }
    });

    form.addEventListener("submit", function handleSubmit(event) {
      event.preventDefault();

      if (!getCheckedTime()) {
        if (scheduleStatus) {
          scheduleStatus.textContent = TIME_MESSAGE;
        }
        /* 초점을 옮기면 그 자리로 화면이 따라가 안내 문구가 함께 보입니다. */
        var firstTime = form.querySelector('input[name="meeting_time"]');
        if (firstTime) {
          firstTime.focus();
        }
        return;
      }

      refreshAgreeStatus();

      if (!isAgreed()) {
        if (agreePrivacy && !agreePrivacy.checked) {
          agreePrivacy.focus();
        } else if (agreeProduction) {
          agreeProduction.focus();
        }
        return;
      }

      window.location.href = DONE_URL;
    });

    syncAgreeAll();
    refreshAgreeStatus();
  }

  /* ----------------------------------------------------------
     고를 때 화면이 움직이지 않게 합니다.

     ★ 이 폼의 라디오·체크박스는 전부 `.a11y_hidden`으로 가려져 있습니다.
     크기가 **1 × 1px**이고 라벨 왼쪽 위에 놓입니다. 라벨을 누르면 그 입력에
     초점이 가는데, 브라우저는 초점 받은 요소를 화면 안으로 넣으려고
     **페이지를 스크롤합니다.** 카드 윗부분이 화면 위로 잘려 있을 때
     실제로 **650px이 튀었습니다**(1280 실측). 컨테이너가 제자리를 못 지키는
     것처럼 보이던 것이 이것입니다.

     mousedown의 기본 동작(초점 이동)을 막고 `preventScroll`로 직접 초점을
     주면 **스크롤이 아예 일어나지 않습니다.** 되돌리는 방식이 아니라
     처음부터 막는 것이라 Lenis의 부드러운 스크롤과 다투지 않습니다.

     선택 자체는 그대로입니다 — 라벨 활성화는 mousedown이 아니라 click에서
     일어나므로 라디오는 평소처럼 바뀝니다.

     **키보드는 영향을 받지 않습니다.** Tab에는 mousedown이 없으므로,
     초점이 화면 밖에 있으면 예전처럼 스크롤해서 보여줍니다.
     ---------------------------------------------------------- */
  function initSteadySelection() {
    var form = document.getElementById("reservation_form");
    if (!form) {
      return;
    }

    form.addEventListener("mousedown", function handleSelectPress(event) {
      var label = event.target.closest ? event.target.closest("label") : null;
      if (!label) {
        return;
      }

      /* 이 폼에는 라벨이 입력을 감싼 것(실루엣·원단·시간·회의방식)과
         `for`로 연결한 것(약관 두 개)이 섞여 있습니다. `label.control`이
         둘 다 풀어 주고, 없으면 손으로 찾습니다. */
      var input = label.control
        || label.querySelector('input[type="radio"], input[type="checkbox"]')
        || (label.htmlFor ? document.getElementById(label.htmlFor) : null);

      if (!input || input.disabled) {
        return;
      }

      if (input.type !== "radio" && input.type !== "checkbox") {
        return;
      }

      event.preventDefault();
      input.focus({ preventScroll: true });
    });
  }

  /* ----------------------------------------------------------
     띠가 붙는 자리 — 이 페이지의 두 고정 UI를 맞물리게 합니다.

     이 페이지에는 성격이 반대인 고정 UI가 둘 있습니다.
     · **헤더** — 스크롤 방향에 따라 나타났다 사라집니다(common.js).
       `transform: translateY(-100%)`라 **자리를 비우지 않고 그림만 치웁니다.**
     · **진행 단계 띠** — 언제나 보여야 합니다.

     그래서 띠의 `top`은 헤더의 상태를 따라가야 합니다.

       헤더 표시 → 헤더 높이   [헤더][띠][내용]
       헤더 숨김 → 0           [띠][내용]

     ★ 고정해 두면 헤더가 사라진 뒤에 **그 높이만큼 빈 띠가 남고 그 사이로
     내용이 지나갑니다.** 이것이 "헤더가 사라졌는데 공간이 남는다"의 정체입니다.

     기준값은 CSS 변수 **두 개뿐**입니다. 붙는 자리도 앵커 여백도 전부
     여기서 계산하므로, 폭마다 px를 박아 둘 필요가 없습니다.
     · `--steps_header_h` — 헤더의 실제 높이
     · `--steps_bar_h`    — 띠의 실제 높이

     헤더를 **실측**하는 이유: CSS 토큰 `--header_height`(64 / 72 / 64)은
     `min-height`라, 내용에 따라 헤더가 더 커집니다(1280에서 실제 66).

     JS가 없거나 헤더를 못 찾으면 CSS에 적어 둔 대비값이 그대로 쓰입니다
     (그때는 띠가 헤더 아래에 고정 — 지금까지의 동작).
     ---------------------------------------------------------- */
  function initStepsOffset() {
    var form = document.getElementById("reservation_form");
    var nav = document.querySelector(".reservation_steps");
    if (!form || !nav) {
      return;
    }

    var header = null;
    var sizeWatcher = null;
    var stateWatcher = null;

    function sync() {
      if (!header) {
        return;
      }

      var headerHeight = Math.round(header.getBoundingClientRect().height);
      var isHeaderHidden = header.classList.contains("is_hidden");

      form.style.setProperty("--steps_header_h", headerHeight + "px");
      form.style.setProperty("--steps_bar_h", Math.round(nav.getBoundingClientRect().height) + "px");
      /* 숨은 헤더는 화면에서 자리를 차지하지 않으므로 띠가 맨 위로 올라갑니다. */
      form.style.setProperty("--steps_top", (isHeaderHidden ? 0 : headerHeight) + "px");
    }

    function attach() {
      header = document.querySelector(".header");
      if (!header) {
        return false;
      }

      sync();

      /* ★ 한 번만 재면 안 됩니다. 헤더가 막 들어온 순간에는 로고 이미지가
         아직 없어 64px로 잡히고, 로고가 뜨면 66px이 됩니다(실제로 겪었습니다).
         띠도 폭에 따라 줄 수가 달라집니다. 둘 다 크기를 지켜봅니다. */
      if (!sizeWatcher && typeof ResizeObserver === "function") {
        sizeWatcher = new ResizeObserver(sync);
        sizeWatcher.observe(header);
        sizeWatcher.observe(nav);
      }

      /* common.js가 `is_hidden`을 붙였다 뗄 때마다 따라갑니다.
         common.js는 공용 파일이라 건드리지 않고 결과만 지켜봅니다. */
      if (!stateWatcher && typeof MutationObserver === "function") {
        stateWatcher = new MutationObserver(sync);
        stateWatcher.observe(header, { attributes: true, attributeFilter: ["class"] });
      }

      return true;
    }

    window.addEventListener("resize", sync);
    window.addEventListener("load", attach);

    if (attach() || typeof MutationObserver !== "function") {
      return;
    }

    /* ★ 이 시점에는 헤더가 아직 없습니다. common.js가 fetch로 끼워 넣는데
       그게 `load`보다 늦을 수 있어 `load` 한 번으로는 놓칩니다(실제로 놓쳤습니다).
       슬롯을 지켜보다가 헤더가 들어오는 순간 붙고 관찰을 끝냅니다. */
    var slot = document.querySelector(".common_header_slot") || document.body;
    var slotWatcher = new MutationObserver(function () {
      if (attach()) {
        slotWatcher.disconnect();
      }
    });

    slotWatcher.observe(slot, { childList: true, subtree: true });
  }

  function init() {
    initStepTracking();
    initCalendar();
    initSteadySelection();
    initStepsOffset();
    initSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
