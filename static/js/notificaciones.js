// formatearFecha, showToast y mostrarToast viven en utils.js

function actualizarBadge(total) {
  ["badgeNotificaciones", "notifBadge"].forEach((id) => {
    const badge = document.getElementById(id);

    if (!badge) return;

    badge.innerText = total;
    badge.style.display = total > 0 ? "flex" : "none";
  });
}

function renderNotificaciones(notificaciones) {
  const lista = document.getElementById("listaNotificaciones");

  if (!lista) return;

  lista.innerHTML = "";

  notificaciones.forEach((n) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="notif-item">
        <div class="notif-msg">${n.mensaje}</div>
        <div class="notif-time">${formatearFecha(n.fecha)}</div>
      </div>
    `;

    lista.appendChild(li);
  });
}

async function cargarNotificaciones() {
  const data = await apiFetch("/api/notificaciones");

  if (!data) return null;

  actualizarBadge(data.total || 0);
  renderNotificaciones(data.data || []);

  return data;
}

async function actualizarBadgeNotificaciones() {
  const data = await apiFetch("/api/notificaciones");

  if (!data) return;

  actualizarBadge(data.total || 0);
}

async function marcarLeidas() {
  await apiFetch("/api/notificaciones/leer", { method: "POST" });

  actualizarBadge(0);
}

async function abrirNotificaciones() {
  const panel = document.getElementById("panelNotificaciones");

  panel.classList.toggle("activo");

  await cargarNotificaciones();

  if (panel.classList.contains("activo")) {
    await marcarLeidas();
  }
}

async function limpiarTodas() {
  await apiFetch("/api/notificaciones/clear", { method: "POST" });

  renderNotificaciones([]);
  actualizarBadge(0);
}

async function leerUna(id, el) {
  await apiFetch(`/api/notificaciones/${id}/leer`, { method: "POST" });

  // 🔥 animación fade out
  el.style.opacity = "0";
  el.style.transform = "translateX(20px)";

  setTimeout(() => {
    el.remove();
  }, 300);

  const badge = document.getElementById("badgeNotificaciones");

  if (badge) {
    const total = Math.max(0, (parseInt(badge.innerText) || 0) - 1);

    actualizarBadge(total);
  }
}

window.addEventListener("load", cargarNotificaciones);
