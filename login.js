let modulesPromise;
let isSubmitting = false;

const form = document.querySelector("[data-login-form]");
const emailInput = document.querySelector("#login-email");
const passwordInput = document.querySelector("#login-password");
const submitButton = document.querySelector("[data-login-submit]");
const resetButton = document.querySelector("[data-password-reset]");
const statusBox = document.querySelector("[data-login-status]");

function loadFirebaseModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([import("./auth.js"), import("./logs.js")])
      .then(([authApi, logsApi]) => ({ authApi, logsApi }))
      .catch((error) => {
        modulesPromise = undefined;
        throw error;
      });
  }
  return modulesPromise;
}

function showStatus(message, kind = "info") {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.dataset.state = kind;
  statusBox.hidden = false;
}

function setBusy(busy) {
  if (submitButton) {
    submitButton.disabled = busy;
    submitButton.textContent = busy ? "Verificando acceso…" : "Iniciar sesión";
  }
  if (resetButton) resetButton.disabled = busy;
}

function profileIsReady(profile, authApi) {
  return authApi.isActiveProfile(profile);
}

function firebaseMessage(error) {
  const messages = {
    "auth/invalid-credential": "El correo o la contraseña no son correctos.",
    "auth/invalid-email": "Escribe un correo electrónico válido.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication. Pide a administración que lo agregue.",
    "auth/operation-not-allowed": "El inicio con correo y contraseña no está habilitado en Firebase Authentication.",
    "auth/user-disabled": "Esta cuenta está deshabilitada. Contacta a dirección.",
    "auth/too-many-requests": "Se realizaron demasiados intentos. Espera un momento y vuelve a intentar.",
    "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa tu conexión e inténtalo de nuevo.",
    "permission-denied": "Firestore rechazó la lectura del perfil en usuarios/{UID}. Verifica que las reglas estén publicadas y que el documento tenga el mismo UID de Authentication.",
    "unavailable": "Firebase no está disponible en este momento. Inténtalo más tarde."
  };
  return messages[error?.code] || "No se pudo validar el acceso. Verifica la cuenta o contacta a administración.";
}

async function continueIfSignedIn(authApi, user) {
  if (!user) return false;
  const profile = await authApi.getUserProfile(user.uid);
  if (!profileIsReady(profile, authApi)) {
    await authApi.signOut();
    showStatus("La cuenta existe, pero no tiene un perfil escolar activo. Solicita acceso a administración.", "error");
    return true;
  }
  window.location.replace("./aportes.html");
  return true;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity() || isSubmitting) return;

  isSubmitting = true;
  setBusy(true);
  if (statusBox) statusBox.hidden = true;
  try {
    const { authApi, logsApi } = await loadFirebaseModules();
    const credential = await authApi.signIn(emailInput.value, passwordInput.value);
    const profile = await authApi.getUserProfile(credential.user.uid);
    if (!profileIsReady(profile, authApi)) {
      await authApi.signOut();
      showStatus("La cuenta no tiene un perfil escolar activo. Solicita a dirección que habilite tu acceso.", "error");
      return;
    }

    try { await logsApi.logAction("login", "index", profile); }
    catch (error) { console.warn("No se pudo guardar el registro de inicio de sesión.", error); }
    window.location.replace("./aportes.html");
  } catch (error) {
    console.error("Fallo al iniciar sesión o consultar el perfil.", error);
    showStatus(firebaseMessage(error), "error");
  } finally {
    isSubmitting = false;
    setBusy(false);
  }
});

resetButton?.addEventListener("click", async () => {
  if (!emailInput?.value.trim()) {
    showStatus("Escribe tu correo institucional para solicitar el restablecimiento.", "info");
    emailInput?.focus();
    return;
  }
  if (!emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  resetButton.disabled = true;
  try {
    const { authApi } = await loadFirebaseModules();
    await authApi.requestPasswordReset(emailInput.value);
    showStatus("Si la cuenta está registrada, Firebase enviará las instrucciones de recuperación al correo indicado.", "success");
  } catch (error) {
    showStatus(firebaseMessage(error), "error");
  } finally {
    resetButton.disabled = false;
  }
});

async function checkExistingSession() {
  const reason = new URLSearchParams(location.search).get("reason");
  const reasonMessages = {
    required: "Inicia sesión para acceder a las secciones institucionales.",
    profile: "Tu cuenta no tiene un perfil activo. Contacta a administración.",
    "signed-out": "La sesión se cerró correctamente."
  };
  if (reasonMessages[reason]) showStatus(reasonMessages[reason], "info");

  try {
    const { authApi } = await loadFirebaseModules();
    const user = await authApi.waitForAuthState();
    await continueIfSignedIn(authApi, user);
  } catch (error) {
    console.error("No se pudo comprobar la sesión o leer el perfil.", error);
    showStatus("No se pudo comprobar la sesión. Revisa la conexión, UID del perfil y reglas publicadas.", "error");
  }
}

checkExistingSession();
