/*================================================
   TI-FIXER
   Vacaciones - Página Principal
================================================*/

let solicitudActualRegistrada = false;
let tipoSolicitudSeleccionada = null;

let solicitudVacaciones = {
  tipo: null,

  // Vacaciones
  fechaInicio: "",
  fechaFin: "",
  diasSolicitados: 0,
  saldoAnterior: 0,
  saldoRestante: 0,

  // Permiso
  tipoPermiso: "permiso",
  pagoPermiso: "",
  comentarioPermiso: "",
};

// ========================================
// DATOS TEMPORALES
// ========================================

const TOTAL_DIAS = 20;

const SALDO_INICIAL_VACACIONES = 12;

let saldoDisponible = SALDO_INICIAL_VACACIONES;

// ========================================
// PERIODOS YA SOLICITADOS
// ========================================
let periodosPermisosRegistrados = [];

const periodosVacacionesRegistrados = [
  {
    fechaInicio: "2026-07-24",
    fechaFin: "2026-07-24",
  },
];

// ========================================
// SALDO COMPROMETIDO
// ========================================

function obtenerDiasComprometidos() {
  return periodosVacacionesRegistrados.reduce((total, periodo) => {
    return total + Number(periodo.dias || 0);
  }, 0);
}

// ========================================
// SALDO DISPONIBLE REAL
// ========================================

function obtenerSaldoDisponibleReal() {
  return Math.max(0, SALDO_INICIAL_VACACIONES - obtenerDiasComprometidos());
}

// ========================================
// ACTUALIZAR SALDO DISPONIBLE
// ========================================

function actualizarSaldoDisponibleReal() {
  saldoDisponible = obtenerSaldoDisponibleReal();

  console.log("💰 Saldo disponible actualizado:", saldoDisponible, "días");
}

// ========================================
// EVENTOS DEL CALENDARIO
// ========================================

const eventosCalendario = [
  {
    fecha: "2026-03-17",
    tipo: "cumple",
  },

  {
    fecha: "2026-06-10",
    tipo: "permiso",
  },

  {
    fecha: "2026-07-24",
    tipo: "descanso",
  },

  {
    fecha: "2026-07-24",
    tipo: "horas",
  },

  {
    fecha: "2026-08-24",
    tipo: "horas",
  },
];

// ========================================
// REINICIAR SOLICITUD
// ========================================

document.addEventListener("wizard:restart", function () {
  console.log("🧹 Limpiando solicitud anterior");

  // Recalcular el saldo tomando en cuenta
  // las solicitudes anteriores pendientes.
  actualizarSaldoDisponibleReal();

  // Permitir registrar una nueva solicitud.
  solicitudActualRegistrada = false;

  tipoSolicitudSeleccionada = null;

  solicitudVacaciones = {
    tipo: null,

    fechaInicio: "",
    fechaFin: "",
    diasSolicitados: 0,
    saldoAnterior: saldoDisponible,
    saldoRestante: saldoDisponible,

    tipoPermiso: "",
    fechaPermiso: "",
    horaInicioPermiso: "",
    horaFinPermiso: "",
    motivoPermiso: "",
    observacionesPermiso: "",
  };

  console.log("💰 Saldo para nueva solicitud:", saldoDisponible, "días");
});

// ========================================
// REGISTRAR SOLICITUD RECIENTE
// ========================================

function registrarSolicitudReciente() {
  const tabla = document.getElementById("tablaRecientes");

  if (!tabla) {
    console.warn("⚠️ No se encontró la tabla de solicitudes recientes.");
    return;
  }

  const tbody = tabla.querySelector("tbody");

  if (!tbody) {
    console.warn("⚠️ No se encontró el tbody de solicitudes recientes.");
    return;
  }

  // ========================================
  // VALIDAR DATOS
  // ========================================

  if (
    !tipoSolicitudSeleccionada ||
    !solicitudVacaciones.fechaInicio ||
    !solicitudVacaciones.fechaFin
  ) {
    console.warn(
      "⚠️ No hay información suficiente para registrar la solicitud.",
    );
    return;
  }

  // ========================================
  // VERIFICAR STORE
  // ========================================

  if (
    !window.VacacionesStore ||
    typeof window.VacacionesStore.crear !== "function"
  ) {
    console.error(
      "❌ VacacionesStore no está disponible. No se registró la solicitud.",
    );
    return;
  }

  // ========================================
  // INFORMACIÓN DE LA SOLICITUD
  // ========================================

  const tipo = obtenerNombreTipoSolicitud(tipoSolicitudSeleccionada);

  const fechaInicioISO = solicitudVacaciones.fechaInicio;
  const fechaFinISO = solicitudVacaciones.fechaFin;

  const fechaInicio = formatearFechaSolicitud(fechaInicioISO);
  const fechaFin = formatearFechaSolicitud(fechaFinISO);

  const dias = Number(solicitudVacaciones.diasSolicitados) || 0;

  const duracion = `${dias} ${dias === 1 ? "día" : "días"}`;

  // ========================================
  // DATOS ADICIONALES SEGÚN TIPO
  // ========================================

  const esPermiso = tipoSolicitudSeleccionada === "permiso";

  const motivo = esPermiso
    ? solicitudVacaciones.motivoPermiso ||
      solicitudVacaciones.comentarioPermiso ||
      "Permiso"
    : `Solicitud de ${tipo.toLowerCase()}`;

  // ========================================
  // REGISTRAR EN EL STORE
  // ========================================

  let solicitudRegistrada;

  try {
    solicitudRegistrada = window.VacacionesStore.crear({
      tipo: tipoSolicitudSeleccionada,

      tipoNombre: tipo,

      fechaInicio: fechaInicioISO,
      fechaFin: fechaFinISO,

      diasSolicitados: dias,

      duracion,

      motivo,

      observaciones: solicitudVacaciones.comentarioPermiso || "",

      pagoPermiso: solicitudVacaciones.pagoPermiso || "",

      estado: "pendiente",
    });
  } catch (error) {
    console.error("❌ No se pudo registrar la solicitud:", error);

    alert("No fue posible guardar la solicitud. Inténtalo nuevamente.");

    return;
  }

  // ========================================
  // IDENTIFICADOR Y ESTADO
  // ========================================

  const idSolicitud = solicitudRegistrada.id;

  const estadoSolicitud = solicitudRegistrada.estado;

  // ========================================
  // REGISTRAR PERIODOS PARA VALIDACIONES
  // ========================================

  if (tipoSolicitudSeleccionada === "vacaciones") {
    periodosVacacionesRegistrados.push({
      id: idSolicitud,
      fechaInicio: fechaInicioISO,
      fechaFin: fechaFinISO,
      dias,
      estado: estadoSolicitud,
    });

    actualizarSaldoDisponibleReal();

    console.log("📅 Vacaciones registradas:", dias, "días");

    console.log("💰 Nuevo saldo disponible:", saldoDisponible, "días");
  }

  if (tipoSolicitudSeleccionada === "permiso") {
    periodosPermisosRegistrados.push({
      id: idSolicitud,
      fechaInicio: fechaInicioISO,
      fechaFin: fechaFinISO,
      estado: estadoSolicitud,
    });

    console.log("📅 Permiso registrado:", {
      fechaInicio: fechaInicioISO,
      fechaFin: fechaFinISO,
    });
  }

  // ========================================
  // ICONO SEGÚN TIPO
  // ========================================

  const iconos = {
    vacaciones: "fa-umbrella-beach",
    permiso: "fa-file-check",
    horas: "fa-clock",
    incapacidad: "fa-bandage",
  };

  const icono = iconos[tipoSolicitudSeleccionada] || "fa-file";

  // ========================================
  // CREAR FILA
  // ========================================

  const fila = document.createElement("tr");

  fila.classList.add("solicitud-reciente-nueva");

  // Guardamos el ID real para futuras acciones.
  fila.dataset.solicitudId = idSolicitud;

  fila.innerHTML = `
    <td>
      <div class="tipo-badge ${tipoSolicitudSeleccionada}">
        <i class="fa-solid ${icono}"></i>
        ${tipo}
      </div>
    </td>

    <td></td>

    <td></td>

    <td></td>

    <td>
      <span class="status-badge pending">
        Pendiente
      </span>
    </td>
  `;

  // Insertar los textos como texto, no como HTML.
  const celdas = fila.querySelectorAll("td");

  celdas[1].textContent = motivo;
  celdas[2].textContent = `${fechaInicio} – ${fechaFin}`;
  celdas[3].textContent = duracion;

  // ========================================
  // INSERTAR AL PRINCIPIO
  // ========================================

  tbody.insertBefore(fila, tbody.firstChild);

  // ========================================
  // ACTUALIZAR CALENDARIO
  // ========================================

  if (esPermiso) {
    renderCalendarioVacaciones();
  }

  console.log("✅ Solicitud registrada correctamente:", {
    id: idSolicitud,
    tipo,
    fechaInicio: fechaInicioISO,
    fechaFin: fechaFinISO,
    dias,
    estado: estadoSolicitud,
  });

  // ========================================
  // ANIMACIÓN
  // ========================================

  requestAnimationFrame(() => {
    fila.classList.add("visible");
  });
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  initForm();
  initCalendar();
  initWizard();
});

// ========================================
// FORMULARIO ANTIGUO
// ========================================
// Se conserva para no romper elementos existentes
// que todavía pudieran utilizar estas funciones.
// ========================================

function initForm() {
  const formSolicitud = document.getElementById("formSolicitud");
  const observaciones = document.getElementById("observaciones");
  const charCount = document.getElementById("charCount");
  const tipoPermiso = document.getElementById("tipoPermiso");

  // Contador de caracteres
  if (observaciones && charCount) {
    observaciones.addEventListener("input", function () {
      charCount.textContent = this.value.length;
    });
  }

  // Cambio de tipo de permiso
  if (tipoPermiso) {
    tipoPermiso.addEventListener("change", function () {
      updateDescripcion(this.value);
    });
  }

  // Submit del formulario anterior
  if (formSolicitud) {
    formSolicitud.addEventListener("submit", function (e) {
      e.preventDefault();
      submitForm();
    });
  }
}

