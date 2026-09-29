/**
 * CONTROLADOR DEL PANEL DE INSTRUCTOR / COACH (coach.js)
 * 
 * Funcionalidades del Instructor:
 * 1. Ver lista de alumnos (clientes) y su rutina asignada.
 * 2. Creador y editor dinámico de rutinas con ejercicios del catálogo.
 * 3. Asignación directa de rutinas a clientes.
 * 4. Seguimiento y consulta del historial de progreso de cada alumno.
 * 
 * NOTA: Todas las operaciones de guardado son ASÍNCRONAS (usan la API REST).
 */

// Variable temporal para el constructor de rutinas
var builderExercisesList = [];

// ==========================================
// RENDERIZADO PRINCIPAL DEL PANEL INSTRUCTOR
// ==========================================

function renderCoachDashboard() {
    renderCoachClientsList();
    renderCoachRoutinesList();
    updateHeaderAvatar();
}

/**
 * Lista de alumnos asignables con su rutina actual y botón para ver progreso
 */
function renderCoachClientsList() {
    var container = document.getElementById('coachClientsList');
    if (!container) return;

    var allUsers = getAllUsers();
    var clients = allUsers.filter(function (u) { return u.role === 'client'; });
    container.innerHTML = '';

    if (clients.length === 0) {
        container.innerHTML = '<p class="text-muted">Aún no hay clientes registrados en el sistema.</p>';
        return;
    }

    clients.forEach(function (client) {
        var clientRoutines = getRutinasByClientId(client.id);
        var rutinaTexto = clientRoutines.length > 0
            ? clientRoutines.map(function (r) { return '<strong>' + r.name + '</strong>'; }).join(', ')
            : '<span class="text-muted">Sin rutina asignada</span>';

        var clientSessions = getSesionesByClientId(client.id);

        // ← Avatar con imagen o placeholder
        var avatarHtml = client.avatar
            ? '<img src="' + client.avatar + '" alt="' + client.name + '" class="client-avatar-img">'
            : '<div class="client-avatar-placeholder">👤</div>';

        var card = document.createElement('div');
        card.className = 'coach-client-card';
        card.innerHTML =
            avatarHtml +
            '<div class="client-info">' +
                '<h4>' + client.name + '</h4>' +
                '<span class="client-email">' + client.email + '</span>' +
                '<div class="client-routine-badge">Rutina: ' + rutinaTexto + '</div>' +
                '<div class="client-stats-mini">🏆 ' + clientSessions.length + ' entrenamientos completados</div>' +
            '</div>' +
            '<div class="client-actions">' +
                '<button type="button" class="btn-sm btn-primary" onclick="openAssignRoutineModal(\'' + client.id + '\')">📋 Asignar Rutina</button>' +
                '<button type="button" class="btn-sm btn-outline" onclick="openClientProgressModal(\'' + client.id + '\')">📈 Ver Progreso</button>' +
            '</div>';
        container.appendChild(card);
    });
}

/**
 * Lista de rutinas creadas por el instructor actual
 */
function renderCoachRoutinesList() {
    var container = document.getElementById('coachRoutinesList');
    if (!container) return;

    var rutinas = loggedInUser ? getRutinasByCoachId(loggedInUser.id) : getAllRutinas();
    if (rutinas.length === 0) {
        rutinas = getAllRutinas();
    }

    container.innerHTML = '';

    if (rutinas.length === 0) {
        container.innerHTML = '<p class="text-muted">No tienes rutinas creadas todavía. ¡Crea una con el botón de abajo!</p>';
        return;
    }

    rutinas.forEach(function (rutina) {
        var assignedUser = rutina.assignedToClientId ? getUserById(rutina.assignedToClientId) : null;
        var assignedName = assignedUser ? assignedUser.name : 'Nadie aún';
        var numEjercicios = (rutina.ejercicios && rutina.ejercicios.length) ? rutina.ejercicios.length : 0;

        var card = document.createElement('div');
        card.className = 'coach-routine-card';
        card.innerHTML =
            '<div class="routine-card-header">' +
                '<div>' +
                    '<h4>' + rutina.name + '</h4>' +
                    '<span class="routine-days">🗓 ' + (rutina.dias || 'Días flexibles') + '</span>' +
                '</div>' +
                '<span class="badge badge-info">' + numEjercicios + ' ejercicios</span>' +
            '</div>' +
            '<p class="routine-desc">' + (rutina.description || 'Sin descripción.') + '</p>' +
            '<div class="routine-assigned-info">' +
                '<span>Asignada a: <strong>' + assignedName + '</strong></span>' +
            '</div>' +
            '<div class="routine-card-actions">' +
                '<button type="button" class="btn-sm btn-outline" onclick="openEditRoutineModal(\'' + rutina.id + '\')">✏ Editar</button>' +
                '<button type="button" class="btn-sm btn-danger" onclick="confirmDeleteRoutineCoach(\'' + rutina.id + '\')">🗑 Eliminar</button>' +
            '</div>';
        container.appendChild(card);
    });
}

