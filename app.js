// ============================================================
// 여행을 떠나자 — app.js (수정본: 8+1가지 변경 적용)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAbADaBZeXIdjJWncwoMgUh9F9zmeangLk",
  authDomain: "traver-26688.firebaseapp.com",
  projectId: "traver-26688",
  storageBucket: "traver-26688.firebasestorage.app",
  messagingSenderId: "53169364548",
  appId: "1:53169364548:web:00a9a87425c6643ea0e611",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ---- SVG 아이콘 상수 ----
const ICON_EDIT  = `<svg width="14" height="14"><use href="#icon-edit"/></svg>`;
const ICON_TRASH = `<svg width="14" height="14"><use href="#icon-trash"/></svg>`;
const ICON_MAP   = `<svg width="14" height="14"><use href="#icon-map"/></svg>`;
const ICON_LINK  = `<svg width="14" height="14"><use href="#icon-link"/></svg>`;

// ---- Global State ----
let currentUser = null;
let currentTripId = null;
let currentTrip = null;
let scheduleEditId = null;
let scheduleEditMode = false;
let scheduleAddOpen = false;
let scheduleItems = [];
let scheduleEditItemId = null;
let expenseEditId = null;
let expenseEditMode = false;
let expenseAddOpen = false;
let expenseEditItemId = null;
let resEditMode = false;
let resEditItemId = null;
let currentResItems = [];
let bucketEditId = null;
let bucketEditMode = false;
let bucketAddModalEditId = null;
let tripBucketEditId = null;
let isLocked = false;
let currentView = "table";
let tripFilter = "all";
let allBucketItems = [];
let expenseItems = [];
let bucketRegionTab = "all";

// ★ 인라인 편집 ID 변수 (변경 3: 인라인 수정)
let scheduleInlineEditId = null;
let expenseInlineEditId = null;
let wishInlineEditId = null;
let bucketInlineEditId = null;
let tipInlineEditId = null;

// ★ 준비물 드래그 상태 (변경 7: 준비물 계층/드래그)
let _packingDragId = null;
let _packingDragType = null;

// ★ 준비물 독립 잠금 + 접기 상태
let packingLocked = { common: false, overseas: false };
let packingCollapsed = {}; // key: "type_id" → true/false

let dirtyScheduleIds = new Set();
let dirtyExpenseIds = new Set();
let dirtyBucketIds = new Set();

let bucketSortCol = "";
let bucketSortDir = "asc";
let bucketColFilters = {};
let activeColMenu = null;

const CURRENCY_SYMBOLS = { JPY: "¥", EUR: "€", USD: "$", CNY: "¥", THB: "฿", VND: "₫", AUD: "A$" };
const DEFAULT_RATES = { JPY: 9.2, EUR: 1500, USD: 1380, CNY: 190, THB: 38, VND: 0.056, AUD: 900 };
const BUCKET_CATEGORIES = ["풍경", "맛집", "카페", "체험", "기념품", "쇼핑", "기타"];
const CAT_EMOJI = { 풍경:"🌄", 맛집:"🍜", 카페:"☕", 체험:"🎭", 기념품:"🎁", 쇼핑:"🛍️", 기타:"📌" };

// ============================================================
// 국기 이모지
// ============================================================
function getCountryFlag(country) {
  if (!country) return "✈️";
  const flags = {
    "한국":"🇰🇷","국내":"🇰🇷",
    "일본":"🇯🇵","중국":"🇨🇳","대만":"🇹🇼","홍콩":"🇭🇰","마카오":"🇲🇴",
    "태국":"🇹🇭","베트남":"🇻🇳","싱가포르":"🇸🇬","말레이시아":"🇲🇾",
    "인도네시아":"🇮🇩","필리핀":"🇵🇭","캄보디아":"🇰🇭","미얀마":"🇲🇲",
    "라오스":"🇱🇦","몽골":"🇲🇳","스리랑카":"🇱🇰","네팔":"🇳🇵",
    "인도":"🇮🇳","방글라데시":"🇧🇩","파키스탄":"🇵🇰",
    "미국":"🇺🇸","캐나다":"🇨🇦","멕시코":"🇲🇽","쿠바":"🇨🇺",
    "브라질":"🇧🇷","아르헨티나":"🇦🇷","페루":"🇵🇪","칠레":"🇨🇱","콜롬비아":"🇨🇴",
    "영국":"🇬🇧","프랑스":"🇫🇷","독일":"🇩🇪","이탈리아":"🇮🇹","스페인":"🇪🇸",
    "포르투갈":"🇵🇹","네덜란드":"🇳🇱","벨기에":"🇧🇪","스위스":"🇨🇭",
    "오스트리아":"🇦🇹","체코":"🇨🇿","헝가리":"🇭🇺","폴란드":"🇵🇱",
    "그리스":"🇬🇷","터키":"🇹🇷","노르웨이":"🇳🇴","스웨덴":"🇸🇪",
    "덴마크":"🇩🇰","핀란드":"🇫🇮","아이슬란드":"🇮🇸","러시아":"🇷🇺",
    "호주":"🇦🇺","뉴질랜드":"🇳🇿",
    "UAE":"🇦🇪","두바이":"🇦🇪","카타르":"🇶🇦","이스라엘":"🇮🇱",
    "이집트":"🇪🇬","모로코":"🇲🇦","케냐":"🇰🇪","남아프리카":"🇿🇦",
  };
  return flags[country] || "🌍";
}

// ============================================================
// CATEGORIES
// ============================================================
const DEFAULT_CATS = {
  schedule: ["식사","숙소","관광","공연/행사","카페","쇼핑","이동","기타"],
  expense:  ["식사","숙소","교통","체험","쇼핑","기타"],
  bucket:   ["풍경","맛집","카페","체험","기념품","쇼핑","기타"],
};

function getCategories(type) {
  const s = localStorage.getItem("cats_" + type);
  return s ? JSON.parse(s) : [...DEFAULT_CATS[type]];
}
function saveCategories(type, cats) { localStorage.setItem("cats_" + type, JSON.stringify(cats)); }

function addCategory(type) {
  const inp = document.getElementById("cat-input-" + type);
  const v = inp.value.trim(); if (!v) return;
  const cats = getCategories(type);
  if (cats.includes(v)) { showToast("이미 있어요!"); return; }
  cats.push(v); saveCategories(type, cats); inp.value = "";
  renderCatTags(type); refreshCategorySelects(); showToast(v + " 추가됐어요");
}
function removeCategory(type, v) {
  saveCategories(type, getCategories(type).filter(c => c !== v));
  renderCatTags(type); refreshCategorySelects();
}
function renderCatTags(type) {
  const el = document.getElementById("cat-tags-" + type); if (!el) return;
  el.innerHTML = getCategories(type).map(c => `
    <span class="cat-tag">${c}
      <button class="rm-cat" onclick="removeCategory('${type}','${c}')">×</button>
    </span>`).join("");
}
function renderAllCatTags() { ["schedule","expense","bucket"].forEach(renderCatTags); }

function refreshCategorySelects() {
  [
    ["sch-add-cat",  "schedule"],
    ["exp-add-cat",  "expense"],
    ["bk-category",  "bucket"],
    ["bam-type",     "bucket"],
  ].forEach(([id, type]) => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">선택</option>' +
      getCategories(type).map(c => `<option${c===cur?" selected":""}>${c}</option>`).join("");
  });
}

// ============================================================
// THEME — ★ 변경 4: 빨강·차콜 테마 추가
// ============================================================
const THEME_NAMES = {
  blue:"파랑", pink:"분홍", orange:"주황", green:"연두",
  purple:"보라", mint:"민트", rose:"로즈", sky:"하늘",
  red:"빨강", charcoal:"차콜"
};

function setTheme(t) {
  document.documentElement.className = "theme-" + t;
  localStorage.setItem("theme", t);
  const el = document.getElementById("theme-current-label");
  if (el) el.textContent = "현재 테마: " + (THEME_NAMES[t] || t);
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("selected", b.dataset.theme === t));
}
function loadTheme() { setTheme(localStorage.getItem("theme") || "blue"); }
loadTheme();

// ============================================================
// AUTH
// ============================================================
auth.onAuthStateChanged(user => {
  currentUser = user;
  document.getElementById("user-email").textContent = user ? (user.displayName || user.email) : "";
  document.getElementById("auth-btn").textContent = user ? "로그아웃" : "구글로 로그인";
  const si = document.getElementById("settings-user-info");
  if (si) si.textContent = user ? `${user.displayName||""} (${user.email})` : "로그인 정보 없음";
  if (user) { loadTrips(); loadAllBucketItems(); calcStorage(); }
  else {
    document.getElementById("trips-container").innerHTML = `
      <div class="empty-state">
        <div class="icon">✈️</div><h3>로그인이 필요해요</h3>
        <p>구글 계정으로 로그인 후 여행 기록을 시작하세요</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="handleAuth()">Google 계정으로 로그인</button>
      </div>`;
  }
});

