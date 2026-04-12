/**
 * APLICACION PRINCIPAL - PUNTO DE ENTRADA
 * 
 * Esta es la versión modularizada de la aplicación.
 * Carga todos los módulos y coordina la inicialización.
 * 
 * MÓDULOS CARGADOS:
 * - constants.js: Constantes globales
 * - state.js: Estado global
 * - utils.js: Utilidades
 * - api.js: Llamadas a API
 * - auth.js: Autenticación
 * 
 * Nota: Los módulos deben cargarse ANTES de este archivo en index.html
 */

// ===========================
// REFERENCIAS DOM GLOBALES
// ===========================

let authOverlay, loginForm, loginEmail, loginPassword, passwordToggle, rememberSession, loginMessage;
let sidebar, sidebarToggle, topbarToggle, sidebarCollapsed = false;
let mainWrapper, topbar, pageContent, globalSearch, searchDropdown;
let modalOverlay, modal, modalTitle, modalClose, modalBody, modalFooter;
let topbarUser, topbarAvatar, topbarUserName, currentDateEl, alertBtn;
let sidebarAvatar, sidebarUserName, sidebarUserRole;
let inactivityWarningOpen = false, inactivityWarningId, realtimeHeartbeatId;

// ===========================
// INICIALIZACIÓN
// ===========================

function initDOMReferences() {
  // AUTH
  authOverlay = document.getElementById('authOverlay');
  loginForm = document.getElementById('loginForm');
  loginEmail = document.getElementById('loginEmail');
  loginPassword = document.getElementById('loginPassword');
  passwordToggle = document.getElementById('passwordToggle');
  rememberSession = document.getElementById('rememberSession');
  loginMessage = document.getElementById('loginMessage');

  // SIDEBAR
  sidebar = document.getElementById('sidebar');
  sidebarToggle = document.getElementById('sidebarToggle');
  topbarToggle = document.getElementById('topbarToggle');
  sidebarAvatar = document.getElementById('sidebarAvatar');
  sidebarUserName = document.getElementById('sidebarUserName');
  sidebarUserRole = document.getElementById('sidebarUserRole');

  // MAIN CONTENT
  mainWrapper = document.getElementById('mainWrapper');
  pageContent = document.getElementById('pageContent');
  topbar = document.querySelector('.topbar');

  // SEARCH
  globalSearch = document.getElementById('globalSearch');
  searchDropdown = document.getElementById('searchDropdown');

  // MODAL
  modalOverlay = document.getElementById('modalOverlay');
  modal = document.getElementById('modal');
  modalTitle = document.getElementById('modalTitle');
  modalClose = document.getElementById('modalClose');
  modalBody = document.getElementById('modalBody');
  modalFooter = document.getElementById('modalFooter');

  // TOPBAR
  topbarUser = document.getElementById('topbarUser');
  topbarAvatar = document.getElementById('topbarAvatar');
  topbarUserName = document.getElementById('topbarUserName');
  currentDateEl = document.getElementById('currentDate');
  alertBtn = document.getElementById('alertBtn');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializar referencias del DOM
    initDOMReferences();
    
    // Inicializar preferencias de UI
    uiPreferences = loadUiPreferences();
    applyThemePreference(uiPreferences.theme, { persist: false });
    
    // Crear contenedor de notificaciones
    createToastContainer();
    
    // Fecha actual
    setCurrentDate();
    
    // Actualizar badges de alertas
    updateAlertBadges();
    
    // Vincular eventos
    bindNav();
    bindSidebar();
    bindSearch();
    bindModal();
    bindAuth();
    bindDynamicActions();
    bindInactivityTracking();
    
    // Restaurar sesión
    await restoreSession();

    if (currentUser) {
      unlockApplication();
      updateNavigationByPermissions();
      if (typeof initDataSync === 'function') {
        await initDataSync();
      }
      renderPage('inicio');
      if (typeof initRealtimeSync === 'function') {
        await initRealtimeSync();
      } else {
        startRealtimeHeartbeat();
      }
    } else {
      lockApplication();
    }
  } catch (error) {
    console.error('Error en inicialización:', error);
    showToast('Hubo un error al inicializar la aplicación.', 'error');
  }
});

