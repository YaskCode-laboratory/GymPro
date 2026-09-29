/**
 * CONTROLADOR DEL PANEL DE ADMINISTRADOR (admin.js)
 * 
 * Funcionalidades del Administrador:
 * 1. CRUD de usuarios: Crear, listar, editar y eliminar instructores y clientes.
 * 2. Visualización global de todas las rutinas y sus asignaciones.
 * 3. Reportes y métricas básicas (Total clientes, instructores, rutinas y sesiones).
 * 4. Gestión del catálogo global de ejercicios.
 * 
 * NOTA: Todas las operaciones de guardado son ASÍNCRONAS (usan la API REST).
 */

// ==========================================
// RENDERIZADO PRINCIPAL DEL PANEL ADMIN
// ==========================================

function renderAdminDashboard() {
    updateHeaderAvatar();
    updateAdminMetrics();
    renderAdminUsersList();
    renderAdminRoutinesList();
    renderAdminExercisesList();
}

/**
 * Actualiza los contadores de métricas del administrador
 */
function updateAdminMetrics() {
    var users = getAllUsers();
    var clients = users.filter(function (u) { return u.role === 'client'; });
    var coaches = users.filter(function (u) { return u.role === 'coach'; });
    var rutinas = getAllRutinas();
    var sesiones = getAllSesiones();

    var clientCountEl = document.getElementById('adminClientCount');
    var instructorCountEl = document.getElementById('adminInstructorCount');
    var routineCountEl = document.getElementById('adminRoutineCount');
    var sessionCountEl = document.getElementById('adminSessionCount');

    if (clientCountEl) clientCountEl.textContent = clients.length;
    if (instructorCountEl) instructorCountEl.textContent = coaches.length;
    if (routineCountEl) routineCountEl.textContent = rutinas.length;
    if (sessionCountEl) sessionCountEl.textContent = sesiones.length;
}

/**
 * Lista todos los usuarios con opciones de Editar y Eliminar
 */
function renderAdminUsersList(filterRole) {
    if (filterRole === undefined) filterRole = 'all';

    var tableBody = document.getElementById('adminUsersTableBody');
    if (!tableBody) return;

    var users = getAllUsers();
    if (filterRole !== 'all') {
        users = users.filter(function (u) { return u.role === filterRole; });
    }

    tableBody.innerHTML = '';

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 15px;">No hay usuarios registrados con este filtro.</td></tr>';
        return;
    }

    users.forEach(function (user) {
        var tr = document.createElement('tr');
        var roleBadgeClass = user.role === 'admin' ? 'badge-admin' : (user.role === 'coach' ? 'badge-coach' : 'badge-client');
        var roleName = user.role === 'admin' ? 'Administrador' : (user.role === 'coach' ? 'Instructor' : 'Cliente');

        var selfLabel = (loggedInUser && user.id === loggedInUser.id)
            ? '<span class="text-muted" style="font-size: 11px;">(Tú)</span>'
            : '<button type="button" class="btn-sm btn-danger" onclick="confirmDeleteUser(\'' + user.id + '\')">🗑 Eliminar</button>';

        // avatar del usuario en la tabla
        var avatarHtml = user.avatar
            ? '<div class="table-user-avatar"><img src="' + user.avatar + '" alt=""></div>'
            : '<div class="table-user-avatar">' + (user.role === 'admin' ? '👑' : user.role === 'coach' ? '💪' : '🏃') + '</div>';

        tr.innerHTML =
            '<td>' +
                '<div class="table-user-cell">' +
                    avatarHtml +
                    '<strong>' + user.name + '</strong>' +
                '</div>' +
            '</td>' +
            '<td>' + user.email + '</td>' +
            '<td><span class="badge ' + roleBadgeClass + '">' + roleName + '</span></td>' +
            '<td><code>••••••</code></td>' +
            '<td class="action-buttons">' +
                '<button type="button" class="btn-sm btn-outline" onclick="openEditUserModal(\'' + user.id + '\')">✏ Editar</button>' +
                selfLabel +
            '</td>';
        tableBody.appendChild(tr);
    });
}

