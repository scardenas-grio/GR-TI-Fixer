// =========================
// FILTROS
// =========================

async function filtrarLDAP() {
  const q = document.getElementById("searchLDAP").value;

  const data = await apiFetch(`/api/buscar_ldap?q=${encodeURIComponent(q)}`);

  if (!data) return;

  pintarTablaLDAP(data);
}

function filtrarActivos() {
  aplicarFiltro("searchActivos", "tablaActivos");
}

function filtrarPorRol() {
  const rol = document.getElementById("filtroRol").value;

  document.querySelectorAll("#tablaActivos tbody tr").forEach((tr) => {
    const rolActual = tr.querySelector(".rol-badge")?.textContent.toLowerCase();
    tr.style.display = !rol || r === rol ? "" : "none";
  });
}

function aplicarFiltro(inputId, tablaId) {
  const filtro = document.getElementById(inputId).value.toLowerCase();

  document.querySelectorAll(`#${tablaId} tbody tr`).forEach((tr) => {
    tr.style.display = tr.innerText.toLowerCase().includes(filtro)
      ? ""
      : "none";
  });
}

function limpiarBusqueda(inputId, tablaId) {
  document.getElementById(inputId).value = "";
  aplicarFiltro(inputId, tablaId);
}

function toggleClear(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);

  btn.classList.toggle("visible", input.value.length > 0);
}

// =========================
// LISTENERS
// =========================

const searchLDAP = document.getElementById("searchLDAP");

if (searchLDAP) {
  searchLDAP.addEventListener("keyup", () => {
    filtrarLDAP();

    toggleClear("searchLDAP", "clearLDAP");
  });
}

const searchActivos = document.getElementById("searchActivos");

if (searchActivos) {
  searchActivos.addEventListener("keyup", () => {
    filtrarActivos();

    toggleClear("searchActivos", "clearActivos");
  });
}

const clearLDAP = document.getElementById("clearLDAP");

if (clearLDAP) {
  clearLDAP.addEventListener("click", () => {
    limpiarBusqueda("searchLDAP", "tablaLDAP");
  });
}

const clearActivos = document.getElementById("clearActivos");

if (clearActivos) {
  clearActivos.addEventListener("click", () => {
    limpiarBusqueda("searchActivos", "tablaActivos");
  });
}

const filtroRol = document.getElementById("filtroRol");

if (filtroRol) {
  filtroRol.addEventListener("change", filtrarPorRol);
}
