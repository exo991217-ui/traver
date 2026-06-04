// ============================================================
// 여행을 떠나자 — app.js (수정본 v5)
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
let bucketEditId = null;
let bucketEditMode = false;
let bucketAddModalEditId = null;
let tripBucketEditId = null;
let currentView = "table";
let tripFilter = "all";
let allBucketItems = [];
let bucketRegionTab = "all"; // all / domestic / overseas

// 버킷 정렬/필터 상태
let bucketSortCol = "";
let bucketSortDir = "asc";
let bucketColFilters = {}; // { country: "일본", ... }
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
  scheduleEditId = null;
  scheduleEditMode = false;
  scheduleAddOpen = false;
  expenseEditId = null;
  expenseEditMode = false;
  expenseAddOpen = false;
  resEditMode = false;
  const doc = await tripsRef().doc(tripId).get();
  currentTrip = { id: doc.id, ...doc.data() };
  renderTripInfo();
  refreshCategorySelects();
  loadSchedules(); loadExpenses(); loadReservations(); loadTripBucketItems();
  // 편집 모드 초기화
  const btn = document.getElementById("schedule-edit-mode-btn");
  if (btn) btn.classList.remove("active");
  const banner = document.getElementById("edit-mode-banner");
  if (banner) banner.classList.add("hidden");
  const table = document.getElementById("schedule-table");
  if (table) table.classList.remove("edit-mode-on");
  const expBtn = document.getElementById("expense-edit-mode-btn");
  if (expBtn) expBtn.classList.remove("active");
  const expBanner = document.getElementById("expense-edit-banner");
  if (expBanner) expBanner.classList.add("hidden");
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

// ---- 지도 링크 (여행지 우측 아이콘) ----
function openMapEntryModal() {
  const inp = document.getElementById("map-entry-input");
  if (inp) inp.value = currentTrip?.mapLink || "";
  updateMapEntryPreview();
  openModal("modal-map-entry");
  setTimeout(() => inp && inp.focus(), 80);
}

function updateMapEntryPreview() {
  const val = document.getElementById("map-entry-input")?.value.trim() || "";
  const row = document.getElementById("map-entry-preview-row");
  const link = document.getElementById("map-entry-preview-link");
  if (val && isUrl(val)) {
    row.classList.remove("hidden");
    link.href = val; link.textContent = val;
  } else {
    row.classList.add("hidden");
  }
}

