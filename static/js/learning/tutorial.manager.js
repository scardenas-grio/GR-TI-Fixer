const dashboardTutorial = {
  id: "dashboard",

  nombre: "Panel Corporativo",

  descripcion:
    "Aprende a interpretar los indicadores y la actividad del sistema.",

  duracion: "3 minutos",

  pasos: [
    {
      id: 1,
      element: "#estadoSistema",
      title: "Estado del sistema",
      description:
        "Aquí puedes comprobar rápidamente si TI-Fixer se encuentra en línea y funcionando correctamente.",
    },

    {
      id: 2,
      element: "#totalLDAP",
      title: "Usuarios LDAP",
      description:
        "Este indicador muestra el total de usuarios disponibles desde LDAP.",
    },

    {
      id: 3,
      element: "#totalDB",
      title: "Usuarios con acceso",
      description:
        "Este indicador muestra cuántos usuarios tienen acceso registrado en el sistema.",
    },

    {
      id: 4,
      element: "#totalAdmins",
      title: "Administradores",
      description:
        "Aquí puedes consultar cuántos usuarios tienen privilegios administrativos.",
    },

    {
      id: 5,
      element: "#grafica",
      title: "Resumen gráfico",
      description:
        "Esta gráfica permite visualizar de forma rápida la distribución de usuarios del sistema.",
    },

    {
      id: 6,
      element: "#actividadFeed",
      title: "Actividad reciente",
      description:
        "Aquí puedes consultar las acciones recientes realizadas dentro del sistema.",
    },
  ],
};

window.dashboardTutorial = dashboardTutorial;

class TutorialManager {
  constructor() {
    this.tutorials = {};
    this.progress = {};
  }

  register(id, tutorial) {
    this.tutorials[id] = tutorial;

    this.progress[id] = this.getProgress(id);

    console.log("📚 Tutorial registrado:", id);
  }

  get(id) {
    return this.tutorials[id];
  }

  // ======================================
  // PROGRESO
  // ======================================

  getProgress(id) {
    return Number(localStorage.getItem(`tutorial-progress-${id}`)) || 0;
  }

  getStep(id) {
    const tutorial = this.get(id);

    if (!tutorial) return 0;

    const savedStep = Number(localStorage.getItem(`tutorial-step-${id}`));

    if (Number.isNaN(savedStep)) {
      return 0;
    }

    return Math.max(0, Math.min(savedStep, tutorial.pasos.length - 1));
  }

  saveProgress(id, progress, stepIndex = null) {
    this.progress[id] = progress;

    // Guardar porcentaje
    localStorage.setItem(`tutorial-progress-${id}`, progress);

    // Guardar paso exacto
    if (stepIndex !== null) {
      localStorage.setItem(`tutorial-step-${id}`, stepIndex);
    }

    window.dispatchEvent(
      new CustomEvent("tutorialProgress", {
        detail: {
          id: id,
          progress: progress,
          step: stepIndex,
        },
      }),
    );

    console.log(`📊 Progreso ${id}: ${progress}%`);
  }

  // ======================================
  // INICIAR TUTORIAL
  // ======================================

