/**
 * MIDDLEWARE DE AUDITORÍA (auditMiddleware.js)
 * 
 * Registra automáticamente las peticiones HTTP en el log según el método:
 *   - GET     → CONSULTA
 *   - POST    → REGISTRO
 *   - PUT     → REGISTRO (actualización)
 *   - PATCH   → REGISTRO (actualización parcial)
 *   - DELETE  → ELIMINACION
 * 
 * Los endpoints /api/auth/login y /api/auth/logout se excluyen aquí porque
 * se registran de forma explícita desde routes/auth.js con más detalle.
 */

const { logActivity } = require('../services/logger');

// Rutas que NO se deben loguear aquí (se loguean explícitamente)
const EXCLUDED_PATHS = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/health'
];

// Rutas que no aportan valor al log (ruido)
const NOISY_PATHS = [
    '/api/ai/history' // se consulta cada vez que se abre el chat
];

function auditMiddleware(req, res, next) {
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
        try {
            const path = req.originalUrl || req.url || '';
            const method = req.method || 'GET';

            // Ignorar rutas excluidas o ruidosas
            const isExcluded = EXCLUDED_PATHS.some(p => path.startsWith(p));
            const isNoisy = NOISY_PATHS.some(p => path.startsWith(p));

            if (!isExcluded && !isNoisy) {
                // Solo loguear si la respuesta fue exitosa (2xx) o al menos procesada
                if (res.statusCode < 500) {
                    let activity = null;

                    if (method === 'GET') activity = 'CONSULTA';
                    else if (method === 'POST') activity = 'REGISTRO';
                    else if (method === 'PUT' || method === 'PATCH') activity = 'REGISTRO';
                    else if (method === 'DELETE') activity = 'ELIMINACION';

                    if (activity) {
                        // El email viene del body (login), headers o del authMiddleware (si lo tuvieras)
                        const userEmail =
                            (req.user && req.user.email) ||
                            (req.body && req.body.userEmail) ||
                            req.headers['x-user-email'] ||
                            'anonimo';

                        const detail = `${method} ${path} → ${res.statusCode}`;
                        logActivity(userEmail, activity, detail);
                    }
                }
            }
        } catch (err) {
            console.error('⚠️ Error en auditMiddleware:', err.message);
        }

        return originalEnd(...args);
    };

    next();
}

module.exports = auditMiddleware;