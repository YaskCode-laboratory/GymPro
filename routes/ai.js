const express = require('express');
const { dbRun, dbGet, dbAll } = require('../db/database');
const { getAIResponse } = require('../services/aiService');
const { buildClientContext } = require('../services/contextBuilder');
const { buildClientSystemPrompt } = require('../services/prompts');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

// POST /api/ai/chat (solo client)
router.post('/chat', requireRole('client'), async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'El mensaje es requerido.' });
        }

        const cleanMessage = message.trim().slice(0, 800);

        const history = await dbAll(
            `SELECT role, content FROM chat_messages
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
            [user.id]
        );
        history.reverse();

        const ctx = await buildClientContext(user);
        const systemPrompt = buildClientSystemPrompt(user, ctx);

        await dbRun(
            'INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)',
            [user.id, 'user', cleanMessage]
        );

        const aiReply = await getAIResponse({
            systemPrompt,
            history,
            userMessage: cleanMessage
        });

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

// GET /api/ai/history/:userId
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'No puedes ver el historial de otros usuarios.' });
        }

        const messages = await dbAll(
            `SELECT role, content, created_at
             FROM chat_messages
             WHERE user_id = ?
             ORDER BY created_at ASC
             LIMIT 100`,
            [userId]
        );
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ai/history/:userId
router.delete('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'No puedes borrar el historial de otros.' });
        }

        await dbRun('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
        res.json({ message: 'Historial borrado.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