function updateDescripcion(tipo) {
  const descripciones = {
    vacaciones: {
      title: "Solicitud de Vacaciones",
      desc: "Selecciona los días que deseas tomar de vacaciones.",
      icon: "umbrella-beach",
    },

    permiso: {
      title: "Solicitud de Permiso",
      desc: "Registra tu permiso personal o laboral.",
      icon: "file-check",
    },

    horas: {
      title: "Campos para Horas extras",
      desc: "Registra el tiempo laborado fuera de tu horario habitual.",
      icon: "clock",
    },

    incapacidad: {
      title: "Solicitud de Incapacidad",
      desc: "Adjunta el documento médico correspondiente.",
      icon: "bandage",
    },
  };

  const grupoDes = document.getElementById("descripcionGroup");

  if (grupoDes && descripciones[tipo]) {
    const info = descripciones[tipo];

    grupoDes.innerHTML = `
      <div class="desc-box">

        <div class="desc-icon">
          <i class="fa-solid fa-${info.icon}"></i>
        </div>

        <div class="desc-content">
          <h4>${info.title}</h4>
          <p>${info.desc}</p>
        </div>

      </div>
    `;
  }
}

function submitForm() {
  console.log("Formulario enviado");

  showNotification(
    "Solicitud en captura",
    "La solicitud ha sido capturada localmente.",
    "info",
  );
}

// ========================================
// CALENDARIO
// ========================================

function initCalendar() {
  const meses = document.querySelectorAll(".calendar-month");

  if (!meses.length) {
    return;
  }

  const selectYear = document.getElementById("selectYear");

  meses.forEach((mes, index) => {
    mes.dataset.mes = index;

    mes.addEventListener("click", function () {
      meses.forEach((m) => {
        m.classList.remove("active");
      });

      this.classList.add("active");

      const mesSeleccionado = Number(this.dataset.mes);

      abrirCalendarioMensual(
        mesSeleccionado,
        Number(selectYear?.value) || new Date().getFullYear(),
      );
    });
  });

  /*
   * Cambio de año
   */

  if (selectYear) {
    selectYear.addEventListener("change", function () {
      const mesActivo = document.querySelector(".calendar-month.active");

      const mesSeleccionado = mesActivo
        ? Number(mesActivo.dataset.mes)
        : new Date().getMonth();

      abrirCalendarioMensual(mesSeleccionado, Number(this.value));
    });
  }

  /*
   * Julio como mes inicial
   */

  const mesInicial = meses[6];

  if (mesInicial) {
    mesInicial.classList.add("active");

    mostrarEventosMesCalendario(6);
  }

  inicializarModalCalendario();
}

// =========================================================
// MODAL - CALENDARIO MENSUAL
// =========================================================

let calendarioMensual = {
  mes: 6,
  año: 2026,
  fechaSeleccionada: null,
};

// =========================================================
// INICIALIZAR MODAL
// =========================================================

function inicializarModalCalendario() {
  const modal = document.getElementById("calendarioMensualModal");

  if (!modal) {
    console.warn("⚠️ No se encontró #calendarioMensualModal");

    return;
  }

  const btnClose = document.getElementById("calendarModalClose");

  const btnCloseFooter = document.getElementById("calendarModalCloseFooter");

  const overlay = modal.querySelector(".calendar-month-modal-overlay");

  const btnPrev = document.getElementById("calendarModalPrev");

  const btnNext = document.getElementById("calendarModalNext");

  const btnToday = document.getElementById("calendarModalToday");

  /*
   * Cerrar
   */

  if (btnClose) {
    btnClose.addEventListener("click", cerrarCalendarioMensual);
  }

  if (btnCloseFooter) {
    btnCloseFooter.addEventListener("click", cerrarCalendarioMensual);
  }

  if (overlay) {
    overlay.addEventListener("click", cerrarCalendarioMensual);
  }

  /*
   * Navegación
   */

  if (btnPrev) {
    btnPrev.addEventListener("click", function () {
      cambiarMesModal(-1);
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", function () {
      cambiarMesModal(1);
    });
  }

  /*
   * Ir a hoy
   */

  if (btnToday) {
    btnToday.addEventListener("click", function () {
      const hoy = new Date();

      calendarioMensual.mes = hoy.getMonth();

      calendarioMensual.año = hoy.getFullYear();

      calendarioMensual.fechaSeleccionada = formatearFechaISO(hoy);

      renderCalendarioMensual();
    });
  }

  /*
   * ESC para cerrar
   */

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      cerrarCalendarioMensual();
    }
  });
}

// =========================================================
// ABRIR MODAL
// =========================================================

function abrirCalendarioMensual(mes, año) {
  const modal = document.getElementById("calendarioMensualModal");

  if (!modal) {
    return;
  }

  calendarioMensual.mes = Number(mes);

  calendarioMensual.año = Number(año);

  calendarioMensual.fechaSeleccionada = null;

  renderCalendarioMensual();

  modal.classList.add("open");

  modal.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}

// =========================================================
// CERRAR MODAL
// =========================================================

function cerrarCalendarioMensual() {
  const modal = document.getElementById("calendarioMensualModal");

  if (!modal) {
    return;
  }

  modal.classList.remove("open");

  modal.setAttribute("aria-hidden", "true");

  document.body.style.overflow = "";
}

// =========================================================
// CAMBIAR MES
// =========================================================

function cambiarMesModal(direccion) {
  let mes = calendarioMensual.mes + direccion;

  let año = calendarioMensual.año;

  if (mes < 0) {
    mes = 11;

    año--;
  }

  if (mes > 11) {
    mes = 0;

    año++;
  }

  calendarioMensual.mes = mes;

  calendarioMensual.año = año;

  calendarioMensual.fechaSeleccionada = null;

  renderCalendarioMensual();
}

// =========================================================
// RENDER DEL CALENDARIO MENSUAL
// =========================================================

function renderCalendarioMensual() {
  const title = document.getElementById("calendarModalTitle");

  const grid = document.getElementById("calendarModalGrid");

  const detail = document.getElementById("calendarModalDetail");

  if (!title || !grid) {
    return;
  }

  const año = calendarioMensual.año;

  const mes = calendarioMensual.mes;

  const fechaMes = new Date(año, mes, 1);

  title.textContent = fechaMes.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  /*
   * Primera fecha del mes
   */

  const primerDia = new Date(año, mes, 1);

  let diaSemana = primerDia.getDay();

  // Domingo = 0
  // Lo convertimos a:
  // Lunes = 0

  diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;

  const ultimoDia = new Date(año, mes + 1, 0);

  grid.innerHTML = "";

  /*
   * Espacios anteriores
   */

  for (let i = 0; i < diaSemana; i++) {
    const empty = document.createElement("div");

    empty.className = "calendar-modal-day empty";

    grid.appendChild(empty);
  }

  /*
   * Días
   */

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(año, mes, dia);

    const fechaString = formatearFechaISO(fecha);

    const button = document.createElement("button");

    button.type = "button";

    button.className = "calendar-modal-day";

    button.dataset.fecha = fechaString;

    /*
     * Número
     */

    const numero = document.createElement("span");

    numero.className = "calendar-modal-day-number";

    numero.textContent = dia;

    button.appendChild(numero);

    /*
     * Hoy
     */

    const hoy = obtenerFechaHoy();

    if (fechaString === hoy) {
      button.classList.add("today");
    }

    /*
     * Fecha seleccionada
     */

    if (calendarioMensual.fechaSeleccionada === fechaString) {
      button.classList.add("selected");
    }

    /*
     * Eventos
     */

    const eventos = obtenerEventosCalendarioCompleto(fechaString);

    if (eventos.length) {
      const eventosContainer = document.createElement("span");

      eventosContainer.className = "calendar-modal-events";

      eventos.forEach((tipo) => {
        if (tipo === "cumple") {
          const cumpleanos = document.createElement("span");

          cumpleanos.className = "calendar-modal-birthday-icon";
          cumpleanos.textContent = "🎂";
          cumpleanos.title = obtenerNombreEventoCalendario(tipo);

          eventosContainer.appendChild(cumpleanos);

          return;
        }

        const dot = document.createElement("span");

        dot.className = `calendar-modal-event-dot ${tipo}`;

        dot.title = obtenerNombreEventoCalendario(tipo);

        eventosContainer.appendChild(dot);
      });

      button.appendChild(eventosContainer);
    }

    /*
     * Click
     */

    button.addEventListener("click", function () {
      calendarioMensual.fechaSeleccionada = fechaString;

      renderCalendarioMensual();

      mostrarDetalleDiaModal(fechaString);
    });

    grid.appendChild(button);
  }

  /*
   * Mostrar detalle si ya
   * había una fecha seleccionada
   */

  if (calendarioMensual.fechaSeleccionada) {
    mostrarDetalleDiaModal(calendarioMensual.fechaSeleccionada);
  } else if (detail) {
    detail.innerHTML = `
      <div class="calendar-modal-detail-empty">

        <i class="fa-regular fa-calendar"></i>

        <div>

          <strong>
            Selecciona un día
          </strong>

          <p>
            Selecciona una fecha para consultar
            los eventos registrados.
          </p>

        </div>

      </div>
    `;
  }
}

// =========================================================
// OBTENER EVENTOS DEL CALENDARIO
// =========================================================

function obtenerEventosCalendarioCompleto(fechaString) {
  const eventos = obtenerEventosDelDia(fechaString);

  /*
   * También considerar las vacaciones
   * registradas como descanso.
   */

  const tieneVacaciones = periodosVacacionesRegistrados.some(
    (periodo) =>
      fechaString >= periodo.fechaInicio && fechaString <= periodo.fechaFin,
  );

  if (tieneVacaciones && !eventos.includes("descanso")) {
    eventos.push("descanso");
  }

  return [...new Set(eventos)];
}

// =========================================================
// DETALLE DEL DÍA
// =========================================================

