import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

export const auth = getAuth(app);
export const db = getFirestore(app);

const VALID_ROLES = new Set(["docente", "direccion", "admin"]);
let persistencePromise;

function ensurePersistence() {
  if (!persistencePromise) {
    persistencePromise = setPersistence(auth, browserLocalPersistence);
  }
  return persistencePromise;
}

export async function signIn(email, password) {
  await ensurePersistence();
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function requestPasswordReset(email) {
  await ensurePersistence();
  return sendPasswordResetEmail(auth, email.trim());
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function waitForAuthState() {
  await ensurePersistence();
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, "usuarios", uid));
  return snapshot.exists() ? { ...snapshot.data(), uid: snapshot.id } : null;
}

export function isActiveProfile(profile) {
  return Boolean(
    profile
    && profile.activo === true
    && VALID_ROLES.has(profile.rol)
    && typeof profile.nombre === "string"
    && profile.nombre.trim().length > 0
  );
}

export function roleLabel(rol) {
  const labels = {
    docente: "Docente",
    direccion: "Dirección",
    admin: "Administrador"
  };
  return labels[rol] || "Perfil sin asignar";
}
