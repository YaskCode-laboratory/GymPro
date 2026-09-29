/**
 * CONSTRUCTOR DE CONTEXTO (contextBuilder.js)
 * Extrae datos reales del cliente desde SQLite para inyectarlos en el prompt.
 */

const { dbAll, dbGet } = require('../db/database');

/**
 * Devuelve el nombre del día actual en español: "Lunes", "Martes", etc.
 * Nota: usa la zona horaria del servidor. Si quieres la del cliente,
 * habría que enviarla desde el frontend.
 */
function getTodayName() {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date().getDay()];
}

/**
 * Normaliza un nombre de día: minúsculas y sin tildes.
 */
function normalizeDayName(name) {
    return (name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Devuelve true si la rutina incluye el día de hoy.
 */
function routineIncludesToday(rutina) {
    if (!rutina || !rutina.days || rutina.days.trim() === '') return true;
    const hoy = normalizeDayName(getTodayName());
    const diasArray = rutina.days.split(',')
        .map(d => normalizeDayName(d.trim()))
        .filter(d => d !== '');
    return diasArray.indexOf(hoy) !== -1;
}

/**
 * Construye el contexto del CLIENTE: fecha actual, rutina asignada,
 * historial reciente y pesos máximos por ejercicio.
 */
async function buildClientContext(user) {
    // ---- 0. Información temporal ----
    const ahora = new Date();
    const hoyNombre = getTodayName();
    const fechaFormateada = ahora.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const horaFormateada = ahora.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // ---- 1. Rutina asignada ----
    const rutina = await dbGet(
        'SELECT * FROM routines WHERE assigned_to_client_id = ? LIMIT 1',
        [user.id]
    );

    let rutinaInfo = 'Sin rutina asignada actualmente.';
    let tocaHoyInfo = 'No aplica (sin rutina).';

    if (rutina) {
        const ejercicios = await dbAll(
            'SELECT * FROM routine_exercises WHERE routine_id = ? ORDER BY order_index ASC',
            [rutina.id]
        );

        const lineas = ejercicios.map((e, i) => {
            const objetivo = e.tipo === 'time'
                ? `${e.tiempo_objetivo_seg || 45}s`
                : `${e.reps || 10} reps`;
            return `${i + 1}. ${e.name} — ${e.series} series × ${objetivo} @ ${e.peso_sugerido || 0}kg (descanso ${e.descanso_seg}s)`;
        });

        rutinaInfo =
            `Nombre: "${rutina.name}"\n` +
            `Días programados: ${rutina.days || 'días flexibles'}\n` +
            `Ejercicios:\n${lineas.join('\n')}`;

        // ---- Determinar si hoy toca ----
        const tocaHoy = routineIncludesToday(rutina);
        if (!rutina.days || rutina.days.trim() === '') {
            tocaHoyInfo = 'SÍ (la rutina no tiene días restringidos, se puede hacer cualquier día).';
        } else if (tocaHoy) {
            tocaHoyInfo = `SÍ. Hoy es ${hoyNombre} y está dentro de los días programados (${rutina.days}).`;
        } else {
            tocaHoyInfo = `NO. Hoy es ${hoyNombre} y los días programados son: ${rutina.days}. Hoy toca descanso o hacer otra actividad.`;
        }
    }

    // ---- 2. Últimas 5 sesiones ----
    const sesiones = await dbAll(
        `SELECT routine_name, fecha_inicio, duracion_total_seg, duracion_efectiva_seg
         FROM sessions WHERE client_id = ?
         ORDER BY created_at DESC LIMIT 5`,
        [user.id]
    );

    let sesionesInfo = 'Sin entrenamientos registrados todavía.';
    if (sesiones.length > 0) {
        sesionesInfo = sesiones.map(s => {
            const fecha = s.fecha_inicio
                ? new Date(s.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : '?';
            const minTotal = Math.round((s.duracion_total_seg || 0) / 60);
            const minEfec = Math.round((s.duracion_efectiva_seg || 0) / 60);
            return `- ${fecha}: "${s.routine_name}" → ${minTotal} min totales (${minEfec} min efectivos)`;
        }).join('\n');
    }

    // ---- 3. Pesos máximos por ejercicio ----
    const pesosMax = await dbAll(
        `SELECT sd.exercise_name, MAX(sd.peso_real) AS max_peso, COUNT(*) AS series_hechas
         FROM session_details sd
         JOIN sessions s ON s.id = sd.session_id
         WHERE s.client_id = ? AND sd.peso_real > 0
         GROUP BY sd.exercise_name
         ORDER BY max_peso DESC
         LIMIT 10`,
        [user.id]
    );

    let pesosInfo = 'Sin datos de pesos registrados aún.';
    if (pesosMax.length > 0) {
        pesosInfo = pesosMax.map(p =>
            `- ${p.exercise_name}: ${p.max_peso} kg (${p.series_hechas} series hechas)`
        ).join('\n');
    }

    return {
        hoyNombre,
        fechaFormateada,
        horaFormateada,
        rutinaInfo,
        tocaHoyInfo,
        sesionesInfo,
        pesosInfo
    };
}

module.exports = { buildClientContext, getTodayName, routineIncludesToday };