function mostrarDetalleDiaModal(fechaString) {
  const detail = document.getElementById("calendarModalDetail");

  if (!detail) {
    return;
  }

  const fecha = convertirFecha(fechaString);

  if (!fecha) {
    return;
  }

  const eventos = obtenerEventosDetalleCalendario(fechaString);

  const fechaTexto = fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /*
   * No hay eventos
   */

  if (!eventos.length) {
    detail.innerHTML = `

      <div class="calendar-modal-detail-empty">

        <i class="fa-regular fa-calendar"></i>

        <div>

          <strong>
            ${capitalizarTexto(fechaTexto)}
          </strong>

          <p>
            No hay eventos o solicitudes
            registrados para este día.
          </p>

        </div>

      </div>

    `;

    return;
  }

  /*
   * Con eventos
   */

  detail.innerHTML = `

    <div style="margin-bottom: 12px;">

      <strong style="
        font-size: 15px;
        color: var(--text-main);
      ">

        ${capitalizarTexto(fechaTexto)}

      </strong>

    </div>


    ${eventos
      .map(
        (evento) => `

          <div class="calendar-modal-event-detail">

            <div
              class="calendar-modal-event-icon ${evento.tipo}"
            >

              <i
                class="fa-solid ${obtenerIconoEventoCalendario(evento.tipo)}"
              ></i>

            </div>


            <div class="calendar-modal-event-content">

              <strong>
                ${evento.titulo}
              </strong>

              ${
                evento.descripcion
                  ? `
                    <span>
                      ${evento.descripcion}
                    </span>
                  `
                  : ""
              }


              ${
                evento.horario
                  ? `
                    <span>
                      <i class="fa-regular fa-clock"></i>
                      ${evento.horario}
                    </span>
                  `
                  : ""
              }


              ${
                evento.autorizado
                  ? `
                    <span>
                      <i class="fa-solid fa-user"></i>
                      Autorizado por:
                      ${evento.autorizado}
                    </span>
                  `
                  : ""
              }


              ${
                evento.registro
                  ? `
                    <span>
                      <i class="fa-solid fa-clock"></i>
                      Registro:
                      ${evento.registro}
                    </span>
                  `
                  : ""
              }


              ${
                evento.pago
                  ? `
                    <span>
                      <i class="fa-solid fa-wallet"></i>
                      Pago:
                      ${evento.pago}
                    </span>
                  `
                  : ""
              }


              ${
                evento.estado
                  ? `
                    <span class="calendar-modal-event-badge">
                      ${evento.estado}
                    </span>
                  `
                  : ""
              }

            </div>

          </div>

        `,
      )
      .join("")}

  `;
}

// =========================================================
// OBTENER DETALLE DE EVENTOS
// =========================================================

function obtenerEventosDetalleCalendario(fechaString) {
  const nombres = {
    ausencia: "Ausencia",
    cumple: "Cumpleaños",
    descanso: "Vacaciones",
    falta: "Falta injustificada",
    horas: "Horas extras",
    incapacidad: "Incapacidad",
    permiso: "Permiso",
    autorizar: "Por autorizar",
  };

  const descripciones = {
    ausencia: "Ausencia registrada",
    cumple: "Día de cumpleaños",
    descanso: "Día de descanso solicitado",
    falta: "Falta injustificada registrada",
    horas: "Tiempo laborado fuera del horario habitual",
    incapacidad: "Incapacidad registrada",
    permiso: "Permiso registrado",
    autorizar: "Solicitud pendiente de autorización",
  };

  const eventos = eventosCalendario
    .filter((evento) => evento.fecha === fechaString)
    .map((evento) => ({
      ...evento,
      titulo: evento.titulo || nombres[evento.tipo] || "Evento",
      descripcion:
        evento.descripcion || descripciones[evento.tipo] || "Evento registrado",
    }));

  periodosVacacionesRegistrados.forEach((periodo) => {
    if (fechaString >= periodo.fechaInicio && fechaString <= periodo.fechaFin) {
      const existe = eventos.some((evento) => evento.tipo === "descanso");

      if (!existe) {
        eventos.push({
          fecha: fechaString,
          tipo: "descanso",
          titulo: "Vacaciones",
          descripcion: "Día de descanso solicitado",
          estado: "Pendiente",
        });
      }
    }
  });

  return eventos;
}

// =========================================================
// CAPITALIZAR TEXTO
// =========================================================

function capitalizarTexto(texto) {
  if (!texto) {
    return "";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function mostrarEventosMesCalendario(mes) {
  const detalle = document.querySelector(".calendar-detail");

  if (!detalle) {
    console.warn("⚠️ No se encontró .calendar-detail");
    return;
  }

  const eventos = {
    0: [
      {
        fecha: "15 de Enero de 2026",
        tipo: "permiso",
        titulo: "Permiso",
        descripcion: "Cita personal",
        estado: "Aprobado",
      },
    ],

    1: [],

    2: [
      {
        fecha: "17 de Marzo de 2026",
        tipo: "cumple",
        titulo: "Cumpleaños",
        descripcion: "Día de cumpleaños",
        estado: "Aprobado",
      },
    ],

    3: [],

    4: [],

    5: [
      {
        fecha: "10 de Junio de 2026",
        tipo: "permiso",
        titulo: "Permiso",
        descripcion: "Cita médica",
        estado: "Aprobado",
      },
    ],

    6: [
      {
        fecha: "24 de Julio de 2026",
        tipo: "horas",
        titulo: "Horas extras",
        descripcion: "Cubrir vacante en el área",
        estado: "Aprobado",
        horario: "16:00 - 20:00 (04:00 h)",
        autorizado: "Guadalupe Zúñiga (RH)",
        registro: "24 Jul 2026 09:01",
        pago: "Con sueldo",
      },
    ],

    7: [
      {
        fecha: "24 de Agosto de 2026",
        tipo: "horas",
        titulo: "Horas extras",
        descripcion: "Cubrir vacante en el área",
        estado: "Aprobado",
        horario: "16:00 - 20:00 (04:00 h)",
      },
    ],

    8: [],

    9: [],

    10: [],

    11: [],
  };

  const eventosMes = eventos[mes] || [];

  if (!eventosMes.length) {
    detalle.innerHTML = `
      <div class="calendar-detail-empty">
        <div class="detail-empty-icon">
          <i class="fa-regular fa-calendar"></i>
        </div>

        <h4>No hay eventos registrados</h4>

        <p>
          No existen solicitudes o eventos registrados
          para este mes.
        </p>
      </div>
    `;

    return;
  }

  detalle.innerHTML = `
    ${eventosMes
      .map(
        (evento) => `
          <div class="calendar-event">
            <h4>${evento.fecha}</h4>

            <div class="detail-item">
              <div class="detail-icon ${evento.tipo}">
                <i class="fa-solid ${obtenerIconoEventoCalendario(
                  evento.tipo,
                )}"></i>
              </div>

              <div class="detail-content">
                <span class="detail-title">
                  ${evento.titulo}
                </span>

                ${
                  evento.horario
                    ? `
                      <span class="detail-time">
                        ${evento.horario}
                      </span>
                    `
                    : ""
                }

                <span class="detail-description">
                  ${evento.descripcion}
                </span>

                <span class="detail-badge">
                  ${evento.estado}
                </span>
              </div>
            </div>

            ${
              evento.autorizado || evento.registro || evento.pago
                ? `
                  <div class="detail-info">

                    ${
                      evento.autorizado
                        ? `
                          <p>
                            <i class="fa-solid fa-user"></i>
                            Autorizado por:
                            ${evento.autorizado}
                          </p>
                        `
                        : ""
                    }

                    ${
                      evento.registro
                        ? `
                          <p>
                            <i class="fa-solid fa-clock"></i>
                            Registro:
                            ${evento.registro}
                          </p>
                        `
                        : ""
                    }

                    ${
                      evento.pago
                        ? `
                          <p>
                            <i class="fa-solid fa-wallet"></i>
                            Pago:
                            ${evento.pago}
                          </p>
                        `
                        : ""
                    }

                  </div>
                `
                : ""
            }
          </div>
        `,
      )
      .join("")}
  `;
}

function obtenerIconoEventoCalendario(tipo) {
  const iconos = {
    ausencia: "fa-ban",
    cumple: "fa-cake-candles",
    descanso: "fa-umbrella-beach",
    falta: "fa-triangle-exclamation",
    horas: "fa-clock",
    incapacidad: "fa-bandage",
    permiso: "fa-file-check",
    autorizar: "fa-hourglass-half",
  };

  return iconos[tipo] || "fa-calendar";
}

// ========================================
// OBTENER EVENTOS DEL MES
// ========================================

function obtenerEventosDelMes(mesIndex) {
  const selectYear = document.getElementById("selectYear");

  const año = Number(selectYear?.value) || new Date().getFullYear();

  return [
    ...new Set(
      eventosCalendario
        .filter((evento) => {
          const fecha = convertirFecha(evento.fecha);

          if (!fecha) {
            return false;
          }

          return fecha.getFullYear() === año && fecha.getMonth() === mesIndex;
        })
        .map((evento) => evento.tipo),
    ),
  ];
}

function obtenerEventosDelDia(fechaString) {
  return [
    ...new Set(
      eventosCalendario
        .filter((evento) => evento.fecha === fechaString)
        .map((evento) => evento.tipo),
    ),
  ];
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(titulo, mensaje, tipo = "success") {
  const notif = document.createElement("div");

  notif.className = `notification notification-${tipo}`;

  notif.innerHTML = `
    <div class="notif-content">

      <h4>${titulo}</h4>

      <p>${mensaje}</p>

    </div>

    <button
      class="notif-close"
      type="button"
      onclick="this.parentElement.remove()"
    >
      <i class="fa-solid fa-times"></i>
    </button>
  `;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 4000);
}

// ========================================
// INTERACCIONES DE TABLA
// ========================================

document.addEventListener("click", function (e) {
  if (e.target.closest(".tabla tbody tr")) {
    const fila = e.target.closest("tr");

    console.log("Fila clickeada:", fila);
  }
});

// ========================================
// WIZARD
// ========================================

