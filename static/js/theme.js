function toggleTheme() {
  const body = document.body;

  const icon = document.getElementById("themeIcon");

  body.classList.toggle("dark");

  if (icon) {
    if (body.classList.contains("dark")) {
      icon.className = "fas fa-moon";

      localStorage.setItem("theme", "dark");
    } else {
      icon.className = "fas fa-sun";

      localStorage.setItem("theme", "light");
    }
  }

  setTimeout(() => {
    if (typeof Chart === "undefined") {
      return;
    }

    const dark = document.body.classList.contains("dark");

    const textColor = dark ? "#f8fafc" : "#111827";

    const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)";

    const charts = [
      Chart.getChart("grafica"),
      Chart.getChart("graficaRoles"),
      Chart.getChart("graficaFechas"),
    ];

    charts.forEach((chart) => {
      if (!chart) return;

      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = textColor;
      }

      if (chart.options.scales) {
        if (chart.options.scales.x) {
          chart.options.scales.x.ticks.color = textColor;

          chart.options.scales.x.grid.color = gridColor;
        }

        if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = textColor;

          chart.options.scales.y.grid.color = gridColor;
        }
      }

      chart.update("none");
    });
  }, 50);
}

window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("theme");

  const body = document.body;

  const icon = document.getElementById("themeIcon");

  if (savedTheme === "dark") {
    body.classList.add("dark");

    if (icon) {
      icon.className = "fas fa-moon";
    }
  } else {
    if (icon) {
      icon.className = "fas fa-sun";
    }
  }
});
