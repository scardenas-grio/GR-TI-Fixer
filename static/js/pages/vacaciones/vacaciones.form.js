function formularioVacaciones() {
  return `

<div class="vacaciones-form fade-in">

    <h2>

        🌴 Solicitud de Vacaciones

    </h2>

    <div class="resume-box">

        <div>

            <span>Saldo disponible</span>

            <strong id="saldoDias">

                12 días

            </strong>

        </div>

        <div>

            <span>Días solicitados</span>

            <strong id="diasSolicitados">

                —

            </strong>

        </div>

        <div>

            <span>Te quedarán</span>

            <strong id="diasRestantes">

                —

            </strong>

        </div>

    </div>

    <div class="form-grid">

        <div class="form-group">

            <label>

                Fecha de inicio

            </label>

            <input
                id="fechaInicio"
                type="date">

        </div>

        <div class="form-group">

            <label>

                Fecha final

            </label>

            <input
                id="fechaFin"
                type="date">

        </div>

    </div>

    <button class="btn btn-primary">

        Continuar

        <i class="fa-solid fa-arrow-right"></i>

    </button>

</div>

<div class="vacation-balance">

    <div class="balance-header">

        <span>

            Días disponibles

        </span>

        <strong id="balanceText">

            12 / 20 días

        </strong>

    </div>

    <div class="balance-bar">

        <div
            id="balanceFill"
            class="balance-fill">

        </div>

    </div>

    <small id="balanceMessage">

        Tienes suficientes días para realizar la solicitud.

    </small>

</div>

`;
}
