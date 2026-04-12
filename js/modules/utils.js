/**
 * UTILIDADES
 * Funciones auxiliares de formateo, validación y conversión
 */

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || '--';
}

// Formateo de fechas
function formatFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function formatMaybeDate(value) {
  return value ? formatFecha(value) : 'Sin dato';
}

function parseDateOnly(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getTodayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Formateo de reloj
function formatMsAsClock(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Provincias
function provinciaLabel(p) {
  return {
    mendoza: 'Mendoza',
    'san-juan': 'San Juan',
    'santa-cruz': 'Santa Cruz',
    jujuy: 'Jujuy',
    salta: 'Salta',
    cordoba: 'Córdoba',
    'san-luis': 'San Luis',
    'la-rioja': 'La Rioja',
    catamarca: 'Catamarca',
  }[p] || p;
}

// Estados
function estadoBadge(estado) {
  const map = { 
    disponible: ['status-disponible', 'Disponible'], 
    servicio: ['status-servicio', 'En servicio'], 
    mantenimiento: ['status-mantenimiento', 'Mantenimiento'], 
    fuera: ['status-fuera', 'Fuera de servicio'] 
  };
  const [cls, label] = map[estado] || ['status-fuera', estado];
  return `<span class="status-badge ${cls}">${label}</span>`;
}

// Vehículos
function normalizeVehicleUnitType(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(VEHICLE_UNIT_TYPES, normalized) ? normalized : 'camioneta';
}

function getVehicleUnitConfig(value = '') {
  return VEHICLE_UNIT_TYPES[normalizeVehicleUnitType(value)];
}

function getVehicleUnitTypeLabel(value = '') {
  return getVehicleUnitConfig(value).label;
}

function getVehicleDisplayName(movilidad) {
  const marca = String(movilidad?.marca || '').trim();
  const descripcion = String(movilidad?.descripcion || '').trim();
  if (!marca) return descripcion;
  if (!descripcion) return marca;
  return descripcion.toUpperCase().startsWith(marca.toUpperCase()) ? descripcion : `${marca} ${descripcion}`;
}

function buildObjectiveFilterKey(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Kilómetros
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

// Validación de vehículos
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

// Documentos
function getDocumentAlertInfo(fecha) {
  if (!fecha) {
    return {
      fecha: '',
      daysRemaining: null,
      isExpired: false,
      isAlert: false,
      level: 'missing',
      label: 'Sin fecha cargada',
    };
  }

  const dueDate = parseDateOnly(fecha);
  if (!dueDate) {
    return {
      fecha,
      daysRemaining: null,
      isExpired: false,
      isAlert: false,
      level: 'missing',
      label: 'Fecha inválida',
    };
  }

  const today = getTodayDateOnly();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((dueDate - today) / msPerDay);

  if (daysRemaining < 0) {
    return {
      fecha,
      daysRemaining,
      isExpired: true,
      isAlert: true,
      level: 'expired',
      label: `Vencida hace ${Math.abs(daysRemaining)} día${Math.abs(daysRemaining) !== 1 ? 's' : ''}`,
    };
  }

  if (daysRemaining <= 15) {
    return {
      fecha,
      daysRemaining,
      isExpired: false,
      isAlert: true,
      level: 'critical',
      label: `Vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
    };
  }

  if (daysRemaining <= 30) {
    return {
      fecha,
      daysRemaining,
      isExpired: false,
      isAlert: false,
      level: 'warning',
      label: `Vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
    };
  }

  return {
    fecha,
    daysRemaining,
    isExpired: false,
    isAlert: false,
    level: 'ok',
    label: `Vigente hasta ${formatFecha(fecha)}`,
  };
}

// Archivos
function isSafeDataUrl(value, kind = 'any') {
  const dataUrl = String(value || '').trim();
  if (!dataUrl) return false;
  if (kind === 'pdf') return /^data:application\/pdf;base64,[a-z0-9+/=]+$/i.test(dataUrl);
  if (kind === 'image') return /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(dataUrl);
  return /^data:(application\/pdf|image\/[a-z0-9.+-]+);base64,[a-z0-9+/=]+$/i.test(dataUrl);
}

function getSafeDataUrl(value, kind = 'any') {
  return isSafeDataUrl(value, kind) ? String(value).trim() : '';
}

function normalizeParteAdjunto(adjunto) {
  const value = adjunto && typeof adjunto === 'object' ? adjunto : {};
  return {
    name: value.name || '',
    type: value.type || '',
    dataUrl: value.dataUrl || '',
  };
}

// Permiso de tiempo real
function isVehicleDocumentTrackingEnabled(movilidad) {
  return movilidad?.estado !== 'fuera';
}

// Obtener todas las alertas de documentos
function getAllVehicleDocumentAlerts(movilidades) {
  return movilidades
    .filter(isVehicleDocumentTrackingEnabled)
    .flatMap(movilidad => VEHICLE_DOCUMENTS.map(document => ({
      movilidad,
      document,
      info: getDocumentAlertInfo(movilidad[document.field]),
    })));
}

function hasCriticalVehicleDocumentAlert(movilidad) {
  if (!isVehicleDocumentTrackingEnabled(movilidad)) return false;
  return VEHICLE_DOCUMENTS.some(document => {
    const info = getDocumentAlertInfo(movilidad[document.field]);
    return info.level === 'critical' || info.level === 'expired';
  });
}

function hasWarningVehicleDocumentAlert(movilidad) {
  if (!isVehicleDocumentTrackingEnabled(movilidad)) return false;
  return !hasCriticalVehicleDocumentAlert(movilidad) && VEHICLE_DOCUMENTS.some(document => getDocumentAlertInfo(movilidad[document.field]).level === 'warning');
}

function buildDocumentToolbarMessage(criticalCount, warningCount) {
  const parts = [];
  if (criticalCount) {
    parts.push(`${criticalCount} movilidad${criticalCount !== 1 ? 'es' : ''} con alerta roja documental`);
  }
  if (warningCount) {
    parts.push(`${warningCount} movilidad${warningCount !== 1 ? 'es' : ''} con alerta amarilla a 30 días`);
  }
  return parts.join(' · ');
}

// Obtener número de archivos cargados
function countVehicleLoadedFiles(movilidad) {
  const documents = normalizeVehicleFileDocuments(movilidad);
  return [documents.tarjetaVerde, documents.titulo, documents.contratoFirmado, documents.rto]
    .filter(file => file && file.dataUrl)
    .length;
}

function normalizeVehicleFileDocuments(movilidad = {}) {
  return {
    tarjetaVerde: normalizeParteAdjunto(movilidad.tarjetaVerdeAdjunto),
    titulo: normalizeParteAdjunto(movilidad.tituloAdjunto),
    contratoFirmado: normalizeParteAdjunto(movilidad.contratoFirmadoAdjunto),
    rto: normalizeParteAdjunto(movilidad.rtoAdjunto),
  };
}

// Parte
function normalizeParteCabecera(cabecera, parte = {}) {
  const unidad = DATA.movilidades.find(item => item.patente === parte.unidad) || null;
  return createParteCabeceraBase({ fecha: parte.fecha || '', unidad, existing: cabecera || {} });
}

function normalizeParteDocumentacion(documentacion) {
  return createParteDocumentacionBase(documentacion || {});
}

function normalizeParteChecklist(checklist) {
  return createParteChecklistBase(checklist || {});
}

function createParteCabeceraBase({ fecha = '', unidad = null, existing = {} } = {}) {
  const description = unidad?.descripcion || '';
  const parts = description.split(' ').filter(Boolean);
  const marca = existing.marca || unidad?.marca || (parts[0] || '');
  return {
    empresa: existing.empresa || 'HUARPE',
    movilInterno: existing.movilInterno || '',
    numeroControl: existing.numeroControl || '',
    patente: existing.patente || unidad?.patente || '',
    marca,
    modelo: existing.modelo || description,
    kmActual: existing.kmActual || '',
    fechaUltimoService: existing.fechaUltimoService || '',
    kmProximoService: existing.kmProximoService || '',
    firmaEntrega: existing.firmaEntrega || '',
    firmaRecibe: existing.firmaRecibe || '',
    firmaSupervisor: existing.firmaSupervisor || '',
    fecha,
    chofer: existing.chofer || unidad?.chofer || '',
  };
}

function createParteDocumentacionBase(existing = {}) {
  return {
    seguro: { estado: existing.seguro?.estado || '', vencimiento: existing.seguro?.vencimiento || '' },
    vtv: { estado: existing.vtv?.estado || '', vencimiento: existing.vtv?.vencimiento || '' },
    habilitacion: { estado: existing.habilitacion?.estado || '', vencimiento: existing.habilitacion?.vencimiento || '' },
  };
}

function createParteChecklistBase(existing = {}) {
  const checklist = {};
  PARTE_CHECKLIST_SECTIONS.forEach(section => {
    checklist[section.key] = {};
    section.items.forEach(item => {
      checklist[section.key][item.key] = existing?.[section.key]?.[item.key] || '';
    });
  });
  return checklist;
}
