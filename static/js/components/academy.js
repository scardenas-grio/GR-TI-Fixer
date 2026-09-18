class Academy {
  constructor() {
    this.drawer = document.getElementById("academyDrawer");

    this.overlay = document.getElementById("academyOverlay");

    this.closeButton = document.getElementById("academyClose");
  }

  getAvailableCourses() {
    // Admin y Superadmin pueden ver todos los tutoriales
    if (
      window.academyUser?.rol === "admin" ||
      window.academyUser?.rol === "superadmin"
    ) {
      return academyCourses;
    }

    const permisos = window.academyUser?.permisos || [];

    return academyCourses.filter((course) => {
      return permisos.includes(course.permiso);
    });
  }

  init() {
    this.events();
    this.renderCourses();
    this.bindCourseEvents();
    this.updateProgress();
    this.resumePendingCourse();

    const openButton = document.getElementById("academyOpen");

    if (openButton) {
      openButton.addEventListener("click", () => this.open());
    }

    const startButton = document.getElementById("academyStart");

    if (startButton) {
      startButton.addEventListener("click", () => this.startJourney());
    }

    window.addEventListener("tutorialProgress", () => {
      this.updateProgress();
      this.renderCourses();
      this.bindCourseEvents();
    });

    window.addEventListener("tutorialFinished", (event) => {
      this.handleTutorialFinished(event.detail.id, event.detail.repasar);
    });

    window.addEventListener("tutorialCancelled", (event) => {
      this.handleTutorialCancelled(event.detail);
    });
  }

  events() {
    this.closeButton.addEventListener(
      "click",

      () => this.close(),
    );

    this.overlay.addEventListener(
      "click",

      () => this.close(),
    );
  }

  open() {
    console.log("📖 Academy abierta");

    this.drawer.classList.add("open");

    this.overlay.classList.add("open");
  }

  close() {
    this.drawer.classList.remove("open");

    this.overlay.classList.remove("open");
  }

  startJourney() {
    console.log("🎓 Iniciando recorrido de TI Academy");

    // ======================================
    // BUSCAR PRIMER TUTORIAL PENDIENTE
    // ======================================

    const availableCourses = this.getAvailableCourses();

    const nextCourse = availableCourses.find((course) => {
      return tutorialManager.getProgress(course.id) < 100;
    });

    // ======================================
    // TODOS COMPLETADOS → REPASAR TODO
    // ======================================

    if (!nextCourse) {
      console.log("🔄 Repasando recorrido completo de TI Academy");

      // ======================================
      // RECUPERAR REPASO INTERRUMPIDO
      // ======================================

      const savedReviewCourse = sessionStorage.getItem("academyReviewCourse");

      // ======================================
      // SI EXISTE UN REPASO GUARDADO
      // CONTINUAR DESDE ESE TUTORIAL
      // ======================================

      let firstCourse = null;

      if (savedReviewCourse) {
        firstCourse = availableCourses.find(
          (course) => course.id === savedReviewCourse,
        );

        if (firstCourse) {
          console.log("🔄 Reanudando repaso desde:", firstCourse.title);
        }
      }

      // ======================================
      // SI NO HAY REPASO GUARDADO
      // COMENZAR DESDE EL PRIMERO
      // ======================================

      if (!firstCourse) {
        firstCourse = availableCourses[0];

        if (!firstCourse) {
          console.error("❌ No hay tutoriales registrados en TI Academy");
          return;
        }

        console.log("➡️ Primer tutorial:", firstCourse.title);

        // Limpiar posición anterior por seguridad
        sessionStorage.removeItem("academyReviewStep");
        sessionStorage.removeItem("academyReviewCourse");
      }

      // ======================================
      // MARCAR RECORRIDO COMPLETO
      // ======================================

      sessionStorage.setItem("academyReviewJourney", "true");

      const currentPath = window.location.pathname;

      // ======================================
      // SI YA ESTAMOS EN LA PÁGINA
      // ======================================

      if (firstCourse.ruta === currentPath) {
        this.close();

        tutorialManager.start(firstCourse.id, true);

        return;
      }

      // ======================================
      // IR A LA PÁGINA DEL TUTORIAL
      // ======================================

      sessionStorage.setItem("academyPendingCourse", firstCourse.id);

      sessionStorage.setItem("academyPendingReview", "true");

      sessionStorage.setItem("academyNavigation", "true");

      return;
    }

    // ======================================
    // RECORRIDO NORMAL
    // ======================================

    // Asegurar que no quede marcado
    // un repaso completo anterior
    sessionStorage.removeItem("academyReviewJourney");

    // También limpiar cualquier posición
    // temporal del repaso
    sessionStorage.removeItem("academyReviewCourse");
    sessionStorage.removeItem("academyReviewStep");

    console.log("➡️ Siguiente tutorial:", nextCourse.title);

    const currentPath = window.location.pathname;

    // ======================================
    // SI YA ESTAMOS EN LA PÁGINA CORRECTA
    // ======================================

    if (nextCourse.ruta === currentPath) {
      this.close();

      tutorialManager.start(nextCourse.id);

      return;
    }

    // ======================================
    // GUARDAR TUTORIAL PENDIENTE
    // ======================================

    sessionStorage.setItem("academyPendingCourse", nextCourse.id);

    sessionStorage.setItem("academyPendingReview", "false");

    window.location.href = nextCourse.ruta;
  }

  handleTutorialFinished(id, repasar = false) {
    console.log("🎉 Academy detectó tutorial terminado:", id);

    // ======================================
    // REPASO DE UN TUTORIAL
    // ======================================

    if (repasar) {
      const reviewJourney =
        sessionStorage.getItem("academyReviewJourney") === "true";

      // ======================================
      // REPASO DE RECORRIDO COMPLETO
      // ======================================

      if (reviewJourney) {
        console.log("🔄 Repaso completo: tutorial terminado:", id);

        const availableCourses = this.getAvailableCourses();

        const currentIndex = availableCourses.findIndex(
          (course) => course.id === id,
        );

        if (currentIndex === -1) return;

        const nextCourse = availableCourses[currentIndex + 1];

        // ======================================
        // YA NO HAY MÁS TUTORIALES
        // ======================================

        if (!nextCourse) {
          console.log("🏆 Repaso completo de TI Academy terminado");

          // 🎉 Avisar que terminó todo el repaso
          if (typeof showToast === "function") {
            showToast("🏆 ¡Has completado el repaso de TI Academy!", "success");
          }

          // Limpiar estado temporal del repaso
          sessionStorage.removeItem("academyReviewJourney");
          sessionStorage.removeItem("academyPendingCourse");
          sessionStorage.removeItem("academyPendingReview");
          sessionStorage.removeItem("academyReviewCourse");
          sessionStorage.removeItem("academyReviewStep");

          this.open();

          this.renderCourses();
          this.bindCourseEvents();
          this.updateProgress();

          return;
        }

        // ======================================
        // SIGUIENTE TUTORIAL DEL REPASO
        // ======================================

        console.log("➡️ Siguiente tutorial del repaso:", nextCourse.title);

        const currentPath = window.location.pathname;

        if (nextCourse.ruta === currentPath) {
          this.close();

          tutorialManager.start(nextCourse.id, true);

          return;
        }

        sessionStorage.setItem("academyPendingCourse", nextCourse.id);
        sessionStorage.setItem("academyPendingReview", "true");

        window.location.href = nextCourse.ruta;

        return;
      }

      // ======================================
      // REPASO INDIVIDUAL
      // ======================================

      console.log("🔄 Tutorial repasado:", id);

      this.open();

      this.renderCourses();
      this.bindCourseEvents();
      this.updateProgress();

      return;
    }

    // ======================================
    // TUTORIAL NORMAL
    // ======================================

    const availableCourses = this.getAvailableCourses();

    const currentIndex = availableCourses.findIndex(
      (course) => course.id === id,
    );

    if (currentIndex === -1) return;

    const nextCourse = availableCourses
      .slice(currentIndex + 1)
      .find((course) => {
        return tutorialManager.getProgress(course.id) < 100;
      });

    // ======================================
    // TODOS COMPLETADOS
    // ======================================

    if (!nextCourse) {
      console.log("🏆 TI Academy completada");

      this.showCompletionMessage(id);

      this.open();

      this.renderCourses();
      this.bindCourseEvents();
      this.updateProgress();

      return;
    }

    // ======================================
    // SIGUIENTE TUTORIAL
    // ======================================

    console.log("➡️ Siguiente tutorial:", nextCourse.title);

    this.showCompletionMessage(id, nextCourse.title);

    this.open();

    this.renderCourses();
    this.bindCourseEvents();
    this.updateProgress();

    const startButton = document.getElementById("academyStart");

    if (startButton) {
      startButton.textContent = `▶ Continuar con ${nextCourse.title}`;
    }
  }

  handleTutorialCancelled(detail) {
    console.log("⏸️ Academy detectó tutorial cancelado:", detail.id);

    this.open();

    this.renderCourses();
    this.bindCourseEvents();
    this.updateProgress();

    setTimeout(() => {
      showToast(
        `⏸️ Tutorial pausado. Puedes continuar con ${detail.nombre} cuando quieras.`,
        "info",
      );
    }, 200);
  }

  showCompletionMessage(titulo, siguiente = null) {
    if (siguiente) {
      mostrarToast(
        `🎉 ¡Tutorial completado! ${titulo} · Siguiente: ${siguiente}`,
        "success",
      );
    } else {
      mostrarToast(`🏆 ¡Felicidades! Has completado TI Academy`, "success");
    }
  }

  updateProgress() {
    const availableCourses = this.getAvailableCourses();
    const fill = document.querySelector(".academy-progress-fill");
    const text = document.querySelector(".academy-progress span");
    const startButton = document.getElementById("academyStart");

    if (!fill || !text) return;

    if (!availableCourses || availableCourses.length === 0) {
      fill.style.width = "0%";
      text.textContent = "0 % completado";

      if (startButton) {
        startButton.textContent = "▶ Comenzar recorrido";
      }

      return;
    }

    const total = availableCourses.length;

    const progresoTotal = availableCourses.reduce((suma, course) => {
      return suma + tutorialManager.getProgress(course.id);
    }, 0);

    const progress = Math.round(progresoTotal / total);

    fill.style.width = `${progress}%`;
    text.textContent = `${progress} % completado`;

    this.updateStartButton();

    // ======================================
    // ESTADO DEL RECORRIDO
    // ======================================

    if (startButton) {
      if (progress >= 100) {
        startButton.textContent = "↻ Repasar recorrido";
      } else {
        const nextCourse = availableCourses.find((course) => {
          return tutorialManager.getProgress(course.id) < 100;
        });

        if (nextCourse && progress > 0) {
          startButton.textContent = `▶ Continuar con ${nextCourse.title}`;
        } else {
          startButton.textContent = "▶ Comenzar recorrido";
        }
      }
    }
  }

  updateStartButton() {
    const startButton = document.getElementById("academyStart");

    if (!startButton) {
      return;
    }

    const availableCourses = this.getAvailableCourses();

    if (!availableCourses || availableCourses.length === 0) {
      startButton.textContent = "▶ Comenzar recorrido";
      return;
    }

    const total = availableCourses.length;

    const progresoTotal = availableCourses.reduce((suma, course) => {
      return suma + tutorialManager.getProgress(course.id);
    }, 0);

    const progress = Math.round(progresoTotal / total);

    // ======================================
    // TODOS COMPLETADOS
    // ======================================

    if (progress >= 100) {
      startButton.textContent = "↻ Repasar recorrido";
      return;
    }

    // ======================================
    // BUSCAR SIGUIENTE TUTORIAL PERMITIDO
    // ======================================

    const nextCourse = availableCourses.find((course) => {
      return tutorialManager.getProgress(course.id) < 100;
    });

    // ======================================
    // SIN TUTORIAL INICIADO
    // ======================================

    if (progress <= 0) {
      startButton.textContent = "▶ Comenzar recorrido";
      return;
    }

    // ======================================
    // CONTINUAR
    // ======================================

    if (nextCourse) {
      startButton.textContent = `▶ Continuar con ${nextCourse.title}`;
    }
  }

  renderCourses() {
    const container = document.getElementById("academyCourses");

    if (!container) return;

    container.innerHTML = "";

    const availableCourses = this.getAvailableCourses();

    availableCourses.forEach((course) => {
      const progress = tutorialManager.getProgress(course.id);

      let buttonText = "▶ Iniciar tutorial";
      let buttonClass = "";

      let statusText = "Pendiente";
      let statusClass = "pending";
      let statusIcon = "○";

      /* ======================================
       ESTADO — EN PROGRESO
    ====================================== */

      if (progress > 0 && progress < 100) {
        buttonText = "▶ Continuar tutorial";

        statusText = "En progreso";
        statusClass = "progress";
        statusIcon = "◐";
      }

      /* ======================================
       ESTADO — COMPLETADO
    ====================================== */

      if (progress >= 100) {
        buttonText = "↻ Repasar tutorial";

        buttonClass = "completed";

        statusText = "Completado";
        statusClass = "completed";
        statusIcon = "✓";
      }

      container.innerHTML += `
      <div class="academy-course">

        <div class="academy-course-info">

          <div class="academy-course-header">

            <h4>
              ${course.icon} ${course.title}
            </h4>

            <span class="academy-course-status ${statusClass}">
              <span class="academy-course-status-icon">
                ${statusIcon}
              </span>

              ${statusText}
            </span>

          </div>

          <p>
            ${course.description}
          </p>

          <small>
            🟢 ${course.level} · ⏱ ${course.duration}
          </small>

        </div>

        <button
          class="academy-course-btn ${buttonClass}"
          data-course="${course.id}"
          type="button"
        >
          ${buttonText}
        </button>

      </div>
    `;
    });

    this.updateStartButton();
  }

  bindCourseEvents() {
    document.querySelectorAll(".academy-course-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const course = button.dataset.course;

        this.close();

        const availableCourses = this.getAvailableCourses();

        const courseData = availableCourses.find((item) => item.id === course);

        if (!courseData) {
          console.error("❌ Curso no encontrado:", course);
          return;
        }

        const progress = tutorialManager.getProgress(course);

        const repasar = progress >= 100;

        if (courseData.ruta !== window.location.pathname) {
          // ==========================================
          // ACADEMY ORDENA NAVEGAR AL TUTORIAL
          // ==========================================

          sessionStorage.setItem("academyPendingCourse", course);

          sessionStorage.setItem(
            "academyPendingReview",
            repasar ? "true" : "false",
          );

          // 🔑 MARCA QUE LA NAVEGACIÓN FUE INICIADA POR ACADEMY
          sessionStorage.setItem("academyNavigation", "true");

          window.location.href = courseData.ruta;

          return;
        }

        if (repasar) {
          tutorialManager.start(course, true);
        } else {
          tutorialManager.start(course);
        }
      });
    });
  }

  resumePendingCourse() {
    // ==========================================
    // ¿LA NAVEGACIÓN FUE ORDENADA POR ACADEMY?
    // ==========================================

    const academyNavigation =
      sessionStorage.getItem("academyNavigation") === "true";

    // ==========================================
    // SI NO VIENE DE ACADEMY
    // ==========================================

    if (!academyNavigation) {
      console.log(
        "ℹ️ Carga normal de página → no iniciar tutorial automáticamente",
      );

      return;
    }

    // ==========================================
    // RECUPERAR TUTORIAL PENDIENTE
    // ==========================================

    const course = sessionStorage.getItem("academyPendingCourse");

    if (!course) {
      console.log("ℹ️ No hay tutorial pendiente");

      sessionStorage.removeItem("academyNavigation");

      return;
    }

    const repasar = sessionStorage.getItem("academyPendingReview") === "true";

    // ==========================================
    // LIMPIAR ESTADO ANTES DE INICIAR
    // ==========================================

    sessionStorage.removeItem("academyPendingCourse");
    sessionStorage.removeItem("academyPendingReview");

    // 🔑 MUY IMPORTANTE:
    // La navegación de Academy ya fue consumida
    sessionStorage.removeItem("academyNavigation");

    // ==========================================
    // BUSCAR CURSO
    // ==========================================

    const courseData = academyCourses.find((item) => item.id === course);

    if (!courseData) {
      console.error("❌ Curso pendiente no encontrado:", course);

      return;
    }

    console.log("🎓 Reanudando tutorial pendiente:", courseData.title);

    // ==========================================
    // CERRAR ACADEMY
    // ==========================================

    this.close();

    // ==========================================
    // INICIAR TUTORIAL
    // ==========================================

    setTimeout(() => {
      if (repasar) {
        tutorialManager.start(course, true);
      } else {
        tutorialManager.start(course);
      }
    }, 150);
  }
}

window.academy = new Academy();
