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
  constructor(totalSteps = 4) {
    this.currentStep = 1;
    this.totalSteps = totalSteps;

    this.currentStepElement = document.getElementById("wizardCurrentStep");
    this.totalStepsElement = document.getElementById("wizardTotalSteps");
    this.titleElement = document.getElementById("wizardTitle");
    this.subtitleElement = document.getElementById("wizardSubtitle");

    this.previousButton = document.getElementById("btnAnterior");
    this.nextButton = document.getElementById("btnSiguiente");

    this.progressSteps = document.querySelectorAll(".progress-step");
    this.progressLines = document.querySelectorAll(".progress-line");

    this.dynamicForm = document.getElementById("dynamicForm");
  }

  init() {
    this.update();

    this.events();
  }

  events() {
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
    // Actualiza el paso actual
    this.currentStepElement.textContent = this.currentStep;

    this.totalStepsElement.textContent = this.totalSteps;

    // Obtiene la configuración del paso
    const step = wizardConfig[this.currentStep];

    if (step) {
      this.titleElement.textContent = step.title;

      this.subtitleElement.textContent = step.subtitle;
    }

    // Actualiza botones
    this.previousButton.disabled = this.currentStep === 1;

    this.nextButton.disabled = this.currentStep === this.totalSteps;

    this.updateProgress();
    this.renderStep();
  }

  updateProgress() {
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

  renderStep() {
    switch (this.currentStep) {
      case 1:
        this.dynamicForm.innerHTML = formularioVacaciones();
        actualizarBarra(saldoDisponible);
        break;

      case 2:
        this.dynamicForm.innerHTML = resumenVacaciones();
        break;
    }
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
  window.wizard = new Wizard();

  window.wizard.init();
});