function handleAuth() {
  if (currentUser) {
    auth.signOut().then(() => showToast("로그아웃 됐어요 👋"));
  } else {
    auth.signInWithPopup(googleProvider)
      .then(r => showToast((r.user.displayName || r.user.email) + "님 환영해요! 🎉"))
      .catch(e => { if (e.code !== "auth/popup-closed-by-user") showToast("로그인 오류: " + e.message); });
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  const nav = document.getElementById("nav-" + page); if (nav) nav.classList.add("active");
  if (page === "home") { loadTrips(); renderPlanList(); }
  if (page === "bucket") { loadBucketSortState(); loadAllBucketItems(); refreshCategorySelects(); updateBucketSortHeaders(); }
  if (page === "settings") { renderAllCatTags(); refreshCategorySelects(); calcStorage(); }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

// ============================================================
// STORAGE
// ============================================================
async function calcStorage() {
  if (!currentUser) return;
  try {
    const trips = await tripsRef().get();
    const bucket = await bucketRef().get();
    const total = trips.size + bucket.size;
    document.getElementById("storage-usage-text").textContent = `여행 ${trips.size}개, 버킷 ${bucket.size}개`;
    document.getElementById("storage-bar-inner").style.width = Math.min((total / 1000) * 100, 100) + "%";
  } catch { document.getElementById("storage-usage-text").textContent = "확인 불가"; }
}

// ============================================================
// TRIPS — HOME
// ============================================================
function tripsRef() { return db.collection("users").doc(currentUser.uid).collection("trips"); }

function toggleCreateTrip() {
  const p = document.getElementById("trip-create-panel");
  p.classList.toggle("hidden");
  if (!p.classList.contains("hidden")) document.getElementById("ct-title").focus();
}

async function loadTrips() {
  if (!currentUser) return;
  const c = document.getElementById("trips-container");
  c.innerHTML = "<div class='spinner'></div>";
  const snap = await tripsRef().orderBy("createdAt","desc").get().catch(() => ({ docs: [] }));
  let trips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (tripFilter === "overseas") trips = trips.filter(t => t.country && !["한국","국내"].includes(t.country));
  if (tripFilter === "domestic") trips = trips.filter(t => !t.country || ["한국","국내"].includes(t.country));
  syncTripsToPlans(trips);
  if (!trips.length) {
    c.innerHTML = `<div class="empty-state"><div class="icon">🗺️</div><h3>아직 여행이 없어요</h3><p>첫 번째 여행을 만들어보세요!</p></div>`;
    return;
  }
  const byYear = {};
  trips.forEach(t => { const y = t.startDate ? t.startDate.substring(0,4) : "날짜 미정"; (byYear[y] = byYear[y] || []).push(t); });
  c.innerHTML = Object.keys(byYear).sort((a,b) => b.localeCompare(a)).map(year => `
    <div class="year-group">
      <div class="year-label">📅 ${year}</div>
      <div class="trip-list">
        ${byYear[year].map(t => `
          <div class="trip-card" onclick="openTrip('${t.id}')">
            <div class="trip-card-emoji">${getCountryFlag(t.country)}</div>
            <div class="trip-card-body">
              <div class="trip-card-title">${t.title}</div>
              <div class="trip-card-meta">
                ${t.startDate ? formatDateShort(t.startDate) + " ~ " + formatDateShort(t.endDate || "") + " · " : ""}
                ${[t.city, t.country].filter(Boolean).join(", ") || "여행지 미정"}
                ${t.companions ? " · " + t.companions : ""}
              </div>
            </div>
            <div class="trip-card-actions" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-icon" onclick="deleteTrip('${t.id}')" title="삭제" style="color:var(--text-muted)">${ICON_TRASH}</button>
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

function filterTrips(type, el) {
  document.getElementById("packing-tips-panel").classList.add("hidden");
  document.getElementById("trips-container").style.display = "";
  tripFilter = type;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  loadTrips();
}

// ============================================================
// 준비물과 팁
// ============================================================
let _tipActiveTag = "all";
let _tipComposeTags = [];

function showPackingTips(el) {
  document.getElementById("trips-container").style.display = "none";
  document.getElementById("packing-tips-panel").classList.remove("hidden");
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  renderPackingList("common");
  renderPackingList("overseas");
  renderTips();
}

function showPTSubtab(tab, el) {
  document.querySelectorAll(".pt-subtab").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("pt-packing").style.display = tab === "packing" ? "" : "none";
  document.getElementById("pt-tips").style.display   = tab === "tips"    ? "" : "none";
}

// ---- 준비물 ---- (★ 변경 7·8: 계층 구조 + 드래그 + 인라인 추가)
const PACKING_DEFAULTS = {
  common: [
    {id:1,text:"여권",checked:false},{id:2,text:"항공권 / 예약 확인서",checked:false},
    {id:3,text:"충전기",checked:false},{id:4,text:"보조배터리",checked:false},
    {id:5,text:"상비약",checked:false},{id:6,text:"세면도구",checked:false},
    {id:7,text:"여행용 멀티탭",checked:false},{id:8,text:"우산 / 우비",checked:false},
  ],
  overseas: [
    {id:1,text:"유심 / eSIM",checked:false},{id:2,text:"환전",checked:false},
    {id:3,text:"해외결제 카드",checked:false},{id:4,text:"입국 관련 서류",checked:false},
    {id:5,text:"여행자 보험",checked:false},{id:6,text:"전자 교통카드",checked:false},
    {id:7,text:"번역 앱",checked:false},{id:8,text:"비상 연락처 출력",checked:false},
  ],
};

function getPackingItems(type) {
  const s = localStorage.getItem("packing_" + type);
  return s ? JSON.parse(s) : PACKING_DEFAULTS[type].map(i => ({...i}));
}
function savePackingItems(type, items) { localStorage.setItem("packing_" + type, JSON.stringify(items)); }

function renderPackingList(type) {
  const items = getPackingItems(type);
  const checked = items.filter(i => i.checked).length;
  const progEl = document.getElementById("packing-progress-" + type);
  if (progEl) {
    progEl.textContent = checked + " / " + items.length;
    progEl.className = "packing-progress" + (checked === items.length && items.length > 0 ? " done" : "");
  }
  const listEl = document.getElementById("packing-list-" + type);
  if (!listEl) return;
  if (!items.length) { listEl.innerHTML = '<div class="packing-empty">아래 버튼으로 항목을 추가하세요</div>'; return; }

  const topItems = items.filter(i => !i.parentId);
  const childItems = items.filter(i => i.parentId);

  const locked = packingLocked[type];
  // 잠금 버튼 UI 동기화
  const lockBtn = document.getElementById("packing-lock-btn-" + type);
  if (lockBtn) {
    lockBtn.textContent = locked ? "🔓 잠금 해제" : "🔒 잠금";
    lockBtn.classList.toggle("packing-lock-btn-active", locked);
  }

  listEl.innerHTML = topItems.map(item => {
    const myChildren = childItems.filter(c => String(c.parentId) === String(item.id));
    if (myChildren.length > 0) {
      const collapseKey = type + "_" + item.id;
      const isCollapsed = !!packingCollapsed[collapseKey];
      const someChecked = myChildren.some(c => c.checked);
      const partialClass = (!item.checked && someChecked) ? " partial" : "";
      return `
        <div class="packing-category${isCollapsed ? " collapsed" : ""}"
          ${!locked ? `ondragover="onPackDragOver(event,'${type}','${item.id}')" ondragleave="onPackDragLeave(event)" ondrop="onPackDrop(event,'${type}','${item.id}')"` : ""}>
          <div class="packing-cat-header-row">
            <button class="pack-collapse-btn${isCollapsed ? " collapsed" : ""}" onclick="togglePackingCollapse('${type}','${item.id}')" title="${isCollapsed ? "펼치기" : "접기"}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
            <label class="packing-check-label" onclick="togglePackingCheck('${type}',${item.id})">
              <span class="packing-check-box${item.checked ? " ticked" : partialClass}"></span>
              <span class="packing-cat-name">${escHtml(item.text)}</span>
            </label>
            ${!locked ? `<button class="packing-del-btn" onclick="deletePackingItem('${type}',${item.id})" title="삭제">${ICON_TRASH}</button>` : ""}
          </div>
          ${isCollapsed ? "" : `<div class="packing-children">
            ${myChildren.map(child => _packingItemHtml(type, child, true)).join("")}
          </div>`}
        </div>`;
    }
    return _packingItemHtml(type, item, false);
  }).join("");
}

function _packingItemHtml(type, item, isChild) {
  const locked = packingLocked[type];
  const dragAttrs = locked ? "" : `draggable="true"
      ondragstart="onPackDragStart(event,'${type}','${item.id}')"
      ondragover="onPackDragOver(event,'${type}','${item.id}')"
      ondragleave="onPackDragLeave(event)"
      ondrop="onPackDrop(event,'${type}','${item.id}')"`;
  return `
    <div class="packing-item${item.checked ? " checked" : ""}${isChild ? " packing-child" : ""}"
      id="pack-item-${type}-${item.id}" ${dragAttrs}>
      ${locked ? "" : `<span class="pack-drag-handle" title="드래그하여 카테고리로 묶기">⠿</span>`}
      <label class="packing-check-label" onclick="togglePackingCheck('${type}',${item.id})">
        <span class="packing-check-box${item.checked ? " ticked" : ""}"></span>
        <span class="packing-text">${escHtml(item.text)}</span>
      </label>
      ${locked ? "" : `<button class="packing-del-btn" onclick="deletePackingItem('${type}',${item.id})" title="삭제">${ICON_TRASH}</button>`}
    </div>`;
}

// ★ 변경 8: 인라인 추가 (prompt → 인라인 입력 행)
function addPackingItem(type) {
  const existing = document.getElementById("pack-add-inline-" + type);
  if (existing) { existing.querySelector("input")?.focus(); return; }
  const listEl = document.getElementById("packing-list-" + type);
  const row = document.createElement("div");
  row.id = "pack-add-inline-" + type;
  row.className = "packing-add-inline-row";
  row.innerHTML = `
    <input type="text" id="pack-add-input-${type}" placeholder="항목 이름 입력 후 Enter..."
      onkeydown="onPackAddKeydown(event,'${type}')" />
    <button class="pack-add-save-btn" onclick="savePackingInlineAdd('${type}')">추가</button>
    <button class="pack-add-cancel-btn" onclick="cancelPackingInlineAdd('${type}')">취소</button>`;
  if (listEl) listEl.appendChild(row);
  document.getElementById("pack-add-input-" + type)?.focus();
}

function onPackAddKeydown(event, type) {
  if (event.key === "Enter") { event.preventDefault(); savePackingInlineAdd(type); }
  if (event.key === "Escape") { event.preventDefault(); cancelPackingInlineAdd(type); }
}
function savePackingInlineAdd(type) {
  const inp = document.getElementById("pack-add-input-" + type);
  const text = inp?.value.trim();
  if (!text) { inp?.focus(); return; }
  const items = getPackingItems(type);
  items.push({id: Date.now(), text, checked: false});
  savePackingItems(type, items);
  cancelPackingInlineAdd(type);
  renderPackingList(type);
}
function cancelPackingInlineAdd(type) {
  document.getElementById("pack-add-inline-" + type)?.remove();
}

// ★ 드래그 앤 드롭 (준비물 계층화)
function onPackDragStart(event, type, id) {
  _packingDragId = String(id);
  _packingDragType = type;
  event.dataTransfer.effectAllowed = "move";
}
function onPackDragOver(event, type, targetId) {
  if (_packingDragId && String(_packingDragId) !== String(targetId) && _packingDragType === type) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
    event.dataTransfer.dropEffect = "move";
  }
}
function onPackDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}
function onPackDrop(event, type, targetId) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
  if (!_packingDragId || String(_packingDragId) === String(targetId) || _packingDragType !== type) {
    _packingDragId = null; _packingDragType = null; return;
  }
  const items = getPackingItems(type);
  const dragged = items.find(i => String(i.id) === String(_packingDragId));
  const target  = items.find(i => String(i.id) === String(targetId));
  if (!dragged || !target) { _packingDragId = null; _packingDragType = null; return; }
  // target이 이미 자식이면 target의 부모를 공유, 아니면 target을 부모로
  const newParentId = target.parentId ? target.parentId : String(target.id);
  if (String(dragged.id) === String(newParentId)) {
    showToast("자기 자신 아래에 넣을 수 없어요"); _packingDragId = null; _packingDragType = null; return;
  }
  dragged.parentId = newParentId;
  savePackingItems(type, items);
  renderPackingList(type);
  _packingDragId = null; _packingDragType = null;
  showToast("묶었어요 📁");
}

let _packingClickLock = false;
function togglePackingCheck(type, id) {
  if (_packingClickLock) return;
  _packingClickLock = true;
  setTimeout(() => { _packingClickLock = false; }, 300);
  const items = getPackingItems(type);
  const item = items.find(i => String(i.id) === String(id));
  if (item) {
    item.checked = !item.checked;
    // 상위 체크 → 하위 전부 연동
    const children = items.filter(c => String(c.parentId) === String(id));
    children.forEach(c => { c.checked = item.checked; });
    // 하위 체크 변경 → 상위 자동 갱신 (모두 체크면 부모도 체크)
    if (item.parentId) {
      const parent = items.find(p => String(p.id) === String(item.parentId));
      if (parent) {
        const siblings = items.filter(c => String(c.parentId) === String(item.parentId));
        parent.checked = siblings.every(s => s.checked);
      }
    }
  }
  savePackingItems(type, items);
  renderPackingList(type);
}
function checkAllPacking(type) {
  const items = getPackingItems(type);
  items.forEach(i => i.checked = true);
  savePackingItems(type, items); renderPackingList(type);
}
function uncheckAllPacking(type) {
  const items = getPackingItems(type);
  items.forEach(i => i.checked = false);
  savePackingItems(type, items); renderPackingList(type);
}

// ★ 준비물 접기/펼치기
function togglePackingCollapse(type, id) {
  const key = type + "_" + id;
  packingCollapsed[key] = !packingCollapsed[key];
  renderPackingList(type);
}

// ★ 준비물 독립 잠금 (드래그 비활성화, 삭제 비활성화, 체크만 가능)
function togglePackingLock(type) {
  packingLocked[type] = !packingLocked[type];
  renderPackingList(type);
  const addBtn = document.getElementById("packing-add-btn-" + type);
  if (addBtn) addBtn.style.display = packingLocked[type] ? "none" : "";
  showToast(packingLocked[type] ? "🔒 준비물이 잠겼어요 (체크만 가능)" : "🔓 잠금 해제됐어요");
}

// ★ 변경 7: 삭제 시 자식은 최상위로 올림
function deletePackingItem(type, id) {
  let items = getPackingItems(type);
  items.forEach(i => { if (String(i.parentId) === String(id)) { delete i.parentId; } });
  items = items.filter(i => String(i.id) !== String(id));
  savePackingItems(type, items);
  renderPackingList(type);
}

// ---- 유용한 팁 ---- (★ 변경 6: flat 표시)
function getTips() { const s = localStorage.getItem("tripTips"); return s ? JSON.parse(s) : []; }
function saveTipsData(tips) { localStorage.setItem("tripTips", JSON.stringify(tips)); }

function renderTipTagFilterBar() {
  const tips = getTips();
  const allTags = [...new Set(tips.flatMap(t => t.tags || []))];
  const bar = document.getElementById("tip-tag-filter-bar");
  if (!bar) return;
  if (!allTags.length) { bar.innerHTML = ""; return; }
  bar.innerHTML =
    `<button class="tip-filter-chip${_tipActiveTag === "all" ? " active" : ""}" onclick="setTipTagFilter('all')">전체</button>` +
    allTags.map(tag =>
      `<button class="tip-filter-chip${_tipActiveTag === tag ? " active" : ""}" onclick="setTipTagFilter('${escHtml(tag)}')">#${escHtml(tag)}</button>`
    ).join("");
}

function setTipTagFilter(tag) { _tipActiveTag = tag; renderTipTagFilterBar(); renderTips(); }

function linkify(html) {
  return html.replace(/(https?:\/\/[^\s<>"'&]+)/g, url =>
    `<a href="${url}" target="_blank" rel="noreferrer" class="tip-auto-link">${url}</a>`
  );
}

// ★ 변경 6: 팁을 flat 형태로 표시 (아코디언 제거)
function renderTips() {
  renderTipTagFilterBar();
  let tips = getTips();
  if (_tipActiveTag !== "all") tips = tips.filter(t => (t.tags || []).includes(_tipActiveTag));
  const listEl = document.getElementById("tips-list");
  if (!listEl) return;
  if (!tips.length) {
    listEl.innerHTML = `<div class="tips-empty">${_tipActiveTag !== "all"
      ? `'#${escHtml(_tipActiveTag)}' 태그의 팁이 없어요`
      : "아직 작성된 팁이 없어요.<br>글 작성을 눌러 첫 팁을 남겨보세요!"}</div>`;
    return;
  }
  listEl.innerHTML = tips.map(tip => {
    if (tip.id === tipInlineEditId) {
      return _renderTipInlineEditRow(tip);
    }
    const tagsHtml = (tip.tags||[]).length
      ? `<span class="tip-flat-tags">${tip.tags.map(t=>`<span class="tip-tag-chip">#${escHtml(t)}</span>`).join(" ")}</span>`
      : "";
    const hasSep = tip.title || (tip.tags||[]).length;
    const sep = hasSep && tip.content ? '<span class="tip-flat-sep">—</span>' : "";
    const contentHtml = tip.content ? `<span class="tip-flat-content">${linkify(escHtml(tip.content).replace(/\n/g,"<br>"))}</span>` : "";
    return `
    <div class="tip-flat-row" id="tip-row-${tip.id}">
      <div class="tip-flat-main">
        ${tip.title ? `<span class="tip-flat-title">${escHtml(tip.title)}</span>` : ""}
        ${tagsHtml}
        ${sep}
        ${contentHtml}
      </div>
      <div class="tip-flat-actions">
        <button class="packing-del-btn tip-del-btn" onclick="openTipInlineEdit(${tip.id})" title="수정">${ICON_EDIT}</button>
        <button class="packing-del-btn tip-del-btn" onclick="deleteTip(${tip.id})" title="삭제">${ICON_TRASH}</button>
      </div>
    </div>`;
  }).join("");
}

function _renderTipInlineEditRow(tip) {
  return `
  <div class="tip-inline-edit-wrap" id="tip-row-${tip.id}">
    <input type="text" id="tip-ie-title-${tip.id}" class="tip-form-input" value="${escHtml(tip.title)}" placeholder="제목" style="margin-bottom:6px"/>
    <input type="text" id="tip-ie-tags-${tip.id}" class="tip-form-input" value="${escHtml((tip.tags||[]).join(", "))}" placeholder="태그 (쉼표 구분)" style="margin-bottom:6px;font-size:.82rem"/>
    <textarea id="tip-ie-content-${tip.id}" class="tip-form-textarea" style="margin-bottom:8px">${escHtml(tip.content)}</textarea>
    <div class="tip-compose-actions">
      <button class="btn btn-ghost btn-sm" onclick="cancelTipInlineEdit()">취소</button>
      <button class="btn btn-primary btn-sm" onclick="saveTipInlineEdit(${tip.id})">저장</button>
    </div>
  </div>`;
}

function openTipInlineEdit(id) {
  tipInlineEditId = id;
  renderTips();
  setTimeout(() => document.getElementById("tip-ie-title-" + id)?.focus(), 50);
}
function cancelTipInlineEdit() {
  tipInlineEditId = null;
  renderTips();
}
function saveTipInlineEdit(id) {
  const tips = getTips();
  const tip = tips.find(t => t.id === id);
  if (!tip) return;
  const title = document.getElementById("tip-ie-title-" + id)?.value.trim();
  if (!title) { showToast("제목을 입력해주세요"); return; }
  const content = document.getElementById("tip-ie-content-" + id)?.value.trim() || "";
  const tagsRaw = document.getElementById("tip-ie-tags-" + id)?.value.trim() || "";
  tip.title = title; tip.content = content;
  tip.tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  saveTipsData(tips);
  tipInlineEditId = null;
  renderTips();
  showToast("팁이 수정되었어요 ✅");
}
function deleteTip(id) {
  if (!confirm("이 팁을 삭제할까요?")) return;
  saveTipsData(getTips().filter(t => t.id !== id));
  renderTips();
}

function openTipCompose() {
  _tipComposeTags = [];
  document.getElementById("tip-title-input").value = "";
  document.getElementById("tip-tag-input").value = "";
  document.getElementById("tip-content-input").value = "";
  renderComposeTags();
  document.getElementById("tip-compose").classList.remove("hidden");
  document.getElementById("tip-title-input").focus();
}
function closeTipCompose() {
  document.getElementById("tip-compose").classList.add("hidden");
  _tipComposeTags = [];
}
function onTipTagKey(e) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const val = e.target.value.replace(/,/g,"").trim();
    if (val && !_tipComposeTags.includes(val)) { _tipComposeTags.push(val); renderComposeTags(); }
    e.target.value = "";
  }
}
function removeTipComposeTag(tag) {
  _tipComposeTags = _tipComposeTags.filter(t => t !== tag); renderComposeTags();
}
function renderComposeTags() {
  const el = document.getElementById("tip-tag-preview"); if (!el) return;
  el.innerHTML = _tipComposeTags.map(t =>
    `<span class="compose-tag-chip">#${escHtml(t)}<button class="compose-tag-del" onclick="removeTipComposeTag('${escHtml(t)}')">×</button></span>`
  ).join("");
}
function saveTip() {
  const title   = document.getElementById("tip-title-input").value.trim();
  const content = document.getElementById("tip-content-input").value.trim();
  const rawTag  = document.getElementById("tip-tag-input").value.replace(/,/g,"").trim();
  const tags = [..._tipComposeTags];
  if (rawTag && !tags.includes(rawTag)) tags.push(rawTag);
  if (!title)   { showToast("제목을 입력해주세요"); return; }
  if (!content) { showToast("내용을 입력해주세요"); return; }
  const tips = getTips();
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  tips.unshift({ id: Date.now(), title, content, tags, date: dateStr });
  saveTipsData(tips);
  closeTipCompose();
  _tipActiveTag = "all";
  renderTips();
  showToast("저장됐어요! ✨");
}

async function createTrip() {
  if (!currentUser) { showToast("먼저 로그인해주세요!"); return; }
  const title = document.getElementById("ct-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요"); return; }
  const data = {
    title,
    country: document.getElementById("ct-country").value.trim() || null,
    city:    document.getElementById("ct-city").value.trim() || null,
    startDate: document.getElementById("ct-start").value || null,
    endDate:   document.getElementById("ct-end").value || null,
    companions: document.getElementById("ct-companions").value.trim() || null,
    foreignCurrency: null, exchangeRate: null, mapLink: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await tripsRef().add(data);
  addPlanFromTrip(data, ref.id);
  toggleCreateTrip();
  showToast("여행 생성 완료! 🎉");
  openTrip(ref.id);
}

async function deleteTrip(id) {
  if (!confirm("이 여행을 삭제할까요? (일정·지출·예약 모두 삭제됩니다)")) return;
  const cols = ["schedules","expenses","reservations"];
  for (const col of cols) {
    const snap = await tripsRef().doc(id).collection(col).get().catch(() => ({ docs: [] }));
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (snap.docs.length) await batch.commit();
  }
  await tripsRef().doc(id).delete();
  removePlanByTripId(id);
  showToast("삭제됐어요"); loadTrips();
}

// ============================================================
// TRIP DETAIL
// ============================================================
async function openTrip(tripId) {
  showPage("trip");
  currentTripId = tripId;
  scheduleEditId = null; scheduleEditMode = false; scheduleAddOpen = false;
  expenseEditId = null; expenseEditMode = false; expenseAddOpen = false;
  bucketEditMode = false; bucketAddModalEditId = null;
  resEditMode = false; resEditItemId = null;
  scheduleInlineEditId = null; expenseInlineEditId = null;
  wishInlineEditId = null; bucketInlineEditId = null;
  dirtyScheduleIds.clear(); dirtyExpenseIds.clear(); dirtyBucketIds.clear();

  // ★ 여행 전환 시 이전 데이터 즉시 초기화 (다른 여행 데이터가 잠깐 보이는 버그 방지)
  scheduleItems = [];
  expenseItems = [];
  currentResItems = [];
  allBucketItems = [];
  const spinner = `<tr><td colspan="99" class="empty-msg"><div class="spinner" style="width:20px;height:20px;margin:10px auto"></div></td></tr>`;
  const sTbody = document.getElementById("schedule-tbody");
  if (sTbody) sTbody.innerHTML = spinner;
  const eTbody = document.getElementById("expense-tbody");
  if (eTbody) eTbody.innerHTML = spinner;
  updateBudget(0);
  ["항공","숙소","기타"].forEach(t => {
    const el = document.getElementById("res-list-" + t);
    if (el) el.innerHTML = "";
  });

  const doc = await tripsRef().doc(tripId).get();
  currentTrip = { id: doc.id, ...doc.data() };
  renderTripInfo();
  refreshCategorySelects();
  loadSchedules(); loadExpenses(); loadReservations(); loadTripBucketItems();

  ["schedule-edit-mode-btn","expense-edit-mode-btn","res-edit-mode-btn","bucket-edit-mode-btn"].forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });
  ["edit-mode-banner","expense-edit-banner","res-edit-banner","bucket-edit-banner"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  document.getElementById("schedule-table")?.classList.remove("edit-mode-on");
  document.getElementById("expense-table")?.classList.remove("edit-mode-on");
  ["sch-action-col","exp-action-col","bucket-action-col"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ""; el.style.width = "0"; el.style.padding = "0"; }
  });
}

