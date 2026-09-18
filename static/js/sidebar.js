const menu = document.getElementById("menu");
const toggleBtn = document.querySelector(".menu-toggle");

function syncSidebarState() {
  if (!menu) return;

  const isMobile = window.innerWidth <= 900;

  if (isMobile) {
    menu.classList.remove("collapsed");
    return;
  }

  const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
  menu.classList.toggle("collapsed", collapsed);
  menu.classList.remove("open", "activo");
}

if (menu && toggleBtn) {
  syncSidebarState();

  toggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      const isOpen = menu.classList.contains("open") || menu.classList.contains("activo");
      const nextOpenState = !isOpen;

      menu.classList.toggle("open", nextOpenState);
      menu.classList.toggle("activo", nextOpenState);
      document.body.classList.toggle("menu-open", nextOpenState);
      return;
    }

    const nextState = !menu.classList.contains("collapsed");
    menu.classList.toggle("collapsed", nextState);
    localStorage.setItem("sidebarCollapsed", String(nextState));
  });

  document.addEventListener("click", (event) => {
    const isMobile = window.innerWidth <= 900;
    if (!isMobile) return;

    const clickedInsideMenu = menu.contains(event.target);
    const clickedToggle = toggleBtn.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      menu.classList.remove("open", "activo");
      document.body.classList.remove("menu-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && window.innerWidth <= 900) {
      menu.classList.remove("open", "activo");
      document.body.classList.remove("menu-open");
    }
  });

  window.addEventListener("resize", syncSidebarState);
}