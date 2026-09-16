// El Administrador controla la base de datos global de ejercicios
class Administrator extends User {
  constructor(id, name, email) {
    super(id, name, email, "admin");
  }

  crearEjercicioGlobal(bancoEjercicios, name, grupoMuscular) {
    const nuevoId = bancoEjercicios.length + 1;
    const nuevoEjercicio = new Ejercicio(nuevoId, name, grupoMuscular, `https://video.gym{name}`);
    bancoEjercicios.push(nuevoEjercicio);
    return nuevoEjercicio;
  }
}
