function formularioVacaciones() {
  return `
    <div class="vacaciones-form fade-in">

      <div class="vacaciones-form-header">
        <div class="vacaciones-form-icon">
          <i class="fa-solid fa-umbrella-beach"></i>
        </div>

        <div>
          <h2>Solicitud de Vacaciones</h2>
          <p>
            Selecciona el periodo que deseas solicitar.
          </p>
        </div>
      </div>

      <!-- RESUMEN DEL SALDO -->
      <div class="vacaciones-saldo-resumen">

        <div class="saldo-resumen-item">
          <span>Saldo disponible</span>
          <strong id="saldoDias">12 días</strong>
        </div>

        <div class="saldo-resumen-separador"></div>

        <div class="saldo-resumen-item">
          <span>Días solicitados</span>
          <strong id="diasSolicitados">—</strong>
        </div>

        <div class="saldo-resumen-separador"></div>

        <div class="saldo-resumen-item">
          <span>Te quedarán</span>
          <strong id="diasRestantes">—</strong>
        </div>

      </div>

      <!-- CALENDARIO PERSONALIZADO -->
      <div class="vacaciones-calendar-container">

        <div class="vacaciones-calendar-header">

          <div>
            <span class="calendar-eyebrow">
              SELECCIÓN DE PERIODO
            </span>

            <h3 id="vacacionesCalendarTitle">
              Septiembre 2026
            </h3>
          </div>

          <div class="calendar-navigation">
            <button
              type="button"
              id="calendarPrev"
              class="calendar-nav-btn"
              aria-label="Mes anterior"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>

            <button
              type="button"
              id="calendarToday"
              class="calendar-today-btn"
            >
              Hoy
            </button>

            <button
              type="button"
              id="calendarNext"
              class="calendar-nav-btn"
              aria-label="Mes siguiente"
            >
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

        </div>

        <div class="vacaciones-calendar-help">
          <i class="fa-solid fa-circle-info"></i>

          <span id="calendarHelpText">
            Selecciona primero la fecha de inicio y después la fecha final.
          </span>
        </div>

        <div class="vacaciones-calendar-weekdays">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        <div
          id="vacacionesCalendarGrid"
          class="vacaciones-calendar-grid"
        ></div>

        <div class="vacaciones-calendar-legend">

          <div class="calendar-legend-item">
            <span class="legend-dot available"></span>
            Disponible
          </div>

          <div class="calendar-legend-item">
            <span class="legend-dot selected"></span>
            Seleccionado
          </div>

          <div class="calendar-legend-item">
            <span class="legend-dot occupied"></span>
            Ya solicitado
          </div>

          <div class="calendar-legend-item">
            <span class="legend-dot disabled"></span>
            No disponible
          </div>

        </div>

      </div>

      <!-- PERIODO SELECCIONADO -->
      <div class="vacaciones-periodo-resumen">

        <div class="periodo-resumen-header">
          <div>
            <span class="calendar-eyebrow">
              TU SELECCIÓN
            </span>

            <strong>Periodo solicitado</strong>
          </div>

          <div class="periodo-dias-badge">
            <i class="fa-solid fa-calendar-days"></i>
            <span id="periodoDiasBadge">0 días</span>
          </div>
        </div>

        <div class="periodo-fechas">

          <div class="periodo-fecha">
            <span>Fecha de inicio</span>
            <strong id="periodoFechaInicio">—</strong>
          </div>

          <div class="periodo-arrow">
            <i class="fa-solid fa-arrow-right"></i>
          </div>

          <div class="periodo-fecha">
            <span>Fecha final</span>
            <strong id="periodoFechaFin">—</strong>
          </div>

        </div>

      </div>

      <!-- BARRA DE SALDO -->
      <div class="vacation-balance">

        <div class="balance-header">
          <span>Días disponibles después de esta solicitud</span>
          <strong id="balanceText">
            12 / 20 días
          </strong>
        </div>

        <div class="balance-bar">
          <div
            id="balanceFill"
            class="balance-fill"
          ></div>
        </div>

        <small id="balanceMessage">
          Selecciona las fechas para calcular los días solicitados.
        </small>

      </div>

      <!-- INPUTS OCULTOS
           Se mantienen para compatibilidad
           con la lógica existente -->
      <input
        type="hidden"
        id="fechaInicio"
      />

      <input
        type="hidden"
        id="fechaFin"
      />

    </div>
  `;
}
