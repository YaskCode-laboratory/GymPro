/**
 * CONTROLADOR PRINCIPAL DE LA APLICACIÓN (app.js)
 * 
 * Gestiona:
 * 1. Inicialización de datos (desde el backend Express + SQLite).
 * 2. Autenticación (Registro e Inicio de sesión) para los 3 roles.
 * 3. Navegación entre vistas (SPA) y cierre de sesión.
 * 4. Orquestación hacia los paneles específicos de Administrador, Instructor y Cliente.
 */

// 1. Base de datos y usuario conectado
var userDataBase = [];
var loggedInUser = null;

// 2. Referencias a elementos de la interfaz (se asignan en DOMContentLoaded)
var signinSection = null;
var signupSection = null;
var dashboardSection = null;

var clientDashboard = null;
var coachDashboard = null;
var adminDashboard = null;

var signinForm = null;
var signupForm = null;

// 3. Inicialización al cargar el DOM
window.addEventListener('DOMContentLoaded', async function () {
    // Asignar referencias
    signinSection = document.getElementById('signinSection');
    signupSection = document.getElementById('signupSection');
    dashboardSection = document.getElementById('dashboardSection');

    clientDashboard = document.getElementById('clientDashboard');
    coachDashboard = document.getElementById('coachDashboard');
    adminDashboard = document.getElementById('adminDashboard');

    signinForm = document.getElementById('signinForm');
    signupForm = document.getElementById('signupForm');

    // Asignar eventos a los formularios
    if (signinForm) signinForm.addEventListener('submit', signin);
    if (signupForm) signupForm.addEventListener('submit', signup);

    // Botones de cierre de sesión
    var clientLogoutBtn = document.getElementById('clientLogoutBtn');
    var instructorLogoutBtn = document.getElementById('instructorLogoutBtn');
    var adminLogoutBtn = document.getElementById('adminLogoutBtn');

    if (clientLogoutBtn) clientLogoutBtn.addEventListener('click', logout);
    if (instructorLogoutBtn) instructorLogoutBtn.addEventListener('click', logout);
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout);

    // Cargar datos iniciales desde el backend
    var ok = await refreshAllData();
    if (!ok) {
        console.warn('⚠️ No se pudieron cargar los datos del servidor.');
    }

    // Arrancar en la pantalla de inicio de sesión
    goToScreen('signinSection');
});

/**
 * Registro de un nuevo usuario
 */
async function signup(e) {
    e.preventDefault();

    var name = document.getElementById('signupName').value.trim();
    var email = document.getElementById('signupEmail').value.trim().toLowerCase();
    var password = document.getElementById('signupPassword').value;
    var role = document.getElementById('signupRole').value;

    if (!name || !email || !password) {
        alert("Por favor completa todos los campos.");
        return;
    }

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    try {
        await AuthAPI.register(name, email, password, role);
        await refreshAllData();

        alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión con tus credenciales.");
        signupForm.reset();
        goToScreen('signinSection');
    } catch (err) {
        alert("Error al registrar: " + err.message);
    }
}

/**
 * Inicio de sesión de usuarios existentes
 */
async function signin(e) {
    e.preventDefault();

    var email = document.getElementById('signinEmail').value.trim().toLowerCase();
    var password = document.getElementById('signinPassword').value;

    if (!email || !password) {
        alert("Por favor ingresa tu correo y contraseña.");
        return;
    }

    try {
        var res = await AuthAPI.login(email, password);
        loggedInUser = res.user;

        // Sincronizar la caché con el servidor
        await refreshAllData();

        // Redirigir al dashboard correspondiente
        goToScreen('dashboardSection');

        if (loggedInUser.role === 'admin') {
            renderAdminDashboard();
        } else if (loggedInUser.role === 'coach') {
            renderCoachDashboard();
        } else if (loggedInUser.role === 'client') {
            renderClientDashboard();
        }
    } catch (err) {
        alert("Error al iniciar sesión: " + err.message);
    }
}

/**
 * Cerrar sesión y volver a la pantalla de login
 */