// ==========================================
// CONSTRUCTOR Y EDITOR DE RUTINAS (MODAL)
// ==========================================

function openCreateRoutineModal() {
    document.getElementById('modalRoutineTitle').textContent = 'Crear Nueva Rutina';
    document.getElementById('modalRoutineId').value = '';
    document.getElementById('modalRoutineName').value = '';
    document.getElementById('modalRoutineDesc').value = '';

    // Reset del selector de días (sin días seleccionados)
    resetDaysPicker();

    builderExercisesList = [];
    populateClientSelectOptions();
    populateExerciseSelectOptions();
    renderBuilderExercisesTable();

    document.getElementById('routineBuilderModal').classList.remove('hidden');
}

function openEditRoutineModal(rutinaId) {
    var rutina = getRutinaById(rutinaId);
    if (!rutina) return;

    document.getElementById('modalRoutineTitle').textContent = 'Editar Rutina: ' + rutina.name;
    document.getElementById('modalRoutineId').value = rutina.id;
    document.getElementById('modalRoutineName').value = rutina.name;
    document.getElementById('modalRoutineDesc').value = rutina.description || '';

    // Pre-seleccionar los días que ya tenía la rutina
    setDaysPickerFromString(rutina.dias || '');

    builderExercisesList = JSON.parse(JSON.stringify(rutina.ejercicios || []));

    populateClientSelectOptions(rutina.assignedToClientId);
    populateExerciseSelectOptions();
    renderBuilderExercisesTable();

    document.getElementById('routineBuilderModal').classList.remove('hidden');
}

function closeRoutineBuilderModal() {
    document.getElementById('routineBuilderModal').classList.add('hidden');
}

