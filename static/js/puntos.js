let pacienteActual = null;
let timerBusqueda = null;
let chartPuntos = null;
let historialGlobal = [];

/* =========================
   DOM
========================= */

const ui = {
  puntosActuales: document.getElementById("puntosActuales"),
  puntosAntes: document.getElementById("puntosAntes"),
  puntosOtorgados: document.getElementById("puntosOtorgados"),
  estadoResena: document.getElementById("estadoResena"),
  nombrePaciente: document.getElementById("nombrePaciente"),
  pacienteId: document.getElementById("pacienteId"),
  buscarPaciente: document.getElementById("buscarPaciente"),
  resultadosBusqueda: document.getElementById("resultadosBusqueda"),
  listaHistorial: document.getElementById("listaHistorial"),
  toastPanel: document.getElementById("toastPanel"),
  grafica: document.getElementById("graficaPuntos"),
};

function renderGrafica(historial) {
  if (!historial || historial.length === 0) {
    if (chartPuntos) {
      chartPuntos.destroy();
      chartPuntos = null;
    }
    return;
  }

  // 🔥 ordenar cronológicamente
  const historialOrdenado = [...historial].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha),
  );

  const labels = historialOrdenado.map((m) =>
    new Date(m.fecha).toLocaleDateString("es-MX", {
      month: "short",
      day: "numeric",
    }),
  );

  let acumulado = 0;

  const valores = historialOrdenado.map((m) => {
    const cambio = m.tipo === "suma" ? Number(m.cantidad) : -Number(m.cantidad);
    acumulado += cambio;
    return acumulado;
  });

  if (chartPuntos) chartPuntos.destroy();

  const isDark = document.body.classList.contains("dark");
  const textColor = isDark ? "#ffffff" : "#000000";
  const canvas = ui.grafica;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);

  gradient.addColorStop(0, "rgba(37,99,235,.28)");

  gradient.addColorStop(1, "rgba(37,99,235,0)");
  chartPuntos = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Saldo",
          data: valores,
          borderColor: "#3b82f6",
          backgroundColor: gradient,
          tension: 0.38,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          pointBackgroundColor: "#2563eb",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "#2563eb",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 900,

        easing: "easeOutQuart",
      },
      plugins: {
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 14,
          cornerRadius: 12,
          displayColors: false,
        },
        legend: {
          labels: {
            color: textColor,
            font: {
              size: 13,
              weight: "600",
            },
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11,
              weight: "600",
            },
          },

          grid: {
            color: "rgba(148,163,184,.12)",
            drawBorder: false,
          },
        },

        y: {
          ticks: {
            color: textColor,

            font: {
              size: 11,
              weight: "600",
            },
          },

          grid: {
            color: "rgba(148,163,184,.12)",
            drawBorder: false,
          },
        },
      },
    },
  });
}

function calcularInsights(historial) {
  if(!Array.isArray(historial))
    return;
  let total = historial.length;
  let ganados = 0;
  let usados = 0;

  historial.forEach((m) => {
    if (m.tipo === "suma") ganados += Number(m.cantidad);
    else usados += Number(m.cantidad);
  });

  document.getElementById("totalMovs").innerText = total;
  document.getElementById("puntosGanados").innerText = ganados;
  document.getElementById("puntosUsados").innerText = usados;
}

function showToastPuntos(msg, tipo = "success") {
  const container = ui.toastPanel;

  if (!container) return;

  const toast = document.createElement("div");

  toast.className = `toast-puntos ${tipo}`;

  toast.innerText = msg;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  const cerrar = () => {
    toast.classList.remove("show");

    setTimeout(() => toast.remove(), 300);
  };

  let timer = setTimeout(cerrar, 4000);

  toast.onmouseenter = () => clearTimeout(timer);

  toast.onmouseleave = () => {
    timer = setTimeout(cerrar, 1500);
  };
}

