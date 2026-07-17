// =======================================
// ESTADO
// =======================================

let paginaActual = 1;

let tipoGrafica = "bar";

// =======================================
// REFERENCIAS
// =======================================

const formReportes = document.getElementById("formReportes");

const tablaReportes = document.getElementById("tablaReportes");

const paginaLabel = document.getElementById("paginaActual");

const btnAnterior = document.getElementById("btnAnterior");

const btnSiguiente = document.getElementById("btnSiguiente");

const selectGrafica = document.getElementById("tipoGrafica");

const kpiUsuarios = document.getElementById("kpiUsuarios");

const kpiAdmins = document.getElementById("kpiAdmins");

const kpiPuntos = document.getElementById("kpiPuntos");

const kpiMovimientos = document.getElementById("kpiMovimientos");

const insights = document.getElementById("insights");
// =======================================
// HELPERS
// =======================================

function generarSkeletonFilas(cantidad = 5) {
  return Array(cantidad)
    .fill(
      `
    <tr class="skeleton-row">

      <td>
        <div class="skeleton skeleton-text"></div>
      </td>

      <td>
        <div class="skeleton skeleton-badge"></div>
      </td>

      <td>
        <div class="skeleton skeleton-small"></div>
      </td>

      <td>
        <div class="skeleton skeleton-text"></div>
      </td>

      <td>
        <div class="skeleton skeleton-date"></div>
      </td>

    </tr>
  `,
    )
    .join("");
}

// =======================================
// API
// =======================================

async function cargarGrafica() {
  if (!formReportes) return;

  const params = new URLSearchParams(new FormData(formReportes));

  try {
    if (tablaReportes) {
      tablaReportes.innerHTML = generarSkeletonFilas(6);
    }
    params.set("pagina", paginaActual);
    const data = await apiFetch(`/api/reportes?${params}`);
    if (!data) return;

    if (paginaLabel) {
      paginaLabel.innerText = `Página ${data.pagina}`;
    }

    if (btnAnterior) {
      btnAnterior.disabled = paginaActual <= 1;
    }

    const totalPaginas = Math.ceil(data.total_movimientos / data.por_pagina);

    if (btnSiguiente) {
      btnSiguiente.disabled = paginaActual >= totalPaginas;
    }
    // 🔹 UI
    actualizarKPIs(data.kpis);
    pintarKPIs();
    renderTabla(data);
    generarInsights(data);

    // 🔹 Charts
    renderCharts(data, tipoGrafica);
  } catch (err) {
    console.error("ERROR REPORTES:", err);

    mostrarToast("Error cargando reportes", "error");
  }
}

// =======================================
// KPIs
// =======================================

function pintarKPIs() {
  document.querySelectorAll(".reporte-card-kpi h2").forEach((el) => {
    const val = parseInt(el.innerText) || 0;

    if (val > 100) {
      el.style.color = "#16a34a";
    } else if (val > 0) {
      el.style.color = "#f59e0b";
    } else {
      el.style.color = "#ef4444";
    }
  });
}

function actualizarKPIs(kpis) {
  if (!kpis) return;

  if (kpiUsuarios) {
    animarContador(kpiUsuarios, kpis.usuarios ?? 0);
  }

  if (kpiAdmins) {
    animarContador(kpiAdmins, kpis.admins ?? 0);
  }

  if (kpiPuntos) {
    animarContador(kpiPuntos, kpis.puntos_netos ?? 0);
  }

  if (kpiMovimientos) {
    animarContador(kpiMovimientos, kpis.movimientos_hoy ?? 0);
  }
}

// =======================================
// TABLA
// =======================================

function renderTabla(data) {
  if (!tablaReportes) return;

  tablaReportes.innerHTML = "";

  let filas = "";

  // 🔥 AUDITORIA
  if (data.tipo === "admin") {
    (data.datos_admin || []).forEach((r) => {
      filas += `
        <tr>
          <td>${r.usuario_afectado || "-"}</td>
          <td>${r.accion || "-"}</td>
          <td>-</td>
          <td>${r.usuario_admin || "-"}</td>
          <td>${r.fecha || "-"}</td>
        </tr>
      `;
    });
  } else {
    // 🔥 PUNTOS
    (data.datos_puntos || []).forEach((r) => {
      filas += `
        <tr>
          <td>${r.paciente_id || "-"}</td>
          <td>${r.tipo || "-"}</td>
          <td>${r.cantidad || 0}</td>
          <td>${r.usuario_admin || "-"}</td>
          <td>${r.fecha || "-"}</td>
        </tr>
      `;
    });
  }

  if (!filas) {
    filas = `
    <tr>
      <td colspan="5" class="tabla-vacia">
        Sin registros disponibles
      </td>
    </tr>
  `;
  }
  tablaReportes.innerHTML = filas;
}

