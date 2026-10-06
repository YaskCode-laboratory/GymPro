const express = require('express');
const path = require('path');
const cors = require('cors');

// Inicializar DB (ejecuta schema + seed)
require('./db/database');
require('dotenv').config({ path: '.env.example' });        /* En producción cambiala de .env.example a .env */
const auditMiddleware = require('./middlewares/auditMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de auditoría (registra todas las peticiones en activity.log)
app.use(auditMiddleware);

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback: cualquier ruta no-API devuelve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor GymPro corriendo en http://localhost:${PORT}`);
});