function renderHistorial(historial) {
  const lista = ui.listaHistorial;

  lista.innerHTML = "";

  if (!historial || historial.length === 0) {
    lista.innerHTML = `
            <li class="historial-empty">
                <div class="empty-state">
                    Selecciona un paciente para ver sus movimientos
                </div>
            </li>
        `;

    return;
  }

  historial.forEach((h) => {
    const esResena = (h.motivo || "").toLowerCase().includes("rese");

    const li = document.createElement("li");

    li.className = `item ${h.tipo === "suma" ? "verde" : "rojo"} ${esResena ? "item-resena" : ""}`;

    const icono =
      h.tipo === "resta"
        ? '<div class="icono-mov icono-cancelar">↺</div>'
        : '<div class="icono-mov icono-resena">⭐</div>';

    li.innerHTML = `

            <div class="mov-card">

                <div class="historial-barra"></div>

                <div class="mov-icon">

                    ${icono}

                </div>

                <div class="mov-info">

                    <div class="mov-titulo">

                        ${h.comentario}

                    </div>

                    <div class="mov-subtitulo">

                        ${h.motivo || ""}

                    </div>

                    <div class="mov-fecha">

                        🗓 ${formatearFecha(h.fecha)}

                    </div>

                </div>

                <div class="mov-right">

                    <div class="mov-cantidad ${h.tipo}">

                        ${h.tipo === "suma" ? "+" : "-"}${h.cantidad}

                        <span>pts</span>

                    </div>

                    <div class="mov-origen">

                        ${h.usuario_admin || "Sistema"}

                    </div>

                </div>

            </div>

        `;

    lista.appendChild(li);
  });
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  const d = new Date(fecha);

  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actualizarPacienteUI() {

    ui.nombrePaciente.textContent = pacienteActual.nombre;

    ui.pacienteId.textContent =
        `IDCLIENTE ${pacienteActual.idcliente}`;

}

function actualizarSaldoUI(data) {

    ui.puntosActuales.textContent = data.puntos;

    ui.puntosAntes.textContent = data.puntos;

    ui.puntosOtorgados.textContent = "0";

}

function actualizarHistorialUI(historial) {

    historialGlobal = historial || [];

    renderHistorial(historialGlobal);

    renderGrafica(historialGlobal);

}

function actualizarEstadoResena(data) {

    if (data.tiene_resena) {

        ui.estadoResena.textContent = "Aplicada";

        ui.estadoResena.classList.add("aplicada");

    } else {

        ui.estadoResena.textContent = "Pendiente";

        ui.estadoResena.classList.remove("aplicada");

    }

}

async function seleccionarPaciente(paciente) {
  pacienteActual = paciente;
  const tarjeta = document.querySelector(".saldo-board");
  tarjeta.classList.add("loading");
  ui.buscarPaciente.value =
    `${paciente.idcliente} - ${paciente.nombre}`;

  try {
    bloquearAcciones(true);
    const res = await fetch(`/api/paciente/${paciente.idcliente}`);
    const data = await res.json();

    if (!data || data.error || data.status === "error") {
      showToastPuntos(data.msg || "No se pudo cargar el paciente", "error");
      return;
    }

    bloquearAcciones(false);

    historialGlobal = data.historial || [];
    const historial = Array.isArray(data.historial) ? [...data.historial] : [];

    // 🔥 obtener la última reseña aplicada
    let resena = null;

    if (data.tiene_resena) {
      resena = historial.find(
        (h) =>
          h.tipo === "suma" && (h.motivo || "").toLowerCase().includes("rese"),
      );
    }

    window.fechaResena = resena ? resena.fecha : null;
    window.usuarioResena = resena ? resena.usuario_admin : null;

    window.resenasPorCita = new Set(
      (data.citas_con_resena || [])
        .filter((c) => c !== null)
        .map((c) => String(c)),
    );

    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    actualizarPacienteUI();
    actualizarSaldoUI(data);
    actualizarHistorialUI(historial);
    actualizarEstadoResena(data);

    calcularInsights(historial);

    animarCargaCompleta();
    tarjeta.classList.remove("loading");
    tarjeta.classList.add("ready");
    setTimeout(() => {
      tarjeta.classList.remove("ready");
    }, 250);
  } catch (error) {

      console.error(error);

      tarjeta.classList.remove("loading");

      showToastPuntos(
          error.message,
          "error"
      );

      bloquearAcciones(false);

  }
}

async function buscarPacientes() {
  const q = document.getElementById("buscarPaciente").value.trim();
  const cont = document.getElementById("resultadosBusqueda");

  if (!q) {
    cont.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`/api/buscar_paciente?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    cont.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      cont.innerHTML = '<div class="resultado-item muted">Sin resultados</div>';
      return;
    }

    data.slice(0, 12).forEach((p) => {
      const div = document.createElement("div");
      div.className = "resultado-item";
      div.innerHTML = `<strong>${p.idcliente}</strong> <span>${p.nombre}</span> <small>${p.idcita || "sin cita"}</small>`;
      div.onclick = () => seleccionarPaciente(p);
      cont.appendChild(div);
    });
  } catch (error) {
    showToastPuntos("Error en la busqueda", "error");
  }
}

function debounceBuscar() {
  clearTimeout(timerBusqueda);
  timerBusqueda = setTimeout(buscarPacientes, 300);
}

async function enviarMovimiento(tipo) {
  if (!pacienteActual) {
    showToastPuntos("Selecciona un paciente primero", "error");
    return;
  }

  const seleccion = tipo === "suma" ? seleccionAgregar : seleccionQuitar;

  if (!seleccion || !seleccion.value) {
    showToastPuntos("Selecciona un tipo de movimiento", "error");
    return;
  }

  const cantidad = seleccion.puntos;
  const categoria = seleccion.value;

  const idcitaActual = pacienteActual.idcita
    ? String(pacienteActual.idcita)
    : null;

  if (
    tipo === "suma" && // 🔥 SOLO cuando agrega
    categoria === "reseña" &&
    idcitaActual &&
    window.resenasPorCita.has(idcitaActual)
  ) {
    showToastPuntos("Esta cita ya tiene reseña aplicada", "error");
    return;
  }

  try {
    const btn =
      tipo === "suma"
        ? document.querySelector(".btn-sumar-puntos")
        : document.querySelector(".btn-restar-puntos");

    if (btn.disabled) return;

    btn.disabled = true;
    btn.innerText = "Procesando...";

    const res = await fetch("/api/puntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idcliente: pacienteActual.idcliente,
        idcita: pacienteActual.idcita,
        cantidad,
        tipo,
        categoria,
      }),
    });

    const text = await res.text();

    let data = {};

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("NO ES JSON");
    }

    if (!res.ok || data.status === "error") {
      showToastPuntos(data.msg || "Error", "error");
      return;
    }

    await seleccionarPaciente(pacienteActual);

    const mensaje =
      tipo === "suma"
        ? `+${cantidad} puntos agregados correctamente`
        : `-${cantidad} puntos retirados correctamente`;

    if (tipo === "resta" && categoria === "reseña") {
      const estado = document.getElementById("estadoResena");

      if (estado) {
        estado.innerText = "Pendiente";
        estado.classList.remove("estado-ok");
        estado.classList.add("estado-pendiente");

        estado.removeAttribute("title");
      }

      if (idcitaActual) {
        window.resenasPorCita.delete(idcitaActual);
      }
    }

    showToastPuntos(mensaje, "success");
  } catch (error) {
    showToastPuntos("Error de conexion", "error");
  } finally {
    const btn =
      tipo === "suma"
        ? document.querySelector(".btn-sumar-puntos")
        : document.querySelector(".btn-restar-puntos");

    btn.disabled = false;
    btn.innerText = tipo === "suma" ? "Agregar" : "Quitar";

    // 🔥 reset dropdown
    if (tipo === "suma") {
      seleccionAgregar = null;
      document.querySelector("#dropdownAgregar .dropdown-selected").innerText =
        "Selecciona tipo";
    }

    if (tipo === "resta") {
      seleccionQuitar = null;
      document.querySelector("#dropdownQuitar .dropdown-selected").innerText =
        "Selecciona tipo";
    }
  }
}

function sumar() {
  enviarMovimiento("suma");
}

function restar() {
  enviarMovimiento("resta");
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-panel")) {
    ui.resultadosBusqueda.innerHTML = "";
  }
});

function animarSaldo(elementId, nuevoValor) {
  const el = document.getElementById(elementId);

  if (!el) return;

  clearInterval(el._contador);

  const valorActual = parseInt(el.innerText.replace(/\D/g, "")) || 0;

  const diferencia = nuevoValor - valorActual;

  if (diferencia === 0) return;

  const duracion = 350;
  const fps = 60;
  const pasos = Math.max(15, Math.floor((duracion / 1000) * fps));

  let paso = 0;

  el.classList.remove("saldo-up", "saldo-down");

  if (diferencia > 0) {
    el.classList.add("saldo-up");
  } else {
    el.classList.add("saldo-down");
  }

  el.classList.add("saldoFX");

  el._contador = setInterval(() => {
    paso++;

    const progreso = paso / pasos;

    const easing = 1 - Math.pow(1 - progreso, 3);

    const valor = Math.round(valorActual + diferencia * easing);

    el.innerText = valor;

    if (paso >= pasos) {
      clearInterval(el._contador);

      el.innerText = nuevoValor;

      setTimeout(() => {
        el.classList.remove("saldoFX", "saldo-up", "saldo-down");
      }, 250);
    }
  }, 1000 / fps);
}

function bloquearAcciones(sinPaciente) {
  const btns = document.querySelectorAll(
    ".btn-sumar-puntos, .btn-restar-puntos",
  );

  btns.forEach((btn) => {
    btn.disabled = sinPaciente;
    btn.style.opacity = sinPaciente ? "0.5" : "1";
  });
}
bloquearAcciones(true);

function showTooltipEstado(element, texto) {
  let tooltip = document.getElementById("tooltipEstado");

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltipEstado";
    tooltip.className = "tooltip-estado";
    document.body.appendChild(tooltip);
  }

  tooltip.innerText = texto;

  const rect = element.getBoundingClientRect();

  tooltip.style.top = rect.top - 35 + "px";
  tooltip.style.left = rect.left + "px";

  tooltip.style.opacity = "1";
}

function hideTooltipEstado() {
  const tooltip = document.getElementById("tooltipEstado");
  if (tooltip) tooltip.style.opacity = "0";
}

document.addEventListener("mouseover", (e) => {
  const el = e.target.closest("#estadoResena");
  if (!el) return;

  if (!window.fechaResena) return;
  if (!el.innerText.includes("Aplicada")) return;

  showTooltipEstado(
    el,
    `📅 ${window.fechaResena}\n👤 ${window.usuarioResena || "sistema"}`,
  );
});

document.addEventListener("mouseout", (e) => {
  const el = e.target.closest("#estadoResena");
  if (!el) return;

  hideTooltipEstado();
});

function filtrarHistorial(rango) {
  if (!historialGlobal.length) return;

  const ahora = new Date();

  let filtrado = historialGlobal.filter((h) => {
    const fecha = new Date(h.fecha);

    if (rango === "hoy") {
      return fecha.toDateString() === ahora.toDateString();
    }

    if (rango === "semana") {
      const hace7 = new Date();
      hace7.setDate(ahora.getDate() - 7);
      return fecha >= hace7;
    }

    if (rango === "mes") {
      const hace30 = new Date();
      hace30.setDate(ahora.getDate() - 30);
      return fecha >= hace30;
    }

    return true;
  });

  renderHistorial(filtrado);
  renderGrafica(filtrado);
  calcularInsights(filtrado);
  animarHistorial();
  animarGrafica();
}

function setActivo(btn) {
  document.querySelectorAll(".filtro-btn").forEach((b) => {
    b.classList.remove("active");
  });
  btn.classList.add("active");
}

let seleccionAgregar = null;
let seleccionQuitar = null;

function toggleDropdown(tipo) {
  const dropdown = document.getElementById(`dropdown${tipo}`);

  if (!dropdown) return;

  dropdown.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".dropdown-pro").forEach((drop) => {
    drop.querySelectorAll(".option").forEach((opt) => {
      opt.addEventListener("click", () => {
        const selected = drop.querySelector(".dropdown-selected");

        if (!selected) return;

        selected.innerHTML = opt.innerHTML;

        drop
          .querySelectorAll(".option")
          .forEach((o) => o.classList.remove("selected"));

        opt.classList.add("selected");

        const tipo = drop.id.includes("Agregar") ? "Agregar" : "Quitar";

        if (tipo === "Agregar") {
          seleccionAgregar = {
            value: opt.dataset.value,
            puntos: parseInt(opt.dataset.puntos),
          };
        } else {
          seleccionQuitar = {
            value: opt.dataset.value,
            puntos: parseInt(opt.dataset.puntos),
          };
        }

        drop.classList.remove("active");
      });
    });
  });
});

document.addEventListener("click", (e) => {
  document.querySelectorAll(".dropdown-pro").forEach((drop) => {
    if (!drop.contains(e.target)) {
      drop.classList.remove("active");
    }
  });
});

function animarTarjetaPaciente() {
  const tarjeta = document.querySelector(".saldo-board");

  tarjeta.classList.remove("show");

  tarjeta.classList.add("loading");

  setTimeout(() => {
    tarjeta.classList.remove("loading");

    tarjeta.classList.add("show");
  }, 180);
}

function animarKPIs() {
  document.querySelectorAll(".stat-card").forEach((card, i) => {
    card.classList.remove("show");

    card.classList.add("hide");

    setTimeout(() => {
      card.classList.remove("hide");

      card.classList.add("show");
    }, i * 80);
  });
}

function animarHistorial() {
  const lista = document.getElementById("listaHistorial");

  lista.classList.remove("show");

  lista.classList.add("hide");

  setTimeout(() => {
    lista.classList.remove("hide");

    lista.classList.add("show");
  }, 250);
}

function animarGrafica() {
  const grafica = document.querySelector(".grafica-puntos");

  grafica.classList.remove("show");

  grafica.classList.add("hide");

  setTimeout(() => {
    grafica.classList.remove("hide");

    grafica.classList.add("show");
  }, 180);
}

function animarCargaCompleta() {
  animarTarjetaPaciente();

  setTimeout(animarKPIs, 120);

  setTimeout(animarGrafica, 220);

  setTimeout(animarHistorial, 320);
}
