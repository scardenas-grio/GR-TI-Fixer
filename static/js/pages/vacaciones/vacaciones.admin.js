console.log("🚀 VACACIONES ADMIN JS CARGADO");
/* =========================================================
   VACACIONES - ADMINISTRACIÓN
   Datos simulados para pruebas de interfaz
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const tabSolicitud = document.getElementById("tabSolicitud");
  const tabAutorizaciones = document.getElementById("tabAutorizaciones");

  const solicitudView = document.getElementById("vacacionesSolicitudView");

  const autorizacionesView = document.getElementById(
    "vacacionesAutorizacionesView",
  );

  const searchInput = document.getElementById("adminSearch");

  const tipoSelect = document.getElementById("adminTipo");

  const estadoSelect = document.getElementById("adminEstado");

  const tableBody = document.getElementById("adminSolicitudesBody");

  const resultCount = document.getElementById("adminResultCount");

  const pendingCount = document.getElementById("adminPendingCount");

  const approvedCount = document.getElementById("adminApprovedCount");

  const rejectedCount = document.getElementById("adminRejectedCount");

  const totalCount = document.getElementById("adminTotalCount");

  const noResults = document.getElementById("adminNoResults");

  const refreshButton = document.getElementById("adminRefresh");

  /*
  ---------------------------------------------------------
  MODAL DE DETALLE
  ---------------------------------------------------------
  */

  const adminModal = document.getElementById("adminSolicitudModal");

  const adminModalOverlay = adminModal.querySelector(".admin-modal-overlay");

  const adminModalClose = document.getElementById("adminModalClose");

  const adminModalTitle = document.getElementById("adminModalTitle");

  const adminModalAvatar = document.getElementById("adminModalAvatar");

  const adminModalEmployee = document.getElementById("adminModalEmployee");

  const adminModalRequest = document.getElementById("adminModalRequest");

  const adminModalStatus = document.getElementById("adminModalStatus");

  const adminModalTipo = document.getElementById("adminModalTipo");

  const adminModalFecha = document.getElementById("adminModalFecha");

  const adminModalDuracion = document.getElementById("adminModalDuracion");

  const adminModalMotivo = document.getElementById("adminModalMotivo");

  const adminModalObservaciones = document.getElementById(
    "adminModalObservaciones",
  );

  const adminModalActions = document.getElementById("adminModalActions");

  const adminModalApprove = document.getElementById("adminModalApprove");

  const adminModalReject = document.getElementById("adminModalReject");

  let solicitudModalActual = null;

  /*
  ---------------------------------------------------------
  VALIDACIÓN
  ---------------------------------------------------------
  */

  if (
    !tabSolicitud ||
    !tabAutorizaciones ||
    !solicitudView ||
    !autorizacionesView
  ) {
    return;
  }

  /*
  ---------------------------------------------------------
  DATOS SIMULADOS
  ---------------------------------------------------------
  */

  let solicitudes = [
    {
      id: 1,
      empleado: "Juan Pérez",
      tipo: "vacaciones",
      tipoNombre: "Vacaciones",
      motivo: "Descanso anual",
      fecha: "24 Sep 2026",
      duracion: "5 días",
      estado: "pendiente",
      observaciones:
        "Solicita los días correspondientes a su periodo vacacional.",
    },

    {
      id: 2,
      empleado: "María López",
      tipo: "permiso",
      tipoNombre: "Permiso",
      motivo: "Cita médica",
      fecha: "25 Sep 2026",
      duracion: "3 horas",
      estado: "pendiente",
      observaciones: "Permiso solicitado para asistir a una cita médica.",
    },

    {
      id: 3,
      empleado: "Carlos Hernández",
      tipo: "horas",
      tipoNombre: "Horas extras",
      motivo: "Cobertura de turno",
      fecha: "26 Sep 2026",
      duracion: "4 horas",
      estado: "pendiente",
      observaciones: "Horas adicionales realizadas para cubrir un turno.",
    },

    {
      id: 4,
      empleado: "Ana García",
      tipo: "incapacidad",
      tipoNombre: "Incapacidad",
      motivo: "Incapacidad médica",
      fecha: "27 Sep 2026",
      duracion: "2 días",
      estado: "pendiente",
      observaciones:
        "Se presenta incapacidad médica correspondiente al periodo indicado.",
    },
  ];

  /*
  ---------------------------------------------------------
  FUNCIONES
  ---------------------------------------------------------
  */

  function obtenerIconoTipo(tipo) {
    const iconos = {
      vacaciones: "fa-solid fa-umbrella-beach",

      permiso: "fa-solid fa-file-check",

      horas: "fa-solid fa-clock",

      incapacidad: "fa-solid fa-bandage",
    };

    return iconos[tipo] || "fa-solid fa-file";
  }

  function obtenerClaseEstado(estado) {
    return `admin-status ${estado}`;
  }

  function obtenerTextoEstado(estado) {
    const textos = {
      pendiente: "Pendiente",

      aprobado: "Aprobado",

      rechazado: "Rechazado",
    };

    return textos[estado] || estado;
  }

  function actualizarContador() {
    const pendientes = solicitudes.filter(
      (solicitud) => solicitud.estado === "pendiente",
    ).length;

    const aprobadas = solicitudes.filter(
      (solicitud) => solicitud.estado === "aprobado",
    ).length;

    const rechazadas = solicitudes.filter(
      (solicitud) => solicitud.estado === "rechazado",
    ).length;

    const total = solicitudes.length;

    pendingCount.textContent = pendientes;
    approvedCount.textContent = aprobadas;
    rejectedCount.textContent = rechazadas;
    totalCount.textContent = total;
  }

  function renderSolicitudes() {
    const texto = (searchInput.value || "").trim().toLowerCase();

    const tipo = tipoSelect.value;
    const estado = estadoSelect.value;

    const filtradas = solicitudes.filter((solicitud) => {
      const coincideTexto =
        !texto ||
        solicitud.empleado.toLowerCase().includes(texto) ||
        solicitud.motivo.toLowerCase().includes(texto);

      const coincideTipo = tipo === "todos" || solicitud.tipo === tipo;

      const coincideEstado = estado === "todos" || solicitud.estado === estado;

      return coincideTexto && coincideTipo && coincideEstado;
    });

    tableBody.innerHTML = "";

    filtradas.forEach((solicitud) => {
      const row = document.createElement("tr");

      row.innerHTML = `

        <td>
          <div class="admin-employee">

            <div class="admin-avatar">
              ${solicitud.empleado.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <strong>
                ${solicitud.empleado}
              </strong>

              <small>
                Solicitud #${solicitud.id}
              </small>
            </div>

          </div>
        </td>


        <td>

          <div class="admin-type">

            <span class="admin-type-icon ${solicitud.tipo}">
              <i class="${obtenerIconoTipo(solicitud.tipo)}"></i>
            </span>

            <span>
              ${solicitud.tipoNombre}
            </span>

          </div>

        </td>


        <td>
          ${solicitud.motivo}
        </td>


        <td>
          ${solicitud.fecha}
        </td>


        <td>
          ${solicitud.duracion}
        </td>


        <td>

          <span class="${obtenerClaseEstado(solicitud.estado)}">
            ${obtenerTextoEstado(solicitud.estado)}
          </span>

        </td>


        <td>

          <div class="admin-actions">

            <button
              type="button"
              class="admin-action-btn view"
              data-action="view"
              data-id="${solicitud.id}"
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
                  data-id="${solicitud.id}"
                  title="Aprobar"
                >
                  <i class="fa-solid fa-check"></i>
                </button>


                <button
                  type="button"
                  class="admin-action-btn reject"
                  data-action="reject"
                  data-id="${solicitud.id}"
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

      tableBody.appendChild(row);
    });

    resultCount.textContent = `${filtradas.length} ${
      filtradas.length === 1 ? "solicitud" : "solicitudes"
    } encontradas`;

    noResults.hidden = filtradas.length !== 0;

    actualizarContador();
  }

  /*
  ---------------------------------------------------------
  CAMBIO DE VISTA
  ---------------------------------------------------------
  */

  function mostrarSolicitud() {
    // Mostrar Solicitud
    solicitudView.hidden = false;
    solicitudView.removeAttribute("hidden");
    solicitudView.classList.remove("vista-oculta");

    // Ocultar Autorizaciones
    autorizacionesView.hidden = true;
    autorizacionesView.setAttribute("hidden", "");
    autorizacionesView.classList.add("vista-oculta");

    // Tabs
    tabSolicitud.classList.add("active");
    tabAutorizaciones.classList.remove("active");
  }

  function mostrarAutorizaciones() {
    // Ocultar Solicitud
    solicitudView.hidden = true;
    solicitudView.setAttribute("hidden", "");
    solicitudView.classList.add("vista-oculta");

    // Mostrar Autorizaciones
    autorizacionesView.hidden = false;
    autorizacionesView.removeAttribute("hidden");
    autorizacionesView.classList.remove("vista-oculta");

    // Tabs
    tabSolicitud.classList.remove("active");
    tabAutorizaciones.classList.add("active");

    // Renderizar solicitudes
    renderSolicitudes();
  }

  function abrirModalSolicitud(solicitud) {
    solicitudModalActual = solicitud;

    const iniciales = solicitud.empleado
      .split(" ")
      .slice(0, 2)
      .map((nombre) => nombre.charAt(0))
      .join("")
      .toUpperCase();

    adminModalTitle.textContent = `Solicitud #${solicitud.id}`;

    adminModalAvatar.textContent = iniciales;

    adminModalEmployee.textContent = solicitud.empleado;

    adminModalRequest.textContent = `Solicitud #${solicitud.id}`;

    adminModalTipo.textContent = solicitud.tipoNombre;

    adminModalFecha.textContent = solicitud.fecha;

    adminModalDuracion.textContent = solicitud.duracion;

    adminModalMotivo.textContent = solicitud.motivo;

    adminModalObservaciones.textContent =
      solicitud.observaciones || "Sin observaciones registradas.";

    actualizarEstadoModal(solicitud.estado);

    adminModal.classList.add("open");

    adminModal.setAttribute("aria-hidden", "false");
  }

  function actualizarEstadoModal(estado) {
    adminModalStatus.className = `admin-status ${estado}`;

    adminModalStatus.textContent = obtenerTextoEstado(estado);

    const pendiente = estado === "pendiente";

    adminModalActions.style.display = pendiente ? "flex" : "none";
  }

  function cerrarModalSolicitud() {
    adminModal.classList.remove("open");

    adminModal.setAttribute("aria-hidden", "true");

    solicitudModalActual = null;
  }

  /*
  ---------------------------------------------------------
  EVENTOS DE TABS
  ---------------------------------------------------------
  */

  tabSolicitud.addEventListener("click", mostrarSolicitud);

  tabAutorizaciones.addEventListener("click", mostrarAutorizaciones);

  /*
  ---------------------------------------------------------
  FILTROS
  ---------------------------------------------------------
  */

  searchInput.addEventListener("input", renderSolicitudes);

  tipoSelect.addEventListener("change", renderSolicitudes);

  estadoSelect.addEventListener("change", renderSolicitudes);

  refreshButton.addEventListener("click", renderSolicitudes);

  /*
  ---------------------------------------------------------
  ACCIONES DE TABLA
  ---------------------------------------------------------
  */

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    const id = Number(button.dataset.id);

    const action = button.dataset.action;

    const solicitud = solicitudes.find((item) => item.id === id);

    if (!solicitud) {
      return;
    }

    /*
      VER DETALLE
      */

    if (action === "view") {
      if (action === "view") {
        abrirModalSolicitud(solicitud);

        return;
      }

      return;
    }

    /*
      APROBAR
      */

    if (action === "approve") {
      solicitud.estado = "aprobado";

      renderSolicitudes();

      return;
    }

    /*
      RECHAZAR
      */

    if (action === "reject") {
      solicitud.estado = "rechazado";

      renderSolicitudes();

      return;
    }
  });

  /*
  ---------------------------------------------------------
  EVENTOS DEL MODAL
  ---------------------------------------------------------
  */

  adminModalClose.addEventListener("click", cerrarModalSolicitud);

  adminModalOverlay.addEventListener("click", cerrarModalSolicitud);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && adminModal.classList.contains("open")) {
      cerrarModalSolicitud();
    }
  });

  adminModalApprove.addEventListener("click", () => {
    if (!solicitudModalActual) {
      return;
    }

    solicitudModalActual.estado = "aprobado";

    actualizarContador();
    renderSolicitudes();
    cerrarModalSolicitud();
  });

  adminModalReject.addEventListener("click", () => {
    if (!solicitudModalActual) {
      return;
    }

    solicitudModalActual.estado = "rechazado";

    actualizarContador();
    renderSolicitudes();
    cerrarModalSolicitud();
  });

  /*
  ---------------------------------------------------------
  ESTADO INICIAL
  ---------------------------------------------------------
  */

  mostrarSolicitud();
});
