const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { logActivity } = require('../services/logger');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /api/users
// Admin: todos | Coach: solo clientes | Cliente: solo él mismo
router.get('/', async (req, res) => {
    try {
        const { role } = req.query;

        if (req.user.role === 'coach') {
            const clients = await dbAll(
                'SELECT id, name, email, role, avatar FROM users WHERE role = ? ORDER BY name ASC',
                ['client']
            );
            return res.json(clients);
        }

        if (req.user.role === 'admin') {
            let sql = 'SELECT id, name, email, role, avatar FROM users';
            const params = [];
            if (role) {
                sql += ' WHERE role = ?';
                params.push(role);
            }
            sql += ' ORDER BY name ASC';
            const users = await dbAll(sql, params);
            return res.json(users);
        }

        return res.json([req.user]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role === 'client' && req.user.id !== id) {
            return res.status(403).json({ error: 'No puedes ver datos de otros usuarios.' });
        }

        const user = await dbGet(
            'SELECT id, name, email, role, avatar FROM users WHERE id = ?',
            [id]
        );
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        if (req.user.role === 'coach' && user.role !== 'client' && user.id !== req.user.id) {
            return res.status(403).json({ error: 'Solo puedes ver clientes.' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users (solo admin)
router.post('/', requireRole('admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos.' });
        }

        if (!['admin', 'coach', 'client'].includes(role)) {
            return res.status(400).json({ error: 'Rol no válido.' });
        }

        const existing = await dbGet('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        if (existing) return res.status(409).json({ error: 'Este correo ya está registrado.' });

        const id = crypto.randomUUID();
        const hashed = bcrypt.hashSync(password, 10);

        await dbRun(
            'INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name.trim(), email.trim().toLowerCase(), hashed, role, null]
        );

        logActivity(req.user.email, 'REGISTRO', `Nuevo usuario "${name}" (${role}) por admin`);

        res.status(201).json({ id, name, email: email.toLowerCase(), role, avatar: null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id
// Admin: cualquiera | Cliente: solo él mismo (sin cambiar rol)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        if (req.user.role === 'client' && req.user.id !== id) {
            return res.status(403).json({ error: 'No puedes editar otros usuarios.' });
        }

        const user = await dbGet('SELECT id, role FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // Solo admin puede cambiar el rol
        const newRole = req.user.role === 'admin' ? role : user.role;

        const dup = await dbGet(
            'SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?',
            [email, id]
        );
        if (dup) return res.status(409).json({ error: 'Este correo ya está en uso.' });

        if (password && password.trim() !== '') {
            const hashed = bcrypt.hashSync(password, 10);
            await dbRun(
                'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
                [name, email.toLowerCase(), hashed, newRole, id]
            );
        } else {
            await dbRun(
                'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
                [name, email.toLowerCase(), newRole, id]
            );
        }

        logActivity(req.user.email, 'REGISTRO', `Usuario editado: "${name}"`);

        const updated = await dbGet(
            'SELECT id, name, email, role, avatar FROM users WHERE id = ?',
            [id]
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id/avatar
router.put('/:id/avatar', async (req, res) => {
    try {
        const { id } = req.params;
        const { avatar } = req.body;

        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ error: 'No puedes cambiar el avatar de otro usuario.' });
        }

        await dbRun('UPDATE users SET avatar = ? WHERE id = ?', [avatar || null, id]);

        res.json({ message: 'Avatar actualizado.', avatar: avatar || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id (solo admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }

        const user = await dbGet('SELECT name, email FROM users WHERE id = ?', [req.params.id]);

        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);

        logActivity(
            req.user.email,
            'ELIMINACION',
            `Usuario eliminado: "${user ? user.name : req.params.id}"`
        );

        res.json({ message: 'Usuario eliminado.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
