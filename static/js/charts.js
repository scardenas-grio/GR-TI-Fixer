// =======================================
// ESTADO
// =======================================

let chart = null;
let chartRoles = null;
let chartFechas = null;

// =======================================
// CONSTANTES
// =======================================

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
];

// =======================================
// REFERENCIAS
// =======================================

const canvasPrincipal = document.getElementById("grafica");

const canvasRoles = document.getElementById("graficaRoles");

const canvasFechas = document.getElementById("graficaFechas");

// =======================================
// CONFIGURACIÓN
// =======================================

Chart.defaults.font.family = "'Inter', sans-serif";

// =======================================
// HELPERS
// =======================================

function actualizarColoresGrafica(chartInstance, textColor, gridColor) {
  chartInstance.options.plugins.legend.labels.color = textColor;

  if (chartInstance.options.scales) {
    chartInstance.options.scales.x.ticks.color = textColor;
    chartInstance.options.scales.y.ticks.color = textColor;

    chartInstance.options.scales.x.grid.color = gridColor;
    chartInstance.options.scales.y.grid.color = gridColor;
  }
}

// =======================================
// RENDER
// =======================================

function renderCharts(data, tipoGrafica) {
  const dark = document.body.classList.contains("dark");

  const textColor = dark ? "#f8fafc" : "#111827";

  const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)";

  renderMainChart(data, tipoGrafica, textColor, gridColor);

  renderRolesChart(data, textColor, gridColor);

  renderFechasChart(data, textColor, gridColor);
}

function renderMainChart(data, tipoGrafica, textColor, gridColor) {
  if (!canvasPrincipal) return;

  // Destruir la gráfica anterior
  if (chart) {
    chart.destroy();
    chart = null;
  }

  const tipoFinal = tipoGrafica === "pie" ? "doughnut" : tipoGrafica;

  chart = new Chart(canvasPrincipal, {
    type: tipoFinal,

    data: {
      labels: data.chart_principal.labels,

      datasets: [
        {
          label: "Datos",

          data: data.chart_principal.valores,

          backgroundColor:
            tipoFinal === "doughnut"
              ? CHART_COLORS
              : data.chart_principal.labels.map(
                  (_, i) => CHART_COLORS[i % CHART_COLORS.length],
                ),

          borderColor:
            tipoFinal === "doughnut"
              ? "transparent"
              : data.chart_principal.labels.map(
                  (_, i) => CHART_COLORS[i % CHART_COLORS.length],
                ),

          borderWidth: tipoFinal === "doughnut" ? 0 : 3,

          borderRadius: tipoFinal === "bar" ? 6 : 0,

          maxBarThickness: 180,

          categoryPercentage: 0.5,

          barPercentage: 0.7,

          tension: tipoFinal === "line" ? 0.4 : 0,

          fill: tipoFinal === "line",

          pointRadius: tipoFinal === "line" ? 5 : 0,

          hoverOffset: tipoFinal === "doughnut" ? 15 : 0,
        },
      ],
    },

    options: {
      responsive: true,

      animation: {
        duration: 700,
        easing: "easeOutQuart",
      },

      maintainAspectRatio: false,

      cutout: tipoFinal === "doughnut" ? "65%" : undefined,

      elements: {
        arc: {
          borderWidth: 0,
        },
      },

      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: textColor,
          },

          grid: {
            color: gridColor,
          },
        },

        y: {
          ticks: {
            color: textColor,
          },

          grid: {
            color: gridColor,
          },
        },
      },
    },
  });
}

function renderRolesChart(data, textColor, gridColor) {
  if (!canvasRoles) return;

  if (!chartRoles) {
    chartRoles = new Chart(canvasRoles, {
      type: "doughnut",

      data: {
        labels: data.labels || [],

        datasets: [
          {
            data: data.valores || [],

            backgroundColor: ["#6366f1", "#22c55e", "#f59e0b"],

            borderWidth: 0,

            hoverOffset: 8,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        cutout: "65%",
        animation: {
          duration: 700,
          easing: "easeOutQuart",
        },

        plugins: {
          legend: {
            labels: {
              color: textColor,

              usePointStyle: true,

              pointStyle: "circle",

              padding: 18,

              font: {
                size: 13,
                weight: "600",
              },
            },
          },
        },
      },
    });
  } else {
    chartRoles.data.labels = data.labels || [];

    chartRoles.data.datasets[0].data = data.valores || [];

    chartRoles.options.plugins.legend.labels.color = textColor;

    chartRoles.update();
  }
}

function renderFechasChart(data, textColor, gridColor) {
  if (!canvasFechas) return;

  if (!chartFechas) {
    chartFechas = new Chart(canvasFechas, {
      type: "line",

      data: {
        labels: data.chart_fechas.labels || [],

        datasets: [
          {
            label: data.tipo === "admin" ? "Auditoría" : "Puntos",

            data: data.chart_fechas.valores || [],

            borderColor: "#22c55e",

            backgroundColor: "rgba(34,197,94,0.15)",

            fill: true,

            tension: 0.4,

            pointRadius: 5,
          },
        ],
      },

      // 🔥 ESTO ES LO IMPORTANTE
      options: {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
          },
        },
        animation: {
          duration: 700,
          easing: "easeOutQuart",
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
            },

            grid: {
              color: gridColor,
            },
          },

          y: {
            ticks: {
              color: textColor,
            },

            grid: {
              color: gridColor,
            },
          },
        },
      },
    });
  } else {
    chartFechas.data.labels = data.chart_fechas.labels || [];

    chartFechas.data.datasets[0].data = data.chart_fechas.valores || [];

    chartFechas.data.datasets[0].label =
      data.tipo === "admin" ? "Auditoría" : "Puntos";

    actualizarColoresGrafica(chartFechas, textColor, gridColor);
    chartFechas.update("active");
  }
}
