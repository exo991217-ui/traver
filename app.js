// ============================================================
// 여행을 떠나자 — app.js (수정본 v6 + SVG 아이콘 리디자인)
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
// THEME
// ============================================================
const THEME_NAMES = {
  blue:"파랑", pink:"분홍", orange:"주황", green:"연두",
  purple:"보라", mint:"민트", rose:"로즈", sky:"하늘"
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
  if (page === "home") loadTrips();
  if (page === "bucket") { loadAllBucketItems(); refreshCategorySelects(); updateBucketSortHeaders(); }
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

// ---- 준비물 ----
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
  listEl.innerHTML = items.map(item => `
    <div class="packing-item${item.checked ? " checked" : ""}">
      <label class="packing-check-label" onclick="togglePackingCheck('${type}',${item.id})">
        <span class="packing-check-box${item.checked ? " ticked" : ""}"></span>
        <span class="packing-text">${escHtml(item.text)}</span>
      </label>
      <button class="packing-del-btn" onclick="deletePackingItem('${type}',${item.id})">${ICON_TRASH}</button>
    </div>`).join("");
}

function addPackingItem(type) {
  const text = prompt("새 항목 이름을 입력하세요:");
  if (!text || !text.trim()) return;
  const items = getPackingItems(type);
  items.push({id: Date.now(), text: text.trim(), checked: false});
  savePackingItems(type, items);
  renderPackingList(type);
}
let _packingClickLock = false;
function togglePackingCheck(type, id) {
  if (_packingClickLock) return;
  _packingClickLock = true;
  setTimeout(() => { _packingClickLock = false; }, 300);
  const items = getPackingItems(type);
  const item = items.find(i => i.id === id);
  if (item) item.checked = !item.checked;
  savePackingItems(type, items);
  renderPackingList(type);
}
function checkAllPacking(type) {
  const items = getPackingItems(type);
  items.forEach(i => i.checked = true);
  savePackingItems(type, items);
  renderPackingList(type);
}
function uncheckAllPacking(type) {
  const items = getPackingItems(type);
  items.forEach(i => i.checked = false);
  savePackingItems(type, items);
  renderPackingList(type);
}
function deletePackingItem(type, id) {
  savePackingItems(type, getPackingItems(type).filter(i => i.id !== id));
  renderPackingList(type);
}

