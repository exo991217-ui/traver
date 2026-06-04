// ============================================================
// 여행을 떠나자 — app.js (수정본 v6)
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

// ---- Global State ----
let currentUser = null;
let currentTripId = null;
let currentTrip = null;
let scheduleEditId = null;
let scheduleEditMode = false;
let scheduleAddOpen = false;
let scheduleItems = [];
let expenseEditId = null;
let expenseEditMode = false;
let expenseAddOpen = false;
let resEditMode = false;
let resEditItemId = null;      // 예약 인라인 편집 중인 아이템 id
let currentResItems = [];      // 현재 로드된 예약 목록
let bucketEditId = null;
let bucketEditMode = false;
let bucketAddModalEditId = null;
let tripBucketEditId = null;
let currentView = "table";
let tripFilter = "all";
let allBucketItems = [];
let expenseItems = [];          // 로컬 캐시 — Firestore 재조회 없이 렌더링
let bucketRegionTab = "all";

// 편집 모드 dirty 추적 (편집된 행 자동 체크)
let dirtyScheduleIds = new Set();
let dirtyExpenseIds = new Set();
let dirtyBucketIds = new Set();

// 버킷 정렬/필터 상태
let bucketSortCol = "";
let bucketSortDir = "asc";
let bucketColFilters = {};
let activeColMenu = null;

const CURRENCY_SYMBOLS = { JPY: "¥", EUR: "€", USD: "$", CNY: "¥", THB: "฿", VND: "₫", AUD: "A$" };
const DEFAULT_RATES = { JPY: 9.2, EUR: 1500, USD: 1380, CNY: 190, THB: 38, VND: 0.056, AUD: 900 };
const BUCKET_CATEGORIES = ["풍경", "맛집", "카페", "체험", "기념품", "쇼핑", "기타"];
const CAT_EMOJI = { 풍경:"🌄", 맛집:"🍜", 카페:"☕", 체험:"🎭", 기념품:"🎁", 쇼핑:"🛍️", 기타:"📌" };

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
function loadTheme() { setTheme(localStorage.getItem("theme") || "orange"); }
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
        <button class="btn btn-primary" style="margin-top:14px" onclick="handleAuth()">Google 계정으로 로그인</button>
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
            <div class="trip-card-emoji">✈️</div>
            <div class="trip-card-body">
              <div class="trip-card-title">${t.title}</div>
              <div class="trip-card-meta">
                ${t.startDate ? formatDateShort(t.startDate) + " ~ " + formatDateShort(t.endDate || "") + " · " : ""}
                ${[t.city, t.country].filter(Boolean).join(", ") || "여행지 미정"}
                ${t.companions ? " · " + t.companions : ""}
              </div>
            </div>
            <div class="trip-card-actions" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-icon" onclick="deleteTrip('${t.id}')">🗑️</button>
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

function filterTrips(type, el) {
  tripFilter = type;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  loadTrips();
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
  showToast("삭제됐어요 🗑️");
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

  // 편집 모드 UI 초기화
  ["schedule-edit-mode-btn","expense-edit-mode-btn","res-edit-mode-btn","bucket-edit-mode-btn"].forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });
  ["edit-mode-banner","expense-edit-banner","res-edit-banner","bucket-edit-banner"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  document.getElementById("schedule-table")?.classList.remove("edit-mode-on");
  document.getElementById("expense-table")?.classList.remove("edit-mode-on");
  // 액션 컬럼 width 초기화 (편집 모드 중 이동 시 체크박스 열이 남는 것 방지)
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
// 지도 링크 (여행지 우측 아이콘) — HTML embed 지원
// ============================================================
function openMapEntryModal() {
  const inp = document.getElementById("map-entry-input");
  if (inp) inp.value = currentTrip?.mapLink || "";
  updateMapEntryPreview();
  openModal("modal-map-entry");
  setTimeout(() => inp && inp.focus(), 80);
}

function updateMapEntryPreview() {
  const raw = document.getElementById("map-entry-input")?.value.trim() || "";
  const parsed = parseMapInput(raw);
  const row = document.getElementById("map-entry-preview-row");
  const link = document.getElementById("map-entry-preview-link");
  if (parsed) {
    row.classList.remove("hidden");
    link.href = parsed; link.textContent = parsed;
  } else {
    row.classList.add("hidden");
  }
}

// URL 또는 HTML iframe embed code에서 map URL 추출
function parseMapInput(raw) {
  if (!raw) return null;
  raw = raw.trim();
  // iframe embed code (e.g. <iframe src="...">)
  const srcMatch = raw.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];
  // 일반 URL
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return null;
}

async function saveTripMapLink() {
  const raw = document.getElementById("map-entry-input").value.trim();
  const parsed = parseMapInput(raw) || (raw || null);
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
  if (currentTrip?.mapLink) {
    openMapModal(currentTrip.mapLink, [currentTrip.city, currentTrip.country].filter(Boolean).join(" "));
  } else {
    openMapEntryModal();
  }
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
  // 이미 embed URL이면 그대로 사용
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

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function isUrl(str) {
  return typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));
}

// 날짜 표시: yyyy-mm-dd → mm/dd
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
    return `<a class="link-icon" href="#" onclick="event.preventDefault();openLinkModal('${enc}')" title="${val}">🔗</a>`;
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

