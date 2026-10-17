import { getPendingCount } from './offline.js';

const pageName = document.body.dataset.page;
const navLinks = document.querySelectorAll('.nav-link[data-nav]');
navLinks.forEach((link) => {
  if (link.dataset.nav === pageName) {
    link.setAttribute('aria-current', 'page');
  } else {
    link.removeAttribute('aria-current');
  }
});

const connectionPill = document.querySelector('.connection-pill');
const connectionLabel = document.querySelector('[data-connection-label]');
const pendingCount = document.querySelector('[data-pending-count]');

async function updateConnectionStatus() {
  const online = navigator.onLine;
  if (connectionLabel) connectionLabel.textContent = online ? 'Con conexión' : 'Sin conexión';
  if (connectionPill) {
    connectionPill.classList.toggle('is-offline', !online);
    connectionPill.title = online
      ? 'Conexión a internet disponible; esto no confirma que los datos estén sincronizados.'
      : 'Sin conexión a internet. El modo offline básico está disponible.';
  }

  if (pendingCount) {
    try {
      const count = await getPendingCount();
      pendingCount.hidden = count === 0;
      pendingCount.textContent = count === 1 ? '1 cambio en cola' : `${count} cambios en cola`;
    } catch {
      pendingCount.hidden = true;
    }
  }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();

let toastTimeout;
let toastElement;
function showToast(message) {
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.className = 'toast-message';
    toastElement.setAttribute('role', 'status');
    toastElement.setAttribute('aria-live', 'polite');
    document.body.append(toastElement);
  }
  toastElement.textContent = message;
  toastElement.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toastElement?.classList.remove('is-visible'), 4300);
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-demo-action]') : null;
  if (!target) return;
  event.preventDefault();
  showToast(target.dataset.demoAction || 'Esta acción se habilitará en una fase posterior. No se guardó información.');
});

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const localHttp = location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname);
  if (location.protocol !== 'https:' && !localHttp) return;

  // nav.js y sw.js están en la raíz del sitio; la ruta relativa también funciona en Pages bajo /repositorio/.
  const workerUrl = new URL('./sw.js', import.meta.url);
  const scope = new URL('./', import.meta.url).pathname;
  navigator.serviceWorker.register(workerUrl.href, { scope }).catch((error) => {
    console.info('El Service Worker no se pudo registrar en este entorno.', error);
  });
}

window.addEventListener('load', registerServiceWorker, { once: true });