async function saveTripMapLink() {
  const url = document.getElementById("map-entry-input").value.trim();
  currentTrip.mapLink = url || null;
  await tripsRef().doc(currentTripId).update({ mapLink: url || null });
  closeModal("modal-map-entry");
  updateMapEntryBtn();
  if (url) showToast("지도 연결 완료 🗺️");
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

// 지도 아이콘 클릭 (여행지 옆) — 지도가 있으면 모달 오픈, 없으면 입력 모달
function onMapEntryBtnClick() {
  if (currentTrip?.mapLink) {
    // 지도 있으면 보기 모달
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
  if (raw.includes("google.com/maps/d/")) {
    const m = raw.match(/mid=([^&]+)/);
    if (m) return "https://www.google.com/maps/d/embed?mid=" + m[1];
  }
  if (raw.includes("output=embed")) return raw;
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

// 일반 링크 미리보기 모달
function openLinkModal(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  const urlEl = document.getElementById("link-preview-url");
  const anchor = document.getElementById("link-preview-anchor");
  const frame = document.getElementById("link-preview-frame");
  if (urlEl) urlEl.textContent = url;
  if (anchor) { anchor.href = url; }
  if (frame) {
    // 지도 링크는 embed로, 나머지는 직접 시도
    const embedUrl = buildMapEmbedUrl(url);
    frame.src = embedUrl !== url ? embedUrl : url;
  }
  openModal("modal-link-preview");
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function isUrl(str) {
  return typeof str === "string" && (str.startsWith("http://") || str.startsWith("https://"));
}

// 날짜 표시: yyyy-mm-dd → dd/mm
function formatDateShort(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

// 링크 렌더링: URL이면 아이콘, 아니면 텍스트
function renderLink(val, title) {
  if (!val) return "-";
  if (isUrl(val)) {
    const enc = encodeURIComponent(val);
    return `<a class="link-icon" href="#" onclick="event.preventDefault();openLinkModal('${enc}')" title="${val}">🔗</a>`;
  }
  return escHtml(val);
}

// 교통편 색 뱃지
function getTransBadge(trans) {
  if (!trans) return "-";
  const t = trans.toLowerCase();
  let cls = "badge-trans-other";
  if (t.includes("기차") || t.includes("jr") || t.includes("열차") || t.includes("기철")) cls = "badge-trans-train";
  else if (t.includes("버스")) cls = "badge-trans-bus";
  else if (t.includes("택시")) cls = "badge-trans-taxi";
  else if (t.includes("도보") || t.includes("걷기") || t.includes("도")) cls = "badge-trans-walk";
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
// 편집 모드 토글 — 일정
// ============================================================
function toggleScheduleEditMode() {
  scheduleEditMode = !scheduleEditMode;
  const btn = document.getElementById("schedule-edit-mode-btn");
  const banner = document.getElementById("edit-mode-banner");
  const table = document.getElementById("schedule-table");
  const actionCol = document.getElementById("sch-action-col");
  if (btn) btn.classList.toggle("active", scheduleEditMode);
  if (banner) banner.classList.toggle("hidden", !scheduleEditMode);
  if (table) table.classList.toggle("edit-mode-on", scheduleEditMode);
  if (actionCol) { actionCol.style.width = scheduleEditMode ? "90px" : "0"; actionCol.style.padding = scheduleEditMode ? "8px 9px" : "0"; }
  if (scheduleEditMode) scheduleEditId = null;
  renderScheduleTable(scheduleItems);
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

// 지도 버튼 HTML
function buildMapBtn(s) {
  // mapUrl 우선, 없으면 notes의 URL 체크 (backward compat)
  const mapLink = s.mapUrl || (isUrl(s.notes) ? s.notes : null);
  if (!mapLink) return ""; // 링크 없으면 아이콘 없음
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
      if (scheduleEditId === s.id) return renderScheduleInlineEditRow(s);
      const catBadge = s.category ? `<span class="badge badge-${s.category.replace(/\//g,"\\/")}"> ${s.category}</span>` : "-";
      const mapBtn = buildMapBtn(s);
      // notes: URL이면 링크 아이콘, 아닌 경우 텍스트 (단, mapUrl로 저장된 경우 notes는 텍스트)
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

// 편집 모드 행 (모든 셀 input)
function renderScheduleEditModeRow(s, cats) {
  const catOptions = cats.map(c => `<option${c===s.category?" selected":""}>${c}</option>`).join("");
  const mapUrl = s.mapUrl || (isUrl(s.notes) ? s.notes : "");
  const notesVal = s.mapUrl ? (s.notes||"") : (isUrl(s.notes) ? "" : (s.notes||""));
  return `<tr class="em-row" data-id="${s.id}">
    <td><select id="em-cat-${s.id}" style="min-width:60px"><option value="">분류</option>${catOptions}</select></td>
    <td><input type="date" id="em-date-${s.id}" value="${s.date||""}" style="min-width:100px" /></td>
    <td><input type="time" id="em-time-${s.id}" value="${s.time||""}" style="min-width:70px" /></td>
    <td><input type="text" id="em-loc-${s.id}" value="${escHtml(s.location)}" placeholder="장소" /></td>
    <td><input type="text" id="em-content-${s.id}" value="${escHtml(s.content)}" placeholder="내용" /></td>
    <td><input type="text" id="em-trans-${s.id}" value="${escHtml(s.transportation)}" placeholder="교통편" /></td>
    <td><input type="text" id="em-notes-${s.id}" value="${escHtml(notesVal)}" placeholder="비고" /></td>
    <td><input type="url" id="em-mapurl-${s.id}" value="${escHtml(mapUrl)}" placeholder="지도 링크" style="min-width:100px" /></td>
    <td style="white-space:nowrap">
      <button class="add-btn" style="font-size:0.72rem;padding:3px 8px" onclick="saveEditModeRow('${s.id}')">저장</button>
      <button class="em-del-btn" onclick="deleteSchedule('${s.id}')" title="삭제">🗑</button>
    </td>
  </tr>`;
}

// 인라인 단건 편집 (편집 모드 아닌 경우 — 현재 사용 안 함)
function renderScheduleInlineEditRow(s) {
  const cats = getCategories("schedule");
  const mapUrl = s.mapUrl || (isUrl(s.notes) ? s.notes : "");
  const notesVal = s.mapUrl ? (s.notes||"") : (isUrl(s.notes) ? "" : (s.notes||""));
  return `<tr class="edit-row">
    <td><select id="esc-cat"><option value="">선택</option>${cats.map(c=>`<option${c===s.category?" selected":""}>${c}</option>`).join("")}</select></td>
    <td><input type="date" id="esc-date" value="${s.date||""}" /></td>
    <td><input type="time" id="esc-time" value="${s.time||""}" /></td>
    <td><input type="text" id="esc-loc" value="${s.location||""}" /></td>
    <td><input type="text" id="esc-content" value="${s.content||""}" /></td>
    <td><input type="text" id="esc-trans" value="${s.transportation||""}" /></td>
    <td><input type="text" id="esc-notes" value="${notesVal}" /></td>
    <td><input type="url" id="esc-mapurl" value="${mapUrl}" placeholder="지도 링크" /></td>
    <td style="white-space:nowrap">
      <button class="add-btn" onclick="updateSchedule('${s.id}')">저장</button>
      <button class="cancel-btn" onclick="cancelEditSchedule()">취소</button>
    </td>
  </tr>`;
}

async function saveEditModeRow(id) {
  const date = document.getElementById("em-date-" + id)?.value;
  if (!date) { showToast("날짜를 입력해주세요"); return; }
  const mapUrl = document.getElementById("em-mapurl-" + id)?.value.trim() || null;
  const notesRaw = document.getElementById("em-notes-" + id)?.value.trim() || null;
  await schedulesRef().doc(id).update({
    category: document.getElementById("em-cat-" + id)?.value || null,
    date,
    time: document.getElementById("em-time-" + id)?.value || null,
    location: document.getElementById("em-loc-" + id)?.value.trim() || null,
    content: document.getElementById("em-content-" + id)?.value.trim() || null,
    transportation: document.getElementById("em-trans-" + id)?.value.trim() || null,
    notes: notesRaw,
    mapUrl: isUrl(mapUrl) ? mapUrl : null,
  });
  showToast("저장 완료 ✅");
  loadSchedules();
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

async function updateSchedule(id) {
  const date = document.getElementById("esc-date").value;
  if (!date) { showToast("날짜를 입력해주세요"); return; }
  const mapUrlRaw = document.getElementById("esc-mapurl")?.value.trim() || null;
  await schedulesRef().doc(id).update({
    category: document.getElementById("esc-cat").value || null,
    date,
    time: document.getElementById("esc-time").value || null,
    location: document.getElementById("esc-loc").value.trim() || null,
    content: document.getElementById("esc-content").value.trim() || null,
    transportation: document.getElementById("esc-trans").value.trim() || null,
    notes: document.getElementById("esc-notes").value.trim() || null,
    mapUrl: isUrl(mapUrlRaw) ? mapUrlRaw : null,
  });
  showToast("수정 완료 ✅"); scheduleEditId = null; loadSchedules();
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
  const btn = document.getElementById("expense-edit-mode-btn");
  const banner = document.getElementById("expense-edit-banner");
  const table = document.getElementById("expense-table");
  const actionCol = document.getElementById("exp-action-col");
  if (btn) btn.classList.toggle("active", expenseEditMode);
  if (banner) banner.classList.toggle("hidden", !expenseEditMode);
  if (table) table.classList.toggle("edit-mode-on", expenseEditMode);
  if (actionCol) { actionCol.style.width = expenseEditMode ? "90px" : "0"; actionCol.style.padding = expenseEditMode ? "8px 9px" : "0"; }
  if (expenseEditMode) expenseEditId = null;
  loadExpenses();
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
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  items.sort((a,b) => (a.date||"").localeCompare(b.date||""));
  renderExpenses(items);
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
  tbody.innerHTML = items.map(e => {
    if (expenseEditId === e.id) return renderExpenseEditRow(e);
    return `<tr>
      <td>${e.category ? `<span class="badge badge-${escHtml(e.category)}">${escHtml(e.category)}</span>` : "-"}</td>
      <td style="white-space:nowrap;font-size:0.78rem">${formatDateShort(e.date)}</td>
      <td style="word-break:break-word">${escHtml(e.title)}</td>
      <td style="text-align:right;font-weight:700">${e.amountKrw!=null ? e.amountKrw.toLocaleString()+"원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${e.amountForeign!=null && sym ? sym+e.amountForeign.toLocaleString() : "-"}</td>
      <td style="white-space:nowrap;width:${expenseEditMode?"80px":"0"};padding:${expenseEditMode?"8px 9px":"0"};overflow:hidden">
        ${expenseEditMode ? `
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="startEditExpense('${e.id}')">✏️</button>
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="deleteExpense('${e.id}')">🗑️</button>
        ` : ""}
      </td>
    </tr>`;
  }).join("");
}

function renderExpenseEditRow(e) {
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  const cats = getCategories("expense");
  return `<tr class="edit-row">
    <td><select id="eec-cat"><option value="">선택</option>${cats.map(c=>`<option${c===e.category?" selected":""}>${c}</option>`).join("")}</select></td>
    <td><input type="date" id="eec-date" value="${e.date||""}" /></td>
    <td><input type="text" id="eec-title" value="${escHtml(e.title)}" /></td>
    <td><input type="number" id="eec-krw" value="${e.amountKrw??""}" style="text-align:right" /></td>
    <td><input type="number" id="eec-foreign" value="${e.amountForeign??""}" style="text-align:right" ${!sym?"disabled":""} /></td>
    <td style="white-space:nowrap">
      <button class="add-btn" onclick="updateExpense('${e.id}')">저장</button>
      <button class="cancel-btn" onclick="cancelEditExpense()">취소</button>
    </td>
  </tr>`;
}

function startEditExpense(id) { expenseEditId = id; loadExpenses(); }
function cancelEditExpense() { expenseEditId = null; loadExpenses(); }

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

async function updateExpense(id) {
  const title = document.getElementById("eec-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요"); return; }
  await expensesRef().doc(id).update({
    category: document.getElementById("eec-cat").value || null,
    date: document.getElementById("eec-date").value || null,
    title,
    amountKrw: document.getElementById("eec-krw").value ? parseInt(document.getElementById("eec-krw").value) : null,
    amountForeign: document.getElementById("eec-foreign").value ? parseFloat(document.getElementById("eec-foreign").value) : null,
  });
  showToast("수정 완료 ✅"); expenseEditId = null; loadExpenses();
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
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  ["항공","숙소","기타"].forEach(type => {
    const list = document.getElementById("res-list-" + type); if (!list) return;
    const ti = items.filter(r => r.type === type);
    if (!ti.length) {
      list.innerHTML = `<div class="empty-msg" style="padding:12px;font-size:0.78rem">${type} 예약 없음</div>`;
      return;
    }
    list.innerHTML = ti.map(r => {
      const notesHtml = r.notes ? `<p>${renderLink(r.notes)}</p>` : "";
      const actions = resEditMode ? `
        <div class="res-actions">
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="editReservation('${r.id}','${type}')">✏️</button>
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="deleteReservation('${r.id}')">🗑️</button>
        </div>` : "";
      return `<div class="res-item">
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
}

// 예약 편집 (간단 inline — 기존 폼 재사용)
function editReservation(id, type) {
  showToast("해당 예약을 삭제 후 다시 추가해주세요 (편집 예정)");
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
    if (catItems.length === 0) return ""; // 아이템 없는 카테고리는 표시 안 함
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
    // 지역 필터가 활성화된 경우 자동 입력
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
  const btn = document.getElementById("bucket-edit-mode-btn");
  const banner = document.getElementById("bucket-edit-banner");
  const actionCol = document.getElementById("bucket-action-col");
  if (btn) btn.classList.toggle("active", bucketEditMode);
  if (banner) banner.classList.toggle("hidden", !bucketEditMode);
  if (actionCol) { actionCol.style.width = bucketEditMode ? "80px" : "0"; actionCol.style.padding = bucketEditMode ? "8px 9px" : "0"; }
  if (bucketEditMode) bucketEditId = null;
  renderBucketList();
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
  // bam-type select 채우기
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

// ---- 컬럼 드롭다운 메뉴 ----
function toggleColMenu(col, btn) {
  const ddId = "col-dd-" + col;
  const dd = document.getElementById(ddId);
  if (!dd) return;

  // 다른 열린 메뉴 닫기
  document.querySelectorAll(".col-dropdown.open").forEach(el => {
    if (el.id !== ddId) el.classList.remove("open");
  });

  if (dd.classList.contains("open")) {
    dd.classList.remove("open");
    activeColMenu = null;
    return;
  }

  // 메뉴 내용 생성
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
  if (val.trim()) bucketColFilters[col] = val.trim().toLowerCase();
  else delete bucketColFilters[col];
  renderBucketList();
}

function resetColFilter(col) {
  delete bucketColFilters[col];
  renderBucketList();
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
    if (col === bucketSortCol) {
      btn.classList.add("col-active-sort");
    } else if (bucketColFilters[col]) {
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

  // 국내/해외 탭 필터
  if (bucketRegionTab === "domestic") {
    items = items.filter(i => ["한국","국내"].includes(i.country || ""));
  } else if (bucketRegionTab === "overseas") {
    items = items.filter(i => !["한국","국내"].includes(i.country || "") && i.country);
  }

  // 컬럼 필터 적용
  Object.entries(bucketColFilters).forEach(([col, val]) => {
    items = items.filter(i => (i[col] || "").toLowerCase().includes(val));
  });

  // 정렬 적용
  items = applySortToBucket(items);

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-msg">⭐ 결과가 없어요</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => {
    if (bucketEditId === item.id) return renderBucketEditRow(item);
    return `<tr class="${item.visited?"done-row":""}">
      <td><button class="visit-toggle ${item.visited?"done":""}" onclick="toggleVisited('${item.id}',${item.visited})">${item.visited?"✓":""}</button></td>
      <td>${item.category ? `<span class="badge badge-${escHtml(item.category)}">${escHtml(item.category)}</span>` : "-"}</td>
      <td>${escHtml(item.country)||"-"}</td>
      <td>${escHtml(item.region)||"-"}</td>
      <td style="font-weight:700">${escHtml(item.placeName)}</td>
      <td>${escHtml(item.season)||"-"}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${renderLink(item.notes) || "-"}</td>
      <td style="white-space:nowrap;width:${bucketEditMode?"80px":"0"};padding:${bucketEditMode?"8px 9px":"0"};overflow:hidden">
        ${bucketEditMode ? `
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="openBucketAddModalForEdit('${item.id}')">✏️</button>
          <button class="btn btn-ghost btn-icon" style="font-size:0.75rem" onclick="deleteBucketItem('${item.id}')">🗑️</button>
        ` : ""}
      </td>
    </tr>`;
  }).join("");

  updateBucketSortHeaders();
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
      {location:"비에이", transportation:"기차", date:"2024-09-28", time:"09:00", content:"JR쾌속선, 1시간 30분 소요", category:"이동", notes:null, mapUrl:null},
      {location:"비에이→아오이이케 이동", transportation:"버스", date:"2024-09-28", time:"10:30", content:"시로가네·아오이이케 방면 버스", category:"이동", notes:null, mapUrl:"https://maps.app.goo.gl/geu3We3ZdECSoqGZ8"},
      {location:"아오이이케", transportation:"버스", date:"2024-09-28", time:"11:00", content:"11시 정도 도착!", category:"관광", notes:null, mapUrl:null},
      {location:"흰수염폭포", transportation:"버스", date:"2024-09-28", time:"12:00", content:"제일 기대된다", category:"관광", notes:null, mapUrl:null},
      {location:"챠이", transportation:null, date:"2024-09-28", time:"13:30", content:"마파두부 먹어야지", category:"식사", notes:null, mapUrl:null},
      {location:"Biei Sabou", transportation:"도보", date:"2024-09-28", time:"16:00", content:"카페 가서 커피 좀 마시고 이동", category:"카페", notes:null, mapUrl:null},
      {location:"켄과 메리의 나무", transportation:"도보", date:"2024-09-28", time:"17:00", content:"이쁘겠당 / 18시까지 구경", category:"관광", notes:null, mapUrl:null},
      {location:"야키니쿠 라이크", transportation:"도보", date:"2024-09-28", time:"20:00", content:"1인 야키니쿠집", category:"식사", notes:null, mapUrl:"https://maps.app.goo.gl/1BQVjZDELSz2AKu59"},
      {location:"삿포로→오타루 이동", transportation:"기차", date:"2024-09-29", time:"11:00", content:"JR패스, 3~40분", category:"이동", notes:null, mapUrl:"https://maps.app.goo.gl/61YiL8NKdjDBVMVu9"},
      {location:"오타루 운하", transportation:null, date:"2024-09-29", time:"12:00", content:"운하 뱃놀이하기, 1시간 정도", category:"체험", notes:null, mapUrl:null},
      {location:"야부한 소바", transportation:"도보", date:"2024-09-29", time:"13:30", content:"밥 먹자", category:"식사", notes:null, mapUrl:null},
      {location:"기타이치 홀", transportation:"도보", date:"2024-09-29", time:"15:00", content:"엄청 이쁘겠다", category:"카페", notes:null, mapUrl:"https://maps.app.goo.gl/GuXUtjMY8eRwqVpR7"},
      {location:"오타루 오르골당", transportation:"도보", date:"2024-09-29", time:"15:30", content:"여행 목적", category:"쇼핑", notes:null, mapUrl:"https://maps.app.goo.gl/gQtBHvPwxSWL4DgM8"},
      {location:"에비소바 이치겐", transportation:"도보", date:"2024-09-29", time:"20:00", content:"밥 먹으러 가자", category:"식사", notes:null, mapUrl:"https://maps.app.goo.gl/sYHmSBfo4jX8GQ17"},
      {location:"수프카레 스아게", transportation:"도보", date:"2024-09-30", time:null, content:"밥 먹고 바로 이동", category:"식사", notes:null, mapUrl:null},
      {location:"나카지마 공원", transportation:"택시", date:"2024-09-30", time:null, content:"시간 상황 보고 구경 후 택시 이동", category:"관광", notes:null, mapUrl:null},
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
      {placeName:"인제 자작나무 숲", season:null, country:"한국", notes:null, category:"풍경", region:"강원도"},
      {placeName:"한산도", season:null, country:"한국", notes:null, category:"풍경", region:"경남 통영"},
      {placeName:"범물 맛집부추잡채", season:null, country:"한국", notes:null, category:"맛집", region:"대구"},
      {placeName:"빠뜨릭스 와플", season:null, country:"한국", notes:null, category:"카페", region:"서울"},
      {placeName:"탁신관", season:null, country:"일본", notes:"비에이", category:"기념품", region:"훗카이도"},
      {placeName:"대릉원", season:"여름", country:"한국", notes:null, category:"풍경", region:"경주"},
      {placeName:"연지공원", season:"봄, 여름", country:"한국", notes:null, category:"풍경", region:"김해"},
      {placeName:"우암사적공원", season:"봄", country:"한국", notes:null, category:"풍경", region:"대전"},
      {placeName:"순천만 습지", season:null, country:"한국", notes:null, category:"풍경", region:"순천"},
      {placeName:"사가노 대나무 숲", season:"가을", country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"기요미즈데라", season:"가을", country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"철학의 길", season:"가을", country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"이노다 커피", season:null, country:"일본", notes:"나폴리탄, 타마고 산도", category:"카페", region:"교토"},
      {placeName:"청수사", season:"가을", country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"아라시야마", season:null, country:"일본", notes:"센과 치히로", category:"풍경", region:"교토"},
      {placeName:"금각사", season:null, country:"일본", notes:null, category:"풍경", region:"교토"},
      {placeName:"니시키 시장", season:null, country:"일본", notes:"시장거리", category:"기념품", region:"교토"},
      {placeName:"흰수염폭포", season:null, country:"일본", notes:null, category:"풍경", region:"훗카이도"},
      {placeName:"아오이이케", season:null, country:"일본", notes:null, category:"풍경", region:"훗카이도"},
      {placeName:"오르골당", season:null, country:"일본", notes:"오타루", category:"기념품", region:"훗카이도"},
      {placeName:"잇페코페 돈까스", season:null, country:"일본", notes:"돈까스", category:"맛집", region:"훗카이도"},
      {placeName:"마지산도", season:null, country:"일본", notes:null, category:"카페", region:"훗카이도"},
      {placeName:"별밤사진관", season:null, country:"한국", notes:"38,000원", category:"체험", region:"제주도"},
      {placeName:"신창풍차해안도로", season:null, country:"한국", notes:null, category:"풍경", region:"제주도"},
    ];

    const existingSnap = await bucketRef().get();
    const existingNames = new Set(existingSnap.docs.map(d => d.data().placeName));
    const toAdd = bucketData.filter(b => !existingNames.has(b.placeName));

    for (let i = 0; i < toAdd.length; i += 400) {
      const batch = db.batch();
      toAdd.slice(i, i + 400).forEach(b => {
        batch.set(bucketRef().doc(), { ...b, visited: false });
      });
      await batch.commit();
    }

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
  // 지도 입력 라이브 미리보기
  const mapEntryInp = document.getElementById("map-entry-input");
  if (mapEntryInp) mapEntryInp.addEventListener("input", updateMapEntryPreview);
});

// 외부 클릭 시 드롭다운 닫기
document.addEventListener("click", e => {
  if (!e.target.closest(".col-sortable") && !e.target.closest(".col-dropdown")) {
    closeColMenus();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal("modal-bucket-trip");
    closeModal("modal-map-view");
    closeModal("modal-bucket-add");
    closeModal("modal-map-entry");
    closeModal("modal-link-preview");
    closeColMenus();
  }
});
