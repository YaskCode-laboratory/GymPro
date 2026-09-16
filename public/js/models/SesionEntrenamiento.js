/**
 * Modelo SesionEntrenamiento
 * Representa un entrenamiento ejecutado por un cliente a través del Modo Entrenamiento.
 */
class SesionEntrenamiento {
    constructor(id, clienteId, rutinaId, rutinaNombre, fechaInicio = new Date().toISOString()) {
        this.id = id;
        this.clienteId = clienteId;
        this.rutinaId = rutinaId;
        this.rutinaNombre = rutinaNombre;
        this.fechaInicio = fechaInicio;
        this.fechaFin = null;
        this.duracionTotalSeg = 0;
        this.completada = false;
        this.detalles = []; // Registro serie por serie
    }

    /**
     * Agrega el registro de una serie realizada o saltada
     */
    agregarDetalle(detalle) {
        // detalle: {
        //   ejercicioId,
        //   ejercicioNombre,
        //   serieNum,
        //   tiempoEjercicioSeg,
        //   pesoReal,
        //   completada,
        //   saltada
        // }
        this.detalles.push(detalle);
    }

    finalizar(duracionTotalSeg) {
        this.fechaFin = new Date().toISOString();
        this.duracionTotalSeg = duracionTotalSeg;
        this.completada = true;
    }
}
