-- ============================================
-- ESQUEMA DE BASE DE DATOS GYMPRO
-- ============================================

PRAGMA foreign_keys = ON;

-- Usuarios (admin, coach, client)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'coach', 'client')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ejercicios (catálogo global)
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('reps', 'time')),
    description TEXT,
    media_url TEXT,
    default_rest_sec INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rutinas
CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    coach_id TEXT,
    coach_name TEXT,
    assigned_to_client_id TEXT,
    days TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_client_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Ejercicios dentro de una rutina (configuración específica)
CREATE TABLE IF NOT EXISTS routine_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT,
    tipo TEXT NOT NULL,
    series INTEGER NOT NULL,
    reps INTEGER DEFAULT 0,
    peso_sugerido REAL DEFAULT 0,
    descanso_seg INTEGER DEFAULT 60,
    tiempo_objetivo_seg INTEGER DEFAULT 0,
    media_url TEXT,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Sesiones de entrenamiento
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    routine_id TEXT,
    routine_name TEXT,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT,
    duracion_total_seg INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
);

-- Detalle de cada serie dentro de una sesión
CREATE TABLE IF NOT EXISTS session_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    exercise_id TEXT,
    exercise_name TEXT,
    serie_num INTEGER NOT NULL,
    tiempo_ejercicio_seg INTEGER DEFAULT 0,
    peso_real REAL DEFAULT 0,
    completada INTEGER DEFAULT 0,
    saltada INTEGER DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_routines_coach ON routines(coach_id);
CREATE INDEX IF NOT EXISTS idx_routines_assigned ON routines(assigned_to_client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_session_details_session ON session_details(session_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);