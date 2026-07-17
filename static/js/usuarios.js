// =========================
// USUARIOS
// Inicialización
// =========================

const ldapCompleto = JSON.parse(
  document.getElementById("ldap-json").textContent,
);

document.addEventListener("click", (e) => {
  const editar = e.target.closest(".btn-editar");

  if (editar) {
    abrirPanel(editar.dataset.user);

    return;
  }

  const eliminar = e.target.closest(".btn-delete");

  if (eliminar) {
    abrirModalEliminar(eliminar.dataset.user);
  }
});
