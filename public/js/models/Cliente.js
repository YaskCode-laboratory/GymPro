class Client extends User {
    constructor(id, name, email) {
        super(id, name, email, "client");
        this.rutinaAsignada = null;
        this.historialProgreso = []; // Registro de entrenamientos completados
    }

    registrarProgreso(ejercicioId, pesoUsado, seriesCompletadas) {
        const registro = {
            fecha: new Date().toISOString().split('T')[0],
            ejercicioId,
            pesoUsado, // Ej: "60kg"
            seriesCompletadas
        };
        this.historialProgreso.push(registro);
        return `Progreso guardado: ${pesoUsado} levantados en el ejercicio.`;
    }

    getInfo() {
        console.log("id: ", this.id, "name: ", this.name, "email: ", this.email);
    }
}
