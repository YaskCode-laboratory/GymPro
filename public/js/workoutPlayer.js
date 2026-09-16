/**
 * CONTROLADOR DEL MODO ENTRENAMIENTO (workoutPlayer.js)
 * 
 * Implementa el reproductor guiado con máquina de estados:
 * [INICIO] -> [EJERCICIO_ACTIVO] <-> [DESCANSO] -> [RESUMEN] -> [FINALIZADO]
 * 
 * Maneja los cronómetros:
 * 1. Cronómetro general de la rutina (ascendente).
 * 2. Cronómetro por ejercicio (ascendente o descendente si es por tiempo).
 * 3. Temporizador de descanso (descendente entre series).
 * 
 * Casos borde soportados:
 * - Persistencia ante cierre/recarga (guarda en localStorage en tiempo real).
 * - Pausar/Reanudar entrenamiento global.
 * - Saltar ejercicio.
 * - Agregar serie extra.
 * - Registrar peso real levantado por serie.
 */

var workoutState = {
    rutina: null,
    estado: 'INICIO', // 'INICIO', 'EJERCICIO_ACTIVO', 'DESCANSO', 'RESUMEN', 'FINALIZADO'
    ejercicioIndex: 0,
    serieActual: 1,
    seriesTotales: 3,
    tiempoGeneralSeg: 0,
    tiempoEjercicioSeg: 0,
    tiempoDescansoRestanteSeg: 0,
    tiempoDescansoTotalConfig: 60,
    tiempoObjetivoRestanteSeg: 0,
    pausado: false,
    intervalId: null,
    detallesRegistrados: [],
    tiemposPorEjercicio: {}, // { ejercicioId: segundosTotales }
    fechaInicio: null,
    esTransicionEjercicio: false // true cuando el descanso actual es "entre ejercicios" (no debe incrementar serieActual al terminar)
};

// ==========================================
// FORMATEO DE TIEMPO (MM:SS)
// ==========================================

function formatTime(segundosTotales) {
    if (isNaN(segundosTotales) || segundosTotales < 0) segundosTotales = 0;
    var minutos = Math.floor(segundosTotales / 60);
    var segundos = Math.floor(segundosTotales % 60);
    var minStr = minutos < 10 ? '0' + minutos : '' + minutos;
    var secStr = segundos < 10 ? '0' + segundos : '' + segundos;
    return minStr + ':' + secStr;
}

// ==========================================
// SONIDO SUTIL CON WEB AUDIO API (Sin librerías externas)
// ==========================================

function playChime(freq = 880, duration = 0.2) {
    try {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // En navegadores que restrinjan audio antes del primer clic, no rompe la app
    }
}

// ==========================================
// INICIO Y CONFIGURACIÓN DEL REPRODUCTOR
// ==========================================

/**
 * Abre la pantalla previa de la rutina seleccionada
 */
function openWorkoutPreview(rutinaId) {
    var rutina = getRutinaById(rutinaId);
    if (!rutina) {
        alert("No se encontró la rutina seleccionada.");
        return;
    }

    workoutState.rutina = rutina;
    workoutState.estado = 'INICIO';
    workoutState.ejercicioIndex = 0;
    workoutState.serieActual = 1;
    workoutState.tiempoGeneralSeg = 0;
    workoutState.tiempoEjercicioSeg = 0;
    workoutState.detallesRegistrados = [];
    workoutState.tiemposPorEjercicio = {};
    workoutState.pausado = false;
    workoutState.esTransicionEjercicio = false;
    workoutState.fechaInicio = new Date().toISOString();

    // Llenar vista previa
    document.getElementById('workoutPreviewTitle').textContent = rutina.name;
    document.getElementById('workoutPreviewDesc').textContent = rutina.description || 'Sin descripción adicional.';
    document.getElementById('workoutPreviewCoach').textContent = rutina.coachName || 'Entrenador';
    document.getElementById('workoutPreviewExerciseCount').textContent = rutina.ejercicios.length;

    // Calcular duración estimada aproximada (ejercicios * series * 2 minutos)
    var totalSeries = rutina.ejercicios.reduce((acc, ej) => acc + (parseInt(ej.series) || 3), 0);
    var minutosEstimados = Math.max(10, Math.round(totalSeries * 2.2));
    document.getElementById('workoutPreviewEstDuration').textContent = minutosEstimados + ' min aprox.';

    // Listar ejercicios en la vista previa
    var listContainer = document.getElementById('workoutPreviewExerciseList');
    listContainer.innerHTML = '';

    rutina.ejercicios.forEach((ej, idx) => {
        var card = document.createElement('div');
        card.className = 'workout-preview-item';
        
        var detalle = ej.tipo === 'time'
            ? `${ej.series} series × ${ej.tiempo_objetivo_seg || 45} seg (Descanso: ${ej.descanso_seg}s)`
            : `${ej.series} series × ${ej.reps} reps @ ${ej.peso_sugerido || 0} kg (Descanso: ${ej.descanso_seg}s)`;

        card.innerHTML = `
            <div class="preview-item-num">${idx + 1}</div>
            <div class="preview-item-info">
                <strong>${ej.nombre}</strong>
                <span>${detalle}</span>
            </div>
            <span class="badge-tipo ${ej.tipo === 'time' ? 'badge-time' : 'badge-reps'}">${ej.tipo === 'time' ? 'Tiempo' : 'Reps'}</span>
        `;
        listContainer.appendChild(card);
    });

    // Mostrar sección de inicio del entrenamiento
    showOnlyWorkoutSection('workoutStartView');
}

