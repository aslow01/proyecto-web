/**
 * CONSTANTES GLOBALES
 * Configuración, permisos, roles, opciones
 */

// Permisos por rol
const ROLE_PERMISSIONS = {
  administrador: {
    pages: ['inicio', 'movilidades', 'requerimientos', 'combustibles', 'objetivos', 'partes', 'novedades', 'reportes', 'configuracion', 'usuarios'],
    actions: ['manageUsers', 'manageSettings', 'createVehicle', 'editVehicle', 'deleteVehicle', 'createGoal', 'createPart', 'editPart', 'createNews', 'editNews', 'resolveNews', 'exportData', 'viewReports'],
  },
  logistica: {
    pages: ['inicio', 'movilidades', 'requerimientos', 'combustibles', 'objetivos', 'partes', 'novedades', 'reportes'],
    actions: ['createVehicle', 'editVehicle', 'createGoal', 'createPart', 'editPart', 'createNews', 'editNews', 'resolveNews', 'exportData', 'viewReports'],
  },
  supervisor: {
    pages: ['inicio', 'movilidades', 'requerimientos', 'combustibles', 'objetivos', 'partes', 'novedades', 'reportes'],
    actions: ['createVehicle', 'editVehicle', 'deleteVehicle', 'createPart', 'editPart', 'createNews', 'editNews', 'resolveNews', 'exportData', 'viewReports'],
  },
  operador: {
    pages: ['inicio', 'movilidades', 'requerimientos', 'combustibles', 'objetivos', 'partes', 'novedades'],
    actions: ['createPart', 'createNews'],
  },
};

// Configuración de temas
const THEME_PREFERENCES = ['system', 'light', 'dark'];
const UI_PREFERENCES_KEY = 'huarpe.uiPreferences';
const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 20;
const INACTIVITY_TIMEOUT_MINUTES_OPTIONS = [10, 20, 30];

// Timings
const REALTIME_HEARTBEAT_MS = 3000;
const LOGIN_SUCCESS_TRANSITION_MS = 620;
const LOGIN_WELCOME_MS = 1300;
const INACTIVITY_WARNING_MS = 60 * 1000;
const INACTIVITY_ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

// Páginas con tracking de tiempo real
const REALTIME_TRACKED_PAGES = ['inicio', 'movilidades', 'objetivos', 'partes', 'novedades', 'reportes'];

// Configuración de sesión
const SESSION_COOKIE_NAME_DEFAULT = 'huarpe.sid';

// Vehículos
const VEHICLE_BRANDS = ['TOYOTA', 'RENAULT', 'FORD', 'VOLKSWAGEN', 'CHEVROLET', 'NISSAN', 'FIAT', 'PEUGEOT', 'CITROEN', 'MERCEDES-BENZ', 'IVECO', 'SCANIA', 'MITSUBISHI', 'JEEP', 'CFMOTO', 'OTRA'];
const VEHICLE_OWNERSHIP_OPTIONS = ['propia', 'alquilada'];
const VEHICLE_PROVINCES = ['mendoza', 'san-juan', 'santa-cruz', 'jujuy', 'salta', 'cordoba', 'san-luis', 'la-rioja', 'catamarca'];

const VEHICLE_UNIT_TYPES = {
  camioneta: {
    label: 'Camioneta',
    icon: 'fa-truck-pickup',
    identifierLabel: 'Patente',
    identifierPlaceholder: 'Ingresar patente',
    descriptionLabel: 'Modelo / descripción',
    descriptionPlaceholder: 'Ej. Hilux 2.8 4x4',
    defaultBrand: '',
  },
  cuatriciclo: {
    label: 'Cuatriciclo',
    icon: 'fa-motorcycle',
    identifierLabel: 'Patente',
    identifierPlaceholder: 'Ej. CFMOTO-450-01',
    descriptionLabel: 'Modelo / descripción',
    descriptionPlaceholder: 'Ej. CFORCE 450',
    defaultBrand: 'CFMOTO',
  },
};

const VEHICLE_DOCUMENTS = [
  { key: 'rto', field: 'rtoVencimiento', label: 'RTO' },
  { key: 'seguro', field: 'seguroVencimiento', label: 'Seguro' },
];

// Partes
const PARTE_STATUS_OPTIONS = [
  { value: '', label: 'Seleccionar' },
  { value: 'B', label: 'B - Bien' },
  { value: 'R', label: 'R - Revisar' },
  { value: 'L', label: 'L - Faltante' },
  { value: 'D', label: 'D - Desgastado' },
  { value: 'P', label: 'P - Reparar' },
  { value: 'C', label: 'C - Limpiar' },
  { value: 'NC', label: 'NC - No corresponde' },
  { value: 'O', label: 'O - Observar' },
];