async function logout() {
    if (loggedInUser && loggedInUser.email) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Email': loggedInUser.email
                },
                body: JSON.stringify({ userEmail: loggedInUser.email })
            });
        } catch (err) {
            console.warn('No se pudo registrar el logout:', err.message);
        }
    }

    loggedInUser = null;

    // Ocultar chat
    var fab = document.getElementById('aiChatFab');
    var panel = document.getElementById('aiChatPanel');
    if (fab) {
        fab.classList.add('hidden');
        fab.style.display = '';
    }
    if (panel) panel.classList.add('hidden');
    aiChatOpen = false;

    // Ocultar bottom nav
    var bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.classList.add('hidden');

    goToScreen('signinSection');
}

/**
 * Función auxiliar para autocompletar credenciales de prueba
 */
function fillDemoCredentials(email, pass) {
    var emailInput = document.getElementById('signinEmail');
    var passInput = document.getElementById('signinPassword');
    if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = pass;
    }
}

/**
 * Navegación entre pantallas principales (SPA)
 */
function goToScreen(screenId) {
    // Ocultar todas las secciones principales
    document.querySelectorAll('.section').forEach(function (section) {
        section.classList.add('hidden');
    });

    // Ocultar contenedor del modo entrenamiento si estuviese activo
    var workoutModeContainer = document.getElementById('workoutModeContainer');
    if (workoutModeContainer) workoutModeContainer.classList.add('hidden');

    var dashboards = {
        admin: adminDashboard,
        coach: coachDashboard,
        client: clientDashboard
    };

    // Ocultar todos los dashboards
    Object.values(dashboards).forEach(function (d) {
        if (d) d.classList.add('hidden');
    });

    if (screenId === 'dashboardSection') {
        if (loggedInUser && dashboards[loggedInUser.role]) {
            dashboards[loggedInUser.role].classList.remove('hidden');
        }
        var dash = document.getElementById('dashboardSection');
        if (dash) dash.classList.remove('hidden');

        // Renderizar bottom nav si es móvil
        renderBottomNav();
    } else {
        var target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');

        // Ocultar bottom nav en pantallas de auth
        var bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.classList.add('hidden');
    }

    // NUEVO: actualizar el avatar del header cuando entramos al dashboard
    if (screenId === 'dashboardSection') {
        updateHeaderAvatar();
    }
}

// ==========================================
// GESTIÓN DE FOTO DE PERFIL (AVATAR)
// ==========================================

// Estado temporal del modal
var avatarPendingBase64 = undefined; // undefined = no se ha tocado, null = borrar, string = nueva imagen

/**
 * Actualiza el avatar visual del header según el rol del usuario logueado.
 * Se debe llamar cada vez que se renderiza un dashboard.
 */
function updateHeaderAvatar() {
    if (!loggedInUser) return;

    var displayId;
    if (loggedInUser.role === 'client') displayId = 'clientAvatarDisplay';
    else if (loggedInUser.role === 'coach') displayId = 'coachAvatarDisplay';
    else if (loggedInUser.role === 'admin') displayId = 'adminAvatarDisplay';
    else return;

    var el = document.getElementById(displayId);
    if (!el) return;

    renderAvatarIntoElement(el, loggedInUser.avatar, loggedInUser.role);
}

/**
 * Renderiza el avatar (imagen o emoji por defecto) dentro de un elemento.
 */
function renderAvatarIntoElement(el, avatarUrl, role) {
    el.innerHTML = '';

    if (avatarUrl && avatarUrl.trim() !== '') {
        el.classList.add('has-image');
        var img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = 'Avatar';
        img.onerror = function () {
            // Si la imagen falla, mostrar el emoji por defecto
            el.classList.remove('has-image');
            el.textContent = getDefaultAvatarEmoji(role);
        };
        el.appendChild(img);
    } else {
        el.classList.remove('has-image');
        el.textContent = getDefaultAvatarEmoji(role);
    }
}

function getDefaultAvatarEmoji(role) {
    if (role === 'admin') return '👑';
    if (role === 'coach') return '💪';
    return '🏃';
}

/**
 * Abre el modal de cambio de avatar
 */
function openAvatarModal() {
    if (!loggedInUser) return;

    avatarPendingBase64 = undefined;

    var modal = document.getElementById('avatarModal');
    var previewImg = document.getElementById('avatarPreviewImg');
    var placeholder = document.getElementById('avatarPreviewPlaceholder');
    var removeBtn = document.getElementById('avatarRemoveBtn');
    var saveBtn = document.getElementById('avatarSaveBtn');

    // Reset del file input
    var fileInput = document.getElementById('avatarFileInput');
    if (fileInput) fileInput.value = '';

    // Preview con avatar actual
    if (loggedInUser.avatar) {
        previewImg.src = loggedInUser.avatar;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'inline-flex';
    } else {
        previewImg.style.display = 'none';
        placeholder.style.display = 'flex';
        placeholder.textContent = getDefaultAvatarEmoji(loggedInUser.role);
        removeBtn.style.display = 'none';
    }

    saveBtn.disabled = true;

    modal.classList.remove('hidden');
}

