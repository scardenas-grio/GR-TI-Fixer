/* ==========================================================
   VACACIONES STORE
   Gestión centralizada de solicitudes de vacaciones y permisos
   ========================================================== */

(function (window) {
  "use strict";

  // ----------------------------------------------------------
  // CONFIGURACIÓN
  // ----------------------------------------------------------

  const STORAGE_KEY = "tiFixer.vacaciones.solicitudes.v1";

  const ESTADOS = Object.freeze({
    PENDIENTE: "pendiente",
    APROBADO: "aprobado",
    RECHAZADO: "rechazado",
  });

  const TIPOS = Object.freeze({
    VACACIONES: "vacaciones",
    PERMISO: "permiso",
    HORAS: "horas",
    INCAPACIDAD: "incapacidad",
  });

  // ----------------------------------------------------------
  // UTILIDADES
  // ----------------------------------------------------------

  function generarId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `solicitud-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function obtenerFechaActual() {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  function clonarSolicitud(solicitud) {
    return { ...solicitud };
  }

  // ----------------------------------------------------------
  // PERSISTENCIA
  // ----------------------------------------------------------

  function leerSolicitudes() {
    try {
      const contenido = window.localStorage.getItem(STORAGE_KEY);

      if (!contenido) {
        return [];
      }

      const solicitudes = JSON.parse(contenido);

      if (!Array.isArray(solicitudes)) {
        console.error("[VacacionesStore] El formato almacenado no es válido.");

        return [];
      }

      return solicitudes;
    } catch (error) {
      console.error(
        "[VacacionesStore] No fue posible leer las solicitudes:",
        error,
      );

      return [];
    }
  }

  function guardarSolicitudes(solicitudes) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));

      return true;
    } catch (error) {
      console.error(
        "[VacacionesStore] No fue posible guardar las solicitudes:",
        error,
      );

      return false;
    }
  }

  // ----------------------------------------------------------
  // NOTIFICACIONES DE CAMBIOS
  // ----------------------------------------------------------

  function notificarCambio(accion, solicitud) {
    const evento = new CustomEvent("vacaciones:solicitudes-cambio", {
      detail: {
        accion,
        solicitud: solicitud ? clonarSolicitud(solicitud) : null,
        solicitudes: listar(),
      },
    });

    window.dispatchEvent(evento);
  }

  // ----------------------------------------------------------
  // CONSULTAS
  // ----------------------------------------------------------

  function listar() {
    return leerSolicitudes().map(clonarSolicitud);
  }

  function obtenerPorId(id) {
    if (!id) {
      return null;
    }

    const solicitud = leerSolicitudes().find(
      (item) => String(item.id) === String(id),
    );

    return solicitud ? clonarSolicitud(solicitud) : null;
  }

  function listarPorEstado(estado) {
    return listar().filter((solicitud) => solicitud.estado === estado);
  }

  // ----------------------------------------------------------
  // CREAR SOLICITUD
  // ----------------------------------------------------------

  function crear(datos) {
    if (!datos || typeof datos !== "object") {
      throw new Error("Los datos de la solicitud no son válidos.");
    }

    const tipo = String(datos.tipo || "")
      .trim()
      .toLowerCase();

    if (!Object.values(TIPOS).includes(tipo)) {
      throw new Error("El tipo de solicitud no es válido.");
    }

    const fechaInicio = String(datos.fechaInicio || "").trim();

    const fechaFin = String(datos.fechaFin || "").trim();

    if (!fechaInicio || !fechaFin) {
      throw new Error(
        "La solicitud debe incluir fecha de inicio y fecha de fin.",
      );
    }

    if (fechaFin < fechaInicio) {
      throw new Error(
        "La fecha final no puede ser anterior a la fecha inicial.",
      );
    }

    const solicitudes = leerSolicitudes();

    const ahora = new Date().toISOString();

    const nuevaSolicitud = {
      ...datos,

      id: generarId(),

      tipo,

      fechaInicio,
      fechaFin,

      estado: ESTADOS.PENDIENTE,

      fechaRegistro: ahora,

      fechaActualizacion: ahora,

      fechaResolucion: null,
    };

    solicitudes.push(nuevaSolicitud);

    if (!guardarSolicitudes(solicitudes)) {
      throw new Error(
        "No se pudo guardar la solicitud. Revisa el almacenamiento del navegador.",
      );
    }

    notificarCambio("crear", nuevaSolicitud);

    return clonarSolicitud(nuevaSolicitud);
  }

  // ----------------------------------------------------------
  // ACTUALIZAR ESTADO
  // ----------------------------------------------------------

  function actualizarEstado(id, nuevoEstado) {
    if (!id) {
      throw new Error("Se necesita el identificador de la solicitud.");
    }

    if (
      ![ESTADOS.PENDIENTE, ESTADOS.APROBADO, ESTADOS.RECHAZADO].includes(
        nuevoEstado,
      )
    ) {
      throw new Error("El estado de la solicitud no es válido.");
    }

    const solicitudes = leerSolicitudes();

    const indice = solicitudes.findIndex(
      (item) => String(item.id) === String(id),
    );

    if (indice === -1) {
      throw new Error("No se encontró la solicitud que deseas actualizar.");
    }

    const solicitudActual = solicitudes[indice];

    // Evitamos registrar cambios innecesarios.
    if (solicitudActual.estado === nuevoEstado) {
      return clonarSolicitud(solicitudActual);
    }

    const ahora = new Date().toISOString();

    solicitudes[indice] = {
      ...solicitudActual,

      estado: nuevoEstado,

      fechaActualizacion: ahora,

      fechaResolucion: nuevoEstado === ESTADOS.PENDIENTE ? null : ahora,
    };

    if (!guardarSolicitudes(solicitudes)) {
      throw new Error("No se pudo guardar el cambio de estado.");
    }

    notificarCambio("actualizarEstado", solicitudes[indice]);

    return clonarSolicitud(solicitudes[indice]);
  }

  // ----------------------------------------------------------
  // API PÚBLICA
  // ----------------------------------------------------------

  const VacacionesStore = Object.freeze({
    ESTADOS,
    TIPOS,

    listar,
    obtenerPorId,
    listarPorEstado,

    crear,
    actualizarEstado,

    obtenerFechaActual,
  });

  // Exponemos el store para los demás scripts clásicos.
  window.VacacionesStore = VacacionesStore;

  console.info("[VacacionesStore] Inicializado correctamente.");
})(window);