function initWizard() {
  const btnSiguiente = document.getElementById("btnSiguiente");
  const btnAnterior = document.getElementById("btnAnterior");

  if (!btnSiguiente || !btnAnterior) {
    return;
  }

  console.log("🧙 Wizard de vacaciones inicializado");
}

// ========================================
// WIZARD - SELECCIÓN DE SOLICITUD
// ========================================

function renderTiposSolicitud() {
  const dynamicForm = document.getElementById("dynamicForm");

  if (!dynamicForm) {
    return;
  }

  dynamicForm.innerHTML = `

    <div class="wizard-selection fade-in">

      <div style="margin-bottom: 16px;">

        <h3 style="
          margin: 0 0 5px;
          font-size: 16px;
          color: var(--text-main);
        ">
          ¿Qué deseas solicitar?
        </h3>

        <p style="
          margin: 0;
          font-size: 12px;
          color: var(--text-soft);
        ">
          Selecciona el tipo de solicitud que deseas registrar.
        </p>

      </div>

      <div class="solicitud-opciones">

        <!-- VACACIONES -->

        <div
          class="solicitud-opcion"
          data-tipo="vacaciones"
        >

          <div class="solicitud-opcion-icon">
            <i class="fa-solid fa-umbrella-beach"></i>
          </div>

          <div class="solicitud-opcion-content">

            <strong>Vacaciones</strong>

            <span>
              Solicita días de descanso de tu saldo disponible.
            </span>

          </div>

          <div class="solicitud-opcion-check">
            <i class="fa-solid fa-check"></i>
          </div>

        </div>


        <!-- PERMISO -->

        <div
          class="solicitud-opcion"
          data-tipo="permiso"
        >

          <div class="solicitud-opcion-icon">
            <i class="fa-solid fa-file-circle-check"></i>
          </div>

          <div class="solicitud-opcion-content">

            <strong>Permiso</strong>

            <span>
              Registra un permiso personal o laboral.
            </span>

          </div>

          <div class="solicitud-opcion-check">
            <i class="fa-solid fa-check"></i>
          </div>

        </div>


        <!-- HORAS EXTRAS -->

        <div
          class="solicitud-opcion"
          data-tipo="horas"
        >

          <div class="solicitud-opcion-icon">
            <i class="fa-solid fa-clock"></i>
          </div>

          <div class="solicitud-opcion-content">

            <strong>Horas extras</strong>

            <span>
              Registra tiempo trabajado fuera de tu horario.
            </span>

          </div>

          <div class="solicitud-opcion-check">
            <i class="fa-solid fa-check"></i>
          </div>

        </div>


        <!-- INCAPACIDAD -->

        <div
          class="solicitud-opcion"
          data-tipo="incapacidad"
        >

          <div class="solicitud-opcion-icon">
            <i class="fa-solid fa-bandage"></i>
          </div>

          <div class="solicitud-opcion-content">

            <strong>Incapacidad</strong>

            <span>
              Registra una incapacidad y su documentación.
            </span>

          </div>

          <div class="solicitud-opcion-check">
            <i class="fa-solid fa-check"></i>
          </div>

        </div>

      </div>

    </div>

  `;

  const opciones = dynamicForm.querySelectorAll(".solicitud-opcion");

  opciones.forEach((opcion) => {
    opcion.addEventListener("click", function () {
      opciones.forEach((item) => {
        item.classList.remove("selected");
      });

      this.classList.add("selected");

      tipoSolicitudSeleccionada = this.dataset.tipo;

      solicitudVacaciones.tipo = tipoSolicitudSeleccionada;

      console.log("Tipo de solicitud seleccionado:", tipoSolicitudSeleccionada);
    });
  });
}

// ========================================
// FECHA DE HOY
// ========================================

function obtenerFechaHoy() {
  const hoy = new Date();

  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ========================================
// VALIDAR TRASLAPE DE VACACIONES
// ========================================

function existeTraslapeVacaciones(fechaInicio, fechaFin) {
  const inicioNueva = convertirFecha(fechaInicio);
  const finNueva = convertirFecha(fechaFin);

  if (!inicioNueva || !finNueva) {
    return false;
  }

  return periodosVacacionesRegistrados.some((periodo) => {
    const inicioExistente = convertirFecha(periodo.fechaInicio);
    const finExistente = convertirFecha(periodo.fechaFin);

    if (!inicioExistente || !finExistente) {
      return false;
    }

    return inicioNueva <= finExistente && finNueva >= inicioExistente;
  });
}

// ========================================
// CALENDARIO PERSONALIZADO DE VACACIONES
// ========================================

let calendarioVacaciones = {
  fechaActual: null,
  fechaInicio: "",
  fechaFin: "",
  modo: "vacaciones",
};

function inicializarCalendarioVacaciones(modo = "vacaciones") {
  calendarioVacaciones.modo = modo;

  calendarioVacaciones.fechaActual = convertirFecha(obtenerFechaHoy());
  calendarioVacaciones.fechaInicio = "";
  calendarioVacaciones.fechaFin = "";

  actualizarInputsCalendario();
  actualizarResumenCalendario();
  renderCalendarioVacaciones();

  const btnPrev = document.getElementById("calendarPrev");
  const btnNext = document.getElementById("calendarNext");
  const btnToday = document.getElementById("calendarToday");

  if (btnPrev) {
    btnPrev.onclick = function () {
      cambiarMesCalendario(-1);
    };
  }

  if (btnNext) {
    btnNext.onclick = function () {
      cambiarMesCalendario(1);
    };
  }

  if (btnToday) {
    btnToday.onclick = function () {
      calendarioVacaciones.fechaActual = convertirFecha(obtenerFechaHoy());

      renderCalendarioVacaciones();
    };
  }
}

// ========================================
// CAMBIAR MES
// ========================================

function cambiarMesCalendario(direccion) {
  const fecha = calendarioVacaciones.fechaActual;

  calendarioVacaciones.fechaActual = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + direccion,
    1,
  );

  renderCalendarioVacaciones();
}

// ========================================
// RENDER CALENDARIO
// ========================================

function renderCalendarioVacaciones() {
  const grid = document.getElementById("vacacionesCalendarGrid");

  const title = document.getElementById("vacacionesCalendarTitle");

  if (!grid || !title) {
    return;
  }

  const fecha = calendarioVacaciones.fechaActual;

  const year = fecha.getFullYear();
  const month = fecha.getMonth();

  title.textContent = fecha.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  grid.innerHTML = "";

  const primerDia = new Date(year, month, 1);

  const ultimoDia = new Date(year, month + 1, 0);

  let diaSemana = primerDia.getDay();

  // Ajustar el calendario para que la semana comience en lunes.
  // JavaScript devuelve domingo=0, lunes=1, ..., sábado=6.
  diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;

  // Espacios antes del primer día
  for (let i = 0; i < diaSemana; i++) {
    const espacio = document.createElement("div");

    espacio.className = "calendar-day empty";

    grid.appendChild(espacio);
  }

  // Días del mes
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fechaDia = new Date(year, month, dia);

    const fechaString = formatearFechaISO(fechaDia);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "calendar-day";

    button.dataset.fecha = fechaString;

    // ========================================
    // NÚMERO DEL DÍA
    // ========================================

    const numeroDia = document.createElement("span");

    numeroDia.className = "calendar-day-number";
    numeroDia.textContent = dia;

    button.appendChild(numeroDia);

    // ========================================
    // EVENTOS DEL DÍA
    // ========================================

    const eventosDia = obtenerEventosDelDia(fechaString);

    if (eventosDia.length > 0) {
      const eventosContainer = document.createElement("span");

      eventosContainer.className = "calendar-day-events";

      eventosDia.forEach((tipoEvento) => {
        const punto = document.createElement("span");

        punto.className = `legend-dot ${tipoEvento}`;

        punto.title = obtenerNombreEventoCalendario(tipoEvento);

        eventosContainer.appendChild(punto);
      });

      button.appendChild(eventosContainer);
    }

    // ========================================
    // ESTADO DEL DÍA
    // ========================================

    aplicarEstadoDiaCalendario(button, fechaString, fechaDia);

    grid.appendChild(button);
  }

  actualizarNavegacionCalendario();
}

function obtenerEventosDelDia(fechaString) {
  return [
    ...new Set(
      eventosCalendario
        .filter((evento) => evento.fecha === fechaString)
        .map((evento) => evento.tipo),
    ),
  ];
}

function obtenerNombreEventoCalendario(tipo) {
  const nombres = {
    ausencia: "Ausencia",
    cumple: "Cumpleaños",
    descanso: "Descanso",
    falta: "Falta injustificada",
    horas: "Horas extras",
    incapacidad: "Incapacidad",
    permiso: "Permiso",
    autorizar: "Por autorizar",
  };

  return nombres[tipo] || "Evento";
}

function obtenerFechaMinimaVacaciones() {
  const hoy = convertirFecha(obtenerFechaHoy());

  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
}

// ========================================
// ESTADO DE CADA DÍA
// ========================================

function aplicarEstadoDiaCalendario(button, fechaString, fechaDia) {
  const inicio = calendarioVacaciones.fechaInicio;
  const fin = calendarioVacaciones.fechaFin;
  const esPermiso = calendarioVacaciones.modo === "permiso";

  // Vacaciones: a partir de mañana.
  // Permisos: desde hoy, siempre que la fecha esté libre.
  const fechaMinima = esPermiso
    ? convertirFecha(obtenerFechaHoy())
    : obtenerFechaMinimaVacaciones();

  if (fechaDia < fechaMinima) {
    button.classList.add("disabled");
    button.disabled = true;
    button.title = "Fecha no disponible";
    return;
  }

  // Verificar si la fecha pertenece a un permiso registrado.
  // Bloquear fechas ocupadas por vacaciones o permisos.
  // Las solicitudes pendientes también reservan sus fechas.
  const fechaOcupada =
    fechaEstaOcupada(fechaString) ||
    periodosPermisosRegistrados.some(
      (periodo) =>
        fechaString >= periodo.fechaInicio && fechaString <= periodo.fechaFin,
    );

  if (fechaOcupada) {
    button.classList.add("occupied");
    button.disabled = true;
    button.title = "Fecha ocupada por una solicitud existente";
    return;
  }

  // Fecha de inicio seleccionada.
  if (inicio === fechaString) {
    button.classList.add("selected", "range-start");
  }
  // Fecha final seleccionada.
  else if (fin === fechaString) {
    button.classList.add("selected", "range-end");
  }
  // Fecha dentro del periodo seleccionado.
  else if (inicio && fin && fechaString > inicio && fechaString < fin) {
    button.classList.add("in-range");
  }
  // Fecha disponible.
  else if (!fechaOcupada && !inicio && !fin) {
    button.classList.add("available");
    button.title = "Fecha disponible para solicitar";
  }

  // Permitir seleccionar la fecha.
  button.addEventListener("click", function () {
    seleccionarFechaCalendario(fechaString);
  });
}

