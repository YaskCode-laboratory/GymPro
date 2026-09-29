/**
 * API CLIENT (api.js)
 * Capa centralizada de comunicación con el backend Express.
 * Reemplaza todas las operaciones de localStorage por fetch HTTP.
 */

const API_BASE = '/api';

// Helper genérico
async function apiFetch(endpoint, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };

    // Añadir el email del usuario logueado si existe
    if (typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.email) {
        config.headers['X-User-Email'] = loggedInUser.email;
    }

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const res = await fetch(API_BASE + endpoint, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
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
    register: (name, email, password, role) =>
        apiFetch('/auth/register', { method: 'POST', body: { name, email, password, role } })
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
            body: { userId, message }
        }),
    getHistory: (userId) => apiFetch(`/ai/history/${userId}`),
    clearHistory: (userId) => apiFetch(`/ai/history/${userId}`, { method: 'DELETE' })
};