function populateClientSelectOptions(selectedClientId) {
    if (selectedClientId === undefined) selectedClientId = null;

    var select = document.getElementById('modalRoutineAssignClient');
    if (!select) return;

    var clients = getAllUsers().filter(function (u) { return u.role === 'client'; });
    select.innerHTML = '<option value="">-- Sin asignar (guardar plantilla) --</option>';

    clients.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name + ' (' + c.email + ')';
        if (selectedClientId && selectedClientId === c.id) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

function populateExerciseSelectOptions() {
    var select = document.getElementById('builderSelectExercise');
    if (!select) return;

    var ejercicios = getAllEjercicios();
    select.innerHTML = '<option value="">-- Elige un ejercicio del catálogo --</option>';

    ejercicios.forEach(function (ej) {
        var opt = document.createElement('option');
        opt.value = ej.id;
        opt.textContent = ej.name + ' (' + ej.muscleGroup + ' - ' + (ej.type === 'time' ? 'Por tiempo' : 'Por reps') + ')';
        select.appendChild(opt);
    });

    select.onchange = handleBuilderExerciseChange;
}

function handleBuilderExerciseChange() {
    var select = document.getElementById('builderSelectExercise');
    var ejId = select.value;
    var ej = getEjercicioById(ejId);

    var repsField = document.getElementById('builderFieldReps');
    var timeField = document.getElementById('builderFieldTime');
    var weightField = document.getElementById('builderFieldWeight');

    if (!ej) return;

    if (ej.type === 'time') {
        repsField.classList.add('hidden');
        timeField.classList.remove('hidden');
        weightField.classList.add('hidden');
        document.getElementById('builderInputTime').value = 45;
    } else {
        repsField.classList.remove('hidden');
        timeField.classList.add('hidden');
        weightField.classList.remove('hidden');
        document.getElementById('builderInputReps').value = 10;
        document.getElementById('builderInputWeight').value = 20;
    }

    document.getElementById('builderInputRest').value = ej.defaultRestSec || 60;
}

function addExerciseToBuilderList() {
    var select = document.getElementById('builderSelectExercise');
    var ejId = select.value;
    if (!ejId) {
        alert("Por favor selecciona un ejercicio del catálogo.");
        return;
    }

    var ej = getEjercicioById(ejId);
    if (!ej) return;

    var series = parseInt(document.getElementById('builderInputSeries').value) || 3;
    var descanso = parseInt(document.getElementById('builderInputRest').value) || 60;

    var item = {
        ejercicioId: ej.id,
        nombre: ej.name,
        muscleGroup: ej.muscleGroup,
        tipo: ej.type,
        series: series,
        descanso_seg: descanso,
        mediaUrl: ej.mediaUrl || ''
    };

    if (ej.type === 'time') {
        item.tiempo_objetivo_seg = parseInt(document.getElementById('builderInputTime').value) || 45;
        item.reps = 0;
        item.peso_sugerido = 0;
    } else {
        item.reps = parseInt(document.getElementById('builderInputReps').value) || 10;
        item.peso_sugerido = parseFloat(document.getElementById('builderInputWeight').value) || 0;
        item.tiempo_objetivo_seg = 0;
    }

    builderExercisesList.push(item);
    renderBuilderExercisesTable();
    select.value = '';
}

function removeExerciseFromBuilderList(index) {
    builderExercisesList.splice(index, 1);
    renderBuilderExercisesTable();
}

function renderBuilderExercisesTable() {
    // ============================================
    // 1. Actualizar contador
    // ============================================
    var countEl = document.getElementById('builderExercisesCount');
    if (countEl) countEl.textContent = builderExercisesList.length;

    // ============================================
    // 2. Render de la tabla (desktop)
    // ============================================
    var tbody = document.getElementById('builderExercisesTableBody');
    if (tbody) {
        tbody.innerHTML = '';

        if (builderExercisesList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 12px;" class="text-muted">Aún no has agregado ejercicios a esta rutina.</td></tr>';
        } else {
            builderExercisesList.forEach(function (item, idx) {
                var tr = document.createElement('tr');
                var objetivo = item.tipo === 'time'
                    ? item.tiempo_objetivo_seg + ' seg'
                    : item.reps + ' reps (@ ' + item.peso_sugerido + ' kg)';

                tr.innerHTML =
                    '<td><strong>' + (idx + 1) + '. ' + item.nombre + '</strong></td>' +
                    '<td>' + item.series + ' series</td>' +
                    '<td>' + objetivo + '</td>' +
                    '<td>⏱ ' + item.descanso_seg + 's</td>' +
                    '<td><button type="button" class="btn-sm btn-danger" onclick="removeExerciseFromBuilderList(' + idx + ')">✕</button></td>';
                tbody.appendChild(tr);
            });
        }
    }

    // ============================================
    // 3. Render de las cards (móvil)
    // ============================================
    var mobileList = document.getElementById('builderExercisesMobileList');
    if (mobileList) {
        mobileList.innerHTML = '';

        if (builderExercisesList.length === 0) {
            mobileList.innerHTML =
                '<div class="builder-empty-state">' +
                    '<span class="builder-empty-state-icon">🏋️</span>' +
                    '<p>Aún no has agregado ejercicios.</p>' +
                    '<small>Selecciona uno arriba y toca "+ Añadir".</small>' +
                '</div>';
        } else {
            builderExercisesList.forEach(function (item, idx) {
                var card = document.createElement('div');
                card.className = 'builder-exercise-card';

                // Objetivo según tipo
                var objetivoValue = item.tipo === 'time'
                    ? item.tiempo_objetivo_seg + 's'
                    : item.reps + ' reps';

                var objetivoLabel = item.tipo === 'time' ? 'Tiempo' : 'Reps';

                var pesoHtml = item.tipo === 'time'
                    ? ''
                    : '<div class="builder-exercise-stat">' +
                        '<span class="builder-exercise-stat-icon">🏋️</span>' +
                        '<span class="builder-exercise-stat-label">Peso</span>' +
                        '<span class="builder-exercise-stat-value">' + (item.peso_sugerido || 0) + 'kg</span>' +
                      '</div>';

                card.innerHTML =
                    '<div class="builder-exercise-card-header">' +
                        '<div class="builder-exercise-card-title">' +
                            '<span class="builder-exercise-card-num">' + (idx + 1) + '</span>' +
                            '<div class="builder-exercise-card-info">' +
                                '<strong>' + item.nombre + '</strong>' +
                                (item.muscleGroup ? '<span class="exercise-card-group">' + item.muscleGroup + '</span>' : '') +
                            '</div>' +
                        '</div>' +
                        '<button type="button" class="builder-exercise-card-remove" onclick="removeExerciseFromBuilderList(' + idx + ')" title="Quitar ejercicio">' +
                            '✕' +
                        '</button>' +
                    '</div>' +

                    '<div class="builder-exercise-card-stats">' +
                        '<div class="builder-exercise-stat">' +
                            '<span class="builder-exercise-stat-icon">📊</span>' +
                            '<span class="builder-exercise-stat-label">Series</span>' +
                            '<span class="builder-exercise-stat-value">' + item.series + '</span>' +
                        '</div>' +
                        '<div class="builder-exercise-stat">' +
                            '<span class="builder-exercise-stat-icon">🎯</span>' +
                            '<span class="builder-exercise-stat-label">' + objetivoLabel + '</span>' +
                            '<span class="builder-exercise-stat-value">' + objetivoValue + '</span>' +
                        '</div>' +
                        pesoHtml +
                        '<div class="builder-exercise-stat">' +
                            '<span class="builder-exercise-stat-icon">⏱</span>' +
                            '<span class="builder-exercise-stat-label">Descanso</span>' +
                            '<span class="builder-exercise-stat-value">' + item.descanso_seg + 's</span>' +
                        '</div>' +
                    '</div>';

                mobileList.appendChild(card);
            });
        }
    }
}



// ==========================================
// SELECTOR DE DÍAS (CHIPS) EN EL MODAL
// ==========================================

// Orden canónico de los días para mostrar
var DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Alterna el estado activo de un chip de día.
 */
function toggleDayChip(btn) {
    btn.classList.toggle('active');
    syncDaysHiddenInput();
}

/**
 * Sincroniza el <input type="hidden"> con los chips activos,
 * manteniendo el formato "Lunes, Miércoles, Viernes".
 */
function syncDaysHiddenInput() {
    var activeChips = document.querySelectorAll('#routineDaysPicker .day-chip.active');
    var dias = [];
    activeChips.forEach(function (chip) {
        dias.push(chip.getAttribute('data-day'));
    });

    // Ordenar según el orden canónico de la semana
    dias.sort(function (a, b) {
        return DIAS_SEMANA.indexOf(a) - DIAS_SEMANA.indexOf(b);
    });

    document.getElementById('modalRoutineDays').value = dias.join(', ');
}

/**
 * Limpia todos los chips activos.
 */
function resetDaysPicker() {
    var chips = document.querySelectorAll('#routineDaysPicker .day-chip');
    chips.forEach(function (chip) { chip.classList.remove('active'); });
    document.getElementById('modalRoutineDays').value = '';
}

/**
 * Marca como activos los chips cuyos días aparezcan en el string dado.
 * Acepta formatos: "Lunes, Miércoles", "lunes,miércoles", "Lunes,Miércoles,Viernes".
 */
function setDaysPickerFromString(diasStr) {
    resetDaysPicker();

    if (!diasStr) return;

    // Normalizar: minúsculas, sin tildes, sin espacios extra
    var normalizados = diasStr.split(',')
        .map(function (d) { return normalizeDayName(d.trim()); })
        .filter(function (d) { return d !== ''; });

    var chips = document.querySelectorAll('#routineDaysPicker .day-chip');
    chips.forEach(function (chip) {
        var day = chip.getAttribute('data-day');
        if (normalizados.indexOf(normalizeDayName(day)) !== -1) {
            chip.classList.add('active');
        }
    });

    syncDaysHiddenInput();
}

/**
 * Normaliza el nombre de un día para comparar:
 * "Miércoles" -> "miercoles", "Sábado" -> "sabado"
 */
function normalizeDayName(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quitar tildes
        .trim();
}



/**
 * Devuelve el nombre del día actual en español: "Lunes", "Martes", etc.
 */
function getTodayDayName() {
    var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date().getDay()];
}

