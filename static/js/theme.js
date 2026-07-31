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

    const { textColor, gridColor } = obtenerColoresTema();

    const charts = [
      Chart.getChart("grafica"),
      Chart.getChart("graficaRoles"),
      Chart.getChart("graficaFechas"),
    ];

    charts.forEach((chart) => {
      if (!chart) return;

      aplicarColoresGrafica(chart, textColor, gridColor);

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
