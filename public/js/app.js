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
function logout() {
    loggedInUser = null;
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
    } else {
        var target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');
    }
}