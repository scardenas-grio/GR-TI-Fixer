const reportesTutorial = {
  id: "reportes",

  nombre: "Gestión de Reportes",

  version: "1.0.0",

  descripcion:
    "Aprende a consultar, filtrar, exportar e interpretar los reportes del sistema.",

  duracion: "4 minutos",

  pasos: [
    {
      id: 1,
      element: "#formReportes",
      title: "Filtros de reportes",
      description:
        "Desde aquí puedes seleccionar la vista, administrador, rango de fechas y tipo de movimiento para filtrar la información.",
      position: "right",
    },

    {
      id: 2,
      element: ".reportes-actions",
      title: "Exportar reportes",
      description:
        "Puedes exportar los resultados del reporte en formato Excel o CSV.",
      position: "bottom",
    },

    {
      id: 3,
      element: ".report-kpi-grid",
      title: "Indicadores principales",
      description:
        "Estos indicadores muestran un resumen de los usuarios, administradores, puntos netos y movimientos registrados.",
      position: "bottom",
    },

    {
      id: 4,
      element: "#tablaReportes",
      title: "Detalle de reportes",
      description:
        "Aquí puedes consultar el detalle de los movimientos o registros de auditoría.",
      position: "top",
    },

    {
      id: 5,
      element: ".paginacion",
      title: "Paginación",
      description:
        "Utiliza estos controles para desplazarte entre las diferentes páginas de resultados.",
      position: "top",
    },

    {
      id: 6,
      element: "#tipoGrafica",
      title: "Tipo de gráfica",
      description:
        "Puedes cambiar la visualización de los datos entre barras, línea y pastel.",
      position: "bottom",
    },

    {
      id: 7,
      element: ".grid-graficas",
      title: "Visualización de datos",
      description:
        "Aquí puedes consultar diferentes gráficas para analizar la información del sistema.",
      position: "top",
    },

    {
      id: 8,
      element: "#insights",
      title: "Insights",
      description:
        "En esta sección el sistema muestra conclusiones e información relevante obtenida de los datos.",
      position: "top",
    },
  ],
};

window.reportesTutorial = reportesTutorial;