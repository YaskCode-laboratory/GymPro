const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../db/database');
const { logActivity } = require('../services/logger');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

const { getOrCreateJwtSecret } = require('../services/jwtSecret');
const JWT_SECRET = getOrCreateJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// ============================================
// POST /api/auth/register
// REGISTRO PÚBLICO — SOLO CREA ROL "client"
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const role = 'client';      // Forzar siempre rol "client"

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        if (existing) {
            return res.status(409).json({ error: 'Este correo ya está registrado.' });
        }

        const id = crypto.randomUUID();
        const hashedPassword = bcrypt.hashSync(password, 10);

        await dbRun(
            'INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name.trim(), email.trim().toLowerCase(), hashedPassword, role, null]
        );

        logActivity(email.toLowerCase(), 'REGISTRO', `Nuevo cliente: "${name}"`);

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: { id, name, email: email.toLowerCase(), role, avatar: null }
        });
    } catch (err) {
        console.error('Error en /register:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ============================================
// POST /api/auth/login
// Devuelve JWT + datos del usuario
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
        }

        const user = await dbGet(
            'SELECT id, name, email, password, role, avatar FROM users WHERE LOWER(email) = LOWER(?)',
            [email.trim()]
        );

        if (!user) {
            logActivity(email, 'LOGIN', 'FALLIDO - correo no registrado');
            return res.status(401).json({ error: 'El correo no está registrado en el sistema.' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            logActivity(email, 'LOGIN', 'FALLIDO - contraseña incorrecta');
            return res.status(401).json({ error: 'La contraseña es incorrecta.' });
        }

        const token = generateToken(user);

        logActivity(user.email, 'LOGIN', `Ingreso exitoso (rol: ${user.role})`);

        const { password: _, ...userSafe } = user;

        res.json({
            message: 'Login exitoso.',
            token,
            user: userSafe
        });
    } catch (err) {
        console.error('Error en /login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ============================================
// POST /api/auth/logout (protegido)
// ============================================
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        logActivity(req.user.email, 'LOGOUT', 'Sesión cerrada');
        res.json({ message: 'Logout registrado.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// GET /api/auth/me (protegido)
// ============================================
router.get('/me', authMiddleware, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
