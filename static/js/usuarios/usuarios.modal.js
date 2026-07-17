// =======================================
// ESTADO
// =======================================

let usuarioAEliminar = null;

// =======================================
// REFERENCIAS
// =======================================

const modalTexto = document.getElementById("modalTexto");

const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");

const btnCancelarModal = document.getElementById("btnCancelarModal");

// =======================================
// HELPERS
// =======================================

function abrirModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.add("open");

  document.body.style.overflow = "hidden";
}

function cerrarModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("open");

  document.body.style.overflow = "";
}

// =======================================
// MODAL
// =======================================

function abrirModalEliminar(username) {
  usuarioAEliminar = username;
  modalTexto.innerText = `¿Quitar acceso a ${username}?`;
  abrirModal("modalDelete");
}

async function confirmarEliminar() {
  cerrarModal("modalDelete");

  const data = await apiFetch(`/eliminar_usuario/${usuarioAEliminar}`, {
    method: "POST",
  });

  if (!data) return;

  if (data.status === "ok") {
    mostrarToast("Guardado correctamente", "ok");
    actualizarFila(usuarioAEliminar, "usuario");
    cerrarPanel();

    actualizarTablaActivos();

    filtrarLDAP();
  }
}

// =======================================
// ELIMINAR
// =======================================

async function eliminarUsuario(id) {
  const ok = confirm("¿Eliminar usuario?");

  if (!ok) return;

  const data = await apiFetch(`/api/usuarios/${id}`, {
    method: "DELETE",
  });

  if (!data) return;

  mostrarToast("Usuario eliminado", "success");

  location.reload();
}

// =======================================
// EVENTOS
// =======================================

document
  .querySelectorAll(".modal")

  .forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");

        document.body.style.overflow = "";
      }
    });
  });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document
      .querySelectorAll(".modal.open")

      .forEach((modal) => {
        modal.classList.remove("open");
      });

    document.body.style.overflow = "";
  }
});

if (btnConfirmarEliminar) {
  btnConfirmarEliminar.addEventListener("click", confirmarEliminar);
}

if (btnCancelarModal) {
  btnCancelarModal.addEventListener("click", () => cerrarModal("modalDelete"));
}