/**
 * Determina si una rutina debe ejecutarse HOY según sus días configurados.
 * - Si la rutina no tiene días configurados ("") -> TRUE (disponible siempre).
 * - Si tiene días -> TRUE si hoy está en la lista.
 */
function isRoutineScheduledForToday(rutina) {
    if (!rutina || !rutina.dias || rutina.dias.trim() === '') {
        return true; // Sin restricción
    }

    var hoy = normalizeDayName(getTodayDayName());

    var diasArray = rutina.dias.split(',')
        .map(function (d) { return normalizeDayName(d.trim()); })
        .filter(function (d) { return d !== ''; });

    return diasArray.indexOf(hoy) !== -1;
}



async function handleSaveRoutineForm(e) {
    e.preventDefault();

    var id = document.getElementById('modalRoutineId').value;
    var name = document.getElementById('modalRoutineName').value.trim();
    var dias = document.getElementById('modalRoutineDays').value.trim();
    var desc = document.getElementById('modalRoutineDesc').value.trim();
    var assignedClientId = document.getElementById('modalRoutineAssignClient').value || null;

    if (!name) {
        alert("Por favor ingresa un nombre para la rutina.");
        return;
    }

    if (builderExercisesList.length === 0) {
        alert("Debes agregar al menos un ejercicio a la rutina.");
        return;
    }

    var rutina = {
        id: id || ('rutina-' + Date.now()),
        name: name,
        coachId: loggedInUser ? loggedInUser.id : 'coach-1',
        coachName: loggedInUser ? loggedInUser.name : 'Coach',
        assignedToClientId: assignedClientId,
        dias: dias,
        description: desc,
        ejercicios: builderExercisesList
    };

    try {
        await RoutinesAPI.save(rutina);
        await refreshAllData();
        alert("¡Rutina guardada con éxito!");
        closeRoutineBuilderModal();
        renderCoachDashboard();
    } catch (err) {
        alert("Error al guardar rutina: " + err.message);
    }
}

