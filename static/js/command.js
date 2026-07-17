const commandPalette =
  document.getElementById(
    "commandPalette"
  );

const commandInput =
  document.getElementById(
    "commandInput"
  );

// abrir
document.addEventListener(
  "keydown",
  (e) => {

    // CTRL + K
    if (
      (e.ctrlKey || e.metaKey)
      &&
      e.key.toLowerCase() === "k"
    ) {

      e.preventDefault();

      commandPalette.classList.add(
        "open"
      );

      setTimeout(() => {
        commandInput.focus();
      }, 100);
    }

    // ESC
    if (e.key === "Escape") {

      commandPalette.classList.remove(
        "open"
      );
    }
});

// cerrar click fuera
commandPalette?.addEventListener(
  "click",
  (e) => {

    if (
      e.target === commandPalette
    ) {

      commandPalette.classList.remove(
        "open"
      );
    }
});