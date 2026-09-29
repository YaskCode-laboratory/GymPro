const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { dbRun, dbGet } = require('../db/database');
const { logActivity } = require('../services/logger');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos.' });
        }

        if (!['admin', 'coach', 'client'].includes(role)) {
            return res.status(400).json({ error: 'Rol no válido.' });
        }

        const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        if (existing) {
            return res.status(409).json({ error: 'Este correo ya está registrado.' });
        }

        const id = crypto.randomUUID();
        const hashedPassword = bcrypt.hashSync(password, 10);

        await dbRun(
            'INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name.trim(), email.trim().toLowerCase(), hashedPassword, role, avatar || null]
        );

        // ✅ Loguear registro de nuevo usuario
        logActivity(email.toLowerCase(), 'REGISTRO', `Nuevo usuario: "${name}" (rol: ${role})`);

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: { id, name, email: email.toLowerCase(), role, avatar: avatar || null }
        });
    } catch (err) {
        console.error('Error en /register:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/auth/login
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
            // Loguear intento fallido
            logActivity(email, 'LOGIN', 'FALLIDO - correo no registrado');
            return res.status(401).json({ error: 'El correo no está registrado.' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            // Loguear intento fallido
            logActivity(email, 'LOGIN', 'FALLIDO - contraseña incorrecta');
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }

        // ✅ Loguear login exitoso
        logActivity(user.email, 'LOGIN', `Ingreso exitoso (rol: ${user.role})`);

        const { password: _, ...userSafe } = user;

        res.json({
            message: 'Login exitoso.',
            user: userSafe
        });
    } catch (err) {
        console.error('Error en /login:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const { userEmail } = req.body;
        logActivity(userEmail || 'anonimo', 'LOGOUT', 'Sesión cerrada');
        res.json({ message: 'Logout registrado.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