async function confirmDeleteRoutineCoach(rutinaId) {
    if (confirm("¿Estás seguro de eliminar esta rutina?")) {
        try {
            await deleteRutinaById(rutinaId);
            await refreshAllData();
            renderCoachDashboard();
        } catch (err) {
            alert("Error al eliminar: " + err.message);
        }
    }
}

// ==========================================
// MODAL: ASIGNAR RUTINA A CLIENTE
// ==========================================

function openAssignRoutineModal(clientId) {
    var client = getUserById(clientId);
    if (!client) return;

    var rutinas = getAllRutinas();
    if (rutinas.length === 0) {
        alert("Primero crea una rutina para poder asignársela a un cliente.");
        return;
    }

    var modal = document.getElementById('assignRoutineModal');
    document.getElementById('assignRoutineClientName').textContent = client.name;
    document.getElementById('assignRoutineClientId').value = client.id;

    var select = document.getElementById('assignRoutineSelect');
    select.innerHTML = '';

    rutinas.forEach(function (r) {
        var opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name + ' (' + (r.ejercicios ? r.ejercicios.length : 0) + ' ejercicios) - ' + (r.dias || 'General');
        if (r.assignedToClientId === client.id) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });

    modal.classList.remove('hidden');
}

function closeAssignRoutineModal() {
    document.getElementById('assignRoutineModal').classList.add('hidden');
}

async function handleSaveAssignRoutine(e) {
    e.preventDefault();
    var clientId = document.getElementById('assignRoutineClientId').value;
    var rutinaId = document.getElementById('assignRoutineSelect').value;

    if (!clientId || !rutinaId) {
        alert("Selecciona una rutina.");
        return;
    }

    try {
        await RoutinesAPI.assign(rutinaId, clientId);
        await refreshAllData();
        alert("Rutina asignada exitosamente.");
        closeAssignRoutineModal();
        renderCoachDashboard();
    } catch (err) {
        alert("Error al asignar rutina: " + err.message);
    }
}

// ==========================================
// MODAL: VER HISTORIAL Y PROGRESO DEL ALUMNO
// ==========================================

/**
 * MODAL: VER HISTORIAL Y PROGRESO DEL ALUMNO (COACH)
 * Muestra cada sesión con su duración total, tiempo efectivo,
 * y el desglose serie por serie.
 */
