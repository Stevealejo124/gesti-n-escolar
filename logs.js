import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { auth, db } from "./auth.js";
import {
  getPendingChanges,
  queueChange,
  removePendingChange
} from "./offline.js";

const ALLOWED_TYPES = new Set(["login", "logout", "page_view"]);
const ALLOWED_SECTIONS = new Set([
  "index",
  "aportes",
  "notas",
  "horarios",
  "fichas"
]);
const NETWORK_ERROR_CODES = new Set([
  "unavailable",
  "deadline-exceeded",
  "network-request-failed",
  "internal"
]);

function notifyQueueChanged() {
  window.dispatchEvent(new Event("school:queue-changed"));
}

function createLogPayload(type, section, profile) {
  if (!ALLOWED_TYPES.has(type)) {
    throw new TypeError("Tipo de actividad no permitido.");
  }
  if (!ALLOWED_SECTIONS.has(section)) {
    throw new TypeError("Sección no permitida.");
  }
  if (!profile?.nombre || !auth.currentUser) {
    throw new Error("Se requiere una sesión y un perfil activo.");
  }

  return {
    actorUid: auth.currentUser.uid,
    actorName: profile.nombre,
    type,
    section
  };
}

async function writeLog(payload) {
  const user = auth.currentUser;
  if (!user || user.uid !== payload.actorUid) {
    throw new Error("La sesión actual no coincide con el autor del registro pendiente.");
  }

  await addDoc(collection(db, "logs"), {
    actorUid: payload.actorUid,
    actorName: payload.actorName,
    type: payload.type,
    section: payload.section,
    createdAt: serverTimestamp()
  });
}

export async function logAction(type, section, profile) {
  const payload = createLogPayload(type, section, profile);

  if (!navigator.onLine) {
    const id = await queueChange({ type: "activity-log", payload });
    notifyQueueChanged();
    return { saved: "indexeddb", id };
  }

  try {
    await writeLog(payload);
    return { saved: "firestore" };
  } catch (error) {
    if (NETWORK_ERROR_CODES.has(error?.code)) {
      const id = await queueChange({ type: "activity-log", payload });
      notifyQueueChanged();
      return { saved: "indexeddb", id };
    }
    throw error;
  }
}

export async function syncPendingLogs() {
  if (!navigator.onLine || !auth.currentUser) {
    return { synced: 0, offline: !navigator.onLine };
  }

  const pending = await getPendingChanges();
  const ownLogs = pending.filter((record) =>
    record.type === "activity-log"
    && record.payload?.actorUid === auth.currentUser.uid
  );
  let synced = 0;

  for (const record of ownLogs) {
    await writeLog(record.payload);
    await removePendingChange(record.id);
    synced += 1;
  }

  if (synced > 0) notifyQueueChanged();

  return {
    synced,
    remaining: ownLogs.length - synced,
    offline: false
  };
}

export async function fetchRecentActivity(maxItems = 15) {
  const safeLimit = Math.max(1, Math.min(Number(maxItems) || 15, 50));
  const recentQuery = query(
    collection(db, "logs"),
    orderBy("createdAt", "desc"),
    limit(safeLimit)
  );
  const snapshot = await getDocs(recentQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}
