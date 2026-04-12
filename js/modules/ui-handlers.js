/**
 * MÓDULO: MANEJADORES UI
 * 
 * Centraliza todos los manejadores de eventos dinámicos para:
 * - Clics en elementos con data-action
 * - Cambios en selectores con data-change-action
 * - Inputs con data-input-action
 * 
 * Esto reemplaza la lógica dispersa de handleDynamicClick, 
 * handleDynamicChange, handleDynamicInput
 */

// ===========================
// CONTROLADOR DE CLICS DINÁMICOS
// ===========================

const CLICK_ACTIONS = {
  // Navegación y modales
  navigate: (el) => navigateTo(el.dataset.pageAction, el.dataset.filter || null),
  closeModal: () => closeModal(),
  keepSessionAlive: () => keepSessionAlive(),
  logout: () => logout(),
  openChangePasswordModal: () => openChangePasswordModal(),
  openAccountModal: () => openAccountModal(),
  changeCurrentPassword: () => changeCurrentPassword(),
  handleSearchResult: (el) => handleSearchResult(el.dataset.pageAction, el.dataset.filter || ''),
  
  // Movilidades
  openVehicleTypeSelector: () => openVehicleTypeSelector(),
  createMobilidadOfType: (el) => createMobilidadOfType(el.dataset.type),
  openNewMobilidadModal: () => openNewMobilidadModal(),
  guardarMovilidad: () => guardarMovilidad(),
  editarMovilidad: (el) => editarMovilidad(el.dataset.id),
  guardarMovilidadEditada: (el) => guardarMovilidadEditada(el.dataset.id),
  eliminarMovilidad: (el) => eliminarMovilidad(el.dataset.id),
  confirmarEliminarMovilidad: (el) => confirmarEliminarMovilidad(el.dataset.id),
  limpiarFiltrosMovilidades: () => limpiarFiltrosMovilidades(),
  exportarTabla: () => exportarTabla(),
  verHistorialMovilidad: (el) => verHistorialMovilidad(el.dataset.id),
  
  // Objetivos
  openNewObjetivoModal: () => openNewObjetivoModal(),
  guardarObjetivo: () => guardarObjetivo(),
  editarObjetivo: (el) => editarObjetivo(el.dataset.id),
  guardarObjetivoEditado: (el) => guardarObjetivoEditado(el.dataset.id),
  eliminarObjetivo: (el) => eliminarObjetivo(el.dataset.id),
  confirmarEliminarObjetivo: (el) => confirmarEliminarObjetivo(el.dataset.id),
  
  // Partes
  openNewParteModal: () => openNewParteModal(),
  guardarParte: () => guardarParte(),
  editarParte: (el) => editarParte(el.dataset.id),
  guardarParteEditado: (el) => guardarParteEditado(el.dataset.id),
  eliminarParte: (el) => eliminarParte(el.dataset.id),
  confirmarEliminarParte: (el) => confirmarEliminarParte(el.dataset.id),
  limpiarFiltrosPartes: () => limpiarFiltrosPartes(),
  verDetalleParte: (el) => verDetalleParte(el.dataset.id),
  
  // Novedades
  openNewNovedadModal: () => openNewNovedadModal(),
  guardarNovedad: () => guardarNovedad(),
  editarNovedad: (el) => editarNovedad(el.dataset.id),
  guardarNovedadEditada: (el) => guardarNovedadEditada(el.dataset.id),
  eliminarNovedad: (el) => eliminarNovedad(el.dataset.id),
  confirmarEliminarNovedad: (el) => confirmarEliminarNovedad(el.dataset.id),
  limpiarFiltrosNovedades: () => limpiarFiltrosNovedades(),
  verDetalleNovedad: (el) => verDetalleNovedad(el.dataset.id),
};

function handleDynamicClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  const handler = CLICK_ACTIONS[action];
  
  if (!handler) {
    console.warn(`Acción desconocida: ${action}`);
    return;
  }
  
  event.preventDefault();
  try {
    handler(actionEl, event);
  } catch (error) {
    console.error(`Error executando acción ${action}:`, error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// ===========================
// CONTROLADOR DE CAMBIOS DINÁMICOS
// ===========================

const CHANGE_ACTIONS = {
  previewThemePreference: (el) => previewThemePreference(el),
  filtrarMovilidades: () => filtrarMovilidades(),
  filtrarPartes: () => filtrarPartes(),
  filtrarNovedades: () => filtrarNovedades(),
};

function handleDynamicChange(event) {
  const actionEl = event.target.closest('[data-change-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.changeAction;
  const handler = CHANGE_ACTIONS[action];
  
  if (!handler) {
    console.warn(`Cambio desconocido: ${action}`);
    return;
  }

  try {
    handler(actionEl, event);
  } catch (error) {
    console.error(`Error executando cambio ${action}:`, error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// ===========================
// CONTROLADOR DE INPUTS DINÁMICOS
// ===========================

const INPUT_ACTIONS = {
  filtrarMovilidades: () => filtrarMovilidades(),
};

function handleDynamicInput(event) {
  const actionEl = event.target.closest('[data-input-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.inputAction;
  const handler = INPUT_ACTIONS[action];
  
  if (!handler) {
    console.warn(`Input desconocido: ${action}`);
    return;
  }

  try {
    handler(actionEl, event);
  } catch (error) {
    console.error(`Error executando input ${action}:`, error);
  }
}

// ===========================
// HELPERS DE VALIDACIÓN
// ===========================

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateRequiredFields(fields) {
  const missing = [];
  fields.forEach(({ id, label }) => {
    const value = document.getElementById(id)?.value.trim();
    if (!value) missing.push(label);
  });
  return missing;
}

// ===========================
// HELPERS DE RENDERIZADO
// ===========================

function renderVehicleBrandOptions(selectedValue = '') {
  return ['<option value="">Seleccionar marca</option>', 
    ...(VEHICLE_BRANDS || []).map(brand => 
      `<option value="${escapeHtml(brand)}" ${brand === selectedValue ? 'selected' : ''}>${escapeHtml(brand)}</option>`
    )
  ].join('');
}

function renderVehicleUnitTypeOptions(selectedValue = 'camioneta') {
  const normalized = normalizeVehicleUnitType(selectedValue);
  return Object.entries(VEHICLE_UNIT_TYPES || {})
    .map(([value, config]) => 
      `<option value="${escapeHtml(value)}" ${value === normalized ? 'selected' : ''}>${escapeHtml(config.label)}</option>`
    ).join('');
}

function renderVehicleOwnershipOptions(selectedValue = 'propia') {
  const options = ['propia', 'alquilada'];
  return options.map(option => 
    `<option value="${escapeHtml(option)}" ${option === selectedValue ? 'selected' : ''}>${escapeHtml(capitalize(option))}</option>`
  ).join('');
}

function renderVehicleProvinceOptions(selectedValue = '') {
  return (VEHICLE_PROVINCES || [])
    .map(province => 
      `<option value="${escapeHtml(province)}" ${province === selectedValue ? 'selected' : ''}>${escapeHtml(provinciaLabel(province))}</option>`
    ).join('');
}

function normalizeVehicleUnitType(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(VEHICLE_UNIT_TYPES || {}, normalized) ? normalized : 'camioneta';
}

function renderVehicleUnitTypeBadge(unitType) {
  const config = (VEHICLE_UNIT_TYPES || {})[normalizeVehicleUnitType(unitType)] || {};
  return `<span class="vehicle-file-indicator loaded"><i class="fa-solid ${config.icon || 'fa-car'}"></i> ${config.label || 'Vehículo'}</span>`;
}

function getVehicleDisplayName(movilidad) {
  const marca = String(movilidad?.marca || '').trim();
  const descripcion = String(movilidad?.descripcion || '').trim();
  if (!marca) return descripcion;
  if (!descripcion) return marca;
  return descripcion.toUpperCase().startsWith(marca.toUpperCase()) ? descripcion : `${marca} ${descripcion}`;
}

// ===========================
// HELPERS DE VALIDACIÓN VEHICULAR
// ===========================

function validateVehicleTechnicalFields({ anio = '', numeroMotor = '', numeroChasis = '' }) {
  const trimmedYear = String(anio || '').trim();
  const trimmedMotor = String(numeroMotor || '').trim();
  const trimmedChassis = String(numeroChasis || '').trim();
  const currentYear = new Date().getFullYear() + 1;

  if (trimmedYear && !/^(19|20)\d{2}$/.test(trimmedYear)) {
    return 'El año debe tener 4 dígitos válidos.';
  }

  if (trimmedYear) {
    const yearNumber = Number(trimmedYear);
    if (yearNumber < 1900 || yearNumber > currentYear) {
      return `El año debe estar entre 1900 y ${currentYear}.`;
    }
  }

  if (trimmedMotor && !/^[A-Za-z0-9-\/]{4,40}$/.test(trimmedMotor)) {
    return 'El número de motor solo puede incluir letras, números, guiones o barra, entre 4 y 40 caracteres.';
  }

  if (trimmedChassis && !/^[A-Za-z0-9-\/]{6,40}$/.test(trimmedChassis)) {
    return 'El número de chasis solo puede incluir letras, números, guiones o barra, entre 6 y 40 caracteres.';
  }

  return '';
}

function validateVehicleServiceFields({ kmActual = '', kmProximoService = '' }) {
  const current = String(kmActual || '').trim();
  const next = String(kmProximoService || '').trim();

  if (current && !/^\d{1,7}$/.test(current)) {
    return 'El km actual debe contener solo números.';
  }

  if (next && !/^\d{1,7}$/.test(next)) {
    return 'El km próximo service debe contener solo números.';
  }

  return '';
}

function parseVehicleKilometers(value) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}

function formatVehicleKilometers(value) {
  const numeric = parseVehicleKilometers(value);
  if (numeric === null) return 'Sin dato';
  return `${numeric.toLocaleString('es-AR')} km`;
}

function getVehicleServiceInfo(movilidad) {
  const current = parseVehicleKilometers(movilidad?.kmActual);
  const next = parseVehicleKilometers(movilidad?.kmProximoService);
  if (current === null || next === null) {
    return { current, next, remaining: null, status: 'missing' };
  }
  const remaining = next - current;
  if (remaining < 0) {
    return { current, next, remaining, status: 'overdue' };
  }
  if (remaining <= 500) {
    return { current, next, remaining, status: 'warning' };
  }
  return { current, next, remaining, status: 'ok' };
}

function getVehicleServiceRemainingLabel(movilidad) {
  const info = getVehicleServiceInfo(movilidad);
  if (info.remaining === null) return 'Sin dato';
  if (info.remaining < 0) return `Vencido por ${Math.abs(info.remaining).toLocaleString('es-AR')} km`;
  return `Faltan ${info.remaining.toLocaleString('es-AR')} km`;
}

function renderVehicleServiceStatus(movilidad) {
  const info = getVehicleServiceInfo(movilidad);
  if (info.remaining === null) {
    return '<span class="vehicle-file-indicator empty"><i class="fa-solid fa-screwdriver-wrench"></i> Sin dato</span>';
  }
  if (info.status === 'overdue') {
    return `<span class="vehicle-file-indicator empty"><i class="fa-solid fa-triangle-exclamation"></i> ${getVehicleServiceRemainingLabel(movilidad)}</span>`;
  }
  if (info.status === 'warning') {
    return `<span class="vehicle-file-indicator loaded"><i class="fa-solid fa-screwdriver-wrench"></i> ${getVehicleServiceRemainingLabel(movilidad)}</span>`;
  }
  return `<span class="vehicle-file-indicator loaded"><i class="fa-solid fa-gauge-high"></i> ${getVehicleServiceRemainingLabel(movilidad)}</span>`;
}

function renderVehicleFileIndicator(movilidad) {
  // Placeholder - implementar en próxima fase
  return '<span class="vehicle-file-indicator empty"><i class="fa-regular fa-file"></i> Sin archivos</span>';
}

console.log('✅ Módulo ui-handlers.js cargado.');
