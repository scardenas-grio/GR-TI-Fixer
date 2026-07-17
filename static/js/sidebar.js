const menu =
  document.getElementById("menu");

const toggleBtn =
  document.querySelector(
    ".menu-toggle"
  );

if (menu && toggleBtn) {

  // recuperar estado
  const collapsed =
    localStorage.getItem(
      "sidebarCollapsed"
    );

  if (collapsed === "true") {

    menu.classList.add(
      "collapsed"
    );
  }

  // toggle
  toggleBtn.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "collapsed"
      );

      localStorage.setItem(
        "sidebarCollapsed",
        menu.classList.contains(
          "collapsed"
        )
      );
  });
}