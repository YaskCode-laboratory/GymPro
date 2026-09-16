/**
 * GESTOR DE DATOS (storage.js) - VERSIÓN CON BACKEND
 *
 * Mantiene una caché en memoria sincronizada con el servidor.
 * Los métodos `getX()` son síncronos (usan la caché) para no romper el código existente.
 * Los métodos `saveX()/deleteX()` son ASÍNCRONOS (hacen fetch) y actualizan la caché.
 *
 * IMPORTANTE: Al iniciar la app, llamar `await refreshAllData()` antes de renderizar.
 */

// ============================================
// CACHÉ LOCAL (espejo de la BD del servidor)
// ============================================
var gymDatabase = {
    users: [],
    ejercicios: [],
    rutinas: [],
    sesiones: []
};

// Bandera de inicialización
var dbReady = false;

// ============================================
// CARGA INICIAL DESDE EL SERVIDOR
// ============================================
async function refreshAllData() {
    try {
        const [users, ejercicios, rutinas, sesiones] = await Promise.all([
            UsersAPI.getAll(),
            ExercisesAPI.getAll(),
            RoutinesAPI.getAll(),
            SessionsAPI.getAll()
        ]);

        gymDatabase.users = users;
        gymDatabase.ejercicios = ejercicios;
        gymDatabase.rutinas = rutinas;
        gymDatabase.sesiones = sesiones;
        dbReady = true;

        if (typeof userDataBase !== 'undefined') {
            userDataBase = gymDatabase.users;
        }
        return true;
    } catch (err) {
        console.error('❌ Error cargando datos del servidor:', err);
        alert('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        return false;
    }
}

// Alias retrocompatible (por si el código viejo llama initDatabase)
async function initDatabase() {
    return refreshAllData();
}

// ============================================
// USUARIOS
// ============================================
function getAllUsers() { return gymDatabase.users; }

function getUserById(userId) {
    return gymDatabase.users.find(u => u.id === userId) || null;
}

function getUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    return gymDatabase.users.find(u => u.email.toLowerCase() === clean) || null;
}

async function saveUser(user) {
    const exists = gymDatabase.users.find(u => u.id === user.id);
    let saved;
    if (exists) {
        saved = await UsersAPI.update(user.id, {
            name: user.name,
            email: user.email,
            password: user.password || '',
            role: user.role
        });
        Object.assign(exists, saved);
    } else {
        saved = await UsersAPI.create({
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role
        });
        // Refrescar para tener el id generado por el server si aplica
        const fresh = await UsersAPI.getAll();
        gymDatabase.users = fresh;
    }
    return saved;
}

async function deleteUserById(userId) {
    await UsersAPI.delete(userId);
    gymDatabase.users = gymDatabase.users.filter(u => u.id !== userId);
    // También quitar asignaciones en caché
    gymDatabase.rutinas.forEach(r => {
        if (r.assignedToClientId === userId) r.assignedToClientId = null;
    });
}

// ============================================
// EJERCICIOS
// ============================================
function getAllEjercicios() { return gymDatabase.ejercicios; }

function getEjercicioById(id) {
    return gymDatabase.ejercicios.find(e => e.id === id) || null;
}

async function saveEjercicio(ejercicio) {
    const saved = await ExercisesAPI.create({
        id: ejercicio.id,
        name: ejercicio.name,
        muscleGroup: ejercicio.muscleGroup,
        type: ejercicio.type,
        description: ejercicio.description,
        mediaUrl: ejercicio.mediaUrl,
        defaultRestSec: ejercicio.defaultRestSec
    });
    gymDatabase.ejercicios.push(saved);
    return saved;
}

// ============================================
// RUTINAS
// ============================================
function getAllRutinas() { return gymDatabase.rutinas; }

function getRutinaById(rutinaId) {
    return gymDatabase.rutinas.find(r => r.id === rutinaId) || null;
}

function getRutinasByClientId(clientId) {
    return gymDatabase.rutinas.filter(r => r.assignedToClientId === clientId);
}

function getRutinasByCoachId(coachId) {
    return gymDatabase.rutinas.filter(r => r.coachId === coachId);
}

async function saveRutina(rutina) {
    const saved = await RoutinesAPI.save({
        id: rutina.id,
        name: rutina.name,
        coachId: rutina.coachId,
        coachName: rutina.coachName,
        assignedToClientId: rutina.assignedToClientId,
        dias: rutina.dias,
        description: rutina.description,
        ejercicios: rutina.ejercicios
    });

    const idx = gymDatabase.rutinas.findIndex(r => r.id === saved.id);
    if (idx !== -1) gymDatabase.rutinas[idx] = saved;
    else gymDatabase.rutinas.push(saved);

    return saved;
}

async function deleteRutinaById(rutinaId) {
    await RoutinesAPI.delete(rutinaId);
    gymDatabase.rutinas = gymDatabase.rutinas.filter(r => r.id !== rutinaId);
}

// ============================================
// SESIONES
// ============================================
function getAllSesiones() { return gymDatabase.sesiones; }

function getSesionesByClientId(clientId) {
    return gymDatabase.sesiones.filter(s => s.clienteId === clientId);
}

async function saveSesion(sesion) {
    const payload = {
        id: sesion.id,
        clienteId: sesion.clienteId,
        rutinaId: sesion.rutinaId,
        rutinaNombre: sesion.rutinaNombre,
        fechaInicio: sesion.fechaInicio,
        fechaFin: sesion.fechaFin,
        duracionTotalSeg: sesion.duracionTotalSeg,
        completada: sesion.completada,
        detalles: sesion.detalles
    };
    await SessionsAPI.save(payload);
    gymDatabase.sesiones.push(sesion);
}

// ============================================
// SESIÓN ACTIVA (persistencia local temporal)
// ============================================
// Esta SÍ se queda en localStorage porque es un estado transitorio
// que no necesita guardarse en el servidor hasta que el usuario finalice.
var ACTIVE_WORKOUT_STORAGE_KEY = 'gym_active_workout_session';

function getActiveWorkoutStorage() {
    const raw = localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

function saveActiveWorkoutStorage(workoutState) {
    localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(workoutState));
}

function clearActiveWorkoutStorage() {
    localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
}