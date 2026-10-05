const { logActivity } = require('../services/logger');

const EXCLUDED_PATHS = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/me',
    '/api/health'
];

const SYNC_PATHS = [
    '/api/users',
    '/api/exercises',
    '/api/routines',
    '/api/sessions',
    '/api/ai/history',
    '/favicon.ico'
];

const ALWAYS_LOG_PATTERNS = [
    /^\/api\/sessions\/client\//,
    /^\/api\/users\/[^/]+$/,
    /^\/api\/routines\/[^/]+$/
];

function isSyncPath(path, method) {
    if (method !== 'GET') return false;
    return SYNC_PATHS.some(p => path === p || path.startsWith(p + '?'));
}

function isAlwaysLogged(path) {
    return ALWAYS_LOG_PATTERNS.some(rx => rx.test(path));
}

function auditMiddleware(req, res, next) {
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
        try {
            const path = req.originalUrl || req.url || '';
            const method = req.method || 'GET';

            if (EXCLUDED_PATHS.some(p => path.startsWith(p))) {
                return originalEnd(...args);
            }

            if (isSyncPath(path, method) && !isAlwaysLogged(path)) {
                return originalEnd(...args);
            }

            if (res.statusCode >= 500) {
                return originalEnd(...args);
            }

            let activity = null;
            if (method === 'GET') activity = 'CONSULTA';
            else if (method === 'POST') activity = 'REGISTRO';
            else if (method === 'PUT' || method === 'PATCH') activity = 'REGISTRO';
            else if (method === 'DELETE') activity = 'ELIMINACION';

            if (!activity) {
                return originalEnd(...args);
            }

            // El email viene del JWT (req.user) o del fallback 'anonimo'
            const userEmail =
                (req.user && req.user.email) ||
                req.headers['x-user-email'] ||
                'anonimo';

            const detail = `${method} ${path} → ${res.statusCode}`;
            logActivity(userEmail, activity, detail);
        } catch (err) {
            console.error('⚠️ Error en auditMiddleware:', err.message);
        }

        return originalEnd(...args);
    };

    next();
}

module.exports = auditMiddleware;