/**
 * Comienza el entrenamiento activo desde la vista previa
 */
function startWorkoutExecution() {
    if (!workoutState.rutina || !workoutState.rutina.ejercicios.length) {
        alert("Esta rutina no contiene ejercicios para realizar.");
        return;
    }

    workoutState.estado = 'EJERCICIO_ACTIVO';
    workoutState.ejercicioIndex = 0;
    workoutState.serieActual = 1;
    workoutState.tiempoGeneralSeg = 0;
    workoutState.pausado = false;
    workoutState.esTransicionEjercicio = false;
    workoutState.fechaInicio = new Date().toISOString();

    var currentEj = workoutState.rutina.ejercicios[0];
    workoutState.seriesTotales = parseInt(currentEj.series) || 3;
    workoutState.tiempoEjercicioSeg = 0;

    if (currentEj.tipo === 'time') {
        workoutState.tiempoObjetivoRestanteSeg = parseInt(currentEj.tiempo_objetivo_seg) || 45;
    }

    // Iniciar loop de cronómetros
    startTimersLoop();

    // Renderizar ejercicio actual
    renderCurrentExerciseView();

    // Cambiar a vista activa
    showOnlyWorkoutSection('workoutActiveView');

    // Guardar estado inicial en localStorage
    saveActiveWorkoutStorage(workoutState);
}

// ==========================================
// LOOP DE CRONÓMETROS (1 segundo)
// ==========================================

function startTimersLoop() {
    if (workoutState.intervalId) {
        clearInterval(workoutState.intervalId);
    }

    workoutState.intervalId = setInterval(function() {
        tick();
    }, 1000);
}

function stopTimersLoop() {
    if (workoutState.intervalId) {
        clearInterval(workoutState.intervalId);
        workoutState.intervalId = null;
    }
}

function tick() {
    if (workoutState.pausado) {
        return; // En pausa no avanzan los cronómetros
    }

    // 1. Cronómetro General de Rutina (Siempre ascendente)
    workoutState.tiempoGeneralSeg++;
    updateGeneralTimerDisplay();

    // 2. Cronómetro por estado
    if (workoutState.estado === 'EJERCICIO_ACTIVO') {
        var currentEj = getCurrentExercise();
        if (!currentEj) return;

        workoutState.tiempoEjercicioSeg++;

        if (currentEj.tipo === 'time') {
            // Modo Tiempo: cronómetro descendente hacia 0
            if (workoutState.tiempoObjetivoRestanteSeg > 0) {
                workoutState.tiempoObjetivoRestanteSeg--;
                updateExerciseTimerDisplay(workoutState.tiempoObjetivoRestanteSeg, true);

                if (workoutState.tiempoObjetivoRestanteSeg === 0) {
                    playChime(600, 0.4);
                    // Efecto visual de tiempo alcanzado
                    var timerEl = document.getElementById('workoutExerciseTimer');
                    if (timerEl) {
                        timerEl.classList.add('timer-alert');
                        setTimeout(() => timerEl.classList.remove('timer-alert'), 1200);
                    }
                }
            } else {
                // Ya llegó a cero, sigue mostrando 00:00
                updateExerciseTimerDisplay(0, true);
            }
        } else {
            // Modo Reps: cronómetro ascendente del ejercicio
            updateExerciseTimerDisplay(workoutState.tiempoEjercicioSeg, false);
        }

    } else if (workoutState.estado === 'DESCANSO') {
        // Modo Descanso: cronómetro regresivo
        if (workoutState.tiempoDescansoRestanteSeg > 0) {
            workoutState.tiempoDescansoRestanteSeg--;
            updateRestTimerDisplay();

            if (workoutState.tiempoDescansoRestanteSeg === 0) {
                playChime(880, 0.3);
                // Finaliza descanso automáticamente y vuelve al ejercicio
                finishRestAndContinue();
            }
        }
    }

    // Guardar progreso cada segundo para persistencia segura
    saveActiveWorkoutStorage(workoutState);
}

