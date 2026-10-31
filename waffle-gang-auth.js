/* Waffle Gang customer accounts: Firebase client SDK (public web config only). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  sendEmailVerification, updateProfile
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAAk2ecdaMOaMLy-lDfFjbc4Ng9g1YF7-A',
  authDomain: 'waffles-creative.firebaseapp.com',
  projectId: 'waffles-creative',
  appId: '1:283776557570:web:bb683fe375825a8fddbd1b'
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const shop = window.WaffleGangShop;
let activeUid = null;
let ready = false;
let syncTimer = null;
let syncBusy = Promise.resolve();
let authSequence = 0;
let dirty = false;

function status(id, message, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#9b1c1c' : '#222';
}
function errorMessage(e) {
  const messages = {
    'auth/email-already-in-use': 'This email already has an account. Use Login instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/weak-password': 'Use a stronger password (at least 6 characters).',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'Email/password accounts need to be enabled in Firebase.',
    'auth/unauthorized-domain': 'This website domain needs authorization in Firebase.',
    'permission-denied': 'Account created, but cloud saved-items access is blocked. Publish the Waffle Gang Firestore rules.'
  };
  return messages[e?.code] || 'Something went wrong. ' + (e?.message || 'Please try again.');
}
function goTo(hash) {
  if (location.hash !== '#' + hash) location.hash = hash;
  if (typeof window.navigate === 'function') window.navigate();
  window.scrollTo(0, 0);
}
function shopDocument(uid) { return doc(db, 'waffleGangShop', uid); }
function memberDocument(uid) { return doc(db, 'waffleGangMembers', uid); }
function normalizedCart(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(i => i && typeof i.id === 'string' &&
    typeof i.size === 'string' && Number.isInteger(i.qty) &&
    i.qty > 0 && i.qty <= 99).slice(0, 80).map(i => ({
      id: i.id, size: i.size, pantsSize: i.pantsSize || '',
      color: i.color || '', qty: i.qty
    }));
}
function mergeShop(cloud, guest) {
  const liked = [...new Set([...(cloud?.liked || []), ...(guest?.liked || [])])]
    .filter(v => typeof v === 'string').slice(0, 80);
  const cart = normalizedCart(cloud?.cart);
  for (const item of normalizedCart(guest?.cart)) {
    const existing = cart.find(c => c.id === item.id && c.size === item.size &&
      c.pantsSize === item.pantsSize && c.color === item.color);
    if (existing) existing.qty = Math.min(99, existing.qty + item.qty);
    else if (cart.length < 80) cart.push(item);
  }
  return { cart, liked };
}
function hasShopItems(data) {
  return !!(data?.cart?.length || data?.liked?.length);
}
function readGuestShop() {
  function read(key) {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  return { cart: read('waffles-cart-v3'), liked: read('waffles-liked-v1') };
}
function clearGuestShop() {
  localStorage.removeItem('waffles-cart-v3');
  localStorage.removeItem('waffles-liked-v1');
}
function setMemberUI(user) {
  const accountLink = $('account-button');
  if (accountLink) {
    accountLink.href = user ? '#member' : '#login';
    accountLink.setAttribute('aria-label', user ? 'Waffle Gang My Account' : 'Waffle Gang Login');
  }
  if ($('gang-member-name')) {
    $('gang-member-name').textContent =
      user?.displayName?.trim() || 'Member';
  }
  const editor = $('gang-name-editor');
  if (editor) editor.hidden = true;
  if ($('gang-name-edit')) {
    $('gang-name-edit').setAttribute('aria-expanded', 'false');
  }
  if (!user && $('gang-name-input')) {
    $('gang-name-input').value = '';
  }
  if ($('gang-member-email')) $('gang-member-email').textContent = user?.email || '';
  if ($('gang-member-verification')) {
    $('gang-member-verification').textContent = user && !user.emailVerified
      ? 'Please verify your email using the link sent to your inbox.' : '';
  }
}
function setPending(buttonId, pending) {
  if ($(buttonId)) $(buttonId).disabled = pending;
}
function requestSave() {
  if (!ready || !activeUid || !auth.currentUser || auth.currentUser.uid !== activeUid) return;
  dirty = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { void flushShop(); }, 450);
}
async function flushShop() {
  clearTimeout(syncTimer);
  if (!dirty || !activeUid || !auth.currentUser || auth.currentUser.uid !== activeUid) return syncBusy;
  dirty = false;
  const uid = activeUid;
  const data = shop.read();
  syncBusy = syncBusy.catch(() => {}).then(async () => {
    if (auth.currentUser?.uid !== uid) return;
    try {
      await setDoc(shopDocument(uid), {
        cart: normalizedCart(data.cart),
        liked: (data.liked || []).filter(v => typeof v === 'string').slice(0, 80),
        updatedAt: serverTimestamp()
      }, { merge: true });
      status('gang-member-sync', 'Your saved items are synced.');
    } catch (error) {
      dirty = true;
      status('gang-member-sync', errorMessage(error), true);
      throw error;
    }
  });
  return syncBusy;
}
window.addEventListener('waffle:shop-changed', requestSave);

// Switching accounts never exposes the previous account's cart to the next user.
onAuthStateChanged(auth, async user => {
  const sequence = ++authSequence;
  ready = false;
  activeUid = null;
  clearTimeout(syncTimer);
  dirty = false;
  setMemberUI(user);
  if (!user) {
    window.WaffleGangAuthenticated = false;
    shop.apply(readGuestShop());
    if (location.hash === '#member') goTo('login');
    return;
  }
  // If Firebase replaces one signed-in user with another, never merge the
  // previous user's in-memory cart into the next account.
  const guest = window.WaffleGangAuthenticated ? readGuestShop() : shop.read();
  window.WaffleGangAuthenticated = true;
  activeUid = user.uid;
  status('gang-member-sync', 'Restoring your saved items...');
  let restored = false;
  try {
    const snap = await getDoc(shopDocument(user.uid));
    if (sequence !== authSequence) return;
    const merged = mergeShop(snap.exists() ? snap.data() : null, guest);
    if (hasShopItems(guest) || !snap.exists()) {
      await setDoc(shopDocument(user.uid), {
        ...merged, updatedAt: serverTimestamp()
      }, { merge: true });
    }
    if (sequence !== authSequence) return;
    shop.apply(merged);
    clearGuestShop();
    ready = true;
    status('gang-member-sync', 'Your saved items are synced.');
    restored = true;
  } catch (error) {
    if (sequence !== authSequence) return;
    // Do not erase guest items when the server refuses the transfer.
    status('gang-member-sync', errorMessage(error), true);
    status('gang-login-status', errorMessage(error), true);
    shop.apply(guest);
    ready = true;
  }
  if (location.hash === '#login' || location.hash === '#initiation') {
    goTo(restored ? 'collection' : 'member');
  }
});

$('gang-login-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = $('gang-login-contact').value.trim();
  const password = $('gang-login-password').value;
  if (!email || !password) return status('gang-login-status', 'Enter your email and password.', true);
  setPending('gang-login-submit', true);
  status('gang-login-status', 'Signing in...');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    $('gang-login-password').value = '';
    status('gang-login-status', 'Welcome back.');
  } catch (error) {
    status('gang-login-status', errorMessage(error), true);
  } finally { setPending('gang-login-submit', false); }
});

$('waffle-gang-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = $('gang-email').value.trim();
  const displayName = $('gang-signup-name').value.trim();
  const phone = $('gang-phone').value.trim();
  const password = $('gang-signup-password').value;
  const confirm = $('gang-signup-confirm').value;
  if (!email) return status('gang-message', 'Email is required for secure signup. Phone can be added too.', true);
  if (password.length < 6) return status('gang-message', 'Password must have at least 6 characters.', true);
  if (password !== confirm) return status('gang-message', 'Passwords do not match.', true);
  if (phone && phone.replace(/\D/g, '').length < 10)
    return status('gang-message', 'Please enter a valid phone number.', true);
  setPending('gang-signup-submit', true);
  status('gang-message', 'Creating your account...');
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try {
        await updateProfile(result.user, { displayName });
        setMemberUI(result.user);
      } catch (error) {
        console.warn('Display name could not be saved:', error.code);
      }
    }
    try {
      await setDoc(memberDocument(result.user.uid), {
        email: result.user.email,
        phone,
        emailUpdates: $('gang-email-updates').checked,
        smsInterest: $('gang-sms-interest').checked,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      status('gang-member-sync', errorMessage(error), true);
    }
    try { await sendEmailVerification(result.user); }
    catch (error) { console.warn('Verification email unavailable:', error.code); }
    $('gang-signup-password').value = '';
    $('gang-signup-confirm').value = '';
    status('gang-message', 'Your account has been created. Restoring your saved items...');
    // The auth observer redirects only after cloud cart recovery succeeds.
  } catch (error) {
    status('gang-message', errorMessage(error), true);
  } finally { setPending('gang-signup-submit', false); }
});

$('gang-reset-password')?.addEventListener('click', async event => {
  event.preventDefault();
  const email = $('gang-login-contact').value.trim();
  if (!email) return status('gang-login-status', 'Enter your email address above to reset your password.', true);
  try {
    await sendPasswordResetEmail(auth, email);
    status('gang-login-status', 'If an account exists, a password reset email has been sent.');
  } catch (error) { status('gang-login-status', errorMessage(error), true); }
});

$('gang-logout')?.addEventListener('click', async () => {
  setPending('gang-logout', true);
  try {
    try { await flushShop(); }
    catch (err) {
      status('gang-member-sync', 'Could not save your changes. Try logging out again when online.', true);
      return;
    }
    await signOut(auth);
    goTo('collection');
  } catch (error) {
    status('gang-member-sync', errorMessage(error), true);
  } finally { setPending('gang-logout', false); }
});

/* WC_MEMBER_DISPLAY_NAME */
$('gang-name-edit')?.addEventListener('click', () => {
  const user = auth.currentUser;
  if (!user) return;
  const editor = $('gang-name-editor');
  editor.hidden = false;
  $('gang-name-input').value = user.displayName || '';
  $('gang-name-edit').setAttribute('aria-expanded', 'true');
  status('gang-name-status', '');
  $('gang-name-input').focus();
});

function closeNameEditor() {
  $('gang-name-editor').hidden = true;
  $('gang-name-edit').setAttribute('aria-expanded', 'false');
}

$('gang-name-cancel')?.addEventListener('click', closeNameEditor);

async function saveDisplayName() {
  const user = auth.currentUser;
  if (!user) return status('gang-name-status', 'Please log in first.', true);

  const name = $('gang-name-input').value.trim();
  if (!name || name.length > 50) {
    return status('gang-name-status', 'Enter a name of up to 50 characters.', true);
  }

  const uid = user.uid;
  const button = $('gang-name-save');
  button.disabled = true;
  status('gang-name-status', 'Saving your name...');

  try {
    await updateProfile(user, { displayName: name });
    if (auth.currentUser?.uid !== uid) return;
    setMemberUI(user);
  } catch (error) {
    status('gang-name-status', errorMessage(error), true);
  } finally {
    button.disabled = false;
  }
}

$('gang-name-save')?.addEventListener('click', saveDisplayName);

$('gang-name-input')?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    void saveDisplayName();
  }
  if (event.key === 'Escape') closeNameEditor();
});
