/* Cola local genérica con IndexedDB nativo. No almacenar contraseñas ni datos sensibles sin definir antes controles de seguridad. */
const DATABASE_NAME = 'gestion-escolar-local';
const DATABASE_VERSION = 1;
const STORE_NAME = 'pendingChanges';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no está disponible en este navegador.'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'));
    request.onblocked = () => reject(new Error('La actualización de IndexedDB está bloqueada por otra pestaña.'));
  });
}

export async function queueChange(change) {
  if (!change || typeof change !== 'object' || Array.isArray(change)) {
    throw new TypeError('El cambio debe ser un objeto.');
  }
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const record = { ...change, queuedAt: new Date().toISOString(), state: 'pending' };
    delete record.id;
    let id;
    const request = transaction.objectStore(STORE_NAME).add(record);
    request.onsuccess = () => { id = request.result; };
    transaction.oncomplete = () => { database.close(); resolve(id); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('No se pudo guardar el cambio local.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error('La operación local fue cancelada.')); };
  });
}

export async function getPendingChanges() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    let records = [];
    request.onsuccess = () => { records = request.result || []; };
    transaction.oncomplete = () => {
      database.close();
      resolve(records.filter((record) => record.state === 'pending').sort((a, b) => a.id - b.id));
    };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('No se pudo leer la cola local.')); };
  });
}

export async function getPendingCount() {
  const records = await getPendingChanges();
  return records.length;
}

export async function removePendingChange(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('No se pudo retirar el cambio de la cola.')); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error('La operación local fue cancelada.')); };
  });
}

/* syncHandler lo aporta una fase posterior (Firebase/Apps Script). Si falla, la cola conserva el elemento. */
export async function flushQueue(syncHandler) {
  if (typeof syncHandler !== 'function') throw new TypeError('Se requiere una función de sincronización.');
  if (!navigator.onLine) return { synced: 0, remaining: await getPendingCount(), offline: true };

  const records = await getPendingChanges();
  let synced = 0;
  for (const record of records) {
    try {
      await syncHandler(record);
      await removePendingChange(record.id);
      synced += 1;
    } catch (error) {
      return { synced, remaining: records.length - synced, offline: false, error };
    }
  }
  return { synced, remaining: 0, offline: false };
}