// ========================================
// FECHA OCUPADA
// ========================================

function fechaEstaOcupada(fechaString) {
  return periodosVacacionesRegistrados.some((periodo) => {
    return (
      fechaString >= periodo.fechaInicio && fechaString <= periodo.fechaFin
    );
  });
}

// ========================================
// SELECCIONAR FECHA
// ========================================

function seleccionarFechaCalendario(fechaString) {
  const inicio = calendarioVacaciones.fechaInicio;
  const fin = calendarioVacaciones.fechaFin;

  // ========================================
  // PRIMERA SELECCIÓN
  // ========================================

  if (!inicio || (inicio && fin)) {
    calendarioVacaciones.fechaInicio = fechaString;
    calendarioVacaciones.fechaFin = "";

    const fechaSeleccionada = convertirFecha(fechaString);

    if (fechaSeleccionada) {
      calendarioVacaciones.fechaActual = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        1,
      );
    }

    actualizarInputsCalendario();

    actualizarResumenCalendario();

    renderCalendarioVacaciones();

    console.log("📅 Fecha de inicio seleccionada:", fechaString);

    console.log("📅 Mostrando mes:", calendarioVacaciones.fechaActual);

    return;
  }

  // ========================================
  // NUEVA FECHA ANTERIOR AL INICIO
  // ========================================

  if (fechaString < inicio) {
    calendarioVacaciones.fechaInicio = fechaString;
    calendarioVacaciones.fechaFin = "";

    const fechaSeleccionada = convertirFecha(fechaString);

    if (fechaSeleccionada) {
      calendarioVacaciones.fechaActual = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        1,
      );
    }

    actualizarInputsCalendario();

    actualizarResumenCalendario();

    renderCalendarioVacaciones();

    return;
  }

  // ========================================
  // VALIDAR PERIODO OCUPADO
  // ========================================

  if (rangoContieneFechaOcupada(inicio, fechaString)) {
    mostrarAvisoCalendario(
      "Periodo no disponible",
      "El periodo seleccionado contiene días que ya fueron solicitados.",
    );

    return;
  }

  // ========================================
  // SEGUNDA SELECCIÓN
  // ========================================

  calendarioVacaciones.fechaFin = fechaString;

  actualizarInputsCalendario();

  if (calendarioVacaciones.modo === "vacaciones") {
    actualizarDiasSolicitados();
  }

  actualizarResumenCalendario();

  renderCalendarioVacaciones();

  console.log(
    "📅 Periodo seleccionado:",
    calendarioVacaciones.fechaInicio,
    "→",
    calendarioVacaciones.fechaFin,
  );
}
// ========================================
// VALIDAR RANGO OCUPADO
// ========================================

function rangoContieneFechaOcupada(fechaInicio, fechaFin) {
  let fecha = convertirFecha(fechaInicio);
  const fin = convertirFecha(fechaFin);

  while (fecha <= fin) {
    const fechaString = formatearFechaISO(fecha);

    if (fechaEstaOcupada(fechaString)) {
      return true;
    }

    fecha = new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate() + 1,
    );
  }

  return false;
}

// ========================================
// ACTUALIZAR INPUTS OCULTOS
// ========================================

function actualizarInputsCalendario() {
  const inicio = calendarioVacaciones.fechaInicio || "";
  const fin = calendarioVacaciones.fechaFin || "";

  // Campos principales del calendario.
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaFin = document.getElementById("fechaFin");

  if (fechaInicio) {
    fechaInicio.value = inicio;
  }

  if (fechaFin) {
    fechaFin.value = fin;
  }

  // Campos que utiliza la validación de Permisos.
  const inicioPermiso = document.getElementById("fechaInicioPermiso");
  const finPermiso = document.getElementById("fechaFinPermiso");

  if (inicioPermiso) {
    inicioPermiso.value = inicio;
  }

  if (finPermiso) {
    finPermiso.value = fin;
  }

  // Actualizar los datos de la solicitud de permiso.
  if (calendarioVacaciones.modo === "permiso") {
    solicitudVacaciones.tipoPermiso = "permiso";
    solicitudVacaciones.fechaInicio = inicio;
    solicitudVacaciones.fechaFin = fin;

    if (typeof actualizarDatosPermiso === "function") {
      actualizarDatosPermiso();
    }
  }
}

// ========================================
// RESUMEN DEL CALENDARIO
// ========================================

function actualizarResumenCalendario() {
  const inicioElement = document.getElementById("periodoFechaInicio");

  const finElement = document.getElementById("periodoFechaFin");

  const diasBadge = document.getElementById("periodoDiasBadge");

  if (!inicioElement || !finElement) {
    return;
  }

  const inicio = calendarioVacaciones.fechaInicio;

  const fin = calendarioVacaciones.fechaFin;

  inicioElement.textContent = inicio ? formatearFechaSolicitud(inicio) : "—";

  finElement.textContent = fin ? formatearFechaSolicitud(fin) : "—";

  let dias = 0;

  if (inicio && fin) {
    dias =
      calendarioVacaciones.modo === "permiso"
        ? calcularDiasPermiso(inicio, fin)
        : calcularDiasVacaciones(inicio, fin);
  }

  if (calendarioVacaciones.modo === "permiso") {
    const periodoInicio = document.getElementById("periodoFechaInicio");
    const periodoFin = document.getElementById("periodoFechaFin");
    const duracion = document.getElementById("periodoDiasBadge");

    if (periodoInicio) {
      periodoInicio.textContent = inicio
        ? formatearFechaSolicitud(inicio)
        : "—";
    }

    if (periodoFin) {
      periodoFin.textContent = fin ? formatearFechaSolicitud(fin) : "—";
    }

    if (duracion) {
      duracion.textContent = `${dias} ${dias === 1 ? "día" : "días"}`;
    }
  }

  if (diasBadge) {
    diasBadge.textContent = `${dias} ${dias === 1 ? "día" : "días"}`;
  }

  const help = document.getElementById("calendarHelpText");

  if (help) {
    if (!inicio) {
      help.textContent = "Selecciona primero la fecha de inicio.";
    } else if (!fin) {
      help.textContent = "Ahora selecciona la fecha final.";
    } else {
      help.textContent = "Periodo seleccionado correctamente.";
    }
  }
}

// ========================================
// FORMATO YYYY-MM-DD
// ========================================

function formatearFechaISO(fecha) {
  const year = fecha.getFullYear();

  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ========================================
// NAVEGACIÓN DEL CALENDARIO
// ========================================

function actualizarNavegacionCalendario() {
  const btnPrev = document.getElementById("calendarPrev");

  if (!btnPrev) {
    return;
  }

  const hoy = convertirFecha(obtenerFechaHoy());

  const mesActual = new Date(
    calendarioVacaciones.fechaActual.getFullYear(),
    calendarioVacaciones.fechaActual.getMonth(),
    1,
  );

  const mesHoy = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  btnPrev.disabled = mesActual <= mesHoy;
}

// ========================================
// AVISO DEL CALENDARIO
// ========================================

function mostrarAvisoCalendario(titulo, mensaje) {
  if (typeof showNotification === "function") {
    showNotification(titulo, mensaje, "error");
  }
}

// ========================================
// PASO 2 - FORMULARIO DE PERMISO
// ========================================

function renderFormularioPermiso() {
  const dynamicForm = document.getElementById("dynamicForm");

  if (!dynamicForm) return;

  dynamicForm.innerHTML = `
  
  <div class="vacaciones-calendar-container">

    <div class="vacaciones-calendar-header">
      <h3 id="vacacionesCalendarTitle"></h3>

      <div class="calendar-navigation">
        <button
          type="button"
          id="calendarPrev"
          class="calendar-nav-btn"
          aria-label="Mes anterior"
        >
          ‹
        </button>

        <button
          type="button"
          id="calendarNext"
          class="calendar-nav-btn"
          aria-label="Mes siguiente"
        >
          ›
        </button>

        <button
          type="button"
          id="calendarToday"
          class="calendar-today-btn"
        >
          Hoy
        </button>
      </div>
    </div>

    <div class="vacaciones-calendar-weekdays">
      <div>Lun</div>
      <div>Mar</div>
      <div>Mié</div>
      <div>Jue</div>
      <div>Vie</div>
      <div>Sáb</div>
      <div>Dom</div>
    </div>

    <div
      id="vacacionesCalendarGrid"
      class="vacaciones-calendar-grid"
    ></div>

    <p
      id="calendarHelpText"
      class="vacaciones-calendar-help"
    >
      Selecciona la fecha de inicio y la fecha de fin del permiso.
    </p>

  </div>

  <div class="vacaciones-periodo-resumen" style="margin-top: 18px;">
    <div class="periodo-resumen-header">
      <span>Resumen del permiso</span>
      <span id="periodoDiasBadge" class="periodo-dias-badge">
        0 días
      </span>
    </div>

    <div class="periodo-fechas">
      <div class="periodo-fecha">
        <span>Desde</span>
        <strong id="periodoFechaInicio">—</strong>
      </div>

      <span class="periodo-arrow">→</span>

      <div class="periodo-fecha">
        <span>Hasta</span>
        <strong id="periodoFechaFin">—</strong>
      </div>
    </div>
  </div>

  <input type="hidden" id="fechaInicio" name="fechaInicio">
  <input type="hidden" id="fechaFin" name="fechaFin">
  <input type="hidden" id="fechaInicioPermiso" name="fechaInicioPermiso">
  <input type="hidden" id="fechaFinPermiso" name="fechaFinPermiso">

  <div class="form-group" style="margin-top: 24px;">
    <label for="pagoPermiso">Tipo de pago *</label>

    <select id="pagoPermiso" name="pagoPermiso" required>
      <option value="">Selecciona una opción</option>
      <option value="con_sueldo">Con sueldo</option>
      <option value="sin_sueldo">Sin sueldo</option>
    </select>
  </div>

  <div class="form-group" style="margin-top: 18px;">
    <label for="comentarioPermiso">Comentario (opcional)</label>

    <textarea
      id="comentarioPermiso"
      name="comentarioPermiso"
      rows="3"
      placeholder="Describe el motivo del permiso..."
    ></textarea>
  </div>

  `;

  solicitudVacaciones.tipoPermiso = "permiso";

  const pago = document.getElementById("pagoPermiso");
  const comentario = document.getElementById("comentarioPermiso");

  [pago, comentario].forEach((elemento) => {
    if (!elemento) return;

    elemento.addEventListener("input", actualizarDatosPermiso);
    elemento.addEventListener("change", actualizarDatosPermiso);
  });

  inicializarCalendarioVacaciones("permiso");
  actualizarDatosPermiso();
}

// ========================================
// CALCULAR DÍAS DEL PERMISO
// ========================================

function calcularDiasPermiso(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return 0;
  }

  const inicio = convertirFecha(fechaInicio);
  const fin = convertirFecha(fechaFin);

  if (!inicio || !fin) {
    return 0;
  }

  if (fin < inicio) {
    return 0;
  }

  const diferencia = fin.getTime() - inicio.getTime();

  return Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;
}

