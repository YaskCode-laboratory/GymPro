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

    updateHeaderAvatar();
    initAIChatForUser();
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
        var tocaHoy = isRoutineScheduledForToday(rutina);

        card.className = 'client-routine-card' + (tocaHoy ? '' : ' not-today');

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

        // ============================================
        // Aviso si HOY NO toca esta rutina
        // ============================================
        var noticeHtml = '';
        if (!tocaHoy) {
            var hoyNombre = getTodayDayName();
            noticeHtml =
                '<div class="rest-day-notice">' +
                    '<span style="font-size: 1.2rem;">📅</span>' +
                    '<span>Hoy es <strong>' + hoyNombre + '</strong> y esta rutina está programada para: <strong>' + rutina.dias + '</strong>. Descansa o elige otra rutina.</span>' +
                '</div>';
        }

        // ============================================
        // Badge "Hoy sí toca"
        // ============================================
        var todayBadgeHtml = tocaHoy && rutina.dias
            ? '<span class="today-badge">🔥 Hoy toca</span>'
            : '';

        // ============================================
        // Botón: habilitado o deshabilitado
        // ============================================
        var buttonHtml = tocaHoy
            ? '<button type="button" class="btn-start-workout" onclick="openWorkoutPreview(\'' + rutina.id + '\')">' +
                  '▶ Iniciar Entrenamiento' +
              '</button>'
            : '<button type="button" class="btn-start-workout disabled" disabled title="Hoy no toca esta rutina">' +
                  '🚫 Hoy no toca entrenar esta rutina' +
              '</button>';

        card.innerHTML =
            '<div class="client-routine-header">' +
                '<div>' +
                    '<h3>' + rutina.name + ' ' + todayBadgeHtml + '</h3>' +
                    '<span class="routine-meta">🗓 ' + (rutina.dias || 'Días libres') + ' · Coach: ' + (rutina.coachName || 'Entrenador') + '</span>' +
                '</div>' +
                '<span class="badge badge-info">' + rutina.ejercicios.length + ' ejercicios</span>' +
            '</div>' +
            '<p class="routine-description-text">' + (rutina.description || 'Sigue el plan para alcanzar tus objetivos.') + '</p>' +
            noticeHtml +
            ejerciciosHtml +
            '<div class="client-routine-actions">' +
                buttonHtml +
            '</div>';
        container.appendChild(card);
    });
}

/**
 * Muestra el historial de entrenamientos completados por el cliente
 */
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

    // Métricas rápidas del cliente (banner superior)
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

        // Duración total (con descansos) y duración efectiva (solo ejercicio)
        var durTotal = s.duracionTotalSeg || 0;
        var durEfectiva = s.duracionEfectivaSeg || 0;

        var durDescanso = Math.max(0, durTotal - durEfectiva);

        // Si por alguna razón no hay duración efectiva guardada, usar el total
        if (durEfectiva === 0) durEfectiva = durTotal;

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
                    '✔ ' + seriesHechas + ' series' +
                '</div>' +
            '</div>' +

            // ─── NUEVA FILA: duraciones desglosadas ───
            '<div class="session-duration-row">' +
                '<div class="duration-chip duration-total">' +
                    '<span class="duration-chip-icon">⏱</span>' +
                    '<div class="duration-chip-text">' +
                        '<span class="duration-chip-label">Duración total</span>' +
                        '<strong class="duration-chip-value">' + formatTime(durTotal) + '</strong>' +
                    '</div>' +
                '</div>' +
                '<div class="duration-chip duration-effective">' +
                    '<span class="duration-chip-icon">💪</span>' +
                    '<div class="duration-chip-text">' +
                        '<span class="duration-chip-label">Tiempo efectivo</span>' +
                        '<strong class="duration-chip-value">' + formatTime(durEfectiva) + '</strong>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            detalleLines;

        listWrapper.appendChild(card);
    });

    container.appendChild(listWrapper);
}
