// ============================================
// 여행을 떠나자 - Firebase App
// Firebase Firestore + Firebase Auth
// ============================================

// ⚠️  Firebase 설정 - Firebase 콘솔에서 가져온 값으로 교체하세요
// https://console.firebase.google.com → 프로젝트 설정 → 앱 추가 → 웹
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ---- Firebase 초기화 ----
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---- 상태 ----
let currentUser = null;
let currentTripId = null;
let currentTrip = null;
let scheduleEditId = null;
let expenseEditId = null;
let reservationEditId = null;
let bucketEditId = null;
let currentView = "table";
let bucketFilterCountry = "";
let bucketFilterRegion = "";
let tripFilter = "all";

const CURRENCY_SYMBOLS = { JPY: "¥", EUR: "€", USD: "$", CNY: "¥", THB: "฿", VND: "₫" };
const DEFAULT_RATES = { JPY: 9.2, EUR: 1500, USD: 1380, CNY: 190, THB: 38, VND: 0.056 };
const BUCKET_CATEGORIES = ["풍경", "맛집", "카페", "체험", "기념품", "숙소", "기타"];
const CATEGORY_COLORS = {
  풍경: "#bbf7d0", 맛집: "#fecaca", 카페: "#fde68a", 체험: "#bfdbfe",
  기념품: "#e9d5ff", 숙소: "#c7d2fe", 기타: "#e5e7eb"
};
const CATEGORY_TEXT_COLORS = {
  풍경: "#166534", 맛집: "#991b1b", 카페: "#92400e", 체험: "#1e3a8a",
  기념품: "#581c87", 숙소: "#312e81", 기타: "#374151"
};

// ============================================================
// AUTH
// ============================================================
auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    document.getElementById("user-email").textContent = user.email;
    document.getElementById("auth-btn").textContent = "로그아웃";
    loadTrips();
    loadBucketItems();
  } else {
    document.getElementById("user-email").textContent = "";
    document.getElementById("auth-btn").textContent = "로그인";
    document.getElementById("trips-container").innerHTML = `
      <div class="empty-state"><div class="icon">✈️</div>
      <h3>로그인이 필요합니다</h3>
      <p>로그인 후 여행 기록을 시작하세요.</p>
      <button class="btn btn-primary" style="margin-top:16px" onclick="handleAuth()">로그인 / 회원가입</button></div>`;
  }
});

function handleAuth() {
  if (currentUser) {
    auth.signOut();
  } else {
    const email = prompt("이메일을 입력하세요:");
    if (!email) return;
    const password = prompt("비밀번호를 입력하세요 (6자 이상):");
    if (!password) return;
    auth.signInWithEmailAndPassword(email, password)
      .catch(() => {
        if (confirm("계정이 없습니다. 새로 만들까요?")) {
          auth.createUserWithEmailAndPassword(email, password)
            .catch((e) => showToast("오류: " + e.message));
        }
      });
  }
}

// ============================================================
// PAGE NAVIGATION
// ============================================================
function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll("nav a").forEach((a) => a.classList.remove("active"));
  if (page === "home") { document.getElementById("nav-home").classList.add("active"); loadTrips(); }
  if (page === "bucket") { document.getElementById("nav-bucket").classList.add("active"); loadBucketItems(); }
}

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

// ============================================================
// TRIPS
// ============================================================
function tripsRef() {
  return db.collection("users").doc(currentUser.uid).collection("trips");
}