function closeAvatarModal() {
    document.getElementById('avatarModal').classList.add('hidden');
    avatarPendingBase64 = undefined;
}

/**
 * Maneja la selección de un archivo de imagen y la convierte a Base64
 */
function handleAvatarFileChange(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        event.target.value = '';
        return;
    }

    // Validar tamaño (2 MB máximo)
    var MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        alert('La imagen es muy grande. El máximo permitido es 2 MB.');
        event.target.value = '';
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var base64 = e.target.result;

        // Redimensionar si es muy grande (para no saturar la BD)
        resizeImage(base64, 400, 400, function (resizedBase64) {
            avatarPendingBase64 = resizedBase64;

            var previewImg = document.getElementById('avatarPreviewImg');
            var placeholder = document.getElementById('avatarPreviewPlaceholder');
            previewImg.src = resizedBase64;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';

            document.getElementById('avatarRemoveBtn').style.display = 'inline-flex';
            document.getElementById('avatarSaveBtn').disabled = false;
        });
    };
    reader.onerror = function () {
        alert('Error al leer la imagen.');
    };
    reader.readAsDataURL(file);
}

/**
 * Redimensiona una imagen Base64 a un máximo de maxW x maxH, manteniendo aspecto.
 * Devuelve Base64 en formato JPEG calidad 0.85.
 */
