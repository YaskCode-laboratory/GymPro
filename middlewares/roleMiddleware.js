/**
 * MIDDLEWARE DE AUTORIZACIÓN POR ROL (roleMiddleware.js)
 * 
 * Uso:
 *   router.get('/', authMiddleware, requireRole('admin'), handler)
 *   router.get('/', authMiddleware, requireRole('admin', 'coach'), handler)
 * 
 * Debe usarse SIEMPRE después de authMiddleware.
 */

function requireRole(...rolesPermitidos) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado.' });
        }

        if (!rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción.',
                required: rolesPermitidos,
                current: req.user.role
            });
        }

        next();
    };
}

module.exports = { requireRole };