const PARTE_CHECKLIST_SECTIONS = [
  {
    key: 'sistemaElectrico',
    title: 'Sistema electrico',
    items: [
      { key: 'lucesAltas', label: 'Luces altas' },
      { key: 'lucesBajas', label: 'Luces bajas' },
      { key: 'lucesPosicion', label: 'Luces de posicion' },
      { key: 'lucesGiro', label: 'Luces de giro' },
      { key: 'lucesFreno', label: 'Luces de freno' },
      { key: 'marchaAtras', label: 'Luz de marcha atras' },
      { key: 'balizas', label: 'Balizas' },
      { key: 'alarmaRetroceso', label: 'Alarma acustica de retroceso' },
      { key: 'tablero', label: 'Luces del tablero' },
      { key: 'luzInterior', label: 'Luz interior' },
      { key: 'bocina', label: 'Bocina' },
      { key: 'reflectores', label: 'Reflectores / terceros' },
    ],
  },
  {
    key: 'interior',
    title: 'Interior',
    items: [
      { key: 'elementosSueltos', label: 'Elementos sueltos en cabina' },
      { key: 'levantavidrios', label: 'Levantavidrios' },
      { key: 'cerraduras', label: 'Cerraduras' },
      { key: 'parasoles', label: 'Parasoles' },
      { key: 'calefaccion', label: 'Calefaccion / desempatador' },
      { key: 'aireAcondicionado', label: 'Aire acondicionado' },
      { key: 'asientos', label: 'Asientos' },
      { key: 'apoyacabezas', label: 'Apoyacabezas' },
      { key: 'cinturones', label: 'Cinturones de seguridad' },
      { key: 'guantera', label: 'Guantera' },
      { key: 'espejoInterior', label: 'Espejo retrovisor interior' },
      { key: 'otrosInterior', label: 'Otros' },
    ],
  },
  {
    key: 'carroceria',
    title: 'Carroceria y chasis',
    items: [
      { key: 'chapa', label: 'Chapa' },
      { key: 'pintura', label: 'Pintura' },
      { key: 'parabrisas', label: 'Parabrisas' },
      { key: 'limpiaparabrisas', label: 'Limpiaparabrisas' },
      { key: 'guardabarros', label: 'Guardabarros' },
      { key: 'paragolpeDelantero', label: 'Paragolpe delantero' },
      { key: 'paragolpeTrasero', label: 'Paragolpe trasero' },
      { key: 'puertas', label: 'Puertas' },
      { key: 'vidrios', label: 'Cristales / vidrios' },
      { key: 'cierrePuertas', label: 'Cierre y seguridad de puertas' },
      { key: 'espejosExternos', label: 'Espejos retrovisores' },
      { key: 'chasis', label: 'Chasis / bastidor' },
    ],
  },
  {
    key: 'accesorios',
    title: 'Elementos / accesorios',
    items: [
      { key: 'extintores', label: 'Extintores' },
      { key: 'palaPico', label: 'Pala y pico' },
      { key: 'eslinga', label: 'Eslinga / redes' },
      { key: 'botiquin', label: 'Botiquin' },
      { key: 'linterna', label: 'Linterna' },
      { key: 'balizaTriangulo', label: 'Balizas triangulo' },
      { key: 'llaveRuedas', label: 'Llave de ruedas' },
      { key: 'gato', label: 'Gato hidraulico / mecanico' },
      { key: 'kitHerramientas', label: 'Kit de herramientas' },
      { key: 'equipoRadio', label: 'Equipo de radio' },
      { key: 'pertiga', label: 'Pertiga' },
      { key: 'antiderrame', label: 'Anti derrame' },
    ],
  },
  {
    key: 'trenRodante',
    title: 'Tren rodante',
    items: [
      { key: 'cubiertas', label: 'Desgaste de cubiertas' },
      { key: 'llantasBulones', label: 'Llantas / bulones' },
      { key: 'alineacion', label: 'Alineacion / balanceo' },
      { key: 'presion', label: 'Presion de neumaticos' },
      { key: 'auxilio', label: 'Rueda de auxilio' },
      { key: 'otros', label: 'Otros' },
    ],
  },
  {
    key: 'operacionInvierno',
    title: 'Operacion invierno',
    items: [
      { key: 'refrigerante', label: 'Liquido refrigerante al 25%' },
      { key: 'limpiaParabrisas', label: 'Liquido limpia parabrisas' },
      { key: 'cadenas', label: 'Cadenas' },
      { key: 'tensores', label: 'Tensores para cadenas' },
      { key: 'guantesImpacto', label: 'Guantes de alto impacto' },
    ],
  },
];

// APP
const APP_TITLE = 'HUARPE LOGISTICA';
const API_ORIGIN = (() => {
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.port === '3000' ? '' : 'http://localhost:3000';
  }
  return '';
})();
