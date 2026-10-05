/**
 * CONTROLADOR PRINCIPAL DE LA APLICACIÓN (app.js)
 */

var userDataBase = [];
var loggedInUser = null;

var signinSection = null;
var signupSection = null;
var dashboardSection = null;

var clientDashboard = null;
var coachDashboard = null;
var adminDashboard = null;

var signinForm = null;
var signupForm = null;

// ============================================
// INICIALIZACIÓN
// ============================================
window.addEventListener('DOMContentLoaded', async function () {
    signinSection = document.getElementById('signinSection');
    signupSection = document.getElementById('signupSection');
    dashboardSection = document.getElementById('dashboardSection');

    clientDashboard = document.getElementById('clientDashboard');
    coachDashboard = document.getElementById('coachDashboard');
    adminDashboard = document.getElementById('adminDashboard');

    signinForm = document.getElementById('signinForm');
    signupForm = document.getElementById('signupForm');

    if (signinForm) signinForm.addEventListener('submit', signin);
    if (signupForm) signupForm.addEventListener('submit', signup);

    var clientLogoutBtn = document.getElementById('clientLogoutBtn');
    var instructorLogoutBtn = document.getElementById('instructorLogoutBtn');
    var adminLogoutBtn = document.getElementById('adminLogoutBtn');

    if (clientLogoutBtn) clientLogoutBtn.addEventListener('click', logout);
    if (instructorLogoutBtn) instructorLogoutBtn.addEventListener('click', logout);
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout);

    // ============================================
    // RESTAURAR SESIÓN SOLO SI HAY TOKEN
    // ============================================
    if (getToken()) {
        try {
            var me = await AuthAPI.me();
            loggedInUser = me.user;
            await refreshAllData();
            goToScreen('dashboardSection');
            if (loggedInUser.role === 'admin') renderAdminDashboard();
            else if (loggedInUser.role === 'coach') renderCoachDashboard();
            else if (loggedInUser.role === 'client') renderClientDashboard();

            scheduleSessionExpiration();

            return;
        } catch (err) {
            // Token inválido o expirado: limpiar y seguir al login
            clearToken();
            loggedInUser = null;
        }
    }

    // SIN token, solo mostrar el login (NO cargar datos)
    goToScreen('signinSection');
});

// ============================================
// REGISTRO (SOLO CLIENT)
// ============================================
async function signup(e) {
    e.preventDefault();

    var name = document.getElementById('signupName').value.trim();
    var email = document.getElementById('signupEmail').value.trim().toLowerCase();
    var password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        alert("Por favor completa todos los campos.");
        return;
    }

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    try {
        await AuthAPI.register(name, email, password);
        await refreshAllData();

        alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
        signupForm.reset();
        goToScreen('signinSection');
    } catch (err) {
        alert("Error al registrar: " + err.message);
    }
}

// ============================================
// LOGIN
// ============================================
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

        setToken(res.token);
        loggedInUser = res.user;

        await refreshAllData();
        goToScreen('dashboardSection');

        if (loggedInUser.role === 'admin') renderAdminDashboard();
        else if (loggedInUser.role === 'coach') renderCoachDashboard();
        else if (loggedInUser.role === 'client') renderClientDashboard();


        scheduleSessionExpiration();
    } catch (err) {
        alert("Error al iniciar sesión: " + err.message);
    }
}

// ============================================
// LOGOUT
// ============================================
async function logout() {
    // Cancelar el timer antes de hacer logout
    clearSessionTimers();
    window.__sessionExpiredHandled = false;

    try {
        await AuthAPI.logout();
    } catch (err) {
        console.warn('No se pudo registrar el logout:', err.message);
    }

    clearToken();
    loggedInUser = null;

    var fab = document.getElementById('aiChatFab');
    var panel = document.getElementById('aiChatPanel');
    if (fab) { fab.classList.add('hidden'); fab.style.display = ''; }
    if (panel) panel.classList.add('hidden');
    aiChatOpen = false;

    var bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.classList.add('hidden');

    goToScreen('signinSection');
}

function fillDemoCredentials(email, pass) {
    var emailInput = document.getElementById('signinEmail');
    var passInput = document.getElementById('signinPassword');
    if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = pass;
    }
}

// ============================================
// NAVEGACIÓN
// ============================================
function goToScreen(screenId) {
    document.querySelectorAll('.section').forEach(function (section) {
        section.classList.add('hidden');
    });

    var workoutModeContainer = document.getElementById('workoutModeContainer');
    if (workoutModeContainer) workoutModeContainer.classList.add('hidden');

    var dashboards = {
        admin: adminDashboard,
        coach: coachDashboard,
        client: clientDashboard
    };

    Object.values(dashboards).forEach(function (d) {
        if (d) d.classList.add('hidden');
    });

    if (screenId === 'dashboardSection') {
        if (loggedInUser && dashboards[loggedInUser.role]) {
            dashboards[loggedInUser.role].classList.remove('hidden');
        }
        var dash = document.getElementById('dashboardSection');
        if (dash) dash.classList.remove('hidden');

        renderBottomNav();
    } else {
        var target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');

        var bottomNav = document.getElementById('bottomNav');
        if (bottomNav) bottomNav.classList.add('hidden');
    }

    if (screenId === 'dashboardSection') {
        updateHeaderAvatar();
    }
}

// ============================================
// AVATAR
// ============================================
var avatarPendingBase64 = undefined;

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

