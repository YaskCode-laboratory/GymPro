const express = require('express');
const { dbRun, dbGet, dbAll } = require('../db/database');

const router = express.Router();

// GET /api/exercises
router.get('/', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM exercises ORDER BY name ASC');
        // Mapear a camelCase para el frontend
        const exercises = rows.map(r => ({
            id: r.id,
            name: r.name,
            muscleGroup: r.muscle_group,
            type: r.type,
            description: r.description,
            mediaUrl: r.media_url,
            defaultRestSec: r.default_rest_sec
        }));
        res.json(exercises);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/exercises/:id
router.get('/:id', async (req, res) => {
    try {
        const r = await dbGet('SELECT * FROM exercises WHERE id = ?', [req.params.id]);
        if (!r) return res.status(404).json({ error: 'Ejercicio no encontrado.' });
        res.json({
            id: r.id,
            name: r.name,
            muscleGroup: r.muscle_group,
            type: r.type,
            description: r.description,
            mediaUrl: r.media_url,
            defaultRestSec: r.default_rest_sec
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/exercises
router.post('/', async (req, res) => {
    try {
        const { id, name, muscleGroup, type, description, mediaUrl, defaultRestSec } = req.body;
        const exId = id || ('ej-' + Date.now());

        await dbRun(
            `INSERT INTO exercises (id, name, muscle_group, type, description, media_url, default_rest_sec)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [exId, name, muscleGroup, type, description || '', mediaUrl || '', defaultRestSec || 60]
        );

        res.status(201).json({
            id: exId, name, muscleGroup, type,
            description: description || '', mediaUrl: mediaUrl || '',
            defaultRestSec: defaultRestSec || 60
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;