// ===========================  
// SINCRONIZACIÓN Y ESTADO
// ===========================

function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function updateNavigationByPermissions() {
  document.querySelectorAll('.nav-item').forEach(item => {
    const page = item.dataset.page;
    const container = item.closest('li');
    if (!container || !page) return;
    container.style.display = currentUser && canViewPage(page) ? '' : 'none';
  });

  document.querySelectorAll('.nav-subitem').forEach(item => {
    const page = item.dataset.page;
    const container = item.closest('li');
    if (!container || !page) return;
    container.style.display = currentUser && canViewPage(page) ? '' : 'none';
  });
}

function updateAlertBadges() {
  const urgent = DATA.novedades.filter(n => n.estado === 'urgente').length;
  const badges = [document.getElementById('badgeNovedades'), ...document.querySelectorAll('.topbar-btn .badge')];

  badges.forEach(badge => {
    if (!badge) return;
    badge.textContent = urgent ? String(urgent) : '';
    badge.style.display = urgent ? '' : 'none';
  });
}

// ===========================
// SIDEBAR
// ===========================

function bindSidebar() {
  [sidebarToggle, topbarToggle].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!currentUser) return;
      if (window.innerWidth <= 900) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebarCollapsed = !sidebarCollapsed;
        sidebar.classList.toggle('collapsed', sidebarCollapsed);
        mainWrapper.classList.toggle('sidebar-collapsed', sidebarCollapsed);
      }
    });
  });
}

// ===========================
// NAVEGACIÓN
// ===========================

function bindNav() {
  sidebar?.addEventListener('click', e => {
    const navItem = e.target.closest('.nav-item');
    const navSubitem = e.target.closest('.nav-subitem');

    if (navItem) {
      e.preventDefault();
      if (!currentUser) return;
      const page = navItem.dataset.page;
      const hasSubmenu = navItem.classList.contains('has-submenu');

      if (hasSubmenu) {
        navItem.classList.toggle('open');
        const submenu = navItem.closest('li')?.querySelector('.submenu');
        if (submenu) submenu.classList.toggle('open');
        return;
      }

      setActiveNav(navItem);
      currentFilter = null;
      renderPage(page);
      if (window.innerWidth <= 900) sidebar.classList.remove('mobile-open');
      return;
    }

    if (navSubitem) {
      e.preventDefault();
      if (!currentUser) return;
      const page = navSubitem.dataset.page;
      const filter = navSubitem.dataset.filter;
      currentFilter = filter;
      renderPage(page, filter);
      if (window.innerWidth <= 900) sidebar.classList.remove('mobile-open');
    }
  });
}

function setActiveNav(el) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

function navigateTo(page, filter) {
  if (!currentUser) return;
  currentFilter = filter || null;
  renderPage(page, filter);
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.page === page && !i.classList.contains('has-submenu'));
  });
}

function renderPageWithFilter(page, filter) {
  renderPage(page, filter);
}

// ===========================
// MODALES
// ===========================

function openModal(title, bodyHTML, footerHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalFooter.innerHTML = footerHTML || '';
  modalOverlay.classList.add('show');
}

function closeModal(options = {}) {
  const force = options.force === true;
  if (inactivityWarningOpen && !force) {
    return;
  }
  modalOverlay.classList.remove('show');
  delete modalOverlay.dataset.mobilityEditId;
  clearRealtimeEditContext();
}

function bindModal() {
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
}

// ===========================
// SEARCH
// ===========================

