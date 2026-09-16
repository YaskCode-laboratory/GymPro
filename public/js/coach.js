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

        var card = document.createElement('div');
        card.className = 'coach-client-card';
        card.innerHTML =
            '<div class="client-avatar">👤</div>' +
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
    document.getElementById('modalRoutineDays').value = 'Lunes, Miércoles, Viernes';
    document.getElementById('modalRoutineDesc').value = '';

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
    document.getElementById('modalRoutineDays').value = rutina.dias || '';
    document.getElementById('modalRoutineDesc').value = rutina.description || '';

    // Clonar lista de ejercicios
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
    var tbody = document.getElementById('builderExercisesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (builderExercisesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 12px;" class="text-muted">Aún no has agregado ejercicios a esta rutina.</td></tr>';
        return;
    }

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
        var reversedSesiones = sesiones.slice().reverse();

        reversedSesiones.forEach(function (s) {
            var card = document.createElement('div');
            card.className = 'progress-session-card';

            var fechaFormat = s.fechaInicio
                ? new Date(s.fechaInicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Fecha no registrada';
            var duracionMin = Math.round((s.duracionTotalSeg || 0) / 60);

            var detallesHtml = '';
            if (s.detalles && s.detalles.length > 0) {
                detallesHtml = '<div class="progress-details-table"><table><thead><tr><th>Ejercicio</th><th>Serie</th><th>Peso Real</th><th>Tiempo</th><th>Estado</th></tr></thead><tbody>';
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
                '<div class="progress-session-header">' +
                    '<div>' +
                        '<h4>' + s.rutinaNombre + '</h4>' +
                        '<span class="session-date">📅 ' + fechaFormat + '</span>' +
                    '</div>' +
                    '<div class="session-duration">⏱ ' + duracionMin + ' minutos (' + formatTime(s.duracionTotalSeg) + ')</div>' +
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