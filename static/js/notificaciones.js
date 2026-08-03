function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function cargarNotificaciones() {
  try {
    const data = await apiFetch("/api/notificaciones");

    if (!data) return;

    const badge = document.getElementById("badgeNotificaciones");
    if (badge) badge.innerText = data.total || 0;

    const lista = document.getElementById("listaNotificaciones");
    if (!lista) return;

    lista.innerHTML = "";

    (data.data || []).forEach((n) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="notif-item">
          <div class="notif-msg">${escapeHTML(n.mensaje)}</div>
          <div class="notif-date">${escapeHTML(n.fecha)}</div>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    console.log("Error notificaciones:", err);
  }
}

async function limpiarNotificaciones() {
  // 🔥 opcional backend
  try {
    await fetch("/api/notificaciones/leer", { method: "POST" });
  } catch (e) {}

  // frontend
  const badge = document.getElementById("badgeNotificaciones");

  if (badge) {
    badge.innerText = "0";
    badge.style.display = "none";
  }
}

function formatearFecha(fecha) {
  const now = new Date();
  const f = new Date(fecha);

  const diff = Math.floor((now - f) / 1000);

  if (diff < 60) return "Hace unos segundos";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;

  return f.toLocaleDateString();
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");

  if (!container) return;

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-title">
      ${
        type === "success"
          ? "Éxito"
          : type === "error"
            ? "Error"
            : "Información"
      }
    </div>

    <div class="toast-message">
      ${message}
    </div>

    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4500);
}

function mostrarToast(mensaje, tipo = "info") {
  showToast(mensaje, tipo);
}

async function abrirNotificaciones() {
  const panel = document.getElementById("panelNotificaciones");
  panel.classList.toggle("activo");

  // 🔥 1. cargar notificaciones
  const res = await fetch("/api/notificaciones");
  const result = await res.json();

  const lista = document.getElementById("listaNotificaciones");
  lista.innerHTML = "";

  result.data.forEach((n) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="notif-item">
        <div class="notif-msg">${n.mensaje}</div>
        <div class="notif-time">${formatearFecha(n.fecha)}</div>
      </div>
    `;

    lista.appendChild(li);
  });

  // 🔥 2. SOLO si el panel está abierto
  if (panel.classList.contains("activo")) {
    await fetch("/api/notificaciones/leer", { method: "POST" });

    const badge = document.getElementById("badgeNotificaciones");
    if (badge) {
      badge.style.display = "none";
      badge.innerText = "0";
    }
  }
}

function cerrarNotificaciones() {
  const panel = document.getElementById("panelNotificaciones");
  if (!panel || !panel.classList.contains("activo")) return;
  panel.classList.remove("activo");
}

window.addEventListener("click", (event) => {
  const notificacion = document.querySelector(".notificacion");
  const panel = document.getElementById("panelNotificaciones");

  if (!notificacion || !panel || !panel.classList.contains("activo")) {
    return;
  }

  if (!notificacion.contains(event.target)) {
    cerrarNotificaciones();
  }
});

async function limpiarTodas() {
  await fetch("/api/notificaciones/clear", { method: "POST" });

  const lista = document.getElementById("listaNotificaciones");
  lista.innerHTML = "";

  const badge = document.getElementById("badgeNotificaciones");
  if (badge) {
    badge.innerText = "0";
    badge.style.display = "none";
  }
}

async function leerUna(id, el) {
  await fetch(`/api/notificaciones/${id}/leer`, {
    method: "POST",
  });

  // 🔥 animación fade out
  el.style.opacity = "0";
  el.style.transform = "translateX(20px)";

  setTimeout(() => {
    el.remove();
  }, 300);

  // 🔥 actualizar badge
  const badge = document.getElementById("badgeNotificaciones");
  if (badge) {
    let total = parseInt(badge.innerText) || 0;
    total = Math.max(0, total - 1);
    badge.innerText = total;

    if (total === 0) {
      badge.style.display = "none";
    }
  }
}

async function actualizarBadgeNotificaciones() {
  const data = await apiFetch("/api/notificaciones");

  if (!data) return;

  const badge = document.getElementById("notifBadge");

  if (!badge) return;

  badge.innerText = data.total || 0;

  badge.style.display = data.total > 0 ? "flex" : "none";
}

window.addEventListener("load", () => {
  actualizarBadgeNotificaciones();
  cargarNotificaciones();
});
