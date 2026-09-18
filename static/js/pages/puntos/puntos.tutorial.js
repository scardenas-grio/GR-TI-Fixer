const puntosTutorial = {
  id: "puntos",

  nombre: "Gestión de Puntos",

  version: "1.0.0",

  descripcion:
    "Aprende a consultar saldos, aplicar puntos y revisar el historial de movimientos de los pacientes.",

  duracion: "4 minutos",

  pasos: [
    {
      id: 1,

      element: "#buscarPaciente",

      title: "Buscar paciente",

      description:
        "Utiliza este campo para localizar un paciente por su ID o nombre y consultar su información de puntos.",

      position: "bottom",
    },

    {
      id: 2,

      element: ".saldo-board",

      title: "Saldo disponible",

      description:
        "Aquí puedes consultar el paciente seleccionado y su saldo actual de puntos.",

      position: "bottom",
    },

    {
      id: 3,

      element: ".stats-grid",

      title: "Resumen de puntos",

      description:
        "Estas tarjetas muestran los puntos anteriores, los puntos aplicados y el estado de la reseña del paciente.",

      position: "bottom",
    },

    {
      id: 4,

      element: "#dropdownAgregar",

      title: "Seleccionar recompensa",

      description:
        "Desde aquí puedes seleccionar el tipo de recompensa que deseas aplicar al paciente.",

      position: "bottom",
    },

    {
      id: 5,

      element: ".btn-sumar-puntos",

      title: "Agregar puntos",

      description:
        "Después de seleccionar una recompensa, utiliza este botón para agregar los puntos al paciente.",

      position: "top",
    },

    {
      id: 6,

      element: ".kpi-grid",

      title: "Resumen de movimientos",

      description:
        "Estas tarjetas muestran el total de movimientos, los puntos otorgados y los puntos retirados.",

      position: "top",
    },

    {
      id: 7,

      element: "#graficaPuntos",

      title: "Historial de saldo",

      description:
        "Esta gráfica permite visualizar cómo ha evolucionado el saldo de puntos del paciente.",

      position: "top",
    },

    {
      id: 8,

      element: "#listaHistorial",

      title: "Historial de movimientos",

      description:
        "Aquí puedes consultar los movimientos realizados sobre los puntos del paciente.",

      position: "top",
    },
  ],
};

window.puntosTutorial = puntosTutorial;