function openClientProgressModal(clientId) {
    var client = getUserById(clientId);
    if (!client) return;

    document.getElementById('progressClientName').textContent = client.name;
    document.getElementById('progressClientEmail').textContent = client.email;

    var sesiones = getSesionesByClientId(clientId);
    var container = document.getElementById('progressClientSessionsList');
    container.innerHTML = '';

    if (sesiones.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding: 15px;">Este alumno aún no ha completado ninguna sesión de entrenamiento.</p>';
    } else {
        // Orden descendente: las más recientes primero
        var reversedSesiones = sesiones.slice().reverse();

        // ============================================
        // BANNER DE TOTALES ACUMULADOS DEL ALUMNO
        // ============================================
        var totalSesiones = sesiones.length;
        var totalSegConDescansos = sesiones.reduce(function (acc, s) {
            return acc + (s.duracionTotalSeg || 0);
        }, 0);
        var totalSegEfectivos = sesiones.reduce(function (acc, s) {
            return acc + (s.duracionEfectivaSeg || s.duracionTotalSeg || 0);
        }, 0);
        var totalSeries = 0;
        sesiones.forEach(function (s) {
            if (s.detalles) {
                totalSeries += s.detalles.filter(function (d) { return d.completada; }).length;
            }
        });

        var totalsBanner = document.createElement('div');
        totalsBanner.className = 'coach-progress-totals-banner';
        totalsBanner.innerHTML =
            '<div class="coach-total-item">' +
                '<span class="coach-total-value">' + totalSesiones + '</span>' +
                '<span class="coach-total-label">Sesiones</span>' +
            '</div>' +
            '<div class="coach-total-item">' +
                '<span class="coach-total-value">' + totalSeries + '</span>' +
                '<span class="coach-total-label">Series totales</span>' +
            '</div>' +
            '<div class="coach-total-item">' +
                '<span class="coach-total-value">' + formatTime(totalSegConDescansos) + '</span>' +
                '<span class="coach-total-label">Tiempo total</span>' +
            '</div>' +
            '<div class="coach-total-item">' +
                '<span class="coach-total-value">' + formatTime(totalSegEfectivos) + '</span>' +
                '<span class="coach-total-label">Tiempo efectivo</span>' +
            '</div>';
        container.appendChild(totalsBanner);

        var weeklySummaryEl = renderWeeklySummary(sesiones);
        if (weeklySummaryEl) {
            container.appendChild(weeklySummaryEl);
        }

        // ============================================
        // LISTADO DE SESIONES
        // ============================================
        reversedSesiones.forEach(function (s) {
            var card = document.createElement('div');
            card.className = 'progress-session-card';

            var fechaFormat = s.fechaInicio
                ? new Date(s.fechaInicio).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
                : 'Fecha no registrada';

            // Duraciones
            var durTotal = s.duracionTotalSeg || 0;
            var durEfectiva = s.duracionEfectivaSeg || 0;
            if (durEfectiva === 0) durEfectiva = durTotal;
            var durDescanso = Math.max(0, durTotal - durEfectiva);

            // Conteo de series
            var seriesHechas = s.detalles ? s.detalles.filter(function (d) { return d.completada; }).length : 0;
            var seriesSaltadas = s.detalles ? s.detalles.filter(function (d) { return d.saltada; }).length : 0;

            // Tabla de detalles serie por serie
            var detallesHtml = '';
            if (s.detalles && s.detalles.length > 0) {
                detallesHtml = '<div class="progress-details-table"><table><thead><tr>' +
                    '<th>Ejercicio</th><th>Serie</th><th>Peso Real</th><th>Tiempo</th><th>Estado</th>' +
                    '</tr></thead><tbody>';
                s.detalles.forEach(function (d) {
                    var status = d.saltada ? '❌ Saltada' : '✔ Completada';
                    detallesHtml +=
                        '<tr>' +
                            '<td>' + d.ejercicioNombre + '</td>' +
                            '<td>Serie ' + d.serieNum + '</td>' +
                            '<td><strong>' + (d.pesoReal || 0) + ' kg</strong></td>' +
                            '<td>' + formatTime(d.tiempoEjercicioSeg) + '</td>' +
                            '<td>' + status + '</td>' +
                        '</tr>';
                });
                detallesHtml += '</tbody></table></div>';
            }

            card.innerHTML =
                // Cabecera de la sesión
                '<div class="progress-session-header">' +
                    '<div>' +
                        '<h4>' + s.rutinaNombre + '</h4>' +
                        '<span class="session-date">📅 ' + fechaFormat + '</span>' +
                    '</div>' +
                    '<div class="session-pill-time">' +
                        '✔ ' + seriesHechas + ' series' +
                        (seriesSaltadas > 0 ? ' · ❌ ' + seriesSaltadas : '') +
                    '</div>' +
                '</div>' +

                // ─── CHIPS DE DURACIÓN (total / efectiva / descanso) ───
                '<div class="coach-duration-row">' +
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
                    '<div class="duration-chip duration-rest">' +
                        '<span class="duration-chip-icon">💤</span>' +
                        '<div class="duration-chip-text">' +
                            '<span class="duration-chip-label">Descanso</span>' +
                            '<strong class="duration-chip-value">' + formatTime(durDescanso) + '</strong>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                detallesHtml;

            container.appendChild(card);
        });
    }

    document.getElementById('clientProgressModal').classList.remove('hidden');
}

