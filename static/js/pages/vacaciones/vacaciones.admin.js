console.log("🚀 VACACIONES ADMIN JS CARGADO");

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const store = window.VacacionesStore;
  const $ = (id) => document.getElementById(id);

  const tabSolicitud = $("tabSolicitud");
  const tabAutorizaciones = $("tabAutorizaciones");
  const solicitudView = $("vacacionesSolicitudView");
  const autorizacionesView = $("vacacionesAutorizacionesView");

  const searchInput = $("adminSearch");
  const tipoSelect = $("adminTipo");
  const estadoSelect = $("adminEstado");
  const tableBody = $("adminSolicitudesBody");
  const resultCount = $("adminResultCount");
  const pendingCount = $("adminPendingCount");
  const approvedCount = $("adminApprovedCount");
  const rejectedCount = $("adminRejectedCount");
  const totalCount = $("adminTotalCount");
  const noResults = $("adminNoResults");
  const refreshButton = $("adminRefresh");
  const modal = $("adminSolicitudModal");

  if (
    !store ||
    !modal ||
    !tabSolicitud ||
    !tabAutorizaciones ||
    !solicitudView ||
    !autorizacionesView ||
    !tableBody
  ) {
    console.error("[VacacionesAdmin] Faltan elementos HTML o VacacionesStore.");
    return;
  }

  const modalOverlay = modal.querySelector(".admin-modal-overlay");
  const modalClose = $("adminModalClose");
  const modalTitle = $("adminModalTitle");
  const modalAvatar = $("adminModalAvatar");
  const modalEmployee = $("adminModalEmployee");
  const modalRequest = $("adminModalRequest");
  const modalStatus = $("adminModalStatus");
  const modalTipo = $("adminModalTipo");
  const modalFecha = $("adminModalFecha");
  const modalDuracion = $("adminModalDuracion");
  const modalMotivo = $("adminModalMotivo");
  const modalObservaciones = $("adminModalObservaciones");
  const modalActions = $("adminModalActions");
  const modalApprove = $("adminModalApprove");
  const modalReject = $("adminModalReject");

  let solicitudModalActual = null;

  const required = [
    searchInput,
    tipoSelect,
    estadoSelect,
    resultCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalCount,
    noResults,
    refreshButton,
    modalOverlay,
    modalClose,
    modalTitle,
    modalAvatar,
    modalEmployee,
    modalRequest,
    modalStatus,
    modalTipo,
    modalFecha,
    modalDuracion,
    modalMotivo,
    modalObservaciones,
    modalActions,
    modalApprove,
    modalReject,
  ];

  if (required.some((element) => !element)) {
    console.error(
      "[VacacionesAdmin] Faltan controles del panel administrativo.",
    );
    return;
  }

  if (
    typeof store.listar !== "function" ||
    typeof store.crear !== "function" ||
    typeof store.actualizarEstado !== "function"
  ) {
    console.error(
      "[VacacionesAdmin] La API de VacacionesStore está incompleta.",
    );
    return;
  }

  // =========================================================
  // MIGRACIÓN DE SOLICITUDES DE DEMOSTRACIÓN
  // =========================================================

  const MIGRATION_KEY = "tiFixer.vacaciones.admin.samplesMigrated.v1";

  function migrarEjemplos() {
    try {
      if (localStorage.getItem(MIGRATION_KEY) === "true") {
        return;
      }

      // No eliminamos las solicitudes que ya existen.
      const ejemplos = [
        {
          empleado: "Juan Pérez",
          tipo: "vacaciones",
          tipoNombre: "Vacaciones",
          motivo: "Descanso anual",
          fechaInicio: "2026-09-24",
          fechaFin: "2026-09-28",
          diasSolicitados: 5,
          duracion: "5 días",
          estado: "pendiente",
          observaciones:
            "Solicita los días correspondientes a su periodo vacacional.",
        },
        {
          empleado: "María López",
          tipo: "permiso",
          tipoNombre: "Permiso",
          motivo: "Cita médica",
          fechaInicio: "2026-09-25",
          fechaFin: "2026-09-25",
          diasSolicitados: 3,
          duracion: "3 horas",
          estado: "pendiente",
          observaciones: "Permiso solicitado para asistir a una cita médica.",
        },
        {
          empleado: "Carlos Hernández",
          tipo: "horas",
          tipoNombre: "Horas extras",
          motivo: "Cobertura de turno",
          fechaInicio: "2026-09-26",
          fechaFin: "2026-09-26",
          diasSolicitados: 4,
          duracion: "4 horas",
          estado: "pendiente",
          observaciones: "Horas adicionales realizadas para cubrir un turno.",
        },
        {
          empleado: "Ana García",
          tipo: "incapacidad",
          tipoNombre: "Incapacidad",
          motivo: "Incapacidad médica",
          fechaInicio: "2026-09-27",
          fechaFin: "2026-09-28",
          diasSolicitados: 2,
          duracion: "2 días",
          estado: "pendiente",
          observaciones:
            "Se presenta incapacidad médica correspondiente al periodo indicado.",
        },
      ];

      ejemplos.forEach((ejemplo) => {
        store.crear(ejemplo);
      });

      localStorage.setItem(MIGRATION_KEY, "true");

      console.info(
        "[VacacionesAdmin] Ejemplos migrados al almacenamiento central.",
      );
    } catch (error) {
      console.error("[VacacionesAdmin] Error al migrar los ejemplos:", error);
    }
  }

  migrarEjemplos();

  // =========================================================
  // FUNCIONES AUXILIARES
  // =========================================================

  function nombreTipo(tipo) {
    const nombres = {
      vacaciones: "Vacaciones",
      permiso: "Permiso",
      horas: "Horas extras",
      incapacidad: "Incapacidad",
    };

    return nombres[tipo] || "Solicitud";
  }

  function fechaBonita(fechaISO) {
    if (!fechaISO || !/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
      return fechaISO || "Fecha pendiente";
    }

    const [anio, mes, dia] = fechaISO.split("-").map(Number);

    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(anio, mes - 1, dia));
  }

  function adaptarSolicitud(solicitud) {
    const inicio = solicitud.fechaInicio || "";
    const fin = solicitud.fechaFin || inicio;
    const dias = Number(solicitud.diasSolicitados) || 0;

    let fecha = "Fecha pendiente";

    if (inicio) {
      fecha =
        fin && fin !== inicio
          ? `${fechaBonita(inicio)} – ${fechaBonita(fin)}`
          : fechaBonita(inicio);
    }

    return {
      ...solicitud,
      empleado: solicitud.empleado || "Empleado de prueba",
      tipo: solicitud.tipo || "permiso",
      tipoNombre: solicitud.tipoNombre || nombreTipo(solicitud.tipo),
      motivo:
        solicitud.motivo ||
        solicitud.comentarioPermiso ||
        "Sin motivo especificado",
      fecha,
      duracion: solicitud.duracion || `${dias} ${dias === 1 ? "día" : "días"}`,
      observaciones:
        solicitud.observaciones || solicitud.comentarioPermiso || "",
      estado: solicitud.estado || "pendiente",
    };
  }

  function obtenerSolicitudes() {
    return store
      .listar()
      .map(adaptarSolicitud)
      .sort((a, b) =>
        String(b.fechaRegistro || "").localeCompare(
          String(a.fechaRegistro || ""),
        ),
      );
  }

  function obtenerIconoTipo(tipo) {
    const iconos = {
      vacaciones: "fa-solid fa-umbrella-beach",
      permiso: "fa-solid fa-file-check",
      horas: "fa-solid fa-clock",
      incapacidad: "fa-solid fa-bandage",
    };

    return iconos[tipo] || "fa-solid fa-file";
  }

  function obtenerTextoEstado(estado) {
    const textos = {
      pendiente: "Pendiente",
      aprobado: "Aprobado",
      rechazado: "Rechazado",
    };

    return textos[estado] || estado;
  }

  function escaparHTML(valor) {
    return String(valor ?? "").replace(
      /[&<>"']/g,
      (caracter) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[caracter],
    );
  }

  // =========================================================
  // CONTADORES
  // =========================================================

  function actualizarContadores(solicitudes) {
    pendingCount.textContent = solicitudes.filter(
      (s) => s.estado === "pendiente",
    ).length;

    approvedCount.textContent = solicitudes.filter(
      (s) => s.estado === "aprobado",
    ).length;

    rejectedCount.textContent = solicitudes.filter(
      (s) => s.estado === "rechazado",
    ).length;

    totalCount.textContent = solicitudes.length;
  }

  // =========================================================
  // RENDERIZAR TABLA
  // =========================================================

  function renderSolicitudes() {
    const todas = obtenerSolicitudes();

    const texto = (searchInput.value || "").trim().toLowerCase();

    const tipo = tipoSelect.value;
    const estado = estadoSelect.value;

    const filtradas = todas.filter((solicitud) => {
      const coincideTexto =
        !texto ||
        solicitud.empleado.toLowerCase().includes(texto) ||
        solicitud.motivo.toLowerCase().includes(texto) ||
        solicitud.tipoNombre.toLowerCase().includes(texto) ||
        String(solicitud.id).toLowerCase().includes(texto);

      const coincideTipo = tipo === "todos" || solicitud.tipo === tipo;

      const coincideEstado = estado === "todos" || solicitud.estado === estado;

      return coincideTexto && coincideTipo && coincideEstado;
    });

    tableBody.innerHTML = "";

    filtradas.forEach((solicitud) => {
      const fila = document.createElement("tr");

      fila.dataset.solicitudId = solicitud.id;

      fila.innerHTML = `
        <td>
          <div class="admin-employee">
            <div class="admin-avatar">
              ${escaparHTML(solicitud.empleado.substring(0, 2).toUpperCase())}
            </div>

            <div>
              <strong>${escaparHTML(solicitud.empleado)}</strong>
              <small>
                Solicitud #${escaparHTML(solicitud.id)}
              </small>
            </div>
          </div>
        </td>

        <td>
          <div class="admin-type">
            <span class="admin-type-icon ${escaparHTML(solicitud.tipo)}">
              <i class="${obtenerIconoTipo(solicitud.tipo)}"></i>
            </span>

            <span>${escaparHTML(solicitud.tipoNombre)}</span>
          </div>
        </td>

        <td>${escaparHTML(solicitud.motivo)}</td>

        <td>${escaparHTML(solicitud.fecha)}</td>

        <td>${escaparHTML(solicitud.duracion)}</td>

        <td>
          <span class="admin-status ${escaparHTML(solicitud.estado)}">
            ${obtenerTextoEstado(solicitud.estado)}
          </span>
        </td>

        <td>
          <div class="admin-actions">
            <button
              type="button"
              class="admin-action-btn view"
              data-action="view"
              data-id="${escaparHTML(solicitud.id)}"
              title="Ver detalle"
            >
              <i class="fa-solid fa-eye"></i>
            </button>

            ${
              solicitud.estado === "pendiente"
                ? `
                  <button
                    type="button"
                    class="admin-action-btn approve"
                    data-action="approve"
                    data-id="${escaparHTML(solicitud.id)}"
                    title="Aprobar"
                  >
                    <i class="fa-solid fa-check"></i>
                  </button>

                  <button
                    type="button"
                    class="admin-action-btn reject"
                    data-action="reject"
                    data-id="${escaparHTML(solicitud.id)}"
                    title="Rechazar"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                `
                : ""
            }
          </div>
        </td>
      `;

      tableBody.appendChild(fila);
    });

    resultCount.textContent = `${filtradas.length} ${
      filtradas.length === 1 ? "solicitud" : "solicitudes"
    } encontradas`;

    noResults.hidden = filtradas.length !== 0;

    actualizarContadores(todas);
  }

  // =========================================================
  // CAMBIO DE VISTAS
  // =========================================================

  function mostrarSolicitud() {
    solicitudView.hidden = false;
    solicitudView.removeAttribute("hidden");
    solicitudView.classList.remove("vista-oculta");

    autorizacionesView.hidden = true;
    autorizacionesView.setAttribute("hidden", "");
    autorizacionesView.classList.add("vista-oculta");

    tabSolicitud.classList.add("active");
    tabAutorizaciones.classList.remove("active");
  }

  function mostrarAutorizaciones() {
    solicitudView.hidden = true;
    solicitudView.setAttribute("hidden", "");
    solicitudView.classList.add("vista-oculta");

    autorizacionesView.hidden = false;
    autorizacionesView.removeAttribute("hidden");
    autorizacionesView.classList.remove("vista-oculta");

    tabSolicitud.classList.remove("active");
    tabAutorizaciones.classList.add("active");

    renderSolicitudes();
  }

  // =========================================================
  // MODAL DE DETALLES
  // =========================================================

  function actualizarEstadoModal(estado) {
    modalStatus.className = `admin-status ${estado}`;
    modalStatus.textContent = obtenerTextoEstado(estado);

    modalActions.style.display = estado === "pendiente" ? "flex" : "none";
  }

  function abrirModalSolicitud(solicitud) {
    solicitudModalActual = solicitud;

    const iniciales = solicitud.empleado
      .split(" ")
      .slice(0, 2)
      .map((nombre) => nombre.charAt(0))
      .join("")
      .toUpperCase();

    modalTitle.textContent = `Solicitud #${solicitud.id}`;

    modalAvatar.textContent = iniciales;
    modalEmployee.textContent = solicitud.empleado;
    modalRequest.textContent = `Solicitud #${solicitud.id}`;

    modalTipo.textContent = solicitud.tipoNombre;
    modalFecha.textContent = solicitud.fecha;
    modalDuracion.textContent = solicitud.duracion;
    modalMotivo.textContent = solicitud.motivo;

    modalObservaciones.textContent =
      solicitud.observaciones || "Sin observaciones registradas.";

    actualizarEstadoModal(solicitud.estado);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function cerrarModalSolicitud() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    solicitudModalActual = null;
  }

  // =========================================================
  // APROBAR Y RECHAZAR
  // =========================================================

  function cambiarEstadoSolicitud(id, nuevoEstado) {
    try {
      store.actualizarEstado(id, nuevoEstado);

      renderSolicitudes();
      cerrarModalSolicitud();

      console.info(`[VacacionesAdmin] Solicitud ${id}: ${nuevoEstado}`);
    } catch (error) {
      console.error(
        "[VacacionesAdmin] No se pudo actualizar el estado:",
        error,
      );

      alert(
        "No fue posible actualizar la solicitud. Revisa la consola e inténtalo nuevamente.",
      );
    }
  }

  // =========================================================
  // EVENTOS
  // =========================================================

  tabSolicitud.addEventListener("click", mostrarSolicitud);

  tabAutorizaciones.addEventListener("click", mostrarAutorizaciones);

  searchInput.addEventListener("input", renderSolicitudes);

  tipoSelect.addEventListener("change", renderSolicitudes);

  estadoSelect.addEventListener("change", renderSolicitudes);

  refreshButton.addEventListener("click", renderSolicitudes);

  tableBody.addEventListener("click", (event) => {
    const boton = event.target.closest("[data-action]");

    if (!boton) return;

    const id = boton.dataset.id;

    const solicitud = obtenerSolicitudes().find(
      (item) => String(item.id) === String(id),
    );

    if (!solicitud) {
      console.warn("[VacacionesAdmin] Solicitud no encontrada:", id);
      return;
    }

    const accion = boton.dataset.action;

    if (accion === "view") {
      abrirModalSolicitud(solicitud);
    }

    if (accion === "approve") {
      cambiarEstadoSolicitud(id, "aprobado");
    }

    if (accion === "reject") {
      cambiarEstadoSolicitud(id, "rechazado");
    }
  });

  modalClose.addEventListener("click", cerrarModalSolicitud);

  modalOverlay.addEventListener("click", cerrarModalSolicitud);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      cerrarModalSolicitud();
    }
  });

  modalApprove.addEventListener("click", () => {
    if (!solicitudModalActual) return;

    cambiarEstadoSolicitud(solicitudModalActual.id, "aprobado");
  });

  modalReject.addEventListener("click", () => {
    if (!solicitudModalActual) return;

    cambiarEstadoSolicitud(solicitudModalActual.id, "rechazado");
  });

  // Actualizar la tabla cuando el store emita cambios.
  window.addEventListener("vacaciones:solicitudes-cambio", renderSolicitudes);

  // Actualizar si otra pestaña del mismo origen modifica el store.
  window.addEventListener("storage", (event) => {
    if (event.key === "tiFixer.vacaciones.solicitudes.v1") {
      renderSolicitudes();
    }
  });

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================

  mostrarSolicitud();
  renderSolicitudes();
});
