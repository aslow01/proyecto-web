/**
 * ESTADO GLOBAL
 * Variables de estado compartidas por toda la aplicación
 */

// Estado de sesión y usuario
let currentUser = null;
let csrfToken = '';

// Estado de navegación
let currentPage = 'inicio';
let currentFilter = null;
let sidebarCollapsed = false;

// Preferencias de UI
let uiPreferences = {
  theme: 'system',
  inactivityMinutes: DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
};
let systemThemeMediaQuery = null;

// Estado de inactividad
let inactivityWarningTimeoutId = null;
let inactivityCountdownIntervalId = null;
let inactivityDeadlineAt = 0;
let inactivityWarningOpen = false;
let inactivityTrackingBound = false;

// Estado de tiempo real
let realtimeHeartbeatId = null;
let realtimeState = {
  samePageUsers: [],
  lastSeenVersion: 0,
  pendingRefresh: false,
  notifiedVersion: 0,
  lastChangedByName: '',
  lastChangedPage: '',
  editContext: { mode: '', entityType: '', entityId: null, entityLabel: '' },
};

// Datos operacionales
const DATA = {
  movilidades: [],
  objetivos: [],
  partes: [],
  novedades: [],
  usuarios: [],
};

// Referencias del DOM
let sidebar = null;
let mainWrapper = null;
let pageContent = null;
let sidebarToggle = null;
let topbarToggle = null;
let modalOverlay = null;
let modal = null;
let modalTitle = null;
let modalBody = null;
let modalFooter = null;
let modalClose = null;
let globalSearch = null;
let searchDropdown = null;
let authOverlay = null;
let loginForm = null;
let loginEmail = null;
let loginPassword = null;
let loginMessage = null;
let passwordToggle = null;
let rememberSession = null;
let loginSubmitButton = null;
let sidebarAvatar = null;
let sidebarUserName = null;
let sidebarUserRole = null;
let topbarUser = null;
let topbarAvatar = null;
let topbarUserName = null;

/**
 * Inicializa las referencias del DOM
 */
function initDOMReferences() {
  sidebar = document.getElementById('sidebar');
  mainWrapper = document.getElementById('mainWrapper');
  pageContent = document.getElementById('pageContent');
  sidebarToggle = document.getElementById('sidebarToggle');
  topbarToggle = document.getElementById('topbarToggle');
  modalOverlay = document.getElementById('modalOverlay');
  modal = document.getElementById('modal');
  modalTitle = document.getElementById('modalTitle');
  modalBody = document.getElementById('modalBody');
  modalFooter = document.getElementById('modalFooter');
  modalClose = document.getElementById('modalClose');
  globalSearch = document.getElementById('globalSearch');
  searchDropdown = document.getElementById('searchDropdown');
  authOverlay = document.getElementById('authOverlay');
  loginForm = document.getElementById('loginForm');
  loginEmail = document.getElementById('loginEmail');
  loginPassword = document.getElementById('loginPassword');
  loginMessage = document.getElementById('loginMessage');
  passwordToggle = document.getElementById('passwordToggle');
  rememberSession = document.getElementById('rememberSession');
  loginSubmitButton = document.querySelector('.auth-submit');
  sidebarAvatar = document.getElementById('sidebarAvatar');
  sidebarUserName = document.getElementById('sidebarUserName');
  sidebarUserRole = document.getElementById('sidebarUserRole');
  topbarUser = document.getElementById('topbarUser');
  topbarAvatar = document.getElementById('topbarAvatar');
  topbarUserName = document.getElementById('topbarUserName');
}

/**
 * Carga preferencias de UI desde localStorage
 */
function loadUiPreferences() {
  try {
    const rawValue = window.localStorage.getItem(UI_PREFERENCES_KEY);
    if (!rawValue) {
      return { theme: 'system', inactivityMinutes: DEFAULT_INACTIVITY_TIMEOUT_MINUTES };
    }
    const parsed = JSON.parse(rawValue);
    return {
      theme: normalizeThemePreference(parsed?.theme),
      inactivityMinutes: normalizeInactivityTimeoutMinutes(parsed?.inactivityMinutes),
    };
  } catch (_error) {
    return { theme: 'system', inactivityMinutes: DEFAULT_INACTIVITY_TIMEOUT_MINUTES };
  }
}

/**
 * Guarda preferencias de UI en localStorage
 */
function saveUiPreferences() {
  window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(uiPreferences));
}

/**
 * Normaliza preferencia de tema
 */
function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : 'system';
}

/**
 * Normaliza tiempo de inactividad
 */
function normalizeInactivityTimeoutMinutes(value) {
  const numericValue = Number(value);
  return INACTIVITY_TIMEOUT_MINUTES_OPTIONS.includes(numericValue)
    ? numericValue
    : DEFAULT_INACTIVITY_TIMEOUT_MINUTES;
}

/**
 * Obtiene valor de timeout en ms
 */
function getInactivityTimeoutMs() {
  return normalizeInactivityTimeoutMinutes(uiPreferences.inactivityMinutes) * 60 * 1000;
}
