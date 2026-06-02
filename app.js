// ============================================================
// 여행을 떠나자 — app.js
// Firebase Auth (Google) + Firestore, Inline Editing
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
let reservationEditId = null;
let tripBucketEditId = null;
let currentView = "table";
let tripFilter = "all";
let tripBucketItems = [];

const CURRENCY_SYMBOLS = { JPY: "¥", EUR: "€", USD: "$", CNY: "¥", THB: "฿", VND: "₫" };
const DEFAULT_RATES = { JPY: 9.2, EUR: 1500, USD: 1380, CNY: 190, THB: 38, VND: 0.056 };
const BUCKET_CATEGORIES = ["풍경", "맛집", "카페", "체험", "기념품", "숙소", "기타"];
const CAT_EMOJI = { 풍경: "🌄", 맛집: "🍜", 카페: "☕", 체험: "🎭", 기념품: "🎁", 숙소: "🏨", 기타: "📌" };

// ============================================================
// THEME
// ============================================================
const THEME_NAMES = { blue: "파랑", pink: "분홍", orange: "주황", green: "연두", purple: "보라" };

function setTheme(theme) {
  document.documentElement.className = "theme-" + theme;
  localStorage.setItem("theme", theme);
  document.getElementById("theme-current-label").textContent = "현재 테마: " + (THEME_NAMES[theme] || theme);
  document.querySelectorAll(".theme-btn").forEach((b) => {
    b.classList.toggle("selected", b.dataset.theme === theme);
  });
}

function loadTheme() {
  const t = localStorage.getItem("theme") || "orange";
  setTheme(t);
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
    loadBucketItems();
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
  if (page === "bucket") loadBucketItems();
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
  const snap = await tripsRef().orderBy("createdAt", "desc").get();
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
    foreignCurrency: null, exchangeRate: null,
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
  scheduleEditId = null; expenseEditId = null; reservationEditId = null;

  const doc = await tripsRef().doc(tripId).get();
  currentTrip = { id: doc.id, ...doc.data() };
  renderTripInfo();
  loadSchedules();
  loadExpenses();
  loadReservations();
  loadTripBucketItems();
  updateMap();
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
}

