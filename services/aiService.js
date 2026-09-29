/**
 * SERVICIO DE IA (aiService.js)
 * Wrapper sobre @google/genai (SDK nuevo de Google).
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS, 10) || 800;
const TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE) || 0.7;

/**
 * Envía una consulta a Gemini y devuelve la respuesta en texto.
 *
 * @param {Object} params
 * @param {string} params.systemPrompt - Instrucciones del sistema (rol, reglas, contexto).
 * @param {Array<{role: 'user'|'assistant', content: string}>} params.history - Historial de mensajes previos.
 * @param {string} params.userMessage - Mensaje actual del usuario.
 * @returns {Promise<string>} - Texto de respuesta del modelo.
 */
async function getAIResponse({ systemPrompt, history = [], userMessage }) {
    try {
        // Convertir historial al formato que espera Gemini
        const contents = history.map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));

        // Añadir el mensaje actual
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
                maxOutputTokens: MAX_TOKENS,
                temperature: TEMPERATURE
            }
        });

        // El SDK nuevo expone el texto directamente como `response.text`
        return response.text || 'Sin respuesta.';
    } catch (err) {
        console.error('❌ Error en Gemini:', err);
        throw new Error('El asistente no está disponible en este momento. Intenta de nuevo.');
    }
}

module.exports = { getAIResponse };