// ---- 유용한 팁 ----
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
  listEl.innerHTML = tips.map(tip => `
    <div class="tip-row" id="tip-row-${tip.id}">
      <div class="tip-row-header" onclick="toggleTipDetail(${tip.id})">
        <div class="tip-row-title-wrap">
          <span class="tip-row-title">${escHtml(tip.title)}</span>
          ${(tip.tags||[]).length ? `<div class="tip-row-tags">${tip.tags.map(t=>`<span class="tip-tag-chip">#${escHtml(t)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="tip-row-right">
          <span class="tip-date">${tip.date}</span>
          <button class="packing-del-btn tip-del-btn" onclick="event.stopPropagation();deleteTip(${tip.id})">${ICON_TRASH}</button>
          <span class="tip-chevron" id="tip-chev-${tip.id}">›</span>
        </div>
      </div>
      <div class="tip-detail" id="tip-detail-${tip.id}">
        <div id="tip-view-${tip.id}">
          <div class="tip-content">${linkify(escHtml(tip.content).replace(/\n/g,"<br>"))}</div>
          <div style="text-align:right;margin-top:10px">
            <button class="btn btn-outline btn-sm" style="font-size:.78rem" onclick="event.stopPropagation();openTipEdit(${tip.id})">✏️ 수정</button>
          </div>
        </div>
        <div id="tip-edit-${tip.id}" class="hidden">
          <div style="margin-bottom:8px">
            <label style="font-size:.78rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">제목</label>
            <input type="text" id="tip-edit-title-${tip.id}" class="tip-form-input" value="${escHtml(tip.title)}" />
          </div>
          <div style="margin-bottom:8px">
            <label style="font-size:.78rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">태그 (쉼표 구분)</label>
            <input type="text" id="tip-edit-tags-${tip.id}" class="tip-form-input" value="${escHtml((tip.tags||[]).join(", "))}" />
          </div>
          <div style="margin-bottom:8px">
            <label style="font-size:.78rem;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">내용</label>
            <textarea id="tip-edit-content-${tip.id}" class="tip-form-textarea">${escHtml(tip.content)}</textarea>
          </div>
          <div class="tip-compose-actions">
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();closeTipEdit(${tip.id})">취소</button>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();saveTipEdit(${tip.id})">저장</button>
          </div>
        </div>
      </div>
    </div>`).join("");
}

function openTipEdit(id) {
  const detail = document.getElementById("tip-detail-" + id);
  if (detail && !detail.classList.contains("open")) {
    detail.classList.add("open");
    const chev = document.getElementById("tip-chev-" + id);
    if (chev) chev.style.transform = "rotate(90deg)";
  }
  document.getElementById("tip-view-" + id)?.classList.add("hidden");
  document.getElementById("tip-edit-" + id)?.classList.remove("hidden");
  document.getElementById("tip-edit-title-" + id)?.focus();
}
function closeTipEdit(id) {
  document.getElementById("tip-view-" + id)?.classList.remove("hidden");
  document.getElementById("tip-edit-" + id)?.classList.add("hidden");
}
function saveTipEdit(id) {
  const tips = getTips();
  const tip = tips.find(t => t.id === id);
  if (!tip) return;
  const title = document.getElementById("tip-edit-title-" + id)?.value.trim();
  const content = document.getElementById("tip-edit-content-" + id)?.value.trim() || "";
  const tagsRaw = document.getElementById("tip-edit-tags-" + id)?.value.trim() || "";
  if (!title) { showToast("제목을 입력해주세요"); return; }
  tip.title = title;
  tip.content = content;
  tip.tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  saveTipsData(tips);
  renderTips();
  showToast("팁이 수정되었어요 ✅");
}

function toggleTipDetail(id) {
  const detail = document.getElementById("tip-detail-" + id);
  const chev   = document.getElementById("tip-chev-" + id);
  if (!detail) return;
  const open = detail.classList.contains("open");
  detail.classList.toggle("open", !open);
  if (chev) chev.style.transform = open ? "" : "rotate(90deg)";
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
  _tipComposeTags = _tipComposeTags.filter(t => t !== tag);
  renderComposeTags();
}
function renderComposeTags() {
  const el = document.getElementById("tip-tag-preview");
  if (!el) return;
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
function deleteTip(id) {
  if (!confirm("이 팁을 삭제할까요?")) return;
  saveTipsData(getTips().filter(t => t.id !== id));
  renderTips();
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
  showToast("삭제됐어요");
  loadTrips();
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
  dirtyScheduleIds.clear(); dirtyExpenseIds.clear(); dirtyBucketIds.clear();

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
  const btn = document.getElementById("map-entry-btn");
  if (!btn) return;
  if (currentTrip?.mapLink) {
    btn.classList.add("has-map");
    btn.title = "지도 보기 / 수정";
  } else {
    btn.classList.remove("has-map");
    btn.title = "지도 연결";
  }
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
  const city = parts[0] || null;
  const country = parts[1] || null;
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
function openMapEntryModal() {
  _refreshMapEntryDisplay();
  openModal("modal-map-entry");
}

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
    if (embedUrl && iframeWrap && iframe) {
      iframe.src = embedUrl;
      iframeWrap.classList.remove("hidden");
    } else {
      iframeWrap?.classList.add("hidden");
    }
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

function cancelMapLinkEdit() {
  _refreshMapEntryDisplay();
}

function updateMapEntryPreview() {
  const raw = document.getElementById("map-entry-input")?.value.trim() || "";
  const parsed = parseMapInput(raw);
  const iframeWrap = document.getElementById("map-entry-iframe-wrap");
  const iframe     = document.getElementById("map-entry-iframe");
  if (parsed && iframeWrap && iframe) {
    const embedUrl = buildMapEmbedUrl(parsed);
    if (embedUrl) { iframe.src = embedUrl; iframeWrap.classList.remove("hidden"); }
    else iframeWrap.classList.add("hidden");
  } else if (iframeWrap) {
    iframeWrap.classList.add("hidden");
    if (iframe) iframe.src = "";
  }
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
  const raw     = editing
    ? (document.getElementById("map-entry-input")?.value.trim() || "")
    : (currentTrip?.mapLink || "");
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
  closeModal("modal-map-entry");
  updateMapEntryBtn();
  showToast("지도 연결 해제됨");
}

function onMapEntryBtnClick() {
  openMapEntryModal();
}

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
  const frame = document.getElementById("map-modal-frame");
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

function openLinkModal(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  document.getElementById("link-preview-url").textContent = url;
  document.getElementById("link-preview-frame").src = url;
  document.getElementById("link-preview-anchor").href = url;
  openModal("modal-link-preview");
}

function openResLinkModal(encodedUrl) {
  const raw = decodeURIComponent(encodedUrl);
  const embedUrl = buildMapEmbedUrl(raw);
  const isEmbed = embedUrl && (embedUrl.includes("output=embed") || embedUrl.includes("/embed?") || embedUrl.includes("maps/embed"));

  const iframeWrap = document.getElementById("link-iframe-wrap");
  const externalCard = document.getElementById("link-external-card");

  if (isEmbed) {
    iframeWrap.classList.remove("hidden");
    externalCard.classList.add("hidden");
    document.getElementById("link-preview-frame").src = embedUrl;
    document.getElementById("link-preview-anchor").href = raw;
    const label = document.getElementById("link-preview-url");
    if (label) label.textContent = raw;
  } else {
    iframeWrap.classList.add("hidden");
    externalCard.classList.remove("hidden");
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

function renderLink(val, title) {
  if (!val) return "-";
  if (isUrl(val)) {
    const enc = encodeURIComponent(val);
    return `<a class="link-icon" href="#" onclick="event.preventDefault();openLinkModal('${enc}')" title="${val}">${ICON_LINK}</a>`;
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

function onRowCheckChange(type) {
  updateCheckedCount(type);
}

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
  if (type === "schedule") {
    dirtyScheduleIds.clear();
    renderScheduleTable(scheduleItems);
    renderTimetable(scheduleItems);
    updateCheckedCount("schedule");
  } else if (type === "expense") {
    dirtyExpenseIds.clear();
    renderExpenses(expenseItems);
    updateCheckedCount("expense");
  } else if (type === "bucket") {
    dirtyBucketIds.clear();
    renderBucketList();
    renderTripBucket(allBucketItems);
    updateCheckedCount("bucket");
  }
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
// ---- Lock ----
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
  if (scheduleAddOpen) {
    setTimeout(() => document.getElementById("sch-add-date")?.focus(), 80);
  }
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

async function loadSchedules() {
  const snap = await schedulesRef().orderBy("date").get().catch(() => ({ docs: [] }));
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

function renderScheduleTable(items) {
  const tbody = document.getElementById("schedule-tbody");
  const catEl = document.getElementById("sch-add-cat");
  if (catEl && catEl.options.length <= 1) refreshCategorySelects();

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-msg">📅 아래 "추가" 버튼에서 일정을 추가하세요</td></tr>`;
    return;
  }

  const schRow = (s, withCheck) => {
    const catBadge = s.category ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")}"> ${s.category}</span>` : "-";
    const mapBtn = buildMapBtn(s);
    const notesDisplay = renderLink(s.notes, "비고");
    const actionCell = `<td class="sch-row-action" style="width:32px;padding:4px;text-align:center">
      <button class="sch-del-btn" onclick="event.stopPropagation();deleteSchedule('${s.id}')" title="삭제">${ICON_TRASH}</button>
    </td>`;
    const clickable = `class="clickable-row" onclick="if(!isLocked)openScheduleEditModal('${s.id}')"`;
    return `<tr ${clickable}>
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
  };
  tbody.innerHTML = items.map(s => schRow(s, scheduleEditMode)).join("");
}

function renderScheduleEditModeRow(s, cats) {
  const catOptions = cats.map(c => `<option${c===s.category?" selected":""}>${c}</option>`).join("");
  const mapUrl = s.mapUrl || "";
  const notesVal = s.notes || "";
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
  if (event.key === "Enter") {
    event.preventDefault();
    saveChecked(type);
  } else if (event.key === "Escape") {
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

// ---- 일정 수정 모달 ----
function openScheduleEditModal(id) {
  if (isLocked || scheduleEditMode) return;
  scheduleEditItemId = id;
  const item = scheduleItems.find(s => s.id === id);
  if (!item) return;
  refreshCategorySelects();
  const cats = getCategories("schedule");
  const catEl = document.getElementById("se-cat");
  if (catEl) catEl.innerHTML = `<option value="">분류 없음</option>` + cats.map(c => `<option${c===item.category?" selected":""}>${c}</option>`).join("");
  document.getElementById("se-date").value   = item.date || "";
  document.getElementById("se-time").value   = item.time || "";
  document.getElementById("se-loc").value    = item.location || "";
  document.getElementById("se-content").value = item.content || "";
  document.getElementById("se-trans").value  = item.transportation || "";
  document.getElementById("se-notes").value  = item.notes || "";
  document.getElementById("se-mapurl").value = item.mapUrl || "";
  openModal("modal-schedule-edit");
  setTimeout(() => document.getElementById("se-loc")?.focus(), 80);
}

async function saveScheduleEditModal() {
  const id = scheduleEditItemId;
  if (!id) return;
  const mapUrlRaw = document.getElementById("se-mapurl").value.trim() || null;
  const updateData = {
    category:      document.getElementById("se-cat").value || null,
    date:          document.getElementById("se-date").value || null,
    time:          document.getElementById("se-time").value || null,
    location:      document.getElementById("se-loc").value.trim() || null,
    content:       document.getElementById("se-content").value.trim() || null,
    transportation: document.getElementById("se-trans").value.trim() || null,
    notes:         document.getElementById("se-notes").value.trim() || null,
    mapUrl:        mapUrlRaw ? (parseMapInput(mapUrlRaw) || mapUrlRaw) : null,
  };
  await schedulesRef().doc(id).update(updateData);
  const idx = scheduleItems.findIndex(s => s.id === id);
  if (idx !== -1) scheduleItems[idx] = { ...scheduleItems[idx], ...updateData };
  showToast("수정 완료 ✅");
  closeModal("modal-schedule-edit");
  renderScheduleTable(scheduleItems);
  renderTimetable(scheduleItems);
}

// ---- Timetable (날짜 × 시간 캘린더 그리드) ----
function renderTimetable(items) {
  const wrap = document.getElementById("schedule-timetable-view");
  if (!wrap) return;
  if (!items.length) { wrap.innerHTML = `<div class="empty-msg">📅 일정이 없어요</div>`; return; }

  // '이동' 분류 제외
  const ttItems = items.filter(i => (i.category || "") !== "이동");

  // 고유 날짜 정렬
  const dates = [...new Set(ttItems.map(i => i.date || "날짜 미정"))].sort();
  if (!dates.length) { wrap.innerHTML = `<div class="empty-msg">📅 표시할 일정이 없어요 (이동 제외)</div>`; return; }

  // 시간 범위 계산
  const hourNums = ttItems.filter(i => i.time).map(i => parseInt(i.time));
  const minH = hourNums.length ? Math.max(0, Math.min(...hourNums) - 1) : 7;
  const maxH = hourNums.length ? Math.min(24, Math.max(...hourNums) + 1) : 22;
  const slots = [];
  for (let h = minH; h <= maxH; h++) slots.push(h < 10 ? "0" + h + ":00" : h + ":00");

  // 항목 조회 헬퍼
  const itemsForSlot = (date, slotHour) =>
    ttItems.filter(i => (i.date || "날짜 미정") === date && i.time && parseInt(i.time) === slotHour);
  const itemsNoTime = (date) =>
    ttItems.filter(i => (i.date || "날짜 미정") === date && !i.time);

  // 시작일 기준 N일차 레이블
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

  // HTML 생성
  let html = `<div class="timetable-grid-wrap"><table class="timetable-grid"><thead><tr>
    <th class="time-col-h">시간</th>`;
  dates.forEach(d => {
    const { line1, line2 } = dayLabel(d);
    html += `<th>${line1}${line2 ? `<br><span style="font-weight:500;font-size:0.72rem;color:var(--text-muted)">${line2}</span>` : ""}</th>`;
  });
  html += `</tr>`;

  // 시간 없는 항목 → 날짜별 핀 카드 (두번째 헤더 행)
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

  // 시간별 행
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
  const catBadge = s.category
    ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")} tt-badge">${s.category}</span>` : "";
  const transBadge = s.transportation
    ? `<span class="badge badge-trans-other tt-badge">${escHtml(s.transportation)}</span>` : "";
  const label = escHtml(s.location || s.content || "-");
  return `<div class="tt-item"><span class="tt-item-label">${label}</span>${catBadge}${transBadge}</div>`;
}

// ============================================================
// EXPENSES
// ============================================================
function expensesRef() { return tripsRef().doc(currentTripId).collection("expenses"); }

function toggleExpenseEditMode() {
  expenseEditMode = !expenseEditMode;
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
  const snap = await expensesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  expenseItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  expenseItems.sort((a,b) => (a.date||"").localeCompare(b.date||""));
  renderExpenses(expenseItems);
}

function renderExpenses(items) {
  const tbody = document.getElementById("expense-tbody");
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">💸 아래 "추가" 버튼에서 지출을 기록하세요</td></tr>`;
    updateBudget(0);
    return;
  }
  const hasForeign = !!(currentTrip?.foreignCurrency);
  const expRow = (e, withCheck) => {
    const catBadge = e.category ? `<span class="badge badge-${e.category.replace(/\//g,"\\/")}"> ${e.category}</span>` : "-";
    const foreignDisp = hasForeign && e.amountForeign != null
      ? (CURRENCY_SYMBOLS[currentTrip.foreignCurrency] || "") + Number(e.amountForeign).toLocaleString()
      : "-";
    const actionCell = `<td class="exp-row-action" style="width:32px;padding:4px;text-align:center">
      <button class="exp-del-btn" onclick="event.stopPropagation();deleteExpense('${e.id}')" title="삭제">${ICON_TRASH}</button>
    </td>`;
    const clickable = `class="clickable-row" onclick="if(!isLocked)openExpenseEditModal('${e.id}')"`;
    return `<tr ${clickable}>
      <td>${catBadge}</td>
      <td style="white-space:nowrap;font-size:0.8rem">${formatDateShort(e.date)}</td>
      <td>${escHtml(e.title)}</td>
      <td style="text-align:right;font-weight:600">${e.amountKrw != null ? Number(e.amountKrw).toLocaleString() + "원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${foreignDisp}</td>
      ${actionCell}
    </tr>`;
  };
  tbody.innerHTML = items.map(e => expRow(e, expenseEditMode)).join("");
  const total = items.reduce((s,e) => s + (e.amountKrw || 0), 0);
  const totalForeign = hasForeign ? items.reduce((s,e) => s + (e.amountForeign || 0), 0) : 0;
  updateBudget(total);
  document.getElementById("total-krw-display").innerHTML = `<strong>${total.toLocaleString()}원</strong>`;
  const tfEl = document.getElementById("total-foreign-display");
  if (hasForeign && tfEl) {
    tfEl.innerHTML = `<strong>${CURRENCY_SYMBOLS[currentTrip.foreignCurrency]||""}${totalForeign.toLocaleString()}</strong>`;
  } else if (tfEl) { tfEl.innerHTML = ""; }
  const sd = document.getElementById("expense-summary-display");
  if (sd) sd.textContent = "합계 " + total.toLocaleString() + "원";
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
    category: document.getElementById("em-exp-cat-"  + id)?.value || null,
    date:     document.getElementById("em-exp-date-" + id)?.value || null,
    title,
    amountKrw: document.getElementById("em-exp-krw-" + id)?.value ? parseInt(document.getElementById("em-exp-krw-" + id).value) : null,
    amountForeign: document.getElementById("em-exp-foreign-" + id)?.value ? parseFloat(document.getElementById("em-exp-foreign-" + id).value) : null,
  };
  await expensesRef().doc(id).update(updateData);
  const idx = expenseItems.findIndex(e => e.id === id);
  if (idx !== -1) expenseItems[idx] = { ...expenseItems[idx], ...updateData };
  if (!silent) showToast("저장 완료 ✅");
  return true;
}

// ---- 지출 수정 모달 ----
function openExpenseEditModal(id) {
  if (isLocked || expenseEditMode) return;
  expenseEditItemId = id;
  const item = expenseItems.find(e => e.id === id);
  if (!item) return;
  const hasForeign = !!(currentTrip?.foreignCurrency);
  refreshCategorySelects();
  const cats = getCategories("expense");
  const catEl = document.getElementById("ee-cat");
  if (catEl) catEl.innerHTML = `<option value="">분류 없음</option>` + cats.map(c => `<option${c===item.category?" selected":""}>${c}</option>`).join("");
  document.getElementById("ee-date").value  = item.date || "";
  document.getElementById("ee-title").value = item.title || "";
  document.getElementById("ee-krw").value   = item.amountKrw ?? "";
  document.getElementById("ee-foreign").value = item.amountForeign ?? "";
  const foreignRow = document.getElementById("ee-foreign-row");
  if (foreignRow) foreignRow.style.display = hasForeign ? "" : "none";
  openModal("modal-expense-edit");
  setTimeout(() => document.getElementById("ee-title")?.focus(), 80);
}

async function saveExpenseEditModal() {
  const id = expenseEditItemId;
  if (!id) return;
  const title = document.getElementById("ee-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요"); return; }
  const updateData = {
    category:     document.getElementById("ee-cat").value || null,
    date:         document.getElementById("ee-date").value || null,
    title,
    amountKrw:    document.getElementById("ee-krw").value     ? parseInt(document.getElementById("ee-krw").value)     : null,
    amountForeign:document.getElementById("ee-foreign").value ? parseFloat(document.getElementById("ee-foreign").value) : null,
  };
  await expensesRef().doc(id).update(updateData);
  const idx = expenseItems.findIndex(e => e.id === id);
  if (idx !== -1) expenseItems[idx] = { ...expenseItems[idx], ...updateData };
  showToast("수정 완료 ✅");
  closeModal("modal-expense-edit");
  renderExpenses(expenseItems);
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

function toggleResEditMode() {
  resEditMode = !resEditMode;
  resEditItemId = null;
  const btn = document.getElementById("res-edit-mode-btn");
  const banner = document.getElementById("res-edit-banner");
  if (btn) btn.classList.toggle("active", resEditMode);
  if (banner) banner.classList.toggle("hidden", !resEditMode);
  loadReservations();
}

function openResForm(type) {
  ["항공","숙소","기타"].forEach(t => document.getElementById("res-form-" + t)?.classList.add("hidden"));
  const f = document.getElementById("res-form-" + type);
  f.innerHTML = buildResForm(type); f.classList.remove("hidden");
  f.querySelector("input,select")?.focus();
}

function buildResForm(type) {
  const btn = `<div class="sub-form-actions">
    <button class="btn btn-ghost btn-sm" onclick="closeResForm('${type}')">취소</button>
    <button class="btn btn-primary btn-sm" onclick="saveReservation('${type}')">저장</button>
  </div>`;
  const linkField = `<div class="form-row"><div class="form-group full"><label>링크 <span style="font-weight:400;color:var(--text-muted)">(URL 또는 &lt;iframe&gt; 코드 모두 가능)</span></label><textarea id="rf-link" rows="2" placeholder="https://... 또는 &lt;iframe src=&quot;...&quot;&gt; 코드 붙여넣기" style="resize:vertical;font-size:0.79rem;min-height:54px"></textarea></div></div>`;
  if (type === "항공") return `
    <div class="form-row">
      <div class="form-group"><label>출발지</label><input type="text" id="rf-from" placeholder="인천" /></div>
      <div class="form-group" style="flex:0 0 18px;justify-content:flex-end;padding-bottom:6px;font-size:1.1rem">→</div>
      <div class="form-group"><label>도착지</label><input type="text" id="rf-to" placeholder="신치토세" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>출발 일시</label><input type="datetime-local" id="rf-depart" /></div>
      <div class="form-group"><label>도착 일시</label><input type="datetime-local" id="rf-arrive" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>편명</label><input type="text" id="rf-flight" placeholder="QF 1234" /></div>
      <div class="form-group"><label>예약번호</label><input type="text" id="rf-number" placeholder="ABC123" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>비고</label><input type="text" id="rf-notes" /></div></div>
    ${linkField}
    ${btn}`;
  if (type === "숙소") return `
    <div class="form-row"><div class="form-group full"><label>숙소명 *</label><input type="text" id="rf-title" placeholder="호텔 플러스 호스텔" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>체크인</label><input type="datetime-local" id="rf-checkin" /></div>
      <div class="form-group"><label>체크아웃</label><input type="datetime-local" id="rf-checkout" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>전화번호</label><input type="text" id="rf-phone" /></div>
      <div class="form-group"><label>예약확인번호</label><input type="text" id="rf-number" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>비고</label><input type="text" id="rf-notes" /></div></div>
    ${linkField}
    ${btn}`;
  return `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input type="date" id="rf-date" /></div>
      <div class="form-group"><label>분류</label><input type="text" id="rf-subcat" placeholder="체험, 입장권 등" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>예약명 / 장소 *</label><input type="text" id="rf-title" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>예약번호</label><input type="text" id="rf-number" /></div>
      <div class="form-group"><label>비고</label><input type="text" id="rf-notes" /></div>
    </div>
    ${linkField}
    ${btn}`;
}

function buildResEditFormHtml(type, item) {
  const btn = `<div class="sub-form-actions">
    <button class="btn btn-ghost btn-sm" onclick="cancelResEdit()">취소</button>
    <button class="btn btn-primary btn-sm" onclick="updateReservation('${item.id}','${type}')">수정저장</button>
  </div>`;
  const efLinkField = (val) => `<div class="form-row"><div class="form-group full"><label>링크 <span style="font-weight:400;color:var(--text-muted)">(URL 또는 &lt;iframe&gt; 코드 모두 가능)</span></label><textarea id="ef-link" rows="2" style="resize:vertical;font-size:0.79rem;min-height:54px">${escHtml(val||"")}</textarea></div></div>`;
  const editLabel = `<div style="font-size:0.76rem;font-weight:700;color:var(--pd);margin-bottom:6px;display:flex;align-items:center;gap:4px">${ICON_EDIT} 수정 중</div>`;
  if (type === "항공") return `
    ${editLabel}
    <div class="form-row">
      <div class="form-group"><label>출발지</label><input type="text" id="ef-from" value="${escHtml(item.from)}" /></div>
      <div class="form-group" style="flex:0 0 18px;justify-content:flex-end;padding-bottom:6px;font-size:1.1rem">→</div>
      <div class="form-group"><label>도착지</label><input type="text" id="ef-to" value="${escHtml(item.to)}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>출발 일시</label><input type="datetime-local" id="ef-depart" value="${item.depart||""}" /></div>
      <div class="form-group"><label>도착 일시</label><input type="datetime-local" id="ef-arrive" value="${item.arrive||""}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>편명</label><input type="text" id="ef-flight" value="${escHtml(item.flight)}" /></div>
      <div class="form-group"><label>예약번호</label><input type="text" id="ef-number" value="${escHtml(item.reservationNumber)}" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>비고</label><input type="text" id="ef-notes" value="${escHtml(item.notes)}" /></div></div>
    ${efLinkField(item.link)}
    ${btn}`;
  if (type === "숙소") return `
    ${editLabel}
    <div class="form-row"><div class="form-group full"><label>숙소명 *</label><input type="text" id="ef-title" value="${escHtml(item.title)}" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>체크인</label><input type="datetime-local" id="ef-checkin" value="${item.checkin||""}" /></div>
      <div class="form-group"><label>체크아웃</label><input type="datetime-local" id="ef-checkout" value="${item.checkout||""}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>전화번호</label><input type="text" id="ef-phone" value="${escHtml(item.phone)}" /></div>
      <div class="form-group"><label>예약확인번호</label><input type="text" id="ef-number" value="${escHtml(item.reservationNumber)}" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>비고</label><input type="text" id="ef-notes" value="${escHtml(item.notes)}" /></div></div>
    ${efLinkField(item.link)}
    ${btn}`;
  return `
    ${editLabel}
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input type="date" id="ef-date" value="${item.date||""}" /></div>
      <div class="form-group"><label>분류</label><input type="text" id="ef-subcat" value="${escHtml(item.subCategory)}" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>예약명 / 장소 *</label><input type="text" id="ef-title" value="${escHtml(item.title)}" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>예약번호</label><input type="text" id="ef-number" value="${escHtml(item.reservationNumber)}" /></div>
      <div class="form-group"><label>비고</label><input type="text" id="ef-notes" value="${escHtml(item.notes)}" /></div>
    </div>
    ${efLinkField(item.link)}
    ${btn}`;
}

function closeResForm(type) { document.getElementById("res-form-" + type)?.classList.add("hidden"); }

async function saveReservation(type) {
  const rawLink = document.getElementById("rf-link")?.value.trim() || "";
  let data = { type, notes: document.getElementById("rf-notes")?.value.trim() || null, link: parseMapInput(rawLink) || (rawLink || null) };
  if (type === "항공") {
    data.from = document.getElementById("rf-from")?.value.trim() || null;
    data.to   = document.getElementById("rf-to")?.value.trim() || null;
    data.depart  = document.getElementById("rf-depart")?.value || null;
    data.arrive  = document.getElementById("rf-arrive")?.value || null;
    data.flight  = document.getElementById("rf-flight")?.value.trim() || null;
    data.reservationNumber = document.getElementById("rf-number")?.value.trim() || null;
    data.title = [data.from, data.to].filter(Boolean).join(" → ") || "항공";
    data.date  = data.depart ? data.depart.split("T")[0] : null;
  } else if (type === "숙소") {
    data.title = document.getElementById("rf-title")?.value.trim();
    if (!data.title) { showToast("숙소명을 입력해주세요"); return; }
    data.checkin  = document.getElementById("rf-checkin")?.value || null;
    data.checkout = document.getElementById("rf-checkout")?.value || null;
    data.phone    = document.getElementById("rf-phone")?.value.trim() || null;
    data.reservationNumber = document.getElementById("rf-number")?.value.trim() || null;
    data.date = data.checkin ? data.checkin.split("T")[0] : null;
  } else {
    data.title = document.getElementById("rf-title")?.value.trim();
    if (!data.title) { showToast("예약명을 입력해주세요"); return; }
    data.subCategory = document.getElementById("rf-subcat")?.value.trim() || null;
    data.date = document.getElementById("rf-date")?.value || null;
    data.reservationNumber = document.getElementById("rf-number")?.value.trim() || null;
  }
  await reservationsRef().add(data);
  showToast("예약 추가 완료 🎫"); closeResForm(type); loadReservations();
}

async function loadReservations() {
  const snap = await reservationsRef().orderBy("date").get().catch(() => ({ docs: [] }));
  currentResItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  ["항공","숙소","기타"].forEach(type => {
    const list = document.getElementById("res-list-" + type); if (!list) return;
    const ti = currentResItems.filter(r => r.type === type);
    if (!ti.length) {
      list.innerHTML = `<div class="empty-msg" style="padding:14px;font-size:0.8rem">${type} 예약 없음</div>`;
      return;
    }
    list.innerHTML = ti.map(r => {
      if (r.id === resEditItemId) {
        return `<div class="res-item res-edit-form-wrap">${buildResEditFormHtml(type, r)}</div>`;
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

function editReservation(id, type) {
  if (resEditItemId === id) { resEditItemId = null; loadReservations(); return; }
  resEditItemId = id;
  ["항공","숙소","기타"].forEach(t => document.getElementById("res-form-" + t)?.classList.add("hidden"));
  loadReservations();
  setTimeout(() => {
    const el = document.querySelector(".res-edit-form-wrap input");
    if (el) el.focus();
  }, 80);
}

function cancelResEdit() {
  resEditItemId = null;
  loadReservations();
}

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
  resEditItemId = null;
  loadReservations();
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
// 가고싶은 곳 (2열 그리드 in trip detail)
// ============================================================
function onTripBucketFilterChange() {
  const val = document.getElementById("trip-bucket-region")?.value || "";
  if (currentTripId) localStorage.setItem("trip_bucket_region_" + currentTripId, val);
  renderTripBucket(allBucketItems);
}

async function loadTripBucketItems() {
  if (!currentUser) return;
  const saved = currentTripId ? (localStorage.getItem("trip_bucket_region_" + currentTripId) || "") : "";
  const inp = document.getElementById("trip-bucket-region");
  if (inp) inp.value = saved;
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
          const regionBadge = item.region ? `<span class="wish-badge">${escHtml(item.region)}</span>` : "";
          return `
          <div class="wish-item ${item.visited?"visited":""}" onclick="if(!isLocked)openTripBucketModal('${item.id}')" style="cursor:pointer">
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
    season: document.getElementById("bk-season").value || null,
    country: document.getElementById("bk-country").value.trim() || null,
    region: document.getElementById("bk-region").value.trim() || null,
    notes: document.getElementById("bk-notes").value.trim() || null,
    visited: document.getElementById("bk-visited").checked,
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
  renderTripBucket(allBucketItems);
  renderBucketList();
}

// ============================================================
// 버킷플레이스 (메인 리스트)
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
    season: document.getElementById("bam-season").value || null,
    country: document.getElementById("bam-country").value.trim() || null,
    region: document.getElementById("bam-region").value.trim() || null,
    notes: document.getElementById("bam-notes").value.trim() || null,
    visited: document.getElementById("bam-visited").checked,
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
  const dd = document.getElementById("col-dd-" + col);
  if (!dd) return;
  const isOpen = dd.classList.toggle("open");
  activeColMenu = isOpen ? col : null;
  if (isOpen) {
    dd.innerHTML = buildColMenu(col);
    const inp = dd.querySelector("input");
    if (inp) { inp.focus(); }
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

function sortBucketBy(col, dir) {
  bucketSortCol = col; bucketSortDir = dir;
  renderBucketList(); updateBucketSortHeaders();
  document.getElementById("col-dd-" + col)?.classList.remove("open");
  activeColMenu = null;
}
function clearBucketSort() { bucketSortCol = ""; renderBucketList(); updateBucketSortHeaders(); }
function setBucketColFilter(col, val) { bucketColFilters[col] = val; renderBucketList(); }
function clearBucketColFilter(col) {
  delete bucketColFilters[col];
  renderBucketList();
  document.getElementById("col-dd-" + col)?.classList.remove("open");
  activeColMenu = null;
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
    tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">⭐ 아직 가고싶은 곳이 없어요</td></tr>`;
    return;
  }

  const bktRow = (i, withCheck) => {
    let visitCell;
    if (withCheck) {
      visitCell = `<td><input type="checkbox" class="row-check bkt-row-check" data-id="${i.id}" onclick="event.stopPropagation()" onchange="onRowCheckChange('bucket')" /></td>`;
    } else {
      visitCell = `<td style="text-align:center"><input type="checkbox" ${i.visited?"checked":""} onclick="event.stopPropagation();toggleVisited('${i.id}',${i.visited})" style="width:16px;height:16px;accent-color:var(--pd);cursor:pointer;display:block;margin:0 auto" title="방문 완료 체크" /></td>`;
    }
    const clickable = withCheck ? "" : `class="clickable-row ${i.visited?"done-row":""}" onclick="if(!isLocked)openBucketAddModal('${i.id}')"`;
    return `<tr ${clickable} ${!withCheck ? "" : `class="${i.visited?"done-row":""}"`}>
      ${visitCell}`;
  };

  tbody.innerHTML = items.map(i => {
    const row = bktRow(i, bucketEditMode);
    return row +
      `<td>${i.category ? `<span class="badge badge-${i.category}">${CAT_EMOJI[i.category]||"📌"} ${i.category}</span>` : "-"}</td>
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
    category: document.getElementById("em-bkt-cat-"   + id)?.value || null,
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
    showToast("이미지 라이브러리 로드 실패. 새로고침 후 다시 시도해주세요.");
    return;
  }
  setView("timetable");
  await new Promise(r => setTimeout(r, 400));
  const el = document.getElementById("schedule-timetable-view");
  if (!el) return;
  showToast("이미지 생성 중... ⏳");
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const link = document.createElement("a");
    link.download = (currentTrip?.title || "여행요약") + "_시간표.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("이미지 저장 완료 📷");
  } catch {
    showToast("이미지 저장 실패");
  }
}