// 선택 항목 저장
// ★ 저장 후 Firestore를 다시 fetch하지 않고 로컬 배열을 바로 렌더링한다.
//    get() 이 캐시를 반환해 수정 전 데이터로 롤백되는 버그를 방지함.
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
  // 로컬 배열로 즉시 재렌더링 (Firestore 캐시 롤백 방지)
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

// 선택 항목 삭제
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
  showToast(ids.length + "개 삭제됐어요 🗑️");
  if (type === "schedule") { dirtyScheduleIds.clear(); loadSchedules(); }
  else if (type === "expense") { dirtyExpenseIds.clear(); loadExpenses(); }
  else if (type === "bucket") { dirtyBucketIds.clear(); reloadBucketAll(); }
  else if (type === "res") { loadReservations(); }
}

// ============================================================
// 편집 모드 토글 — 일정
// ============================================================
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

// 추가 폼 토글
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
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a,b) => {
    const dd = (a.date||"").localeCompare(b.date||"");
    return dd !== 0 ? dd : (a.time||"").localeCompare(b.time||"");
  });
  scheduleItems = items;
  renderScheduleTable(items); renderTimetable(items);
}

function buildMapBtn(s) {
  const mapLink = s.mapUrl || (isUrl(s.notes) ? s.notes : null);
  if (!mapLink) return "";
  const dataUrl = encodeURIComponent(mapLink);
  const dataLoc = encodeURIComponent(s.location || "");
  return `<button class="map-icon-btn" data-url="${dataUrl}" data-loc="${dataLoc}" onclick="onMapBtnClick(this)" title="지도 열기">🗺️</button>`;
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

  if (scheduleEditMode) {
    const cats = getCategories("schedule");
    tbody.innerHTML = items.map(s => renderScheduleEditModeRow(s, cats)).join("");
  } else {
    tbody.innerHTML = items.map(s => {
      const catBadge = s.category ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")}"> ${s.category}</span>` : "-";
      const mapBtn = buildMapBtn(s);
      const notesDisplay = s.mapUrl && isUrl(s.notes) ? "-" : renderLink(s.notes, "비고");
      return `<tr>
        <td>${catBadge}</td>
        <td style="white-space:nowrap;font-size:0.78rem">${formatDateShort(s.date)}</td>
        <td style="color:var(--text-muted);white-space:nowrap;font-size:0.78rem">${s.time||"-"}</td>
        <td>${escHtml(s.location)||"-"}</td>
        <td style="word-break:break-word">${escHtml(s.content)||"-"}</td>
        <td>${getTransBadge(s.transportation)}</td>
        <td>${notesDisplay}</td>
        <td style="text-align:center">${mapBtn}</td>
        <td style="width:0;padding:0"></td>
      </tr>`;
    }).join("");
  }
}

// 편집 모드 행 — 체크박스만, 저장/삭제 버튼 없음
function renderScheduleEditModeRow(s, cats) {
  const catOptions = cats.map(c => `<option${c===s.category?" selected":""}>${c}</option>`).join("");
  const mapUrl = s.mapUrl || (isUrl(s.notes) ? s.notes : "");
  const notesVal = s.mapUrl ? (s.notes||"") : (isUrl(s.notes) ? "" : (s.notes||""));
  const isChecked = dirtyScheduleIds.has(s.id);
  return `<tr class="em-row" data-id="${s.id}">
    <td><select id="em-cat-${s.id}" style="min-width:60px" onchange="markDirty('schedule','${s.id}')"><option value="">분류</option>${catOptions}</select></td>
    <td><input type="date" id="em-date-${s.id}" value="${s.date||""}" style="min-width:100px" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="time" id="em-time-${s.id}" value="${s.time||""}" style="min-width:70px" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-loc-${s.id}" value="${escHtml(s.location)}" placeholder="장소" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-content-${s.id}" value="${escHtml(s.content)}" placeholder="내용" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-trans-${s.id}" value="${escHtml(s.transportation)}" placeholder="교통편" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="text" id="em-notes-${s.id}" value="${escHtml(notesVal)}" placeholder="비고" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td><input type="url" id="em-mapurl-${s.id}" value="${escHtml(mapUrl)}" placeholder="지도 링크" style="min-width:100px" oninput="markDirty('schedule','${s.id}')" onkeydown="handleEditKeydown(event,'schedule')" /></td>
    <td style="text-align:center;padding:4px 4px">
      <input type="checkbox" class="row-check sch-row-check" id="sch-check-${s.id}" data-id="${s.id}" ${isChecked?"checked":""} onchange="onRowCheckChange('schedule')" />
    </td>
  </tr>`;
}

// Enter=저장, Esc=편집모드 종료
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

// 단건 저장 (saveChecked에서 호출, silent=true 이면 toast 없음)
// 로컬 scheduleItems 배열을 즉시 업데이트해 Firestore 캐시 롤백을 방지함
async function saveEditModeRow(id, silent) {
  const date = document.getElementById("em-date-" + id)?.value;
  if (!date) { if (!silent) showToast("날짜를 입력해주세요"); return false; }
  const mapUrl = document.getElementById("em-mapurl-" + id)?.value.trim() || null;
  const notesRaw = document.getElementById("em-notes-" + id)?.value.trim() || null;
  const updateData = {
    category: document.getElementById("em-cat-" + id)?.value || null,
    date,
    time: document.getElementById("em-time-" + id)?.value || null,
    location: document.getElementById("em-loc-" + id)?.value.trim() || null,
    content: document.getElementById("em-content-" + id)?.value.trim() || null,
    transportation: document.getElementById("em-trans-" + id)?.value.trim() || null,
    notes: notesRaw,
    mapUrl: isUrl(mapUrl) ? mapUrl : null,
  };
  await schedulesRef().doc(id).update(updateData);
  // 로컬 배열 즉시 반영
  const idx = scheduleItems.findIndex(s => s.id === id);
  if (idx !== -1) scheduleItems[idx] = { ...scheduleItems[idx], ...updateData };
  if (!silent) showToast("저장 완료 ✅");
  return true;
}

function startEditSchedule(id) { scheduleEditId = id; loadSchedules(); }
function cancelEditSchedule() { scheduleEditId = null; loadSchedules(); }

async function saveScheduleRow() {
  const date = document.getElementById("sch-add-date").value;
  if (!date) { showToast("날짜를 입력해주세요"); return; }
  const mapUrlRaw = document.getElementById("sch-add-mapurl")?.value.trim() || null;
  await schedulesRef().add({
    category: document.getElementById("sch-add-cat").value || null,
    date,
    time: document.getElementById("sch-add-time").value || null,
    location: document.getElementById("sch-add-loc").value.trim() || null,
    content: document.getElementById("sch-add-content").value.trim() || null,
    transportation: document.getElementById("sch-add-trans").value.trim() || null,
    notes: document.getElementById("sch-add-notes").value.trim() || null,
    mapUrl: isUrl(mapUrlRaw) ? mapUrlRaw : null,
  });
  showToast("일정 추가 완료 🎉");
  ["sch-add-cat","sch-add-time","sch-add-loc","sch-add-content","sch-add-trans","sch-add-notes","sch-add-mapurl"]
    .forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  loadSchedules();
}

async function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;
  await schedulesRef().doc(id).delete();
  showToast("삭제됐어요 🗑️"); loadSchedules();
}

function renderTimetable(items) {
  const c = document.getElementById("schedule-timetable-view");
  const filtered = items.filter(s => s.category !== "이동");
  if (!filtered.length) { c.innerHTML = `<div class="empty-msg">📅 일정을 추가해보세요 (이동 분류는 숨겨집니다)</div>`; return; }
  const byDate = {};
  filtered.forEach(s => { const d = s.date || "미정"; (byDate[d] = byDate[d] || []).push(s); });
  c.innerHTML = Object.keys(byDate).sort().map(date => `
    <div class="timetable-day">
      <div class="timetable-day-label">📅 ${formatDateShort(date)}</div>
      <div class="timetable-items">
        ${byDate[date].sort((a,b)=>(a.time||"").localeCompare(b.time||"")).map(s => `
          <div class="timetable-item">
            <div class="timetable-time">${s.time||""}</div>
            <div class="timetable-info">
              <h4>${escHtml(s.location || s.content || "(미입력)")}${s.category?` <span class="badge badge-${s.category.replace(/\//g,"\\/")}"> ${s.category}</span>`:""}</h4>
              ${s.content && s.location ? `<p>${escHtml(s.content)}</p>` : ""}
              ${s.transportation ? `<p>${getTransBadge(s.transportation)}</p>` : ""}
              ${s.notes && !isUrl(s.notes) ? `<p style="color:var(--text-muted)">${escHtml(s.notes)}</p>` : ""}
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
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
  loadExpenses();
  if (expenseEditMode) updateCheckedCount("expense");
}

function toggleExpenseAddForm() {
  expenseAddOpen = !expenseAddOpen;
  const wrap = document.getElementById("expense-add-wrap");
  if (wrap) wrap.classList.toggle("hidden", !expenseAddOpen);
  if (expenseAddOpen) {
    setTimeout(() => document.getElementById("exp-add-title")?.focus(), 80);
  }
}

async function loadExpenses() {
  const snap = await expensesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  expenseItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  expenseItems.sort((a,b) => (a.date||"").localeCompare(b.date||""));
  renderExpenses(expenseItems);
}

function renderExpenses(items) {
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  let totalKrw = 0, totalForeign = 0;
  items.forEach(e => { totalKrw += e.amountKrw || 0; totalForeign += e.amountForeign || 0; });
  document.getElementById("total-krw-display").innerHTML = `<strong>${totalKrw.toLocaleString()}원</strong>`;
  document.getElementById("total-foreign-display").textContent = sym && totalForeign ? sym + totalForeign.toLocaleString() : "";
  document.getElementById("expense-summary-display").textContent =
    `합계 ${totalKrw.toLocaleString()}원${sym && totalForeign ? " / " + sym + totalForeign.toLocaleString() : ""}`;
  document.getElementById("trip-budget-display").textContent = totalKrw.toLocaleString() + "원";
  refreshCategorySelects();
  const tbody = document.getElementById("expense-tbody");
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">💸 아래 "추가" 버튼에서 지출을 추가하세요</td></tr>`;
    return;
  }
  if (expenseEditMode) {
    const cats = getCategories("expense");
    tbody.innerHTML = items.map(e => renderExpenseEditModeRow(e, sym, cats)).join("");
  } else {
    tbody.innerHTML = items.map(e => `<tr>
      <td>${e.category ? `<span class="badge badge-${escHtml(e.category)}">${escHtml(e.category)}</span>` : "-"}</td>
      <td style="white-space:nowrap;font-size:0.78rem">${formatDateShort(e.date)}</td>
      <td style="word-break:break-word">${escHtml(e.title)}</td>
      <td style="text-align:right;font-weight:700">${e.amountKrw!=null ? e.amountKrw.toLocaleString()+"원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${e.amountForeign!=null && sym ? sym+e.amountForeign.toLocaleString() : "-"}</td>
      <td style="width:0;padding:0"></td>
    </tr>`).join("");
  }
}

// 편집 모드 행 — 체크박스만
function renderExpenseEditModeRow(e, sym, cats) {
  const catOptions = cats.map(c => `<option${c===e.category?" selected":""}>${c}</option>`).join("");
  const isChecked = dirtyExpenseIds.has(e.id);
  return `<tr class="em-row" data-id="${e.id}">
    <td><select id="em-exp-cat-${e.id}" onchange="markDirty('expense','${e.id}')"><option value="">선택</option>${catOptions}</select></td>
    <td><input type="date" id="em-exp-date-${e.id}" value="${e.date||""}" style="min-width:100px" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td><input type="text" id="em-exp-title-${e.id}" value="${escHtml(e.title)}" placeholder="제목" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td><input type="number" id="em-exp-krw-${e.id}" value="${e.amountKrw??""}" style="text-align:right" placeholder="원화" oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td><input type="number" id="em-exp-foreign-${e.id}" value="${e.amountForeign??""}" style="text-align:right" placeholder="외화" ${!sym?"disabled":""} oninput="markDirty('expense','${e.id}')" onkeydown="handleEditKeydown(event,'expense')" /></td>
    <td style="text-align:center;padding:4px 4px">
      <input type="checkbox" class="row-check exp-row-check" id="exp-check-${e.id}" data-id="${e.id}" ${isChecked?"checked":""} onchange="onRowCheckChange('expense')" />
    </td>
  </tr>`;
}

async function saveExpenseEditModeRow(id, silent) {
  const title = document.getElementById("em-exp-title-" + id)?.value.trim();
  if (!title) { if (!silent) showToast("제목을 입력해주세요"); return false; }
  const updateData = {
    category: document.getElementById("em-exp-cat-" + id)?.value || null,
    date: document.getElementById("em-exp-date-" + id)?.value || null,
    title,
    amountKrw: document.getElementById("em-exp-krw-" + id)?.value ? parseInt(document.getElementById("em-exp-krw-" + id).value) : null,
    amountForeign: document.getElementById("em-exp-foreign-" + id)?.value ? parseFloat(document.getElementById("em-exp-foreign-" + id).value) : null,
  };
  await expensesRef().doc(id).update(updateData);
  // 로컬 배열 즉시 반영
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
  await expensesRef().doc(id).delete(); showToast("삭제됐어요 🗑️"); loadExpenses();
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
    <div class="form-row"><div class="form-group full"><label>비고 / 링크</label><input type="text" id="rf-notes" /></div></div>
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
    <div class="form-row"><div class="form-group full"><label>비고 / 링크</label><input type="text" id="rf-notes" /></div></div>
    ${btn}`;
  return `
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input type="date" id="rf-date" /></div>
      <div class="form-group"><label>분류</label><input type="text" id="rf-subcat" placeholder="체험, 입장권 등" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>예약명 / 장소 *</label><input type="text" id="rf-title" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>예약번호</label><input type="text" id="rf-number" /></div>
      <div class="form-group"><label>비고 / 링크</label><input type="text" id="rf-notes" /></div>
    </div>
    ${btn}`;
}

// 예약 수정 폼 (기존 데이터 미리 채워짐)
function buildResEditFormHtml(type, item) {
  const btn = `<div class="sub-form-actions">
    <button class="btn btn-ghost btn-sm" onclick="cancelResEdit()">취소</button>
    <button class="btn btn-primary btn-sm" onclick="updateReservation('${item.id}','${type}')">수정저장</button>
  </div>`;
  if (type === "항공") return `
    <div style="font-size:0.76rem;font-weight:700;color:var(--pd);margin-bottom:6px">✏️ 수정 중</div>
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
    <div class="form-row"><div class="form-group full"><label>비고 / 링크</label><input type="text" id="ef-notes" value="${escHtml(item.notes)}" /></div></div>
    ${btn}`;
  if (type === "숙소") return `
    <div style="font-size:0.76rem;font-weight:700;color:var(--pd);margin-bottom:6px">✏️ 수정 중</div>
    <div class="form-row"><div class="form-group full"><label>숙소명 *</label><input type="text" id="ef-title" value="${escHtml(item.title)}" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>체크인</label><input type="datetime-local" id="ef-checkin" value="${item.checkin||""}" /></div>
      <div class="form-group"><label>체크아웃</label><input type="datetime-local" id="ef-checkout" value="${item.checkout||""}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>전화번호</label><input type="text" id="ef-phone" value="${escHtml(item.phone)}" /></div>
      <div class="form-group"><label>예약확인번호</label><input type="text" id="ef-number" value="${escHtml(item.reservationNumber)}" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>비고 / 링크</label><input type="text" id="ef-notes" value="${escHtml(item.notes)}" /></div></div>
    ${btn}`;
  return `
    <div style="font-size:0.76rem;font-weight:700;color:var(--pd);margin-bottom:6px">✏️ 수정 중</div>
    <div class="form-row">
      <div class="form-group"><label>날짜</label><input type="date" id="ef-date" value="${item.date||""}" /></div>
      <div class="form-group"><label>분류</label><input type="text" id="ef-subcat" value="${escHtml(item.subCategory)}" /></div>
    </div>
    <div class="form-row"><div class="form-group full"><label>예약명 / 장소 *</label><input type="text" id="ef-title" value="${escHtml(item.title)}" /></div></div>
    <div class="form-row">
      <div class="form-group"><label>예약번호</label><input type="text" id="ef-number" value="${escHtml(item.reservationNumber)}" /></div>
      <div class="form-group"><label>비고 / 링크</label><input type="text" id="ef-notes" value="${escHtml(item.notes)}" /></div>
    </div>
    ${btn}`;
}

function closeResForm(type) { document.getElementById("res-form-" + type)?.classList.add("hidden"); }

async function saveReservation(type) {
  let data = { type, notes: document.getElementById("rf-notes")?.value.trim() || null };
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
      list.innerHTML = `<div class="empty-msg" style="padding:12px;font-size:0.78rem">${type} 예약 없음</div>`;
      return;
    }
    list.innerHTML = ti.map(r => {
      // 수정 중인 아이템이면 인라인 폼 렌더
      if (resEditMode && r.id === resEditItemId) {
        return `<div class="res-item res-edit-form-wrap">${buildResEditFormHtml(type, r)}</div>`;
      }
      const notesHtml = r.notes ? `<p>${renderLink(r.notes)}</p>` : "";
      const chkHtml = resEditMode
        ? `<input type="checkbox" class="res-item-check res-row-check" data-id="${r.id}" onchange="onRowCheckChange('res')" />`
        : "";
      const actions = resEditMode ? `
        <div class="res-actions">
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="editReservation('${r.id}','${type}')">✏️</button>
        </div>` : "";
      return `<div class="res-item">
        ${chkHtml}
        <div class="res-info">
          <h4>${escHtml(r.title) || "-"}</h4>
          ${type==="항공" ? `<p>${[r.depart?.replace("T"," "), r.arrive?.replace("T"," "), r.flight, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${type==="숙소" ? `<p>${[r.checkin?.replace("T"," "), r.checkout?.replace("T"," "), r.phone, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${type==="기타" ? `<p>${[r.date, r.subCategory, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${notesHtml}
        </div>
        ${actions}
      </div>`;
    }).join("");
  });
  if (resEditMode) updateCheckedCount("res");
}

// 예약 인라인 수정 열기
function editReservation(id, type) {
  resEditItemId = id;
  // 추가 폼 닫기
  ["항공","숙소","기타"].forEach(t => document.getElementById("res-form-" + t)?.classList.add("hidden"));
  loadReservations(); // 해당 아이템을 폼으로 렌더
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
  let data = { notes: document.getElementById("ef-notes")?.value.trim() || null };
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
  await reservationsRef().doc(id).delete(); showToast("삭제됐어요 🗑️"); loadReservations();
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
  localStorage.setItem("trip_bucket_region", val);
  renderTripBucket(allBucketItems);
}

async function loadTripBucketItems() {
  if (!currentUser) return;
  const saved = localStorage.getItem("trip_bucket_region") || "";
  const inp = document.getElementById("trip-bucket-region");
  if (inp && inp.value === "" && saved) inp.value = saved;
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
    board.innerHTML = `<div class="empty-msg" style="grid-column:1/-1;padding:24px">⭐ 아직 없어요. + 추가 버튼으로 시작해보세요!</div>`;
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
        ${catItems.map(item => `
          <div class="wish-item ${item.visited?"visited":""}">
            <button class="visit-toggle ${item.visited?"done":""}" onclick="toggleVisited('${item.id}',${item.visited})">${item.visited?"✓":""}</button>
            <div class="wish-item-text">
              <div class="wish-item-name ${item.visited?"done":""}">${escHtml(item.placeName)}</div>
              ${item.region||item.country ? `<div class="wish-item-sub">${[item.region,item.country].filter(Boolean).map(escHtml).join(", ")}</div>` : ""}
            </div>
            <div class="wish-item-actions">
              <button class="btn btn-ghost btn-icon" style="font-size:0.72rem" onclick="deleteBucketItem('${item.id}')">🗑️</button>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
  }).filter(Boolean).join("");
}

function openTripBucketModal(editId) {
  tripBucketEditId = editId || null;
  const regionFilter = (document.getElementById("trip-bucket-region")?.value || "").trim();
  if (!editId) {
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
  await bucketRef().doc(id).delete(); showToast("삭제됐어요 🗑️"); reloadBucketAll();
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

// 버킷 추가 모달
function openBucketAddModal(editId) {
  bucketAddModalEditId = editId || null;
  if (!editId) {
    ["bam-place","bam-country","bam-region","bam-notes"].forEach(id => { const el = document.getElementById(id); if(el) el.value=""; });
    document.getElementById("bam-season").value = "";
    document.getElementById("bam-visited").checked = false;
  }
  const titleEl = document.getElementById("bucket-add-modal-title");
  const saveBtn = document.getElementById("bam-save-btn");
  if (titleEl) titleEl.textContent = editId ? "⭐ 장소 수정" : "⭐ 장소 추가";
  if (saveBtn) saveBtn.textContent = editId ? "수정하기" : "추가하기";
  const sel = document.getElementById("bam-type");
  if (sel) {
    sel.innerHTML = '<option value="">선택</option>' + getCategories("bucket").map(c => `<option>${c}</option>`).join("");
  }
  openModal("modal-bucket-add");
  setTimeout(() => document.getElementById("bam-place").focus(), 80);
}

async function openBucketAddModalForEdit(id) {
  const item = allBucketItems.find(i => i.id === id);
  if (!item) return;
  openBucketAddModal(id);
  setTimeout(() => {
    document.getElementById("bam-place").value = item.placeName || "";
    document.getElementById("bam-country").value = item.country || "";
    document.getElementById("bam-region").value = item.region || "";
    document.getElementById("bam-notes").value = item.notes || "";
    document.getElementById("bam-season").value = item.season || "";
    document.getElementById("bam-visited").checked = item.visited || false;
    const sel = document.getElementById("bam-type");
    if (sel) sel.value = item.category || "";
  }, 50);
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
    await bucketRef().add(data); showToast("추가됐어요 ⭐");
  }
  closeModal("modal-bucket-add");
  reloadBucketAll();
}

// 버킷 편집모드 인라인 행
function renderBucketEditModeRow(item) {
  const cats = getCategories("bucket");
  const catOptions = cats.map(c => `<option${c===item.category?" selected":""}>${c}</option>`).join("");
  const isChecked = dirtyBucketIds.has(item.id);
  return `<tr class="em-row" data-id="${item.id}">
    <td></td>
    <td><select id="em-bkt-cat-${item.id}" onchange="markDirty('bucket','${item.id}')"><option value="">선택</option>${catOptions}</select></td>
    <td><input type="text" id="em-bkt-country-${item.id}" value="${escHtml(item.country)}" placeholder="나라" oninput="markDirty('bucket','${item.id}')" onkeydown="handleEditKeydown(event,'bucket')" /></td>
    <td><input type="text" id="em-bkt-region-${item.id}" value="${escHtml(item.region)}" placeholder="지역" oninput="markDirty('bucket','${item.id}')" onkeydown="handleEditKeydown(event,'bucket')" /></td>
    <td><input type="text" id="em-bkt-place-${item.id}" value="${escHtml(item.placeName)}" placeholder="장소명" oninput="markDirty('bucket','${item.id}')" onkeydown="handleEditKeydown(event,'bucket')" /></td>
    <td><select id="em-bkt-season-${item.id}" onchange="markDirty('bucket','${item.id}')">
      <option value="">-</option>
      ${["봄","여름","가을","겨울","연중"].map(s=>`<option${s===item.season?" selected":""}>${s}</option>`).join("")}
    </select></td>
    <td><input type="text" id="em-bkt-notes-${item.id}" value="${escHtml(item.notes)}" placeholder="비고" oninput="markDirty('bucket','${item.id}')" onkeydown="handleEditKeydown(event,'bucket')" /></td>
    <td style="text-align:center;padding:4px 4px">
      <input type="checkbox" class="row-check bkt-row-check" id="bkt-check-${item.id}" data-id="${item.id}" ${isChecked?"checked":""} onchange="onRowCheckChange('bucket')" />
    </td>
  </tr>`;
}

async function saveBucketEditModeRow(id, silent) {
  const placeName = document.getElementById("em-bkt-place-" + id)?.value.trim();
  if (!placeName) { if (!silent) showToast("장소명을 입력해주세요"); return; }
  await bucketRef().doc(id).update({
    placeName,
    category: document.getElementById("em-bkt-cat-" + id)?.value || "기타",
    country: document.getElementById("em-bkt-country-" + id)?.value.trim() || null,
    region: document.getElementById("em-bkt-region-" + id)?.value.trim() || null,
    season: document.getElementById("em-bkt-season-" + id)?.value || null,
    notes: document.getElementById("em-bkt-notes-" + id)?.value.trim() || null,
  });
  if (!silent) showToast("저장 완료 ✅");
}

// ---- 컬럼 드롭다운 메뉴 ----
function toggleColMenu(col, btn) {
  const ddId = "col-dd-" + col;
  const dd = document.getElementById(ddId);
  if (!dd) return;

  document.querySelectorAll(".col-dropdown.open").forEach(el => {
    if (el.id !== ddId) el.classList.remove("open");
  });

  if (dd.classList.contains("open")) {
    dd.classList.remove("open");
    activeColMenu = null;
    return;
  }

  const curFilter = bucketColFilters[col] || "";
  dd.innerHTML = `
    <button class="col-dd-btn" onclick="setBucketSort('${col}','asc');closeColMenus()">↑ 오름차순</button>
    <button class="col-dd-btn" onclick="setBucketSort('${col}','desc');closeColMenus()">↓ 내림차순</button>
    <div class="col-dd-sep"></div>
    <div class="col-dd-filter">
      <input type="text" placeholder="검색..." value="${escHtml(curFilter)}"
        id="col-filter-input-${col}"
        oninput="setBucketColFilter('${col}',this.value)"
        onkeydown="if(event.key==='Escape')closeColMenus()"
      />
    </div>
    <button class="col-dd-btn" onclick="resetColFilter('${col}');closeColMenus()" style="color:#dc2626">✕ 필터 초기화</button>
  `;
  dd.classList.add("open");
  activeColMenu = col;
  setTimeout(() => document.getElementById("col-filter-input-" + col)?.focus(), 60);
}

function closeColMenus() {
  document.querySelectorAll(".col-dropdown.open").forEach(el => el.classList.remove("open"));
  activeColMenu = null;
}

function setBucketColFilter(col, val) {
  bucketColFilters[col] = val.toLowerCase();
  renderBucketList();
}

function resetColFilter(col) {
  delete bucketColFilters[col];
  renderBucketList();
  updateBucketSortHeaders();
}

function setBucketSort(col, dir) {
  bucketSortCol = col;
  bucketSortDir = dir || "asc";
  updateBucketSortHeaders();
  renderBucketList();
}

function updateBucketSortHeaders() {
  document.querySelectorAll(".bucket-list-table th.col-sortable").forEach(th => {
    const col = th.dataset.col;
    const btn = th.querySelector(".col-menu-btn");
    if (!btn) return;
    if (col === bucketSortCol || bucketColFilters[col]) {
      btn.classList.add("col-active-sort");
    } else {
      btn.classList.remove("col-active-sort");
    }
  });
}

function applySortToBucket(items) {
  if (!bucketSortCol) return items;
  return [...items].sort((a, b) => {
    const va = (a[bucketSortCol] || "").toString().toLowerCase();
    const vb = (b[bucketSortCol] || "").toString().toLowerCase();
    const cmp = va.localeCompare(vb, "ko");
    return bucketSortDir === "asc" ? cmp : -cmp;
  });
}

function renderBucketList() {
  const tbody = document.getElementById("bucket-list-tbody"); if (!tbody) return;

  let items = [...allBucketItems];

  if (bucketRegionTab === "domestic") {
    items = items.filter(i => ["한국","국내"].includes(i.country || ""));
  } else if (bucketRegionTab === "overseas") {
    items = items.filter(i => !["한국","국내"].includes(i.country || "") && i.country);
  }

  Object.entries(bucketColFilters).forEach(([col, val]) => {
    items = items.filter(i => (i[col] || "").toLowerCase().includes(val));
  });

  items = applySortToBucket(items);

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">⭐ 결과가 없어요</td></tr>`;
    return;
  }

  if (bucketEditMode) {
    tbody.innerHTML = items.map(item => renderBucketEditModeRow(item)).join("");
  } else {
    tbody.innerHTML = items.map(item => `<tr class="${item.visited?"done-row":""}">
      <td><button class="visit-toggle ${item.visited?"done":""}" onclick="toggleVisited('${item.id}',${item.visited})">${item.visited?"✓":""}</button></td>
      <td>${item.category ? `<span class="badge badge-${escHtml(item.category)}">${escHtml(item.category)}</span>` : "-"}</td>
      <td>${escHtml(item.country)||"-"}</td>
      <td>${escHtml(item.region)||"-"}</td>
      <td style="font-weight:700">${escHtml(item.placeName)}</td>
      <td>${escHtml(item.season)||"-"}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${renderLink(item.notes) || "-"}</td>
      <td style="width:0;padding:0;overflow:hidden"></td>
    </tr>`).join("");
  }

  updateBucketSortHeaders();
  if (bucketEditMode) updateCheckedCount("bucket");
}

function renderBucketEditRow(item) {
  const cats = getCategories("bucket");
  return `<tr class="edit-row">
    <td></td>
    <td><select id="ebc-cat"><option value="">선택</option>${cats.map(c=>`<option${c===item.category?" selected":""}>${c}</option>`).join("")}</select></td>
    <td><input type="text" id="ebc-country" value="${escHtml(item.country)}" /></td>
    <td><input type="text" id="ebc-region" value="${escHtml(item.region)}" /></td>
    <td><input type="text" id="ebc-place" value="${escHtml(item.placeName)}" /></td>
    <td>
      <select id="ebc-season">
        <option value="">-</option>
        ${["봄","여름","가을","겨울","연중"].map(s=>`<option${s===item.season?" selected":""}>${s}</option>`).join("")}
      </select>
    </td>
    <td><input type="text" id="ebc-notes" value="${escHtml(item.notes)}" /></td>
    <td style="white-space:nowrap">
      <button class="add-btn" onclick="updateBucket('${item.id}')">저장</button>
      <button class="cancel-btn" onclick="cancelEditBucket()">취소</button>
    </td>
  </tr>`;
}

function startEditBucket(id) { bucketEditId = id; renderBucketList(); }
function cancelEditBucket() { bucketEditId = null; renderBucketList(); }

async function updateBucket(id) {
  const placeName = document.getElementById("ebc-place").value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요"); return; }
  await bucketRef().doc(id).update({
    placeName,
    category: document.getElementById("ebc-cat").value || "기타",
    country: document.getElementById("ebc-country").value.trim() || null,
    region: document.getElementById("ebc-region").value.trim() || null,
    season: document.getElementById("ebc-season").value || null,
    notes: document.getElementById("ebc-notes").value.trim() || null,
  });
  showToast("수정 완료 ✅"); bucketEditId = null; reloadBucketAll();
}

// ============================================================
// SEED DATA
// ============================================================
async function seedSampleData() {
  if (!currentUser) { showToast("먼저 로그인해주세요!"); return; }
  if (!confirm("삿포로 여행 일정과 버킷플레이스 데이터를 가져올까요?\n(기존 데이터는 유지됩니다)")) return;

  const btn = document.getElementById("seed-btn");
  btn.textContent = "⏳ 가져오는 중..."; btn.disabled = true;

  try {
    const tripRef = await tripsRef().add({
      title: "삿포로 여행",
      country: "일본", city: "삿포로",
      startDate: "2024-09-27", endDate: "2024-09-30",
      companions: "혼자",
      foreignCurrency: "JPY", exchangeRate: 9.2,
      mapLink: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const scheduleData = [
      {location:"일본 도착(신치토세 공항)", transportation:null, date:"2024-09-27", time:"13:30", content:"길 헤매는 거 30분 포함해야 함.", category:"이동", notes:null, mapUrl:null},
      {location:"삿포로 이동", transportation:"기차", date:"2024-09-27", time:"14:30", content:"JR쾌속선 타고 이동(1,150~1550엔)", category:"이동", notes:null, mapUrl:null},
      {location:"호텔 도착/짐 정리", transportation:null, date:"2024-09-27", time:"16:00", content:"호텔 플러스 호스텔", category:"숙소", notes:null, mapUrl:null},
      {location:"오도리공원", transportation:"도보", date:"2024-09-27", time:"16:30", content:"공원 구경 하고 시계탑 갈거야", category:"관광", notes:null, mapUrl:"https://maps.app.goo.gl/DHeB6YU3qewBYtqY7"},
      {location:"시계탑", transportation:"도보", date:"2024-09-27", time:"17:30", content:"시계탑 구경할거야", category:"관광", notes:null, mapUrl:"https://maps.app.goo.gl/ob4yzCabsgKDCTDk7"},
      {location:"잇페코페 돈까스", transportation:"도보", date:"2024-09-27", time:"18:00", content:"밥 먹어", category:"식사", notes:null, mapUrl:null},
      {location:"마지산도", transportation:"도보", date:"2024-09-27", time:"18:30", content:"맛있겠다", category:"카페", notes:null, mapUrl:null},
      {location:"다누키코지 상점가", transportation:"도보", date:"2024-09-27", time:"20:00", content:"구경", category:"관광", notes:null, mapUrl:"https://maps.app.goo.gl/oMw4FrN139hdHip97"},
    ];

    const schBatch = db.batch();
    scheduleData.forEach(s => {
      schBatch.set(tripsRef().doc(tripRef.id).collection("schedules").doc(), s);
    });
    await schBatch.commit();

    await tripsRef().doc(tripRef.id).collection("reservations").add({
      type: "숙소", title: "호텔 플러스 호스텔",
      date: "2024-09-27", reservationNumber: "1697650178",
      notes: "https://maps.app.goo.gl/HwnZL5QzAwDSAaQD8",
      checkin: null, checkout: null, phone: null,
    });

    const bucketData = [
      {placeName:"안반데기", season:null, country:"한국", notes:null, category:"풍경", region:"강원도"},
      {placeName:"태백산", season:null, country:"한국", notes:null, category:"풍경", region:"강원도"},
      {placeName:"사가노 대나무 숲", season:"가을", country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"기요미즈데라", season:"가을", country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"이노다 커피", season:null, country:"일본", notes:"나폴리탄, 타마고 산도", category:"카페", region:"교토"},
      {placeName:"흰수염폭포", season:null, country:"일본", notes:null, category:"풍경", region:"훗카이도"},
      {placeName:"아오이이케", season:null, country:"일본", notes:null, category:"풍경", region:"훗카이도"},
    ];

    const existingSnap = await bucketRef().get();
    const existingNames = new Set(existingSnap.docs.map(d => d.data().placeName));
    const toAdd = bucketData.filter(b => !existingNames.has(b.placeName));

    const bkBatch = db.batch();
    toAdd.forEach(b => bkBatch.set(bucketRef().doc(), { ...b, visited: false }));
    await bkBatch.commit();

    showToast(`완료! 삿포로 일정 ${scheduleData.length}개, 버킷 ${toAdd.length}개 추가됐어요 🎉`);
    btn.textContent = "✅ 완료됨"; btn.disabled = false;
    loadTrips(); loadAllBucketItems(); calcStorage();
  } catch(e) {
    console.error(e);
    showToast("오류 발생: " + e.message);
    btn.textContent = "🗾 삿포로 샘플 데이터 가져오기"; btn.disabled = false;
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  refreshCategorySelects();
  renderAllCatTags();
  const mapEntryInp = document.getElementById("map-entry-input");
  if (mapEntryInp) mapEntryInp.addEventListener("input", updateMapEntryPreview);
});

// 외부 클릭 시 드롭다운 닫기
document.addEventListener("click", e => {
  if (!e.target.closest(".col-sortable") && !e.target.closest(".col-dropdown")) {
    closeColMenus();
  }
});

// 키보드 단축키
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    // 모달 열려있으면 먼저 닫기
    const openModals = ["modal-map-view","modal-map-entry","modal-bucket-trip","modal-bucket-add","modal-link-preview"];
    const anyOpen = openModals.some(id => !document.getElementById(id)?.classList.contains("hidden"));
    if (anyOpen) {
      openModals.forEach(id => closeModal(id));
      closeColMenus();
      return;
    }
    // 편집 모드 종료
    if (scheduleEditMode) { toggleScheduleEditMode(); return; }
    if (expenseEditMode)  { toggleExpenseEditMode();  return; }
    if (bucketEditMode)   { toggleBucketEditMode();   return; }
    if (resEditMode)      { toggleResEditMode();       return; }
    closeColMenus();
  }
});
