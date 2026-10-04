const express = require('express');
const crypto = require('crypto');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { logActivity } = require('../services/logger');

const router = express.Router();

// GET /api/sessions  (?clientId=...)
router.get('/', async (req, res) => {
    try {
        const { clientId } = req.query;
        let sql = 'SELECT * FROM sessions';
        const params = [];
        if (clientId) { sql += ' WHERE client_id = ?'; params.push(clientId); }
        sql += ' ORDER BY created_at DESC';

        const sessions = await dbAll(sql, params);
        const result = [];

        for (const s of sessions) {
            const detalles = await dbAll(
                'SELECT * FROM session_details WHERE session_id = ? ORDER BY id ASC',
                [s.id]
            );
            result.push({
                id: s.id,
                clienteId: s.client_id,
                rutinaId: s.routine_id,
                rutinaNombre: s.routine_name,
                fechaInicio: s.fecha_inicio,
                fechaFin: s.fecha_fin,
                duracionTotalSeg: s.duracion_total_seg,
                duracionEfectivaSeg: s.duracion_efectiva_seg || 0,
                completada: !!s.completed,
                detalles: detalles.map(d => ({
                    ejercicioId: d.exercise_id,
                    ejercicioNombre: d.exercise_name,
                    serieNum: d.serie_num,
                    tiempoEjercicioSeg: d.tiempo_ejercicio_seg,
                    pesoReal: d.peso_real,
                    completada: !!d.completada,
                    saltada: !!d.saltada
                }))
            });
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/sessions/client/:clientId
router.get('/client/:clientId', async (req, res) => {
    try {
        const sessions = await dbAll(
            'SELECT * FROM sessions WHERE client_id = ? ORDER BY created_at DESC',
            [req.params.clientId]
        );
        const result = [];
        for (const s of sessions) {
            const detalles = await dbAll(
                'SELECT * FROM session_details WHERE session_id = ? ORDER BY id ASC',
                [s.id]
            );
            result.push({
                id: s.id,
                clienteId: s.client_id,
                rutinaId: s.routine_id,
                rutinaNombre: s.routine_name,
                fechaInicio: s.fecha_inicio,
                fechaFin: s.fecha_fin,
                duracionTotalSeg: s.duracion_total_seg,
                duracionEfectivaSeg: s.duracion_efectiva_seg || 0,
                completada: !!s.completed,
                detalles: detalles.map(d => ({
                    ejercicioId: d.exercise_id,
                    ejercicioNombre: d.exercise_name,
                    serieNum: d.serie_num,
                    tiempoEjercicioSeg: d.tiempo_ejercicio_seg,
                    pesoReal: d.peso_real,
                    completada: !!d.completada,
                    saltada: !!d.saltada
                }))
            });
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sessions  (guardar sesión completa con detalles)
router.post('/', async (req, res) => {
    try {
        const {
            id, clienteId, rutinaId, rutinaNombre,
            fechaInicio, fechaFin, duracionTotalSeg,
            duracionEfectivaSeg, // ← NUEVO
            completada, detalles
        } = req.body;

        const sessionId = id || ('sesion-' + Date.now());

        await dbRun(
            `INSERT INTO sessions
             (id, client_id, routine_id, routine_name, fecha_inicio, fecha_fin,
              duracion_total_seg, duracion_efectiva_seg, completed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sessionId, clienteId, rutinaId, rutinaNombre,
                fechaInicio, fechaFin,
                duracionTotalSeg || 0,
                duracionEfectivaSeg || 0,
                completada ? 1 : 0
            ]
        );

        if (Array.isArray(detalles)) {
            for (const d of detalles) {
                await dbRun(
                    `INSERT INTO session_details
                     (session_id, exercise_id, exercise_name, serie_num,
                      tiempo_ejercicio_seg, peso_real, completada, saltada)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        sessionId, d.ejercicioId, d.ejercicioNombre, d.serieNum,
                        d.tiempoEjercicioSeg || 0, d.pesoReal || 0,
                        d.completada ? 1 : 0, d.saltada ? 1 : 0
                    ]
                );
            }
        }

        logActivity(
            (req.body.userEmail || clienteId),
            'REGISTRO',
            `Sesión completada: "${rutinaNombre}" (${Math.round(duracionTotalSeg / 60)} min, ${Array.isArray(detalles) ? detalles.length : 0} series)`
        );

        res.status(201).json({ message: 'Sesión guardada.', id: sessionId });
    } catch (err) {
        console.error('Error guardando sesión:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
