// =======================================
// REFERENCIAS
// =======================================

const tablaActivos = document.getElementById("tablaActivosBody");

const tablaLDAP = document.querySelector("#tablaLDAP tbody");

// =======================================
// HELPERS
// =======================================

function crearAccionesUsuario(username) {
  if (username === "admin_root") {
    return `<span class="admin-protegido">Protegido</span>`;
  }

  return `
      <button class="btn-editar" data-user="${username}">
          ✏️ Editar
      </button>

      <button class="btn-delete" data-user="${username}">
          🗑️ Eliminar
      </button>
  `;
}

function animarFila(fila) {
  if (!fila) return;

  fila.classList.add("flash-row");

  setTimeout(() => {
    fila.classList.remove("flash-row");
  }, 1200);
}

function crearFila(html) {
  const fila = document.createElement("tr");

  fila.innerHTML = html;

  return fila;
}

// =======================================
// TABLAS
// =======================================

function actualizarFila(username, rol) {
  const fila = document.getElementById(`fila-${username}`);
  if (!fila) return;

  const badge = fila.querySelector(".rol-badge");
  if (badge) {
    badge.className = `rol-badge ${rol}`;
    badge.innerText = rol;
  }

  // ✨ animación visual
  animarFila(fila);
}

async function actualizarTablaActivos() {
  const data = await apiFetch("/api/usuarios_activos");

  if (!data) return;

  tablaActivos.innerHTML = "";

  data.forEach((u) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <span
          class="user-status offline"
          data-online-user="${u.username}">
        </span>
        ${u.username}
      </td>

      <td>
        <span class="rol-badge ${obtenerClaseRol(u.rol)}">
          ${u.rol}
        </span>
      </td>

      <td>${u.permisos || "—"}</td>

      <td>
        ${crearAccionesUsuario(u.username)}
      </td>
    `;

    tablaActivos.appendChild(tr);
  });
}

function pintarTablaLDAP(lista) {
  tablaLDAP.innerHTML = "";

  lista.slice(0, 8).forEach((u) => {
    const tr = document.createElement("tr");
    tr.id = `fila-${u}`;

    tr.innerHTML = `
      <td>${u}</td>
      <td>
        <span class="rol-badge usuario">usuario</span>
      </td>
      <td>
          ${crearAccionesUsuario(u)}
      </td>
    `;

    tablaLDAP.appendChild(tr);
  });
}
