// ===== FIREBASE SYNC =====
// Google 로그인 + Firestore 실시간 동기화

window.FB_FIREBASE_MODE = true; // app.js 초기 renderAll 억제

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDQi-FUnBmJixP5qVNRfeLxuB03w-gjYGc",
  authDomain: "moneylog-5e2d4.firebaseapp.com",
  projectId: "moneylog-5e2d4",
  storageBucket: "moneylog-5e2d4.firebasestorage.app",
  messagingSenderId: "155121899473",
  appId: "1:155121899473:web:1d08b4456749f7d025f2f0",
  measurementId: "G-GW3W353KKM"
};

firebase.initializeApp(FIREBASE_CONFIG);
const _auth = firebase.auth();
const _db   = firebase.firestore();

let _currentUser = null;
let _saveTimer   = null;

// ── Firestore 저장 (디바운스 1.5초) ──────────────────────────
window.FB_SAVE = function(state) {
  if (!_currentUser) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await _db.collection('users').doc(_currentUser.uid)
               .collection('data').doc('kakeibo')
               .set({
                 state: JSON.stringify(state),
                 updatedAt: firebase.firestore.FieldValue.serverTimestamp()
               });
    } catch(e) {
      console.error('[FB] 저장 오류:', e);
    }
  }, 1500);
};

// ── Firestore 불러오기 ────────────────────────────────────────
async function _loadFromFirestore(uid) {
  try {
    const doc = await _db.collection('users').doc(uid)
                          .collection('data').doc('kakeibo').get();
    if (doc.exists && doc.data().state) {
      return JSON.parse(doc.data().state);
    }
  } catch(e) {
    console.error('[FB] 불러오기 오류:', e);
  }
  return null;
}

// ── Google 로그인 ─────────────────────────────────────────────
window.FB_GOOGLE_LOGIN = async function() {
  const btn = document.getElementById('fb-login-btn');
  btn.disabled = true;
  btn.textContent = '로그인 중...';
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await _auth.signInWithPopup(provider);
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Google로 로그인';
    alert('로그인 실패: ' + e.message);
  }
};

// ── 로그아웃 ──────────────────────────────────────────────────
window.FB_LOGOUT = async function() {
  if (!confirm('로그아웃 하시겠어요?\n(데이터는 클라우드에 안전하게 저장되어 있습니다)')) return;
  await _auth.signOut();
};

// ── 오버레이 표시/숨김 ────────────────────────────────────────
function _showOverlay() {
  document.getElementById('fb-login-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}
function _hideOverlay() {
  document.getElementById('fb-login-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

// ── 사이드바 유저 정보 업데이트 ───────────────────────────────
function _updateUserUI(user) {
  const nameEl  = document.getElementById('fb-sidebar-name');
  const photoEl = document.getElementById('fb-sidebar-photo');
  if (!nameEl) return;
  nameEl.textContent = user.displayName || user.email;
  if (user.photoURL) {
    photoEl.src = user.photoURL;
    photoEl.style.display = 'block';
  }
}

// ── 인증 상태 감지 ────────────────────────────────────────────
_auth.onAuthStateChanged(async (user) => {
  if (user) {
    _currentUser = user;
    _updateUserUI(user);

    // Firestore 데이터 불러와서 S에 병합
    const fbData = await _loadFromFirestore(user.uid);
    if (fbData && window.FB_MERGE) {
      window.FB_MERGE(fbData);
    }

    _hideOverlay();

    // 즉시 렌더링 (타이밍 버그 수정: setTimeout 제거)
    if (window.App && window.App.renderAll) {
      try { window.App.renderAll(); } catch(e) { console.error(e); }
    } else {
      // App이 아직 로드 안 됐으면 DOMContentLoaded 이후 실행
      document.addEventListener('DOMContentLoaded', () => {
        if (window.App && window.App.renderAll) {
          try { window.App.renderAll(); } catch(e) { console.error(e); }
        }
      });
    }
  } else {
    _currentUser = null;
    _showOverlay();
  }
});