function renderTripInfo() {
  const t = currentTrip;
  document.getElementById("trip-title-input").value = t.title || "";
  document.getElementById("trip-start-input").value = t.startDate || "";
  document.getElementById("trip-end-input").value = t.endDate || "";
  document.getElementById("trip-companions-input").value = t.companions || "";
  document.getElementById("trip-location-input").value = [t.city, t.country].filter(Boolean).join(", ");
  document.getElementById("currency-select").value = t.foreignCurrency || "";
  updateCurrencyDisplay();
  updateMapEntryBtn();
  if (t.startDate) {
    ["sch-add-date","exp-add-date"].forEach(id => {
      const el = document.getElementById(id); if (el && !el.value) el.value = t.startDate;
    });
  }
}

function updateMapEntryBtn() {
  const btn = document.getElementById("map-entry-btn"); if (!btn) return;
  if (currentTrip?.mapLink) { btn.classList.add("has-map"); btn.title = "지도 보기 / 수정"; }
  else { btn.classList.remove("has-map"); btn.title = "지도 연결"; }
}

async function saveTripField(field, value) {
  if (!currentTripId) return;
  const update = {}; update[field] = value || null;
  currentTrip[field] = value || null;
  await tripsRef().doc(currentTripId).update(update);
}

async function saveTripFieldLocation(value) {
  if (!currentTripId) return;
  const parts = value.split(",").map(s => s.trim());
  const city = parts[0] || null; const country = parts[1] || null;
  currentTrip.city = city; currentTrip.country = country;
  await tripsRef().doc(currentTripId).update({ city, country });
}

function updateCurrencyDisplay() {
  const t = currentTrip;
  const rd = document.getElementById("rate-display");
  if (t && t.foreignCurrency) {
    rd.classList.remove("hidden");
    document.getElementById("currency-symbol").textContent = CURRENCY_SYMBOLS[t.foreignCurrency] || t.foreignCurrency;
    const rate = t.exchangeRate || DEFAULT_RATES[t.foreignCurrency] || 1;
    document.getElementById("rate-value-display").textContent = rate.toLocaleString();
    document.getElementById("foreign-col-header").textContent = "외화 (" + (CURRENCY_SYMBOLS[t.foreignCurrency] || "") + ")";
    const h = document.getElementById("rate-hint");
    if (h) h.textContent = `1${CURRENCY_SYMBOLS[t.foreignCurrency]||""} = ${rate.toLocaleString()}원`;
    const fi = document.getElementById("exp-add-foreign"); if (fi) fi.disabled = false;
  } else {
    rd.classList.add("hidden");
    document.getElementById("foreign-col-header").textContent = "외화";
    const h = document.getElementById("rate-hint"); if (h) h.textContent = "";
    const fi = document.getElementById("exp-add-foreign"); if (fi) fi.disabled = true;
  }
}

async function onCurrencyChange(code) {
  currentTrip.foreignCurrency = code || null;
  currentTrip.exchangeRate = code ? (DEFAULT_RATES[code] || 1) : null;
  await tripsRef().doc(currentTripId).update({ foreignCurrency: currentTrip.foreignCurrency, exchangeRate: currentTrip.exchangeRate });
  updateCurrencyDisplay(); loadExpenses();
}

function editRate() {
  const v = parseFloat(prompt("새 환율 입력 (1외화 = ?원):", currentTrip.exchangeRate));
  if (isNaN(v) || v <= 0) return;
  currentTrip.exchangeRate = v;
  tripsRef().doc(currentTripId).update({ exchangeRate: v });
  updateCurrencyDisplay(); loadExpenses();
}

// ============================================================
// 지도 링크
// ============================================================
function openMapEntryModal() { _refreshMapEntryDisplay(); openModal("modal-map-entry"); }

function _refreshMapEntryDisplay() {
  const saved = currentTrip?.mapLink || "";
  const parsed = parseMapInput(saved) || saved;
  const iframeWrap = document.getElementById("map-entry-iframe-wrap");
  const iframe     = document.getElementById("map-entry-iframe");
  const urlView    = document.getElementById("map-entry-url-view");
  const urlEdit    = document.getElementById("map-entry-url-edit");
  const emptyEl    = document.getElementById("map-entry-empty");
  const linkEl     = document.getElementById("map-entry-preview-link");
  const inp        = document.getElementById("map-entry-input");
  if (urlEdit)  urlEdit.classList.add("hidden");
  if (inp)      inp.value = saved;
  if (saved) {
    emptyEl?.classList.add("hidden");
    urlView?.classList.remove("hidden");
    if (linkEl) { linkEl.href = parsed; linkEl.textContent = parsed; }
    const embedUrl = buildMapEmbedUrl(parsed);
    if (embedUrl && iframeWrap && iframe) { iframe.src = embedUrl; iframeWrap.classList.remove("hidden"); }
    else { iframeWrap?.classList.add("hidden"); }
  } else {
    urlView?.classList.add("hidden");
    emptyEl?.classList.remove("hidden");
    iframeWrap?.classList.add("hidden");
    if (iframe) iframe.src = "";
  }
}

function startMapLinkEdit() {
  document.getElementById("map-entry-url-view")?.classList.add("hidden");
  document.getElementById("map-entry-empty")?.classList.add("hidden");
  const editEl = document.getElementById("map-entry-url-edit");
  if (editEl) editEl.classList.remove("hidden");
  const inp = document.getElementById("map-entry-input");
  if (inp) { inp.value = currentTrip?.mapLink || ""; inp.focus(); }
}
function cancelMapLinkEdit() { _refreshMapEntryDisplay(); }

function updateMapEntryPreview() {
  const raw = document.getElementById("map-entry-input")?.value.trim() || "";
  const parsed = parseMapInput(raw);
  const iframeWrap = document.getElementById("map-entry-iframe-wrap");
  const iframe     = document.getElementById("map-entry-iframe");
  if (parsed && iframeWrap && iframe) {
    const embedUrl = buildMapEmbedUrl(parsed);
    if (embedUrl) { iframe.src = embedUrl; iframeWrap.classList.remove("hidden"); }
    else iframeWrap.classList.add("hidden");
  } else if (iframeWrap) { iframeWrap.classList.add("hidden"); if (iframe) iframe.src = ""; }
}

function parseMapInput(raw) {
  if (!raw) return null;
  raw = raw.trim();
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return null;
}

async function saveTripMapLink() {
  const editEl  = document.getElementById("map-entry-url-edit");
  const editing = editEl && !editEl.classList.contains("hidden");
  const raw     = editing ? (document.getElementById("map-entry-input")?.value.trim() || "") : (currentTrip?.mapLink || "");
  const parsed  = parseMapInput(raw) || (raw || null);
  currentTrip.mapLink = parsed || null;
  await tripsRef().doc(currentTripId).update({ mapLink: parsed || null });
  closeModal("modal-map-entry");
  updateMapEntryBtn();
  if (parsed) showToast("지도 연결 완료 🗺️");
  else showToast("지도 연결 해제됨");
}

async function clearTripMapLink() {
  if (!confirm("지도 연결을 해제할까요?")) return;
  currentTrip.mapLink = null;
  await tripsRef().doc(currentTripId).update({ mapLink: null });
  closeModal("modal-map-entry"); updateMapEntryBtn(); showToast("지도 연결 해제됨");
}

function onMapEntryBtnClick() { openMapEntryModal(); }

function setView(view) {
  currentView = view;
  document.getElementById("schedule-table-view").classList.toggle("hidden", view !== "table");
  document.getElementById("schedule-timetable-view").classList.toggle("hidden", view !== "timetable");
  document.getElementById("view-table-btn").classList.toggle("view-active", view === "table");
  document.getElementById("view-time-btn").classList.toggle("view-active", view === "timetable");
}

// ============================================================
// 지도 모달
// ============================================================
function buildMapEmbedUrl(raw) {
  if (!raw) return "";
  if (raw.includes("output=embed") || raw.includes("/embed?")) return raw;
  if (raw.includes("google.com/maps/d/")) {
    const m = raw.match(/mid=([^&]+)/);
    if (m) return "https://www.google.com/maps/d/embed?mid=" + m[1];
  }
  const q = raw.match(/[?&]q=([^&]+)/);
  if (q) return `https://maps.google.com/maps?q=${q[1]}&output=embed&hl=ko`;
  const ll = raw.match(/@([-\d.]+),([-\d.]+)/);
  if (ll) return `https://maps.google.com/maps?q=${ll[1]},${ll[2]}&output=embed&hl=ko`;
  return raw;
}

function openMapModal(notesUrl, locationName) {
  const title = document.getElementById("map-modal-title");
  const anchor = document.getElementById("map-modal-link-anchor");
  const frame  = document.getElementById("map-modal-frame");
  title.textContent = "🗺️ " + (locationName || "지도");
  if (notesUrl) {
    anchor.href = notesUrl; anchor.textContent = notesUrl; anchor.style.display = "";
    frame.src = buildMapEmbedUrl(notesUrl);
  } else {
    const q = encodeURIComponent(locationName || "");
    anchor.href = "https://maps.google.com/maps?q=" + q;
    anchor.textContent = locationName ? locationName + " 검색하기 ↗" : "";
    anchor.style.display = "";
    frame.src = "https://maps.google.com/maps?q=" + q + "&output=embed&hl=ko";
  }
  openModal("modal-map-view");
}

function openResLinkModal(encodedUrl) {
  const raw = decodeURIComponent(encodedUrl);
  const embedUrl = buildMapEmbedUrl(raw);
  const isEmbed = embedUrl && (embedUrl.includes("output=embed") || embedUrl.includes("/embed?") || embedUrl.includes("maps/embed"));
  const iframeWrap  = document.getElementById("link-iframe-wrap");
  const externalCard = document.getElementById("link-external-card");
  if (isEmbed) {
    iframeWrap.classList.remove("hidden"); externalCard.classList.add("hidden");
    document.getElementById("link-preview-frame").src = embedUrl;
    document.getElementById("link-preview-anchor").href = raw;
    const label = document.getElementById("link-preview-url");
    if (label) label.textContent = raw;
  } else {
    iframeWrap.classList.add("hidden"); externalCard.classList.remove("hidden");
    document.getElementById("link-preview-frame").src = "";
    const extUrl = document.getElementById("link-external-url");
    const extAnchor = document.getElementById("link-external-anchor");
    if (extUrl) extUrl.textContent = raw;
    if (extAnchor) extAnchor.href = raw;
  }
  openModal("modal-link-preview");
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function isUrl(str) {
  return typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));
}
function formatDateShort(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return dateStr;
}

// ★ 변경 1: 비고 링크 → 새 탭에서 바로 열기
function renderLink(val, title) {
  if (!val) return "-";
  if (isUrl(val)) {
    return `<a class="link-icon" href="${escHtml(val)}" target="_blank" rel="noreferrer" title="${escHtml(val)}">${ICON_LINK}</a>`;
  }
  return escHtml(val);
}

