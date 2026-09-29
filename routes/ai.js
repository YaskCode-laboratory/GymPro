/**
 * RUTAS DE IA (ai.js)
 * Endpoint: POST /api/ai/chat
 */

const express = require('express');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { getAIResponse } = require('../services/aiService');
const { buildClientContext } = require('../services/contextBuilder');
const { buildClientSystemPrompt } = require('../services/prompts');

const router = express.Router();

// ============================================
// POST /api/ai/chat
// Body: { userId, message }
// ============================================
router.post('/chat', async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message || message.trim() === '') {
            return res.status(400).json({ error: 'userId y message son requeridos.' });
        }

        // Limitar longitud del mensaje (evita gastar tokens innecesarios)
        const cleanMessage = message.trim().slice(0, 800);

        // 1. Buscar al usuario
        const user = await dbGet(
            'SELECT id, name, email, role FROM users WHERE id = ?',
            [userId]
        );
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

        // 2. Solo clientes por ahora
        if (user.role !== 'client') {
            return res.status(403).json({ error: 'Este chat aún no está disponible para tu rol.' });
        }

        // 3. Cargar los últimos 10 mensajes (contexto conversacional)
        const history = await dbAll(
            `SELECT role, content FROM chat_messages
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
            [user.id]
        );
        history.reverse(); // orden cronológico

        // 4. Construir contexto dinámico + prompt del sistema
        const ctx = await buildClientContext(user);
        const systemPrompt = buildClientSystemPrompt(user, ctx);

        // 5. Guardar mensaje del usuario
        await dbRun(
            'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
            [user.id, 'user', cleanMessage]
        );

        // 6. Llamar a Gemini
        const aiReply = await getAIResponse({
            systemPrompt,
            history,
            userMessage: cleanMessage
        });

        // 7. Guardar respuesta del asistente
        await dbRun(
            'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
            [user.id, 'assistant', aiReply]
        );

        res.json({ reply: aiReply });
    } catch (err) {
        console.error('❌ Error en /api/ai/chat:', err);
        res.status(500).json({ error: err.message || 'Error al procesar la consulta.' });
    }
});

// ============================================
// GET /api/ai/history/:userId
// ============================================
router.get('/history/:userId', async (req, res) => {
    try {
        const messages = await dbAll(
            `SELECT role, content, created_at
             FROM chat_messages
             WHERE user_id = ?
             ORDER BY created_at ASC
             LIMIT 100`,
            [req.params.userId]
        );
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// DELETE /api/ai/history/:userId
// ============================================
router.delete('/history/:userId', async (req, res) => {
    try {
        await dbRun('DELETE FROM chat_messages WHERE user_id = ?', [req.params.userId]);
        res.json({ message: 'Historial borrado.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;