function resizeImage(base64, maxW, maxH, callback) {
    var img = new Image();
    img.onload = function () {
        var w = img.width;
        var h = img.height;

        // Calcular nuevas dimensiones manteniendo aspecto
        if (w > maxW || h > maxH) {
            var ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');

        // Fondo blanco por si la imagen tiene transparencia
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        callback(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function () {
        callback(base64); // fallback
    };
    img.src = base64;
}

/**
 * Elimina la foto actual (marca el avatar como null al guardar)
 */
function handleRemoveAvatar() {
    if (!loggedInUser.avatar) return;

    if (!confirm('¿Quitar tu foto de perfil actual?')) return;

    avatarPendingBase64 = null;

    var previewImg = document.getElementById('avatarPreviewImg');
    var placeholder = document.getElementById('avatarPreviewPlaceholder');
    previewImg.style.display = 'none';
    placeholder.style.display = 'flex';
    placeholder.textContent = getDefaultAvatarEmoji(loggedInUser.role);

    document.getElementById('avatarRemoveBtn').style.display = 'none';
    document.getElementById('avatarSaveBtn').disabled = false;
}

/**
 * Guarda el avatar en el backend
 */
async function handleSaveAvatar() {
    if (avatarPendingBase64 === undefined) {
        // No hay cambios
        closeAvatarModal();
        return;
    }

    var saveBtn = document.getElementById('avatarSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Guardando...';

    try {
        await updateUserAvatar(loggedInUser.id, avatarPendingBase64);

        // Actualizar el objeto loggedInUser
        loggedInUser.avatar = avatarPendingBase64;

        // Actualizar el header visual
        updateHeaderAvatar();

        // Refrescar caché global
        await refreshAllData();

        // Si es admin, re-renderizar la tabla para que se vea su nuevo avatar
        if (loggedInUser.role === 'admin' && typeof renderAdminUsersList === 'function') {
            renderAdminUsersList();
        }
        // Si es coach, re-renderizar la lista de clientes por si aparece su avatar
        if (loggedInUser.role === 'coach' && typeof renderCoachClientsList === 'function') {
            renderCoachClientsList();
        }

        alert('¡Foto de perfil actualizada!');
        closeAvatarModal();
    } catch (err) {
        alert('Error al guardar la foto: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Guardar Foto';
    }
}

// ==========================================
// MENÚ MÓVIL (HAMBURGUESA) Y BOTTOM NAV
// ==========================================

/**
 * Abre/cierra el menú desplegable del header en móvil.
 */
function toggleMobileMenu(event, menuId) {
    if (event) event.stopPropagation();

    var menu = document.getElementById(menuId);
    if (!menu) return;

    // Cerrar otros menús abiertos
    document.querySelectorAll('.mobile-header-actions.open').forEach(function (m) {
        if (m.id !== menuId) m.classList.remove('open');
    });

    menu.classList.toggle('open');
}

/**
 * Cierra un menú móvil específico.
 */
function closeMobileMenu(menuId) {
    var menu = document.getElementById(menuId);
    if (menu) menu.classList.remove('open');
}

/**
 * Cierra todos los menús al hacer clic fuera.
 */
document.addEventListener('click', function (event) {
    if (!event.target.closest('.mobile-menu-toggle') && !event.target.closest('.mobile-header-actions')) {
        document.querySelectorAll('.mobile-header-actions.open').forEach(function (m) {
            m.classList.remove('open');
        });
    }
});

/**
 * Manejador universal de logout (usado por los botones del menú móvil).
 */
function handleLogout() {
    // Cerrar cualquier menú abierto
    document.querySelectorAll('.mobile-header-actions.open').forEach(function (m) {
        m.classList.remove('open');
    });
    logout();
}

/** VISTA DESDE EL CELULAR
 * Renderiza el bottom navigation bar según el rol del usuario.
 */
/**
 * Renderiza el bottom navigation bar según el rol del usuario.
 * Usa iconos SVG inline (no emojis) para máxima calidad visual.
 */
function renderBottomNav() {
    var nav = document.getElementById('bottomNav');
    var itemsContainer = document.getElementById('bottomNavItems');
    if (!nav || !itemsContainer) return;

    if (!loggedInUser) {
        nav.classList.add('hidden');
        return;
    }

    var items = [];

    if (loggedInUser.role === 'client') {
        items = [
            { icon: 'home',        label: 'Inicio',    action: "scrollToTop()", active: true },
            { icon: 'dumbbell',    label: 'Entrenar',  action: "scrollToElement('clientWorkoutRoutine')" },
            { icon: 'chart',       label: 'Progreso',  action: "scrollToElement('clientProgressWidget')" },
            { icon: 'robot',       label: 'Asistente', action: "toggleAIChat()" },
            { icon: 'user',        label: 'Perfil',    action: "openAvatarModal()" }
        ];
    } else if (loggedInUser.role === 'coach') {
        items = [
            { icon: 'home',        label: 'Inicio',    action: "scrollToTop()", active: true },
            { icon: 'clipboard',   label: 'Rutinas',   action: "scrollToElement('coachRoutinesList')" },
            { icon: 'users',       label: 'Alumnos',   action: "scrollToElement('coachClientsList')" },
            { icon: 'user',        label: 'Perfil',    action: "openAvatarModal()" }
        ];
    } else if (loggedInUser.role === 'admin') {
        items = [
            { icon: 'home',        label: 'Inicio',    action: "scrollToTop()", active: true },
            { icon: 'users',       label: 'Usuarios',  action: "scrollToElement('adminUsersTableBody')" },
            { icon: 'clipboard',   label: 'Rutinas',   action: "scrollToElement('adminAllRoutinesList')" },
            { icon: 'dumbbell',    label: 'Ejercicios',action: "scrollToElement('adminExercisesCatalogList')" },
            { icon: 'user',        label: 'Perfil',    action: "openAvatarModal()" }
        ];
    }

    itemsContainer.innerHTML = '';
    items.forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bottom-nav-item' + (item.active ? ' active' : '');
        btn.onclick = function () { eval(item.action); };

        // SVG inline + label
        btn.innerHTML =
            '<span class="bottom-nav-item-icon">' + getNavIcon(item.icon) + '</span>' +
            '<span class="bottom-nav-item-label">' + item.label + '</span>';

        itemsContainer.appendChild(btn);
    });

    nav.classList.remove('hidden');
}

/**
 * Devuelve el SVG correspondiente al nombre del icono.
 * Todos usan `currentColor` para heredar el color del padre.
 */
function getNavIcon(name) {
    // Ruta al archivo SVG
    return '<img src="icons/' + name + '.svg" alt="" class="nav-icon-img">';
}

/**
 * Scroll suave al top.
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Scroll suave a un elemento por ID o selector.
 */
function scrollToElement(id) {
    var el = document.getElementById(id);
    if (!el) {
        // Buscar por clase
        el = document.querySelector('.' + id);
    }
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