// ========================================
// ACTUALIZAR DATOS DE PERMISO
// ========================================

function actualizarDatosPermiso() {
  const fechaInicio = document.getElementById("fechaInicioPermiso");
  const fechaFin = document.getElementById("fechaFinPermiso");
  const pago = document.getElementById("pagoPermiso");
  const comentario = document.getElementById("comentarioPermiso");

  if (!fechaInicio || !fechaFin || !pago || !comentario) {
    return;
  }

  solicitudVacaciones.tipoPermiso = "permiso";
  solicitudVacaciones.fechaInicio = fechaInicio.value;
  solicitudVacaciones.fechaFin = fechaFin.value;
  solicitudVacaciones.pagoPermiso = pago.value;
  solicitudVacaciones.comentarioPermiso = comentario.value.trim();

  const periodo = document.getElementById("permisoPeriodoResumen");
  const duracion = document.getElementById("permisoDuracionResumen");

  const inicio = fechaInicio.value;
  const fin = fechaFin.value;

  if (periodo) {
    periodo.textContent =
      inicio && fin
        ? `${formatearFechaSolicitud(inicio)} – ${formatearFechaSolicitud(fin)}`
        : "—";
  }

  if (duracion) {
    const dias = calcularDiasPermiso(inicio, fin);
    duracion.textContent =
      dias > 0 ? `${dias} ${dias === 1 ? "día" : "días"}` : "—";
  }
}

// ========================================
// NOMBRE DEL TIPO DE PERMISO
// ========================================

function obtenerNombreTipoPermiso(tipo) {
  const nombres = {
    personal: "Personal",
    medico: "Médico",
    laboral: "Laboral",
    otro: "Otro",
  };

  return nombres[tipo] || "—";
}

// ========================================
// DURACIÓN DEL PERMISO
// ========================================

