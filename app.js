// ============================================================
// 여행을 떠나자 — app.js (수정본)
// Firebase Auth (Google) + Firestore
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

// ---- State ----
let currentUser = null;
let currentTripId = null;
let currentTrip = null;
let scheduleEditId = null;
let expenseEditId = null;
let tripBucketEditId = null;
let currentView = "table";
let tripFilter = "all";
let tripBucketItems = [];
let allBucketItems = [];
let mapCollapsed = false;

const CURRENCY_SYMBOLS = { JPY: "¥", EUR: "€", USD: "$", CNY: "¥", THB: "฿", VND: "₫", AUD: "A$" };
const DEFAULT_RATES = { JPY: 9.2, EUR: 1500, USD: 1380, CNY: 190, THB: 38, VND: 0.056, AUD: 900 };

// ============================================================
// CATEGORIES — localStorage 관리
// ============================================================
const DEFAULT_CATS = {
  reservation: ["숙소", "항공", "체험", "기타"],
  schedule: ["식사", "숙소", "관광/체험", "공연/행사", "카페", "쇼핑", "이동", "기타"],
  expense: ["식사", "숙소", "교통", "체험", "쇼핑", "기타"],
  bucket: ["풍경", "체험", "맛집", "카페", "기념품", "기타"],
};

function getCategories(type) {
  const stored = localStorage.getItem("cats_" + type);
  return stored ? JSON.parse(stored) : [...DEFAULT_CATS[type]];
}

function saveCategories(type, cats) {
  localStorage.setItem("cats_" + type, JSON.stringify(cats));
}

function addCategory(type) {
  const input = document.getElementById("cat-input-" + type);
  const val = input.value.trim();
  if (!val) return;
  const cats = getCategories(type);
  if (cats.includes(val)) { showToast("이미 있어요!"); return; }
  cats.push(val);
  saveCategories(type, cats);
  input.value = "";
  renderCatTags(type);
  refreshCategorySelects();
  showToast(val + " 추가됐어요 ✨");
}

function removeCategory(type, val) {
  const cats = getCategories(type).filter((c) => c !== val);
  saveCategories(type, cats);
  renderCatTags(type);
  refreshCategorySelects();
}

function renderCatTags(type) {
  const cats = getCategories(type);
  const container = document.getElementById("cat-tags-" + type);
  if (!container) return;
  container.innerHTML = cats.map((c) => `
    <span class="cat-tag">
      ${c}
      <button class="rm-cat" onclick="removeCategory('${type}','${c}')" title="삭제">×</button>
    </span>`).join("");
}

function renderAllCatTags() {
  ["reservation", "schedule", "expense", "bucket"].forEach(renderCatTags);
}

function refreshCategorySelects() {
  // Schedule
  const schCat = document.getElementById("sch-add-category");
  if (schCat) {
    const v = schCat.value;
    schCat.innerHTML = '<option value="">분류</option>' +
      getCategories("schedule").map((c) => `<option${c === v ? " selected" : ""}>${c}</option>`).join("") +
      '<option value="직접입력">기타(직접입력)</option>';
  }
  // Expense
  const expCat = document.getElementById("exp-add-category");
  if (expCat) {
    const v = expCat.value;
    expCat.innerHTML = '<option value="">분류</option>' +
      getCategories("expense").map((c) => `<option${c === v ? " selected" : ""}>${c}</option>`).join("") +
      '<option value="직접입력">기타(직접입력)</option>';
  }
  // Bucket add row
  const baCat = document.getElementById("ba-type");
  if (baCat) {
    const v = baCat.value;
    baCat.innerHTML = '<option value="">유형</option>' +
      getCategories("bucket").map((c) => `<option${c === v ? " selected" : ""}>${c}</option>`).join("");
  }
  // Bucket modal
  const bkCat = document.getElementById("bk-category");
  if (bkCat) {
    const v = bkCat.value;
    bkCat.innerHTML = '<option value="">선택</option>' +
      getCategories("bucket").map((c) => `<option${c === v ? " selected" : ""}>${c}</option>`).join("");
  }
  // Bucket filter
  const bfType = document.getElementById("bf-type");
  if (bfType) {
    const v = bfType.value;
    bfType.innerHTML = '<option value="">전체</option>' +
      getCategories("bucket").map((c) => `<option${c === v ? " selected" : ""}>${c}</option>`).join("");
  }
}

// ============================================================
// THEME
// ============================================================
const THEME_NAMES = { blue: "파랑", pink: "분홍", orange: "주황", green: "연두", purple: "보라" };

function setTheme(theme) {
  document.documentElement.className = "theme-" + theme;
  localStorage.setItem("theme", theme);
  const el = document.getElementById("theme-current-label");
  if (el) el.textContent = "현재 테마: " + (THEME_NAMES[theme] || theme);
  document.querySelectorAll(".theme-btn").forEach((b) => {
    b.classList.toggle("selected", b.dataset.theme === theme);
  });
}

function loadTheme() {
  setTheme(localStorage.getItem("theme") || "orange");
}
loadTheme();