function updateCurrencyDisplay() {
  const t = currentTrip;
  const rd = document.getElementById("rate-display");
  if (t && t.foreignCurrency) {
    rd.style.display = "inline";
    document.getElementById("currency-symbol").textContent = CURRENCY_SYMBOLS[t.foreignCurrency] || t.foreignCurrency;
    document.getElementById("rate-value-display").textContent = (t.exchangeRate || DEFAULT_RATES[t.foreignCurrency] || 1).toLocaleString();
    document.getElementById("foreign-col-header").textContent = "외화 (" + (CURRENCY_SYMBOLS[t.foreignCurrency] || "") + ")";
  } else {
    rd.style.display = "none";
    document.getElementById("foreign-col-header").textContent = "외화";
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

function updateMap() {
  const f = document.getElementById("map-frame");
  const q = (currentTrip.city ? currentTrip.city + " " : "") + (currentTrip.country || "");
  if (q.trim()) f.src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=ko`;
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
// SCHEDULES (Inline)
// ============================================================
function schedulesRef() { return tripsRef().doc(currentTripId).collection("schedules"); }

function toggleScheduleForm(editId) {
  scheduleEditId = editId || null;
  const form = document.getElementById("schedule-add-form");
  const isHidden = form.classList.contains("hidden");

  if (isHidden) {
    if (!editId) {
      document.getElementById("sch-category").value = "";
      document.getElementById("sch-date").value = currentTrip?.startDate || "";
      document.getElementById("sch-time").value = "";
      document.getElementById("sch-location").value = "";
      document.getElementById("sch-content").value = "";
      document.getElementById("sch-transport").value = "";
      document.getElementById("sch-notes").value = "";
    }
    form.classList.remove("hidden");
    document.getElementById("sch-date").focus();
  } else {
    form.classList.add("hidden");
    scheduleEditId = null;
  }
}

function cancelSchedule() {
  document.getElementById("schedule-add-form").classList.add("hidden");
  scheduleEditId = null;
}

async function loadSchedules() {
  const snap = await schedulesRef().orderBy("date").orderBy("time").get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderScheduleTable(items);
  renderTimetable(items);
}

function renderScheduleTable(items) {
  const tbody = document.getElementById("schedule-tbody");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;font-size:0.85rem">📅 일정을 추가해보세요</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((s) => `
    <tr>
      <td>${s.category ? `<span class="badge badge-${s.category}">${s.category}</span>` : "-"}</td>
      <td style="white-space:nowrap">${s.date || "-"}</td>
      <td style="color:var(--text-muted);white-space:nowrap">${s.time || "-"}</td>
      <td>${s.location || "-"}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.content || "-"}</td>
      <td style="color:var(--text-muted)">${s.transportation || "-"}</td>
      <td style="color:var(--text-muted)">${s.notes || "-"}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editScheduleInline('${s.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteSchedule('${s.id}')">🗑️</button>
      </td>
    </tr>`).join("");
}

async function editScheduleInline(id) {
  const doc = await schedulesRef().doc(id).get();
  const d = doc.data();
  document.getElementById("sch-category").value = d.category || "";
  document.getElementById("sch-date").value = d.date || "";
  document.getElementById("sch-time").value = d.time || "";
  document.getElementById("sch-location").value = d.location || "";
  document.getElementById("sch-content").value = d.content || "";
  document.getElementById("sch-transport").value = d.transportation || "";
  document.getElementById("sch-notes").value = d.notes || "";
  scheduleEditId = id;
  const form = document.getElementById("schedule-add-form");
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function saveSchedule() {
  const date = document.getElementById("sch-date").value;
  if (!date) { showToast("날짜를 입력해주세요 📅"); return; }
  const data = {
    category: document.getElementById("sch-category").value || null,
    date,
    time: document.getElementById("sch-time").value || null,
    location: document.getElementById("sch-location").value.trim() || null,
    content: document.getElementById("sch-content").value.trim() || null,
    transportation: document.getElementById("sch-transport").value.trim() || null,
    notes: document.getElementById("sch-notes").value.trim() || null,
  };
  if (scheduleEditId) {
    await schedulesRef().doc(scheduleEditId).update(data);
    showToast("일정 수정 완료 ✅");
  } else {
    await schedulesRef().add(data);
    showToast("일정 추가 완료 🎉");
  }
  cancelSchedule();
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
  if (items.length === 0) { c.innerHTML = `<div class="empty-msg">📅 일정을 추가해보세요</div>`; return; }
  const byDate = {};
  items.forEach((s) => { const d = s.date || "미정"; (byDate[d] = byDate[d] || []).push(s); });
  c.innerHTML = Object.keys(byDate).sort().map((date) => `
    <div class="timetable-day">
      <div class="timetable-day-label">📅 ${date}</div>
      <div class="timetable-items">
        ${byDate[date].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((s) => `
          <div class="timetable-item">
            <div class="timetable-time">${s.time || ""}</div>
            <div class="timetable-info">
              <h4>${s.location || s.content || "(장소 미입력)"}${s.category ? ` <span class="badge badge-${s.category}" style="font-size:0.65rem">${s.category}</span>` : ""}</h4>
              ${s.content && s.location ? `<p>${s.content}</p>` : ""}
              ${s.transportation ? `<p>🚌 ${s.transportation}</p>` : ""}
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

// ============================================================
// EXPENSES (Inline)
// ============================================================
function expensesRef() { return tripsRef().doc(currentTripId).collection("expenses"); }

function toggleExpenseForm(editId) {
  expenseEditId = editId || null;
  const form = document.getElementById("expense-add-form");
  const isHidden = form.classList.contains("hidden");

  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  const rate = currentTrip?.exchangeRate;
  document.getElementById("rate-hint").textContent = rate ? `1${sym} = ${rate.toLocaleString()}원` : "";
  document.getElementById("exp-foreign").disabled = !currentTrip?.foreignCurrency;

  if (isHidden) {
    if (!editId) {
      document.getElementById("exp-category").value = "";
      document.getElementById("exp-date").value = currentTrip?.startDate || "";
      document.getElementById("exp-title").value = "";
      document.getElementById("exp-krw").value = "";
      document.getElementById("exp-foreign").value = "";
    }
    form.classList.remove("hidden");
    document.getElementById("exp-title").focus();
  } else {
    form.classList.add("hidden");
    expenseEditId = null;
  }
}

function cancelExpense() {
  document.getElementById("expense-add-form").classList.add("hidden");
  expenseEditId = null;
}

function autoCalcForeign() {
  const krw = parseFloat(document.getElementById("exp-krw").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(krw) && rate) document.getElementById("exp-foreign").value = Math.round(krw / rate * 100) / 100;
}

function autoCalcKrw() {
  const foreign = parseFloat(document.getElementById("exp-foreign").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(foreign) && rate) document.getElementById("exp-krw").value = Math.round(foreign * rate);
}

async function loadExpenses() {
  const snap = await expensesRef().orderBy("date").get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;font-size:0.85rem">💸 지출 내역을 추가해보세요</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((e) => `
    <tr>
      <td>${e.category ? `<span class="badge badge-${e.category}">${e.category}</span>` : "-"}</td>
      <td style="white-space:nowrap">${e.date || "-"}</td>
      <td>${e.title}</td>
      <td style="text-align:right;font-weight:700">${e.amountKrw != null ? e.amountKrw.toLocaleString() + "원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${e.amountForeign != null && sym ? sym + e.amountForeign.toLocaleString() : "-"}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editExpenseInline('${e.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteExpense('${e.id}')">🗑️</button>
      </td>
    </tr>`).join("");
}

async function editExpenseInline(id) {
  const doc = await expensesRef().doc(id).get();
  const d = doc.data();
  document.getElementById("exp-category").value = d.category || "";
  document.getElementById("exp-date").value = d.date || "";
  document.getElementById("exp-title").value = d.title || "";
  document.getElementById("exp-krw").value = d.amountKrw ?? "";
  document.getElementById("exp-foreign").value = d.amountForeign ?? "";
  expenseEditId = id;
  const form = document.getElementById("expense-add-form");
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  const rate = currentTrip?.exchangeRate;
  document.getElementById("rate-hint").textContent = rate ? `1${sym} = ${rate.toLocaleString()}원` : "";
  document.getElementById("exp-foreign").disabled = !currentTrip?.foreignCurrency;
}

async function saveExpense() {
  const title = document.getElementById("exp-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요 ✏️"); return; }
  const data = {
    category: document.getElementById("exp-category").value || null,
    date: document.getElementById("exp-date").value || null,
    title,
    amountKrw: document.getElementById("exp-krw").value ? parseInt(document.getElementById("exp-krw").value) : null,
    amountForeign: document.getElementById("exp-foreign").value ? parseFloat(document.getElementById("exp-foreign").value) : null,
  };
  if (expenseEditId) {
    await expensesRef().doc(expenseEditId).update(data);
    showToast("지출 수정 완료 ✅");
  } else {
    await expensesRef().add(data);
    showToast("지출 추가 완료 💰");
  }
  cancelExpense();
  loadExpenses();
}

async function deleteExpense(id) {
  if (!confirm("이 지출을 삭제할까요?")) return;
  await expensesRef().doc(id).delete();
  showToast("삭제됐어요 🗑️");
  loadExpenses();
}

// ============================================================
// RESERVATIONS (Inline)
// ============================================================
function reservationsRef() { return tripsRef().doc(currentTripId).collection("reservations"); }

function toggleResForm() {
  const form = document.getElementById("res-add-form");
  const isHidden = form.classList.contains("hidden");
  if (isHidden) {
    reservationEditId = null;
    document.getElementById("res-category").value = "";
    document.getElementById("res-date").value = "";
    document.getElementById("res-title").value = "";
    document.getElementById("res-number").value = "";
    document.getElementById("res-notes").value = "";
    form.classList.remove("hidden");
    document.getElementById("res-title").focus();
  } else {
    form.classList.add("hidden");
    reservationEditId = null;
  }
}

async function loadReservations() {
  const snap = await reservationsRef().orderBy("date").get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const list = document.getElementById("res-list");

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-msg">🎫 예약 내역을 추가해보세요</div>`;
    return;
  }
  list.innerHTML = items.map((r) => `
    <div class="res-item">
      <div class="res-info">
        ${r.category ? `<span class="badge badge-${r.category}" style="margin-bottom:3px;display:inline-block">${r.category}</span>` : ""}
        <h4>${r.title}</h4>
        <p>${[r.date, r.reservationNumber].filter(Boolean).join(" · ") || ""}</p>
      </div>
      <div class="res-actions">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editResInline('${r.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteReservation('${r.id}')">🗑️</button>
      </div>
    </div>`).join("");
}

async function editResInline(id) {
  const doc = await reservationsRef().doc(id).get();
  const d = doc.data();
  document.getElementById("res-category").value = d.category || "";
  document.getElementById("res-date").value = d.date || "";
  document.getElementById("res-title").value = d.title || "";
  document.getElementById("res-number").value = d.reservationNumber || "";
  document.getElementById("res-notes").value = d.notes || "";
  reservationEditId = id;
  const form = document.getElementById("res-add-form");
  form.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function saveReservation() {
  const title = document.getElementById("res-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요 ✏️"); return; }
  const data = {
    category: document.getElementById("res-category").value || null,
    date: document.getElementById("res-date").value || null,
    title,
    reservationNumber: document.getElementById("res-number").value.trim() || null,
    notes: document.getElementById("res-notes").value.trim() || null,
  };
  if (reservationEditId) {
    await reservationsRef().doc(reservationEditId).update(data);
    showToast("수정 완료 ✅");
  } else {
    await reservationsRef().add(data);
    showToast("예약 추가 완료 🎫");
  }
  toggleResForm();
  loadReservations();
}

async function deleteReservation(id) {
  if (!confirm("이 예약을 삭제할까요?")) return;
  await reservationsRef().doc(id).delete();
  showToast("삭제됐어요 🗑️");
  loadReservations();
}

// ============================================================
// TRIP BUCKET — 여행계획 내 가고싶은 곳 (with region filter)
// ============================================================
function tripBucketRef() {
  return db.collection("users").doc(currentUser.uid).collection("bucketItems");
}

async function loadTripBucketItems() {
  if (!currentUser) return;
  const snap = await tripBucketRef().orderBy("category").get().catch(() => ({ docs: [] }));
  tripBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderTripBucket();
}

function renderTripBucket() {
  const regionFilter = (document.getElementById("trip-bucket-region")?.value || "").trim().toLowerCase();
  const board = document.getElementById("trip-bucket-board");
  if (!board) return;

  let items = tripBucketItems;
  if (regionFilter) {
    items = items.filter((i) => (i.region || "").toLowerCase().includes(regionFilter));
  }

  board.innerHTML = BUCKET_CATEGORIES.map((cat) => {
    const catItems = items.filter((i) => (i.category || "기타") === cat);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-cat-label">${CAT_EMOJI[cat] || "📌"} ${cat} <span style="color:var(--text-muted);font-weight:400">${catItems.length}</span></span>
        </div>
        <div class="kanban-col-items">
          ${catItems.length === 0 ? `<p style="text-align:center;color:var(--text-muted);font-size:0.75rem;padding:8px">비어있음</p>` : ""}
          ${catItems.map((item) => `
            <div class="kanban-item ${item.visited ? "visited" : ""}">
              <div class="kanban-item-name">
                <button class="visit-toggle ${item.visited ? "done" : ""}" onclick="toggleVisited('${item.id}',${item.visited},'trip')">${item.visited ? "✓" : ""}</button>
                <span class="${item.visited ? "done" : ""}">${item.placeName}</span>
              </div>
              <div class="kanban-item-actions">
                <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteBucketItem('${item.id}','trip')">🗑️</button>
              </div>
            </div>`).join("")}
        </div>
      </div>`;
  }).join("");
}

function openTripBucketModal(editId) {
  tripBucketEditId = editId || null;
  if (!editId) {
    document.getElementById("bk-season").value = "";
    document.getElementById("bk-country").value = "";
    document.getElementById("bk-notes").value = "";
    document.getElementById("bk-category").value = "";
    document.getElementById("bk-region").value = "";
    document.getElementById("bk-visited").checked = false;
    document.getElementById("bk-place").value = "";
  }
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
  if (tripBucketEditId) {
    await tripBucketRef().doc(tripBucketEditId).update(data);
    showToast("수정 완료 ✅");
  } else {
    await tripBucketRef().add(data);
    showToast("추가 완료 ⭐");
  }
  closeModal("modal-bucket-trip");
  loadTripBucketItems();
  loadBucketItems();
}

// ============================================================
// BUCKET LIST — 버킷플레이스 Main Page
// ============================================================
function bucketRef() {
  return db.collection("users").doc(currentUser.uid).collection("bucketItems");
}

async function loadBucketItems() {
  if (!currentUser) return;
  const snap = await bucketRef().orderBy("category").get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderKanban(items);
}

function applyBucketRegionFilter() {
  loadBucketItems();
}

function renderKanban(allItems) {
  const regionFilter = (document.getElementById("bucket-region-filter")?.value || "").trim().toLowerCase();
  const items = regionFilter ? allItems.filter((i) => (i.region || "").toLowerCase().includes(regionFilter)) : allItems;

  const board = document.getElementById("kanban-board");
  if (!board) return;

  board.innerHTML = BUCKET_CATEGORIES.map((cat) => {
    const catItems = items.filter((i) => (i.category || "기타") === cat);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-cat-label">${CAT_EMOJI[cat] || "📌"} ${cat} <span style="color:var(--text-muted);font-weight:400">${catItems.length}</span></span>
        </div>
        <div class="kanban-col-items" id="kanban-col-${cat}">
          ${catItems.length === 0 ? `<p style="text-align:center;color:var(--text-muted);font-size:0.75rem;padding:8px">비어있음</p>` : ""}
          ${catItems.map((item) => `
            <div class="kanban-item ${item.visited ? "visited" : ""}">
              <div class="kanban-item-name">
                <button class="visit-toggle ${item.visited ? "done" : ""}" onclick="toggleVisited('${item.id}',${item.visited},'main')">${item.visited ? "✓" : ""}</button>
                <span class="${item.visited ? "done" : ""}" title="${[item.region, item.country].filter(Boolean).join(', ')}">${item.placeName}</span>
              </div>
              <div class="kanban-item-actions">
                <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteBucketItem('${item.id}','main')">🗑️</button>
              </div>
            </div>`).join("")}
        </div>
        <div class="kanban-add-row" id="add-row-${cat}">
          <input class="kanban-add-input" id="add-input-${cat}" placeholder="장소 이름..." onkeydown="if(event.key==='Enter')addKanbanItem('${cat}')" />
          <button class="btn btn-primary btn-sm" onclick="addKanbanItem('${cat}')">＋</button>
        </div>
      </div>`;
  }).join("");
}

async function addKanbanItem(cat) {
  const input = document.getElementById("add-input-" + cat);
  const placeName = input.value.trim();
  if (!placeName) { input.focus(); return; }

  const regionFilter = (document.getElementById("bucket-region-filter")?.value || "").trim();
  const data = {
    placeName,
    category: cat,
    season: null,
    country: null,
    region: regionFilter || null,
    notes: null,
    visited: false,
  };
  await bucketRef().add(data);
  input.value = "";
  input.focus();
  showToast("추가됐어요 ⭐");
  loadBucketItems();
  tripBucketItems = (await bucketRef().orderBy("category").get().catch(() => ({ docs: [] }))).docs.map((d) => ({ id: d.id, ...d.data() }));
  renderTripBucket();
}

async function toggleVisited(id, current, source) {
  await bucketRef().doc(id).update({ visited: !current });
  if (source === "trip") {
    await loadTripBucketItems();
  } else {
    loadBucketItems();
    const snap = await bucketRef().orderBy("category").get().catch(() => ({ docs: [] }));
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
  } else {
    loadBucketItems();
    const snap = await bucketRef().orderBy("category").get().catch(() => ({ docs: [] }));
    tripBucketItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTripBucket();
  }
}

// ============================================================
// ESC to close modal
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal("modal-bucket-trip");
});