  start(id, repasar = false) {
    const tutorial = this.get(id);

    if (!tutorial) {
      console.error("❌ Tutorial no encontrado:", id);
      return;
    }

    console.log("🎓 Iniciando tutorial:", tutorial.nombre);

    // =======================================
    // ¿ES UN REPASO DEL RECORRIDO COMPLETO?
    // =======================================

    const reviewJourney =
      repasar && sessionStorage.getItem("academyReviewJourney") === "true";

    const coach = new CoachMark({
      onClose: () => {
        console.log(`🛑 Tutorial detenido: ${tutorial.nombre}`);

        // =======================================
        // REPASO DEL RECORRIDO
        // =======================================

        if (reviewJourney) {
          console.log("🔄 Guardando estado del repaso:", id);

          // Mantener activo el recorrido
          sessionStorage.setItem("academyReviewJourney", "true");

          // Recordar tutorial actual
          sessionStorage.setItem("academyReviewCourse", id);

          // Recordar que estamos en modo repaso
          sessionStorage.setItem("academyPendingCourse", id);
          sessionStorage.setItem("academyPendingReview", "true");
        } else {
          // =======================================
          // TUTORIAL NORMAL
          // =======================================

          sessionStorage.removeItem("academyReviewJourney");
          sessionStorage.removeItem("academyPendingCourse");
          sessionStorage.removeItem("academyPendingReview");
        }

        // =======================================
        // AVISAR A ACADEMY
        // =======================================

        window.dispatchEvent(
          new CustomEvent("tutorialCancelled", {
            detail: {
              id: id,
              nombre: tutorial.nombre,
            },
          }),
        );
      },
    });

    coach.init();

    // =======================================
    // RECUPERAR PROGRESO NORMAL
    // =======================================

    const progress = this.getProgress(id);

    let startStep = 0;

    // =======================================
    // REPASO
    // =======================================

    if (repasar) {
      // ---------------------------------------
      // REPASO DEL RECORRIDO COMPLETO
      // ---------------------------------------

      if (reviewJourney) {
        const reviewCourse = sessionStorage.getItem("academyReviewCourse");

        const savedReviewStep = parseInt(
          sessionStorage.getItem("academyReviewStep"),
          10,
        );

        // Si estamos retomando ESTE mismo tutorial
        if (
          reviewCourse === id &&
          !isNaN(savedReviewStep) &&
          savedReviewStep >= 0
        ) {
          startStep = savedReviewStep;

          console.log(
            `🔄 Retomando repaso de ${tutorial.nombre} desde paso ${
              startStep + 1
            }`,
          );
        } else {
          // Nuevo tutorial dentro del recorrido
          startStep = 0;

          console.log(`🔄 Iniciando repaso de ${tutorial.nombre} desde paso 1`);
        }
      } else {
        // ---------------------------------------
        // REPASO INDIVIDUAL
        // ---------------------------------------

        startStep = 0;

        console.log(`🔄 Repaso individual de ${tutorial.nombre} desde paso 1`);
      }
    } else {
      // =======================================
      // TUTORIAL NORMAL
      // =======================================

      startStep = this.getStep(id);

      // Si nunca se ha iniciado
      if (progress <= 0) {
        startStep = 0;
      }

      // Si ya está completado
      if (progress >= 100) {
        startStep = tutorial.pasos.length - 1;
      }
    }

    console.log(
      `📍 Progreso ${progress}% → iniciando desde paso ${startStep + 1}`,
    );

    // =======================================
    // ENGINE
    // =======================================

    const engine = new TutorialEngine({
      steps: tutorial.pasos,

      coach: coach,

      startStep: startStep,

      onProgress: (progress, stepIndex) => {
        // =======================================
        // TUTORIAL NORMAL
        // =======================================

        if (!repasar) {
          this.saveProgress(id, progress, stepIndex);

          return;
        }

        // =======================================
        // REPASO DEL RECORRIDO
        // =======================================

        if (reviewJourney) {
          sessionStorage.setItem("academyReviewCourse", id);

          sessionStorage.setItem("academyReviewStep", String(stepIndex));

          console.log(`🔄 Paso del repaso guardado: ${id} → ${stepIndex + 1}`);
        }
      },

      onFinish: () => {
        console.log(`🎉 Tutorial terminado: ${tutorial.nombre}`);

        // =======================================
        // SI ES REPASO
        // =======================================

        if (reviewJourney) {
          // El tutorial actual ya terminó,
          // por lo tanto su posición temporal
          // ya no debe reutilizarse.

          sessionStorage.removeItem("academyReviewStep");

          sessionStorage.removeItem("academyReviewCourse");
        }

        // =======================================
        // AVISAR A ACADEMY
        // =======================================

        window.dispatchEvent(
          new CustomEvent("tutorialFinished", {
            detail: {
              id: id,
              nombre: tutorial.nombre,
              repasar: repasar,
            },
          }),
        );
      },
    });

    // =======================================
    // CONTROLES DEL COACH
    // =======================================

    coach.onNext = () => engine.next();

    coach.onPrevious = () => engine.previous();

    // =======================================
    // INICIAR ENGINE
    // =======================================

    engine.start(startStep);
  }
}

window.TutorialManager = TutorialManager;