/**
 * Renderiza la lista global de rutinas creadas y a quién están asignadas
 */
function renderAdminRoutinesList() {
    var container = document.getElementById('adminAllRoutinesList');
    if (!container) return;

    var rutinas = getAllRutinas();
    container.innerHTML = '';

    if (rutinas.length === 0) {
        container.innerHTML = '<p class="text-muted">Aún no se han creado rutinas en el sistema.</p>';
        return;
    }

    rutinas.forEach(function (rutina) {
        var assignedUser = rutina.assignedToClientId ? getUserById(rutina.assignedToClientId) : null;
        var assignedText = assignedUser
            ? 'Asignada a: <strong>' + assignedUser.name + '</strong>'
            : '<span class="text-muted">Sin asignar</span>';

        var numEjercicios = (rutina.ejercicios && rutina.ejercicios.length) ? rutina.ejercicios.length : 0;

        var card = document.createElement('div');
        card.className = 'admin-routine-card';
        card.innerHTML =
            '<div class="routine-card-header">' +
                '<div>' +
                    '<h4>' + rutina.name + '</h4>' +
                    '<span class="routine-coach-label">Creada por: ' + (rutina.coachName || 'Coach') + ' · ' + (rutina.dias || 'Todos los días') + '</span>' +
                '</div>' +
                '<span class="badge badge-info">' + numEjercicios + ' ejercicios</span>' +
            '</div>' +
            '<p class="routine-desc">' + (rutina.description || 'Sin descripción.') + '</p>' +
            '<div class="routine-card-footer">' +
                '<div>' + assignedText + '</div>' +
                '<button type="button" class="btn-sm btn-danger" onclick="confirmDeleteRoutineAdmin(\'' + rutina.id + '\')">Eliminar Rutina</button>' +
            '</div>';
        container.appendChild(card);
    });
}

/**
 * Renderiza el catálogo global de ejercicios
 */
function renderAdminExercisesList() {
    var container = document.getElementById('adminExercisesCatalogList');
    if (!container) return;

    var ejercicios = getAllEjercicios();
    container.innerHTML = '';

    if (ejercicios.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay ejercicios en el catálogo.</p>';
        return;
    }

    ejercicios.forEach(function (ej) {
        var card = document.createElement('div');
        card.className = 'exercise-catalog-card';

        var thumbHtml = ej.mediaUrl
            ? '<img src="' + ej.mediaUrl + '" alt="' + ej.name + '" onerror="this.style.display=\'none\'; this.parentNode.innerHTML=\'<div class=&quot;exercise-thumb-placeholder&quot;>🏋️</div>\';">'
            : '<div class="exercise-thumb-placeholder">🏋️</div>';

        card.innerHTML =
            '<div class="exercise-card-thumb">' + thumbHtml + '</div>' +
            '<div class="exercise-card-info">' +
                '<strong>' + ej.name + '</strong>' +
                '<span class="exercise-group">' + ej.muscleGroup + '</span>' +
                '<span class="badge ' + (ej.type === 'time' ? 'badge-time' : 'badge-reps') + '">' +
                    (ej.type === 'time' ? 'Por Tiempo' : 'Por Repeticiones') +
                '</span>' +
                '<p class="exercise-desc">' + (ej.description || '') + '</p>' +
            '</div>';
        container.appendChild(card);
    });
}

// ==========================================
// MODAL: CREAR Y EDITAR USUARIOS
// ==========================================

function openCreateUserModal() {
    document.getElementById('modalUserTitle').textContent = 'Crear Nuevo Usuario';
    document.getElementById('modalUserId').value = '';
    document.getElementById('modalUserName').value = '';
    document.getElementById('modalUserEmail').value = '';
    document.getElementById('modalUserPassword').value = '';
    document.getElementById('modalUserRole').value = 'client';

    document.getElementById('userFormModal').classList.remove('hidden');
}

function openEditUserModal(userId) {
    var user = getUserById(userId);
    if (!user) return;

    document.getElementById('modalUserTitle').textContent = 'Editar Usuario';
    document.getElementById('modalUserId').value = user.id;
    document.getElementById('modalUserName').value = user.name;
    document.getElementById('modalUserEmail').value = user.email;
    document.getElementById('modalUserPassword').value = '';
    document.getElementById('modalUserRole').value = user.role;

    document.getElementById('userFormModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userFormModal').classList.add('hidden');
}

