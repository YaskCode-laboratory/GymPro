// El Instructor (Entrenador) crea rutinas y las asigna a los clientes
class Coach extends User {
  constructor(id, name, email) {
    super(id, name, email, "coach");
  }

  crearRutinaPersonalizada(name, objetivo) {
    return new Rutina(Date.now(), name, objetivo);
  }

  asignarRutinaACliente(cliente, rutina) {
    cliente.rutinaAsignada = rutina;
  }
}