async function loadTrips() {
  if (!currentUser) return;
  const container = document.getElementById("trips-container");
  container.innerHTML = "<div class='spinner'></div>";
  const snap = await tripsRef().orderBy("createdAt", "desc").get();
  const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let filtered = trips;
  if (tripFilter === "overseas") filtered = trips.filter((t) => t.country && t.country !== "한국" && t.country !== "국내");
  if (tripFilter === "domestic") filtered = trips.filter((t) => !t.country || t.country === "한국" || t.country === "국내");

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">✈️</div><h3>아직 기록된 여행이 없어요</h3><p>첫 번째 여행을 만들고 일정을 계획해보세요.</p></div>`;
    return;
  }

  // Group by year
  const byYear = {};
  filtered.forEach((t) => {
    const year = t.startDate ? t.startDate.substring(0, 4) : "미정";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(t);
  });

  let html = "";
  Object.keys(byYear).sort((a, b) => b.localeCompare(a)).forEach((year) => {
    html += `<div class="year-group"><div class="year-label">${year}</div><div class="trip-grid">`;
    byYear[year].forEach((t) => {
      const img = t.coverImage
        ? `<img src="${t.coverImage}" alt="${t.title}" onerror="this.parentElement.innerHTML='✈️'" />`
        : "✈️";
      html += `<div class="trip-card" onclick="openTrip('${t.id}')">
        <div class="trip-card-img">${img}</div>
        <div class="trip-card-body">
          <div class="trip-card-title">${t.title}</div>
          <div class="trip-card-meta">
            ${t.startDate || "-"} ~ ${t.endDate || ""}
            <span>${[t.city, t.country].filter(Boolean).join(", ") || ""}</span>
          </div>
          <div class="trip-card-tags">
            ${t.companions ? `<span class="tag">${t.companions}</span>` : ""}
          </div>
        </div>
      </div>`;
    });
    html += "</div></div>";
  });
  container.innerHTML = html;
}

function filterTrips(type, el) {
  tripFilter = type;
  document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  loadTrips();
}

function openCreateTripModal() {
  if (!currentUser) { showToast("먼저 로그인하세요."); return; }
  ["ct-title","ct-country","ct-city","ct-companions","ct-image"].forEach((id) => document.getElementById(id).value = "");
  document.getElementById("ct-start").value = "";
  document.getElementById("ct-end").value = "";
  openModal("modal-create-trip");
}