function closeClientProgressModal() {
    document.getElementById('clientProgressModal').classList.add('hidden');
}

function closeClientProgressModal() {
    document.getElementById('clientProgressModal').classList.add('hidden');
}

// ==========================================
// RESUMEN SEMANAL DEL ALUMNO (COACH)
// ==========================================

/**
 * Calcula el resumen semanal agrupando las sesiones por semana ISO.
 * Devuelve un array ordenado de la semana más reciente a la más antigua,
 * con comparación respecto a la semana anterior.
 */
function buildWeeklySummary(sesiones) {
    if (!sesiones || sesiones.length === 0) return [];

    // Agrupar por semana
    var semanasMap = {};

    sesiones.forEach(function (s) {
        var fecha = s.fechaInicio ? new Date(s.fechaInicio) : null;
        if (!fecha || isNaN(fecha.getTime())) return;

        var weekKey = getWeekKey(fecha);

        if (!semanasMap[weekKey]) {
            semanasMap[weekKey] = {
                weekKey: weekKey,
                weekStart: getWeekStart(fecha),
                sesiones: 0,
                series: 0,
                seriesSaltadas: 0,
                segTotal: 0,
                segEfectivo: 0,
                pesoTotal: 0,
                pesoMaximo: 0
            };
        }

        var w = semanasMap[weekKey];
        w.sesiones++;
        w.segTotal += (s.duracionTotalSeg || 0);
        w.segEfectivo += (s.duracionEfectivaSeg || s.duracionTotalSeg || 0);

        if (s.detalles) {
            s.detalles.forEach(function (d) {
                if (d.completada) {
                    w.series++;
                    if (d.pesoReal && d.pesoReal > 0) {
                        w.pesoTotal += d.pesoReal;
                        if (d.pesoReal > w.pesoMaximo) w.pesoMaximo = d.pesoReal;
                    }
                }
                if (d.saltada) w.seriesSaltadas++;
            });
        }
    });

    // Convertir a array y ordenar por fecha descendente
    var semanas = Object.values(semanasMap);
    semanas.sort(function (a, b) { return b.weekStart - a.weekStart; });

    // Calcular comparación con la semana anterior
    for (var i = 0; i < semanas.length; i++) {
        var w = semanas[i];
        var prev = semanas[i + 1]; // la siguiente en el array (semana anterior)

        if (prev) {
            w.diffSesiones = w.sesiones - prev.sesiones;
            w.diffSegEfectivo = w.segEfectivo - prev.segEfectivo;
            w.diffSeries = w.series - prev.series;
        } else {
            w.diffSesiones = null; // sin comparación (primera semana registrada)
            w.diffSegEfectivo = null;
            w.diffSeries = null;
        }
    }

    // Devolver solo las últimas 4 semanas para no saturar el modal
    return semanas.slice(0, 4);
}

/**
 * Devuelve el lunes (00:00) de la semana a la que pertenece `fecha`.
 */
function getWeekStart(fecha) {
    var d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    var day = d.getDay(); // 0=dom, 1=lun, ..., 6=sab
    var diff = (day === 0 ? -6 : 1 - day); // si es domingo, restar 6 días
    d.setDate(d.getDate() + diff);
    return d.getTime();
}

/**
 * Devuelve una clave única de semana, ej: "2026-W38".
 */
