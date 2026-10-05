const express = require('express');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { logActivity } = require('../services/logger');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

async function buildRoutine(rutinaRow) {
    const ejercicios = await dbAll(
        `SELECT * FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC`,
        [rutinaRow.id]
    );
    return {
        id: rutinaRow.id,
        name: rutinaRow.name,
        coachId: rutinaRow.coach_id,
        coachName: rutinaRow.coach_name,
        assignedToClientId: rutinaRow.assigned_to_client_id,
        dias: rutinaRow.days,
        description: rutinaRow.description,
        ejercicios: ejercicios.map(e => ({
            ejercicioId: e.exercise_id,
            nombre: e.name,
            muscleGroup: e.muscle_group,
            tipo: e.tipo,
            series: e.series,
            reps: e.reps,
            peso_sugerido: e.peso_sugerido,
            descanso_seg: e.descanso_seg,
            tiempo_objetivo_seg: e.tiempo_objetivo_seg,
            mediaUrl: e.media_url
        }))
    };
}

// GET /api/routines
// Admin: todas | Coach: las suyas | Cliente: solo la asignada a él
router.get('/', async (req, res) => {
    try {
        const { coachId, clientId } = req.query;
        let sql = 'SELECT * FROM routines';
        const params = [];
        const conditions = [];

        if (req.user.role === 'client') {
            conditions.push('assigned_to_client_id = ?');
            params.push(req.user.id);
        } else if (req.user.role === 'coach') {
            conditions.push('coach_id = ?');
            params.push(req.user.id);
        } else {
            // Admin: aplicar filtros opcionales
            if (coachId) { conditions.push('coach_id = ?'); params.push(coachId); }
            if (clientId) { conditions.push('assigned_to_client_id = ?'); params.push(clientId); }
        }

        if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY created_at DESC';

        const rows = await dbAll(sql, params);
        const result = [];
        for (const r of rows) {
            result.push(await buildRoutine(r));
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/routines/:id
router.get('/:id', async (req, res) => {
    try {
        const r = await dbGet('SELECT * FROM routines WHERE id = ?', [req.params.id]);
        if (!r) return res.status(404).json({ error: 'Rutina no encontrada.' });

        // Cliente solo ve su propia rutina
        if (req.user.role === 'client' && r.assigned_to_client_id !== req.user.id) {
            return res.status(403).json({ error: 'No puedes ver esta rutina.' });
        }

        res.json(await buildRoutine(r));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/routines (solo admin y coach)
router.post('/', requireRole('admin', 'coach'), async (req, res) => {
    try {
        const {
            id, name, coachId, coachName,
            assignedToClientId, dias, description, ejercicios
        } = req.body;

        const rutinaId = id || ('rutina-' + Date.now());

        // Un coach solo puede crear rutinas a su nombre
        const finalCoachId = req.user.role === 'coach' ? req.user.id : coachId;
        const finalCoachName = req.user.role === 'coach' ? req.user.name : coachName;

        const existing = await dbGet('SELECT id FROM routines WHERE id = ?', [rutinaId]);
        if (existing) {
            // Verificar que el coach solo edite sus propias rutinas
            const rutina = await dbGet('SELECT coach_id FROM routines WHERE id = ?', [rutinaId]);
            if (req.user.role === 'coach' && rutina.coach_id !== req.user.id) {
                return res.status(403).json({ error: 'No puedes editar rutinas de otros coaches.' });
            }

            await dbRun(
                `UPDATE routines SET name = ?, coach_id = ?, coach_name = ?,
                 assigned_to_client_id = ?, days = ?, description = ? WHERE id = ?`,
                [name, finalCoachId, finalCoachName, assignedToClientId || null, dias, description, rutinaId]
            );
            await dbRun('DELETE FROM routine_exercises WHERE routine_id = ?', [rutinaId]);
        } else {
            await dbRun(
                `INSERT INTO routines (id, name, coach_id, coach_name, assigned_to_client_id, days, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [rutinaId, name, finalCoachId, finalCoachName, assignedToClientId || null, dias, description]
            );
        }

        if (Array.isArray(ejercicios)) {
            for (let i = 0; i < ejercicios.length; i++) {
                const e = ejercicios[i];
                await dbRun(
                    `INSERT INTO routine_exercises
                     (routine_id, exercise_id, name, muscle_group, tipo, series, reps, peso_sugerido, descanso_seg, tiempo_objetivo_seg, media_url, order_index)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rutinaId, e.ejercicioId, e.nombre, e.muscleGroup || '',
                        e.tipo, e.series, e.reps || 0, e.peso_sugerido || 0,
                        e.descanso_seg || 60, e.tiempo_objetivo_seg || 0,
                        e.mediaUrl || '', i
                    ]
                );
            }
        }

        const saved = await dbGet('SELECT * FROM routines WHERE id = ?', [rutinaId]);

        const accion = existing ? 'Rutina editada' : 'Rutina creada';
        const numEjercicios = Array.isArray(ejercicios) ? ejercicios.length : 0;

        logActivity(
            req.user.email,
            'REGISTRO',
            `${accion}: "${name}" (${numEjercicios} ejercicios)`
        );

        res.status(201).json(await buildRoutine(saved));
    } catch (err) {
        console.error('Error guardando rutina:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/routines/:id/assign (solo admin y coach)
router.put('/:id/assign', requireRole('admin', 'coach'), async (req, res) => {
    try {
        const { clientId } = req.body;

        const rutina = await dbGet('SELECT name, coach_id FROM routines WHERE id = ?', [req.params.id]);
        if (!rutina) return res.status(404).json({ error: 'Rutina no encontrada.' });

        if (req.user.role === 'coach' && rutina.coach_id !== req.user.id) {
            return res.status(403).json({ error: 'No puedes asignar rutinas de otros coaches.' });
        }

        await dbRun(
            'UPDATE routines SET assigned_to_client_id = NULL WHERE assigned_to_client_id = ?',
            [clientId]
        );

        await dbRun(
            'UPDATE routines SET assigned_to_client_id = ? WHERE id = ?',
            [clientId, req.params.id]
        );

        const cliente = await dbGet('SELECT name, email FROM users WHERE id = ?', [clientId]);

        logActivity(
            req.user.email,
            'REGISTRO',
            `Rutina "${rutina.name}" asignada a "${cliente ? cliente.name : clientId}"`
        );

        res.json({ message: 'Rutina asignada correctamente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/routines/:id (solo admin y coach)
router.delete('/:id', requireRole('admin', 'coach'), async (req, res) => {
    try {
        const rutina = await dbGet('SELECT name, coach_id FROM routines WHERE id = ?', [req.params.id]);
        if (!rutina) return res.status(404).json({ error: 'Rutina no encontrada.' });

        if (req.user.role === 'coach' && rutina.coach_id !== req.user.id) {
            return res.status(403).json({ error: 'No puedes eliminar rutinas de otros coaches.' });
        }

        await dbRun('DELETE FROM routines WHERE id = ?', [req.params.id]);

        logActivity(
            req.user.email,
            'ELIMINACION',
            `Rutina eliminada: "${rutina.name}"`
        );

        res.json({ message: 'Rutina eliminada.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
