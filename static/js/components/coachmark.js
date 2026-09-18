class CoachMark {
  constructor(options = {}) {
    this.steps = options.steps || [];
    this.currentStep = 0;

    this.container = null;
    this.targetElement = null;

    this.titleElement = null;
    this.descriptionElement = null;
    this.stepIndicatorElement = null;
    this.stepTextElement = null;
    this.stepProgressFill = null;
    this.prevButton = null;
    this.nextButton = null;
    this.closeButton = null;

    this.onNext = options.onNext || null;
    this.onPrevious = options.onPrevious || null;
    this.onClose = options.onClose || null;
  }

  init() {
    // Evitar crear múltiples contenedores para la misma instancia
    if (!this.container) {
      this.create();
    }
  }

  start() {
    this.init();

    this.currentStep = 0;

    // Mostrar el primer paso directamente
    if (this.steps.length > 0) {
      this.show(this.steps[this.currentStep]);
    }
  }

  next() {
    if (this.onNext) {
      this.onNext();
    }
  }

  previous() {
    if (this.onPrevious) {
      this.onPrevious();
    }
  }

  finish() {
    this.hide();
  }

  show(step, currentIndex = 0, totalSteps = this.steps.length) {
    if (!step) {
      console.warn("⚠️ CoachMark: no se recibió un paso.");
      return;
    }

    // Quitar resaltado anterior
    if (this.targetElement) {
      this.targetElement.classList.remove("coachmark-target");
    }

    this.targetElement = null;

    // Buscar el elemento del paso
    if (step.element) {
      const element = document.querySelector(step.element);

      if (element) {
        this.targetElement = element;

        element.classList.add("coachmark-target");

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        console.warn(
          "⚠️ Elemento del tutorial no encontrado todavía:",
          step.element,
        );

        // El Dashboard puede estar terminando de renderizar.
        // Intentar nuevamente unos milisegundos después.
        setTimeout(() => {
          const retryElement = document.querySelector(step.element);

          if (retryElement) {
            this.targetElement = retryElement;

            retryElement.classList.add("coachmark-target");

            retryElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            console.log(
              "✅ Elemento encontrado en segundo intento:",
              step.element,
            );
          } else {
            console.warn(
              "❌ Elemento definitivamente no encontrado:",
              step.element,
            );
          }
        }, 300);
      }
    }

    // Actualizar contenido del CoachMark
    if (this.titleElement) {
      this.titleElement.textContent = step.title || "";
    }

    if (this.descriptionElement) {
      this.descriptionElement.textContent = step.description || "";
    }

    if (this.stepTextElement) {
      this.stepTextElement.textContent = `Paso ${currentIndex + 1} de ${totalSteps}`;
    }

    if (this.stepProgressFill && totalSteps > 0) {
      const progress = ((currentIndex + 1) / totalSteps) * 100;

      this.stepProgressFill.style.width = `${progress}%`;
    }

    // Mostrar el CoachMark
    if (this.container) {
      this.container.style.display = "block";
    }
  }

  close() {
    this.hide();

    if (this.onClose) {
      this.onClose();
    }
  }

  hide() {
    // Quitar resaltado
    if (this.targetElement) {
      this.targetElement.classList.remove("coachmark-target");
      this.targetElement = null;
    }

    // Ocultar cuadro
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  create() {
    this.container = document.createElement("div");

    this.container.className = "coachmark";

    this.container.innerHTML = `
      <div class="coachmark-card">

        <h3 class="coach-title"></h3>

          <p class="coach-description"></p>

          <div class="coach-step-indicator">
            <span class="coach-step-text"></span>

            <div class="coach-step-progress">
              <div class="coach-step-progress-fill"></div>
            </div>
          </div>

          <div class="coachmark-actions">

          <button type="button" class="coach-close">
            Salir
          </button>

          <button type="button" class="coach-prev">
            Anterior
          </button>

          <button type="button" class="coach-next">
            Siguiente
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(this.container);

    // Guardar referencias propias de ESTA instancia
    this.titleElement = this.container.querySelector(".coach-title");

    this.descriptionElement =
      this.container.querySelector(".coach-description");

    this.stepTextElement = this.container.querySelector(".coach-step-text");

    this.stepProgressFill = this.container.querySelector(
      ".coach-step-progress-fill",
    );

    this.prevButton = this.container.querySelector(".coach-prev");

    this.nextButton = this.container.querySelector(".coach-next");

    this.closeButton = this.container.querySelector(".coach-close");

    // Eventos
    this.prevButton.addEventListener("click", () => {
      this.previous();
    });

    this.nextButton.addEventListener("click", () => {
      this.next();
    });

    this.closeButton.addEventListener("click", () => {
      this.close();
    });
  }
}

window.CoachMark = CoachMark;