async function handleSaveUserForm(e) {
    e.preventDefault();

    var id = document.getElementById('modalUserId').value;
    var name = document.getElementById('modalUserName').value.trim();
    var email = document.getElementById('modalUserEmail').value.trim().toLowerCase();
    var password = document.getElementById('modalUserPassword').value;
    var role = document.getElementById('modalUserRole').value;

    if (!name || !email) {
        alert("Por favor completa nombre y correo.");
        return;
    }

    // Validar duplicados localmente
    var existingUser = getUserByEmail(email);
    if (existingUser && existingUser.id !== id) {
        alert("Este correo electrónico ya está registrado por otro usuario.");
        return;
    }

    try {
        if (id) {
            // Modo Edición
            if (!password) {
                // Si no se cambia la contraseña, solo actualizamos nombre/email/rol
                await UsersAPI.update(id, { name: name, email: email, password: '', role: role });
            } else {
                await UsersAPI.update(id, { name: name, email: email, password: password, role: role });
            }
            alert("Usuario actualizado correctamente.");
        } else {
            // Modo Creación
            if (!password) {
                alert("La contraseña es obligatoria para nuevos usuarios.");
                return;
            }
            await UsersAPI.create({ name: name, email: email, password: password, role: role });
            alert("Nuevo usuario registrado correctamente.");
        }

        await refreshAllData();
        closeUserModal();
        renderAdminDashboard();
    } catch (err) {
        alert("Error al guardar usuario: " + err.message);
    }
}

async function confirmDeleteUser(userId) {
    var user = getUserById(userId);
    if (!user) return;

    if (confirm('¿Estás seguro de que deseas eliminar permanentemente a "' + user.name + '" (' + user.email + ')?')) {
        try {
            await deleteUserById(userId);
            await refreshAllData();
            alert("Usuario eliminado con éxito.");
            renderAdminDashboard();
        } catch (err) {
            alert("Error al eliminar: " + err.message);
        }
    }
}

async function confirmDeleteRoutineAdmin(rutinaId) {
    if (confirm("¿Estás seguro de eliminar esta rutina del sistema?")) {
        try {
            await deleteRutinaById(rutinaId);
            await refreshAllData();
            renderAdminDashboard();
        } catch (err) {
            alert("Error al eliminar rutina: " + err.message);
        }
    }
}

// ==========================================
// MODAL: CREAR EJERCICIO GLOBAL
// ==========================================

function openCreateExerciseModal() {
    document.getElementById('modalExName').value = '';
    document.getElementById('modalExMuscleGroup').value = '';
    document.getElementById('modalExType').value = 'reps';
    document.getElementById('modalExDesc').value = '';
    document.getElementById('modalExMedia').value = '';
    document.getElementById('exerciseFormModal').classList.remove('hidden');
}

function closeExerciseModal() {
    document.getElementById('exerciseFormModal').classList.add('hidden');
}

async function handleSaveExerciseForm(e) {
    e.preventDefault();

    var name = document.getElementById('modalExName').value.trim();
    var muscleGroup = document.getElementById('modalExMuscleGroup').value.trim();
    var type = document.getElementById('modalExType').value;
    var desc = document.getElementById('modalExDesc').value.trim();
    var media = document.getElementById('modalExMedia').value.trim();

    if (!name || !muscleGroup) {
        alert("Por favor completa el nombre y grupo muscular.");
        return;
    }

    try {
        var newId = 'ej-' + Date.now();
        await ExercisesAPI.create({
            id: newId,
            name: name,
            muscleGroup: muscleGroup,
            type: type,
            description: desc,
            mediaUrl: media,
            defaultRestSec: 60
        });

        await refreshAllData();
        alert("Ejercicio agregado exitosamente al catálogo.");
        closeExerciseModal();
        renderAdminExercisesList();
    } catch (err) {
        alert("Error al guardar ejercicio: " + err.message);
    }
}
