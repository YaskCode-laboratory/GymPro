/**
 * LOGGER CENTRALIZADO (logger.js)
 * 
 * Escribe todas las actividades del sistema en un archivo plano `activity.log`.
 * Formato por línea:
 *   FECHA | USUARIO | ACTIVIDAD | DETALLE
 * 
 * Ejemplo:
 *   2026-09-21 14:32:15 | juan@gmail.com | LOGIN | Ingreso exitoso (rol: client)
 *   2026-09-21 14:33:02 | juan@gmail.com | CONSULTA | GET /api/routines
 *   2026-09-21 14:35:47 | juan@gmail.com | LOGOUT | Sesión cerrada
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'activity.log');

/**
 * Formatea una fecha como "YYYY-MM-DD HH:mm:ss".
 */
function formatDate(date) {
    const d = date || new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return (
        d.getFullYear() + '-' +
        pad(d.getMonth() + 1) + '-' +
        pad(d.getDate()) + ' ' +
        pad(d.getHours()) + ':' +
        pad(d.getMinutes()) + ':' +
        pad(d.getSeconds())
    );
}

/**
 * Escapa un texto para que no rompa el formato con `|` o saltos de línea.
 */
function sanitize(text) {
    if (text === null || text === undefined) return '-';
    return String(text)
        .replace(/\|/g, '/')
        .replace(/\r?\n/g, ' ')
        .trim();
}

/**
 * Escribe una línea en el log.
 * 
 * @param {string} userEmail - Email del usuario que realiza la acción (o 'anonimo').
 * @param {string} activity - LOGIN | CONSULTA | REGISTRO | ELIMINACION | LOGOUT
 * @param {string} detail - Detalle libre de la actividad.
 */
function logActivity(userEmail, activity, detail = '') {
    const line =
        formatDate(new Date()) + ' | ' +
        sanitize(userEmail || 'anonimo') + ' | ' +
        sanitize(activity || 'DESCONOCIDA') + ' | ' +
        sanitize(detail) + '\n';

    // Escribir en modo append (crea el archivo si no existe)
    fs.appendFile(LOG_FILE, line, 'utf8', (err) => {
        if (err) {
            console.error('❌ Error escribiendo en activity.log:', err.message);
        }
    });
}

/**
 * Alias para mantener consistencia con el nombre que se usa en otros archivos.
 */
function log(activity, userEmail, detail) {
    logActivity(userEmail, activity, detail);
}

module.exports = { logActivity, log, LOG_FILE, formatDate };
