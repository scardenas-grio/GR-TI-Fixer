/*================================================
  TI-FIXER
  Vacaciones - Página Principal
================================================*/

document.addEventListener('DOMContentLoaded', function() {
  initForm();
  initCalendar();
});

// ========================================
// FORMULARIO
// ========================================

function initForm() {
  const formSolicitud = document.getElementById('formSolicitud');
  const observaciones = document.getElementById('observaciones');
  const charCount = document.getElementById('charCount');
  const tipoPermiso = document.getElementById('tipoPermiso');

  // Contador de caracteres
  if (observaciones && charCount) {
    observaciones.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });
  }

  // Cambio de tipo de permiso
  if (tipoPermiso) {
    tipoPermiso.addEventListener('change', function() {
      updateDescripcion(this.value);
    });
  }

  // Submit del formulario
  if (formSolicitud) {
    formSolicitud.addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm();
    });
  }
}

function updateDescripcion(tipo) {
  const descripciones = {
    'vacaciones': {
      title: 'Solicitud de Vacaciones',
      desc: 'Selecciona los días que deseas tomar de vacaciones.',
      icon: 'umbrella-beach'
    },
    'permiso': {
      title: 'Solicitud de Permiso',
      desc: 'Registra tu permiso personal o laboral.',
      icon: 'file-check'
    },
    'horas': {
      title: 'Campos para Horas extras',
      desc: 'Registra el tiempo laborado fuera de tu horario habitual.',
      icon: 'clock'
    },
    'incapacidad': {
      title: 'Solicitud de Incapacidad',
      desc: 'Adjunta el documento médico correspondiente.',
      icon: 'bandage'
    }
  };

  const grupoDes = document.getElementById('descripcionGroup');
  if (grupoDes && descripciones[tipo]) {
    const info = descripciones[tipo];
    grupoDes.innerHTML = `
      <div class="desc-box">
        <div class="desc-icon">
          <i class="fa-solid fa-${info.icon}"></i>
        </div>
        <div class="desc-content">
          <h4>${info.title}</h4>
          <p>${info.desc}</p>
        </div>
      </div>
    `;
  }
}

function submitForm() {
  // Aquí iría el submit del formulario (cuando el backend esté listo)
  console.log('Formulario enviado');
  
  // Por ahora, mostrar notificación
  showNotification('Solicitud en captura', 'La solicitud ha sido capturada localmente.', 'info');
}

// ========================================
// CALENDARIO
// ========================================

function initCalendar() {
  const meses = document.querySelectorAll('.calendar-month');
  
  meses.forEach((mes, index) => {
    // Marcar julio como activo
    if (index === 6) {
      mes.classList.add('active');
    }

    mes.addEventListener('click', function() {
      // Remover active de todos
      meses.forEach(m => m.classList.remove('active'));
      // Agregar active al clickeado
      this.classList.add('active');
    });
  });
}

// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(titulo, mensaje, tipo = 'success') {
  // Crear elemento de notificación
  const notif = document.createElement('div');
  notif.className = `notification notification-${tipo}`;
  notif.innerHTML = `
    <div class="notif-content">
      <h4>${titulo}</h4>
      <p>${mensaje}</p>
    </div>
    <button class="notif-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-times"></i>
    </button>
  `;

  document.body.appendChild(notif);

  // Auto remover después de 4 segundos
  setTimeout(() => {
    notif.remove();
  }, 4000);
}

// ========================================
// INTERACCIONES DE TABLA
// ========================================

document.addEventListener('click', function(e) {
  // Click en fila de tabla
  if (e.target.closest('.tabla tbody tr')) {
    const fila = e.target.closest('tr');
    console.log('Fila clickeada:', fila);
  }
});
//actualizarBarra(saldoDisponible);
