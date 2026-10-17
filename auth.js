import { firebaseConfig, firebaseVersion, isFirebaseConfigured } from './firebase-config.js';

let sdkPromise;
let authPromise;

async function loadFirebaseSdk() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase aún no está configurado. Completa firebase-config.js en la fase de autenticación.');
  }
  if (!sdkPromise) {
    const cdnBase = `https://www.gstatic.com/firebasejs/${firebaseVersion}`;
    sdkPromise = Promise.all([
      import(`${cdnBase}/firebase-app.js`),
      import(`${cdnBase}/firebase-auth.js`)
    ]).catch((error) => {
      sdkPromise = undefined;
      throw error;
    });
  }
  return sdkPromise;
}

async function getAuthContext() {
  if (!authPromise) {
    authPromise = (async () => {
      const [appSdk, authSdk] = await loadFirebaseSdk();
      const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
      return { auth: authSdk.getAuth(app), authSdk };
    })().catch((error) => {
      authPromise = undefined;
      throw error;
    });
  }
  return authPromise;
}

export async function signIn(email, password) {
  const { auth, authSdk } = await getAuthContext();
  const credential = await authSdk.signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function signOut() {
  const { auth, authSdk } = await getAuthContext();
  await authSdk.signOut(auth);
}

export async function observeAuthState(callback) {
  if (typeof callback !== 'function') throw new TypeError('callback debe ser una función.');
  const { auth, authSdk } = await getAuthContext();
  return authSdk.onAuthStateChanged(auth, callback);
}

export async function getCurrentUser() {
  const { auth } = await getAuthContext();
  return auth.currentUser;
}
