class TutorialEngine {
  constructor(options = {}) {
    this.steps = options.steps || [];

    this.coach = options.coach;

    this.currentStep = options.startStep || 0;

    this.onProgress = options.onProgress || null;

    // Nuevo: se ejecuta cuando termina el tutorial
    this.onFinish = options.onFinish || null;
  }

  start(startStep = 0) {
    this.currentStep = startStep;

    this.render();
  }

  next() {
    if (this.currentStep >= this.steps.length - 1) {
      this.finish();

      return;
    }

    this.currentStep++;

    this.render();

    this.updateProgress();
  }

  previous() {
    if (this.currentStep <= 0) return;

    this.currentStep--;

    this.render();

    this.updateProgress();
  }

  updateProgress() {
    if (!this.onProgress) return;

    const total = this.steps.length;

    if (!total) return;

    const progress = Math.round(((this.currentStep + 1) / total) * 100);

    this.onProgress(progress, this.currentStep);
  }

  finish() {
    // Guardar 100% y último paso
    if (this.onProgress) {
      this.onProgress(100, this.steps.length - 1);
    }

    this.coach.hide();

    // Avisar que terminó
    if (this.onFinish) {
      this.onFinish();
    }
  }

  render() {
    const step = this.steps[this.currentStep];

    if (!step) return;

    this.coach.show(step, this.currentStep, this.steps.length);
  }
}

window.TutorialEngine = TutorialEngine;