function bindSearch() {
  globalSearch.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) { searchDropdown.classList.remove('show'); return; }

    const results = [];
    DATA.movilidades.filter(m => m.patente.toLowerCase().includes(q) || m.descripcion.toLowerCase().includes(q) || m.chofer.toLowerCase().includes(q))
      .slice(0, 3).forEach(m => results.push({ icon: 'fa-car', title: m.patente, sub: m.descripcion, page: 'movilidades', filter: m.provincia }));
    DATA.objetivos.filter(o => o.nombre.toLowerCase().includes(q))
      .slice(0, 2).forEach(o => results.push({ icon: 'fa-bullseye', title: o.nombre, sub: o.descripcion, page: 'objetivos' }));
    DATA.novedades.filter(n => n.titulo.toLowerCase().includes(q) || n.unidad.toLowerCase().includes(q))
      .slice(0, 2).forEach(n => results.push({ icon: 'fa-bell', title: n.titulo, sub: n.unidad, page: 'novedades' }));

    const allowedResults = results.filter(result => canViewPage(result.page));

    if (!allowedResults.length) {
      searchDropdown.innerHTML = `<div style="padding:14px;text-align:center;color:var(--color-text-light);font-size:13px">Sin resultados</div>`;
    } else {
      searchDropdown.innerHTML = allowedResults.map(r => `
        <div class="search-result-item" data-action="handleSearchResult" data-page-action="${r.page}" data-filter="${escapeHtml(r.filter || '')}">
          <i class="fa-solid ${r.icon}"></i>
          <div><div class="result-title">${escapeHtml(r.title)}</div><div class="result-sub">${escapeHtml(r.sub)}</div></div>
        </div>
      `).join('');
    }
    searchDropdown.classList.add('show');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-bar')) searchDropdown.classList.remove('show');
  });
}

function handleSearchResult(page, filter) {
  globalSearch.value = '';
  searchDropdown.classList.remove('show');
  navigateTo(page, filter || null);
}

// ===========================
// AUTENTICACIÓN
// ===========================

function bindAuth() {
  loginForm?.addEventListener('submit', handleLogin);
  passwordToggle?.addEventListener('click', toggleLoginPasswordVisibility);
  rememberSession?.addEventListener('change', persistRememberSessionPreference);
  topbarUser?.addEventListener('click', () => {
    if (!currentUser) return;
    openAccountModal();
  });

  const savedRememberChoice = window.localStorage.getItem('huarpe.rememberSession');
  if (rememberSession && savedRememberChoice !== null) {
    rememberSession.checked = savedRememberChoice === 'true';
  }
}

function persistRememberSessionPreference() {
  const value = rememberSession?.checked ?? false;
  window.localStorage.setItem('huarpe.rememberSession', String(value));
}

// ===========================
// ACCIONES DINÁMICAS
// ===========================

function bindDynamicActions() {
  document.addEventListener('click', handleDynamicClick);
  document.addEventListener('change', handleDynamicChange);
  document.addEventListener('input', handleDynamicInput);
}

function handleDynamicClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  const moduleClickHandlers = typeof CLICK_ACTIONS !== 'undefined' ? CLICK_ACTIONS : null;
  const clickHandlers = {
    navigate: el => navigateTo(el.dataset.pageAction, el.dataset.filter || null),
    closeModal: () => closeModal(),
    keepSessionAlive: () => keepSessionAlive(),
    logout: () => logout(),
    openChangePasswordModal: () => openChangePasswordModal(),
    openAccountModal: () => openAccountModal(),
    changeCurrentPassword: () => changeCurrentPassword(),
    handleSearchResult: el => handleSearchResult(el.dataset.pageAction, el.dataset.filter || ''),
  };

  const handler = (moduleClickHandlers && moduleClickHandlers[action]) || clickHandlers[action];
  if (!handler) return;
  event.preventDefault();
  handler(actionEl, event);
}

