/*
 * Configuración pública de Firebase para el navegador.
 * Completar únicamente al iniciar la fase de autenticación.
 * Estos valores identifican el proyecto; las reglas de Firebase son las que protegen los datos.
 */
export const firebaseVersion = '10.12.5';

export const firebaseConfig = Object.freeze({
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: ''
});

export const isFirebaseConfigured = ['apiKey', 'authDomain', 'projectId', 'appId']
  .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim() !== '');
