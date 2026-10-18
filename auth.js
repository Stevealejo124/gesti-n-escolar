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

  try {
    const snapshot = await getDoc(doc(db, "usuarios", uid));
    return snapshot.exists() ? { ...snapshot.data(), uid: snapshot.id } : null;
  } catch (error) {
    console.error(`Firestore rechazó la lectura de usuarios/${uid}.`, error);
    throw error;
  }
}

/** Diagnóstico sin imprimir datos personales: indica qué condición del perfil no pasó. */
export function validateUserProfile(profile) {
  const documentExists = Boolean(profile);
  const checks = {
    documentExists,
    activoIsBooleanTrue: documentExists && profile.activo === true,
    rolIsAllowed: documentExists && VALID_ROLES.has(profile.rol),
    nombreIsNonEmptyString: documentExists
      && typeof profile.nombre === "string"
      && profile.nombre.trim().length > 0
  };
  return { ...checks, valid: Object.values(checks).every(Boolean) };
}

export function userProfileIssue(validation) {
  if (!validation?.documentExists) {
    return "No se encontró el documento de perfil usuarios/{UID}. Comprueba el proyecto Firebase y el ID del documento.";
  }
  if (!validation.activoIsBooleanTrue) {
    return "El perfil existe, pero el campo activo debe ser el valor booleano true.";
  }
  if (!validation.rolIsAllowed) {
    return "El perfil existe, pero rol debe ser exactamente docente, direccion o admin.";
  }
  if (!validation.nombreIsNonEmptyString) {
    return "El perfil existe, pero falta nombre como texto no vacío.";
  }
  return "El perfil no pasó la validación.";
}

export function isActiveProfile(profile) {
  return validateUserProfile(profile).valid;
}

export function roleLabel(rol) {
  const labels = {
    docente: "Docente",
    direccion: "Dirección",
    admin: "Administrador"
  };
  return labels[rol] || "Perfil sin asignar";
}
