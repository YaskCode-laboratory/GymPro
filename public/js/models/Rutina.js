/**
 * Modelo Rutina
 * Representa una rutina creada por un instructor y asignable a clientes.
 */
class Rutina {
    constructor(id, name, coachId = null, coachName = '', assignedToClientId = null, dias = 'Todos los días', description = '') {
        this.id = id;
        this.name = name;
        this.coachId = coachId;
        this.coachName = coachName;
        this.assignedToClientId = assignedToClientId;
        this.dias = dias;
        this.description = description;
        this.ejercicios = []; // Lista de ejercicios con su configuración de series, reps, descanso, etc.
    }

    /**
     * Agrega un ejercicio a la rutina
     */
    agregarEjercicio(ejercicioConfig) {
        // ejercicioConfig tiene la forma:
        // {
        //   ejercicioId, nombre, tipo ('reps'|'time'), series, reps,
        //   descanso_seg, peso_sugerido, tiempo_objetivo_seg, mediaUrl
        // }
        this.ejercicios.push(ejercicioConfig);
    }
}
