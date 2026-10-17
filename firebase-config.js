import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

// Configuración web del proyecto. El API key identifica la app; la seguridad real se aplica con Auth y reglas de Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyAGrt5FBRECP2hgtwAT9d2DgvOJ3TIxM5o",
  authDomain: "gestion-escolar-9f588.firebaseapp.com",
  projectId: "gestion-escolar-9f588",
  storageBucket: "gestion-escolar-9f588.firebasestorage.app",
  messagingSenderId: "595225650447",
  appId: "1:595225650447:web:6b9cc2205a304a63778a7a",
  measurementId: "G-V3KS0S0MH9"
};

export { firebaseConfig };
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
// No se importa ni inicializa Firebase Analytics.
