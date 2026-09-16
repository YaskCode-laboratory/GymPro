/**
 * Modelo Ejercicio
 * Representa un ejercicio dentro del catálogo del gimnasio.
 * 
 * tipo:
 * - 'reps': Ejercicio basado en repeticiones (ej. Sentadillas, Press de Banca)
 * - 'time': Ejercicio basado en tiempo o isométrico (ej. Plancha abdominal, Puente estático)
 */
class Ejercicio {
    constructor(id, name, muscleGroup, type = 'reps', description = '', mediaUrl = '', defaultRestSec = 60) {
        this.id = id;
        this.name = name;
        this.muscleGroup = muscleGroup; // Ej: "Piernas", "Pecho", "Abdomen", "Espalda"
        this.type = type; // 'reps' | 'time'
        this.description = description;
        this.mediaUrl = mediaUrl; // URL a imagen o video demostrativo
        this.defaultRestSec = defaultRestSec; // Segundos de descanso sugerido
    }
}
