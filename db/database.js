const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'gympro.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Crear conexión
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error al abrir la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a SQLite en:', DB_PATH);
});

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Ejecutar esquema al iniciar
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Error al crear el esquema:', err.message);
    } else {
        console.log('✅ Esquema de base de datos verificado/creado');
        seedIfEmpty();
    }
});

// ============================================
// HELPERS: Promisificar operaciones SQLite
// ============================================

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// ============================================
// SEED: Datos iniciales si la BD está vacía
// ============================================

async function seedIfEmpty() {
    try {
        const count = await dbGet('SELECT COUNT(*) as total FROM users');
        if (count.total > 0) {
            console.log('ℹ️  Base de datos ya tiene datos, no se ejecuta seed.');
            return;
        }

        console.log('🌱 Insertando datos iniciales...');

        const bcrypt = require('bcryptjs');
        const hash = (pwd) => bcrypt.hashSync(pwd, 10);

        // Usuarios demo
        const users = [
            ['admin-1', 'Administrador Gym', 'admin@gym.com', hash('123456'), 'admin'],
            ['coach-1', 'Carlos Méndez (Coach)', 'coach@gym.com', hash('123456'), 'coach'],
            ['client-1', 'Juan Pérez', 'cliente@gym.com', hash('123456'), 'client'],
            ['client-2', 'María López', 'maria@gym.com', hash('123456'), 'client']
        ];

        for (const u of users) {
            await dbRun(
                'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
                u
            );
        }

        // Ejercicios demo
        const exercises = [
            ['ej-1', 'Sentadilla con Barra', 'Piernas / Glúteos', 'reps',
             'Coloca la barra tras la nuca sobre los trapecios. Baja flexionando rodillas a 90 grados manteniendo la espalda recta.',
             'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=60', 60],
            ['ej-2', 'Press de Banca Plano', 'Pecho / Tríceps', 'reps',
             'Acostado en el banco, baja la barra de forma controlada hasta rozar el pecho y empuja con fuerza hacia arriba.',
             'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60', 60],
            ['ej-3', 'Plancha Abdominal Estática', 'Core / Abdomen', 'time',
             'Apóyate sobre los antebrazos y las puntas de los pies. Mantén el abdomen tenso y la columna completamente alineada.',
             'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=500&auto=format&fit=crop&q=60', 45],
            ['ej-4', 'Remo con Mancuerna', 'Espalda / Dorsales', 'reps',
             'Apoya una rodilla y mano en un banco. Sube la mancuerna llevando el codo hacia atrás y contrayendo la espalda.',
             'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60', 60],
            ['ej-5', 'Press Militar de Hombros', 'Hombros / Deltoides', 'reps',
             'De pie o sentado, eleva las mancuernas desde la altura de las orejas hacia arriba hasta extender los brazos casi por completo.',
             'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60', 60],
            ['ej-6', 'Puente de Glúteo Isométrico', 'Glúteos / Isquiotibiales', 'time',
             'Boca arriba con rodillas flexionadas, eleva la pelvis contrayendo los glúteos fuertemente y mantén la posición.',
             'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60', 45]
        ];

        for (const e of exercises) {
            await dbRun(
                `INSERT INTO exercises (id, name, muscle_group, type, description, media_url, default_rest_sec)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                e
            );
        }

        // Rutina demo
        await dbRun(
            `INSERT INTO routines (id, name, coach_id, coach_name, assigned_to_client_id, days, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                'rutina-demo-1',
                'Rutina Full Body & Core Iniciación',
                'coach-1',
                'Carlos Méndez (Coach)',
                'client-1',
                'Lunes, Miércoles, Viernes',
                'Rutina equilibrada para desarrollar fuerza general y resistencia muscular en core.'
            ]
        );

        const routineExercises = [
            ['rutina-demo-1', 'ej-1', 'Sentadilla con Barra', 'Piernas / Glúteos', 'reps', 3, 10, 40, 60, 0,
             'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=60', 0],
            ['rutina-demo-1', 'ej-2', 'Press de Banca Plano', 'Pecho / Tríceps', 'reps', 3, 10, 35, 60, 0,
             'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60', 1],
            ['rutina-demo-1', 'ej-3', 'Plancha Abdominal Estática', 'Core / Abdomen', 'time', 2, 0, 0, 45, 45,
             'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=500&auto=format&fit=crop&q=60', 2]
        ];

        for (const re of routineExercises) {
            await dbRun(
                `INSERT INTO routine_exercises
                 (routine_id, exercise_id, name, muscle_group, tipo, series, reps, peso_sugerido, descanso_seg, tiempo_objetivo_seg, media_url, order_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                re
            );
        }

        console.log('✅ Datos iniciales insertados correctamente.');
    } catch (err) {
        console.error('❌ Error en seed:', err);
    }
}

module.exports = { db, dbRun, dbGet, dbAll };