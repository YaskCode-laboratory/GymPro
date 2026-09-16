const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { dbRun, dbGet, dbAll } = require('../db/database');

const router = express.Router();

// GET /api/users  (opcional ?role=client)
router.get('/', async (req, res) => {
    try {
        const { role } = req.query;
        let sql = 'SELECT id, name, email, role FROM users';
        const params = [];
        if (role) {
            sql += ' WHERE role = ?';
            params.push(role);
        }
        sql += ' ORDER BY name ASC';
        const users = await dbAll(sql, params);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await dbGet(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [req.params.id]
        );
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos.' });
        }

        const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        if (existing) return res.status(409).json({ error: 'Este correo ya está registrado.' });

        const id = crypto.randomUUID();
        const hashed = bcrypt.hashSync(password, 10);

        await dbRun(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [id, name.trim(), email.trim().toLowerCase(), hashed, role]
        );

        res.status(201).json({ id, name, email: email.toLowerCase(), role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const { id } = req.params;

        const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Verificar email duplicado
        const dup = await dbGet(
            'SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?',
            [email, id]
        );
        if (dup) return res.status(409).json({ error: 'Este correo ya está en uso.' });

        if (password && password.trim() !== '') {
            const hashed = bcrypt.hashSync(password, 10);
            await dbRun(
                'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
                [name, email.toLowerCase(), hashed, role, id]
            );
        } else {
            await dbRun(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email.toLowerCase(), role, id]
            );
        }

        res.json({ id, name, email: email.toLowerCase(), role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Usuario eliminado.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;