// ==========================================
// RENDERIZADO DEL EJERCICIO ACTIVO
// ==========================================

function getCurrentExercise() {
    if (!workoutState.rutina || !workoutState.rutina.ejercicios) return null;
    return workoutState.rutina.ejercicios[workoutState.ejercicioIndex] || null;
}

function renderCurrentExerciseView() {
    var ej = getCurrentExercise();
    if (!ej) return;

    // Título y datos del ejercicio
    document.getElementById('workoutActiveRoutineName').textContent = workoutState.rutina.name;
    document.getElementById('workoutActiveExName').textContent = ej.nombre;
    document.getElementById('workoutActiveExCategory').textContent = (ej.muscleGroup || 'General') + ' · ' + (ej.tipo === 'time' ? 'Por Tiempo' : 'Por Repeticiones');
    
    // Series: "Serie 2 de 4"
    document.getElementById('workoutActiveSetCounter').textContent = `Serie ${workoutState.serieActual} de ${workoutState.seriesTotales}`;

    // Target (reps o tiempo)
    var targetLabel = document.getElementById('workoutActiveTargetLabel');
    var targetValue = document.getElementById('workoutActiveTargetValue');
    if (ej.tipo === 'time') {
        targetLabel.textContent = 'Tiempo objetivo';
        targetValue.textContent = (ej.tiempo_objetivo_seg || 45) + ' s';
    } else {
        targetLabel.textContent = 'Reps objetivo';
        targetValue.textContent = (ej.reps || 10) + ' reps';
    }

    // Peso sugerido e input de peso real
    document.getElementById('workoutActiveWeightSuggested').textContent = (ej.peso_sugerido || 0) + ' kg';
    var weightInput = document.getElementById('workoutActiveRealWeightInput');
    weightInput.value = ej.peso_sugerido || 0;

    // Imagen / Multimedia
    var imgEl = document.getElementById('workoutActiveMediaImg');
    if (ej.mediaUrl) {
        imgEl.src = ej.mediaUrl;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    // Actualizar cronómetro de ejercicio inicial
    if (ej.tipo === 'time') {
        updateExerciseTimerDisplay(workoutState.tiempoObjetivoRestanteSeg, true);
    } else {
        updateExerciseTimerDisplay(workoutState.tiempoEjercicioSeg, false);
    }

    // Ocultar modal de descanso si estaba visible
    document.getElementById('workoutRestOverlay').classList.add('hidden');
}

function updateGeneralTimerDisplay() {
    var el = document.getElementById('workoutGeneralTimer');
    if (el) el.textContent = formatTime(workoutState.tiempoGeneralSeg);
}

function updateExerciseTimerDisplay(seconds, isCountdown) {
    var el = document.getElementById('workoutExerciseTimer');
    var labelEl = document.getElementById('workoutExerciseTimerLabel');
    if (el) el.textContent = formatTime(seconds);
    if (labelEl) {
        labelEl.textContent = isCountdown ? 'Tiempo restante' : 'Tiempo del ejercicio';
    }
}

function updateRestTimerDisplay() {
    var el = document.getElementById('workoutRestCountdown');
    if (el) el.textContent = formatTime(workoutState.tiempoDescansoRestanteSeg);
}

// ==========================================
// ACCIÓN PRINCIPAL: COMPLETAR SERIE
// ==========================================

function completeCurrentSet() {
    var ej = getCurrentExercise();
    if (!ej) return;

    var realWeight = parseFloat(document.getElementById('workoutActiveRealWeightInput').value) || 0;

    // Registrar detalle de la serie
    var detalle = {
        ejercicioId: ej.ejercicioId || ('ej-' + workoutState.ejercicioIndex),
        ejercicioNombre: ej.nombre,
        serieNum: workoutState.serieActual,
        tiempoEjercicioSeg: workoutState.tiempoEjercicioSeg,
        pesoReal: realWeight,
        completada: true,
        saltada: false
    };

    workoutState.detallesRegistrados.push(detalle);

    // Acumular tiempo para el resumen por ejercicio
    var ejId = detalle.ejercicioId;
    if (!workoutState.tiemposPorEjercicio[ejId]) {
        workoutState.tiemposPorEjercicio[ejId] = {
            nombre: ej.nombre,
            tiempoSeg: 0,
            seriesCompletadas: 0,
            saltado: false
        };
    }
    workoutState.tiemposPorEjercicio[ejId].tiempoSeg += workoutState.tiempoEjercicioSeg;
    workoutState.tiemposPorEjercicio[ejId].seriesCompletadas++;

    playChime(1046.5, 0.15); // Tono de éxito

    // Evaluar si es la última serie del ejercicio
    if (workoutState.serieActual < workoutState.seriesTotales) {
        // Aún quedan series de este ejercicio -> Activar DESCANSO
        startRestTimer(parseInt(ej.descanso_seg) || 60);
    } else {
        // Se completaron todas las series de este ejercicio
        if (workoutState.ejercicioIndex < workoutState.rutina.ejercicios.length - 1) {
            // Pasar al siguiente ejercicio
            advanceToNextExercise();
        } else {
            // ¡Último ejercicio de la rutina finalizado! -> Ir al Resumen
            goToSummaryScreen();
        }
    }
}

// ==========================================
// TEMPORIZADOR DE DESCANSO
// ==========================================

function startRestTimer(descansoSegundos) {
    workoutState.estado = 'DESCANSO';
    workoutState.tiempoDescansoTotalConfig = descansoSegundos;
    workoutState.tiempoDescansoRestanteSeg = descansoSegundos;

    var ej = getCurrentExercise();
    // Si es transición entre ejercicios, serieActual ya quedó en 1 (la próxima serie a realizar).
    // Si es descanso dentro del mismo ejercicio, la próxima serie es serieActual + 1.
    var nextSetNumber = workoutState.esTransicionEjercicio ? workoutState.serieActual : workoutState.serieActual + 1;

    document.getElementById('workoutRestSubtitle').textContent = `Siguiente: Serie ${nextSetNumber} de ${workoutState.seriesTotales} · ${ej ? ej.nombre : ''}`;
    updateRestTimerDisplay();

    // Mostrar overlay de descanso
    document.getElementById('workoutRestOverlay').classList.remove('hidden');
    saveActiveWorkoutStorage(workoutState);
}

function finishRestAndContinue() {
    document.getElementById('workoutRestOverlay').classList.add('hidden');

    // Si el descanso era entre ejercicios, serieActual ya se dejó en 1 en advanceToNextExercise().
    // Si era un descanso normal entre series del mismo ejercicio, avanzamos a la siguiente.
    if (workoutState.esTransicionEjercicio) {
        workoutState.esTransicionEjercicio = false;
    } else {
        workoutState.serieActual++;
    }
    workoutState.estado = 'EJERCICIO_ACTIVO';
    workoutState.tiempoEjercicioSeg = 0;

    var ej = getCurrentExercise();
    if (ej && ej.tipo === 'time') {
        workoutState.tiempoObjetivoRestanteSeg = parseInt(ej.tiempo_objetivo_seg) || 45;
    }

    renderCurrentExerciseView();
    saveActiveWorkoutStorage(workoutState);
}

function skipRestTimer() {
    finishRestAndContinue();
}

function adjustRestTime(deltaSeconds) {
    workoutState.tiempoDescansoRestanteSeg = Math.max(5, workoutState.tiempoDescansoRestanteSeg + deltaSeconds);
    updateRestTimerDisplay();
}

// ==========================================
// AVANCE DE EJERCICIO
// ==========================================

function advanceToNextExercise() {
    workoutState.ejercicioIndex++;
    workoutState.serieActual = 1;
    workoutState.tiempoEjercicioSeg = 0;

    var nextEj = getCurrentExercise();
    workoutState.seriesTotales = parseInt(nextEj.series) || 3;

    if (nextEj.tipo === 'time') {
        workoutState.tiempoObjetivoRestanteSeg = parseInt(nextEj.tiempo_objetivo_seg) || 45;
    }

    // Ofrecer un descanso de transición entre ejercicios
    workoutState.esTransicionEjercicio = true;
    startRestTimer(parseInt(nextEj.descanso_seg) || 60);
}

// ==========================================
// CASOS BORDE: SALTAR EJERCICIO, SERIE EXTRA, PAUSA
// ==========================================

/**
 * Caso Borde: Saltar ejercicio en curso
 */
function skipCurrentExercise() {
    var ej = getCurrentExercise();
    if (!ej) return;

    if (!confirm(`¿Estás seguro de saltar el ejercicio "${ej.nombre}"?`)) {
        return;
    }

    // Registrar las series restantes como saltadas
    for (var s = workoutState.serieActual; s <= workoutState.seriesTotales; s++) {
        workoutState.detallesRegistrados.push({
            ejercicioId: ej.ejercicioId || ('ej-' + workoutState.ejercicioIndex),
            ejercicioNombre: ej.nombre,
            serieNum: s,
            tiempoEjercicioSeg: 0,
            pesoReal: 0,
            completada: false,
            saltada: true
        });
    }

    var ejId = ej.ejercicioId || ('ej-' + workoutState.ejercicioIndex);
    if (!workoutState.tiemposPorEjercicio[ejId]) {
        workoutState.tiemposPorEjercicio[ejId] = {
            nombre: ej.nombre,
            tiempoSeg: workoutState.tiempoEjercicioSeg,
            seriesCompletadas: workoutState.serieActual - 1,
            saltado: true
        };
    } else {
        workoutState.tiemposPorEjercicio[ejId].saltado = true;
    }

    // Ocultar overlay de descanso si estaba activo
    document.getElementById('workoutRestOverlay').classList.add('hidden');

    // Pasar al siguiente o finalizar si era el último
    if (workoutState.ejercicioIndex < workoutState.rutina.ejercicios.length - 1) {
        workoutState.ejercicioIndex++;
        workoutState.serieActual = 1;
        workoutState.tiempoEjercicioSeg = 0;
        var nextEj = getCurrentExercise();
        workoutState.seriesTotales = parseInt(nextEj.series) || 3;
        if (nextEj.tipo === 'time') {
            workoutState.tiempoObjetivoRestanteSeg = parseInt(nextEj.tiempo_objetivo_seg) || 45;
        }
        renderCurrentExerciseView();
        saveActiveWorkoutStorage(workoutState);
    } else {
        goToSummaryScreen();
    }
}

/**
 * Caso Borde: Agregar serie extra sobre la marcha
 */
function addExtraSet() {
    workoutState.seriesTotales++;
    var ej = getCurrentExercise();
    document.getElementById('workoutActiveSetCounter').textContent = `Serie ${workoutState.serieActual} de ${workoutState.seriesTotales}`;
    
    // Notificación rápida
    alert(`Se agregó una serie extra a "${ej.nombre}". Ahora son ${workoutState.seriesTotales} series en total.`);
    saveActiveWorkoutStorage(workoutState);
}

/**
 * Caso Borde: Pausar o reanudar todo el entrenamiento
 */
function togglePauseWorkout() {
    workoutState.pausado = !workoutState.pausado;
    var pauseBtn = document.getElementById('workoutPauseBtn');
    var pauseOverlay = document.getElementById('workoutPauseBanner');

    if (workoutState.pausado) {
        pauseBtn.innerHTML = '▶ Reanudar';
        pauseBtn.classList.add('btn-warning');
        if (pauseOverlay) pauseOverlay.classList.remove('hidden');
    } else {
        pauseBtn.innerHTML = '⏸ Pausar';
        pauseBtn.classList.remove('btn-warning');
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
    }

    saveActiveWorkoutStorage(workoutState);
}

// ==========================================
// PANTALLA RESUMEN Y FINALIZACIÓN
// ==========================================

function goToSummaryScreen() {
    stopTimersLoop();
    workoutState.estado = 'RESUMEN';

    // ============================================
    // CÁLCULO DE DURACIONES
    // ============================================

    // Duración total real de la sesión (incluye descansos y transiciones)
    var duracionTotalConDescansos = workoutState.tiempoGeneralSeg;

    // Duración efectiva = suma de los tiempos reales por ejercicio
    var duracionEfectivaSeg = 0;
    Object.values(workoutState.tiemposPorEjercicio).forEach(function (item) {
        duracionEfectivaSeg += (item.tiempoSeg || 0);
    });

    // Si por alguna razón no hay desglose, usar el total
    if (duracionEfectivaSeg === 0) {
        duracionEfectivaSeg = duracionTotalConDescansos;
    }

    // Guardar en el state para que finishAndSaveWorkoutSession() lo use
    workoutState.duracionEfectivaSeg = duracionEfectivaSeg;
    workoutState.duracionTotalConDescansos = duracionTotalConDescansos;

    // ============================================
    // MÉTRICAS DE CABECERA
    // ============================================
    var totalDurEl = document.getElementById('workoutSummaryTotalDuration');
    if (totalDurEl) {
        totalDurEl.textContent = formatTime(duracionTotalConDescansos);
    }

    // Mostrar duración efectiva si existe el elemento (opcional)
    var effectiveDurEl = document.getElementById('workoutSummaryEffectiveDuration');
    if (effectiveDurEl) {
        effectiveDurEl.textContent = formatTime(duracionEfectivaSeg);
    }

    // Conteo de series completadas vs saltadas
    var seriesCompletadas = workoutState.detallesRegistrados.filter(function (d) {
        return d.completada;
    }).length;
    var seriesSaltadas = workoutState.detallesRegistrados.filter(function (d) {
        return d.saltada;
    }).length;

    var completedEl = document.getElementById('workoutSummaryCompletedSets');
    var skippedEl = document.getElementById('workoutSummarySkippedSets');
    if (completedEl) completedEl.textContent = seriesCompletadas;
    if (skippedEl) skippedEl.textContent = seriesSaltadas;

    // ============================================
    // DESGLOSE POR EJERCICIO
    // ============================================
    var breakdownContainer = document.getElementById('workoutSummaryExerciseBreakdown');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = '';

        var anyExercise = false;
        Object.values(workoutState.tiemposPorEjercicio).forEach(function (item) {
            anyExercise = true;
            var row = document.createElement('div');
            row.className = 'summary-breakdown-row';
            row.innerHTML =
                '<div>' +
                    '<strong>' + item.nombre + '</strong>' +
                    '<span>' + item.seriesCompletadas + ' series hechas' +
                    (item.saltado ? ' · (Saltado parcialmente)' : '') + '</span>' +
                '</div>' +
                '<div class="summary-exercise-time">' +
                    '⏱ ' + formatTime(item.tiempoSeg) +
                '</div>';
            breakdownContainer.appendChild(row);
        });

        if (!anyExercise) {
            breakdownContainer.innerHTML =
                '<p class="text-muted" style="padding: 12px; text-align: center;">' +
                'No se registraron tiempos de ejercicio.</p>';
        }
    }

    showOnlyWorkoutSection('workoutSummaryView');
    saveActiveWorkoutStorage(workoutState);
}

