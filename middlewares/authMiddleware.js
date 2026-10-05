/**
 * MIDDLEWARE DE AUTENTICACIÓN JWT (authMiddleware.js)
 * 
 * Verifica que el request incluya un JWT válido en el header:
 *   Authorization: Bearer <token>
 * 
 * Si es válido, adjunta el usuario decodificado a `req.user`:
 *   { id, name, email, role, avatar }
 */

const jwt = require('jsonwebtoken');
const { dbGet } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET no está definido en .env');
    process.exit(1);
}

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || '';

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de autenticación requerido.'
            });
        }

        const token = authHeader.slice(7);

        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Sesión expirada. Inicia sesión nuevamente.' });
            }
            return res.status(401).json({ error: 'Token inválido.' });
        }

        const user = await dbGet(
            'SELECT id, name, email, role, avatar FROM users WHERE id = ?',
            [payload.id]
        );

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Error en authMiddleware:', err);
        res.status(500).json({ error: 'Error de autenticación.' });
    }
}

module.exports = authMiddleware;