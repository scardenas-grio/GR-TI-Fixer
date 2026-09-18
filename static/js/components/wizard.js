const wizardConfig = {
  1: {
    title: "Información de la solicitud",
    subtitle: "Completa los datos para continuar.",
  },

  2: {
    title: "Revisión",
    subtitle: "Verifica que toda la información sea correcta.",
  },

  3: {
    title: "Confirmación",
    subtitle: "Confirma que deseas enviar la solicitud.",
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

    this.nextButton.disabled = this.currentStep === this.totalSteps;
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
    if (this.currentStep >= this.totalSteps) return;

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
}

document.addEventListener("DOMContentLoaded", () => {
  window.wizard = new Wizard({
    totalSteps: 4,

    startStep: 1,

    config: wizardConfig,
  });

  window.wizard.init();
});