/**
 * Guarda la sesión definitivamente en la base de datos y vuelve al dashboard
 */
async function finishAndSaveWorkoutSession() {
    if (!loggedInUser) {
        alert("Debes tener una sesión activa para registrar el entrenamiento.");
        return;
    }

    // Usar las duraciones calculadas en goToSummaryScreen
    var duracionTotalConDescansos = workoutState.duracionTotalConDescansos
        || workoutState.tiempoGeneralSeg;
    var duracionEfectiva = workoutState.duracionEfectivaSeg
        || workoutState.tiempoGeneralSeg;

    var sesionId = 'sesion-' + Date.now();

    // NOTA: Guardamos la duración TOTAL (con descansos) como duracionTotalSeg,
    //       y la efectiva la enviamos como campo extra para métricas más precisas.
    var sesionPayload = {
        id: sesionId,
        clienteId: loggedInUser.id,
        rutinaId: workoutState.rutina.id,
        rutinaNombre: workoutState.rutina.name,
        fechaInicio: workoutState.fechaInicio || new Date().toISOString(),
        fechaFin: new Date().toISOString(),
        duracionTotalSeg: duracionTotalConDescansos,
        duracionEfectivaSeg: duracionEfectiva, // Campo extra (opcional en BD)
        completada: true,
        detalles: workoutState.detallesRegistrados
    };

    try {
        await SessionsAPI.save(sesionPayload);

        // Guardar también en el modelo de usuario actual si aplica
        if (loggedInUser.historialProgreso) {
            loggedInUser.historialProgreso.push({
                sesionId: sesionId,
                rutinaNombre: workoutState.rutina.name,
                fecha: new Date().toISOString().split('T')[0],
                duracionSeg: duracionTotalConDescansos,
                duracionEfectivaSeg: duracionEfectiva,
                detalles: workoutState.detallesRegistrados
            });
        }

        await refreshAllData();
        clearActiveWorkoutStorage();

        alert("¡Entrenamiento guardado con éxito! Excelente trabajo.");

        goToScreen('dashboardSection');
        renderClientDashboard();
    } catch (err) {
        alert("Error al guardar la sesión: " + err.message);
    }
}

