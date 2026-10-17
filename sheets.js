/*
 * Puente de exportación / futura integración con Google Apps Script.
 * La URL y el contrato de autenticación no se inventan aquí: deben acordarse antes de enviar datos reales.
 */
const APPS_SCRIPT_WEB_APP_URL = '';
export const isSheetsConfigured = APPS_SCRIPT_WEB_APP_URL.startsWith('https://');

function escapeCsvCell(value) {
  let text = String(value ?? '');
  // Mitiga fórmulas de hoja de cálculo al abrir CSV generado con contenido no confiable.
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(rows, filename = 'gestion-escolar.csv') {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new TypeError('Se requiere una lista no vacía de registros para exportar.');
  }
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  const csv = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row?.[header])).join(','))
  ].join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.replace(/[^\w.-]+/g, '-');
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function syncToAppsScript(payload) {
  if (!isSheetsConfigured) {
    throw new Error('La integración con Google Sheets no está configurada; falta acordar endpoint, autenticación y permisos.');
  }
  // Implementar aquí el contrato validado del Web App; no enviar datos sensibles a un endpoint público.
  throw new Error(`Endpoint configurado, pero el transporte aún no está habilitado para ${Object.keys(payload || {}).length} campos.`);
}
