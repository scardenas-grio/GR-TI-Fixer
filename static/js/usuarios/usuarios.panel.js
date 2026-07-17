// =======================================
// REFERENCIAS
// =======================================
const panel = {
  overlay: document.getElementById("overlay"),
  contenedor: document.getElementById("panelUsuario"),

  username: document.getElementById("usernamePanel"),

  nombre: document.getElementById("panelNombre"),
  avatar: document.getElementById("panelAvatar"),
  rolActual: document.getElementById("panelRolActual"),

  rol: document.getElementById("rolPanel"),
};

// =======================================
// HELPERS
// =======================================

function obtenerNombreRol(rol) {
  switch (rol) {
    case "superadmin":
      return "👑 Superadministrador";

    case "admin":
      return "🛡 Administrador";

    case "usuario":
      return "👤 Usuario";

    default:
      return rol;
  }
}

function limpiarPermisos() {
  document.querySelectorAll(".permisoCheck").forEach((chk) => {
    chk.checked = false;
  });
}

// =======================================
// PANEL
// =======================================

async function abrirPanel(username) {
  if (username === "admin_root") {
    mostrarToast("El usuario principal está protegido", "warning");

    return;
  }

  panel.username.value = username;

  const data = await apiFetch(`/api/usuario/${username}`);

  if (!data) return;

  panel.nombre.textContent = username.toUpperCase();

  if (panel.avatar) {
    panel.avatar.textContent = username.substring(0, 2).toUpperCase();
  }

  panel.rolActual.textContent = obtenerNombreRol(data.rol);

  panel.rol.value = data.rol;

  limpiarPermisos();

  if (data.permisos) {
    data.permisos.forEach((permiso) => {
      const check = document.querySelector(`.permisoCheck[value="${permiso}"]`);

      if (check) {
        check.checked = true;
      }
    });
  }

  panel.contenedor.classList.add("open");

  panel.overlay.classList.add("open");
}

function cerrarPanel() {
  panel.contenedor.classList.remove("open");
  panel.overlay.classList.remove("open");
  limpiarPermisos();
}

// =======================================
// GUARDAR
// =======================================

async function guardarUsuario() {
  const username = panel.username.value;
  const rol = panel.rol.value;

  const permisos = [...document.querySelectorAll(".permisoCheck:checked")].map(
    (el) => el.value,
  );

  const formData = new FormData();
  formData.append("username", username);
  formData.append("rol", rol);
  permisos.forEach((p) => formData.append("permisos[]", p));

  const data = await apiFetch("/guardar_usuario", {
    method: "POST",
    body: formData,
  });

  if (!data) return;

  if (data.status === "ok") {
    mostrarToast("Guardado correctamente", "ok");
    cerrarPanel();

    actualizarTablaActivos(); // 🔥 nueva función
  }
}

// =======================================
// EVENTOS
// =======================================

panel.overlay?.addEventListener("click", cerrarPanel);

document
  .getElementById("btnCancelarPanel")
  ?.addEventListener("click", cerrarPanel);

document
  .getElementById("btnGuardarUsuario")
  ?.addEventListener("click", guardarUsuario);

document
  .getElementById("closePanelBtn")
  ?.addEventListener("click", cerrarPanel);
