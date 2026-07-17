function togglePassword() {
  const input = document.getElementById("password");
  if (input) {
    input.type = input.type === "password" ? "text" : "password";
  }
}

function handleLogin() {
  const text = document.getElementById("text");
  const loader = document.getElementById("loader");

  if (text && loader) {
    text.style.display = "none";
    loader.style.display = "inline-block";
  }

  return true;
}

function toggleMenu() {
  document.getElementById("menu").classList.toggle("activo");
}

function formatearFecha(fecha) {
  if (!fecha) return "";

  fecha = fecha.toString().replace(" ", "T");

  const f = new Date(fecha);

  if (isNaN(f)) {
    return fecha.split("T")[0];
  }

  const ahora = new Date();

  const diff = Math.floor((ahora - f) / 1000);

  if (diff < 60) return "Hace unos segundos";

  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;

  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;

  if (diff < 172800) return "Ayer";

  return f.toLocaleDateString("es-MX", {
    day: "numeric",

    month: "short",
  });
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

function obtenerClaseRol(rol) {
  if (!rol) return "usuario";

  rol = rol.toLowerCase().trim();

  if (rol === "admin") return "admin";
  if (rol === "superadmin") return "superadmin";
  return "usuario";
}

// =========================
// COUNTER ANIMATION
// =========================

function animarContador(elemento, valorFinal, duracion = 800) {
  if (!elemento) return;

  const inicio = 0;

  const incremento = valorFinal / (duracion / 16);

  let valorActual = inicio;

  const timer = setInterval(() => {
    valorActual += incremento;

    if (valorActual >= valorFinal) {
      valorActual = valorFinal;

      clearInterval(timer);
    }

    elemento.innerText = Math.floor(valorActual);
  }, 16);
}
