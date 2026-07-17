/* ==========================================
   DASHBOARD
========================================== */

/*=========================================
=            VARIABLES
=========================================*/

let graficaDashboard = null;

let ultimaActividad = [];

let ultimaFechaActividad = null;

/*=========================================
=                UI
=========================================*/

const ui = {
  grafica: null,

  dataChart: null,

  totalLDAP: null,

  totalDB: null,

  totalAdmins: null,

  actividadFeed: null,

  estadoSistema: null,

  estadoSistemaIcono: null,

  porcentajeLDAP: null,

  porcentajeDB: null,

  porcentajeAdmins: null,

  dashboardEstado: null,
};

function initDashboard() {
  ui.grafica = document.getElementById("grafica");

  ui.dataChart = document.getElementById("data-chart");

  ui.totalLDAP = document.getElementById("totalLDAP");

  ui.totalDB = document.getElementById("totalDB");

  ui.totalAdmins = document.getElementById("totalAdmins");

  ui.actividadFeed = document.getElementById("actividadFeed");

  ui.estadoSistema = document.getElementById("estadoSistema");

  ui.estadoSistemaIcono = document.getElementById("estadoSistemaIcono");

  ui.porcentajeLDAP = document.getElementById("porcentajeLDAP");

  ui.porcentajeDB = document.getElementById("porcentajeDB");

  ui.porcentajeAdmins = document.getElementById("porcentajeAdmins");

  ui.dashboardEstado = document.getElementById("dashboardEstado");

  if (!ui.dataChart) return;

  const valores = JSON.parse(ui.dataChart.textContent);

  crearGraficaDashboard(valores);

  setInterval(actualizarDashboard, 10000);
}

function crearPluginCentro() {
  return {
    id: "centerText",

    beforeDraw(chart) {
      const { ctx } = chart;

      const meta = chart.getDatasetMeta(0);

      if (!meta.data.length) return;

      const x = meta.data[0].x;
      const y = meta.data[0].y;

      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

      const textColor = getComputedStyle(document.body)
        .getPropertyValue("--text-main")
        .trim();

      const softColor = getComputedStyle(document.body)
        .getPropertyValue("--text-soft")
        .trim();

      ctx.save();

      ctx.font = "bold 36px Segoe UI";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(total, x, y - 10);

      ctx.font = "14px Segoe UI";
      ctx.fillStyle = softColor;

      ctx.fillText("Total usuarios", x, y + 20);

      ctx.restore();
    },
  };
}

function crearGraficaDashboard(valores) {
  const ctx = ui.grafica;

  if (!ctx) return;

  graficaDashboard = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: ["Usuarios LDAP", "Con acceso", "Administradores"],

      datasets: [
        {
          data: valores,

          backgroundColor: [
            "#3b82f6", // LDAP
            "#22c55e", // Con acceso
            "#f59e0b", // Administradores
          ],

          borderWidth: 0,

          hoverOffset: 15,
        },
      ],
    },

    options: {
      responsive: true,

      maintainAspectRatio: false,

      cutout: "78%",

      plugins: {
        legend: {
          display: false,

          labels: {
            color: getComputedStyle(document.body)
              .getPropertyValue("--text-main")
              .trim(),

            padding: 20,
          },
        },

        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);

              const value = context.raw;

              const percent = ((value / total) * 100).toFixed(1);

              return `${context.label}: ${value} (${percent}%)`;
            },
          },
        },
      },

      animation: {
        animateRotate: true,

        animateScale: true,
      },
    },

    plugins: [crearPluginCentro()],
  });
}

function actualizarGraficaDashboard(data) {
  if (!graficaDashboard) return;

  graficaDashboard.data.datasets[0].data = [
    data.total_ldap,

    data.total_db,

    data.total_admins,
  ];

  graficaDashboard.update();
}

function obtenerClaseAccion(accion) {
  accion = (accion || "").toLowerCase();

  switch (accion) {
    case "crear":
      return "crear";

    case "editar":
      return "editar";

    case "eliminar":
      return "eliminar";

    case "permisos":
      return "permisos";

    case "login":
      return "login";

    case "logout":
      return "logout";

    case "puntos":
      return "puntos";

    default:
      return "default";
  }
}

