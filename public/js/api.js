const API_BASE = '/api';
const TOKEN_KEY = 'gympro_token';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}



/**
 * Decodifica el payload de un JWT (sin verificar la firma).
 * Solo para leer datos como `exp`, no para validar seguridad.
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

/**
 * Devuelve los milisegundos restantes hasta que el token expire.
 * Devuelve 0 si ya expiró o si no hay token.
 */
function getTokenRemainingMs() {
    const token = getToken();
    if (!token) return 0;

    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return 0;

    const expMs = payload.exp * 1000; // convertir a milisegundos
    const now = Date.now();
    const remaining = expMs - now;

    return remaining > 0 ? remaining : 0;
}



async function apiFetch(endpoint, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };

    // Enviar JWT si existe
    const token = getToken();
    if (token) {
        config.headers['Authorization'] = 'Bearer ' + token;
    }

    // Fallback: enviar email (para auditoría)
    if (typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.email) {
        config.headers['X-User-Email'] = loggedInUser.email;
    }

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const res = await fetch(API_BASE + endpoint, config);

    // ============================================
    // ✅ Manejo diferenciado de 401
    // ============================================
    // Si es 401 pero es un intento de LOGIN o REGISTRO,
    // es un error de credenciales, NO una sesión expirada.
    const isAuthEndpoint = endpoint.startsWith('/auth/login') ||
                           endpoint.startsWith('/auth/register');

    if (res.status === 401 && !isAuthEndpoint) {
        // Sesión realmente expirada o token inválido
        clearToken();
        if (typeof loggedInUser !== 'undefined') {
            loggedInUser = null;
        }
        if (typeof goToScreen === 'function') {
            goToScreen('signinSection');
        }
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // Para login/register u otros errores, propagar el mensaje del backend
        throw new Error(data.error || `Error HTTP ${res.status}`);
    }
    return data;
}

// ============================================
// AUTH
// ============================================
const AuthAPI = {
    login: (email, password) =>
        apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
    register: (name, email, password) =>
        apiFetch('/auth/register', { method: 'POST', body: { name, email, password } }),
    me: () => apiFetch('/auth/me'),
    logout: () => apiFetch('/auth/logout', { method: 'POST' })
};

// ============================================
// USERS
// ============================================
const UsersAPI = {
    getAll: (role) => apiFetch('/users' + (role ? `?role=${role}` : '')),
    getById: (id) => apiFetch(`/users/${id}`),
    create: (user) => apiFetch('/users', { method: 'POST', body: user }),
    update: (id, user) => apiFetch(`/users/${id}`, { method: 'PUT', body: user }),
    updateAvatar: (id, avatar) =>
        apiFetch(`/users/${id}/avatar`, { method: 'PUT', body: { avatar: avatar } }),
    delete: (id) => apiFetch(`/users/${id}`, { method: 'DELETE' })
};

// ============================================
// EXERCISES
// ============================================
const ExercisesAPI = {
    getAll: () => apiFetch('/exercises'),
    getById: (id) => apiFetch(`/exercises/${id}`),
    create: (ex) => apiFetch('/exercises', { method: 'POST', body: ex })
};

// ============================================
// ROUTINES
// ============================================
const RoutinesAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.coachId) params.set('coachId', filters.coachId);
        if (filters.clientId) params.set('clientId', filters.clientId);
        const qs = params.toString();
        return apiFetch('/routines' + (qs ? `?${qs}` : ''));
    },
    getById: (id) => apiFetch(`/routines/${id}`),
    save: (rutina) => apiFetch('/routines', { method: 'POST', body: rutina }),
    assign: (rutinaId, clientId) =>
        apiFetch(`/routines/${rutinaId}/assign`, { method: 'PUT', body: { clientId } }),
    delete: (id) => apiFetch(`/routines/${id}`, { method: 'DELETE' })
};

// ============================================
// SESSIONS
// ============================================
const SessionsAPI = {
    getAll: () => apiFetch('/sessions'),
    getByClient: (clientId) => apiFetch(`/sessions/client/${clientId}`),
    save: (sesion) => apiFetch('/sessions', { method: 'POST', body: sesion })
};

// ============================================
// AI CHAT
// ============================================
const AIAPI = {
    chat: (userId, message) =>
        apiFetch('/ai/chat', {
            method: 'POST',
            body: { message }
        }),
    getHistory: (userId) => apiFetch(`/ai/history/${userId}`),
    clearHistory: (userId) => apiFetch(`/ai/history/${userId}`, { method: 'DELETE' })
};
