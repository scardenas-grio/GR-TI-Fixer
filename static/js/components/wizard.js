const wizardConfig = {
  1: {
    title: "Información de la solicitud",
    subtitle: "Selecciona el tipo de solicitud que deseas realizar.",
  },

  2: {
    title: "Información",
    subtitle: "Completa los datos para continuar.",
  },

  3: {
    title: "Revisión",
    subtitle: "Verifica que toda la información sea correcta.",
  },

  4: {
    title: "Solicitud enviada",
    subtitle: "Tu solicitud fue registrada correctamente.",
  },
};

class Wizard {
  constructor(options = {}) {
    this.currentStep = options.startStep || 1;

    this.totalSteps = options.totalSteps || 4;

    this.config = options.config || {};

    this.currentStepElement = document.getElementById("wizardCurrentStep");
    this.totalStepsElement = document.getElementById("wizardTotalSteps");
    this.titleElement = document.getElementById("wizardTitle");
    this.subtitleElement = document.getElementById("wizardSubtitle");

    this.previousButton = document.getElementById("btnAnterior");
    this.nextButton = document.getElementById("btnSiguiente");

    this.progressSteps = document.querySelectorAll(".progress-step");
    this.progressLines = document.querySelectorAll(".progress-line");
  }

  init() {
    this.update();

    this.bindEvents();
  }

  bindEvents() {
    console.log("Events initialized");
    this.nextButton.addEventListener("click", () => {
      console.log("Next button clicked");
      this.next();
    });

    this.previousButton.addEventListener("click", () => {
      console.log("Previous button clicked");
      this.previous();
    });
  }

  update() {
    // Actualiza botones
    this.render();
  }

  render() {
    this.renderHeader();

    this.renderProgress();

    this.renderButtons();

    this.renderStep();
  }

  renderHeader() {
    // Actualiza el paso actual
    if (!this.currentStepElement) return;

    this.currentStepElement.textContent = this.currentStep;

    if (this.totalStepsElement) {
      this.totalStepsElement.textContent = this.totalSteps;
    }

    // Obtiene la configuración del paso
    const step = this.config[this.currentStep];

    if (step) {
      if (this.titleElement && step) {
        this.titleElement.textContent = step.title;
      }

      if (this.subtitleElement && step) {
        this.subtitleElement.textContent = step.subtitle;
      }
    }
  }

  renderProgress() {
    this.progressSteps.forEach((step, index) => {
      if (index < this.currentStep) {
        step.classList.add("active");
      } else {
        step.classList.remove("active");
      }
    });
    this.progressLines.forEach((line, index) => {
      if (index < this.currentStep - 1) {
        line.classList.add("active");
      } else {
        line.classList.remove("active");
      }
    });
  }

  renderButtons() {
    this.previousButton.disabled = this.currentStep === 1;

    if (this.currentStep === this.totalSteps) {
      this.nextButton.disabled = false;

      this.nextButton.innerHTML = `
      Nueva solicitud
      <i class="fa-solid fa-plus"></i>
    `;

      this.nextButton.classList.add("wizard-new-request");
    } else {
      this.nextButton.disabled = false;

      this.nextButton.innerHTML = `
      Siguiente
      <i class="fa-solid fa-arrow-right"></i>
    `;

      this.nextButton.classList.remove("wizard-new-request");
    }
  }

  renderStep() {
    document.dispatchEvent(
      new CustomEvent("wizard:render", {
        detail: {
          step: this.currentStep,
        },
      }),
    );
  }

  next() {
    // ========================================
    // PASO FINAL
    // ========================================

    if (this.currentStep >= this.totalSteps) {
      this.restart();

      return;
    }

    // ========================================
    // VALIDACIÓN PASO 1
    // ========================================

    if (this.currentStep === 1) {
      if (!tipoSolicitudSeleccionada) {
        showNotification(
          "Selecciona una solicitud",
          "Debes seleccionar el tipo de solicitud para continuar.",
          "info",
        );

        return;
      }
    }

    this.currentStep++;

    this.update();

    document.dispatchEvent(
      new CustomEvent("wizard:change", {
        detail: {
          step: this.currentStep,
        },
      }),
    );
  }

  previous() {
    if (this.currentStep <= 1) return;

    this.currentStep--;

    this.update();
  }

  restart() {
    console.log("🔄 Iniciando una nueva solicitud");

    this.currentStep = 1;

    document.dispatchEvent(new CustomEvent("wizard:restart"));

    this.update();

    document.dispatchEvent(
      new CustomEvent("wizard:change", {
        detail: {
          step: 1,
        },
      }),
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.wizard = new Wizard({
    totalSteps: 4,

    startStep: 1,

    config: wizardConfig,
  });

  window.wizard.init();
});