function renderAvatarIntoElement(el, avatarUrl, role) {
    el.innerHTML = '';

    if (avatarUrl && avatarUrl.trim() !== '') {
        el.classList.add('has-image');
        var img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = 'Avatar';
        img.onerror = function () {
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

function openAvatarModal() {
    if (!loggedInUser) return;

    avatarPendingBase64 = undefined;

    var modal = document.getElementById('avatarModal');
    var previewImg = document.getElementById('avatarPreviewImg');
    var placeholder = document.getElementById('avatarPreviewPlaceholder');
    var removeBtn = document.getElementById('avatarRemoveBtn');
    var saveBtn = document.getElementById('avatarSaveBtn');

    var fileInput = document.getElementById('avatarFileInput');
    if (fileInput) fileInput.value = '';

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

function handleAvatarFileChange(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        event.target.value = '';
        return;
    }

    var MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        alert('La imagen es muy grande. El máximo permitido es 2 MB.');
        event.target.value = '';
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var base64 = e.target.result;

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

function resizeImage(base64, maxW, maxH, callback) {
    var img = new Image();
    img.onload = function () {
        var w = img.width;
        var h = img.height;

        if (w > maxW || h > maxH) {
            var ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        callback(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function () {
        callback(base64);
    };
    img.src = base64;
}

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

async function handleSaveAvatar() {
    if (avatarPendingBase64 === undefined) {
        closeAvatarModal();
        return;
    }

    var saveBtn = document.getElementById('avatarSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Guardando...';

    try {
        await updateUserAvatar(loggedInUser.id, avatarPendingBase64);

        loggedInUser.avatar = avatarPendingBase64;
        updateHeaderAvatar();
        await refreshAllData();

        if (loggedInUser.role === 'admin' && typeof renderAdminUsersList === 'function') {
            renderAdminUsersList();
        }
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

// ============================================
// MENÚ MÓVIL
// ============================================
function toggleMobileMenu(event, menuId) {
    if (event) event.stopPropagation();

    var menu = document.getElementById(menuId);
    if (!menu) return;

    document.querySelectorAll('.mobile-header-actions.open').forEach(function (m) {
        if (m.id !== menuId) m.classList.remove('open');
    });

    menu.classList.toggle('open');
}

function closeMobileMenu(menuId) {
    var menu = document.getElementById(menuId);
    if (menu) menu.classList.remove('open');
}

document.addEventListener('click', function (event) {
    if (!event.target.closest('.mobile-menu-toggle') && !event.target.closest('.mobile-header-actions')) {
        document.querySelectorAll('.mobile-header-actions.open').forEach(function (m) {
            m.classList.remove('open');
        });
    }
});

function handleLogout() {
    document.querySelectorAll('.mobile-header-actions.open').forEach(function (m) {
        m.classList.remove('open');
    });
    logout();
}

// ============================================
// BOTTOM NAV
// ============================================
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

        btn.innerHTML =
            '<span class="bottom-nav-item-icon">' + getNavIcon(item.icon) + '</span>' +
            '<span class="bottom-nav-item-label">' + item.label + '</span>';

        itemsContainer.appendChild(btn);
    });

    nav.classList.remove('hidden');
}

function getNavIcon(name) {
    return '<img src="icons/' + name + '.svg" alt="" class="nav-icon-img">';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToElement(id) {
    var el = document.getElementById(id);
    if (!el) {
        el = document.querySelector('.' + id);
    }
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// ==========================================
// EXPIRACIÓN AUTOMÁTICA DE SESIÓN
// ==========================================

var sessionExpirationTimer = null;      // setTimeout programado
var sessionCheckInterval = null;        // setInterval de verificación
var SESSION_CHECK_EVERY_MS = 1000;      // verificar cada 1 segundo

/**
 * Programa la expiración automática de la sesión.
 * Se llama justo después de un login exitoso o de restaurar la sesión.
 */
function scheduleSessionExpiration() {
    // Limpiar cualquier timer anterior
    clearSessionTimers();

    if (!loggedInUser || !getToken()) return;

    const remaining = getTokenRemainingMs();

    if (remaining <= 0) {
        // El token ya expiró
        handleSessionExpired();
        return;
    }

    console.log(`⏱️ Sesión expirará en ${Math.round(remaining / 1000)} segundos`);

    // Programar el alert + recarga exactamente cuando expire
    sessionExpirationTimer = setTimeout(function () {
        console.log('⏱️ Token expirado (timer programado)');
        handleSessionExpired();
    }, remaining);

    // Verificación periódica (por si el reloj del cliente se desfasa)
    sessionCheckInterval = setInterval(function () {
        const rem = getTokenRemainingMs();
        if (rem <= 0) {
            console.log('⏱️ Token expirado (verificación periódica)');
            handleSessionExpired();
        }
    }, SESSION_CHECK_EVERY_MS);
}

/**
 * Cancela todos los timers de sesión.
 * Se llama al hacer logout manual o al limpiar la sesión.
 */
function clearSessionTimers() {
    if (sessionExpirationTimer) {
        clearTimeout(sessionExpirationTimer);
        sessionExpirationTimer = null;
    }
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
    }
}

/**
 * Maneja la expiración de la sesión:
 * 1. Detiene los timers.
 * 2. Muestra un alert.
 * 3. Limpia el token y el usuario.
 * 4. Recarga la página automáticamente.
 */
function handleSessionExpired() {
    // Evitar ejecución doble (por si ambos timers se disparan)
    if (window.__sessionExpiredHandled) return;
    window.__sessionExpiredHandled = true;

    clearSessionTimers();

    // Mostrar el alert (bloquea hasta que el usuario lo cierre)
    alert('⏱️ Tu sesión ha expirado por seguridad.\n\nDeberás iniciar sesión nuevamente.');

    // Limpiar token y usuario
    clearToken();
    loggedInUser = null;

    // Recargar la página para volver al login limpio
    location.reload();
}
