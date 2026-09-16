/**
 * CONTROLADOR DEL PANEL DE CLIENTE / ALUMNO (appClient.js)
 * 
 * Funcionalidades del Cliente:
 * 1. Ver su rutina asignada para hoy / general con desglose de ejercicios.
 * 2. Iniciar el "Modo Entrenamiento" (reproductor guiado).
 * 3. Consultar su historial de entrenamientos completados y pesos registrados.
 * 4. Detectar si hay una sesión guardada a mitad de camino y permitir reanudarla.
 * 
 * NOTA: Las operaciones de lectura usan la caché sincronizada (sync).
 *       Solo el guardado de sesiones es asíncrono (ver workoutPlayer.js).
 */

function renderClientDashboard() {
    if (!loggedInUser) return;

    // Actualizar nombre en el encabezado
    var nameEl = document.getElementById('clientNameDisplay');
    if (nameEl) nameEl.textContent = loggedInUser.name;

    // Verificar si hay sesión pendiente para reanudar
    checkPendingActiveWorkout();

    // Renderizar rutinas asignadas
    renderClientAssignedRoutines();

    // Renderizar historial de entrenamientos
    renderClientHistory();
}

/**
 * Muestra las rutinas asignadas al cliente conectado
 */
function renderClientAssignedRoutines() {
    var container = document.getElementById('clientRoutineList');
    if (!container) return;

    container.innerHTML = '';

    // Buscar rutinas asignadas específicamente a este cliente
    var rutinas = getRutinasByClientId(loggedInUser.id);

    // Si no tiene ninguna asignada específicamente, mostrar las rutinas públicas/generales
    if (rutinas.length === 0) {
        var allRoutines = getAllRutinas();
        rutinas = allRoutines.filter(function (r) { return !r.assignedToClientId; });
    }

    if (rutinas.length === 0) {
        container.innerHTML =
            '<div class="empty-routine-box">' +
                '<p>⚠️ No tienes ninguna rutina asignada en este momento.</p>' +
                '<small class="text-muted">Pídele a tu instructor asignado que configure una rutina para ti.</small>' +
            '</div>';
        return;
    }

    rutinas.forEach(function (rutina) {
        var card = document.createElement('div');
        card.className = 'client-routine-card';

        // Lista de ejercicios previa
        var ejerciciosHtml = '<div class="client-routine-ex-preview">';
        rutina.ejercicios.forEach(function (ej, idx) {
            var detalle = ej.tipo === 'time'
                ? ej.series + ' × ' + (ej.tiempo_objetivo_seg || 45) + 's'
                : ej.series + ' × ' + ej.reps + ' reps (@ ' + (ej.peso_sugerido || 0) + 'kg)';
            ejerciciosHtml +=
                '<div class="routine-ex-item">' +
                    '<span><strong>' + (idx + 1) + '.</strong> ' + ej.nombre + '</span>' +
                    '<span class="text-muted" style="font-size: 13px;">' + detalle + '</span>' +
                '</div>';
        });
        ejerciciosHtml += '</div>';

        card.innerHTML =
            '<div class="client-routine-header">' +
                '<div>' +
                    '<h3>' + rutina.name + '</h3>' +
                    '<span class="routine-meta">🗓 ' + (rutina.dias || 'Días libres') + ' · Coach: ' + (rutina.coachName || 'Entrenador') + '</span>' +
                '</div>' +
                '<span class="badge badge-info">' + rutina.ejercicios.length + ' ejercicios</span>' +
            '</div>' +
            '<p class="routine-description-text">' + (rutina.description || 'Sigue el plan para alcanzar tus objetivos.') + '</p>' +
            ejerciciosHtml +
            '<div class="client-routine-actions">' +
                '<button type="button" class="btn-start-workout" onclick="openWorkoutPreview(\'' + rutina.id + '\')">' +
                    '▶ Iniciar Entrenamiento' +
                '</button>' +
            '</div>';
        container.appendChild(card);
    });
}

/**
 * Muestra el historial de entrenamientos completados por el cliente
 */
function renderClientHistory() {
    var container = document.getElementById('clientProgressChart');
    if (!container) return;

    var sesiones = getSesionesByClientId(loggedInUser.id);
    container.innerHTML = '';

    if (sesiones.length === 0) {
        container.innerHTML =
            '<div class="empty-progress-box">' +
                '<p>🏋️‍♂️ Aún no has completado entrenamientos.</p>' +
                '<small class="text-muted">¡Presiona "Iniciar Entrenamiento" arriba para realizar tu primera sesión!</small>' +
            '</div>';
        return;
    }

    // Métricas rápidas del cliente
    var totalMinutos = Math.round(sesiones.reduce(function (acc, s) {
        return acc + (s.duracionTotalSeg || 0);
    }, 0) / 60);
    var totalSesiones = sesiones.length;

    var statsBanner = document.createElement('div');
    statsBanner.className = 'client-history-stats-banner';
    statsBanner.innerHTML =
        '<div class="client-stat-item">' +
            '<span class="client-stat-number">' + totalSesiones + '</span>' +
            '<span class="client-stat-label">Sesiones completadas</span>' +
        '</div>' +
        '<div class="client-stat-item">' +
            '<span class="client-stat-number">' + totalMinutos + ' min</span>' +
            '<span class="client-stat-label">Tiempo entrenado</span>' +
        '</div>';
    container.appendChild(statsBanner);

    // Listado en orden inverso (los más recientes primero)
    var reversedSesiones = sesiones.slice().reverse();
    var listWrapper = document.createElement('div');
    listWrapper.className = 'client-sessions-history-list';

    reversedSesiones.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'client-session-item-card';

        var fechaStr = s.fechaInicio
            ? new Date(s.fechaInicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Fecha no registrada';
        var seriesHechas = s.detalles ? s.detalles.filter(function (d) { return d.completada; }).length : 0;

        // Desglose de ejercicios y pesos
        var detalleLines = '';
        if (s.detalles && s.detalles.length > 0) {
            detalleLines = '<div class="session-quick-summary">';
            var grouped = {};
            s.detalles.forEach(function (d) {
                if (!grouped[d.ejercicioNombre]) grouped[d.ejercicioNombre] = [];
                if (d.completada) grouped[d.ejercicioNombre].push(d.pesoReal);
            });
            Object.keys(grouped).forEach(function (k) {
                var maxWeight = Math.max.apply(null, grouped[k].concat([0]));
                var weightStr = maxWeight > 0 ? ' (peso máx: ' + maxWeight + ' kg)' : '';
                detalleLines += '<span class="quick-pill">✔ ' + k + ': ' + grouped[k].length + ' series' + weightStr + '</span>';
            });
            detalleLines += '</div>';
        }

        card.innerHTML =
            '<div class="session-item-header">' +
                '<div>' +
                    '<strong>' + s.rutinaNombre + '</strong>' +
                    '<div class="text-muted" style="font-size: 13px;">📅 ' + fechaStr + '</div>' +
                '</div>' +
                '<div class="session-pill-time">' +
                    '⏱ ' + formatTime(s.duracionTotalSeg) + ' · ' + seriesHechas + ' series' +
                '</div>' +
            '</div>' +
            detalleLines;
        listWrapper.appendChild(card);
    });

    container.appendChild(listWrapper);
}