function getTransBadge(trans) {
  if (!trans) return "-";
  const t = trans.toLowerCase();
  let cls = "badge-trans-other";
  if (t.includes("기차") || t.includes("jr") || t.includes("열차")) cls = "badge-trans-train";
  else if (t.includes("버스")) cls = "badge-trans-bus";
  else if (t.includes("택시")) cls = "badge-trans-taxi";
  else if (t.includes("도보") || t.includes("걷기")) cls = "badge-trans-walk";
  else if (t.includes("비행") || t.includes("항공") || t.includes("flight")) cls = "badge-trans-flight";
  else if (t.includes("지하철") || t.includes("metro") || t.includes("subway")) cls = "badge-trans-subway";
  else if (t.includes("배") || t.includes("페리") || t.includes("선박")) cls = "badge-trans-ship";
  else if (t.includes("차") || t.includes("car") || t.includes("드라이브")) cls = "badge-trans-car";
  return `<span class="badge ${cls}">${escHtml(trans)}</span>`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ============================================================
// 체크박스 공통 유틸
// ============================================================
function markDirty(type, id) {
  const prefix = type === "schedule" ? "sch" : type === "expense" ? "exp" : "bkt";
  if (type === "schedule") dirtyScheduleIds.add(id);
  else if (type === "expense") dirtyExpenseIds.add(id);
  else if (type === "bucket") dirtyBucketIds.add(id);
  const cb = document.getElementById(prefix + "-check-" + id);
  if (cb) cb.checked = true;
  updateCheckedCount(type);
}

function updateCheckedCount(type) {
  const prefix = type === "schedule" ? "sch" : type === "expense" ? "exp" : type === "bucket" ? "bkt" : "res";
  const className = prefix + "-row-check";
  const checks = document.querySelectorAll("." + className);
  const count = Array.from(checks).filter(c => c.checked).length;
  const countEl = document.getElementById(prefix + "-checked-count");
  if (countEl) countEl.textContent = count + "개 선택";
  const allCb = document.getElementById(prefix + "-select-all");
  if (allCb) {
    allCb.checked = checks.length > 0 && count === checks.length;
    allCb.indeterminate = count > 0 && count < checks.length;
  }
}

function toggleSelectAll(type, cb) {
  const prefix = type === "schedule" ? "sch" : type === "expense" ? "exp" : type === "bucket" ? "bkt" : "res";
  document.querySelectorAll("." + prefix + "-row-check").forEach(c => c.checked = cb.checked);
  updateCheckedCount(type);
}

function onRowCheckChange(type) { updateCheckedCount(type); }

function getCheckedIds(type) {
  const prefix = type === "schedule" ? "sch" : type === "expense" ? "exp" : type === "bucket" ? "bkt" : "res";
  return Array.from(document.querySelectorAll("." + prefix + "-row-check:checked")).map(c => c.dataset.id);
}

async function saveChecked(type) {
  const ids = getCheckedIds(type);
  if (!ids.length) { showToast("저장할 항목을 선택해주세요"); return; }
  let saved = 0;
  for (const id of ids) {
    try {
      let ok = false;
      if (type === "schedule") ok = await saveEditModeRow(id, true);
      else if (type === "expense") ok = await saveExpenseEditModeRow(id, true);
      else if (type === "bucket") ok = await saveBucketEditModeRow(id, true);
      if (ok) saved++;
    } catch(e) { console.warn("save error", id, e); }
  }
  if (!saved) { showToast("저장할 내용이 없어요 (필수 항목 확인)"); return; }
  showToast(saved + "개 저장 완료 ✅");
  if (type === "schedule") { dirtyScheduleIds.clear(); renderScheduleTable(scheduleItems); renderTimetable(scheduleItems); updateCheckedCount("schedule"); }
  else if (type === "expense") { dirtyExpenseIds.clear(); renderExpenses(expenseItems); updateCheckedCount("expense"); }
  else if (type === "bucket") { dirtyBucketIds.clear(); renderBucketList(); renderTripBucket(allBucketItems); updateCheckedCount("bucket"); }
}

async function deleteChecked(type) {
  const ids = getCheckedIds(type);
  if (!ids.length) { showToast("삭제할 항목을 선택해주세요"); return; }
  if (!confirm(ids.length + "개 항목을 삭제할까요?")) return;
  const batch = db.batch();
  ids.forEach(id => {
    if (type === "schedule") batch.delete(schedulesRef().doc(id));
    else if (type === "expense") batch.delete(expensesRef().doc(id));
    else if (type === "bucket") batch.delete(bucketRef().doc(id));
    else if (type === "res") batch.delete(reservationsRef().doc(id));
  });
  await batch.commit();
  showToast(ids.length + "개 삭제됐어요");
  if (type === "schedule") { dirtyScheduleIds.clear(); loadSchedules(); }
  else if (type === "expense") { dirtyExpenseIds.clear(); loadExpenses(); }
  else if (type === "bucket") { dirtyBucketIds.clear(); reloadBucketAll(); }
  else if (type === "res") { loadReservations(); }
}

// ============================================================
// 편집 모드 토글 — 일정
// ============================================================
function toggleLock() {
  isLocked = !isLocked;
  const btn = document.getElementById("lock-btn");
  if (btn) {
    btn.classList.toggle("locked", isLocked);
    btn.title = isLocked ? "잠금 해제" : "잠금";
    btn.innerHTML = isLocked
      ? `<svg width="15" height="15"><use href="#icon-lock"/></svg>`
      : `<svg width="15" height="15"><use href="#icon-unlock"/></svg>`;
  }
  document.body.classList.toggle("page-locked", isLocked);
}

function toggleScheduleEditMode() {
  scheduleEditMode = !scheduleEditMode;
  scheduleInlineEditId = null;
  dirtyScheduleIds.clear();
  const btn = document.getElementById("schedule-edit-mode-btn");
  const banner = document.getElementById("edit-mode-banner");
  const table = document.getElementById("schedule-table");
  const actionCol = document.getElementById("sch-action-col");
  if (btn) btn.classList.toggle("active", scheduleEditMode);
  if (banner) banner.classList.toggle("hidden", !scheduleEditMode);
  if (table) table.classList.toggle("edit-mode-on", scheduleEditMode);
  if (actionCol) {
    actionCol.textContent = scheduleEditMode ? "☑" : "";
    actionCol.style.width = scheduleEditMode ? "34px" : "0";
    actionCol.style.padding = scheduleEditMode ? "8px 4px" : "0";
  }
  if (scheduleEditMode) scheduleEditId = null;
  renderScheduleTable(scheduleItems);
  if (scheduleEditMode) updateCheckedCount("schedule");
}

function toggleScheduleAddForm() {
  scheduleAddOpen = !scheduleAddOpen;
  const wrap = document.getElementById("schedule-add-wrap");
  if (wrap) wrap.classList.toggle("hidden", !scheduleAddOpen);
  if (scheduleAddOpen) setTimeout(() => document.getElementById("sch-add-date")?.focus(), 80);
}

// ============================================================
// SCHEDULES
// ============================================================
function schedulesRef() { return tripsRef().doc(currentTripId).collection("schedules"); }

function autoCalcForeign() {
  const krw = parseFloat(document.getElementById("exp-add-krw").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(krw) && rate) document.getElementById("exp-add-foreign").value = Math.round(krw / rate * 100) / 100;
}
function autoCalcKrw() {
  const f = parseFloat(document.getElementById("exp-add-foreign").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(f) && rate) document.getElementById("exp-add-krw").value = Math.round(f * rate);
}

// ★ 변경 2: 지출 인라인 수정 폼에서도 환율 자동계산
function autoCalcForeignEdit(id) {
  const krw = parseFloat(document.getElementById("exp-ie-krw-" + id)?.value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(krw) && rate) {
    const el = document.getElementById("exp-ie-foreign-" + id);
    if (el) el.value = Math.round(krw / rate * 100) / 100;
  }
}
function autoCalcKrwEdit(id) {
  const f = parseFloat(document.getElementById("exp-ie-foreign-" + id)?.value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(f) && rate) {
    const el = document.getElementById("exp-ie-krw-" + id);
    if (el) el.value = Math.round(f * rate);
  }
}

async function loadSchedules() {
  const tid = currentTripId;
  const snap = await schedulesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  if (tid !== currentTripId) return; // 다른 여행으로 전환됐으면 무시
  let items = snap.docs.map(d => {
    const data = d.data();
    if (data.mapUrl) data.mapUrl = parseMapInput(data.mapUrl) || data.mapUrl;
    return { id: d.id, ...data };
  });
  items.sort((a,b) => {
    const dd = (a.date||"").localeCompare(b.date||"");
    return dd !== 0 ? dd : (a.time||"").localeCompare(b.time||"");
  });
  scheduleItems = items;
  renderScheduleTable(items); renderTimetable(items);
}

function buildMapBtn(s) {
  if (!s.mapUrl) return "";
  const dataUrl = encodeURIComponent(s.mapUrl);
  const dataLoc = encodeURIComponent(s.location || "");
  return `<button class="map-icon-btn" data-url="${dataUrl}" data-loc="${dataLoc}" onclick="onMapBtnClick(this)" title="지도 열기">${ICON_MAP}</button>`;
}

function onMapBtnClick(btn) {
  const url = decodeURIComponent(btn.dataset.url || "");
  const loc = decodeURIComponent(btn.dataset.loc || "");
  openMapModal(url || null, loc);
}

// ★ 변경 3: 일정 인라인 수정
function renderScheduleTable(items) {
  const tbody = document.getElementById("schedule-tbody");
  const catEl = document.getElementById("sch-add-cat");
  if (catEl && catEl.options.length <= 1) refreshCategorySelects();

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-msg">📅 아래 "추가" 버튼에서 일정을 추가하세요</td></tr>`;
    return;
  }

  const cats = getCategories("schedule");

  tbody.innerHTML = items.map(s => {
    // 인라인 편집 행
    if (s.id === scheduleInlineEditId && !scheduleEditMode) {
      const catOpts = cats.map(c => `<option${c===s.category?" selected":""}>${c}</option>`).join("");
      return `<tr class="inline-edit-row" id="sch-inline-row-${s.id}">
        <td><select id="si-cat-${s.id}" style="min-width:60px"><option value="">분류</option>${catOpts}</select></td>
        <td><input type="date" id="si-date-${s.id}" value="${s.date||""}" style="min-width:90px"/></td>
        <td><input type="time" id="si-time-${s.id}" value="${s.time||""}" style="min-width:70px"/></td>
        <td><input type="text" id="si-loc-${s.id}" value="${escHtml(s.location)}" placeholder="장소"/></td>
        <td><input type="text" id="si-content-${s.id}" value="${escHtml(s.content)}" placeholder="내용" style="min-width:120px"/></td>
        <td><input type="text" id="si-trans-${s.id}" value="${escHtml(s.transportation)}" placeholder="교통편" style="max-width:90px"/></td>
        <td><input type="text" id="si-notes-${s.id}" value="${escHtml(s.notes||"")}" placeholder="비고" style="max-width:110px"/></td>
        <td><input type="text" id="si-mapurl-${s.id}" value="${escHtml(s.mapUrl||"")}" placeholder="지도 링크" style="max-width:110px"/></td>
        <td style="padding:4px;white-space:nowrap">
          <button class="btn btn-ghost btn-xs" onclick="cancelScheduleInlineEdit()" style="font-size:.75rem;padding:3px 7px">취소</button>
          <button class="btn btn-primary btn-xs" onclick="saveScheduleInlineEdit('${s.id}')" style="font-size:.75rem;padding:3px 7px">저장</button>
        </td>
      </tr>`;
    }

    // 일반 표시 행 (일괄수정모드) 또는 클릭 가능한 행
    if (scheduleEditMode) {
      return renderScheduleEditModeRow(s, cats);
    }

    const catBadge = s.category ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")}"> ${s.category}</span>` : "-";
    const mapBtn = buildMapBtn(s);
    const notesDisplay = renderLink(s.notes, "비고");
    const actionCell = `<td class="sch-row-action" style="width:32px;padding:4px;text-align:center">
      <button class="sch-del-btn" onclick="event.stopPropagation();deleteSchedule('${s.id}')" title="삭제">${ICON_TRASH}</button>
    </td>`;
    return `<tr class="clickable-row" onclick="if(!isLocked&&!scheduleEditMode)openScheduleInlineEdit('${s.id}')">
      <td>${catBadge}</td>
      <td style="white-space:nowrap;font-size:0.8rem">${formatDateShort(s.date)}</td>
      <td style="color:var(--text-muted);white-space:nowrap;font-size:0.8rem">${s.time||"-"}</td>
      <td>${escHtml(s.location)||"-"}</td>
      <td style="word-break:break-word">${escHtml(s.content)||"-"}</td>
      <td>${getTransBadge(s.transportation)}</td>
      <td>${notesDisplay}</td>
      <td style="text-align:center">${mapBtn}</td>
      ${actionCell}
    </tr>`;
  }).join("");
}

// ★ 인라인 편집 진입/저장/취소
function openScheduleInlineEdit(id) {
  if (isLocked || scheduleEditMode) return;
  scheduleInlineEditId = id;
  renderScheduleTable(scheduleItems);
  setTimeout(() => {
    document.getElementById("sch-inline-row-" + id)?.scrollIntoView({block:"nearest"});
    document.getElementById("si-content-" + id)?.focus();
  }, 50);
}
function cancelScheduleInlineEdit() {
  scheduleInlineEditId = null; renderScheduleTable(scheduleItems);
}
async function saveScheduleInlineEdit(id) {
  const mapRaw = document.getElementById("si-mapurl-" + id)?.value.trim() || null;
  const updateData = {
    category: document.getElementById("si-cat-" + id)?.value || null,
    date:     document.getElementById("si-date-" + id)?.value || null,
    time:     document.getElementById("si-time-" + id)?.value || null,
    location: document.getElementById("si-loc-" + id)?.value.trim() || null,
    content:  document.getElementById("si-content-" + id)?.value.trim() || null,
    transportation: document.getElementById("si-trans-" + id)?.value.trim() || null,
    notes:    document.getElementById("si-notes-" + id)?.value.trim() || null,
    mapUrl:   mapRaw ? (parseMapInput(mapRaw) || mapRaw) : null,
  };
  await schedulesRef().doc(id).update(updateData);
  const idx = scheduleItems.findIndex(s => s.id === id);
  if (idx !== -1) scheduleItems[idx] = { ...scheduleItems[idx], ...updateData };
  showToast("수정 완료 ✅");
  scheduleInlineEditId = null;
  renderScheduleTable(scheduleItems); renderTimetable(scheduleItems);
}

function renderScheduleEditModeRow(s, cats) {
  const catOptions = cats.map(c => `<option${c===s.category?" selected":""}>${c}</option>`).join("");
  const mapUrl = s.mapUrl || ""; const notesVal = s.notes || "";
  const isChecked = dirtyScheduleIds.has(s.id);
  return `<tr class="em-row" data-id="${s.id}">
    <td><select id="em-cat-${s.id}" style="min-width:60px" onchange="markDirty('schedule','${s.id}')"><option value="">분류</option>${catOptions}</select></td>
    <td><input type="date" id="em-date-${s.id}" value="${s.date||""}" style="min-width:100px" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="time" id="em-time-${s.id}" value="${s.time||""}" style="min-width:70px" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-loc-${s.id}" value="${escHtml(s.location)}" placeholder="장소" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-content-${s.id}" value="${escHtml(s.content)}" placeholder="내용" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-trans-${s.id}" value="${escHtml(s.transportation)}" placeholder="교통편" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-notes-${s.id}" value="${escHtml(notesVal)}" placeholder="비고" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-mapurl-${s.id}" value="${escHtml(mapUrl)}" placeholder="지도 링크 또는 iframe 코드" style="min-width:100px" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td style="text-align:center;padding:4px">
      <input type="checkbox" class="row-check sch-row-check" id="sch-check-${s.id}" data-id="${s.id}" ${isChecked?"checked":""} onchange="onRowCheckChange('schedule')" />
    </td>
  </tr>`;
}

function handleEditKeydown(event, type) {
  if (event.key === "Enter") { event.preventDefault(); saveChecked(type); }
  else if (event.key === "Escape") {
    event.preventDefault();
    if (type === "schedule") toggleScheduleEditMode();
    else if (type === "expense") toggleExpenseEditMode();
    else if (type === "bucket") toggleBucketEditMode();
  }
}

async function saveEditModeRow(id, silent) {
  const cat  = document.getElementById("em-cat-"    + id)?.value || null;
  const date = document.getElementById("em-date-"   + id)?.value || null;
  const time = document.getElementById("em-time-"   + id)?.value || null;
  const loc  = document.getElementById("em-loc-"    + id)?.value.trim() || null;
  const content = document.getElementById("em-content-" + id)?.value.trim() || null;
  const trans   = document.getElementById("em-trans-"   + id)?.value.trim() || null;
  const notes   = document.getElementById("em-notes-"   + id)?.value.trim() || null;
  const mapUrlRaw = document.getElementById("em-mapurl-" + id)?.value.trim() || null;
  const mapUrl    = mapUrlRaw ? (parseMapInput(mapUrlRaw) || mapUrlRaw) : null;
  const updateData = { category: cat, date, time, location: loc, content, transportation: trans, notes, mapUrl };
  await schedulesRef().doc(id).update(updateData);
  const idx = scheduleItems.findIndex(s => s.id === id);
  if (idx !== -1) scheduleItems[idx] = { ...scheduleItems[idx], ...updateData };
  if (!silent) showToast("저장 완료 ✅");
  return true;
}

async function saveScheduleRow() {
  const content = document.getElementById("sch-add-content").value.trim();
  if (!content) { showToast("내용을 입력해주세요"); return; }
  const mapUrlRaw = document.getElementById("sch-add-mapurl").value.trim();
  await schedulesRef().add({
    category: document.getElementById("sch-add-cat").value || null,
    date: document.getElementById("sch-add-date").value || null,
    time: document.getElementById("sch-add-time").value || null,
    location: document.getElementById("sch-add-loc").value.trim() || null,
    content,
    transportation: document.getElementById("sch-add-trans").value.trim() || null,
    notes: document.getElementById("sch-add-notes").value.trim() || null,
    mapUrl: mapUrlRaw ? (parseMapInput(mapUrlRaw) || mapUrlRaw) : null,
  });
  showToast("일정 추가 완료 📅");
  ["sch-add-cat","sch-add-time","sch-add-loc","sch-add-content","sch-add-trans","sch-add-notes","sch-add-mapurl"].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = "";
  });
  loadSchedules();
}

async function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;
  await schedulesRef().doc(id).delete(); showToast("삭제됐어요"); loadSchedules();
}

// ---- Timetable ----
function renderTimetable(items) {
  const wrap = document.getElementById("schedule-timetable-view"); if (!wrap) return;
  if (!items.length) { wrap.innerHTML = `<div class="empty-msg">📅 일정이 없어요</div>`; return; }
  const ttItems = items.filter(i => (i.category || "") !== "이동");
  const dates = [...new Set(ttItems.map(i => i.date || "날짜 미정"))].sort();
  if (!dates.length) { wrap.innerHTML = `<div class="empty-msg">📅 표시할 일정이 없어요 (이동 제외)</div>`; return; }
  const hourNums = ttItems.filter(i => i.time).map(i => parseInt(i.time));
  const minH = hourNums.length ? Math.max(0, Math.min(...hourNums) - 1) : 7;
  const maxH = hourNums.length ? Math.min(24, Math.max(...hourNums) + 1) : 22;
  const slots = [];
  for (let h = minH; h <= maxH; h++) slots.push(h < 10 ? "0" + h + ":00" : h + ":00");
  const itemsForSlot = (date, slotHour) =>
    ttItems.filter(i => (i.date || "날짜 미정") === date && i.time && parseInt(i.time) === slotHour);
  const itemsNoTime = (date) =>
    ttItems.filter(i => (i.date || "날짜 미정") === date && !i.time);
  const startDate = dates.find(d => d !== "날짜 미정") || "";
  const dayLabel = (date) => {
    if (date === "날짜 미정") return { line1: "날짜 미정", line2: "" };
    const parts = date.split("-");
    const mmdd = `${parts[1]}/${parts[2]}`;
    if (startDate && startDate !== "날짜 미정") {
      const diff = Math.round((new Date(date) - new Date(startDate)) / 86400000) + 1;
      return { line1: `${diff}일차`, line2: mmdd };
    }
    return { line1: mmdd, line2: "" };
  };
  let html = `<div class="timetable-grid-wrap"><table class="timetable-grid"><thead><tr>
    <th class="time-col-h">시간</th>`;
  dates.forEach(d => {
    const { line1, line2 } = dayLabel(d);
    html += `<th>${line1}${line2 ? `<br><span style="font-weight:500;font-size:0.72rem;color:var(--text-muted)">${line2}</span>` : ""}</th>`;
  });
  html += `</tr>`;
  const hasNoTime = dates.some(d => itemsNoTime(d).length > 0);
  if (hasNoTime) {
    html += `<tr class="tt-pinned-row"><th class="time-col-h tt-pinned-label">📌</th>`;
    dates.forEach(date => {
      const ni = itemsNoTime(date);
      html += `<th class="tt-pinned-cell">${ni.length
        ? ni.map(s => `<span class="tt-pin-chip">${escHtml(s.location || s.content || "-")}${s.category ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")} tt-badge" style="margin-left:3px">${s.category}</span>` : ""}</span>`).join("")
        : ""}</th>`;
    });
    html += `</tr>`;
  }
  html += `</thead><tbody>`;
  slots.forEach(slot => {
    const slotH = parseInt(slot);
    const rowHasItems = dates.some(d => itemsForSlot(d, slotH).length > 0);
    html += `<tr class="${rowHasItems ? "has-items" : "empty-slot"}">`;
    html += `<td class="time-slot">${slot}</td>`;
    dates.forEach(date => {
      const ti = itemsForSlot(date, slotH);
      html += `<td class="timetable-cell">${ti.map(renderTTItem).join("")}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  wrap.innerHTML = html;
}

function renderTTItem(s) {
  const catBadge = s.category ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")} tt-badge">${s.category}</span>` : "";
  const transBadge = s.transportation ? `<span class="badge badge-trans-other tt-badge">${escHtml(s.transportation)}</span>` : "";
  const label = escHtml(s.location || s.content || "-");
  return `<div class="tt-item"><span class="tt-item-label">${label}</span>${catBadge}${transBadge}</div>`;
}

// ============================================================
// EXPENSES — ★ 변경 2·3: 인라인 수정 + 환율 자동계산
// ============================================================
function expensesRef() { return tripsRef().doc(currentTripId).collection("expenses"); }

function toggleExpenseEditMode() {
  expenseEditMode = !expenseEditMode;
  expenseInlineEditId = null;
  dirtyExpenseIds.clear();
  const btn = document.getElementById("expense-edit-mode-btn");
  const banner = document.getElementById("expense-edit-banner");
  const table = document.getElementById("expense-table");
  const actionCol = document.getElementById("exp-action-col");
  if (btn) btn.classList.toggle("active", expenseEditMode);
  if (banner) banner.classList.toggle("hidden", !expenseEditMode);
  if (table) table.classList.toggle("edit-mode-on", expenseEditMode);
  if (actionCol) {
    actionCol.textContent = expenseEditMode ? "☑" : "";
    actionCol.style.width = expenseEditMode ? "34px" : "0";
    actionCol.style.padding = expenseEditMode ? "8px 4px" : "0";
  }
  if (expenseEditMode) expenseEditId = null;
  renderExpenses(expenseItems);
  if (expenseEditMode) updateCheckedCount("expense");
}

function toggleExpenseAddForm() {
  expenseAddOpen = !expenseAddOpen;
  const wrap = document.getElementById("expense-add-wrap");
  if (wrap) wrap.classList.toggle("hidden", !expenseAddOpen);
  if (expenseAddOpen) setTimeout(() => document.getElementById("exp-add-title")?.focus(), 80);
}

async function loadExpenses() {
  const tid = currentTripId;
  const snap = await expensesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  if (tid !== currentTripId) return; // 다른 여행으로 전환됐으면 무시
  expenseItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  expenseItems.sort((a,b) => (a.date||"").localeCompare(b.date||""));
  renderExpenses(expenseItems);
}

function renderExpenses(items) {
  const tbody = document.getElementById("expense-tbody");
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">💸 아래 "추가" 버튼에서 지출을 기록하세요</td></tr>`;
    updateBudget(0); return;
  }
  const hasForeign = !!(currentTrip?.foreignCurrency);
  const cats = getCategories("expense");

  tbody.innerHTML = items.map(e => {
    // ★ 인라인 편집 행
    if (e.id === expenseInlineEditId && !expenseEditMode) {
      const catOpts = cats.map(c => `<option${c===e.category?" selected":""}>${c}</option>`).join("");
      return `<tr class="inline-edit-row" id="exp-inline-row-${e.id}">
        <td><select id="exp-ie-cat-${e.id}" style="min-width:60px"><option value="">분류</option>${catOpts}</select></td>
        <td><input type="date" id="exp-ie-date-${e.id}" value="${e.date||""}" style="min-width:90px"/></td>
        <td><input type="text" id="exp-ie-title-${e.id}" value="${escHtml(e.title)}" placeholder="제목 *"/></td>
        <td><input type="number" id="exp-ie-krw-${e.id}" value="${e.amountKrw??""}" placeholder="원화"
          oninput="autoCalcForeignEdit('${e.id}')" style="text-align:right;max-width:90px"/></td>
        <td>${hasForeign ? `<input type="number" id="exp-ie-foreign-${e.id}" value="${e.amountForeign??""}" placeholder="외화"
          oninput="autoCalcKrwEdit('${e.id}')" style="text-align:right;max-width:80px"/>` : `<span style="color:var(--text-muted);font-size:.8rem">-</span>`}</td>
        <td style="padding:4px;white-space:nowrap">
          <button class="btn btn-ghost btn-xs" onclick="cancelExpenseInlineEdit()" style="font-size:.75rem;padding:3px 7px">취소</button>
          <button class="btn btn-primary btn-xs" onclick="saveExpenseInlineEdit('${e.id}')" style="font-size:.75rem;padding:3px 7px">저장</button>
        </td>
      </tr>`;
    }

    if (expenseEditMode) return renderExpenseEditModeRow(e, cats);

    const catBadge = e.category ? `<span class="badge badge-${e.category.replace(/\//g,"\\/")}"> ${e.category}</span>` : "-";
    const foreignDisp = hasForeign && e.amountForeign != null
      ? (CURRENCY_SYMBOLS[currentTrip.foreignCurrency] || "") + Number(e.amountForeign).toLocaleString()
      : "-";
    const actionCell = `<td class="exp-row-action" style="width:32px;padding:4px;text-align:center">
      <button class="exp-del-btn" onclick="event.stopPropagation();deleteExpense('${e.id}')" title="삭제">${ICON_TRASH}</button>
    </td>`;
    return `<tr class="clickable-row" onclick="if(!isLocked&&!expenseEditMode)openExpenseInlineEdit('${e.id}')">
      <td>${catBadge}</td>
      <td style="white-space:nowrap;font-size:0.8rem">${formatDateShort(e.date)}</td>
      <td>${escHtml(e.title)}</td>
      <td style="text-align:right;font-weight:600">${e.amountKrw != null ? Number(e.amountKrw).toLocaleString() + "원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${foreignDisp}</td>
      ${actionCell}
    </tr>`;
  }).join("");

  const total = items.reduce((s,e) => s + (e.amountKrw || 0), 0);
  const totalForeign = hasForeign ? items.reduce((s,e) => s + (e.amountForeign || 0), 0) : 0;
  updateBudget(total);
  document.getElementById("total-krw-display").innerHTML = `<strong>${total.toLocaleString()}원</strong>`;
  const tfEl = document.getElementById("total-foreign-display");
  if (hasForeign && tfEl) tfEl.innerHTML = `<strong>${CURRENCY_SYMBOLS[currentTrip.foreignCurrency]||""}${totalForeign.toLocaleString()}</strong>`;
  else if (tfEl) tfEl.innerHTML = "";
  const sd = document.getElementById("expense-summary-display");
  if (sd) sd.textContent = "합계 " + total.toLocaleString() + "원";
}

// ★ 인라인 편집 진입/저장/취소
function openExpenseInlineEdit(id) {
  if (isLocked || expenseEditMode) return;
  expenseInlineEditId = id;
  renderExpenses(expenseItems);
  setTimeout(() => {
    document.getElementById("exp-inline-row-" + id)?.scrollIntoView({block:"nearest"});
    document.getElementById("exp-ie-title-" + id)?.focus();
  }, 50);
}
function cancelExpenseInlineEdit() {
  expenseInlineEditId = null; renderExpenses(expenseItems);
}
async function saveExpenseInlineEdit(id) {
  const title = document.getElementById("exp-ie-title-" + id)?.value.trim();
  if (!title) { showToast("제목을 입력해주세요"); return; }
  const updateData = {
    category: document.getElementById("exp-ie-cat-" + id)?.value || null,
    date:     document.getElementById("exp-ie-date-" + id)?.value || null,
    title,
    amountKrw:     document.getElementById("exp-ie-krw-" + id)?.value ? parseInt(document.getElementById("exp-ie-krw-" + id).value) : null,
    amountForeign: document.getElementById("exp-ie-foreign-" + id)?.value ? parseFloat(document.getElementById("exp-ie-foreign-" + id).value) : null,
  };
  await expensesRef().doc(id).update(updateData);
  const idx = expenseItems.findIndex(e => e.id === id);
  if (idx !== -1) expenseItems[idx] = { ...expenseItems[idx], ...updateData };
  showToast("수정 완료 ✅");
  expenseInlineEditId = null; renderExpenses(expenseItems);
}

function renderExpenseEditModeRow(e, cats) {
  const catOptions = cats.map(c => `<option${c===e.category?" selected":""}>${c}</option>`).join("");
  const hasForeign = !!(currentTrip?.foreignCurrency);
  const isChecked = dirtyExpenseIds.has(e.id);
  return `<tr class="em-row" data-id="${e.id}">
    <td><select id="em-exp-cat-${e.id}" style="min-width:60px" onchange="markDirty('expense','${e.id}')"><option value="">분류</option>${catOptions}</select></td>
    <td><input type="date" id="em-exp-date-${e.id}" value="${e.date||""}" style="min-width:100px" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td><input type="text" id="em-exp-title-${e.id}" value="${escHtml(e.title)}" placeholder="제목 *" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td><input type="number" id="em-exp-krw-${e.id}" value="${e.amountKrw??""}" placeholder="원화" style="text-align:right" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td>${hasForeign ? `<input type="number" id="em-exp-foreign-${e.id}" value="${e.amountForeign??""}" placeholder="외화" style="text-align:right" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" />` : `<span style="color:var(--text-muted);font-size:0.8rem">-</span>`}</td>
    <td style="text-align:center;padding:4px">
      <input type="checkbox" class="row-check exp-row-check" id="exp-check-${e.id}" data-id="${e.id}" ${isChecked?"checked":""} onchange="onRowCheckChange('expense')" />
    </td>
  </tr>`;
}

async function saveExpenseEditModeRow(id, silent) {
  const title = document.getElementById("em-exp-title-" + id)?.value.trim();
  if (!title) return false;
  const updateData = {
    category:     document.getElementById("em-exp-cat-"  + id)?.value || null,
    date:         document.getElementById("em-exp-date-" + id)?.value || null,
    title,
    amountKrw:     document.getElementById("em-exp-krw-"     + id)?.value ? parseInt(document.getElementById("em-exp-krw-" + id).value) : null,
    amountForeign: document.getElementById("em-exp-foreign-" + id)?.value ? parseFloat(document.getElementById("em-exp-foreign-" + id).value) : null,
  };
  await expensesRef().doc(id).update(updateData);
  const idx = expenseItems.findIndex(e => e.id === id);
  if (idx !== -1) expenseItems[idx] = { ...expenseItems[idx], ...updateData };
  if (!silent) showToast("저장 완료 ✅");
  return true;
}

async function saveExpenseRow() {
  const title = document.getElementById("exp-add-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요"); return; }
  await expensesRef().add({
    category: document.getElementById("exp-add-cat").value || null,
    date: document.getElementById("exp-add-date").value || null,
    title,
    amountKrw: document.getElementById("exp-add-krw").value ? parseInt(document.getElementById("exp-add-krw").value) : null,
    amountForeign: document.getElementById("exp-add-foreign").value ? parseFloat(document.getElementById("exp-add-foreign").value) : null,
  });
  showToast("지출 추가 완료 💰");
  ["exp-add-cat","exp-add-title","exp-add-krw","exp-add-foreign"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
  loadExpenses();
}

async function deleteExpense(id) {
  if (!confirm("이 지출을 삭제할까요?")) return;
  await expensesRef().doc(id).delete(); showToast("삭제됐어요"); loadExpenses();
}

function updateBudget(total) {
  const el = document.getElementById("trip-budget-display");
  if (el) el.textContent = total.toLocaleString() + "원";
}

// ============================================================
// RESERVATIONS
// ============================================================
function reservationsRef() { return tripsRef().doc(currentTripId).collection("reservations"); }

async function loadReservations() {
  const tid = currentTripId;
  const snap = await reservationsRef().orderBy("date").get().catch(() => ({ docs: [] }));
  if (tid !== currentTripId) return; // 다른 여행으로 전환됐으면 무시
  currentResItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderReservations(currentResItems);
}

function openResForm(type) {
  const f = document.getElementById("res-form-" + type); if (!f) return;
  const wasHidden = f.classList.contains("hidden");
  ["항공","숙소","기타"].forEach(t => { document.getElementById("res-form-" + t)?.classList.add("hidden"); });
  if (wasHidden) {
    f.classList.remove("hidden");
    f.innerHTML = buildResForm(type);
    f.querySelector("input")?.focus();
  }
}

function buildResForm(type) {
  const base = `
    <div class="res-add-form-inner">
      <div class="res-form-title">${type} 예약 추가</div>`;
  const footer = `
      <div class="res-form-row">
        <textarea id="ef-notes-new" placeholder="메모"></textarea>
      </div>
      <div class="res-form-row">
        <input type="text" id="ef-link-new" placeholder="링크 (지도/예약 URL)" />
      </div>
      <div class="res-form-actions">
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.res-add-form').classList.add('hidden')">취소</button>
        <button class="btn btn-primary btn-sm" onclick="addReservation('${type}')">추가</button>
      </div>
    </div>`;
  if (type === "항공") return base + `
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-from-new" placeholder="출발지" />
        <input type="text" id="ef-to-new" placeholder="도착지" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="datetime-local" id="ef-depart-new" />
        <input type="datetime-local" id="ef-arrive-new" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-flight-new" placeholder="항공편 번호" />
        <input type="text" id="ef-number-new" placeholder="예약 번호" />
      </div>` + footer;
  if (type === "숙소") return base + `
      <div class="res-form-row">
        <input type="text" id="ef-title-new" placeholder="숙소명 *" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="datetime-local" id="ef-checkin-new" />
        <input type="datetime-local" id="ef-checkout-new" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-phone-new" placeholder="전화번호" />
        <input type="text" id="ef-number-new" placeholder="예약 번호" />
      </div>` + footer;
  return base + `
      <div class="res-form-row">
        <input type="text" id="ef-title-new" placeholder="예약명 *" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-subcat-new" placeholder="유형 (투어·입장권 등)" />
        <input type="date" id="ef-date-new" />
      </div>
      <div class="res-form-row">
        <input type="text" id="ef-number-new" placeholder="예약 번호" />
      </div>` + footer;
}

async function addReservation(type) {
  const rawLink = document.getElementById("ef-link-new")?.value.trim() || "";
  let data = {
    type,
    date: null,
    notes: document.getElementById("ef-notes-new")?.value.trim() || null,
    link: parseMapInput(rawLink) || (rawLink || null),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (type === "항공") {
    data.from = document.getElementById("ef-from-new")?.value.trim() || null;
    data.to   = document.getElementById("ef-to-new")?.value.trim() || null;
    data.depart  = document.getElementById("ef-depart-new")?.value || null;
    data.arrive  = document.getElementById("ef-arrive-new")?.value || null;
    data.flight  = document.getElementById("ef-flight-new")?.value.trim() || null;
    data.reservationNumber = document.getElementById("ef-number-new")?.value.trim() || null;
    data.title = [data.from, data.to].filter(Boolean).join(" → ") || "항공";
    data.date  = data.depart ? data.depart.split("T")[0] : null;
    if (!data.from && !data.to) { showToast("출발지 또는 도착지를 입력해주세요"); return; }
  } else if (type === "숙소") {
    data.title = document.getElementById("ef-title-new")?.value.trim();
    if (!data.title) { showToast("숙소명을 입력해주세요"); return; }
    data.checkin  = document.getElementById("ef-checkin-new")?.value || null;
    data.checkout = document.getElementById("ef-checkout-new")?.value || null;
    data.phone    = document.getElementById("ef-phone-new")?.value.trim() || null;
    data.reservationNumber = document.getElementById("ef-number-new")?.value.trim() || null;
    data.date = data.checkin ? data.checkin.split("T")[0] : null;
  } else {
    data.title = document.getElementById("ef-title-new")?.value.trim();
    if (!data.title) { showToast("예약명을 입력해주세요"); return; }
    data.subCategory = document.getElementById("ef-subcat-new")?.value.trim() || null;
    data.date = document.getElementById("ef-date-new")?.value || null;
    data.reservationNumber = document.getElementById("ef-number-new")?.value.trim() || null;
  }
  await reservationsRef().add(data);
  showToast(type + " 예약 추가 완료 ✅");
  document.getElementById("res-form-" + type)?.classList.add("hidden");
  loadReservations();
}

function renderReservations(items) {
  ["항공","숙소","기타"].forEach(type => {
    const el = document.getElementById("res-list-" + type); if (!el) return;
    const typeItems = items.filter(i => i.type === type);
    if (!typeItems.length) {
      el.innerHTML = `<div class="empty-msg" style="padding:14px 0;font-size:0.8rem">${type} 예약 없음</div>`; return;
    }
    el.innerHTML = typeItems.map(r => {
      if (r.id === resEditItemId) {
        return `<div class="res-edit-form-wrap">${buildResEditForm(r, type)}</div>`;
      }
      const textNotes = r.notes ? `<p>${escHtml(r.notes)}</p>` : "";
      const linkBtn = r.link ? `<button class="res-link-btn" onclick="openResLinkModal('${encodeURIComponent(r.link)}')" title="링크 보기">${ICON_LINK}</button>` : "";
      const hoverTrash = `<button class="res-hover-trash" onclick="event.stopPropagation();deleteReservation('${r.id}')" title="삭제">${ICON_TRASH}</button>`;
      const clickHandler = `onclick="if(!isLocked)editReservation('${r.id}','${type}')" style="cursor:pointer"`;
      return `<div class="res-item" ${clickHandler}>
        ${linkBtn}
        ${hoverTrash}
        <div class="res-info">
          <h4>${escHtml(r.title) || "-"}</h4>
          ${type==="항공" ? `<p>${[r.depart?.replace("T"," "), r.arrive?.replace("T"," "), r.flight, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${type==="숙소" ? `<p>${[r.checkin?.replace("T"," "), r.checkout?.replace("T"," "), r.phone, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${type==="기타" ? `<p>${[r.date, r.subCategory, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${textNotes}
        </div>
      </div>`;
    }).join("");
  });
  if (resEditMode) updateCheckedCount("res");
}

function buildResEditForm(r, type) {
  const notesVal = escHtml(r.notes || "");
  const linkVal  = escHtml(r.link  || "");
  let fields = "";
  if (type === "항공") {
    fields = `
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-from" value="${escHtml(r.from||"")}" placeholder="출발지" />
        <input type="text" id="ef-to" value="${escHtml(r.to||"")}" placeholder="도착지" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="datetime-local" id="ef-depart" value="${r.depart||""}" />
        <input type="datetime-local" id="ef-arrive" value="${r.arrive||""}" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-flight" value="${escHtml(r.flight||"")}" placeholder="항공편 번호" />
        <input type="text" id="ef-number" value="${escHtml(r.reservationNumber||"")}" placeholder="예약 번호" />
      </div>`;
  } else if (type === "숙소") {
    fields = `
      <div class="res-form-row"><input type="text" id="ef-title" value="${escHtml(r.title||"")}" placeholder="숙소명 *" /></div>
      <div class="res-form-row res-form-2col">
        <input type="datetime-local" id="ef-checkin" value="${r.checkin||""}" />
        <input type="datetime-local" id="ef-checkout" value="${r.checkout||""}" />
      </div>
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-phone" value="${escHtml(r.phone||"")}" placeholder="전화번호" />
        <input type="text" id="ef-number" value="${escHtml(r.reservationNumber||"")}" placeholder="예약 번호" />
      </div>`;
  } else {
    fields = `
      <div class="res-form-row"><input type="text" id="ef-title" value="${escHtml(r.title||"")}" placeholder="예약명 *" /></div>
      <div class="res-form-row res-form-2col">
        <input type="text" id="ef-subcat" value="${escHtml(r.subCategory||"")}" placeholder="유형" />
        <input type="date" id="ef-date" value="${r.date||""}" />
      </div>
      <div class="res-form-row"><input type="text" id="ef-number" value="${escHtml(r.reservationNumber||"")}" placeholder="예약 번호" /></div>`;
  }
  return `<div class="res-add-form-inner">
    <div class="res-form-title">${type} 수정</div>
    ${fields}
    <div class="res-form-row"><textarea id="ef-notes" placeholder="메모">${notesVal}</textarea></div>
    <div class="res-form-row"><input type="text" id="ef-link" value="${linkVal}" placeholder="링크" /></div>
    <div class="res-form-actions">
      <button class="btn btn-ghost btn-sm" onclick="cancelResEdit()">취소</button>
      <button class="btn btn-primary btn-sm" onclick="updateReservation('${r.id}','${type}')">저장</button>
    </div>
  </div>`;
}

function editReservation(id, type) {
  if (resEditItemId === id) { resEditItemId = null; loadReservations(); return; }
  resEditItemId = id;
  ["항공","숙소","기타"].forEach(t => document.getElementById("res-form-" + t)?.classList.add("hidden"));
  loadReservations();
  setTimeout(() => { const el = document.querySelector(".res-edit-form-wrap input"); if (el) el.focus(); }, 80);
}
function cancelResEdit() { resEditItemId = null; loadReservations(); }

async function updateReservation(id, type) {
  const rawLink = document.getElementById("ef-link")?.value.trim() || "";
  let data = { notes: document.getElementById("ef-notes")?.value.trim() || null, link: parseMapInput(rawLink) || (rawLink || null) };
  if (type === "항공") {
    data.from = document.getElementById("ef-from")?.value.trim() || null;
    data.to   = document.getElementById("ef-to")?.value.trim() || null;
    data.depart  = document.getElementById("ef-depart")?.value || null;
    data.arrive  = document.getElementById("ef-arrive")?.value || null;
    data.flight  = document.getElementById("ef-flight")?.value.trim() || null;
    data.reservationNumber = document.getElementById("ef-number")?.value.trim() || null;
    data.title = [data.from, data.to].filter(Boolean).join(" → ") || "항공";
    data.date  = data.depart ? data.depart.split("T")[0] : null;
  } else if (type === "숙소") {
    data.title = document.getElementById("ef-title")?.value.trim();
    if (!data.title) { showToast("숙소명을 입력해주세요"); return; }
    data.checkin  = document.getElementById("ef-checkin")?.value || null;
    data.checkout = document.getElementById("ef-checkout")?.value || null;
    data.phone    = document.getElementById("ef-phone")?.value.trim() || null;
    data.reservationNumber = document.getElementById("ef-number")?.value.trim() || null;
    data.date = data.checkin ? data.checkin.split("T")[0] : null;
  } else {
    data.title = document.getElementById("ef-title")?.value.trim();
    if (!data.title) { showToast("예약명을 입력해주세요"); return; }
    data.subCategory = document.getElementById("ef-subcat")?.value.trim() || null;
    data.date = document.getElementById("ef-date")?.value || null;
    data.reservationNumber = document.getElementById("ef-number")?.value.trim() || null;
  }
  await reservationsRef().doc(id).update(data);
  showToast("예약 수정 완료 ✅");
  resEditItemId = null; loadReservations();
}

async function deleteReservation(id) {
  if (!confirm("이 예약을 삭제할까요?")) return;
  await reservationsRef().doc(id).delete(); showToast("삭제됐어요"); loadReservations();
}

// ============================================================
// BUCKET REF
// ============================================================
function bucketRef() { return db.collection("users").doc(currentUser.uid).collection("bucketItems"); }

// ============================================================
// 가고싶은 곳 (여행 내) — ★ 변경 3: 인라인 수정
// ============================================================
function onTripBucketFilterChange() {
  const val = document.getElementById("trip-bucket-region")?.value || "";
  if (currentTripId) localStorage.setItem("trip_bucket_region_" + currentTripId, val);
  renderTripBucket(allBucketItems);
}

async function loadTripBucketItems() {
  if (!currentUser) return;
  const tid = currentTripId;
  const saved = currentTripId ? (localStorage.getItem("trip_bucket_region_" + currentTripId) || "") : "";
  const inp = document.getElementById("trip-bucket-region");
  if (inp) inp.value = saved;
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  if (tid !== currentTripId) return; // 다른 여행으로 전환됐으면 무시
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  allBucketItems = items;
  renderTripBucket(items);
}

function renderTripBucket(items) {
  const regionFilter = (document.getElementById("trip-bucket-region")?.value || "").trim().toLowerCase();
  const board = document.getElementById("trip-bucket-board"); if (!board) return;
  let filtered = items || allBucketItems;
  if (regionFilter) filtered = filtered.filter(i =>
    (i.region||"").toLowerCase().includes(regionFilter) ||
    (i.country||"").toLowerCase().includes(regionFilter));

  if (!filtered.length) {
    board.innerHTML = `<div class="empty-msg" style="grid-column:1/-1;padding:28px">⭐ 아직 없어요. + 추가 버튼으로 시작해보세요!</div>`;
    return;
  }

  board.innerHTML = BUCKET_CATEGORIES.map(cat => {
    const catItems = filtered.filter(i => (i.category || "기타") === cat);
    if (catItems.length === 0) return "";
    return `
    <div class="wish-cat-card">
      <div class="wish-cat-header">
        <span>${CAT_EMOJI[cat]||"📌"}</span>
        <span class="wish-cat-label">${cat}</span>
        <span class="wish-cat-count">${catItems.length}곳</span>
      </div>
      <div class="wish-items">
        ${catItems.map(item => {
          // ★ 인라인 편집 행
          if (item.id === wishInlineEditId) {
            const cats = getCategories("bucket");
            const catOpts = cats.map(c => `<option${c===item.category?" selected":""}>${c}</option>`).join("");
            return `
            <div class="wish-item-inline-edit" id="wish-inline-${item.id}">
              <input type="text" id="wish-ie-place-${item.id}" value="${escHtml(item.placeName)}" placeholder="장소명 *" class="wish-ie-input"/>
              <select id="wish-ie-cat-${item.id}" class="wish-ie-select"><option value="">유형</option>${catOpts}</select>
              <input type="text" id="wish-ie-region-${item.id}" value="${escHtml(item.region||"")}" placeholder="지역" class="wish-ie-input"/>
              <input type="text" id="wish-ie-notes-${item.id}" value="${escHtml(item.notes||"")}" placeholder="비고" class="wish-ie-input"/>
              <div class="wish-ie-actions">
                <label class="wish-ie-visited"><input type="checkbox" id="wish-ie-visited-${item.id}" ${item.visited?"checked":""}/> 방문완료</label>
                <button class="btn btn-ghost btn-xs" onclick="cancelWishInlineEdit()">취소</button>
                <button class="btn btn-primary btn-xs" onclick="saveWishInlineEdit('${item.id}')">저장</button>
              </div>
            </div>`;
          }
          const regionBadge = item.region ? `<span class="wish-badge">${escHtml(item.region)}</span>` : "";
          return `
          <div class="wish-item ${item.visited?"visited":""}" style="cursor:pointer" onclick="if(!isLocked)openWishInlineEdit('${item.id}')">
            <button class="visit-toggle ${item.visited?"done":""}" onclick="event.stopPropagation();toggleVisited('${item.id}',${item.visited})">${item.visited?"✓":""}</button>
            <span class="wish-item-name ${item.visited?"done":""}">${escHtml(item.placeName)}</span>
            <span class="wish-item-badges">${regionBadge}</span>
            <div class="wish-item-actions">
              <button class="btn btn-ghost btn-icon" style="width:22px;height:22px;padding:0;color:var(--text-muted)" onclick="event.stopPropagation();deleteBucketItem('${item.id}')" title="삭제">${ICON_TRASH}</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).filter(Boolean).join("");
}

// ★ 가고싶은 곳 인라인 편집
function openWishInlineEdit(id) {
  if (isLocked) return;
  wishInlineEditId = id;
  renderTripBucket(allBucketItems);
  setTimeout(() => document.getElementById("wish-ie-place-" + id)?.focus(), 50);
}
function cancelWishInlineEdit() {
  wishInlineEditId = null; renderTripBucket(allBucketItems);
}
async function saveWishInlineEdit(id) {
  const placeName = document.getElementById("wish-ie-place-" + id)?.value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요"); return; }
  const updateData = {
    placeName,
    category: document.getElementById("wish-ie-cat-" + id)?.value || "기타",
    region:   document.getElementById("wish-ie-region-" + id)?.value.trim() || null,
    notes:    document.getElementById("wish-ie-notes-" + id)?.value.trim() || null,
    visited:  document.getElementById("wish-ie-visited-" + id)?.checked || false,
  };
  await bucketRef().doc(id).update(updateData);
  showToast("수정 완료 ✅");
  wishInlineEditId = null; reloadBucketAll();
}

function openTripBucketModal(editId) {
  tripBucketEditId = editId || null;
  const regionFilter = (document.getElementById("trip-bucket-region")?.value || "").trim();
  if (editId) {
    const item = allBucketItems.find(i => i.id === editId);
    if (item) {
      document.getElementById("bk-place").value = item.placeName || "";
      document.getElementById("bk-country").value = item.country || "";
      document.getElementById("bk-region").value = item.region || "";
      document.getElementById("bk-notes").value = item.notes || "";
      document.getElementById("bk-season").value = item.season || "";
      document.getElementById("bk-visited").checked = !!item.visited;
    }
  } else {
    ["bk-place","bk-country","bk-notes"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
    document.getElementById("bk-season").value = "";
    document.getElementById("bk-visited").checked = false;
    document.getElementById("bk-region").value = regionFilter || "";
  }
  const saveBtn = document.getElementById("bk-save-btn");
  if (saveBtn) saveBtn.textContent = editId ? "수정하기" : "추가하기";
  refreshCategorySelects();
  openModal("modal-bucket-trip");
  setTimeout(() => document.getElementById("bk-place").focus(), 80);
}

async function saveTripBucketItem() {
  const placeName = document.getElementById("bk-place").value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요 📍"); return; }
  const data = {
    placeName,
    category: document.getElementById("bk-category").value || "기타",
    season:   document.getElementById("bk-season").value || null,
    country:  document.getElementById("bk-country").value.trim() || null,
    region:   document.getElementById("bk-region").value.trim() || null,
    notes:    document.getElementById("bk-notes").value.trim() || null,
    visited:  document.getElementById("bk-visited").checked,
  };
  if (tripBucketEditId) {
    await bucketRef().doc(tripBucketEditId).update(data); showToast("수정 완료 ✅");
  } else {
    await bucketRef().add(data); showToast("추가 완료 ⭐ (버킷플레이스에도 반영됩니다)");
  }
  closeModal("modal-bucket-trip"); reloadBucketAll();
}

async function toggleVisited(id, current) {
  await bucketRef().doc(id).update({ visited: !current }); reloadBucketAll();
}

async function deleteBucketItem(id) {
  if (!confirm("이 장소를 삭제할까요?")) return;
  await bucketRef().doc(id).delete(); showToast("삭제됐어요"); reloadBucketAll();
}

async function reloadBucketAll() {
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  allBucketItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTripBucket(allBucketItems); renderBucketList();
}

// ============================================================
// 버킷플레이스 (메인 리스트) — ★ 변경 3·5: 인라인 수정 + 정렬 고정
// ============================================================
async function loadAllBucketItems() {
  if (!currentUser) return;
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  allBucketItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderBucketList();
}

function setBucketRegionTab(tab, el) {
  bucketRegionTab = tab;
  document.querySelectorAll(".region-tab").forEach(b => b.classList.remove("active"));
  if (el) el.classList.add("active");
  renderBucketList();
}

function toggleBucketEditMode() {
  bucketEditMode = !bucketEditMode;
  bucketInlineEditId = null;
  dirtyBucketIds.clear();
  const btn = document.getElementById("bucket-edit-mode-btn");
  const banner = document.getElementById("bucket-edit-banner");
  const actionCol = document.getElementById("bucket-action-col");
  if (btn) btn.classList.toggle("active", bucketEditMode);
  if (banner) banner.classList.toggle("hidden", !bucketEditMode);
  if (actionCol) {
    actionCol.textContent = bucketEditMode ? "☑" : "";
    actionCol.style.width = bucketEditMode ? "34px" : "0";
    actionCol.style.padding = bucketEditMode ? "8px 4px" : "0";
  }
  if (bucketEditMode) bucketEditId = null;
  renderBucketList();
  if (bucketEditMode) updateCheckedCount("bucket");
}

function openBucketAddModal(editId) {
  bucketAddModalEditId = editId || null;
  if (editId) {
    const item = allBucketItems.find(i => i.id === editId);
    if (item) {
      document.getElementById("bam-place").value = item.placeName || "";
      document.getElementById("bam-country").value = item.country || "";
      document.getElementById("bam-region").value = item.region || "";
      document.getElementById("bam-notes").value = item.notes || "";
      document.getElementById("bam-season").value = item.season || "";
      document.getElementById("bam-visited").checked = !!item.visited;
    }
  } else {
    ["bam-place","bam-country","bam-region","bam-notes"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
    document.getElementById("bam-season").value = "";
    document.getElementById("bam-visited").checked = false;
  }
  const titleEl = document.getElementById("bucket-add-modal-title");
  const saveBtn = document.getElementById("bam-save-btn");
  if (titleEl) titleEl.textContent = editId ? "⭐ 장소 수정" : "⭐ 장소 추가";
  if (saveBtn) saveBtn.textContent = editId ? "수정하기" : "추가하기";
  refreshCategorySelects();
  openModal("modal-bucket-add");
  setTimeout(() => document.getElementById("bam-place")?.focus(), 80);
}

async function saveBucketAddModal() {
  const placeName = document.getElementById("bam-place").value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요 📍"); return; }
  const data = {
    placeName,
    category: document.getElementById("bam-type").value || "기타",
    season:   document.getElementById("bam-season").value || null,
    country:  document.getElementById("bam-country").value.trim() || null,
    region:   document.getElementById("bam-region").value.trim() || null,
    notes:    document.getElementById("bam-notes").value.trim() || null,
    visited:  document.getElementById("bam-visited").checked,
  };
  if (bucketAddModalEditId) {
    await bucketRef().doc(bucketAddModalEditId).update(data); showToast("수정 완료 ✅");
  } else {
    await bucketRef().add(data); showToast("추가 완료 ⭐");
  }
  closeModal("modal-bucket-add"); reloadBucketAll();
}

// ---- 버킷 리스트 정렬/필터 ----
function toggleColMenu(col, btn) {
  if (activeColMenu && activeColMenu !== col) {
    document.getElementById("col-dd-" + activeColMenu)?.classList.remove("open");
  }
  const dd = document.getElementById("col-dd-" + col); if (!dd) return;
  const isOpen = dd.classList.toggle("open");
  activeColMenu = isOpen ? col : null;
  if (isOpen) {
    dd.innerHTML = buildColMenu(col);
    const inp = dd.querySelector("input");
    if (inp) inp.focus();
  }
}

function buildColMenu(col) {
  const curFilter = bucketColFilters[col] || "";
  return `
    <button class="col-dd-btn" onclick="sortBucketBy('${col}','asc')">오름차순 ↑</button>
    <button class="col-dd-btn" onclick="sortBucketBy('${col}','desc')">내림차순 ↓</button>
    <button class="col-dd-btn" onclick="clearBucketSort()">정렬 해제</button>
    <div class="col-dd-sep"></div>
    <div class="col-dd-filter">
      <input type="text" placeholder="필터..." value="${escHtml(curFilter)}" oninput="setBucketColFilter('${col}',this.value)" />
    </div>
    <button class="col-dd-btn" onclick="clearBucketColFilter('${col}')">필터 해제</button>`;
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".col-sortable") && activeColMenu) {
    document.getElementById("col-dd-" + activeColMenu)?.classList.remove("open");
    activeColMenu = null;
  }
});

// ★ 변경 5: 버킷 정렬 상태를 localStorage에 저장
function sortBucketBy(col, dir) {
  bucketSortCol = col; bucketSortDir = dir;
  localStorage.setItem("bucketSortCol", col);
  localStorage.setItem("bucketSortDir", dir);
  renderBucketList(); updateBucketSortHeaders();
  document.getElementById("col-dd-" + col)?.classList.remove("open");
  activeColMenu = null;
}
function clearBucketSort() {
  bucketSortCol = ""; bucketSortDir = "asc";
  localStorage.removeItem("bucketSortCol");
  localStorage.removeItem("bucketSortDir");
  renderBucketList(); updateBucketSortHeaders();
}
function setBucketColFilter(col, val) { bucketColFilters[col] = val; renderBucketList(); }
function clearBucketColFilter(col) {
  delete bucketColFilters[col]; renderBucketList();
  document.getElementById("col-dd-" + col)?.classList.remove("open");
  activeColMenu = null;
}

// ★ 변경 5: 버킷 정렬 상태 복원
function loadBucketSortState() {
  const savedCol = localStorage.getItem("bucketSortCol");
  const savedDir = localStorage.getItem("bucketSortDir");
  if (savedCol) { bucketSortCol = savedCol; bucketSortDir = savedDir || "asc"; }
}

function updateBucketSortHeaders() {
  document.querySelectorAll(".bucket-list-table th.col-sortable").forEach(th => {
    const col = th.dataset.col;
    th.classList.toggle("col-active-sort", col === bucketSortCol);
  });
}

function renderBucketList() {
  const tbody = document.getElementById("bucket-list-tbody"); if (!tbody) return;
  let items = [...allBucketItems];

  if (bucketRegionTab === "domestic") {
    items = items.filter(i => !i.country || ["한국","국내"].includes(i.country));
  } else if (bucketRegionTab === "overseas") {
    items = items.filter(i => i.country && !["한국","국내"].includes(i.country));
  }

  Object.entries(bucketColFilters).forEach(([col, val]) => {
    if (!val) return;
    const v = val.toLowerCase();
    items = items.filter(i => (String(i[col]||"")).toLowerCase().includes(v));
  });

  if (bucketSortCol) {
    items.sort((a,b) => {
      const av = String(a[bucketSortCol]||""); const bv = String(b[bucketSortCol]||"");
      return bucketSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">⭐ 아직 가고싶은 곳이 없어요</td></tr>`; return;
  }

  const cats = getCategories("bucket");

  tbody.innerHTML = items.map(i => {
    // ★ 인라인 편집 행 (버킷)
    if (i.id === bucketInlineEditId && !bucketEditMode) {
      const catOpts = cats.map(c => `<option${c===i.category?" selected":""}>${c}</option>`).join("");
      return `<tr class="inline-edit-row" id="bkt-inline-row-${i.id}">
        <td style="text-align:center"><input type="checkbox" ${i.visited?"checked":""} id="bkt-ie-visited-${i.id}" style="width:16px;height:16px;accent-color:var(--pd)"/></td>
        <td><select id="bkt-ie-cat-${i.id}" style="min-width:60px"><option value="">유형</option>${catOpts}</select></td>
        <td><input type="text" id="bkt-ie-country-${i.id}" value="${escHtml(i.country)}" placeholder="나라"/></td>
        <td><input type="text" id="bkt-ie-region-${i.id}" value="${escHtml(i.region)}" placeholder="지역"/></td>
        <td><input type="text" id="bkt-ie-place-${i.id}" value="${escHtml(i.placeName)}" placeholder="장소명 *" style="font-weight:600"/></td>
        <td><select id="bkt-ie-season-${i.id}" style="min-width:60px">
          <option value="">-</option>
          ${["봄","여름","가을","겨울","연중"].map(s=>`<option${s===i.season?" selected":""}>${s}</option>`).join("")}
        </select></td>
        <td><input type="text" id="bkt-ie-notes-${i.id}" value="${escHtml(i.notes)}" placeholder="비고"/></td>
        <td style="padding:4px;white-space:nowrap">
          <button class="btn btn-ghost btn-xs" onclick="cancelBucketInlineEdit()" style="font-size:.75rem;padding:3px 7px">취소</button>
          <button class="btn btn-primary btn-xs" onclick="saveBucketInlineEdit('${i.id}')" style="font-size:.75rem;padding:3px 7px">저장</button>
        </td>
      </tr>`;
    }

    if (bucketEditMode) return renderBucketEditModeRow(i, cats);

    let visitCell = `<td style="text-align:center"><input type="checkbox" ${i.visited?"checked":""} onclick="event.stopPropagation();toggleVisited('${i.id}',${i.visited})" style="width:16px;height:16px;accent-color:var(--pd);cursor:pointer;display:block;margin:0 auto" title="방문 완료 체크" /></td>`;
    return `<tr class="clickable-row ${i.visited?"done-row":""}" onclick="if(!isLocked&&!bucketEditMode)openBucketInlineEdit('${i.id}')">
      ${visitCell}
      <td>${i.category ? `<span class="badge badge-${i.category}">${CAT_EMOJI[i.category]||"📌"} ${i.category}</span>` : "-"}</td>
      <td>${escHtml(i.country)||"-"}</td>
      <td>${escHtml(i.region)||"-"}</td>
      <td style="font-weight:600">${escHtml(i.placeName)}</td>
      <td>${escHtml(i.season)||"-"}</td>
      <td style="color:var(--text-muted)">${escHtml(i.notes)||"-"}</td>
      <td class="bkt-row-action" style="width:32px;padding:4px;text-align:center">
        <button class="bkt-del-btn" onclick="event.stopPropagation();deleteBucketItem('${i.id}')" title="삭제">${ICON_TRASH}</button>
      </td>
    </tr>`;
  }).join("");
}

// ★ 버킷 인라인 편집
function openBucketInlineEdit(id) {
  if (isLocked || bucketEditMode) return;
  bucketInlineEditId = id;
  renderBucketList();
  setTimeout(() => {
    document.getElementById("bkt-inline-row-" + id)?.scrollIntoView({block:"nearest"});
    document.getElementById("bkt-ie-place-" + id)?.focus();
  }, 50);
}
function cancelBucketInlineEdit() {
  bucketInlineEditId = null; renderBucketList();
}
async function saveBucketInlineEdit(id) {
  const placeName = document.getElementById("bkt-ie-place-" + id)?.value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요"); return; }
  const updateData = {
    placeName,
    category: document.getElementById("bkt-ie-cat-" + id)?.value || null,
    country:  document.getElementById("bkt-ie-country-" + id)?.value.trim() || null,
    region:   document.getElementById("bkt-ie-region-" + id)?.value.trim() || null,
    season:   document.getElementById("bkt-ie-season-" + id)?.value || null,
    notes:    document.getElementById("bkt-ie-notes-" + id)?.value.trim() || null,
    visited:  document.getElementById("bkt-ie-visited-" + id)?.checked || false,
  };
  await bucketRef().doc(id).update(updateData);
  const idx = allBucketItems.findIndex(i => i.id === id);
  if (idx !== -1) allBucketItems[idx] = { ...allBucketItems[idx], ...updateData };
  showToast("수정 완료 ✅");
  bucketInlineEditId = null; renderBucketList(); renderTripBucket(allBucketItems);
}

function renderBucketEditModeRow(i, cats) {
  const catOptions = cats.map(c => `<option${c===i.category?" selected":""}>${c}</option>`).join("");
  const isChecked = dirtyBucketIds.has(i.id);
  return `<tr class="em-row" data-id="${i.id}">
    <td><input type="checkbox" class="row-check bkt-row-check" id="bkt-check-${i.id}" data-id="${i.id}" ${isChecked?"checked":""} onchange="onRowCheckChange('bucket')" /></td>
    <td><select id="em-bkt-cat-${i.id}" onchange="markDirty('bucket','${i.id}')"><option value="">선택</option>${catOptions}</select></td>
    <td><input type="text" id="em-bkt-country-${i.id}" value="${escHtml(i.country)}" placeholder="나라" oninput="markDirty('bucket','${i.id}')" /></td>
    <td><input type="text" id="em-bkt-region-${i.id}" value="${escHtml(i.region)}" placeholder="지역" oninput="markDirty('bucket','${i.id}')" /></td>
    <td><input type="text" id="em-bkt-place-${i.id}" value="${escHtml(i.placeName)}" placeholder="장소명 *" oninput="markDirty('bucket','${i.id}')" /></td>
    <td><select id="em-bkt-season-${i.id}" onchange="markDirty('bucket','${i.id}')">
      <option value="">-</option>
      ${["봄","여름","가을","겨울","연중"].map(s=>`<option${s===i.season?" selected":""}>${s}</option>`).join("")}
    </select></td>
    <td><input type="text" id="em-bkt-notes-${i.id}" value="${escHtml(i.notes)}" placeholder="비고" oninput="markDirty('bucket','${i.id}')" /></td>
    <td style="text-align:center;padding:4px">
      <button class="em-del-btn" onclick="deleteBucketItem('${i.id}')" title="삭제">${ICON_TRASH}</button>
    </td>
  </tr>`;
}

async function saveBucketEditModeRow(id, silent) {
  const placeName = document.getElementById("em-bkt-place-" + id)?.value.trim();
  if (!placeName) return false;
  const updateData = {
    category: document.getElementById("em-bkt-cat-"    + id)?.value || null,
    country:  document.getElementById("em-bkt-country-" + id)?.value.trim() || null,
    region:   document.getElementById("em-bkt-region-"  + id)?.value.trim() || null,
    placeName,
    season:   document.getElementById("em-bkt-season-"  + id)?.value || null,
    notes:    document.getElementById("em-bkt-notes-"   + id)?.value.trim() || null,
  };
  await bucketRef().doc(id).update(updateData);
  const idx = allBucketItems.findIndex(i => i.id === id);
  if (idx !== -1) allBucketItems[idx] = { ...allBucketItems[idx], ...updateData };
  if (!silent) showToast("저장 완료 ✅");
  return true;
}


// ============================================================
// 여행 요약 이미지 추출
// ============================================================
async function exportTripSummary() {
  if (typeof html2canvas === "undefined") {
    showToast("이미지 라이브러리 로드 실패. 새로고침 후 다시 시도해주세요."); return;
  }
  setView("timetable");
  await new Promise(r => setTimeout(r, 400));
  const el = document.getElementById("schedule-timetable-view"); if (!el) return;
  showToast("이미지 생성 중... ⏳");
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const link = document.createElement("a");
    link.download = (currentTrip?.title || "여행요약") + "_시간표.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("이미지 저장 완료 📷");
  } catch { showToast("이미지 저장 실패"); }
}

// ============================================================
// 여행 계획 (Plan) — localStorage 기반
// ============================================================
const PLAN_STORAGE_KEY = "travelPlans";
let planBudgetExpanded = {};

function getTravelPlans() {
  try { const s = localStorage.getItem(PLAN_STORAGE_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
function saveTravelPlans(plans) {
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
}

// Firebase 여행 목록과 localStorage 동기화
// — 없는 여행은 추가, 삭제된 여행(tripId 연동)은 제거
function syncTripsToPlans(firebaseTrips) {
  let plans = getTravelPlans();
  const firebaseIds = new Set(firebaseTrips.map(t => t.id));

  // 1) Firebase에서 삭제된 연동 항목 제거
  plans = plans.filter(p => !p.tripId || firebaseIds.has(p.tripId));

  // 2) 아직 없는 Firebase 여행 추가
  firebaseTrips.forEach(t => {
    const planId = "trip_" + t.id;
    if (!plans.find(p => p.id === planId)) {
      const ts = Date.now() + Math.floor(Math.random() * 9999);
      plans.push({
        id: planId,
        tripId: t.id,
        place: t.city || t.title || "미정",
        startDate: t.startDate || null,
        endDate:   t.endDate   || null,
        companions: t.companions || null,
        budgetItems: [
          { id: String(ts),     label: "숙박", amount: 0 },
          { id: String(ts + 1), label: "식비", amount: 0 },
        ],
        fromTrip: t.title || null,
      });
    }
  });

  saveTravelPlans(plans);
  renderPlanList();
}

// 연동 여행 삭제 시 즉시 제거
function removePlanByTripId(tripId) {
  const plans = getTravelPlans().filter(p => p.tripId !== tripId && p.id !== "trip_" + tripId);
  saveTravelPlans(plans);
  renderPlanList();
}

function renderPlanList() {
  const listEl = document.getElementById("plan-list");
  if (!listEl) return;
  const plans = getTravelPlans();
  if (!plans.length) {
    listEl.innerHTML = `<div class="plan-empty">아직 계획된 여행이 없어요.<br>＋ 추가 버튼으로 등록해보세요 ✈️</div>`;
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const isDone = p => !!(p.endDate && p.endDate < today);

  const sorted = [...plans].sort((a, b) => {
    const ad = isDone(a), bd = isDone(b);
    if (ad !== bd) return ad ? 1 : -1;
    const as = a.startDate || "9999-99-99";
    const bs = b.startDate || "9999-99-99";
    return as.localeCompare(bs);
  });
  listEl.innerHTML = sorted.map(p => renderPlanCard(p, isDone(p))).join("");
}

function renderPlanCard(p, done) {
  const fmt = d => {
    if (!d) return "";
    const parts = d.split("-");
    return parts.length === 3 ? parts[1] + "/" + parts[2] : d;
  };
  const place = escHtml(p.place || "미정");

  if (done) {
    return `
      <div class="plan-row plan-row-done" id="plan-card-${p.id}">
        <span class="plan-row-place">${place}</span>
        <span class="plan-done-badge">완료 ✓</span>
        <button class="plan-row-del" onclick="deleteTravelPlan('${p.id}')">×</button>
      </div>`;
  }

  const dateStr = (p.startDate || p.endDate)
    ? [fmt(p.startDate), fmt(p.endDate)].filter(Boolean).join("~")
    : "";

  const items = p.budgetItems || [];
  const total = items.reduce((s, i) => s + (parseInt(i.amount) || 0), 0);
  const isExpanded = !!planBudgetExpanded[p.id];

  const itemsHtml = items.map(item => `
    <div class="plan-budget-item">
      <input type="text" class="plan-budget-item-label" value="${escHtml(item.label)}" placeholder="항목명"
        onchange="updatePlanBudgetItem('${p.id}','${item.id}','label',this.value)" />
      <input type="number" class="plan-budget-item-amount" value="${item.amount || ""}" placeholder="0"
        oninput="updatePlanBudgetItem('${p.id}','${item.id}','amount',this.value)" />
      <span class="plan-budget-item-unit">원</span>
      <button class="plan-budget-item-del" onclick="deletePlanBudgetItem('${p.id}','${item.id}')">×</button>
    </div>`).join("");

  return `
    <div class="plan-row" id="plan-card-${p.id}">
      <div class="plan-row-main">
        <span class="plan-row-place">${place}</span>
        ${dateStr ? `<span class="plan-row-date">${dateStr}</span>` : ""}
        <button class="plan-row-budget" onclick="togglePlanBudget('${p.id}')">
          💰 <span id="plan-total-${p.id}">${total.toLocaleString()}원</span>
          <span class="plan-budget-caret">${isExpanded ? "▲" : "▼"}</span>
        </button>
        <button class="plan-row-del" onclick="deleteTravelPlan('${p.id}')">×</button>
      </div>
      ${isExpanded ? `
      <div class="plan-budget-detail">
        ${itemsHtml}
        <button class="plan-budget-add-item" onclick="addPlanBudgetItem('${p.id}')">＋ 항목 추가</button>
      </div>` : ""}
    </div>`;
}

function togglePlanBudget(id) {
  planBudgetExpanded[id] = !planBudgetExpanded[id];
  renderPlanList();
}

function addPlanBudgetItem(planId) {
  const plans = getTravelPlans();
  const p = plans.find(x => x.id === planId);
  if (!p) return;
  if (!p.budgetItems) p.budgetItems = [];
  p.budgetItems.push({ id: String(Date.now()), label: "", amount: 0 });
  saveTravelPlans(plans);
  planBudgetExpanded[planId] = true;
  renderPlanList();
}

function updatePlanBudgetItem(planId, itemId, field, value) {
  const plans = getTravelPlans();
  const p = plans.find(x => x.id === planId);
  if (!p) return;
  const item = (p.budgetItems || []).find(i => i.id === itemId);
  if (!item) return;
  if (field === "amount") item.amount = parseInt(value) || 0;
  else item[field] = value;
  saveTravelPlans(plans);
  const newTotal = (p.budgetItems || []).reduce((s, i) => s + (parseInt(i.amount) || 0), 0);
  const el = document.getElementById("plan-total-" + planId);
  if (el) el.textContent = newTotal.toLocaleString() + "원";
}

function deletePlanBudgetItem(planId, itemId) {
  const plans = getTravelPlans();
  const p = plans.find(x => x.id === planId);
  if (!p) return;
  p.budgetItems = (p.budgetItems || []).filter(i => i.id !== itemId);
  saveTravelPlans(plans);
  renderPlanList();
}

function deleteTravelPlan(id) {
  if (!confirm("이 여행 계획을 삭제할까요?")) return;
  saveTravelPlans(getTravelPlans().filter(p => p.id !== id));
  delete planBudgetExpanded[id];
  renderPlanList();
  showToast("삭제됐어요");
}

function openAddPlanForm() {
  const f = document.getElementById("plan-add-form");
  if (!f) return;
  f.classList.remove("hidden");
  setTimeout(() => document.getElementById("plan-add-place")?.focus(), 60);
}

function closeAddPlanForm() {
  const f = document.getElementById("plan-add-form");
  if (!f) return;
  f.classList.add("hidden");
  ["plan-add-place","plan-add-start","plan-add-end","plan-add-companions"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

function saveNewPlan() {
  const place = document.getElementById("plan-add-place")?.value.trim();
  if (!place) { showToast("장소를 입력해주세요 📍"); return; }
  const ts = Date.now();
  const plan = {
    id: String(ts),
    place,
    startDate: document.getElementById("plan-add-start")?.value || null,
    endDate:   document.getElementById("plan-add-end")?.value || null,
    companions: document.getElementById("plan-add-companions")?.value.trim() || null,
    budgetItems: [
      { id: String(ts + 1), label: "숙박", amount: 0 },
      { id: String(ts + 2), label: "식비", amount: 0 },
    ],
  };
  const plans = getTravelPlans();
  plans.unshift(plan);
  saveTravelPlans(plans);
  closeAddPlanForm();
  renderPlanList();
  showToast("여행 계획이 추가됐어요 ✈️");
}

// 새 여행 등록 시 계획 패널에도 자동 추가 (tripId 연동)
function addPlanFromTrip(tripData, tripId) {
  const ts = Date.now();
  const plan = {
    id: "trip_" + (tripId || ts),
    tripId: tripId || null,
    place: tripData.city || tripData.title || "미정",
    startDate: tripData.startDate || null,
    endDate:   tripData.endDate   || null,
    companions: tripData.companions || null,
    budgetItems: [
      { id: String(ts + 1), label: "숙박", amount: 0 },
      { id: String(ts + 2), label: "식비", amount: 0 },
    ],
    fromTrip: tripData.title || null,
  };
  const plans = getTravelPlans();
  if (!plans.find(p => p.tripId === plan.tripId)) {
    plans.unshift(plan);
    saveTravelPlans(plans);
  }
  renderPlanList();
}