/**
 * Salir del entrenamiento descartando progreso si el usuario cancela
 */
function cancelAndExitWorkout() {
    if (confirm("¿Seguro que deseas salir del entrenamiento? Se descartará el progreso de esta sesión.")) {
        stopTimersLoop();
        clearActiveWorkoutStorage();
        goToScreen('dashboardSection');
        if (loggedInUser && loggedInUser.role === 'client') {
            renderClientDashboard();
        }
    }
}

// ==========================================
// RECUPERACIÓN DE SESIÓN (Cierre o recarga accidental)
// ==========================================

function checkPendingActiveWorkout() {
    var savedState = getActiveWorkoutStorage();
    if (!savedState || !savedState.rutina) return;

    var resumeBanner = document.getElementById('activeWorkoutResumeBanner');
    if (resumeBanner) {
        document.getElementById('activeWorkoutResumeName').textContent = savedState.rutina.name;
        document.getElementById('activeWorkoutResumeTime').textContent = formatTime(savedState.tiempoGeneralSeg);
        resumeBanner.classList.remove('hidden');
    }
}

function resumeActiveWorkout() {
    var savedState = getActiveWorkoutStorage();
    if (!savedState) return;

    workoutState = savedState;
    workoutState.pausado = false;

    if (workoutState.estado === 'RESUMEN') {
        goToSummaryScreen();
    } else {
        startTimersLoop();
        renderCurrentExerciseView();
        showOnlyWorkoutSection('workoutActiveView');
        if (workoutState.estado === 'DESCANSO') {
            updateRestTimerDisplay();
            document.getElementById('workoutRestOverlay').classList.remove('hidden');
        }
    }

    var resumeBanner = document.getElementById('activeWorkoutResumeBanner');
    if (resumeBanner) resumeBanner.classList.add('hidden');
}

function discardActiveWorkout() {
    if (confirm("¿Descartar el entrenamiento pendiente guardado?")) {
        clearActiveWorkoutStorage();
        var resumeBanner = document.getElementById('activeWorkoutResumeBanner');
        if (resumeBanner) resumeBanner.classList.add('hidden');
    }
}

// ==========================================
// NAVEGACIÓN INTERNA DE VISTAS DE ENTRENAMIENTO
// ==========================================

function showOnlyWorkoutSection(sectionId) {
    // Ocultar pantallas de autenticación y dashboards
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Ocultar vistas de entrenamiento
    var workoutViews = ['workoutStartView', 'workoutActiveView', 'workoutSummaryView'];
    workoutViews.forEach(v => {
        var el = document.getElementById(v);
        if (el) el.classList.add('hidden');
    });

    // Mostrar el contenedor de entrenamiento y la vista correspondiente
    var container = document.getElementById('workoutModeContainer');
    if (container) container.classList.remove('hidden');

    var targetView = document.getElementById(sectionId);
    if (targetView) targetView.classList.remove('hidden');
}