// =======================================
// INSIGHTS
// =======================================

function generarInsights(data) {
  let texto = "";

  // =====================
  // AUDITORIA
  // =====================

  if (data.tipo === "admin") {
    const acciones = {};

    (data.datos_admin || []).forEach((r) => {
      acciones[r.accion] = (acciones[r.accion] || 0) + 1;
    });

    const topAccion = Object.entries(acciones).sort((a, b) => b[1] - a[1])[0];

    if (topAccion) {
      texto += `
        <p>📝 Acción más frecuente:
        ${topAccion[0]}</p>
      `;
    }

    texto += `
      <p>📊 Registros de auditoría:
      ${(data.datos_admin || []).length}</p>
    `;

    if ((data.chart_fechas?.labels || []).length > 5) {
      texto += `
        <p>📅 Actividad distribuida en múltiples fechas.</p>
      `;
    }
  }

  // =====================
  // PUNTOS
  // =====================
  else {
    const admins = {};

    (data.datos_puntos || []).forEach((m) => {
      admins[m.usuario_admin] = (admins[m.usuario_admin] || 0) + 1;
    });

    const topAdmin = Object.entries(admins).sort((a, b) => b[1] - a[1])[0];

    if (topAdmin) {
      texto += `
        <p>🔥 Admin más activo:
        ${topAdmin[0]}</p>
      `;
    }

    const sumas = (data.datos_puntos || []).filter(
      (x) => x.tipo === "suma",
    ).length;

    const restas = (data.datos_puntos || []).filter(
      (x) => x.tipo === "resta",
    ).length;

    texto +=
      sumas >= restas
        ? `<p>📈 Predominan ingresos de puntos</p>`
        : `<p>📉 Predominan retiros de puntos</p>`;

    if ((data.valores_user?.[0] || 0) > (data.valores_admin?.[0] || 0)) {
      texto += `
        <p>👥 Hay más usuarios que administradores.</p>
      `;
    }

    if ((data.chart_fechas?.labels || []).length > 5) {
      texto += `
        <p>📅 Tendencia activa en múltiples fechas.</p>
      `;
    }
  }

  if (insights) {
    insights.innerHTML = texto || "Sin insights relevantes.";
  }
}

// =======================================
// UTILIDADES
// =======================================

let ordenAscendente = true;

function ordenarTabla(columna) {
  const tbody = document.getElementById("tablaReportes");

  if (!tbody) return;

  const filas = Array.from(tbody.querySelectorAll("tr"));

  filas.sort((a, b) => {
    const A = a.children[columna].innerText.trim();
    const B = b.children[columna].innerText.trim();

    return ordenAscendente
      ? A.localeCompare(B, undefined, { numeric: true })
      : B.localeCompare(A, undefined, { numeric: true });
  });

  ordenAscendente = !ordenAscendente;

  tbody.innerHTML = "";

  filas.forEach((f) => tbody.appendChild(f));
}

// =======================================
// EVENTOS
// =======================================

// 🔥 carga inicial
window.addEventListener("load", () => {
  cargarGrafica();

  pintarKPIs();
});

if (formReportes) {
  formReportes.addEventListener("submit", (e) => {
    e.preventDefault();

    paginaActual = 1;

    cargarGrafica();
  });
}

if (selectGrafica) {
  selectGrafica.addEventListener("change", (e) => {
    tipoGrafica = e.target.value;
    cargarGrafica();
  });
}

if (btnAnterior) {
  btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;

      cargarGrafica();
    }
  });
}

if (btnSiguiente) {
  btnSiguiente.addEventListener("click", () => {
    paginaActual++;

    cargarGrafica();
  });
}
