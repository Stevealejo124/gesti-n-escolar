import { getPendingCount } from "./offline.js";

const ROLE_PERMISSIONS = Object.freeze({
  aportes: ["docente", "direccion", "admin"],
  notas: ["docente", "direccion", "admin"],
  horarios: ["docente"],
  fichas: ["docente", "direccion", "admin"]
});

const pageName = document.body.dataset.page;
document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
  if (link.dataset.nav === pageName) link.setAttribute("aria-current", "page");
  else link.removeAttribute("aria-current");
});

function initialsFromName(nombre) {
  return String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("es") || "GE";
}

function defaultRoleLabel(rol) {
  const labels = {
    docente: "Docente",
    direccion: "Dirección",
    admin: "Administrador"
  };
  return labels[rol] || "Perfil sin asignar";
}

/* Los datos del documento de Firestore se muestran con los nombres reales del esquema: nombre y rol. */
export function renderAuthenticatedUser(user, getRoleLabel = defaultRoleLabel) {
  const nombre = typeof user?.nombre === "string" ? user.nombre.trim() : "";
  const rol = user?.rol;
  const initials = document.querySelector("[data-user-initials]");
  const nameNode = document.querySelector("[data-user-name]");
  const roleNode = document.querySelector("[data-user-role]");

  if (initials) initials.textContent = initialsFromName(nombre);
  if (nameNode) nameNode.textContent = nombre || user?.email || "Usuario institucional";
  if (roleNode) roleNode.textContent = getRoleLabel(rol);
}

export function canAccessPage(page, rol) {
  return Boolean(ROLE_PERMISSIONS[page]?.includes(rol));
}

export function applyRoleNavigation(rol) {
  document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
    link.hidden = !canAccessPage(link.dataset.nav, rol);
  });
}

const connectionPill = document.querySelector(".connection-pill");
const connectionLabel = document.querySelector("[data-connection-label]");
const pendingCount = document.querySelector("[data-pending-count]");

async function updateConnectionStatus() {
  const online = navigator.onLine;
  if (connectionLabel) connectionLabel.textContent = online ? "Con conexión" : "Sin conexión";
  if (connectionPill) {
    connectionPill.classList.toggle("is-offline", !online);
    connectionPill.title = online
      ? "Conexión a internet disponible; esto no confirma que los datos estén sincronizados."
      : "Sin conexión a internet. El acceso autenticado requiere validar la sesión con Firebase.";
  }
  if (pendingCount) {
    try {
      const count = await getPendingCount();
      pendingCount.hidden = count === 0;
      pendingCount.textContent = count === 1 ? "1 cambio en cola" : `${count} cambios en cola`;
    } catch {
      pendingCount.hidden = true;
    }
  }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);
window.addEventListener("school:queue-changed", updateConnectionStatus);
updateConnectionStatus();

let toastTimeout;
let toastElement;
function showToast(message) {
  if (!toastElement) {
    toastElement = document.createElement("div");
    toastElement.className = "toast-message";
    toastElement.setAttribute("role", "status");
    toastElement.setAttribute("aria-live", "polite");
    document.body.append(toastElement);
  }
  toastElement.textContent = message;
  toastElement.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toastElement?.classList.remove("is-visible"), 4300);
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest("[data-demo-action]") : null;
  if (!target) return;
  event.preventDefault();
  showToast(target.dataset.demoAction || "Esta acción se habilitará en una fase posterior. No se guardó información.");
});

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const localHttp = location.protocol === "http:" && ["localhost", "127.0.0.1"].includes(location.hostname);
  if (location.protocol !== "https:" && !localHttp) return;
  const workerUrl = new URL("./sw.js", import.meta.url);
  const scope = new URL("./", import.meta.url).pathname;
  navigator.serviceWorker.register(workerUrl.href, {
    scope,
    updateViaCache: "none"
  }).then((registration) => {
    // Fuerza la comprobación para que una caché previa no conserve auth.js antiguo.
    registration.update().catch((error) => {
      console.info("No se pudo comprobar si hay una versión nueva del Service Worker.", error);
    });
  }).catch((error) => {
    console.info("El Service Worker no se pudo registrar en este entorno.", error);
  });
}

window.addEventListener("load", registerServiceWorker, { once: true });
