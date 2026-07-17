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

  const insights = document.getElementById("insights");

  if (insights) {
    insights.innerHTML = texto || "Sin insights relevantes.";
  }
}

function renderTabla(data) {
  const tabla = document.getElementById("tablaReportes");

  if (!tabla) return;

  tabla.innerHTML = "";

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
  tabla.innerHTML = filas;
}

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

  const usuarios = document.getElementById("kpiUsuarios");
  if (usuarios) {
    animarContador(usuarios, kpis.usuarios ?? 0);
  }

  const admins = document.getElementById("kpiAdmins");
  if (admins) {
    animarContador(admins, kpis.admins ?? 0);
  }

  const puntos = document.getElementById("kpiPuntos");
  if (puntos) {
    animarContador(puntos, kpis.puntos_netos ?? 0);
  }

  const movimientos = document.getElementById("kpiMovimientos");
  if (movimientos) {
    animarContador(movimientos, kpis.movimientos_hoy ?? 0);
  }
}

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