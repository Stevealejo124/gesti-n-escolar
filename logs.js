import { queueChange } from './offline.js';

/* Encola solo metadatos mínimos. No incluir nombres, notas, contraseñas ni contenido de reportes en esta fase. */
export async function logAction(actionType, details = {}) {
  const safeDetails = {};
  for (const key of ['resourceType', 'resourceId', 'actionSource']) {
    if (typeof details[key] === 'string') safeDetails[key] = details[key].slice(0, 120);
  }

  return queueChange({
    type: 'activity-log',
    payload: {
      actionType: String(actionType || 'unspecified').slice(0, 80),
      occurredAt: new Date().toISOString(),
      details: safeDetails
    }
  });
}