function calcularDuracionPermiso(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) {
    return "";
  }

  const [horaInicioNumero, minutoInicio] = horaInicio.split(":").map(Number);

  const [horaFinNumero, minutoFin] = horaFin.split(":").map(Number);

  const inicio = horaInicioNumero * 60 + minutoInicio;

  const fin = horaFinNumero * 60 + minutoFin;

  if (fin <= inicio) {
    return "";
  }

  const minutos = fin - inicio;
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;

  if (horas > 0 && minutosRestantes > 0) {
    return `${horas} h ${minutosRestantes} min`;
  }

  if (horas > 0) {
    return `${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  return `${minutosRestantes} min`;
}

function actualizarFormularioPermisoDatos() {
  const fechaInicio = document.getElementById("fechaInicioPermiso");
  const fechaFin = document.getElementById("fechaFinPermiso");
  const pago = document.getElementById("pagoPermiso");
  const comentario = document.getElementById("comentarioPermiso");
  const tipo = document.getElementById("tipoPermisoSolicitud");

  if (tipo) {
    solicitudVacaciones.tipoPermiso = tipo.value;
  }

  if (fechaInicio) {
    solicitudVacaciones.fechaInicio = fechaInicio.value;
  }

  if (fechaFin) {
    solicitudVacaciones.fechaFin = fechaFin.value;
  }

  if (pago) {
    solicitudVacaciones.pagoPermiso = pago.value;
  }

  if (comentario) {
    solicitudVacaciones.comentarioPermiso = comentario.value.trim();
  }
}

// ========================================
// VALIDAR PERMISO
// ========================================

function validarPermiso() {
  actualizarFormularioPermisoDatos();

  const { fechaInicio, fechaFin, pagoPermiso, comentarioPermiso } =
    solicitudVacaciones;

  // ========================================
  // VALIDAR FECHA DE INICIO
  // ========================================

  if (!fechaInicio) {
    showNotification(
      "Fecha requerida",
      "Selecciona la fecha de inicio del permiso.",
      "info",
    );

    return false;
  }

  // ========================================
  // VALIDAR FECHA FINAL
  // ========================================

  if (!fechaFin) {
    showNotification(
      "Fecha requerida",
      "Selecciona la fecha de término del permiso.",
      "info",
    );

    return false;
  }

  // ========================================
  // VALIDAR RANGO DE FECHAS
  // ========================================

  const dias = calcularDiasPermiso(fechaInicio, fechaFin);

  if (dias <= 0) {
    showNotification(
      "Periodo no válido",
      "La fecha de término debe ser igual o posterior a la fecha de inicio.",
      "error",
    );

    return false;
  }

  // ========================================
  // BLOQUEAR FECHAS OCUPADAS POR VACACIONES
  // ========================================

  if (existeTraslapeVacaciones(fechaInicio, fechaFin)) {
    showNotification(
      "Fechas ocupadas",
      "El periodo seleccionado coincide con vacaciones registradas. Selecciona otras fechas.",
      "error",
    );

    return false;
  }

  // ========================================
  // EVITAR PERMISOS DUPLICADOS
  // ========================================

  const existePermisoDuplicado = periodosPermisosRegistrados.some(
    (periodo) =>
      fechaInicio <= periodo.fechaFin && fechaFin >= periodo.fechaInicio,
  );

  if (existePermisoDuplicado) {
    showNotification(
      "Permiso ya registrado",
      "El periodo seleccionado coincide con un permiso existente. Selecciona otras fechas.",
      "error",
    );

    return false;
  }

  // ========================================
  // VALIDAR TIPO DE PAGO
  // ========================================

  if (!pagoPermiso) {
    showNotification(
      "Pago requerido",
      "Selecciona si el permiso será con sueldo o sin sueldo.",
      "info",
    );

    return false;
  }

  // ========================================
  // GUARDAR DATOS VALIDADOS
  // ========================================

  solicitudVacaciones.diasSolicitados = dias;

  console.log("Permiso validado:", {
    fechaInicio,
    fechaFin,
    dias,
    pagoPermiso,
    comentarioPermiso,
  });

  return true;
}

// ========================================
// RESUMEN DE PERMISO
// ========================================

function resumenPermiso() {
  const tipo = "Permiso";

  const fechaInicio = formatearFechaSolicitud(solicitudVacaciones.fechaInicio);

  const fechaFin = formatearFechaSolicitud(solicitudVacaciones.fechaFin);

  const dias = calcularDiasPermiso(
    solicitudVacaciones.fechaInicio,
    solicitudVacaciones.fechaFin,
  );

  const pago =
    solicitudVacaciones.pagoPermiso === "con_sueldo"
      ? "Con sueldo"
      : "Sin sueldo";

  return `
    <div class="wizard-card fade-in">

      <div style="margin-bottom: 20px;">
        <h3 style="
          margin: 0 0 6px;
          color: var(--text-main);
        ">
          Revisión de solicitud
        </h3>

        <p style="
          margin: 0;
          color: var(--text-soft);
          font-size: 13px;
        ">
          Verifica que la información sea correcta antes de continuar.
        </p>
      </div>

      <div class="resume-box">

        <div>
          <span>Tipo de solicitud</span>
          <strong>Permiso</strong>
        </div>

        <div>
          <span>Tipo de permiso</span>
          <strong>${tipo}</strong>
        </div>

        <div>
          <span>Desde</span>
          <strong>${fechaInicio}</strong>
        </div>

        <div>
          <span>Hasta</span>
          <strong>${fechaFin}</strong>
        </div>

        <div>
          <span>Duración</span>
          <strong>
            ${dias} ${dias === 1 ? "día" : "días"}
          </strong>
        </div>

        <div>
          <span>Pago</span>
          <strong>${pago}</strong>
        </div>

      </div>

      ${
        solicitudVacaciones.comentarioPermiso
          ? `
            <div style="
              margin-top: 20px;
              padding: 14px 16px;
              border-radius: 12px;
              background: rgba(59, 130, 246, 0.08);
              border: 1px solid rgba(59, 130, 246, 0.16);
            ">
              <strong style="color: var(--text-main);">
                Comentario
              </strong>

              <p style="
                margin: 8px 0 0;
                color: var(--text-soft);
                font-size: 12px;
              ">
                ${solicitudVacaciones.comentarioPermiso}
              </p>
            </div>
          `
          : ""
      }

      <div style="
        margin-top: 20px;
        padding: 14px 16px;
        border-radius: 12px;
        background: rgba(34, 197, 94, 0.08);
        border: 1px solid rgba(34, 197, 94, 0.16);
      ">
        <strong style="color: var(--text-main);">
          Todo listo para continuar
        </strong>

        <p style="
          margin: 8px 0 0;
          color: var(--text-soft);
          font-size: 12px;
        ">
          Revisa los datos antes de enviar la solicitud.
        </p>
      </div>

    </div>
  `;
}

// ========================================
// PASO 2 - FORMULARIO DE VACACIONES
// ========================================

function inicializarFormularioVacaciones() {
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaFin = document.getElementById("fechaFin");

  if (!fechaInicio || !fechaFin) {
    return;
  }

  const hoy = obtenerFechaHoy();

  fechaInicio.value = "";
  fechaFin.value = "";

  fechaInicio.setCustomValidity("");
  fechaFin.setCustomValidity("");

  actualizarResumenFechas();

  inicializarCalendarioVacaciones();

  console.log("📅 Calendario personalizado de vacaciones inicializado");
}

// ========================================
// VALIDAR FECHAS
// ========================================

function validarRangoFechas() {
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaFin = document.getElementById("fechaFin");

  if (!fechaInicio || !fechaFin) {
    return false;
  }

  if (!fechaInicio.value || !fechaFin.value) {
    fechaFin.setCustomValidity("");
    return true;
  }

  const inicio = convertirFecha(fechaInicio.value);
  const fin = convertirFecha(fechaFin.value);

  if (!inicio || !fin) {
    return false;
  }

  const fechaMinima = obtenerFechaMinimaVacaciones();

  if (inicio < fechaMinima || fin < fechaMinima) {
    fechaFin.setCustomValidity(
      "Las vacaciones deben solicitarse a partir de mañana.",
    );

    return false;
  }

  if (fin < inicio) {
    fechaFin.setCustomValidity(
      "La fecha final no puede ser anterior a la fecha de inicio.",
    );

    return false;
  }

  if (existeTraslapeVacaciones(fechaInicio.value, fechaFin.value)) {
    fechaFin.setCustomValidity(
      "El periodo seleccionado ya contiene días solicitados anteriormente.",
    );

    return false;
  }

  fechaFin.setCustomValidity("");

  return true;
}

// ========================================
// CALCULAR DÍAS
// ========================================

function calcularDiasVacaciones(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return 0;
  }

  const inicio = convertirFecha(fechaInicio);
  const fin = convertirFecha(fechaFin);

  if (!inicio || !fin || fin < inicio) {
    return 0;
  }

  const diferencia = fin.getTime() - inicio.getTime();

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;

  return dias;
}

// ========================================
// ACTUALIZAR DÍAS SOLICITADOS
// ========================================

function actualizarDiasSolicitados() {
  const fechaInicio = document.getElementById("fechaInicio");

  const fechaFin = document.getElementById("fechaFin");

  const diasSolicitadosElement = document.getElementById("diasSolicitados");

  const diasRestantesElement = document.getElementById("diasRestantes");

  if (
    !fechaInicio ||
    !fechaFin ||
    !diasSolicitadosElement ||
    !diasRestantesElement
  ) {
    return;
  }

  if (!fechaInicio.value || !fechaFin.value) {
    diasSolicitadosElement.textContent = "—";

    diasRestantesElement.textContent = "—";

    solicitudVacaciones.fechaInicio = "";
    solicitudVacaciones.fechaFin = "";
    solicitudVacaciones.diasSolicitados = 0;
    solicitudVacaciones.saldoRestante = saldoDisponible;

    actualizarEstadoSaldo();

    return;
  }

  if (!validarRangoFechas()) {
    diasSolicitadosElement.textContent = "—";

    diasRestantesElement.textContent = "—";

    solicitudVacaciones.diasSolicitados = 0;

    actualizarEstadoSaldo();

    return;
  }

  const dias = calcularDiasVacaciones(fechaInicio.value, fechaFin.value);

  const restante = saldoDisponible - dias;

  solicitudVacaciones.fechaInicio = fechaInicio.value;

  solicitudVacaciones.fechaFin = fechaFin.value;

  solicitudVacaciones.diasSolicitados = dias;

  solicitudVacaciones.saldoAnterior = saldoDisponible;

  solicitudVacaciones.saldoRestante = restante;

  diasSolicitadosElement.textContent = `${dias} ${dias === 1 ? "día" : "días"}`;

  if (restante >= 0) {
    diasRestantesElement.textContent = `${restante} ${
      restante === 1 ? "día" : "días"
    }`;
  } else {
    diasRestantesElement.textContent = `${Math.abs(restante)} ${
      Math.abs(restante) === 1 ? "día excedido" : "días excedidos"
    }`;
  }

  actualizarEstadoSaldo();
}

// ========================================
// ESTADO DEL SALDO
// ========================================

function actualizarEstadoSaldo() {
  const balanceText = document.getElementById("balanceText");

  const balanceFill = document.getElementById("balanceFill");

  const balanceMessage = document.getElementById("balanceMessage");

  const dias = solicitudVacaciones.diasSolicitados;

  const restante = saldoDisponible - dias;
  actualizarEstadoBotonSiguiente();

  if (balanceText) {
    balanceText.textContent = `${Math.max(restante, 0)} / ${TOTAL_DIAS} días`;
  }

  if (balanceFill) {
    const porcentaje = Math.max(
      0,
      Math.min(100, (Math.max(restante, 0) / TOTAL_DIAS) * 100),
    );

    balanceFill.style.width = `${porcentaje}%`;
  }

  if (!balanceMessage) {
    return;
  }

  if (dias <= 0) {
    balanceMessage.textContent =
      "Selecciona las fechas para calcular los días solicitados.";

    balanceMessage.classList.remove("error");

    return;
  }

  if (restante < 0) {
    balanceMessage.textContent = `La solicitud excede tu saldo disponible por ${Math.abs(
      restante,
    )} ${Math.abs(restante) === 1 ? "día." : "días."}`;

    balanceMessage.classList.add("error");

    return;
  }

  balanceMessage.textContent =
    "Tienes suficientes días para realizar la solicitud.";

  balanceMessage.classList.remove("error");
}

function actualizarEstadoBotonSiguiente() {
  const boton = document.getElementById("btnSiguiente");

  if (!boton) {
    return;
  }

  const dias = Number(solicitudVacaciones.diasSolicitados) || 0;
  const excedeSaldo = dias > saldoDisponible;

  boton.disabled = excedeSaldo;

  boton.classList.toggle("saldo-insuficiente", excedeSaldo);

  if (excedeSaldo) {
    boton.title = `Saldo insuficiente: tienes ${saldoDisponible} días disponibles y seleccionaste ${dias}.`;
    boton.setAttribute("aria-disabled", "true");
  } else {
    boton.title = "";
    boton.removeAttribute("aria-disabled");
  }
}

// ========================================
// ACTUALIZAR RESUMEN SUPERIOR
// ========================================

function actualizarResumenFechas() {
  const saldoElement = document.getElementById("saldoDias");

  const diasElement = document.getElementById("diasSolicitados");

  const restantesElement = document.getElementById("diasRestantes");

  if (saldoElement) {
    saldoElement.textContent = `${saldoDisponible} días`;
  }

  if (diasElement) {
    diasElement.textContent = "—";
  }

  if (restantesElement) {
    restantesElement.textContent = "—";
  }

  actualizarEstadoSaldo();
}

// ========================================
// BARRA DE SALDO
// ========================================

function actualizarBarra(saldo) {
  saldoDisponible = Number(saldo) || 0;

  const balanceText = document.getElementById("balanceText");

  const balanceFill = document.getElementById("balanceFill");

  if (balanceText) {
    balanceText.textContent = `${saldoDisponible} / ${TOTAL_DIAS} días`;
  }

  if (balanceFill) {
    const porcentaje = Math.max(
      0,
      Math.min(100, (saldoDisponible / TOTAL_DIAS) * 100),
    );

    balanceFill.style.width = `${porcentaje}%`;
  }

  actualizarEstadoSaldo();
}

// ========================================
// CONVERTIR FECHA SIN PROBLEMAS DE ZONA HORARIA
// ========================================

function convertirFecha(valor) {
  if (!valor) {
    return null;
  }

  const partes = valor.split("-");

  if (partes.length !== 3) {
    return null;
  }

  const year = Number(partes[0]);

  const month = Number(partes[1]) - 1;

  const day = Number(partes[2]);

  const fecha = new Date(year, month, day);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
}

// ========================================
// FORMATEAR FECHA
// ========================================

function formatearFechaSolicitud(fecha) {
  if (!fecha) {
    return "—";
  }

  const fechaObj = convertirFecha(fecha);

  if (!fechaObj) {
    return "—";
  }

  return fechaObj.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ========================================
// VALIDAR PASO ACTUAL
// ========================================

function validarPasoVacaciones(step) {
  // -------------------------------
  // PASO 1
  // -------------------------------

  if (step === 1) {
    if (!tipoSolicitudSeleccionada) {
      showNotification(
        "Selecciona una solicitud",
        "Debes seleccionar el tipo de solicitud para continuar.",
        "info",
      );

      return false;
    }

    return true;
  }

  // -------------------------------
  // PASO 2
  // -------------------------------

  if (step === 2) {
    // ===============================
    // VALIDAR PERMISO
    // ===============================

    if (tipoSolicitudSeleccionada === "permiso") {
      const fechaInicio = document.getElementById("fechaInicioPermiso");
      const fechaFin = document.getElementById("fechaFinPermiso");
      const pago = document.getElementById("pagoPermiso");
      const comentario = document.getElementById("comentarioPermiso");

      if (!fechaInicio || !fechaFin || !pago || !comentario) {
        return false;
      }

      if (!fechaInicio.value) {
        showNotification(
          "Fecha requerida",
          "Selecciona la fecha de inicio del permiso.",
          "info",
        );

        return false;
      }

      if (!fechaFin.value) {
        showNotification(
          "Fecha requerida",
          "Selecciona la fecha de término del permiso.",
          "info",
        );

        return false;
      }

      const dias = calcularDiasPermiso(fechaInicio.value, fechaFin.value);

      if (dias <= 0) {
        showNotification(
          "Periodo no válido",
          "La fecha de término debe ser igual o posterior a la fecha de inicio.",
          "error",
        );

        return false;
      }

      if (!pago.value) {
        showNotification(
          "Pago requerido",
          "Selecciona si el permiso será con sueldo o sin sueldo.",
          "info",
        );

        return false;
      }

      solicitudVacaciones.fechaInicio = fechaInicio.value;
      solicitudVacaciones.fechaFin = fechaFin.value;
      solicitudVacaciones.diasSolicitados = dias;
      solicitudVacaciones.pagoPermiso = pago.value;
      solicitudVacaciones.comentarioPermiso = comentario.value.trim();

      return true;
    }

    // ===============================
    // VALIDAR VACACIONES
    // ===============================

    if (tipoSolicitudSeleccionada === "vacaciones") {
      const fechaInicio = document.getElementById("fechaInicio");
      const fechaFin = document.getElementById("fechaFin");

      if (!fechaInicio || !fechaFin) {
        return false;
      }

      if (!fechaInicio.value || !fechaFin.value) {
        showNotification(
          "Fechas requeridas",
          "Selecciona la fecha de inicio y la fecha final.",
          "info",
        );

        return false;
      }

      if (!validarRangoFechas()) {
        if (existeTraslapeVacaciones(fechaInicio.value, fechaFin.value)) {
          showNotification(
            "Periodo no disponible",
            "Las fechas seleccionadas ya contienen días de una solicitud anterior.",
            "error",
          );
        } else {
          showNotification(
            "Fechas no válidas",
            "La fecha final no puede ser anterior a la fecha de inicio.",
            "error",
          );
        }

        return false;
      }

      const dias = calcularDiasVacaciones(fechaInicio.value, fechaFin.value);

      if (dias <= 0) {
        return false;
      }

      if (dias > saldoDisponible) {
        showNotification(
          "Saldo insuficiente",
          `Has seleccionado ${dias} días y tu saldo disponible es de ${saldoDisponible} días.`,
          "error",
        );

        return false;
      }

      solicitudVacaciones.diasSolicitados = dias;

      return true;
    }

    // Los demás tipos de solicitud conservan
    // por ahora el comportamiento existente.
    return true;
  }

  // -------------------------------
  // PASO 3
  // -------------------------------

  if (step === 3) {
    if (tipoSolicitudSeleccionada === "vacaciones") {
      if (
        !solicitudVacaciones.fechaInicio ||
        !solicitudVacaciones.fechaFin ||
        solicitudVacaciones.diasSolicitados <= 0
      ) {
        return false;
      }
    }

    return true;
  }

  return true;
}

// ========================================
// RESUMEN DE VACACIONES
// ========================================

function resumenVacaciones() {
  const dias = solicitudVacaciones.diasSolicitados;

  const saldoAnterior = solicitudVacaciones.saldoAnterior;

  const saldoRestante = solicitudVacaciones.saldoRestante;

  return `

    <div class="wizard-card fade-in">

      <div style="
        margin-bottom: 20px;
      ">

        <h3 style="
          margin: 0 0 6px;
          color: var(--text-main);
        ">
          Revisión de solicitud
        </h3>

        <p style="
          margin: 0;
          color: var(--text-soft);
          font-size: 13px;
        ">
          Verifica que la información sea correcta antes de continuar.
        </p>

      </div>

      <div class="resume-box">

        <div>
          <span>Tipo de solicitud</span>

          <strong>
            ${obtenerNombreTipoSolicitud(tipoSolicitudSeleccionada)}
          </strong>
        </div>

        <div>
          <span>Fecha de inicio</span>

          <strong>
            ${formatearFechaSolicitud(solicitudVacaciones.fechaInicio)}
          </strong>
        </div>

        <div>
          <span>Fecha final</span>

          <strong>
            ${formatearFechaSolicitud(solicitudVacaciones.fechaFin)}
          </strong>
        </div>

        <div>
          <span>Días solicitados</span>

          <strong>
            ${dias}
            ${dias === 1 ? "día" : "días"}
          </strong>
        </div>

        <div>
          <span>Saldo disponible</span>

          <strong>
            ${saldoAnterior} días
          </strong>
        </div>

        <div>
          <span>Saldo después de la solicitud</span>

          <strong>
            ${saldoRestante} días
          </strong>
        </div>

      </div>

      <div style="
        margin-top: 20px;
        padding: 14px 16px;
        border-radius: 12px;
        background: rgba(34, 197, 94, 0.08);
        border: 1px solid rgba(34, 197, 94, 0.16);
      ">

        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
        ">

          <i
            class="fa-solid fa-circle-check"
            style="
              color: #16a34a;
              font-size: 18px;
            "
          ></i>

          <strong style="
            color: var(--text-main);
          ">
            Todo listo para continuar
          </strong>

        </div>

        <p style="
          margin: 8px 0 0 28px;
          color: var(--text-soft);
          font-size: 12px;
        ">
          Tu solicitud utiliza ${dias}
          ${dias === 1 ? "día" : "días"} de tu saldo disponible.
        </p>

      </div>

    </div>

  `;
}

// ========================================
// NOMBRE DEL TIPO
// ========================================

function obtenerNombreTipoSolicitud(tipo) {
  const nombres = {
    vacaciones: "Vacaciones",
    permiso: "Permiso",
    horas: "Horas extras",
    incapacidad: "Incapacidad",
  };

  return nombres[tipo] || "Solicitud";
}

// ========================================
// PASO 4 - CONFIRMACIÓN
// ========================================

function renderConfirmacion() {
  const esPermiso = tipoSolicitudSeleccionada === "permiso";

  let duracionConfirmacion = "";

  if (esPermiso) {
    const dias = calcularDiasPermiso(
      solicitudVacaciones.fechaInicio,
      solicitudVacaciones.fechaFin,
    );

    duracionConfirmacion = `${dias} ${dias === 1 ? "día" : "días"}`;
  } else {
    const dias = solicitudVacaciones.diasSolicitados;

    duracionConfirmacion = `${dias} ${dias === 1 ? "día" : "días"}`;
  }

  return `

    <div class="wizard-card fade-in">

      <div style="
        text-align: center;
        padding: 40px 20px;
      ">

        <div style="
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.12);
          color: #16a34a;
          font-size: 28px;
        ">

          <i class="fa-solid fa-check"></i>

        </div>

        <h3 style="
          margin: 0 0 8px;
          color: var(--text-main);
        ">
          Solicitud lista
        </h3>

        <p style="
          margin: 0;
          color: var(--text-soft);
          font-size: 13px;
        ">
          La solicitud está preparada para ser enviada.
        </p>

        <div style="
          margin-top: 20px;
          font-size: 12px;
          color: var(--text-soft);
        ">

          <strong style="
            color: var(--text-main);
          ">
            ${obtenerNombreTipoSolicitud(tipoSolicitudSeleccionada)}
          </strong>

          ·

          ${duracionConfirmacion}

        </div>

      </div>

    </div>

  `;
}

// ========================================
// EVENTO DE RENDER DEL WIZARD
// ========================================

document.addEventListener("wizard:render", function (event) {
  const step = event.detail.step;

  const dynamicForm = document.getElementById("dynamicForm");

  if (!dynamicForm) {
    return;
  }

  switch (step) {
    // ==================================
    // PASO 1
    // ==================================

    case 1:
      // ==================================
      // REINICIAR NUEVA SOLICITUD
      // ==================================

      actualizarSaldoDisponibleReal();

      solicitudActualRegistrada = false;

      tipoSolicitudSeleccionada = null;

      solicitudVacaciones = {
        tipo: null,
        fechaInicio: "",
        fechaFin: "",
        diasSolicitados: 0,
        saldoAnterior: saldoDisponible,
        saldoRestante: saldoDisponible,
      };

      // Restablecer el estado visual del botón
      actualizarEstadoBotonSiguiente();

      renderTiposSolicitud();

      break;

    // ==================================
    // PASO 2
    // ==================================

    case 2:
      if (tipoSolicitudSeleccionada === "vacaciones") {
        actualizarSaldoDisponibleReal();

        dynamicForm.innerHTML = formularioVacaciones();

        actualizarBarra(saldoDisponible);

        inicializarFormularioVacaciones();
      } else if (tipoSolicitudSeleccionada === "permiso") {
        renderFormularioPermiso();
      } else {
        dynamicForm.innerHTML = `
      <div class="wizard-card">

        <h3>
          Formulario de solicitud
        </h3>

        <p>
          El formulario para
          <strong>
            ${obtenerNombreTipoSolicitud(tipoSolicitudSeleccionada)}
          </strong>
          se integrará en el siguiente paso de desarrollo.
        </p>

      </div>
    `;
      }

      break;

    // ==================================
    // PASO 3
    // ==================================

    case 3:
      if (tipoSolicitudSeleccionada === "permiso") {
        dynamicForm.innerHTML = resumenPermiso();
      } else {
        dynamicForm.innerHTML = resumenVacaciones();
      }

      break;

    // ==================================
    // PASO 4
    // ==================================

    case 4:
      dynamicForm.innerHTML = renderConfirmacion();

      if (!solicitudActualRegistrada) {
        registrarSolicitudReciente();
        solicitudActualRegistrada = true;
      }

      break;
  }
});

// ========================================
// VALIDACIÓN DEL BOTÓN SIGUIENTE
// ========================================

document.addEventListener(
  "click",
  function (event) {
    const boton = event.target.closest("#btnSiguiente");

    if (!boton) {
      return;
    }

    /*
     * El wizard genérico puede encargarse
     * del cambio de paso.
     *
     * Aquí solamente validamos el paso
     * actual antes de permitir continuar.
     */

    const currentStepElement = document.getElementById("wizardCurrentStep");

    if (!currentStepElement) {
      return;
    }

    const currentStep = Number(currentStepElement.textContent);

    if (!validarPasoVacaciones(currentStep)) {
      event.stopImmediatePropagation();

      event.preventDefault();

      return;
    }

    console.log(`✅ Paso ${currentStep} validado`);
  },
  true,
);