function obtenerIniciales(nombre) {
  if (!nombre) return "?";

  return nombre
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function crearTarjetaActividad(a, esNuevo) {
  const detalle = (a.detalle || "")

    .split(",")

    .filter(Boolean)

    .map((item) => {
      const modulo = item.trim();

      return `
            <span class="feed-chip ${modulo.toLowerCase()}">

                ${modulo}

            </span>
        `;
    })

    .join("");

  return `

        <div class="feed-card ${esNuevo ? "nueva-fila" : ""}">

            <div class="feed-top">

<div class="feed-avatar">

    ${obtenerIniciales(a.admin)}

</div>

                <div class="feed-info">

                    <div class="feed-admin">

                        <span class="feed-admin-name">

                            ${a.admin}

                        </span>

                    <span class="feed-badge ${obtenerClaseAccion(a.accion)}">

                        ${a.accion}

                    </span>

                    </div>

                    <div class="feed-user">

                        ${a.usuario}

                    </div>

                    <div class="feed-detail">

                        ${detalle}

                    </div>

                </div>

                <div class="feed-date">

                    ${formatearFecha(a.fecha)}

                </div>

            </div>

        </div>

    `;
}

function renderFeedActividad(actividad) {
  const feed = ui.actividadFeed;

  if (!feed) return;

  feed.innerHTML = "";

  actividad.forEach((a) => {
    const esNuevo = !ultimaActividad.find((x) => x.fecha === a.fecha);

    feed.innerHTML += crearTarjetaActividad(a, esNuevo);
  });

  ultimaActividad = actividad;

  ultimaFechaActividad = actividad.length > 0 ? actividad[0].fecha : null;
}

function actualizarEstadoSistema(conectado = true) {
  if (!ui.estadoSistema) return;

  ui.estadoSistema.textContent = conectado ? "En línea" : "Sin conexión";

  ui.estadoSistemaIcono.textContent = conectado ? "🟢" : "🔴";
}

async function actualizarDashboard() {
  try {
    const res = await fetch("/api/dashboard");

    const data = await res.json();

    if (data.error) {
      actualizarEstadoSistema(false);

      return;
    }

    actualizarEstadoSistema(true);

    actualizarGraficaDashboard(data);
    const total = data.total_ldap + data.total_db + data.total_admins;

    const porcentajeLDAP = ((data.total_ldap / total) * 100).toFixed(1);

    const porcentajeDB = ((data.total_db / total) * 100).toFixed(1);

    const porcentajeAdmins = ((data.total_admins / total) * 100).toFixed(1);

    if (ui.dashboardEstado) {
      ui.dashboardEstado.textContent =
        data.total_db > 20
          ? "⚠ Revisar usuarios sin permisos"
          : "✔ Sistema estable";
    }

    if (ui.porcentajeLDAP) ui.porcentajeLDAP.textContent = porcentajeLDAP + "%";

    if (ui.porcentajeDB) ui.porcentajeDB.textContent = porcentajeDB + "%";

    if (ui.porcentajeAdmins)
      ui.porcentajeAdmins.textContent = porcentajeAdmins + "%";

    animarContador(ui.totalLDAP, data.total_ldap);

    ui.totalLDAP.classList.add("kpi-update");

    setTimeout(() => {
      ui.totalLDAP.classList.remove("kpi-update");
    }, 400);

    animarContador(ui.totalDB, data.total_db);

    ui.totalDB.classList.add("kpi-update");

    setTimeout(() => {
      ui.totalDB.classList.remove("kpi-update");
    }, 400);

    animarContador(ui.totalAdmins, data.total_admins);

    ui.totalAdmins.classList.add("kpi-update");

    setTimeout(() => {
      ui.totalAdmins.classList.remove("kpi-update");
    }, 400);

    const nuevaFecha = data.actividad?.length ? data.actividad[0].fecha : null;

    if (nuevaFecha !== ultimaFechaActividad) {
      renderFeedActividad(data.actividad);
    }
  } catch (e) {
    actualizarEstadoSistema(false);
    console.error("Dashboard:", e);
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);