function handleDynamicChange(event) {
  const actionEl = event.target.closest('[data-change-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.changeAction;
  const moduleChangeHandlers = typeof CHANGE_ACTIONS !== 'undefined' ? CHANGE_ACTIONS : null;
  const changeHandlers = {
    previewThemePreference: el => previewThemePreference(el),
  };

  const handler = (moduleChangeHandlers && moduleChangeHandlers[action]) || changeHandlers[action];
  if (!handler) return;
  handler(actionEl, event);
}

function handleDynamicInput(event) {
  const actionEl = event.target.closest('[data-input-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.inputAction;
  const moduleInputHandlers = typeof INPUT_ACTIONS !== 'undefined' ? INPUT_ACTIONS : null;
  const inputHandlers = {
  };

  const handler = (moduleInputHandlers && moduleInputHandlers[action]) || inputHandlers[action];
  if (!handler) return;
  handler(actionEl, event);
}

// ===========================
// RENDERIZADO DE PÁGINAS
// ===========================

function renderPage(page, filter) {
  if (!currentUser) return;
  if (!canViewPage(page)) {
    renderAccessDenied(page);
    return;
  }
  currentPage = page;
  const renderers = {
    inicio: typeof renderInicio === 'function' ? renderInicio : renderAccessDenied,
    movilidades: typeof renderMovilidades === 'function' ? renderMovilidades : renderAccessDenied,
    requerimientos: typeof renderRequerimientos === 'function' ? renderRequerimientos : renderAccessDenied,
    combustibles: typeof renderCombustibles === 'function' ? renderCombustibles : renderAccessDenied,
    objetivos: typeof renderObjetivos === 'function' ? renderObjetivos : renderAccessDenied,
    partes: typeof renderPartes === 'function' ? renderPartes : renderAccessDenied,
    novedades: typeof renderNovedades === 'function' ? renderNovedades : renderAccessDenied,
    reportes: typeof renderReportes === 'function' ? renderReportes : renderAccessDenied,
    configuracion: typeof renderConfiguracion === 'function' ? renderConfiguracion : renderAccessDenied,
    usuarios: typeof renderUsuarios === 'function' ? renderUsuarios : renderAccessDenied,
  };
  pageContent.innerHTML = '';
  (renderers[page] || renderAccessDenied)(filter);
  renderRealtimePageContext();
  queueRealtimeHeartbeat();
}

// Temporal - esto se reemplazará con los renderizadores reales
function renderAccessDenied(page) {
  pageContent.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-wrench"></i>
      <h3>Módulo en construcción</h3>
      <p>Este módulo está siendo refactorizado.</p>
      <p>Carga los módulos de páginas (pages-*.js) para ver el contenido.</p>
    </div>
  `;
}

// ===========================
// TIEMPO REAL
// ===========================

function startRealtimeHeartbeat() {
  stopRealtimeHeartbeat();
  if (!currentUser) return;
  queueRealtimeHeartbeat();
  realtimeHeartbeatId = window.setInterval(() => {
    queueRealtimeHeartbeat();
  }, REALTIME_HEARTBEAT_MS);
}

function stopRealtimeHeartbeat() {
  if (realtimeHeartbeatId) {
    window.clearInterval(realtimeHeartbeatId);
    realtimeHeartbeatId = null;
  }
  realtimeState.samePageUsers = [];
  realtimeState.pendingRefresh = false;
  realtimeState.notifiedVersion = 0;
  realtimeState.lastChangedByName = '';
  realtimeState.lastChangedPage = '';
  realtimeState.editContext = { mode: '', entityType: '', entityId: null, entityLabel: '' };
  renderRealtimePageContext();
}

function queueRealtimeHeartbeat() {
  if (!currentUser || !REALTIME_TRACKED_PAGES.includes(currentPage)) {
    renderRealtimePageContext();
    return;
  }
  heartbeatRealtime().catch(() => {});
}

function renderRealtimePageContext() {
  const existing = document.getElementById('realtimePageContext');
  if (existing) existing.remove();
  if (!currentUser || !REALTIME_TRACKED_PAGES.includes(currentPage) || !pageContent?.children.length) return;

  const others = realtimeState.samePageUsers || [];
  const presenceText = others.length
    ? `${others.map(user => user.nombre).join(', ')} ${others.length === 1 ? 'también está' : 'también están'} en ${getPageLabel(currentPage)}.`
    : `Solo vos estás viendo ${getPageLabel(currentPage)} ahora.`;
  
  const markup = `
    <div class="realtime-page-context" id="realtimePageContext">
      <div class="realtime-presence-block">
        <div class="realtime-presence-title"><i class="fa-solid fa-signal"></i> Presencia en vivo</div>
        <div class="realtime-presence-text">${escapeHtml(presenceText)}</div>
      </div>
    </div>
  `;

  const header = pageContent.querySelector('.page-header');
  if (header) {
    header.insertAdjacentHTML('afterend', markup);
  } else {
    pageContent.insertAdjacentHTML('afterbegin', markup);
  }
}

function getPageLabel(page) {
  return {
    inicio: 'Inicio',
    movilidades: 'Movilidades',
    requerimientos: 'Requerimientos',
    combustibles: 'Combustibles',
    objetivos: 'Objetivos',
    partes: 'Partes',
    novedades: 'Novedades',
    reportes: 'Reportes',
  }[page] || 'esta sección';
}

function syncObjetivosSubmenu() {
  const submenu = document.getElementById('objetivosSubmenu');
  if (!submenu) return;
  const items = [`<li><a href="#" class="nav-subitem" data-page="objetivos" data-filter="todos"><i class="fa-solid fa-list"></i> Todos</a></li>`];
  (DATA.objetivos || []).forEach(objetivo => {
    items.push(`<li><a href="#" class="nav-subitem" data-page="objetivos" data-filter="${escapeHtml(buildObjectiveFilterKey(objetivo.nombre))}"><i class="fa-solid fa-bullseye"></i> ${escapeHtml(objetivo.nombre)}</a></li>`);
  });
  submenu.innerHTML = items.join('');
}

function syncRealtimeMobilityUI() {
  syncMobilityEditModalState();
}

function syncMobilityEditModalState() {
  // Placeholder para sincronización de editores reales
}

// ===========================
// NOTIFICACIONES (TOAST)
// ===========================

function createToastContainer() {
  const div = document.createElement('div');
  div.className = 'toast-container';
  div.id = 'toastContainer';
  document.body.appendChild(div);
}

function showToast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = document.createElement('i');
  icon.className = `fa-solid ${icons[type] || icons.info}`;
  const text = document.createElement('span');
  text.textContent = String(msg ?? '');
  toast.append(icon, text);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===========================
// FUNCIONES DE PERMISOS
// ===========================

function canViewPage(page) {
  if (!currentUser) return false;
  const perms = ROLE_PERMISSIONS[currentUser.rol] || ROLE_PERMISSIONS.operador;
  return (perms.pages || []).includes(page);
}

function can(action) {
  if (!currentUser) return false;
  const perms = ROLE_PERMISSIONS[currentUser.rol] || ROLE_PERMISSIONS.operador;
  return (perms.actions || []).includes(action);
}

// ===========================
// FUNCIONES DE APLICACIÓN
// ===========================

function lockApplication() {
  document.body.classList.remove('auth-entering');
  authOverlay?.classList.remove('is-exiting');
  document.body.classList.add('auth-locked');
  authOverlay?.classList.add('show');
  if (pageContent) pageContent.innerHTML = '';
  document.title = 'Iniciar sesion | HUARPE LOGISTICA';
  syncCurrentUserUI();
}

function unlockApplication() {
  document.body.classList.remove('auth-entering');
  authOverlay?.classList.remove('is-exiting');
  document.body.classList.remove('auth-locked');
  authOverlay?.classList.remove('show');
  document.title = 'HUARPE LOGISTICA';
  syncCurrentUserUI();
}

function syncCurrentUserUI() {
  const displayName = currentUser?.nombre || 'Sin usuario';
  const displayRole = currentUser?.rol || 'Perfil no configurado';
  const avatar = currentUser?.nombre?.substring(0, 2).toUpperCase() || '--';
  
  [sidebarUserName, topbarUserName].forEach(el => { if (el) el.textContent = displayName; });
  [sidebarUserRole].forEach(el => { if (el) el.textContent = displayRole; });
  [sidebarAvatar, topbarAvatar].forEach(el => { if (el) el.textContent = avatar; });
}

// ===========================
// FUNCIONES DE UI
// ===========================

function setLoginMessage(msg, type = 'info') {
  if (!loginMessage) return;
  loginMessage.textContent = msg || '';
  loginMessage.className = `auth-message ${type}`;
}

function toggleLoginPasswordVisibility() {
  if (!loginPassword || !passwordToggle) return;
  const shouldShow = loginPassword.type === 'password';
  loginPassword.type = shouldShow ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', shouldShow ? 'true' : 'false');
  passwordToggle.setAttribute('aria-label', shouldShow ? 'Ocultar contraseña' : 'Mostrar contraseña');
  const icon = passwordToggle.querySelector('i');
  if (icon) {
    icon.className = shouldShow ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  }
}

// ===========================
// CONSTANTES DE TIEMPO REAL
// ===========================

const REALTIME_TRACKED_PAGES = ['movilidades', 'objetivos', 'partes', 'novedades'];
const REALTIME_HEARTBEAT_MS = 5000; // 5 segundos
let systemThemeMediaQuery = null;
let inactivityTrackingBound = false;
let inactivityWarningTimeoutId = null;
let inactivityCountdownIntervalId = null;
let inactivityDeadlineAt = 0;

const INACTIVITY_ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'dblclick', 'wheel'];
const UI_PREFERENCES_KEY = 'huarpe.uiPreferences';
const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 30;

// ===========================
// RASTREO DE INACTIVIDAD
// ===========================

function bindInactivityTracking() {
  if (inactivityTrackingBound) return;
  INACTIVITY_ACTIVITY_EVENTS.forEach(eventName => {
    document.addEventListener(eventName, handleInactivityActivity, true);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleInactivityActivity();
    }
  });
  inactivityTrackingBound = true;
}

function handleInactivityActivity() {
  if (!currentUser || inactivityWarningOpen) return;
  resetInactivityTimers();
}

function startInactivityTracking() {
  if (!currentUser) return;
  resetInactivityTimers();
}

function stopInactivityTracking() {
  if (inactivityWarningTimeoutId) {
    window.clearTimeout(inactivityWarningTimeoutId);
    inactivityWarningTimeoutId = null;
  }
  if (inactivityCountdownIntervalId) {
    window.clearInterval(inactivityCountdownIntervalId);
    inactivityCountdownIntervalId = null;
  }
  inactivityDeadlineAt = 0;
  closeInactivityWarning({ force: true });
}

function resetInactivityTimers() {
  if (!currentUser) return;
  if (inactivityWarningTimeoutId) window.clearTimeout(inactivityWarningTimeoutId);
  if (inactivityCountdownIntervalId) window.clearInterval(inactivityCountdownIntervalId);

  const timeoutMs = (uiPreferences?.inactivityMinutes || DEFAULT_INACTIVITY_TIMEOUT_MINUTES) * 60 * 1000;
  inactivityDeadlineAt = Date.now() + timeoutMs;
  
  inactivityWarningTimeoutId = window.setTimeout(() => {
    openInactivityWarning();
  }, timeoutMs - 60000); // Mostrar alerta 1 minuto antes
}

// ===========================
// AYUDADORES
// ===========================

function buildObjectiveFilterKey(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function saveUiPreferences() {
  if (!uiPreferences) return;
  window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(uiPreferences));
}

function normalizeThemePreference(value) {
  const valid = ['light', 'dark', 'system'];
  return valid.includes(value) ? value : 'system';
}

function normalizeInactivityTimeoutMinutes(value) {
  const num = parseInt(value, 10);
  const min = 1, max = 1440;
  return isNaN(num) ? DEFAULT_INACTIVITY_TIMEOUT_MINUTES : Math.max(min, Math.min(max, num));
}

// ===========================
// INACTIVIDAD - MODALES
// ===========================

function openInactivityWarning() {
  if (inactivityWarningOpen || !currentUser) return;
  inactivityWarningOpen = true;
  
  const remainingMs = Math.max(0, inactivityDeadlineAt - Date.now());
  const remainingSec = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  
  const body = `
    <p>Tu sesión expirará en <strong>${minutes}m ${seconds}s</strong> por inactividad.</p>
    <p>¿Quieres mantener tu sesión?</p>
  `;
  
  const footer = `
    <button class="btn btn-secondary" data-action="closeModal">No, cerrar sesión</button>
    <button class="btn btn-primary" data-action="keepSessionAlive">Sí, mantener sesión</button>
  `;
  
  openModal('Sesión expirando', body, footer);
  
  if (inactivityCountdownIntervalId) window.clearInterval(inactivityCountdownIntervalId);
  inactivityCountdownIntervalId = window.setInterval(() => {
    updateInactivityCountdown();
  }, 1000);
}

function updateInactivityCountdown() {
  const remainingMs = Math.max(0, inactivityDeadlineAt - Date.now());
  if (remainingMs <= 0) {
    forceLogoutByInactivity();
    return;
  }
  
  const remainingSec = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const para = modalBody?.querySelector('p');
  if (para) {
    para.innerHTML = `Tu sesión expirará en <strong>${minutes}m ${seconds}s</strong> por inactividad.`;
  }
}

function closeInactivityWarning(options = {}) {
  const force = options.force === true;
  if (!inactivityWarningOpen && !force) return;
  
  inactivityWarningOpen = false;
  closeModal({ force: true });
  
  if (inactivityCountdownIntervalId) {
    window.clearInterval(inactivityCountdownIntervalId);
    inactivityCountdownIntervalId = null;
  }
}

function keepSessionAlive() {
  closeInactivityWarning();
  resetInactivityTimers();
  showToast('Sesión renovada.', 'success');
}

function forceLogoutByInactivity() {
  closeInactivityWarning({ force: true });
  showToast('Sesión expirada por inactividad.', 'warning');
  logout();
}

// ===========================
// RENDEDOR DE CONTEXTO REAL-TIME
// ===========================

function setRealtimeEditContext(mode, entityType, entityId, entityLabel) {
  if (!currentUser) return;
  realtimeState.editContext = { mode, entityType, entityId, entityLabel };
  queueRealtimeHeartbeat();
}

function clearRealtimeEditContext() {
  realtimeState.editContext = { mode: '', entityType: '', entityId: null, entityLabel: '' };
}

function getRealtimeEditorsForEntity(entityType, entityId) {
  const others = (realtimeState.samePageUsers || []).filter(u =>
    u.editContext?.entityType === entityType &&
    u.editContext?.entityId === entityId &&
    u.id !== currentUser?.id
  );
  return others;
}

// ===========================
// MODALES DE USUARIO
// ===========================

function openAccountModal() {
  if (!currentUser) return;
  openModal('Sesión activa', `
    <div class="account-summary">
      <div class="avatar" style="width:48px;height:48px">${escapeHtml(getInitials(currentUser.nombre))}</div>
      <div>
        <h3 style="font-size:18px;margin-bottom:4px">${escapeHtml(currentUser.nombre)}</h3>
        <p style="color:var(--color-text-light);margin-bottom:6px">${escapeHtml(currentUser.email)}</p>
        <span class="status-badge status-servicio">${escapeHtml(currentUser.rol)}</span>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cerrar</button>
    <button class="btn btn-primary" data-action="openChangePasswordModal"><i class="fa-solid fa-key"></i> Cambiar contraseña</button>
    <button class="btn btn-danger" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
  `);
}

function openChangePasswordModal() {
  if (!currentUser) return;
  openModal('Cambiar contraseña', `
    <div class="form-grid">
      <div class="form-group full"><label>Contraseña actual</label><input type="password" id="cpCurrent" placeholder="Ingresar contraseña actual"></div>
      <div class="form-group full"><label>Nueva contraseña</label><input type="password" id="cpNew" placeholder="Ingresar nueva contraseña"></div>
      <div class="form-group full"><label>Repetir nueva contraseña</label><input type="password" id="cpConfirm" placeholder="Repetir nueva contraseña"></div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="openAccountModal">Volver</button>
    <button class="btn btn-primary" data-action="changeCurrentPassword"><i class="fa-solid fa-floppy-disk"></i> Guardar contraseña</button>
  `);
}

async function changeCurrentPassword() {
  if (!currentUser) return;

  const currentPassword = document.getElementById('cpCurrent')?.value || '';
  const newPassword = document.getElementById('cpNew')?.value || '';
  const confirmPassword = document.getElementById('cpConfirm')?.value || '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('Completá todos los campos de contraseña.', 'warning');
    return;
  }

  if (newPassword.length < 8) {
    showToast('La nueva contraseña debe tener al menos 8 caracteres.', 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('La confirmación no coincide con la nueva contraseña.', 'warning');
    return;
  }

  try {
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    closeModal();
    showToast('Contraseña actualizada correctamente.', 'success');
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar la contraseña.', 'error');
  }
}

// ===========================
// FUNCIONES AUXILIARES - STRINGS
// ===========================

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || '--';
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

console.log('✅ Aplicación inicializada. Carga los módulos de páginas para funcionalidad completa.');
