/**
 * CHAT DE IA FLOTANTE (aiChat.js)
 * Widget del asistente personal para el cliente.
 */

var aiChatOpen = false;
var aiChatSending = false;
var aiChatWelcomeShown = false;

/**
 * Muestra u oculta el botón flotante según el rol del usuario.
 * Se llama desde renderClientDashboard / renderCoachDashboard.
 */
function initAIChatForUser() {
    var fab = document.getElementById('aiChatFab');
    if (!fab) return;

    // Por ahora solo para clientes
    if (!loggedInUser || loggedInUser.role !== 'client') {
        fab.classList.add('hidden');
        return;
    }

    fab.classList.remove('hidden');

    var titleEl = document.getElementById('aiChatTitle');
    var subtitleEl = document.getElementById('aiChatSubtitle');
    if (titleEl) titleEl.textContent = 'GymBot';
    if (subtitleEl) subtitleEl.textContent = 'Tu asistente de entrenamiento';
}

function toggleAIChat() {
    var panel = document.getElementById('aiChatPanel');
    var fab = document.getElementById('aiChatFab');
    if (!panel) return;

    aiChatOpen = !aiChatOpen;

    if (aiChatOpen) {
        panel.classList.remove('hidden');
        if (fab) fab.style.display = 'none';
        loadAIChatHistory();
        setTimeout(function () {
            var input = document.getElementById('aiChatInput');
            if (input) input.focus();
        }, 100);
    } else {
        panel.classList.add('hidden');
        if (fab) fab.style.display = 'flex';
    }
}

async function loadAIChatHistory() {
    if (!loggedInUser) return;
    var container = document.getElementById('aiChatMessages');
    if (!container) return;

    try {
        var history = await AIAPI.getHistory(loggedInUser.id);
        container.innerHTML = '';

        if (!history || history.length === 0) {
            renderWelcomeMessage();
        } else {
            history.forEach(function (msg) {
                appendMessageBubble(msg.role, msg.content);
            });
            scrollToBottom();
        }
    } catch (err) {
        console.error('Error cargando historial:', err);
        renderWelcomeMessage();
    }
}

function renderWelcomeMessage() {
    var container = document.getElementById('aiChatMessages');
    if (!container) return;

    var welcome =
        '¡Hola ' + loggedInUser.name + '! 👋 Soy GymBot, tu asistente personal. ' +
        'Puedo explicarte ejercicios de tu rutina, darte consejos de técnica, ' +
        'ayudarte a entender tu progreso y motivarte cuando lo necesites. ' +
        '¿En qué te ayudo hoy?';

    appendMessageBubble('assistant', welcome);
}

function appendMessageBubble(role, content) {
    var container = document.getElementById('aiChatMessages');
    if (!container) return;

    var msg = document.createElement('div');
    msg.className = 'ai-msg ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant');

    var avatarHtml = role === 'assistant'
        ? '<div class="ai-msg-avatar">🤖</div>'
        : '<div class="ai-msg-avatar">' + getDefaultAvatarEmoji(loggedInUser.role) + '</div>';

    msg.innerHTML = avatarHtml + '<div class="ai-msg-bubble"></div>';
    msg.querySelector('.ai-msg-bubble').textContent = content;

    container.appendChild(msg);
    scrollToBottom();
}

function appendTypingIndicator() {
    var container = document.getElementById('aiChatMessages');
    if (!container) return null;

    var el = document.createElement('div');
    el.className = 'ai-msg ai-msg-assistant';
    el.id = 'aiTypingIndicator';
    el.innerHTML =
        '<div class="ai-msg-avatar">🤖</div>' +
        '<div class="ai-typing"><span></span><span></span><span></span></div>';
    container.appendChild(el);
    scrollToBottom();
    return el;
}

function scrollToBottom() {
    var container = document.getElementById('aiChatMessages');
    if (container) container.scrollTop = container.scrollHeight;
}

function handleAIChatKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAIChatMessage();
    }
}

async function sendAIChatMessage() {
    if (aiChatSending || !loggedInUser) return;

    var input = document.getElementById('aiChatInput');
    var sendBtn = document.getElementById('aiChatSendBtn');
    var message = input.value.trim();
    if (!message) return;

    aiChatSending = true;
    input.value = '';
    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    appendMessageBubble('user', message);
    var typing = appendTypingIndicator();

    try {
        var res = await AIAPI.chat(loggedInUser.id, message);
        if (typing) typing.remove();
        appendMessageBubble('assistant', res.reply);
    } catch (err) {
        if (typing) typing.remove();
        appendMessageBubble('assistant', '⚠️ Ups, hubo un error: ' + err.message);
    } finally {
        aiChatSending = false;
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
    }
}

async function clearAIChatHistory() {
    if (!loggedInUser) return;
    if (!confirm('¿Borrar todo el historial de esta conversación?')) return;

    try {
        await AIAPI.clearHistory(loggedInUser.id);
        var container = document.getElementById('aiChatMessages');
        if (container) container.innerHTML = '';
        renderWelcomeMessage();
    } catch (err) {
        alert('Error al borrar: ' + err.message);
    }
}