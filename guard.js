const protectedContent = document.querySelector("[data-protected-content]");
const gate = document.querySelector("[data-auth-gate]");
const gateTitle = document.querySelector("[data-auth-gate-title]");
const gateDetail = document.querySelector("[data-auth-gate-detail]");
const gateLink = document.querySelector("[data-auth-gate-link]");
const pageName = document.body.dataset.page;
const allowedRoles = (document.body.dataset.allowedRoles || "")
  .split(",")
  .map((role) => role.trim())
  .filter(Boolean);
const supervisors = new Set(["director", "subdirectora"]);

function setGate(title, detail, linkHref = "./index.html", linkText = "Volver al inicio de sesión") {
  if (protectedContent) protectedContent.hidden = true;
  if (gate) gate.hidden = false;
  if (gateTitle) gateTitle.textContent = title;
  if (gateDetail) gateDetail.textContent = detail;
  if (gateLink) {
    gateLink.href = linkHref;
    gateLink.textContent = linkText;
    gateLink.hidden = false;
  }
}

function userInitials(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("es") || "GE";
}

function renderUser(profile) {
  const name = profile.displayName.trim();
  const initials = document.querySelector("[data-user-initials]");
  const nameNode = document.querySelector("[data-user-name]");
  const roleNode = document.querySelector("[data-user-role]");
  if (initials) initials.textContent = userInitials(name);
  if (nameNode) nameNode.textContent = name;
  if (roleNode) roleNode.textContent = profile.role === "docente"
    ? "Docente"
    : profile.role === "director" ? "Dirección · Director" : "Dirección · Subdirectora";
}

function applyRoleNavigation(role) {
  const permissions = {
    aportes: ["docente", "director", "subdirectora"],
    notas: ["docente", "director", "subdirectora"],
    horarios: ["docente"],
    fichas: ["docente", "director", "subdirectora"]
  };
  document.querySelectorAll(".nav-link[data-nav]").forEach((link) => {
    const roles = permissions[link.dataset.nav] || [];
    link.hidden = !roles.includes(role);
  });
}

function formatDate(timestamp) {
  const date = timestamp?.toDate instanceof Function ? timestamp.toDate() : null;
  if (!date || Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(date);
}

const actionLabels = {
  login: "Inicio de sesión",
  logout: "Cierre de sesión",
  page_view: "Consulta de sección"
};
const sectionLabels = {
  index: "Acceso institucional",
  aportes: "Aportes y reportes",
  notas: "Gestión de notas",
  horarios: "Horarios y agenda",
  fichas: "Fichas estudiantiles"
};

async function renderSupervisorActivity(logsApi) {
  const panel = document.querySelector("[data-supervisor-activity]");
  const list = document.querySelector("[data-activity-list]");
  const state = document.querySelector("[data-activity-state]");
  if (!panel || !list) return;
  panel.hidden = false;
  if (state) state.textContent = "Cargando actividad reciente…";

  try {
    const events = await logsApi.fetchRecentActivity(15);
    list.replaceChildren();
    if (!events.length) {
      if (state) state.textContent = "Aún no hay actividad registrada.";
      return;
    }
    events.forEach((event) => {
      const item = document.createElement("li");
      item.className = "activity-log-item";
      const detail = document.createElement("div");
      const title = document.createElement("strong");
      const subtitle = document.createElement("span");
      const time = document.createElement("time");
      title.textContent = actionLabels[event.type] || "Actividad";
      subtitle.textContent = `${event.actorName || "Usuario"} · ${sectionLabels[event.section] || "Sección"}`;
      time.textContent = formatDate(event.createdAt);
      detail.append(title, subtitle);
      item.append(detail, time);
      list.append(item);
    });
    if (state) state.textContent = "Registros recientes. Los eventos se guardan con hora de servidor.";
  } catch {
    list.replaceChildren();
    if (state) state.textContent = "No se pudo cargar la actividad. Revisa las reglas de Firestore y la conexión.";
  }
}

async function startGuard() {
  if (!protectedContent || !gate) return;
  protectedContent.hidden = true;
  try {
    const [authApi, logsApi] = await Promise.all([import("./auth.js"), import("./logs.js")]);
    const user = await authApi.waitForAuthState();
    if (!user) {
      window.location.replace("./index.html?reason=required");
      return;
    }

    const profile = await authApi.getUserProfile(user.uid);
    if (!authApi.isActiveProfile(profile)) {
      await authApi.signOut().catch(() => {});
      window.location.replace("./index.html?reason=profile");
      return;
    }

    if (!allowedRoles.includes(profile.role)) {
      setGate(
        "Tu perfil no tiene acceso a esta sección.",
        "Los horarios individuales son privados para el perfil docente. Puedes volver a una sección autorizada.",
        "./aportes.html",
        "Ir a Aportes y reportes"
      );
      return;
    }

    renderUser(profile);
    applyRoleNavigation(profile.role);
    protectedContent.hidden = false;
    gate.hidden = true;

    document.querySelectorAll("[data-sign-out]").forEach((button) => {
      button.hidden = false;
      button.addEventListener("click", async () => {
        button.disabled = true;
        try { await logsApi.logAction("logout", pageName, profile); }
        catch (error) { console.warn("No se pudo guardar el log de cierre de sesión.", error); }
        try {
          await authApi.signOut();
          window.location.replace("./index.html?reason=signed-out");
        } catch {
          button.disabled = false;
          setGate("No se pudo cerrar la sesión.", "Revisa la conexión e inténtalo de nuevo.", "./index.html", "Volver al acceso");
        }
      });
    });

    try { await logsApi.syncPendingLogs(); }
    catch (error) { console.warn("La sincronización de logs pendientes quedó en cola.", error); }
    try { await logsApi.logAction("page_view", pageName, profile); }
    catch (error) { console.warn("No se pudo registrar la consulta de sección.", error); }

    const activityPanel = document.querySelector("[data-supervisor-activity]");
    const canReviewActivity = Boolean(activityPanel && supervisors.has(profile.role));
    if (canReviewActivity) await renderSupervisorActivity(logsApi);
    window.addEventListener("online", async () => {
      try { await logsApi.syncPendingLogs(); }
      catch (error) { console.warn("Los logs pendientes siguen en cola.", error); }
      if (canReviewActivity) await renderSupervisorActivity(logsApi);
    });
  } catch (error) {
    console.error("No se pudo verificar el perfil de acceso.", error);
    setGate(
      "No se pudo validar la sesión.",
      "El contenido se mantiene oculto. Comprueba tu conexión, la configuración de Auth y las reglas de Firestore.",
      "./index.html",
      "Volver al inicio de sesión"
    );
  }
}

startGuard();