function getWeekKey(fecha) {
    var d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    // ISO week: jueves de la semana
    var target = new Date(d);
    var dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var year = target.getFullYear();
    var firstThursday = new Date(year, 0, 4);
    var firstDayNr = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);
    var weekNum = 1 + Math.round((target - firstThursday) / (7 * 24 * 3600 * 1000));
    return year + '-W' + (weekNum < 10 ? '0' + weekNum : weekNum);
}

/**
 * Renderiza el bloque HTML del resumen semanal.
 */
function renderWeeklySummary(sesiones) {
    var semanas = buildWeeklySummary(sesiones);
    if (semanas.length === 0) return null;

    var wrapper = document.createElement('div');
    wrapper.className = 'weekly-summary-container';

    var header = document.createElement('div');
    header.className = 'weekly-summary-header';
    header.innerHTML =
        '<h4>📊 Resumen semanal</h4>' +
        '<span class="text-muted" style="font-size: 0.8rem;">Últimas ' + semanas.length + ' semana' + (semanas.length > 1 ? 's' : '') + '</span>';
    wrapper.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'weekly-cards-grid';

    semanas.forEach(function (w, idx) {
        var card = document.createElement('div');
        card.className = 'weekly-card' + (idx === 0 ? ' weekly-card-current' : '');

        var rangoTexto = formatWeekRange(w.weekStart);
        var esSemanaActual = idx === 0;

        // Diferencias vs semana anterior
        var diffSesionesHtml = renderDiffBadge(w.diffSesiones);
        var diffEfectivoHtml = renderDiffBadge(w.diffSegEfectivo, true);
        var diffSeriesHtml = renderDiffBadge(w.diffSeries);

        card.innerHTML =
            '<div class="weekly-card-header">' +
                '<div>' +
                    '<span class="weekly-card-badge">' +
                        (esSemanaActual ? '📍 Esta semana' : 'Semana') +
                    '</span>' +
                    '<div class="weekly-card-range">' + rangoTexto + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="weekly-metrics">' +
                '<div class="weekly-metric">' +
                    '<span class="weekly-metric-value">' + w.sesiones + '</span>' +
                    '<span class="weekly-metric-label">Sesiones</span>' +
                    diffSesionesHtml +
                '</div>' +
                '<div class="weekly-metric">' +
                    '<span class="weekly-metric-value">' + w.series + '</span>' +
                    '<span class="weekly-metric-label">Series</span>' +
                    diffSeriesHtml +
                '</div>' +
                '<div class="weekly-metric">' +
                    '<span class="weekly-metric-value">' + formatTime(w.segEfectivo) + '</span>' +
                    '<span class="weekly-metric-label">Efectivo</span>' +
                    diffEfectivoHtml +
                '</div>' +
            '</div>' +

            '<div class="weekly-footer">' +
                '<span>⏱ Total: <strong>' + formatTime(w.segTotal) + '</strong></span>' +
                (w.pesoMaximo > 0 ? '<span>🏋️ Peso máx: <strong>' + w.pesoMaximo + ' kg</strong></span>' : '') +
            '</div>';

        grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    return wrapper;
}

/**
 * Renderiza un badge de diferencia (↑ / ↓ / =) con color correspondiente.
 */
function renderDiffBadge(diff, isTime) {
    if (diff === null || diff === undefined) {
        return '<span class="weekly-diff weekly-diff-neutral">—</span>';
    }
    if (diff === 0) {
        return '<span class="weekly-diff weekly-diff-neutral">= igual</span>';
    }

    var valor;
    if (isTime) {
        valor = formatTime(Math.abs(diff));
    } else {
        valor = Math.abs(diff);
    }

    if (diff > 0) {
        return '<span class="weekly-diff weekly-diff-up">↑ +' + valor + '</span>';
    } else {
        return '<span class="weekly-diff weekly-diff-down">↓ -' + valor + '</span>';
    }
}

/**
 * Formatea el rango de una semana como "12 - 18 oct".
 */
function formatWeekRange(weekStartMs) {
    var start = new Date(weekStartMs);
    var end = new Date(weekStartMs);
    end.setDate(end.getDate() + 6);

    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    var d1 = start.getDate();
    var d2 = end.getDate();
    var m1 = meses[start.getMonth()];
    var m2 = meses[end.getMonth()];

    if (start.getMonth() === end.getMonth()) {
        return d1 + ' - ' + d2 + ' ' + m1;
    }
    return d1 + ' ' + m1 + ' - ' + d2 + ' ' + m2;
}

