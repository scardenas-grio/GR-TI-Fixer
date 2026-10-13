const vacacionesTutorial = {
  id: "vacaciones",

  nombre: "Gestión de Vacaciones y Permisos",

  version: "1.0.0",

  descripcion:
    "Aprende a crear solicitudes de vacaciones y permisos, consultar tu saldo, revisar el calendario y consultar el resumen anual.",

  duracion: "4 minutos",

  pasos: [
    {
      id: 1,

      element: ".wizard-card-container",

      title: "Nueva solicitud",

      description:
        "Desde esta sección puedes iniciar una nueva solicitud de vacaciones o permiso y avanzar paso a paso por el proceso.",

      position: "top",
    },

    {
      id: 2,

      element: ".solicitud-opciones",

      title: "Tipo de solicitud",

      description:
        "Aquí puedes seleccionar el tipo de solicitud que deseas realizar, como vacaciones, permiso, horas extras o incapacidad.",

      position: "top",
    },

    {
      id: 3,

      element: ".vacaciones-kpi",

      title: "Información laboral",

      description:
        "Estas tarjetas muestran información importante como tu fecha de ingreso, antigüedad y saldo disponible.",

      position: "bottom",
    },

    {
      id: 4,

      element: ".calendar-widget",

      title: "Calendario",

      description:
        "Consulta el calendario para revisar los meses y visualizar la información relacionada con tus solicitudes y eventos laborales.",

      position: "top",
    },

    {
      id: 5,

      element: ".resumen-grid",

      title: "Resumen anual",

      description:
        "Aquí puedes consultar el resumen de tus vacaciones, permisos, horas extras, incapacidades, ausencias y faltas del año.",

      position: "top",
    },

    {
      id: 6,

      element: ".progress-section",

      title: "Días tomados",

      description:
        "Esta barra permite visualizar los días utilizados de tu saldo disponible durante el año.",

      position: "top",
    },
  ],
};

window.vacacionesTutorial = vacacionesTutorial;