// ============================================================
// AUTH
// ============================================================
auth.onAuthStateChanged((user) => {
  currentUser = user;
  const emailEl = document.getElementById("user-email");
  const authBtn = document.getElementById("auth-btn");
  const settingsInfo = document.getElementById("settings-user-info");

  if (user) {
    emailEl.textContent = user.displayName || user.email;
    authBtn.textContent = "로그아웃";
    if (settingsInfo) settingsInfo.textContent = (user.displayName || "") + " (" + user.email + ")";
    loadTrips();
    loadAllBucketItems();
    calcStorage();
  } else {
    emailEl.textContent = "";
    authBtn.textContent = "구글로 로그인";
    if (settingsInfo) settingsInfo.textContent = "로그인 정보 없음";
    document.getElementById("trips-container").innerHTML = `
      <div class="empty-state">
        <div class="icon">✈️</div>
        <h3>로그인이 필요해요</h3>
        <p>구글 계정으로 로그인 후 여행 기록을 시작하세요</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="handleAuth()">
          Google 계정으로 로그인
        </button>
      </div>`;
  }
});

function handleAuth() {
  if (currentUser) {
    auth.signOut().then(() => showToast("로그아웃 됐어요 👋"));
  } else {
    auth.signInWithPopup(googleProvider)
      .then((r) => showToast((r.user.displayName || r.user.email) + "님 환영해요! 🎉"))
      .catch((e) => { if (e.code !== "auth/popup-closed-by-user") showToast("로그인 오류: " + e.message); });
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll("nav a").forEach((a) => a.classList.remove("active"));
  const navEl = document.getElementById("nav-" + page);
  if (navEl) navEl.classList.add("active");
  if (page === "home") loadTrips();
  if (page === "bucket") { loadAllBucketItems(); refreshCategorySelects(); }
  if (page === "settings") { renderAllCatTags(); refreshCategorySelects(); calcStorage(); }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

// ============================================================
// STORAGE USAGE ESTIMATE
// ============================================================
async function calcStorage() {
  if (!currentUser) return;
  try {
    const trips = await tripsRef().get();
    let total = trips.size;
    document.getElementById("storage-usage-text").textContent = `여행 ${trips.size}개 · 데이터 정상`;
    const pct = Math.min((total / 500) * 100, 100);
    document.getElementById("storage-bar-inner").style.width = pct + "%";
  } catch (e) {
    document.getElementById("storage-usage-text").textContent = "확인 불가";
  }
}

// ============================================================
// TRIPS — HOME PAGE
// ============================================================
function tripsRef() {
  return db.collection("users").doc(currentUser.uid).collection("trips");
}

function toggleCreateTrip() {
  const panel = document.getElementById("trip-create-panel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) {
    document.getElementById("ct-title").focus();
  }
}

async function loadTrips() {
  if (!currentUser) return;
  const c = document.getElementById("trips-container");
  c.innerHTML = "<div class='spinner'></div>";
  const snap = await tripsRef().orderBy("createdAt", "desc").get().catch(() => ({ docs: [] }));
  let trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (tripFilter === "overseas") trips = trips.filter((t) => t.country && t.country !== "한국" && t.country !== "국내");
  if (tripFilter === "domestic") trips = trips.filter((t) => !t.country || t.country === "한국" || t.country === "국내");

  if (trips.length === 0) {
    c.innerHTML = `<div class="empty-state"><div class="icon">🗺️</div><h3>아직 여행이 없어요</h3><p>첫 번째 여행을 만들어보세요!</p></div>`;
    return;
  }

  const byYear = {};
  trips.forEach((t) => {
    const y = t.startDate ? t.startDate.substring(0, 4) : "날짜 미정";
    (byYear[y] = byYear[y] || []).push(t);
  });

  c.innerHTML = Object.keys(byYear).sort((a, b) => b.localeCompare(a)).map((year) => `
    <div class="year-group">
      <div class="year-label">📅 ${year}</div>
      <div class="trip-grid">
        ${byYear[year].map((t) => `
          <div class="trip-card" onclick="openTrip('${t.id}')">
            <div class="trip-card-img">
              ${t.coverImage ? `<img src="${t.coverImage}" onerror="this.parentElement.innerHTML='✈️'" alt="${t.title}" />` : "✈️"}
            </div>
            <div class="trip-card-body">
              <div class="trip-card-title">${t.title}</div>
              <div class="trip-card-meta">
                ${t.startDate ? t.startDate + " ~ " + (t.endDate || "") : "날짜 미정"}<br>
                ${[t.city, t.country].filter(Boolean).join(", ") || ""}
              </div>
              ${t.companions ? `<div><span class="tag">👥 ${t.companions}</span></div>` : ""}
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

function filterTrips(type, el) {
  tripFilter = type;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  loadTrips();
}

async function createTrip() {
  if (!currentUser) { showToast("먼저 로그인해주세요!"); return; }
  const title = document.getElementById("ct-title").value.trim();
  if (!title) { showToast("여행 제목을 입력해주세요 ✏️"); return; }
  const data = {
    title,
    country: document.getElementById("ct-country").value.trim() || null,
    city: document.getElementById("ct-city").value.trim() || null,
    startDate: document.getElementById("ct-start").value || null,
    endDate: document.getElementById("ct-end").value || null,
    companions: document.getElementById("ct-companions").value.trim() || null,
    coverImage: document.getElementById("ct-image").value.trim() || null,
    foreignCurrency: null, exchangeRate: null, mapLink: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await tripsRef().add(data);
  toggleCreateTrip();
  showToast("여행 생성 완료! 🎉");
  openTrip(ref.id);
}

// ============================================================
// TRIP DETAIL
// ============================================================
async function openTrip(tripId) {
  showPage("trip");
  currentTripId = tripId;
  scheduleEditId = null;
  expenseEditId = null;

  const doc = await tripsRef().doc(tripId).get();
  currentTrip = { id: doc.id, ...doc.data() };
  renderTripInfo();
  refreshCategorySelects();
  loadSchedules();
  loadExpenses();
  loadReservations();
  loadTripBucketItems();
  initMapSection();
}

function renderTripInfo() {
  const t = currentTrip;
  document.getElementById("trip-title-display").textContent = t.title;
  document.getElementById("trip-dates-display").textContent = (t.startDate || "-") + " ~ " + (t.endDate || "");
  document.getElementById("trip-companions-display").textContent = t.companions || "혼자";
  document.getElementById("trip-location-display").textContent = [t.city, t.country].filter(Boolean).join(", ") || "-";
  const img = document.getElementById("trip-hero-img");
  if (t.coverImage) { img.src = t.coverImage; img.classList.remove("hidden"); } else img.classList.add("hidden");
  document.getElementById("currency-select").value = t.foreignCurrency || "";
  updateCurrencyDisplay();
  // Set date defaults in add rows
  const dateInputs = ["sch-add-date", "exp-add-date"];
  dateInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = t.startDate || "";
  });
}

function updateCurrencyDisplay() {
  const t = currentTrip;
  const rd = document.getElementById("rate-display");
  if (t && t.foreignCurrency) {
    rd.style.display = "inline";
    document.getElementById("currency-symbol").textContent = CURRENCY_SYMBOLS[t.foreignCurrency] || t.foreignCurrency;
    document.getElementById("rate-value-display").textContent = (t.exchangeRate || DEFAULT_RATES[t.foreignCurrency] || 1).toLocaleString();
    document.getElementById("foreign-col-header").textContent = "외화 (" + (CURRENCY_SYMBOLS[t.foreignCurrency] || "") + ")";
    const sym = CURRENCY_SYMBOLS[t.foreignCurrency] || "";
    const rate = t.exchangeRate || DEFAULT_RATES[t.foreignCurrency] || 1;
    const hint = document.getElementById("rate-hint");
    if (hint) hint.textContent = rate ? `💡 1${sym} = ${rate.toLocaleString()}원` : "";
    const foreignInput = document.getElementById("exp-add-foreign");
    if (foreignInput) foreignInput.disabled = false;
  } else {
    rd.style.display = "none";
    document.getElementById("foreign-col-header").textContent = "외화";
    const hint = document.getElementById("rate-hint");
    if (hint) hint.textContent = "";
    const foreignInput = document.getElementById("exp-add-foreign");
    if (foreignInput) foreignInput.disabled = true;
  }
}

async function onCurrencyChange(code) {
  currentTrip.foreignCurrency = code || null;
  currentTrip.exchangeRate = code ? (DEFAULT_RATES[code] || 1) : null;
  await tripsRef().doc(currentTripId).update({ foreignCurrency: currentTrip.foreignCurrency, exchangeRate: currentTrip.exchangeRate });
  updateCurrencyDisplay();
  loadExpenses();
}

function editRate() {
  const v = parseFloat(prompt("새 환율 입력 (원화 기준):", currentTrip.exchangeRate));
  if (isNaN(v) || v <= 0) return;
  currentTrip.exchangeRate = v;
  tripsRef().doc(currentTripId).update({ exchangeRate: v });
  updateCurrencyDisplay();
  loadExpenses();
}

// ---- Map ----
function initMapSection() {
  const t = currentTrip;
  const input = document.getElementById("map-link-input");
  if (t.mapLink) {
    input.value = t.mapLink;
    applyMapLink();
  } else {
    const q = (t.city ? t.city + " " : "") + (t.country || "");
    if (q.trim()) {
      document.getElementById("map-frame").src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=ko`;
    }
  }
}

function onMapLinkInput() { /* live preview disabled intentionally */ }

function applyMapLink() {
  const raw = document.getElementById("map-link-input").value.trim();
  if (!raw) return;
  let embedUrl = raw;
  // 구글 내 지도 공유 링크 → embed URL 변환
  if (raw.includes("google.com/maps/d/")) {
    // https://www.google.com/maps/d/viewer?mid=XXX 또는 /u/0/viewer?mid=XXX
    const midMatch = raw.match(/mid=([^&]+)/);
    if (midMatch) embedUrl = "https://www.google.com/maps/d/embed?mid=" + midMatch[1];
  } else if (raw.includes("maps.app.goo.gl") || raw.includes("goo.gl/maps")) {
    // short link — just use as-is in iframe (may not embed)
    embedUrl = raw;
  } else if (!raw.includes("output=embed")) {
    // 일반 지도 링크
    const qMatch = raw.match(/[?&]q=([^&]+)/);
    if (qMatch) embedUrl = `https://maps.google.com/maps?q=${qMatch[1]}&output=embed&hl=ko`;
    else embedUrl = raw;
  }
  document.getElementById("map-frame").src = embedUrl;
  // save
  tripsRef().doc(currentTripId).update({ mapLink: raw });
  currentTrip.mapLink = raw;
}

function toggleMap() {
  const body = document.getElementById("map-section-body");
  const btn = document.querySelector(".card-header button.collapse-btn");
  mapCollapsed = !mapCollapsed;
  body.classList.toggle("hidden", mapCollapsed);
  if (btn) btn.textContent = mapCollapsed ? "▼ 펼치기" : "▲ 접기";
}

function switchTab(tab, btn) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");
}

function setView(view) {
  currentView = view;
  document.getElementById("schedule-table-view").classList.toggle("hidden", view !== "table");
  document.getElementById("schedule-timetable-view").classList.toggle("hidden", view !== "timetable");
  document.getElementById("view-table-btn").classList.toggle("active-view", view === "table");
  document.getElementById("view-time-btn").classList.toggle("active-view", view === "timetable");
}

// ============================================================
// SCHEDULES — Inline row add (BUG FIXED: client-side sort)
// ============================================================
function schedulesRef() { return tripsRef().doc(currentTripId).collection("schedules"); }

function autoCalcForeign() {
  const krw = parseFloat(document.getElementById("exp-add-krw").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(krw) && rate) document.getElementById("exp-add-foreign").value = Math.round(krw / rate * 100) / 100;
}

function autoCalcKrw() {
  const foreign = parseFloat(document.getElementById("exp-add-foreign").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(foreign) && rate) document.getElementById("exp-add-krw").value = Math.round(foreign * rate);
}

async function loadSchedules() {
  // 버그 수정: compound orderBy 대신 단순 orderBy + 클라이언트 정렬
  const snap = await schedulesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // 클라이언트에서 date, time 순으로 정렬
  items.sort((a, b) => {
    const dd = (a.date || "").localeCompare(b.date || "");
    if (dd !== 0) return dd;
    return (a.time || "").localeCompare(b.time || "");
  });
  renderScheduleTable(items);
  renderTimetable(items);
}

function renderScheduleTable(items) {
  const tbody = document.getElementById("schedule-tbody");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;font-size:0.85rem">📅 아래 행에서 일정을 추가해보세요</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((s) => {
    if (scheduleEditId === s.id) {
      return renderScheduleEditRow(s);
    }
    return `
    <tr>
      <td>${s.category ? `<span class="badge badge-${s.category.replace("/","\\/")}">` + s.category + `</span>` : "-"}</td>
      <td style="white-space:nowrap">${s.date || "-"}</td>
      <td style="color:var(--text-muted);white-space:nowrap">${s.time || "-"}</td>
      <td>${s.location || "-"}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.content || "-"}</td>
      <td style="color:var(--text-muted)">${s.transportation || "-"}</td>
      <td style="color:var(--text-muted)">${s.notes || "-"}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="startEditSchedule('${s.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteSchedule('${s.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join("");
}

function renderScheduleEditRow(s) {
  const cats = getCategories("schedule");
  return `
  <tr class="edit-input-row" id="edit-row-${s.id}">
    <td>
      <select id="edit-sch-cat-${s.id}" style="min-width:75px">
        <option value="">분류</option>
        ${cats.map((c) => `<option${c === s.category ? " selected" : ""}>${c}</option>`).join("")}
      </select>
    </td>
    <td><input type="date" id="edit-sch-date-${s.id}" value="${s.date || ""}" /></td>
    <td><input type="time" id="edit-sch-time-${s.id}" value="${s.time || ""}" /></td>
    <td><input type="text" id="edit-sch-loc-${s.id}" value="${s.location || ""}" placeholder="장소" /></td>
    <td><input type="text" id="edit-sch-content-${s.id}" value="${s.content || ""}" placeholder="내용" /></td>
    <td><input type="text" id="edit-sch-trans-${s.id}" value="${s.transportation || ""}" placeholder="교통편" /></td>
    <td><input type="text" id="edit-sch-notes-${s.id}" value="${s.notes || ""}" placeholder="비고" /></td>
    <td style="white-space:nowrap">
      <button class="save-row-btn" onclick="updateSchedule('${s.id}')">저장</button>
      <button class="cancel-row-btn" onclick="cancelEditSchedule()">취소</button>
    </td>
  </tr>`;
}

function startEditSchedule(id) {
  scheduleEditId = id;
  loadSchedules();
}

function cancelEditSchedule() {
  scheduleEditId = null;
  loadSchedules();
}

async function saveScheduleRow() {
  const date = document.getElementById("sch-add-date").value;
  if (!date) { showToast("날짜를 입력해주세요 📅"); return; }
  let category = document.getElementById("sch-add-category").value;
  if (category === "직접입력") {
    category = prompt("분류를 직접 입력해주세요:") || "";
  }
  const data = {
    category: category || null,
    date,
    time: document.getElementById("sch-add-time").value || null,
    location: document.getElementById("sch-add-location").value.trim() || null,
    content: document.getElementById("sch-add-content").value.trim() || null,
    transportation: document.getElementById("sch-add-transport").value.trim() || null,
    notes: document.getElementById("sch-add-notes").value.trim() || null,
  };
  await schedulesRef().add(data);
  showToast("일정 추가 완료 🎉");
  // 입력 초기화 (날짜는 유지)
  ["sch-add-category","sch-add-time","sch-add-location","sch-add-content","sch-add-transport","sch-add-notes"]
    .forEach((id) => { const el = document.getElementById(id); if (el) el.value = ""; });
  loadSchedules();
}

async function updateSchedule(id) {
  const date = document.getElementById("edit-sch-date-" + id).value;
  if (!date) { showToast("날짜를 입력해주세요 📅"); return; }
  const data = {
    category: document.getElementById("edit-sch-cat-" + id).value || null,
    date,
    time: document.getElementById("edit-sch-time-" + id).value || null,
    location: document.getElementById("edit-sch-loc-" + id).value.trim() || null,
    content: document.getElementById("edit-sch-content-" + id).value.trim() || null,
    transportation: document.getElementById("edit-sch-trans-" + id).value.trim() || null,
    notes: document.getElementById("edit-sch-notes-" + id).value.trim() || null,
  };
  await schedulesRef().doc(id).update(data);
  showToast("일정 수정 완료 ✅");
  scheduleEditId = null;
  loadSchedules();
}

async function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;
  await schedulesRef().doc(id).delete();
  showToast("삭제됐어요 🗑️");
  loadSchedules();
}

function renderTimetable(items) {
  const c = document.getElementById("schedule-timetable-view");
  // 이동 분류는 시간표에서 숨김
  const filtered = items.filter((s) => s.category !== "이동");
  if (filtered.length === 0) { c.innerHTML = `<div class="empty-msg">📅 일정을 추가해보세요<br><small style="color:var(--text-muted)">(이동 분류는 시간표에서 숨겨집니다)</small></div>`; return; }
  const byDate = {};
  filtered.forEach((s) => { const d = s.date || "미정"; (byDate[d] = byDate[d] || []).push(s); });
  c.innerHTML = Object.keys(byDate).sort().map((date) => `
    <div class="timetable-day">
      <div class="timetable-day-label">📅 ${date}</div>
      <div class="timetable-items">
        ${byDate[date].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((s) => `
          <div class="timetable-item">
            <div class="timetable-time">${s.time || ""}</div>
            <div class="timetable-info">
              <h4>${s.location || s.content || "(장소 미입력)"}${s.category ? ` <span class="badge badge-${s.category.replace("/","\\/")}">` + s.category + `</span>` : ""}</h4>
              ${s.content && s.location ? `<p>${s.content}</p>` : ""}
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

// ============================================================
// EXPENSES — Inline row add
// ============================================================
function expensesRef() { return tripsRef().doc(currentTripId).collection("expenses"); }

async function loadExpenses() {
  const snap = await expensesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  renderExpenses(items);
}

function renderExpenses(items) {
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  let totalKrw = 0, totalForeign = 0;
  items.forEach((e) => { totalKrw += e.amountKrw || 0; totalForeign += e.amountForeign || 0; });

  document.getElementById("total-krw-display").innerHTML = `<strong>${totalKrw.toLocaleString()}원</strong>`;
  document.getElementById("total-foreign-display").textContent = sym && totalForeign ? sym + totalForeign.toLocaleString() : "";
  document.getElementById("expense-summary-display").textContent = `합계 ${totalKrw.toLocaleString()}원${sym && totalForeign ? " / " + sym + totalForeign.toLocaleString() : ""}`;
  document.getElementById("trip-budget-display").textContent = totalKrw.toLocaleString() + "원";

  const tbody = document.getElementById("expense-tbody");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;font-size:0.85rem">💸 아래 행에서 지출을 추가해보세요</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((e) => {
    if (expenseEditId === e.id) return renderExpenseEditRow(e);
    return `
    <tr>
      <td>${e.category ? `<span class="badge badge-${e.category}">${e.category}</span>` : "-"}</td>
      <td style="white-space:nowrap">${e.date || "-"}</td>
      <td>${e.title}</td>
      <td style="text-align:right;font-weight:700">${e.amountKrw != null ? e.amountKrw.toLocaleString() + "원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${e.amountForeign != null && sym ? sym + e.amountForeign.toLocaleString() : "-"}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="startEditExpense('${e.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteExpense('${e.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join("");
}

function renderExpenseEditRow(e) {
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  const cats = getCategories("expense");
  return `
  <tr class="edit-input-row">
    <td>
      <select id="edit-exp-cat-${e.id}">
        <option value="">분류</option>
        ${cats.map((c) => `<option${c === e.category ? " selected" : ""}>${c}</option>`).join("")}
      </select>
    </td>
    <td><input type="date" id="edit-exp-date-${e.id}" value="${e.date || ""}" /></td>
    <td><input type="text" id="edit-exp-title-${e.id}" value="${e.title || ""}" placeholder="제목" /></td>
    <td><input type="number" id="edit-exp-krw-${e.id}" value="${e.amountKrw ?? ""}" placeholder="원화" style="text-align:right" /></td>
    <td><input type="number" id="edit-exp-foreign-${e.id}" value="${e.amountForeign ?? ""}" placeholder="외화" style="text-align:right" ${!sym ? "disabled" : ""} /></td>
    <td style="white-space:nowrap">
      <button class="save-row-btn" onclick="updateExpense('${e.id}')">저장</button>
      <button class="cancel-row-btn" onclick="cancelEditExpense()">취소</button>
    </td>
  </tr>`;
}

function startEditExpense(id) {
  expenseEditId = id;
  loadExpenses();
}

function cancelEditExpense() {
  expenseEditId = null;
  loadExpenses();
}

async function saveExpenseRow() {
  const title = document.getElementById("exp-add-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요 ✏️"); return; }
  let category = document.getElementById("exp-add-category").value;
  if (category === "직접입력") {
    category = prompt("분류를 직접 입력해주세요:") || "";
  }
  const data = {
    category: category || null,
    date: document.getElementById("exp-add-date").value || null,
    title,
    amountKrw: document.getElementById("exp-add-krw").value ? parseInt(document.getElementById("exp-add-krw").value) : null,
    amountForeign: document.getElementById("exp-add-foreign").value ? parseFloat(document.getElementById("exp-add-foreign").value) : null,
  };
  await expensesRef().add(data);
  showToast("지출 추가 완료 💰");
  ["exp-add-category","exp-add-title","exp-add-krw","exp-add-foreign"].forEach((id) => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  loadExpenses();
}

async function updateExpense(id) {
  const title = document.getElementById("edit-exp-title-" + id).value.trim();
  if (!title) { showToast("제목을 입력해주세요 ✏️"); return; }
  const data = {
    category: document.getElementById("edit-exp-cat-" + id).value || null,
    date: document.getElementById("edit-exp-date-" + id).value || null,
    title,
    amountKrw: document.getElementById("edit-exp-krw-" + id).value ? parseInt(document.getElementById("edit-exp-krw-" + id).value) : null,
    amountForeign: document.getElementById("edit-exp-foreign-" + id).value ? parseFloat(document.getElementById("edit-exp-foreign-" + id).value) : null,
  };
  await expensesRef().doc(id).update(data);
  showToast("지출 수정 완료 ✅");
  expenseEditId = null;
  loadExpenses();
}

async function deleteExpense(id) {
  if (!confirm("이 지출을 삭제할까요?")) return;
  await expensesRef().doc(id).delete();
  showToast("삭제됐어요 🗑️");
  loadExpenses();
}

// ============================================================
// RESERVATIONS — 항공/숙소/기타 분리
// ============================================================
function reservationsRef() { return tripsRef().doc(currentTripId).collection("reservations"); }

let resCollapsed = { 항공: false, 숙소: false, 기타: false };

function toggleResSection(type) {
  resCollapsed[type] = !resCollapsed[type];
  const body = document.getElementById("res-body-" + type);
  const toggle = document.getElementById("res-toggle-" + type);
  if (body) body.classList.toggle("collapsed", resCollapsed[type]);
  if (toggle) toggle.textContent = resCollapsed[type] ? "▼" : "▲";
}

function openResForm(type) {
  // 다른 열린 폼 닫기
  ["항공", "숙소", "기타"].forEach((t) => {
    const f = document.getElementById("res-form-" + t);
    if (f) f.classList.add("hidden");
  });
  // 해당 섹션 열기
  resCollapsed[type] = false;
  const body = document.getElementById("res-body-" + type);
  const toggle = document.getElementById("res-toggle-" + type);
  if (body) body.classList.remove("collapsed");
  if (toggle) toggle.textContent = "▲";

  const formEl = document.getElementById("res-form-" + type);
  if (!formEl) return;
  formEl.innerHTML = buildResForm(type);
  formEl.classList.remove("hidden");
  const first = formEl.querySelector("input[type=text], input[type=date]");
  if (first) first.focus();
}

function buildResForm(type) {
  const resCats = getCategories("reservation");
  if (type === "항공") {
    return `
    <div class="form-row">
      <div class="form-group"><label>출발지</label><input type="text" id="rf-from" placeholder="인천" /></div>
      <div class="form-group" style="flex:0 0 24px;align-self:flex-end;padding-bottom:8px;text-align:center;font-size:1.1rem">→</div>
      <div class="form-group"><label>도착지</label><input type="text" id="rf-to" placeholder="시드니" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>출발 날짜/시간</label><input type="datetime-local" id="rf-depart" /></div>
      <div class="form-group"><label>도착 날짜/시간</label><input type="datetime-local" id="rf-arrive" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>편명</label><input type="text" id="rf-flight" placeholder="QF 1234" /></div>
      <div class="form-group"><label>예약번호</label><input type="text" id="rf-number" placeholder="ABC123" /></div>
    </div>
    <div class="form-row">
      <div class="form-group full"><label>기타</label><input type="text" id="rf-notes" placeholder="비고" /></div>
    </div>
    <div class="sub-form-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeResForm('항공')">취소</button>
      <button class="btn btn-primary btn-sm" onclick="saveReservation('항공')">저장</button>
    </div>`;
  }
  if (type === "숙소") {
    return `
    <div class="form-row">
      <div class="form-group full"><label>숙소명 / 위치 *</label><input type="text" id="rf-title" placeholder="힐튼 시드니" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>체크인</label><input type="datetime-local" id="rf-checkin" /></div>
      <div class="form-group"><label>체크아웃</label><input type="datetime-local" id="rf-checkout" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>전화번호</label><input type="text" id="rf-phone" placeholder="02-1234-5678" /></div>
      <div class="form-group"><label>예약확인번호</label><input type="text" id="rf-number" placeholder="ABC123" /></div>
    </div>
    <div class="form-row">
      <div class="form-group full"><label>비고</label><input type="text" id="rf-notes" placeholder="비고" /></div>
    </div>
    <div class="sub-form-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeResForm('숙소')">취소</button>
      <button class="btn btn-primary btn-sm" onclick="saveReservation('숙소')">저장</button>
    </div>`;
  }
  // 기타
  return `
  <div class="form-row">
    <div class="form-group">
      <label>분류</label>
      <select id="rf-subcat">
        <option value="">선택</option>
        ${resCats.filter((c) => c !== "항공" && c !== "숙소").map((c) => `<option>${c}</option>`).join("")}
        <option>기타</option>
      </select>
    </div>
    <div class="form-group"><label>날짜</label><input type="date" id="rf-date" /></div>
  </div>
  <div class="form-row">
    <div class="form-group full"><label>예약명 / 장소 *</label><input type="text" id="rf-title" placeholder="예약명 또는 장소명" /></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label>예약번호</label><input type="text" id="rf-number" placeholder="예약번호" /></div>
    <div class="form-group"><label>비고</label><input type="text" id="rf-notes" placeholder="비고" /></div>
  </div>
  <div class="sub-form-actions">
    <button class="btn btn-ghost btn-sm" onclick="closeResForm('기타')">취소</button>
    <button class="btn btn-primary btn-sm" onclick="saveReservation('기타')">저장</button>
  </div>`;
}

function closeResForm(type) {
  const f = document.getElementById("res-form-" + type);
  if (f) f.classList.add("hidden");
}

async function saveReservation(type) {
  let data = { type, notes: document.getElementById("rf-notes")?.value.trim() || null };

  if (type === "항공") {
    data.from = document.getElementById("rf-from")?.value.trim() || null;
    data.to = document.getElementById("rf-to")?.value.trim() || null;
    data.depart = document.getElementById("rf-depart")?.value || null;
    data.arrive = document.getElementById("rf-arrive")?.value || null;
    data.flight = document.getElementById("rf-flight")?.value.trim() || null;
    data.reservationNumber = document.getElementById("rf-number")?.value.trim() || null;
    data.title = [data.from, data.to].filter(Boolean).join(" → ") || "항공";
    data.date = data.depart ? data.depart.split("T")[0] : null;
  } else if (type === "숙소") {
    data.title = document.getElementById("rf-title")?.value.trim();
    if (!data.title) { showToast("숙소명을 입력해주세요 🏨"); return; }
    data.checkin = document.getElementById("rf-checkin")?.value || null;
    data.checkout = document.getElementById("rf-checkout")?.value || null;
    data.phone = document.getElementById("rf-phone")?.value.trim() || null;
    data.reservationNumber = document.getElementById("rf-number")?.value.trim() || null;
    data.date = data.checkin ? data.checkin.split("T")[0] : null;
  } else {
    data.title = document.getElementById("rf-title")?.value.trim();
    if (!data.title) { showToast("예약명을 입력해주세요 ✏️"); return; }
    data.subCategory = document.getElementById("rf-subcat")?.value || null;
    data.date = document.getElementById("rf-date")?.value || null;
    data.reservationNumber = document.getElementById("rf-number")?.value.trim() || null;
  }

  await reservationsRef().add(data);
  showToast("예약 추가 완료 🎫");
  closeResForm(type);
  loadReservations();
}

async function loadReservations() {
  const snap = await reservationsRef().orderBy("date").get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  ["항공", "숙소", "기타"].forEach((type) => {
    const list = document.getElementById("res-list-" + type);
    if (!list) return;
    const typeItems = items.filter((r) => r.type === type);
    if (typeItems.length === 0) {
      list.innerHTML = `<div class="empty-msg" style="padding:10px 0;font-size:0.8rem">${type === "항공" ? "항공" : type === "숙소" ? "숙소" : "기타"} 예약 없음</div>`;
      return;
    }
    list.innerHTML = typeItems.map((r) => `
      <div class="res-item">
        <div class="res-info">
          <h4>${r.title || "-"}</h4>
          ${type === "항공" ? `<p>${r.depart ? "출발: " + r.depart.replace("T"," ") : ""}${r.arrive ? " / 도착: " + r.arrive.replace("T"," ") : ""}${r.flight ? " · " + r.flight : ""}</p>` : ""}
          ${type === "숙소" ? `<p>${r.checkin ? "체크인: " + r.checkin.replace("T"," ") : ""}${r.checkout ? " ~ " + r.checkout.replace("T"," ") : ""}${r.phone ? " · " + r.phone : ""}</p>` : ""}
          ${type === "기타" ? `<p>${[r.date, r.subCategory, r.reservationNumber].filter(Boolean).join(" · ")}</p>` : ""}
          ${r.reservationNumber && type !== "기타" ? `<p>예약번호: ${r.reservationNumber}</p>` : ""}
          ${r.notes ? `<p>📝 ${r.notes}</p>` : ""}
        </div>
        <div class="res-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteReservation('${r.id}')">🗑️</button>
        </div>
      </div>`).join("");
  });
}

async function deleteReservation(id) {
  if (!confirm("이 예약을 삭제할까요?")) return;
  await reservationsRef().doc(id).delete();
  showToast("삭제됐어요 🗑️");
  loadReservations();
}

// ============================================================
// TRIP BUCKET — 가고싶은 곳 (모달로만 추가, 버킷플레이스 연동)
// ============================================================
function bucketRef() {
  return db.collection("users").doc(currentUser.uid).collection("bucketItems");
}

async function loadTripBucketItems() {
  if (!currentUser) return;
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  tripBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderTripBucket();
}

function renderTripBucket() {
  const regionFilter = (document.getElementById("trip-bucket-region")?.value || "").trim().toLowerCase();
  const board = document.getElementById("trip-bucket-board");
  if (!board) return;

  let items = tripBucketItems;
  if (regionFilter) {
    items = items.filter((i) => (i.region || "").toLowerCase().includes(regionFilter) ||
      (i.country || "").toLowerCase().includes(regionFilter));
  }

  if (items.length === 0) {
    board.innerHTML = `<div class="empty-msg">⭐ 가고싶은 곳을 추가해보세요!</div>`;
    return;
  }

  // 2열 그리드로 표시
  board.innerHTML = `<div class="tripbucket-grid">` +
    items.map((item) => `
      <div class="tripbucket-item ${item.visited ? "visited" : ""}">
        <div class="tripbucket-item-name">
          <button class="visit-toggle ${item.visited ? "done" : ""}" onclick="toggleVisited('${item.id}',${item.visited},'trip')">${item.visited ? "✓" : ""}</button>
          <div>
            <span class="${item.visited ? "done" : ""}">${item.placeName}</span>
            <div class="tripbucket-item-meta">
              ${item.category ? `<span class="badge badge-${item.category}" style="font-size:0.65rem;padding:1px 6px">${item.category}</span> ` : ""}
              ${[item.region, item.country].filter(Boolean).join(", ")}
            </div>
          </div>
        </div>
        <div class="tripbucket-item-actions">
          <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteBucketItem('${item.id}','trip')">🗑️</button>
        </div>
      </div>`).join("") +
    `</div>`;
}

function openTripBucketModal(editId) {
  tripBucketEditId = editId || null;
  if (!editId) {
    document.getElementById("bk-season").value = "";
    document.getElementById("bk-country").value = "";
    document.getElementById("bk-notes").value = "";
    document.getElementById("bk-region").value = "";
    document.getElementById("bk-visited").checked = false;
    document.getElementById("bk-place").value = "";
  }
  refreshCategorySelects();
  openModal("modal-bucket-trip");
  setTimeout(() => document.getElementById("bk-place").focus(), 100);
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
  // 버킷플레이스와 공유 컬렉션 — 자동 연동
  if (tripBucketEditId) {
    await bucketRef().doc(tripBucketEditId).update(data);
    showToast("수정 완료 ✅");
  } else {
    await bucketRef().add(data);
    showToast("추가 완료 ⭐ (버킷플레이스에도 자동 추가됐어요)");
  }
  closeModal("modal-bucket-trip");
  loadTripBucketItems();
  loadAllBucketItems();
}

// ============================================================
// BUCKET LIST — 버킷플레이스 (리스트 형식)
// ============================================================
async function loadAllBucketItems() {
  if (!currentUser) return;
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  allBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderBucketList();
}

function resetBucketFilter() {
  ["bf-type","bf-country","bf-region","bf-season"].forEach((id) => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const ck = document.getElementById("bf-unvisited");
  if (ck) ck.checked = false;
  renderBucketList();
}

function renderBucketList() {
  const typeFilter = document.getElementById("bf-type")?.value || "";
  const countryFilter = (document.getElementById("bf-country")?.value || "").trim().toLowerCase();
  const regionFilter = (document.getElementById("bf-region")?.value || "").trim().toLowerCase();
  const seasonFilter = document.getElementById("bf-season")?.value || "";
  const unvisitedOnly = document.getElementById("bf-unvisited")?.checked;

  let items = allBucketItems;
  if (typeFilter) items = items.filter((i) => (i.category || "") === typeFilter);
  if (countryFilter) items = items.filter((i) => (i.country || "").toLowerCase().includes(countryFilter));
  if (regionFilter) items = items.filter((i) => (i.region || "").toLowerCase().includes(regionFilter));
  if (seasonFilter) items = items.filter((i) => (i.season || "") === seasonFilter);
  if (unvisitedOnly) items = items.filter((i) => !i.visited);

  const tbody = document.getElementById("bucket-list-tbody");
  if (!tbody) return;
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;font-size:0.85rem">⭐ 아직 목록이 없어요. 아래 행에서 추가해보세요!</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((item) => `
    <tr class="${item.visited ? "done-row" : ""}">
      <td>
        <button class="visit-toggle ${item.visited ? "done" : ""}" onclick="toggleVisited('${item.id}',${item.visited},'main')" title="${item.visited ? "방문완료" : "미방문"}">${item.visited ? "✓" : ""}</button>
      </td>
      <td>${item.category ? `<span class="badge badge-${item.category}">${item.category}</span>` : "-"}</td>
      <td>${item.country || "-"}</td>
      <td>${item.region || "-"}</td>
      <td style="font-weight:700">${item.placeName}</td>
      <td style="color:var(--text-muted)">${item.season || "-"}</td>
      <td style="color:var(--text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.notes || "-"}</td>
      <td>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteBucketItem('${item.id}','main')">🗑️</button>
      </td>
    </tr>`).join("");
}

async function saveBucketRow() {
  const placeName = document.getElementById("ba-place").value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요 📍"); document.getElementById("ba-place").focus(); return; }
  let category = document.getElementById("ba-type").value;
  const data = {
    placeName,
    category: category || "기타",
    country: document.getElementById("ba-country").value.trim() || null,
    region: document.getElementById("ba-region").value.trim() || null,
    season: document.getElementById("ba-season").value || null,
    notes: document.getElementById("ba-notes").value.trim() || null,
    visited: false,
  };
  await bucketRef().add(data);
  showToast("추가됐어요 ⭐");
  ["ba-type","ba-country","ba-region","ba-place","ba-season","ba-notes"].forEach((id) => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  loadAllBucketItems();
  // 가고싶은 곳 탭도 업데이트
  const snap = await bucketRef().get().catch(() => ({ docs: [] }));
  tripBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderTripBucket();
}

async function toggleVisited(id, current, source) {
  await bucketRef().doc(id).update({ visited: !current });
  if (source === "trip") {
    await loadTripBucketItems();
  } else {
    loadAllBucketItems();
    const snap = await bucketRef().get().catch(() => ({ docs: [] }));
    tripBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTripBucket();
  }
}

async function deleteBucketItem(id, source) {
  if (!confirm("이 장소를 삭제할까요?")) return;
  await bucketRef().doc(id).delete();
  showToast("삭제됐어요 🗑️");
  if (source === "trip") {
    await loadTripBucketItems();
    loadAllBucketItems();
  } else {
    loadAllBucketItems();
    const snap = await bucketRef().get().catch(() => ({ docs: [] }));
    tripBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTripBucket();
  }
}

// ============================================================
// INIT — Category selects populate on page load
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  refreshCategorySelects();
  renderAllCatTags();
});

// ESC to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal("modal-bucket-trip");
});
