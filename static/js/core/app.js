/**
 * =====================================
 * TI-Fixer
 * Core Application
 * =====================================
 */

class App {
  constructor() {
    console.log("App creada");
  }

  init() {
    console.log("🚀 TI-Fixer iniciado");

    if (window.academy) {
      academy.init();

      console.log("✅ Academy inicializada");
    }
  }
}

window.app = new App();

document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