async function createTrip() {
  const title = document.getElementById("ct-title").value.trim();
  if (!title) { showToast("여행 제목을 입력해주세요."); return; }
  const data = {
    title,
    country: document.getElementById("ct-country").value.trim() || null,
    city: document.getElementById("ct-city").value.trim() || null,
    startDate: document.getElementById("ct-start").value || null,
    endDate: document.getElementById("ct-end").value || null,
    companions: document.getElementById("ct-companions").value.trim() || null,
    coverImage: document.getElementById("ct-image").value.trim() || null,
    foreignCurrency: null,
    exchangeRate: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await tripsRef().add(data);
  closeModal("modal-create-trip");
  showToast("여행이 생성되었습니다!");
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
  updateMap();
}

function renderTripInfo() {
  const t = currentTrip;
  document.getElementById("trip-title-display").textContent = t.title;
  document.getElementById("trip-dates-display").textContent = `${t.startDate || "-"} ~ ${t.endDate || ""}`;
  document.getElementById("trip-companions-display").textContent = t.companions || "혼자";
  document.getElementById("trip-location-display").textContent = [t.city, t.country].filter(Boolean).join(", ") || "-";

  const img = document.getElementById("trip-hero-img");
  if (t.coverImage) { img.src = t.coverImage; img.classList.remove("hidden"); }
  else img.classList.add("hidden");

  document.getElementById("currency-select").value = t.foreignCurrency || "";
  updateCurrencyDisplay();
}

function updateCurrencyDisplay() {
  const t = currentTrip;
  const rateDisplay = document.getElementById("rate-display");
  if (t.foreignCurrency) {
    rateDisplay.style.display = "inline";
    document.getElementById("currency-symbol").textContent = CURRENCY_SYMBOLS[t.foreignCurrency] || t.foreignCurrency;
    document.getElementById("rate-value-display").textContent = (t.exchangeRate || DEFAULT_RATES[t.foreignCurrency] || 1).toLocaleString();
    document.getElementById("foreign-col-header").textContent = `외화 (${CURRENCY_SYMBOLS[t.foreignCurrency]})`;
  } else {
    rateDisplay.style.display = "none";
    document.getElementById("foreign-col-header").textContent = "외화";
  }
}

async function onCurrencyChange(code) {
  currentTrip.foreignCurrency = code || null;
  currentTrip.exchangeRate = code ? (DEFAULT_RATES[code] || 1) : null;
  await tripsRef().doc(currentTripId).update({ foreignCurrency: currentTrip.foreignCurrency, exchangeRate: currentTrip.exchangeRate });
  updateCurrencyDisplay();
  renderExpenses(await getExpenses());
}

function editRate() {
  const newRate = parseFloat(prompt("새 환율을 입력하세요 (원화 기준):", currentTrip.exchangeRate));
  if (isNaN(newRate) || newRate <= 0) return;
  currentTrip.exchangeRate = newRate;
  tripsRef().doc(currentTripId).update({ exchangeRate: newRate });
  updateCurrencyDisplay();
  renderExpenses(null); // re-render summary only
  loadExpenses();
}

function updateMap() {
  const frame = document.getElementById("map-frame");
  const q = currentTrip.googleMapsUrl || (currentTrip.city ? `${currentTrip.city} ${currentTrip.country || ""}` : null);
  if (q) {
    frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=ko`;
  } else {
    frame.src = "";
  }
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
  document.getElementById("view-table-btn").style.background = view === "table" ? "var(--primary-light)" : "";
  document.getElementById("view-table-btn").style.color = view === "table" ? "var(--primary)" : "";
  document.getElementById("view-time-btn").style.background = view === "timetable" ? "var(--primary-light)" : "";
  document.getElementById("view-time-btn").style.color = view === "timetable" ? "var(--primary)" : "";
}

// ============================================================
// SCHEDULES
// ============================================================
function schedulesRef() {
  return tripsRef().doc(currentTripId).collection("schedules");
}

async function loadSchedules() {
  const snap = await schedulesRef().orderBy("date").orderBy("time").get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderScheduleTable(items);
  renderTimetable(items);
}

function renderScheduleTable(items) {
  const tbody = document.getElementById("schedule-tbody");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">일정을 추가해보세요.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((s) => `
    <tr>
      <td>${s.category ? `<span class="badge badge-${s.category.replace("/","")}">${s.category}</span>` : "-"}</td>
      <td>${s.date || "-"}</td>
      <td style="color:var(--text-muted)">${s.time || "-"}</td>
      <td>${s.location || "-"}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.content || "-"}</td>
      <td style="color:var(--text-muted)">${s.transportation || "-"}</td>
      <td style="color:var(--text-muted)">${s.notes || "-"}</td>
      <td>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editSchedule('${s.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteSchedule('${s.id}')">🗑️</button>
      </td>
    </tr>`).join("");
}

function renderTimetable(items) {
  const container = document.getElementById("schedule-timetable-view");
  if (items.length === 0) { container.innerHTML = `<div class="empty-state"><div class="icon">📅</div><p>일정을 추가해보세요.</p></div>`; return; }
  const byDate = {};
  items.forEach((s) => {
    const d = s.date || "미정";
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(s);
  });
  container.innerHTML = Object.keys(byDate).sort().map((date) => `
    <div class="timetable-day">
      <div class="timetable-day-label">${date}</div>
      <div class="timetable-items">
        ${byDate[date].sort((a,b)=>(a.time||"").localeCompare(b.time||"")).map((s) => `
          <div class="timetable-item">
            <div class="timetable-time">${s.time || ""}</div>
            <div class="timetable-info">
              <h4>${s.location || s.content || "(장소 미입력)"}${s.category ? ` <span class="badge badge-${s.category.replace("/","")}" style="font-size:0.7rem">${s.category}</span>` : ""}</h4>
              ${s.content && s.location ? `<p>${s.content}</p>` : ""}
              ${s.transportation ? `<p>🚌 ${s.transportation}</p>` : ""}
            </div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

function openScheduleModal(editId = null) {
  scheduleEditId = editId;
  document.getElementById("schedule-modal-title").textContent = editId ? "일정 수정" : "일정 추가";
  if (!editId) {
    ["sch-time","sch-location","sch-content","sch-transport","sch-notes"].forEach((id) => document.getElementById(id).value = "");
    document.getElementById("sch-category").value = "";
    document.getElementById("sch-date").value = currentTrip?.startDate || "";
  }
  openModal("modal-schedule");
}

async function editSchedule(id) {
  const doc = await schedulesRef().doc(id).get();
  const d = doc.data();
  document.getElementById("sch-category").value = d.category || "";
  document.getElementById("sch-date").value = d.date || "";
  document.getElementById("sch-time").value = d.time || "";
  document.getElementById("sch-location").value = d.location || "";
  document.getElementById("sch-content").value = d.content || "";
  document.getElementById("sch-transport").value = d.transportation || "";
  document.getElementById("sch-notes").value = d.notes || "";
  openScheduleModal(id);
}

async function saveSchedule() {
  const date = document.getElementById("sch-date").value;
  if (!date) { showToast("날짜를 입력해주세요."); return; }
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
    showToast("일정이 수정되었습니다.");
  } else {
    await schedulesRef().add(data);
    showToast("일정이 추가되었습니다.");
  }
  closeModal("modal-schedule");
  loadSchedules();
}

async function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;
  await schedulesRef().doc(id).delete();
  showToast("삭제되었습니다.");
  loadSchedules();
}

// ============================================================
// EXPENSES
// ============================================================
function expensesRef() {
  return tripsRef().doc(currentTripId).collection("expenses");
}

async function getExpenses() {
  const snap = await expensesRef().orderBy("date").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadExpenses() {
  const items = await getExpenses();
  renderExpenses(items);
}

function renderExpenses(items) {
  if (!items) return;
  const tbody = document.getElementById("expense-tbody");
  const rate = currentTrip?.exchangeRate || 1;
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";

  let totalKrw = 0, totalForeign = 0;
  items.forEach((e) => { totalKrw += e.amountKrw || 0; totalForeign += e.amountForeign || 0; });

  document.getElementById("total-krw-display").textContent = totalKrw.toLocaleString() + "원";
  document.getElementById("total-foreign-display").textContent = sym + totalForeign.toLocaleString();
  document.getElementById("expense-summary-display").textContent = `합계 ${totalKrw.toLocaleString()}원${currentTrip?.foreignCurrency ? " / " + sym + totalForeign.toLocaleString() : ""}`;
  document.getElementById("trip-budget-display").textContent = totalKrw.toLocaleString() + "원";

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">지출 내역을 추가해보세요.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((e) => `
    <tr>
      <td>${e.category ? `<span class="badge badge-default">${e.category}</span>` : "-"}</td>
      <td>${e.date || "-"}</td>
      <td>${e.title}</td>
      <td style="text-align:right;font-weight:600">${e.amountKrw != null ? e.amountKrw.toLocaleString() + "원" : "-"}</td>
      <td style="text-align:right;color:var(--text-muted)">${e.amountForeign != null ? sym + e.amountForeign.toLocaleString() : "-"}</td>
      <td>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editExpense('${e.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteExpense('${e.id}')">🗑️</button>
      </td>
    </tr>`).join("");
}

function openExpenseModal(editId = null) {
  expenseEditId = editId;
  document.getElementById("expense-modal-title").textContent = editId ? "지출 수정" : "지출 추가";
  const sym = CURRENCY_SYMBOLS[currentTrip?.foreignCurrency] || "";
  const rate = currentTrip?.exchangeRate;
  document.getElementById("exp-currency-label").textContent = sym || "외화 미설정";
  document.getElementById("exp-foreign").disabled = !currentTrip?.foreignCurrency;
  document.getElementById("rate-hint").textContent = rate ? `적용 환율: 1${sym} = ${rate.toLocaleString()}원` : "";
  if (!editId) {
    ["exp-title","exp-krw","exp-foreign"].forEach((id) => document.getElementById(id).value = "");
    document.getElementById("exp-category").value = "";
    document.getElementById("exp-date").value = currentTrip?.startDate || "";
  }
  openModal("modal-expense");
}

async function editExpense(id) {
  const doc = await expensesRef().doc(id).get();
  const d = doc.data();
  document.getElementById("exp-category").value = d.category || "";
  document.getElementById("exp-date").value = d.date || "";
  document.getElementById("exp-title").value = d.title || "";
  document.getElementById("exp-krw").value = d.amountKrw ?? "";
  document.getElementById("exp-foreign").value = d.amountForeign ?? "";
  openExpenseModal(id);
}

function autoCalcForeign() {
  const krw = parseFloat(document.getElementById("exp-krw").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(krw) && rate) {
    document.getElementById("exp-foreign").value = Math.round(krw / rate * 100) / 100;
  }
}

function autoCalcKrw() {
  const foreign = parseFloat(document.getElementById("exp-foreign").value);
  const rate = currentTrip?.exchangeRate;
  if (!isNaN(foreign) && rate) {
    document.getElementById("exp-krw").value = Math.round(foreign * rate);
  }
}

async function saveExpense() {
  const title = document.getElementById("exp-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요."); return; }
  const krw = document.getElementById("exp-krw").value;
  const foreign = document.getElementById("exp-foreign").value;
  const data = {
    category: document.getElementById("exp-category").value || null,
    date: document.getElementById("exp-date").value || null,
    title,
    amountKrw: krw ? parseInt(krw) : null,
    amountForeign: foreign ? parseFloat(foreign) : null,
  };
  if (expenseEditId) {
    await expensesRef().doc(expenseEditId).update(data);
    showToast("수정되었습니다.");
  } else {
    await expensesRef().add(data);
    showToast("지출이 추가되었습니다.");
  }
  closeModal("modal-expense");
  loadExpenses();
}

async function deleteExpense(id) {
  if (!confirm("이 지출 항목을 삭제할까요?")) return;
  await expensesRef().doc(id).delete();
  showToast("삭제되었습니다.");
  loadExpenses();
}

// ============================================================
// RESERVATIONS
// ============================================================
function reservationsRef() {
  return tripsRef().doc(currentTripId).collection("reservations");
}

async function loadReservations() {
  const snap = await reservationsRef().orderBy("date").get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const list = document.getElementById("res-list");
  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="icon">🎫</div><p>예약 내역이 없습니다.</p></div>`;
    return;
  }
  list.innerHTML = items.map((r) => `
    <div class="res-item">
      <div class="res-info">
        ${r.category ? `<span class="badge badge-default" style="font-size:0.75rem;margin-bottom:4px">${r.category}</span>` : ""}
        <h4>${r.title}</h4>
        <p>${[r.date, r.reservationNumber].filter(Boolean).join(" · ") || ""}</p>
      </div>
      <div class="res-actions">
        <button class="btn btn-ghost btn-icon btn-sm" onclick="editReservation('${r.id}')">✏️</button>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteReservation('${r.id}')">🗑️</button>
      </div>
    </div>`).join("");
}

function openResModal(editId = null) {
  reservationEditId = editId;
  document.getElementById("res-modal-title").textContent = editId ? "예약 수정" : "예약 추가";
  if (!editId) {
    ["res-title","res-number","res-notes"].forEach((id) => document.getElementById(id).value = "");
    document.getElementById("res-category").value = "";
    document.getElementById("res-date").value = "";
  }
  openModal("modal-res");
}

async function editReservation(id) {
  const doc = await reservationsRef().doc(id).get();
  const d = doc.data();
  document.getElementById("res-category").value = d.category || "";
  document.getElementById("res-date").value = d.date || "";
  document.getElementById("res-title").value = d.title || "";
  document.getElementById("res-number").value = d.reservationNumber || "";
  document.getElementById("res-notes").value = d.notes || "";
  openResModal(id);
}

async function saveReservation() {
  const title = document.getElementById("res-title").value.trim();
  if (!title) { showToast("제목을 입력해주세요."); return; }
  const data = {
    category: document.getElementById("res-category").value || null,
    date: document.getElementById("res-date").value || null,
    title,
    reservationNumber: document.getElementById("res-number").value.trim() || null,
    notes: document.getElementById("res-notes").value.trim() || null,
  };
  if (reservationEditId) {
    await reservationsRef().doc(reservationEditId).update(data);
    showToast("수정되었습니다.");
  } else {
    await reservationsRef().add(data);
    showToast("예약이 추가되었습니다.");
  }
  closeModal("modal-res");
  loadReservations();
}

async function deleteReservation(id) {
  if (!confirm("이 예약을 삭제할까요?")) return;
  await reservationsRef().doc(id).delete();
  showToast("삭제되었습니다.");
  loadReservations();
}

// ============================================================
// BUCKET LIST
// ============================================================
function bucketRef() {
  return db.collection("users").doc(currentUser.uid).collection("bucketItems");
}

async function loadBucketItems() {
  if (!currentUser) return;
  let query = bucketRef().orderBy("category").orderBy("placeName");
  if (bucketFilterCountry) query = query.where("country", "==", bucketFilterCountry);
  if (bucketFilterRegion) query = query.where("region", "==", bucketFilterRegion);

  const snap = await query.get().catch(() => ({ docs: [] }));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderKanban(items);
}

function renderKanban(items) {
  const board = document.getElementById("kanban-board");
  board.innerHTML = BUCKET_CATEGORIES.map((cat) => {
    const catItems = items.filter((i) => (i.category || "기타") === cat);
    const bg = CATEGORY_COLORS[cat] || CATEGORY_COLORS["기타"];
    const tc = CATEGORY_TEXT_COLORS[cat] || CATEGORY_TEXT_COLORS["기타"];
    return `
      <div class="kanban-col">
        <div class="kanban-col-header" style="background:${bg}20;border-bottom-color:${bg}">
          <span style="background:${bg};color:${tc};padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:700">${cat} ${catItems.length}</span>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="openBucketModal(null,'${cat}')">+</button>
        </div>
        <div class="kanban-col-items">
          ${catItems.length === 0 ? "<p style='text-align:center;color:var(--text-muted);font-size:0.8rem;padding:12px'>비어있음</p>" : ""}
          ${catItems.map((item) => `
            <div class="kanban-item ${item.visited ? "visited" : ""}">
              <div class="kanban-item-name">
                <button class="visit-toggle ${item.visited ? "done" : ""}" onclick="toggleVisited('${item.id}', ${item.visited})" title="방문 여부">${item.visited ? "✓" : ""}</button>
                <span class="${item.visited ? "done" : ""}">${item.placeName}</span>
              </div>
              <div class="kanban-item-meta">${[item.country, item.region].filter(Boolean).join(" · ") || ""}</div>
              ${item.season ? `<span class="season-tag">${item.season}</span>` : ""}
              <div class="kanban-item-actions">
                <button class="btn btn-ghost btn-icon btn-sm" onclick="editBucketItem('${item.id}')">✏️</button>
                <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteBucketItem('${item.id}')">🗑️</button>
              </div>
            </div>`).join("")}
        </div>
      </div>`;
  }).join("");
}

function toggleBucketFilter() {
  document.getElementById("bucket-filter-bar").classList.toggle("hidden");
}

function applyBucketFilter() {
  bucketFilterCountry = document.getElementById("filter-country").value.trim();
  bucketFilterRegion = document.getElementById("filter-region").value.trim();
  loadBucketItems();
}

function clearBucketFilter() {
  bucketFilterCountry = "";
  bucketFilterRegion = "";
  document.getElementById("filter-country").value = "";
  document.getElementById("filter-region").value = "";
  loadBucketItems();
}

function openBucketModal(editId = null, defaultCat = "") {
  bucketEditId = editId;
  document.getElementById("bucket-modal-title").textContent = editId ? "장소 수정" : "장소 추가";
  if (!editId) {
    ["bk-place","bk-country","bk-region","bk-notes"].forEach((id) => document.getElementById(id).value = "");
    document.getElementById("bk-category").value = defaultCat;
    document.getElementById("bk-season").value = "";
  }
  openModal("modal-bucket");
}

async function editBucketItem(id) {
  const doc = await bucketRef().doc(id).get();
  const d = doc.data();
  document.getElementById("bk-place").value = d.placeName || "";
  document.getElementById("bk-category").value = d.category || "";
  document.getElementById("bk-season").value = d.season || "";
  document.getElementById("bk-country").value = d.country || "";
  document.getElementById("bk-region").value = d.region || "";
  document.getElementById("bk-notes").value = d.notes || "";
  openBucketModal(id);
}

async function saveBucketItem() {
  const placeName = document.getElementById("bk-place").value.trim();
  if (!placeName) { showToast("장소명을 입력해주세요."); return; }
  const data = {
    placeName,
    category: document.getElementById("bk-category").value || "기타",
    season: document.getElementById("bk-season").value || null,
    country: document.getElementById("bk-country").value.trim() || null,
    region: document.getElementById("bk-region").value.trim() || null,
    notes: document.getElementById("bk-notes").value.trim() || null,
    visited: false,
  };
  if (bucketEditId) {
    await bucketRef().doc(bucketEditId).update(data);
    showToast("수정되었습니다.");
  } else {
    await bucketRef().add(data);
    showToast("추가되었습니다.");
  }
  closeModal("modal-bucket");
  loadBucketItems();
}

async function toggleVisited(id, current) {
  await bucketRef().doc(id).update({ visited: !current });
  loadBucketItems();
}

async function deleteBucketItem(id) {
  if (!confirm("이 장소를 삭제할까요?")) return;
  await bucketRef().doc(id).delete();
  showToast("삭제되었습니다.");
  loadBucketItems();
}

// ============================================================
// ESC to close modal
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    ["modal-create-trip","modal-schedule","modal-expense","modal-res","modal-bucket"]
      .forEach((id) => closeModal(id));
  }
});
