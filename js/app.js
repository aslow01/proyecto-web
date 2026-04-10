// ===== LOGIPANEL - APP.JS =====

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

// ---- State ----
let currentPage = 'inicio';
let currentFilter = null;
let sidebarCollapsed = false;
let currentUser = null;
const REALTIME_TRACKED_PAGES = ['inicio', 'movilidades', 'objetivos', 'partes', 'novedades', 'reportes'];
const REALTIME_HEARTBEAT_MS = 3000;
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

const API_ORIGIN = (() => {
  if (window.location.protocol === 'file:') return 'http://localhost:3000';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.port === '3000' ? '' : 'http://localhost:3000';
  }
  return '';
})();
const APP_TITLE = 'HUARPE LOGISTICA';
const VEHICLE_BRANDS = ['TOYOTA', 'RENAULT', 'FORD', 'VOLKSWAGEN', 'CHEVROLET', 'NISSAN', 'FIAT', 'PEUGEOT', 'CITROEN', 'MERCEDES-BENZ', 'IVECO', 'SCANIA', 'MITSUBISHI', 'JEEP', 'CFMOTO', 'OTRA'];
const VEHICLE_OWNERSHIP_OPTIONS = ['propia', 'alquilada'];
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
const VEHICLE_PROVINCES = ['mendoza', 'san-juan', 'santa-cruz', 'jujuy', 'salta', 'cordoba', 'san-luis', 'la-rioja', 'catamarca'];
const VEHICLE_DOCUMENTS = [
  { key: 'rto', field: 'rtoVencimiento', label: 'RTO' },
  { key: 'seguro', field: 'seguroVencimiento', label: 'Seguro' },
];
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

// ---- DOM Refs ----
const sidebar = document.getElementById('sidebar');
const mainWrapper = document.getElementById('mainWrapper');
const pageContent = document.getElementById('pageContent');
const sidebarToggle = document.getElementById('sidebarToggle');
const topbarToggle = document.getElementById('topbarToggle');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
const modalClose = document.getElementById('modalClose');
const globalSearch = document.getElementById('globalSearch');
const searchDropdown = document.getElementById('searchDropdown');
const authOverlay = document.getElementById('authOverlay');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginMessage = document.getElementById('loginMessage');
const passwordToggle = document.getElementById('passwordToggle');
const rememberSession = document.getElementById('rememberSession');
const sidebarAvatar = document.getElementById('sidebarAvatar');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserRole = document.getElementById('sidebarUserRole');
const topbarUser = document.getElementById('topbarUser');
const topbarAvatar = document.getElementById('topbarAvatar');
const topbarUserName = document.getElementById('topbarUserName');

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  createToastContainer();
  setCurrentDate();
  updateAlertBadges();
  bindNav();
  bindSidebar();
  bindSearch();
  bindModal();
  bindAuth();
  await restoreSession();

  if (currentUser) {
    unlockApplication();
    renderPage('inicio');
    startRealtimeHeartbeat();
  } else {
    lockApplication();
  }
});

// ---- Date ----
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ---- Sidebar ----
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

// ---- Navigation ----
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

// ---- Page Router ----
function renderPage(page, filter) {
  if (!currentUser) return;
  if (!canViewPage(page)) {
    renderAccessDenied(page);
    return;
  }
  currentPage = page;
  const renderers = {
    inicio: renderInicio,
    movilidades: renderMovilidades,
    requerimientos: renderRequerimientos,
    combustibles: renderCombustibles,
    objetivos: renderObjetivos,
    partes: renderPartes,
    novedades: renderNovedades,
    reportes: renderReportes,
    configuracion: renderConfiguracion,
    usuarios: renderUsuarios,
  };
  pageContent.innerHTML = '';
  (renderers[page] || renderInicio)(filter);
  renderRealtimePageContext();
  queueRealtimeHeartbeat();
}

// ===========================
// INICIO
// ===========================
function renderInicio() {
  const mov = DATA.movilidades;
  const totalDisp = mov.filter(m => m.estado === 'disponible').length;
  const totalServ = mov.filter(m => m.estado === 'servicio').length;
  const totalMant = mov.filter(m => m.estado === 'mantenimiento').length;
  const novedadesActivas = DATA.novedades.filter(n => n.estado !== 'resuelto').length;
  const novedadesUrgentes = DATA.novedades.filter(n => n.estado === 'urgente').length;
  const documentAlerts = getAllVehicleDocumentAlerts(mov);
  const criticalDocumentAlerts = documentAlerts.filter(item => item.info.level === 'critical' || item.info.level === 'expired');
  const warningDocumentAlerts = documentAlerts.filter(item => item.info.level === 'warning');
  const totalDocumentIssues = criticalDocumentAlerts.length + warningDocumentAlerts.length;
  const panelToneClass = criticalDocumentAlerts.length
    ? 'dashboard-alert-panel-danger dashboard-alert-panel-active'
    : warningDocumentAlerts.length
      ? 'dashboard-alert-panel-warning'
      : 'dashboard-alert-panel-safe';
  const panelMessage = criticalDocumentAlerts.length
    ? 'Hay documentación con alerta roja. Conviene revisarla antes del vencimiento.'
    : warningDocumentAlerts.length
      ? 'Hay documentación dentro de la ventana preventiva de 30 días. Conviene programar la renovación.'
      : 'No hay documentación próxima a vencer en este momento.';
  const panelItems = criticalDocumentAlerts.length ? criticalDocumentAlerts : warningDocumentAlerts;
  const modules = [
    { page: 'movilidades', accent: '#2563eb', bg: '#dbeafe', color: '#2563eb', icon: 'fa-car', title: 'Movilidades', text: 'Gestión de vehículos, choferes y estados operativos por provincia.', stat: mov.length },
    { page: 'requerimientos', accent: '#0f766e', bg: '#ccfbf1', color: '#0f766e', icon: 'fa-clipboard-check', title: 'Requerimientos', text: 'Módulo reservado para pedidos, necesidades y seguimiento interno.', stat: 'Próx.' },
    { page: 'objetivos', accent: '#8b5cf6', bg: '#ede9fe', color: '#8b5cf6', icon: 'fa-bullseye', title: 'Objetivos', text: 'Clientes y proyectos con unidades, choferes y partes asignados.', stat: DATA.objetivos.length },
    { page: 'partes', accent: '#22c55e', bg: '#dcfce7', color: '#16a34a', icon: 'fa-clipboard-list', title: 'Partes Diarios', text: 'Registro diario de servicios: km, combustible, chofer y observaciones.', stat: DATA.partes.length },
    { page: 'novedades', accent: '#f59e0b', bg: '#fef3c7', color: '#d97706', icon: 'fa-bell', title: 'Novedades', text: 'Roturas, mantenimientos, incidentes y observaciones activas.', stat: novedadesActivas },
    { page: 'reportes', accent: '#06b6d4', bg: '#cffafe', color: '#0891b2', icon: 'fa-chart-bar', title: 'Reportes', text: 'Partes por fecha, novedades por unidad, historial y exportación.', stat: '—' },
    { page: 'configuracion', accent: '#64748b', bg: '#f1f5f9', color: '#475569', icon: 'fa-gear', title: 'Configuración', text: 'Parámetros del sistema, notificaciones y gestión de la plataforma.', stat: '—' },
    { page: 'usuarios', accent: '#0f766e', bg: '#ccfbf1', color: '#0f766e', icon: 'fa-users', title: 'Usuarios', text: 'Altas, bajas y permisos según el rol asignado.', stat: DATA.usuarios.length },
  ].filter(module => canViewPage(module.page));

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Panel de Inicio</h2>
        <p>Resumen general del estado operativo</p>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-card-icon"><i class="fa-solid fa-car"></i></div>
        <div class="stat-card-info">
          <div class="stat-value">${mov.length}</div>
          <div class="stat-label">Total unidades</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-card-icon"><i class="fa-solid fa-circle-check"></i></div>
        <div class="stat-card-info">
          <div class="stat-value">${totalDisp}</div>
          <div class="stat-label">Disponibles</div>
        </div>
      </div>
      <div class="stat-card blue">
        <div class="stat-card-icon"><i class="fa-solid fa-circle-play"></i></div>
        <div class="stat-card-info">
          <div class="stat-value">${totalServ}</div>
          <div class="stat-label">En servicio</div>
        </div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-card-icon"><i class="fa-solid fa-wrench"></i></div>
        <div class="stat-card-info">
          <div class="stat-value">${totalMant}</div>
          <div class="stat-label">En mantenimiento</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-card-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="stat-card-info">
          <div class="stat-value">${novedadesUrgentes + totalDocumentIssues}</div>
          <div class="stat-label">Alertas activas</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-card-icon"><i class="fa-solid fa-clipboard-check"></i></div>
        <div class="stat-card-info">
          <div class="stat-value">${DATA.partes.length}</div>
          <div class="stat-label">Partes del período</div>
        </div>
      </div>
    </div>

    <div class="dashboard-alert-panel ${panelToneClass}" ${(criticalDocumentAlerts.length || warningDocumentAlerts.length) ? 'onclick="navigateTo(\'movilidades\')"' : ''}>
      <div class="dashboard-alert-header">
        <div>
          <h3><i class="fa-solid fa-triangle-exclamation"></i> Vencimientos documentales</h3>
          <p>${panelMessage}</p>
        </div>
        <div class="dashboard-alert-total ${criticalDocumentAlerts.length ? 'danger' : warningDocumentAlerts.length ? 'warning' : 'safe'}">${totalDocumentIssues}</div>
      </div>
      <div class="dashboard-alert-stats">
        ${VEHICLE_DOCUMENTS.map(documento => {
          const criticalCount = documentAlerts.filter(item => item.document.key === documento.key && (item.info.level === 'critical' || item.info.level === 'expired')).length;
          const warningCount = documentAlerts.filter(item => item.document.key === documento.key && item.info.level === 'warning').length;
          const tone = criticalCount ? 'danger' : warningCount ? 'warning' : '';
          const detail = criticalCount ? `Rojas: ${criticalCount}` : warningCount ? `Amarillas: ${warningCount}` : 'Sin alertas';
          return `<div class="dashboard-alert-stat ${tone}"><span>${documento.label}</span><strong>${criticalCount + warningCount}</strong><small>${detail}</small></div>`;
        }).join('')}
      </div>
      ${panelItems.length ? `
        <div class="dashboard-alert-list">
          ${panelItems.slice(0, 6).map(item => `
            <div class="dashboard-alert-item">
              <strong>${item.movilidad.patente}</strong>
              <span>${item.document.label}</span>
              ${renderVehicleDocumentBadge(item.document, item.movilidad[item.document.field])}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <h3 style="margin-bottom:16px;font-size:15px;font-weight:700;">Módulos</h3>
    <div class="home-cards">
      ${modules.map(module => `
      <div class="home-card" style="--card-accent:${module.accent};--card-icon-bg:${module.bg};--card-icon-color:${module.color};" onclick="navigateTo('${module.page}')">
        <div class="home-card-icon"><i class="fa-solid ${module.icon}"></i></div>
        <h3>${module.title}</h3>
        <p>${module.text}</p>
        <div class="card-stat" style="color:${module.color}">${module.stat}</div>
      </div>`).join('')}
    </div>

    ${novedadesUrgentes > 0 ? `
    <div style="margin-top:28px;">
      <h3 style="margin-bottom:14px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;">
        <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444"></i> Alertas urgentes
      </h3>
      ${DATA.novedades.filter(n => n.estado === 'urgente').map(n => novedadCard(n)).join('')}
    </div>` : ''}
  `;
}

function renderRequerimientos() {
  pageContent.innerHTML = `
    <section class="coming-soon-panel">
      <h3>Próximamente</h3>
    </section>
  `;
}

function renderCombustibles() {
  pageContent.innerHTML = `
    <section class="coming-soon-panel">
      <h3>Próximamente</h3>
    </section>
  `;
}

// ===========================
// MOVILIDADES
// ===========================
function renderMovilidades(filter) {
  let data = [...DATA.movilidades];
  const canCreate = can('createVehicle');
  const canEdit = can('editVehicle');
  const canExportData = can('exportData');
  const provincias = VEHICLE_PROVINCES;
  const estados = ['disponibles', 'en-servicio', 'mantenimiento'];

  if (filter && provincias.includes(filter)) data = data.filter(m => m.provincia === filter);
  if (filter === 'disponibles') data = data.filter(m => m.estado === 'disponible');
  if (filter === 'en-servicio') data = data.filter(m => m.estado === 'servicio');
  if (filter === 'mantenimiento') data = data.filter(m => m.estado === 'mantenimiento');
  const criticalDocumentCount = data.filter(movilidad => hasCriticalVehicleDocumentAlert(movilidad)).length;
  const warningDocumentCount = data.filter(movilidad => hasWarningVehicleDocumentAlert(movilidad)).length;

  const filterTitle = {
    mendoza: 'Mendoza', 'san-juan': 'San Juan', 'santa-cruz': 'Santa Cruz', jujuy: 'Jujuy', salta: 'Salta', cordoba: 'Córdoba', 'san-luis': 'San Luis', 'la-rioja': 'La Rioja', catamarca: 'Catamarca',
    disponibles: 'Disponibles', 'en-servicio': 'En servicio', mantenimiento: 'En mantenimiento', todas: 'Todas'
  };

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-car" style="color:var(--color-primary);margin-right:8px;"></i>Movilidades ${filter ? '– ' + (filterTitle[filter] || '') : ''}</h2>
        <p>Listado general de unidades operativas</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" onclick="openVehicleTypeSelector()"><i class="fa-solid fa-plus"></i> Nueva unidad</button>` : ''}
        ${canExportData ? `<button class="btn btn-secondary" onclick="exportarTabla()"><i class="fa-solid fa-file-export"></i> Exportar</button>` : ''}
      </div>
    </div>

    <div class="filters-bar" id="filtrosMovilidades">
      <div class="filter-group">
        <label>Provincia</label>
        <select id="filtProvincia" onchange="filtrarMovilidades()">
          <option value="">Todas</option>
          ${renderVehicleProvinceOptions(filter)}
        </select>
      </div>
      <div class="filter-group">
        <label>Objetivo</label>
        <select id="filtObjetivo" onchange="filtrarMovilidades()">
          <option value="">Todos</option>
          ${DATA.objetivos.map(o => `<option value="${o.nombre.toLowerCase()}">${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Estado</label>
        <select id="filtEstado" onchange="filtrarMovilidades()">
          <option value="">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="servicio">En servicio</option>
          <option value="mantenimiento">En mantenimiento</option>
          <option value="fuera">Fuera de servicio</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tipo</label>
        <select id="filtTipoPropiedad" onchange="filtrarMovilidades()">
          <option value="">Todas</option>
          <option value="propia">Propia</option>
          <option value="alquilada">Alquilada</option>
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="limpiarFiltrosMovilidades()"><i class="fa-solid fa-rotate-left"></i> Limpiar</button>
    </div>

    <div class="table-wrapper" id="tablaMovilidadesWrapper">
      <div class="table-toolbar">
        <h3 id="countMovilidades">${data.length} unidad${data.length !== 1 ? 'es' : ''}</h3>
        ${(criticalDocumentCount || warningDocumentCount) ? `<div class="rto-toolbar-alert ${criticalDocumentCount ? 'danger' : 'warning'}"><i class="fa-solid fa-triangle-exclamation"></i> ${buildDocumentToolbarMessage(criticalDocumentCount, warningDocumentCount)}</div>` : ''}
        <input type="text" id="buscarMovilidad" placeholder="Buscar patente, chofer..." 
          style="padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;font-size:13px;outline:none;width:220px;"
          oninput="filtrarMovilidades()">
      </div>
      <div id="tablaMovilidadesContent">
        ${renderTablaMovilidades(data, canEdit)}
      </div>
    </div>
  `;

  if (filter && provincias.includes(filter)) {
    document.getElementById('filtProvincia').value = filter;
  }
}

function renderTablaMovilidades(data, canEdit = can('editVehicle'), canDelete = can('deleteVehicle')) {
  if (!data.length) return `<div class="empty-state"><i class="fa-solid fa-car-burst"></i><h3>Sin resultados</h3><p>No hay unidades que coincidan con los filtros</p></div>`;
  return `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th>Patente</th><th>Descripción</th><th>Clase</th><th>Estado</th>
      <th>Archivos</th><th>Provincia</th><th>Objetivo</th><th>Chofer</th>
      <th>Ubicación</th><th>Próx. service</th><th>Documentación</th><th>Última novedad</th><th>Acciones</th>
    </tr></thead>
    <tbody>
      ${data.map(m => {
        const lockInfo = getRealtimeMobilityLockInfo(m.id);
        const editors = lockInfo.editors;
        const rowClasses = [];
        if (hasCriticalVehicleDocumentAlert(m)) {
          rowClasses.push('table-row-alert', 'table-row-alert-pulse');
        } else if (hasWarningVehicleDocumentAlert(m)) {
          rowClasses.push('table-row-warning');
        }
        if (editors.length) {
          rowClasses.push('table-row-editing-live');
        }
        const editingBadge = editors.length
          ? `<div class="live-edit-badge"><i class="fa-solid fa-pen-ruler"></i> ${escapeHtml(editors.map(user => user.nombre).join(', '))} ${editors.length === 1 ? 'está editando esta unidad' : 'están editando esta unidad'}</div>`
          : '';
        return `<tr class="${rowClasses.join(' ')}">
        <td><strong>${m.patente}</strong>${editingBadge}</td>
        <td>${escapeHtml(getVehicleDisplayName(m))}</td>
        <td>${renderVehicleUnitTypeBadge(m.tipoUnidad)}</td>
        <td>${estadoBadge(m.estado)}</td>
        <td>${renderVehicleFileIndicator(m)}</td>
        <td><i class="fa-solid fa-map-pin" style="color:var(--color-primary);margin-right:4px;"></i>${provinciaLabel(m.provincia)}</td>
        <td>${m.objetivo}</td>
        <td>${m.chofer}</td>
        <td style="color:var(--color-text-light);font-size:12px">${m.ubicacion}</td>
        <td>${renderVehicleServiceStatus(m)}</td>
        <td>${renderVehicleDocumentStatusStack(m)}</td>
        <td style="color:var(--color-text-light);font-size:12px;max-width:180px">${m.ultimaNovedad}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" title="Ver historial" onclick="verHistorialMovilidad(${m.id})"><i class="fa-solid fa-eye"></i></button>
            ${canEdit ? `<button class="btn-icon ${lockInfo.locked ? 'is-locked' : ''}" title="${escapeHtml(lockInfo.locked ? `En edición por ${lockInfo.namesText}. Abrís la ficha en modo bloqueado.` : 'Editar')}" onclick="editarMovilidad(${m.id})"><i class="fa-solid ${lockInfo.locked ? 'fa-lock' : 'fa-pen'}"></i></button>` : ''}
            ${canDelete ? `<button class="btn-icon" title="Eliminar" style="color:var(--color-danger)" onclick="eliminarMovilidad(${m.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </td>
      </tr>`;}).join('')}
    </tbody>
  </table></div>`;
}

function filtrarMovilidades() {
  const prov = (document.getElementById('filtProvincia')?.value || '').toLowerCase();
  const obj = (document.getElementById('filtObjetivo')?.value || '').toLowerCase();
  const est = (document.getElementById('filtEstado')?.value || '').toLowerCase();
  const tipoPropiedad = (document.getElementById('filtTipoPropiedad')?.value || '').toLowerCase();
  const busca = (document.getElementById('buscarMovilidad')?.value || '').toLowerCase();

  let data = DATA.movilidades.filter(m => {
    if (prov && m.provincia !== prov) return false;
    if (obj && !m.objetivo.toLowerCase().includes(obj)) return false;
    if (est && m.estado !== est) return false;
    if (tipoPropiedad && (m.tipoPropiedad || '').toLowerCase() !== tipoPropiedad) return false;
    if (busca && !m.patente.toLowerCase().includes(busca) && !m.chofer.toLowerCase().includes(busca) && !m.descripcion.toLowerCase().includes(busca)) return false;
    return true;
  });

  document.getElementById('tablaMovilidadesContent').innerHTML = renderTablaMovilidades(data, can('editVehicle'), can('deleteVehicle'));
  document.getElementById('countMovilidades').textContent = `${data.length} unidad${data.length !== 1 ? 'es' : ''}`;
  const alertNode = document.querySelector('.rto-toolbar-alert');
  const criticalDocumentCount = data.filter(movilidad => hasCriticalVehicleDocumentAlert(movilidad)).length;
  const warningDocumentCount = data.filter(movilidad => hasWarningVehicleDocumentAlert(movilidad)).length;
  if (alertNode) {
    if (criticalDocumentCount || warningDocumentCount) {
      alertNode.className = `rto-toolbar-alert ${criticalDocumentCount ? 'danger' : 'warning'}`;
      alertNode.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${buildDocumentToolbarMessage(criticalDocumentCount, warningDocumentCount)}`;
      alertNode.style.display = '';
    } else {
      alertNode.style.display = 'none';
    }
  }
}

function limpiarFiltrosMovilidades() {
  ['filtProvincia', 'filtObjetivo', 'filtEstado', 'filtTipoPropiedad', 'buscarMovilidad'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filtrarMovilidades();
}

// ===========================
// OBJETIVOS
// ===========================
function renderObjetivos(filter) {
  syncObjetivosSubmenu();
  let data = [...DATA.objetivos];
  const canCreate = can('createGoal');
  if (filter && filter !== 'todos') data = data.filter(o => buildObjectiveFilterKey(o.nombre) === filter);

  const contenido = data.length
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;">${data.map(o => objetivoCard(o)).join('')}</div>`
    : `<div class="empty-state"><i class="fa-solid fa-bullseye"></i><h3>Sin objetivos cargados</h3><p>La estructura está lista para cargar objetivos reales cuando quieras.</p></div>`;

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-bullseye" style="color:#8b5cf6;margin-right:8px;"></i>Objetivos</h2>
        <p>Clientes y proyectos asignados</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" onclick="openModalNuevoObjetivo()"><i class="fa-solid fa-plus"></i> Nuevo objetivo</button>` : ''}
      </div>
    </div>
    ${contenido}
  `;
}

function objetivoCard(o) {
  return `
    <div class="objetivo-card" onclick="verDetalleObjetivo(${o.id})">
      <div class="objetivo-card-header">
        ${renderObjectiveBrandMark(o, 'card')}
        <div>
          <h3>${o.nombre}</h3>
          <p>${o.descripcion}</p>
        </div>
      </div>
      <div class="objetivo-stats">
        <div class="objetivo-stat"><div class="val">${o.unidades}</div><div class="lbl">Unidades</div></div>
        <div class="objetivo-stat"><div class="val">${o.choferes}</div><div class="lbl">Choferes</div></div>
        <div class="objetivo-stat"><div class="val">${o.partes}</div><div class="lbl">Partes</div></div>
        <div class="objetivo-stat"><div class="val">${o.novedades}</div><div class="lbl">Novedades</div></div>
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
        <span class="status-badge status-${o.estado === 'activo' ? 'servicio' : 'fuera'}">${o.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();verDetalleObjetivo(${o.id})"><i class="fa-solid fa-eye"></i> Ver ficha</button>
      </div>
    </div>
  `;
}

function getObjectiveBranding(objective = {}) {
  const normalizedName = String(objective?.nombre || '').trim().toLowerCase();
  if (normalizedName.startsWith('genneia - ullum')) {
    return {
      kind: 'image',
      src: 'imagenes/Logo de genneia.png',
      alt: 'Logo Genneia',
      className: 'is-genneia',
    };
  }

  return {
    kind: 'icon',
    icon: objective?.icono || 'fa-circle',
    className: '',
  };
}

function renderObjectiveBrandMark(objective, variant = 'card') {
  const branding = getObjectiveBranding(objective);
  const baseClass = variant === 'inline' ? 'objetivo-inline-mark' : 'objetivo-icon';
  const className = `${baseClass} ${branding.className || ''}`.trim();

  if (branding.kind === 'image') {
    return `<div class="${className}"><img src="${branding.src}" alt="${branding.alt}"></div>`;
  }

  return `<div class="${className}"><i class="fa-solid ${branding.icon}"></i></div>`;
}

function buildObjectiveFilterKey(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderObjetivosSubmenuItems() {
  const items = [`<li><a href="#" class="nav-subitem" data-page="objetivos" data-filter="todos"><i class="fa-solid fa-list"></i> Todos</a></li>`];
  (DATA.objetivos || []).forEach(objetivo => {
    items.push(`<li><a href="#" class="nav-subitem" data-page="objetivos" data-filter="${escapeHtml(buildObjectiveFilterKey(objetivo.nombre))}"><i class="fa-solid fa-bullseye"></i> ${escapeHtml(objetivo.nombre)}</a></li>`);
  });
  return items.join('');
}

function syncObjetivosSubmenu() {
  const submenu = document.getElementById('objetivosSubmenu');
  if (!submenu) return;
  submenu.innerHTML = renderObjetivosSubmenuItems();
}

// ===========================
// PARTES DIARIOS
// ===========================
function renderPartes() {
  let data = [...DATA.partes];
  const canCreate = can('createPart');
  const canEdit = can('editPart');
  const canExportData = can('exportData');

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-clipboard-list" style="color:#22c55e;margin-right:8px;"></i>Partes Diarios</h2>
        <p>Registro diario de servicios por unidad</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" onclick="openModalNuevoParte()"><i class="fa-solid fa-plus"></i> Cargar parte</button>` : ''}
        ${canExportData ? `<button class="btn btn-secondary" onclick="exportarTabla()"><i class="fa-solid fa-file-export"></i> Exportar</button>` : ''}
      </div>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Fecha desde</label>
        <input type="date" id="filtFechaDesde" onchange="filtrarPartes()">
      </div>
      <div class="filter-group">
        <label>Fecha hasta</label>
        <input type="date" id="filtFechaHasta" onchange="filtrarPartes()">
      </div>
      <div class="filter-group">
        <label>Provincia</label>
        <select id="filtParteProvincia" onchange="filtrarPartes()">
          <option value="">Todas</option>
          <option value="mendoza">Mendoza</option>
          <option value="san-juan">San Juan</option>
          <option value="santa-cruz">Santa Cruz</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Objetivo</label>
        <select id="filtParteObjetivo" onchange="filtrarPartes()">
          <option value="">Todos</option>
          ${DATA.objetivos.map(o => `<option value="${o.nombre}">${o.nombre}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="limpiarFiltrosPartes()"><i class="fa-solid fa-rotate-left"></i> Limpiar</button>
    </div>

    <div class="table-wrapper">
      <div class="table-toolbar">
        <h3 id="countPartes">${data.length} parte${data.length !== 1 ? 's' : ''}</h3>
        <input type="text" id="buscarParte" placeholder="Buscar unidad, chofer..." 
          style="padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;font-size:13px;outline:none;width:220px;"
          oninput="filtrarPartes()">
      </div>
      <div id="tablaPartesContent">
        ${renderTablaPartes(data, canEdit)}
      </div>
    </div>
  `;
}

function renderTablaPartes(data, canEdit = can('editPart')) {
  if (!data.length) return `<div class="empty-state"><i class="fa-solid fa-clipboard"></i><h3>Sin resultados</h3><p>No hay partes que coincidan con los filtros</p></div>`;
  return `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th>Fecha</th><th>Provincia</th><th>Objetivo</th><th>Unidad</th>
      <th>Chofer</th><th>Km Ini</th><th>Km Fin</th><th>Recorrido</th>
      <th>Combustible</th><th>Estado</th><th>Acciones</th>
    </tr></thead>
    <tbody>
      ${data.map(p => `<tr>
        <td>${formatFecha(p.fecha)}</td>
        <td>${provinciaLabel(p.provincia)}</td>
        <td>${p.objetivo}</td>
        <td><strong>${p.unidad}</strong></td>
        <td>${p.chofer}</td>
        <td>${p.kmInicial.toLocaleString()}</td>
        <td>${p.kmFinal.toLocaleString()}</td>
        <td><strong>${(p.kmFinal - p.kmInicial).toLocaleString()} km</strong></td>
        <td>${p.combustible} L</td>
        <td>${p.estado === 'completo' ? '<span class="status-badge status-servicio">Completo</span>' : '<span class="status-badge status-mantenimiento">Observado</span>'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" title="Ver detalle" onclick="verDetalleParte(${p.id})"><i class="fa-solid fa-eye"></i></button>
            ${canEdit ? `<button class="btn-icon" title="Editar" onclick="editarParte(${p.id})"><i class="fa-solid fa-pen"></i></button>` : ''}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function filtrarPartes() {
  const desde = document.getElementById('filtFechaDesde')?.value;
  const hasta = document.getElementById('filtFechaHasta')?.value;
  const prov = document.getElementById('filtParteProvincia')?.value;
  const obj = document.getElementById('filtParteObjetivo')?.value;
  const busca = (document.getElementById('buscarParte')?.value || '').toLowerCase();

  let data = DATA.partes.filter(p => {
    if (desde && p.fecha < desde) return false;
    if (hasta && p.fecha > hasta) return false;
    if (prov && p.provincia !== prov) return false;
    if (obj && p.objetivo !== obj) return false;
    if (busca && !p.unidad.toLowerCase().includes(busca) && !p.chofer.toLowerCase().includes(busca)) return false;
    return true;
  });

  document.getElementById('tablaPartesContent').innerHTML = renderTablaPartes(data, can('editPart'));
  document.getElementById('countPartes').textContent = `${data.length} parte${data.length !== 1 ? 's' : ''}`;
}

function limpiarFiltrosPartes() {
  ['filtFechaDesde', 'filtFechaHasta', 'filtParteProvincia', 'filtParteObjetivo', 'buscarParte'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filtrarPartes();
}

// ===========================
// NOVEDADES
// ===========================
function renderNovedades() {
  const canCreate = can('createNews');
  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-bell" style="color:#f59e0b;margin-right:8px;"></i>Novedades</h2>
        <p>Roturas, mantenimientos, incidentes y observaciones operativas</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" onclick="openModalNovedad()"><i class="fa-solid fa-plus"></i> Nueva novedad</button>` : ''}
      </div>
    </div>

    <div class="filters-bar" style="margin-bottom:20px">
      <div class="filter-group">
        <label>Prioridad</label>
        <select id="filtNovPrioridad" onchange="filtrarNovedades()">
          <option value="">Todas</option>
          <option value="urgente">🔴 Urgente</option>
          <option value="pendiente">🟡 Pendiente</option>
          <option value="resuelto">🟢 Resuelto</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tipo</label>
        <select id="filtNovTipo" onchange="filtrarNovedades()">
          <option value="">Todos</option>
          <option value="rotura">Rotura</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="retraso">Retraso</option>
          <option value="incidente">Incidente</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Buscar</label>
        <input type="text" id="filtNovBusca" placeholder="Unidad, descripción..." oninput="filtrarNovedades()">
      </div>
      <button class="btn btn-secondary btn-sm" onclick="limpiarFiltrosNovedades()"><i class="fa-solid fa-rotate-left"></i> Limpiar</button>
    </div>

    <div id="listaNovedades">
      ${renderListaNovedades(DATA.novedades)}
    </div>
  `;
}

function renderListaNovedades(data) {
  if (!data.length) return `<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>Sin novedades</h3><p>No hay novedades que coincidan</p></div>`;
  return data.map(n => novedadCard(n)).join('');
}

function novedadCard(n) {
  const canEdit = can('editNews');
  const canResolve = can('resolveNews');
  const tipos = { rotura: 'fa-wrench', mantenimiento: 'fa-screwdriver-wrench', retraso: 'fa-clock', incidente: 'fa-triangle-exclamation', observacion: 'fa-eye' };
  return `
    <div class="novedad-card ${n.estado}">
      <div class="novedad-header">
        <div style="display:flex;align-items:center;gap:8px">
          <i class="fa-solid ${tipos[n.tipo] || 'fa-circle-info'}" style="color:${n.estado === 'urgente' ? '#ef4444' : n.estado === 'pendiente' ? '#f59e0b' : '#22c55e'}"></i>
          <span class="novedad-title">${n.titulo}</span>
          ${n.generadoAutomaticamente ? '<span class="auto-badge">Automática</span>' : ''}
        </div>
        <span class="priority-badge priority-${n.estado}">${n.estado.charAt(0).toUpperCase() + n.estado.slice(1)}</span>
      </div>
      <div class="novedad-meta">
        <span><i class="fa-solid fa-car"></i> ${n.unidad}</span>
        <span><i class="fa-solid fa-user"></i> ${n.chofer}</span>
        <span><i class="fa-solid fa-bullseye"></i> ${n.objetivo}</span>
        <span><i class="fa-solid fa-calendar"></i> ${formatFecha(n.fecha)}</span>
      </div>
      <div class="novedad-body">${n.descripcion}</div>
      <div class="novedad-actions">
        ${canResolve && n.estado !== 'resuelto' ? `<button class="btn btn-success btn-sm" onclick="resolverNovedad(${n.id})"><i class="fa-solid fa-check"></i> Marcar resuelto</button>` : ''}
        ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="editarNovedad(${n.id})"><i class="fa-solid fa-pen"></i> Editar</button>` : ''}
        ${!canEdit && !canResolve ? `<span style="font-size:12px;color:var(--color-text-light)">Solo lectura</span>` : ''}
      </div>
    </div>
  `;
}

function filtrarNovedades() {
  const prioridad = document.getElementById('filtNovPrioridad')?.value;
  const tipo = document.getElementById('filtNovTipo')?.value;
  const busca = (document.getElementById('filtNovBusca')?.value || '').toLowerCase();

  let data = DATA.novedades.filter(n => {
    if (prioridad && n.estado !== prioridad) return false;
    if (tipo && n.tipo !== tipo) return false;
    if (busca && !n.titulo.toLowerCase().includes(busca) && !n.unidad.toLowerCase().includes(busca) && !n.descripcion.toLowerCase().includes(busca)) return false;
    return true;
  });

  document.getElementById('listaNovedades').innerHTML = renderListaNovedades(data);
}

function limpiarFiltrosNovedades() {
  ['filtNovPrioridad', 'filtNovTipo', 'filtNovBusca'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filtrarNovedades();
}

// ===========================
// REPORTES
// ===========================
function renderReportes() {
  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-chart-bar" style="color:#06b6d4;margin-right:8px;"></i>Reportes</h2>
        <p>Análisis y exportación de datos operativos</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;margin-bottom:28px">
      <div class="report-card" onclick="reportePartesFecha()">
        <div class="report-card-icon"><i class="fa-solid fa-calendar-days"></i></div>
        <h3>Partes por fecha</h3>
        <p>Filtrá y revisá los partes diarios por rango de fechas específico.</p>
      </div>
      <div class="report-card" onclick="reporteNovedadesUnidad()">
        <div class="report-card-icon" style="background:#ede9fe;color:#8b5cf6"><i class="fa-solid fa-truck"></i></div>
        <h3>Novedades por unidad</h3>
        <p>Historial de incidentes y mantenimientos por cada vehículo.</p>
      </div>
      <div class="report-card" onclick="reporteHistorialObjetivo()">
        <div class="report-card-icon" style="background:#dcfce7;color:#16a34a"><i class="fa-solid fa-clock-rotate-left"></i></div>
        <h3>Historial por objetivo</h3>
        <p>Actividad completa agrupada por cliente o proyecto.</p>
      </div>
      <div class="report-card" onclick="reporteExportar()">
        <div class="report-card-icon" style="background:#fef3c7;color:#d97706"><i class="fa-solid fa-file-arrow-down"></i></div>
        <h3>Exportar datos</h3>
        <p>Descargá los datos en formato CSV/Excel según el módulo.</p>
      </div>
    </div>

    <div class="card" id="reportePanel">
      <div class="empty-state">
        <i class="fa-solid fa-chart-pie"></i>
        <h3>Seleccioná un reporte</h3>
        <p>Elegí una opción de arriba para generar el reporte correspondiente.</p>
      </div>
    </div>
  `;
}

function resumenReportesPartes(div) {
  const tabla = renderTablaPartes(DATA.partes);
  div.innerHTML = `
    <div class="table-toolbar"><h3>Todos los partes</h3></div>
    ${tabla}
  `;
  div.className = 'table-wrapper';
}

function reportePartesFecha() {
  const panel = document.getElementById('reportePanel');
  panel.className = 'table-wrapper';
  panel.innerHTML = `
    <div class="table-toolbar">
      <h3>Partes por fecha</h3>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="date" id="rFechaDesde" style="padding:7px 10px;border:1px solid var(--color-border);border-radius:6px;font-size:13px">
        <input type="date" id="rFechaHasta" style="padding:7px 10px;border:1px solid var(--color-border);border-radius:6px;font-size:13px">
        <button class="btn btn-primary btn-sm" onclick="aplicarReportePartesFecha()"><i class="fa-solid fa-search"></i> Buscar</button>
      </div>
    </div>
    <div id="reportePartesResult">${renderTablaPartes(DATA.partes)}</div>
  `;
}

function aplicarReportePartesFecha() {
  const desde = document.getElementById('rFechaDesde').value;
  const hasta = document.getElementById('rFechaHasta').value;
  let data = DATA.partes.filter(p => {
    if (desde && p.fecha < desde) return false;
    if (hasta && p.fecha > hasta) return false;
    return true;
  });
  document.getElementById('reportePartesResult').innerHTML = renderTablaPartes(data);
}

function reporteNovedadesUnidad() {
  const panel = document.getElementById('reportePanel');
  panel.className = 'card';
  const unis = [...new Set(DATA.novedades.map(n => n.unidad))];
  panel.innerHTML = `
    <h3 style="margin-bottom:16px;font-size:15px;font-weight:700">Novedades por unidad</h3>
    ${unis.map(u => {
      const novs = DATA.novedades.filter(n => n.unidad === u);
      return `<div style="margin-bottom:16px">
        <div style="font-weight:700;font-size:13px;margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <i class="fa-solid fa-car" style="color:var(--color-primary)"></i> ${u}
          <span style="color:var(--color-text-light);font-weight:400">(${novs.length} novedad${novs.length !== 1 ? 'es' : ''})</span>
        </div>
        ${novs.map(n => novedadCard(n)).join('')}
      </div>`;
    }).join('')}
  `;
}

function reporteHistorialObjetivo() {
  const panel = document.getElementById('reportePanel');
  panel.className = 'card';
  panel.innerHTML = `
    <h3 style="margin-bottom:16px;font-size:15px;font-weight:700">Historial por objetivo</h3>
    ${DATA.objetivos.map(o => {
      const partes = DATA.partes.filter(p => p.objetivo === o.nombre);
      const novs = DATA.novedades.filter(n => n.objetivo === o.nombre);
      const movs = DATA.movilidades.filter(m => m.objetivo.toLowerCase() === o.nombre.toLowerCase());
      return `
        <div style="background:var(--color-bg);border-radius:var(--radius);padding:16px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            ${renderObjectiveBrandMark(o, 'inline')}
            <strong style="font-size:14px">${o.nombre}</strong>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            <span style="font-size:13px"><strong>${movs.length}</strong> unidades</span>
            <span style="font-size:13px"><strong>${partes.length}</strong> partes</span>
            <span style="font-size:13px"><strong>${novs.length}</strong> novedades</span>
            <span style="font-size:13px"><strong>${partes.reduce((acc, p) => acc + (p.kmFinal - p.kmInicial), 0).toLocaleString()} km</strong> recorridos</span>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function reporteExportar() {
  const canExportData = can('exportData');
  const panel = document.getElementById('reportePanel');
  panel.className = 'card';
  panel.innerHTML = `
    <h3 style="margin-bottom:16px;font-size:15px;font-weight:700">Exportar datos</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${canExportData ? `
      <button class="btn btn-secondary" onclick="exportarCSV('movilidades')"><i class="fa-solid fa-file-csv"></i> Exportar Movilidades (.csv)</button>
      <button class="btn btn-secondary" onclick="exportarCSV('partes')"><i class="fa-solid fa-file-csv"></i> Exportar Partes Diarios (.csv)</button>
      <button class="btn btn-secondary" onclick="exportarCSV('novedades')"><i class="fa-solid fa-file-csv"></i> Exportar Novedades (.csv)</button>` : '<p style="font-size:13px;color:var(--color-text-light)">Tu rol no tiene permiso para exportar datos.</p>'}
    </div>
    <p style="margin-top:14px;font-size:12px;color:var(--color-text-light)">Los archivos se descargarán en formato CSV compatible con Excel.</p>
  `;
}

// ===========================
// CONFIGURACION
// ===========================
function renderConfiguracion() {
  const canManage = can('manageSettings');
  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-gear" style="color:#64748b;margin-right:8px;"></i>Configuración</h2>
        <p>Parámetros y preferencias del sistema</p>
      </div>
      <div class="page-actions">
        ${canManage ? `<button class="btn btn-primary" onclick="guardarConfiguracion()"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>` : ''}
      </div>
    </div>

    <div class="config-section">
      <h3><i class="fa-solid fa-bell"></i> Notificaciones</h3>
      <div class="config-grid">
        ${configItem('Alertas urgentes', 'Recibir alertas por novedades urgentes', true)}
        ${configItem('Partes diarios', 'Notificación cuando se carga un parte', true)}
        ${configItem('Mantenimientos', 'Recordatorio de mantenimiento programado', false)}
        ${configItem('Resumen diario', 'Email con resumen operativo diario', true)}
      </div>
    </div>

    <div class="config-section">
      <h3><i class="fa-solid fa-shield"></i> Seguridad</h3>
      <div class="config-grid">
        ${configItem('Doble autenticación', 'Requerir 2FA al iniciar sesión', false)}
        ${configItem('Bloqueo automático', 'Cerrar sesión tras 30 min. inactivo', true)}
        ${configItem('Log de actividad', 'Registrar todas las acciones de usuarios', true)}
      </div>
    </div>

    <div class="config-section">
      <h3><i class="fa-solid fa-database"></i> Datos</h3>
      <div class="config-grid">
        ${configItem('Exportación automática', 'Backup semanal automático', false)}
        ${configItem('Historial extendido', 'Conservar historial por 2 años', true)}
      </div>
    </div>

    <div class="config-section">
      <h3><i class="fa-solid fa-palette"></i> Apariencia</h3>
      <div class="config-grid">
        <div class="config-item">
          <div class="config-item-info"><h4>Idioma</h4><p>Idioma de la interfaz</p></div>
          <select style="padding:6px 10px;border:1px solid var(--color-border);border-radius:6px;font-size:12px">
            <option>Español</option>
            <option>English</option>
          </select>
        </div>
        ${configItem('Modo compacto', 'Reducir espaciado en tablas y listas', false)}
      </div>
    </div>
  `;
}

function configItem(titulo, desc, checked) {
  return `
    <div class="config-item">
      <div class="config-item-info"><h4>${titulo}</h4><p>${desc}</p></div>
      <label class="toggle-switch">
        <input type="checkbox" ${checked ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

// ===========================
// USUARIOS
// ===========================
async function renderUsuarios() {
  if (!isAdmin()) {
    renderAccessDenied('usuarios');
    return;
  }

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-users" style="color:var(--color-primary);margin-right:8px;"></i>Usuarios</h2>
        <p>Gestión de acceso y roles</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openModalNuevoUsuario()"><i class="fa-solid fa-user-plus"></i> Nuevo usuario</button>
      </div>
    </div>
    <div class="table-wrapper">
      <div class="empty-state"><i class="fa-solid fa-users"></i><h3>Cargando usuarios</h3><p>Esperá un momento mientras se consulta el backend.</p></div>
    </div>
  `;

  const loaded = await loadUsers();
  if (!loaded) return;

  const admin = isAdmin();
  const contenido = DATA.usuarios.length
    ? `<div style="overflow-x:auto"><table>
        <thead><tr>
          <th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th>
        </tr></thead>
        <tbody>
          ${DATA.usuarios.map(u => `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="avatar sm">${u.nombre.split(' ').map(p => p[0]).join('')}</div>
                <strong>${u.nombre}</strong>
              </div>
            </td>
            <td style="color:var(--color-text-light)">${u.email}</td>
            <td><span style="background:#dbeafe;color:#1e40af;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize">${u.rol}</span></td>
            <td><span class="status-badge ${u.estado === 'activo' ? 'status-disponible' : 'status-fuera'}">${u.estado}</span></td>
            <td style="font-size:12px;color:var(--color-text-light)">${u.ultima ? formatFecha(u.ultima) : 'Sin ingreso'}</td>
            <td>
              ${admin ? `<div style="display:flex;gap:4px">
                <button class="btn-icon" title="Editar" onclick="editarUsuario(${u.id})"><i class="fa-solid fa-pen"></i></button>
                ${currentUser && currentUser.id !== u.id ? `<button class="btn-icon" title="Eliminar" style="color:var(--color-danger)" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>` : '<span style="font-size:12px;color:var(--color-text-light)">Sesión actual</span>'}
              </div>` : `<span style="font-size:12px;color:var(--color-text-light)">Solo lectura</span>`}
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`
    : `<div class="empty-state"><i class="fa-solid fa-users"></i><h3>Sin usuarios cargados</h3><p>La sección quedó lista para completar con accesos reales.</p></div>`;

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-users" style="color:var(--color-primary);margin-right:8px;"></i>Usuarios</h2>
        <p>Gestión de acceso y roles</p>
      </div>
      <div class="page-actions">
        ${admin ? `<button class="btn btn-primary" onclick="openModalNuevoUsuario()"><i class="fa-solid fa-user-plus"></i> Nuevo usuario</button>` : ''}
      </div>
    </div>
    <div class="table-wrapper">
      <div class="table-toolbar"><h3>${DATA.usuarios.length} usuarios</h3></div>
      ${contenido}
    </div>
  `;
}

// ===========================
// MODALS
// ===========================
function openModal(title, bodyHTML, footerHTML) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;
  modalFooter.innerHTML = footerHTML || '';
  modalOverlay.classList.add('show');
}

function closeModal() {
  modalOverlay.classList.remove('show');
  delete modalOverlay.dataset.mobilityEditId;
  clearRealtimeEditContext();
}

function bindModal() {
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
}

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
  if (!rememberSession) return;
  window.localStorage.setItem('huarpe.rememberSession', String(rememberSession.checked));
}

function toggleLoginPasswordVisibility() {
  if (!loginPassword || !passwordToggle) return;

  const shouldShow = loginPassword.type === 'password';
  loginPassword.type = shouldShow ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', shouldShow ? 'true' : 'false');
  passwordToggle.setAttribute('aria-label', shouldShow ? 'Ocultar contraseña' : 'Mostrar contraseña');
  passwordToggle.innerHTML = shouldShow
    ? '<i class="fa-regular fa-eye-slash"></i>'
    : '<i class="fa-regular fa-eye"></i>';
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

async function heartbeatRealtime() {
  const data = await apiRequest('/api/realtime/heartbeat', {
    method: 'POST',
    suppressAuthHandling: true,
    body: JSON.stringify({ page: currentPage, filter: currentFilter || '', context: realtimeState.editContext }),
  });

  realtimeState.samePageUsers = data.samePageUsers || [];
  const sync = data.sync || {};
  const nextVersion = Number(sync.changeVersion || 0);
  const actorId = Number(sync.lastChangedByUserId || 0) || null;
  const changedPage = String(sync.lastChangedPage || '');

  if (nextVersion > realtimeState.lastSeenVersion) {
    const shouldNotify = actorId && actorId !== currentUser.id && changedPage === currentPage;
    if (shouldNotify) {
      realtimeState.pendingRefresh = true;
      realtimeState.lastChangedByName = sync.lastChangedByName || 'Otro usuario';
      realtimeState.lastChangedPage = changedPage;
      if (realtimeState.notifiedVersion !== nextVersion) {
        realtimeState.notifiedVersion = nextVersion;
        showToast(`${realtimeState.lastChangedByName} hizo cambios en ${getPageLabel(changedPage)}.`, 'info');
      }
    }
    realtimeState.lastSeenVersion = nextVersion;
  }

  syncRealtimeMobilityUI();
  renderRealtimePageContext();
}

function renderRealtimePageContext() {
  const existing = document.getElementById('realtimePageContext');
  if (existing) existing.remove();
  if (!currentUser || !REALTIME_TRACKED_PAGES.includes(currentPage) || !pageContent?.children.length) return;

  const others = realtimeState.samePageUsers || [];
  const presenceText = others.length
    ? `${others.map(user => user.nombre).join(', ')} ${others.length === 1 ? 'también está' : 'también están'} en ${getPageLabel(currentPage)}.`
    : `Solo vos estás viendo ${getPageLabel(currentPage)} ahora.`;
  const editingUsers = currentPage === 'movilidades'
    ? others.filter(user => user.context?.mode === 'editing' && user.context?.entityType === 'movilidad' && Number(user.context?.entityId || 0) > 0)
    : [];
  const editingText = editingUsers.length
    ? `${editingUsers.map(user => `${user.nombre} en ${user.context.entityLabel || 'una unidad'}`).join(', ')}.`
    : '';
  const changeText = realtimeState.pendingRefresh
    ? `${realtimeState.lastChangedByName || 'Otro usuario'} hizo cambios en esta página.`
    : 'Sin cambios remotos pendientes.';

  const markup = `
    <div class="realtime-page-context" id="realtimePageContext">
      <div class="realtime-presence-block">
        <div class="realtime-presence-title"><i class="fa-solid fa-signal"></i> Presencia en vivo</div>
        <div class="realtime-presence-text">${escapeHtml(presenceText)}</div>
        ${editingText ? `<div class="realtime-presence-text">${escapeHtml(`Editando ahora: ${editingText}`)}</div>` : ''}
      </div>
      <div class="realtime-change-block ${realtimeState.pendingRefresh ? 'pending' : ''}">
        <div class="realtime-presence-title"><i class="fa-solid fa-arrows-rotate"></i> Cambios</div>
        <div class="realtime-presence-text">${escapeHtml(changeText)}</div>
        ${realtimeState.pendingRefresh ? '<button class="btn btn-secondary btn-sm" onclick="refreshCurrentPageData()"><i class="fa-solid fa-rotate"></i> Refrescar</button>' : ''}
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

async function refreshCurrentPageData() {
  const loaded = await loadOperationalData();
  if (!loaded) return;
  realtimeState.pendingRefresh = false;
  renderPageWithFilter(currentPage, currentFilter);
  showToast('Vista actualizada con los cambios más recientes.', 'success');
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

function setRealtimeEditContext(context = {}) {
  const nextContext = {
    mode: String(context.mode || '').trim(),
    entityType: String(context.entityType || '').trim(),
    entityId: Number(context.entityId || 0) || null,
    entityLabel: String(context.entityLabel || '').trim(),
  };
  const prevContext = realtimeState.editContext || {};
  if (
    prevContext.mode === nextContext.mode
    && prevContext.entityType === nextContext.entityType
    && prevContext.entityId === nextContext.entityId
    && prevContext.entityLabel === nextContext.entityLabel
  ) {
    return;
  }
  realtimeState.editContext = {
    mode: nextContext.mode,
    entityType: nextContext.entityType,
    entityId: nextContext.entityId,
    entityLabel: nextContext.entityLabel,
  };
  queueRealtimeHeartbeat();
}

function clearRealtimeEditContext() {
  if (!realtimeState.editContext.entityId && !realtimeState.editContext.mode) return;
  realtimeState.editContext = { mode: '', entityType: '', entityId: null, entityLabel: '' };
  queueRealtimeHeartbeat();
}

function getRealtimeEditorsForMobility(movilidadId) {
  const normalizedId = Number(movilidadId || 0);
  if (!normalizedId) return [];
  return (realtimeState.samePageUsers || []).filter(user => {
    const context = user?.context || {};
    return context.mode === 'editing'
      && context.entityType === 'movilidad'
      && Number(context.entityId || 0) === normalizedId;
  });
}

function getRealtimeMobilityLockInfo(movilidadId) {
  const editors = getRealtimeEditorsForMobility(movilidadId);
  return {
    editors,
    locked: editors.length > 0,
    namesText: editors.map(user => user.nombre).join(', '),
  };
}

function renderMobilityEditLockNotice(lockInfo, patente = '') {
  if (!lockInfo?.locked) return '';
  return `
    <div class="live-edit-lock-notice" id="mobilityEditLockNotice">
      <div class="live-edit-lock-title"><i class="fa-solid fa-lock"></i> Edición bloqueada</div>
      <div class="live-edit-lock-text">${escapeHtml(lockInfo.namesText)} ${lockInfo.editors.length === 1 ? 'ya está trabajando sobre' : 'ya están trabajando sobre'} ${escapeHtml(patente || 'esta unidad')}. La ficha queda en solo lectura hasta que se libere.</div>
    </div>
  `;
}

function syncRealtimeMobilityUI() {
  if (currentPage === 'movilidades' && document.getElementById('tablaMovilidadesContent')) {
    filtrarMovilidades();
  }
  syncMobilityEditModalState();
}

function syncMobilityEditModalState() {
  const mobilityId = Number(modalOverlay?.dataset?.mobilityEditId || 0);
  if (!mobilityId || !modalOverlay?.classList.contains('show')) return;

  const mobility = DATA.movilidades.find(item => item.id === mobilityId);
  const lockInfo = getRealtimeMobilityLockInfo(mobilityId);
  const noticeHost = document.getElementById('mobilityEditLockNoticeHost');
  const fieldset = document.getElementById('mobilityEditFieldset');
  const saveButton = document.getElementById('mobilityEditSaveButton');
  const deactivateButton = document.getElementById('mobilityEditDeactivateButton');

  if (noticeHost) {
    noticeHost.innerHTML = renderMobilityEditLockNotice(lockInfo, mobility?.patente || mobility?.descripcion || 'esta unidad');
  }

  if (fieldset) {
    fieldset.disabled = lockInfo.locked;
  }

  if (saveButton) {
    saveButton.disabled = lockInfo.locked;
    saveButton.title = lockInfo.locked ? `Bloqueado por ${lockInfo.namesText}` : 'Guardar';
  }

  if (deactivateButton) {
    deactivateButton.disabled = lockInfo.locked;
    deactivateButton.title = lockInfo.locked ? `Bloqueado por ${lockInfo.namesText}` : 'Dar de baja';
  }

  if (!mobility) return;

  if (lockInfo.locked) {
    clearRealtimeEditContext();
  } else {
    setRealtimeEditContext({
      mode: 'editing',
      entityType: 'movilidad',
      entityId: mobility.id,
      entityLabel: mobility.patente || getVehicleDisplayName(mobility),
    });
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const email = loginEmail?.value.trim().toLowerCase();
  const password = loginPassword?.value || '';
  const shouldRememberSession = rememberSession?.checked ?? true;
  if (!email || !password) {
    setLoginMessage('Ingresá correo y contraseña.', 'warning');
    return;
  }

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberSession: shouldRememberSession }),
      suppressAuthHandling: true,
    });

    currentUser = data.user;
    await loadOperationalData();
    if (isAdmin()) {
      await loadUsers();
    } else {
      DATA.usuarios = [];
    }

    loginForm.reset();
    setLoginMessage('Acceso concedido.', 'success');
    unlockApplication();
    renderPage('inicio');
    startRealtimeHeartbeat();
    showToast(`Sesión iniciada: ${currentUser.nombre}`, 'success');
  } catch (error) {
    setLoginMessage(error.message || 'No se pudo iniciar sesión.', 'error');
  }
}

async function restoreSession() {
  try {
    const data = await apiRequest('/api/auth/session', { suppressAuthHandling: true });
    currentUser = data.user;
    await loadOperationalData();
    if (isAdmin()) {
      await loadUsers();
    }
  } catch (_error) {
    currentUser = null;
    DATA.usuarios = [];
  }
}

function lockApplication() {
  document.body.classList.add('auth-locked');
  authOverlay?.classList.add('show');
  pageContent.innerHTML = '';
  document.title = 'Iniciar sesion | HUARPE LOGISTICA';
  stopRealtimeHeartbeat();
  syncCurrentUserUI();
}

function unlockApplication() {
  document.body.classList.remove('auth-locked');
  authOverlay?.classList.remove('show');
  document.title = APP_TITLE;
  setLoginMessage('Ingresá con un usuario habilitado en el sistema.', 'info');
  syncCurrentUserUI();
}

async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST', suppressAuthHandling: true });
  } catch (_error) {
  }

  DATA.usuarios = [];
  currentUser = null;
  closeModal();
  lockApplication();
  setLoginMessage('Sesión cerrada. Ingresá nuevamente para continuar.', 'info');
  showToast('Sesión cerrada', 'info');
}

function openAccountModal() {
  if (!currentUser) return;
  openModal('Sesión activa', `
    <div class="account-summary">
      <div class="avatar" style="width:48px;height:48px">${getInitials(currentUser.nombre)}</div>
      <div>
        <h3 style="font-size:18px;margin-bottom:4px">${currentUser.nombre}</h3>
        <p style="color:var(--color-text-light);margin-bottom:6px">${currentUser.email}</p>
        <span class="status-badge status-servicio">${currentUser.rol}</span>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    <button class="btn btn-primary" onclick="openChangePasswordModal()"><i class="fa-solid fa-key"></i> Cambiar contraseña</button>
    <button class="btn btn-danger" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
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
    <button class="btn btn-secondary" onclick="openAccountModal()">Volver</button>
    <button class="btn btn-primary" onclick="changeCurrentPassword()"><i class="fa-solid fa-floppy-disk"></i> Guardar contraseña</button>
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

function syncCurrentUserUI() {
  const user = currentUser;
  const initials = user ? getInitials(user.nombre) : '--';

  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (topbarAvatar) topbarAvatar.textContent = initials;
  if (sidebarUserName) sidebarUserName.textContent = user ? user.nombre : 'Sin usuario';
  if (topbarUserName) topbarUserName.textContent = user ? user.nombre : 'Sin usuario';
  if (sidebarUserRole) sidebarUserRole.textContent = user ? capitalize(user.rol) : 'Perfil no configurado';
  updateNavigationByPermissions();
}

function setLoginMessage(message, type) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.dataset.state = type || 'info';
}

function isAdmin() {
  return currentUser?.rol === 'administrador';
}

function requireAdminAccess() {
  if (isAdmin()) return true;
  showToast('Solo el administrador puede realizar esta acción.', 'warning');
  return false;
}

async function apiRequest(url, options = {}) {
  const { suppressAuthHandling = false, headers, ...fetchOptions } = options;
  let response;

  try {
    response = await fetch(`${API_ORIGIN}${url}`, {
      credentials: 'same-origin',
      headers: {
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {}),
      },
      ...fetchOptions,
    });
  } catch (_networkError) {
    throw new Error('No se pudo conectar con el servidor. Abrí la aplicación desde http://localhost:3000.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    const error = new Error(payload.error || 'Ocurrió un error al comunicarse con el servidor.');
    error.status = response.status;

    if (response.status === 401 && !suppressAuthHandling) {
      DATA.usuarios = [];
      currentUser = null;
      lockApplication();
      setLoginMessage('La sesión venció. Ingresá nuevamente para continuar.', 'warning');
    }

    throw error;
  }

  return payload;
}

async function loadUsers() {
  if (!isAdmin()) {
    DATA.usuarios = [];
    return false;
  }

  try {
    const data = await apiRequest('/api/users');
    DATA.usuarios = data.users || [];
    return true;
  } catch (error) {
    showToast(error.message || 'No se pudo cargar la lista de usuarios.', 'error');
    pageContent.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>No se pudo cargar usuarios</h3>
        <p>${error.message || 'El backend no respondió correctamente.'}</p>
      </div>
    `;
    return false;
  }
}

async function loadOperationalData() {
  try {
    const data = await apiRequest('/api/bootstrap', { suppressAuthHandling: true });
    applyOperationalData(data);
    return true;
  } catch (error) {
    DATA.movilidades = [];
    DATA.objetivos = [];
    DATA.partes = [];
    DATA.novedades = [];
    showToast(error.message || 'No se pudo cargar la información operativa.', 'error');
    return false;
  }
}

function applyOperationalData(data) {
  DATA.movilidades = data.movilidades || [];
  DATA.objetivos = data.objetivos || [];
  DATA.partes = data.partes || [];
  DATA.novedades = data.novedades || [];
  syncObjetivosSubmenu();
  updateAlertBadges();
  updateRealtimeSyncState(data?.sync);
}

function updateRealtimeSyncState(sync) {
  const version = Number(sync?.changeVersion || 0);
  if (!version) return;
  realtimeState.lastSeenVersion = Math.max(realtimeState.lastSeenVersion, version);
}

function can(action) {
  if (!currentUser) return false;
  return getPermissions(currentUser.rol).actions.includes(action);
}

function canViewPage(page) {
  if (!currentUser) return false;
  return getPermissions(currentUser.rol).pages.includes(page);
}

function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.operador;
}

function requirePermission(action, deniedMessage) {
  if (can(action)) return true;
  showToast(deniedMessage || 'Tu rol no tiene permiso para realizar esta acción.', 'warning');
  return false;
}

function renderAccessDenied(page) {
  const labels = {
    inicio: 'Inicio',
    movilidades: 'Movilidades',
    requerimientos: 'Requerimientos',
    combustibles: 'Combustibles',
    objetivos: 'Objetivos',
    partes: 'Partes diarios',
    novedades: 'Novedades',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    usuarios: 'Usuarios',
  };
  pageContent.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-lock"></i>
      <h3>Acceso restringido</h3>
      <p>Tu rol no tiene permiso para ingresar a ${labels[page] || 'esta sección'}.</p>
    </div>
  `;
}

function openVehicleTypeSelector() {
  if (!requirePermission('createVehicle')) return;
  openModal('Nueva unidad', `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
      ${Object.entries(VEHICLE_UNIT_TYPES).map(([type, config]) => `
        <button type="button" class="btn btn-secondary" onclick="openModalNuevaMovilidad('${type}')" style="height:auto;display:flex;flex-direction:column;align-items:flex-start;gap:10px;padding:18px;text-align:left">
          <span style="width:42px;height:42px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;background:rgba(12,118,110,.12);color:var(--color-primary);font-size:18px"><i class="fa-solid ${config.icon}"></i></span>
          <strong style="font-size:16px">${config.label}</strong>
          <span style="font-size:13px;color:var(--color-text-light)">${type === 'camioneta' ? 'Alta estándar para camionetas operativas.' : 'Alta adaptada para cuatriciclos como los CFMOTO 450.'}</span>
        </button>
      `).join('')}
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
  `);
}

function openModalNuevaMovilidad(unitType = 'camioneta') {
  if (!requirePermission('createVehicle')) return;
  const normalizedUnitType = normalizeVehicleUnitType(unitType);
  const unitConfig = getVehicleUnitConfig(normalizedUnitType);
  const documentacion = normalizeVehicleFileDocuments();
  const identifierHelp = normalizedUnitType === 'cuatriciclo'
    ? '<small style="display:block;margin-top:6px;color:var(--color-text-light);font-size:11px">Si no tiene dominio asignado, podés cargar el identificador interno de la unidad.</small>'
    : '';
  openModal(`Nueva ${unitConfig.label.toLowerCase()}`, `
    <div class="form-grid">
      <input type="hidden" id="mTipoUnidad" value="${normalizedUnitType}">
      <div class="form-group"><label>Clase de unidad</label><input type="text" value="${unitConfig.label}" disabled></div>
      <div class="form-group"><label>${unitConfig.identifierLabel}</label><input type="text" placeholder="${unitConfig.identifierPlaceholder}" id="mPatente">${identifierHelp}</div>
      <div class="form-group"><label>Marca</label><select id="mMarca">${renderVehicleBrandOptions(unitConfig.defaultBrand)}</select></div>
      <div class="form-group"><label>${unitConfig.descriptionLabel}</label><input type="text" placeholder="${unitConfig.descriptionPlaceholder}" id="mDesc"></div>
      <div class="form-group"><label>Tipo</label><select id="mTipoPropiedad">${renderVehicleOwnershipOptions()}</select></div>
      <div class="form-group"><label>Año</label><input type="number" min="1900" max="2100" placeholder="Ej. 2022" id="mAnio"></div>
      <div class="form-group"><label>Número de motor</label><input type="text" placeholder="Ingresar número de motor" id="mNumeroMotor"></div>
      <div class="form-group"><label>Número de chasis</label><input type="text" placeholder="Ingresar número de chasis" id="mNumeroChasis"></div>
      <div class="form-group"><label>Provincia</label>
        <select id="mProvincia">
          ${renderVehicleProvinceOptions('mendoza')}
        </select>
      </div>
      <div class="form-group"><label>Objetivo</label>
        <select id="mObjetivo">
          ${DATA.objetivos.map(o => `<option value="${o.nombre.toLowerCase()}">${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Chofer</label><input type="text" placeholder="Nombre del chofer" id="mChofer"></div>
      <div class="form-group"><label>Km actual</label><input type="number" min="0" step="1" placeholder="Ej. 12083" id="mKmActual"></div>
      <div class="form-group"><label>Km próximo service</label><input type="number" min="0" step="1" placeholder="Ej. 14500" id="mKmProximoService"></div>
      <div class="form-group"><label>Vencimiento RTO</label><input type="date" id="mRtoVencimiento"></div>
      <div class="form-group"><label>Vencimiento seguro</label><input type="date" id="mSeguroVencimiento"></div>
      <div class="form-group"><label>Estado</label>
        <select id="mEstado">
          <option value="disponible">Disponible</option>
          <option value="servicio">En servicio</option>
          <option value="mantenimiento">En mantenimiento</option>
          <option value="fuera">Fuera de servicio</option>
        </select>
      </div>
      <div class="form-group full"><label>Ubicación</label><input type="text" placeholder="Ubicación actual" id="mUbicacion"></div>
    </div>
    <div class="parte-section-title" style="margin-top:18px">Documentación adjunta</div>
    ${renderVehicleFileDocumentsEditor('mDoc', documentacion)}
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMovilidad()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function guardarMovilidad() {
  if (!requirePermission('createVehicle')) return;
  const patente = document.getElementById('mPatente')?.value.trim();
  const marca = document.getElementById('mMarca')?.value.trim();
  const desc = document.getElementById('mDesc')?.value.trim();
  if (!patente || !marca || !desc) { showToast('Completá patente, marca y modelo.', 'warning'); return; }
  const validationError = validateVehicleTechnicalFields({
    anio: document.getElementById('mAnio')?.value || '',
    numeroMotor: document.getElementById('mNumeroMotor')?.value || '',
    numeroChasis: document.getElementById('mNumeroChasis')?.value || '',
  });
  if (validationError) {
    showToast(validationError, 'warning');
    return;
  }
  const serviceValidationError = validateVehicleServiceFields({
    kmActual: document.getElementById('mKmActual')?.value || '',
    kmProximoService: document.getElementById('mKmProximoService')?.value || '',
  });
  if (serviceValidationError) {
    showToast(serviceValidationError, 'warning');
    return;
  }

  apiRequest('/api/movilidades', {
    method: 'POST',
    body: JSON.stringify({
      patente,
      marca,
      tipoUnidad: normalizeVehicleUnitType(document.getElementById('mTipoUnidad')?.value || 'camioneta'),
      descripcion: desc,
      tipoPropiedad: document.getElementById('mTipoPropiedad')?.value || 'propia',
      anio: document.getElementById('mAnio')?.value || '',
      numeroMotor: document.getElementById('mNumeroMotor')?.value || '',
      numeroChasis: document.getElementById('mNumeroChasis')?.value || '',
      estado: document.getElementById('mEstado')?.value || 'disponible',
      provincia: document.getElementById('mProvincia')?.value || 'mendoza',
      objetivo: document.getElementById('mObjetivo')?.options[document.getElementById('mObjetivo').selectedIndex]?.text || '',
      ubicacion: document.getElementById('mUbicacion')?.value || '',
      kmActual: document.getElementById('mKmActual')?.value || '',
      kmProximoService: document.getElementById('mKmProximoService')?.value || '',
      ultimaNovedad: 'Sin novedades',
      chofer: document.getElementById('mChofer')?.value || '',
      rtoVencimiento: document.getElementById('mRtoVencimiento')?.value || '',
      seguroVencimiento: document.getElementById('mSeguroVencimiento')?.value || '',
      tarjetaVerdeAdjunto: collectVehicleFileDocuments('mDoc').tarjetaVerde,
      tituloAdjunto: collectVehicleFileDocuments('mDoc').titulo,
      contratoFirmadoAdjunto: collectVehicleFileDocuments('mDoc').contratoFirmado,
      rtoAdjunto: collectVehicleFileDocuments('mDoc').rto,
    }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Unidad agregada correctamente', 'success');
      renderPageWithFilter(currentPage, currentFilter);
    })
    .catch(error => {
      showToast(error.message || 'No se pudo guardar la unidad.', 'error');
    });
}

function openModalNuevoParte() {
  if (!requirePermission('createPart')) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const unidad = DATA.movilidades[0] || null;
  const cabecera = createParteCabeceraBase({ fecha: hoy, unidad });
  const documentacion = createParteDocumentacionBase();
  const checklist = createParteChecklistBase();
  const adjunto = normalizeParteAdjunto();
  openModal('Cargar parte diario', `
    <div class="parte-check-shell">
      <div class="parte-check-legend">Terminologia: B = Bien, R = Revisar, L = Faltante, D = Desgastado, P = Reparar, C = Limpiar, NC = No corresponde, O = Observar.</div>
      <div class="form-grid">
        <div class="form-group"><label>Empresa</label><input type="text" id="pCabEmpresa" value="${escapeHtml(cabecera.empresa)}"></div>
        <div class="form-group"><label>Móvil interno</label><input type="text" id="pCabMovilInterno" value="${escapeHtml(cabecera.movilInterno)}"></div>
        <div class="form-group"><label>N° control</label><input type="text" id="pCabNumeroControl" value="${escapeHtml(cabecera.numeroControl)}"></div>
        <div class="form-group"><label>Fecha</label><input type="date" id="pFecha" value="${hoy}"></div>
        <div class="form-group"><label>Provincia</label>
          <select id="pProvincia">
            <option value="mendoza">Mendoza</option>
            <option value="san-juan">San Juan</option>
            <option value="santa-cruz">Santa Cruz</option>
          </select>
        </div>
        <div class="form-group"><label>Objetivo</label>
          <select id="pObjetivo">
            ${DATA.objetivos.map(o => `<option>${o.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Unidad (patente)</label>
          <select id="pUnidad" onchange="syncParteVehicleData('p')">
            ${DATA.movilidades.map((m, index) => `<option ${index === 0 ? 'selected' : ''}>${m.patente}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Patente</label><input type="text" id="pCabPatente" value="${escapeHtml(cabecera.patente)}"></div>
        <div class="form-group"><label>Marca</label><input type="text" id="pCabMarca" value="${escapeHtml(cabecera.marca)}"></div>
        <div class="form-group"><label>Modelo</label><input type="text" id="pCabModelo" value="${escapeHtml(cabecera.modelo)}"></div>
        <div class="form-group"><label>Chofer</label><input type="text" id="pChofer" value="${escapeHtml(cabecera.chofer)}" placeholder="Nombre del chofer"></div>
        <div class="form-group"><label>KM actual</label><input type="number" id="pCabKmActual" placeholder="0" value="${escapeHtml(cabecera.kmActual)}"></div>
        <div class="form-group"><label>Km inicial</label><input type="number" id="pKmIni" placeholder="0"></div>
        <div class="form-group"><label>Km final</label><input type="number" id="pKmFin" placeholder="0"></div>
        <div class="form-group"><label>Combustible (L)</label><input type="number" id="pCombustible" placeholder="0"></div>
        <div class="form-group"><label>Fecha último service</label><input type="date" id="pCabFechaUltimoService" value="${escapeHtml(cabecera.fechaUltimoService)}"></div>
        <div class="form-group"><label>Km próximo service</label><input type="text" id="pCabKmProximoService" value="${escapeHtml(cabecera.kmProximoService)}"></div>
      </div>
      <div class="parte-section-title">Documentación</div>
      <div class="parte-doc-grid">${renderParteDocumentacionEditor('pDoc', documentacion)}</div>
      <div class="parte-section-title">Checklist vehicular</div>
      ${renderParteChecklistEditor('pChk', checklist)}
      <div class="parte-section-title">Check firmado adjunto</div>
      ${renderParteAdjuntoEditor('p', adjunto)}
      <div class="form-grid">
        <div class="form-group full"><label>Observaciones</label><textarea id="pObservaciones" placeholder="Observaciones generales del check..."></textarea></div>
        <div class="form-group full"><label>Desperfectos</label><textarea id="pDesperfectos" placeholder="Ninguno / descripción del problema..."></textarea></div>
        <div class="form-group"><label>Entrega, firma y aclaración</label><input type="text" id="pCabFirmaEntrega" value="${escapeHtml(cabecera.firmaEntrega)}"></div>
        <div class="form-group"><label>Recibe, firma y aclaración</label><input type="text" id="pCabFirmaRecibe" value="${escapeHtml(cabecera.firmaRecibe)}"></div>
        <div class="form-group"><label>Supervisor, firma y aclaración</label><input type="text" id="pCabFirmaSupervisor" value="${escapeHtml(cabecera.firmaSupervisor)}"></div>
        <div class="form-group"><label>Estado</label>
          <select id="pEstadoParte">
            <option value="completo">Completo</option>
            <option value="observado">Observado</option>
          </select>
        </div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarParte()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function guardarParte() {
  if (!requirePermission('createPart')) return;
  const kmIni = parseInt(document.getElementById('pKmIni')?.value || 0);
  const kmFin = parseInt(document.getElementById('pKmFin')?.value || 0);
  if (!document.getElementById('pChofer')?.value.trim()) { showToast('Ingresá el chofer', 'warning'); return; }
  if (kmFin < kmIni) { showToast('Km final no puede ser menor al inicial', 'warning'); return; }

  apiRequest('/api/partes', {
    method: 'POST',
    body: JSON.stringify({
      fecha: document.getElementById('pFecha')?.value,
      provincia: document.getElementById('pProvincia')?.value,
      objetivo: document.getElementById('pObjetivo')?.options[document.getElementById('pObjetivo').selectedIndex]?.text,
      unidad: document.getElementById('pUnidad')?.options[document.getElementById('pUnidad').selectedIndex]?.text,
      chofer: document.getElementById('pChofer')?.value.trim(),
      kmInicial: kmIni,
      kmFinal: kmFin,
      combustible: parseInt(document.getElementById('pCombustible')?.value || 0),
      observaciones: document.getElementById('pObservaciones')?.value || 'Sin novedad',
      desperfectos: document.getElementById('pDesperfectos')?.value || 'Ninguno',
      cabecera: collectParteCabecera('p'),
      documentacion: collectParteDocumentacion('pDoc'),
      checklist: collectParteChecklist('pChk'),
      adjunto: collectParteAdjunto('p'),
      estado: document.getElementById('pEstadoParte')?.value || 'completo',
    }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Parte cargado correctamente', 'success');
      renderPartes();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo guardar el parte.', 'error');
    });
}

function openModalNovedad() {
  if (!requirePermission('createNews')) return;
  openModal('Nueva novedad', `
    <div class="form-grid">
      <div class="form-group full"><label>Título</label><input type="text" id="nTitulo" placeholder="Descripción breve"></div>
      <div class="form-group"><label>Unidad</label>
        <select id="nUnidad">
          ${DATA.movilidades.map(m => `<option>${m.patente}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Objetivo</label>
        <select id="nObjetivo">
          ${DATA.objetivos.map(o => `<option>${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Tipo</label>
        <select id="nTipo">
          <option value="rotura">Rotura</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="retraso">Retraso</option>
          <option value="incidente">Incidente</option>
        </select>
      </div>
      <div class="form-group"><label>Prioridad</label>
        <select id="nPrioridad">
          <option value="urgente">🔴 Urgente</option>
          <option value="pendiente">🟡 Pendiente</option>
          <option value="resuelto">🟢 Resuelto</option>
        </select>
      </div>
      <div class="form-group full"><label>Descripción</label><textarea id="nDescripcion" placeholder="Detalle de la novedad..."></textarea></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarNovedad()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function guardarNovedad() {
  if (!requirePermission('createNews')) return;
  const titulo = document.getElementById('nTitulo')?.value.trim();
  if (!titulo) { showToast('Ingresá un título', 'warning'); return; }

  const unidadSel = document.getElementById('nUnidad');
  const objSel = document.getElementById('nObjetivo');
  const unidadPatente = unidadSel?.options[unidadSel.selectedIndex]?.text || '';
  const mov = DATA.movilidades.find(m => m.patente === unidadPatente);

  apiRequest('/api/novedades', {
    method: 'POST',
    body: JSON.stringify({
      titulo,
      unidad: unidadPatente,
      chofer: mov ? mov.chofer : '',
      objetivo: objSel?.options[objSel.selectedIndex]?.text || '',
      fecha: new Date().toISOString().slice(0, 10),
      tipo: document.getElementById('nTipo')?.value || 'rotura',
      prioridad: document.getElementById('nPrioridad')?.value || 'pendiente',
      descripcion: document.getElementById('nDescripcion')?.value || '',
      estado: document.getElementById('nPrioridad')?.value || 'pendiente',
    }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Novedad cargada correctamente', 'success');
      renderNovedades();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo guardar la novedad.', 'error');
    });
}

function openModalNuevoObjetivo() {
  if (!requirePermission('createGoal')) return;
  openModal('Nuevo objetivo', `
    <div class="form-grid">
      <div class="form-group full"><label>Nombre</label><input type="text" id="oNombre" placeholder="Nombre del objetivo"></div>
      <div class="form-group full"><label>Descripción</label><input type="text" id="oDesc" placeholder="Descripción breve"></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarObjetivo()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function guardarObjetivo() {
  if (!requirePermission('createGoal')) return;
  const nombre = document.getElementById('oNombre')?.value.trim();
  if (!nombre) { showToast('Ingresá un nombre', 'warning'); return; }
  apiRequest('/api/objetivos', {
    method: 'POST',
    body: JSON.stringify({ nombre, descripcion: document.getElementById('oDesc')?.value || '' }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Objetivo agregado', 'success');
      renderObjetivos();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo guardar el objetivo.', 'error');
    });
}

function openModalNuevoUsuario() {
  if (!requireAdminAccess()) return;
  openModal('Nuevo usuario', `
    <div class="form-grid">
      <div class="form-group full"><label>Nombre completo</label><input type="text" id="uNombre" placeholder="Juan Pérez"></div>
      <div class="form-group full"><label>Email</label><input type="email" id="uEmail" placeholder="usuario@empresa.com"></div>
      <div class="form-group full"><label>Contraseña</label><input type="password" id="uPassword" placeholder="Definir contraseña"></div>
      <div class="form-group"><label>Rol</label>
        <select id="uRol">
          <option value="administrador">Administrador</option>
          <option value="logistica">Logística</option>
          <option value="supervisor">Supervisor</option>
          <option value="operador">Operador</option>
        </select>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarUsuario()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function openModalEditarUsuario(id) {
  if (!requireAdminAccess()) return;
  const user = DATA.usuarios.find(item => item.id === id);
  if (!user) {
    showToast('No se encontró el usuario seleccionado.', 'warning');
    return;
  }

  openModal('Editar usuario', `
    <div class="form-grid">
      <div class="form-group full"><label>Nombre completo</label><input type="text" id="euNombre" value="${escapeHtml(user.nombre)}" placeholder="Juan Pérez"></div>
      <div class="form-group full"><label>Email</label><input type="email" id="euEmail" value="${escapeHtml(user.email)}" placeholder="usuario@empresa.com"></div>
      <div class="form-group"><label>Rol</label>
        <select id="euRol">
          <option value="administrador" ${user.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
          <option value="logistica" ${user.rol === 'logistica' ? 'selected' : ''}>Logística</option>
          <option value="supervisor" ${user.rol === 'supervisor' ? 'selected' : ''}>Supervisor</option>
          <option value="operador" ${user.rol === 'operador' ? 'selected' : ''}>Operador</option>
        </select>
      </div>
      <div class="form-group"><label>Estado</label>
        <select id="euEstado">
          <option value="activo" ${user.estado === 'activo' ? 'selected' : ''}>Activo</option>
          <option value="inactivo" ${user.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
        </select>
      </div>
      <div class="form-group full"><label>Nueva contraseña (opcional)</label><input type="password" id="euPassword" placeholder="Dejar en blanco para conservar la actual"></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="actualizarUsuario(${id})"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
  `);
}

async function guardarUsuario() {
  if (!requireAdminAccess()) return;
  const nombre = document.getElementById('uNombre')?.value.trim();
  const email = document.getElementById('uEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('uPassword')?.value || '';
  if (!nombre || !email || !password) { showToast('Completá todos los campos', 'warning'); return; }
  try {
    await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        email,
        password,
        rol: document.getElementById('uRol')?.value || 'operador',
      }),
    });
    await loadUsers();
    closeModal();
    showToast('Usuario creado', 'success');
    renderUsuarios();
  } catch (error) {
    showToast(error.message || 'No se pudo crear el usuario.', 'error');
  }
}

async function actualizarUsuario(id) {
  if (!requireAdminAccess()) return;

  const nombre = document.getElementById('euNombre')?.value.trim();
  const email = document.getElementById('euEmail')?.value.trim().toLowerCase();
  const rol = document.getElementById('euRol')?.value || 'operador';
  const estado = document.getElementById('euEstado')?.value || 'activo';
  const password = document.getElementById('euPassword')?.value || '';

  if (!nombre || !email) {
    showToast('Completá nombre y correo del usuario.', 'warning');
    return;
  }

  if (password && password.length < 8) {
    showToast('La nueva contraseña debe tener al menos 8 caracteres.', 'warning');
    return;
  }

  try {
    const data = await apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre, email, rol, estado, password }),
    });

    if (currentUser && currentUser.id === id) {
      currentUser = data.user;
      syncCurrentUserUI();
    }

    await loadUsers();
    closeModal();
    showToast('Usuario actualizado', 'success');
    renderUsuarios();
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar el usuario.', 'error');
  }
}

// ===========================
// DETAIL VIEWS
// ===========================
function verDetalleObjetivo(id) {
  const o = DATA.objetivos.find(x => x.id === id);
  if (!o) return;
  const movs = DATA.movilidades.filter(m => m.objetivo.toLowerCase() === o.nombre.toLowerCase());
  const partesObj = DATA.partes.filter(p => p.objetivo === o.nombre);
  const novsObj = DATA.novedades.filter(n => n.objetivo === o.nombre);

  openModal(`Objetivo: ${o.nombre}`, `
    <div class="objetivo-detail-brand">
      ${renderObjectiveBrandMark(o, 'card')}
      <div>
        <h3>${escapeHtml(o.nombre)}</h3>
        <p>${escapeHtml(o.descripcion || 'Sin descripción cargada.')}</p>
      </div>
    </div>
    <div style="display:flex;gap:20px;margin-bottom:18px;flex-wrap:wrap">
      <div style="text-align:center"><div style="font-size:28px;font-weight:800;color:var(--color-primary)">${movs.length}</div><div style="font-size:11px;color:var(--color-text-light)">Unidades</div></div>
      <div style="text-align:center"><div style="font-size:28px;font-weight:800;color:var(--color-success)">${partesObj.length}</div><div style="font-size:11px;color:var(--color-text-light)">Partes</div></div>
      <div style="text-align:center"><div style="font-size:28px;font-weight:800;color:var(--color-warning)">${novsObj.length}</div><div style="font-size:11px;color:var(--color-text-light)">Novedades</div></div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab(event,'tabMovs')">Unidades</button>
      <button class="tab-btn" onclick="switchTab(event,'tabPartes')">Partes</button>
      <button class="tab-btn" onclick="switchTab(event,'tabNovedades')">Novedades</button>
    </div>
    <div id="tabMovs" class="tab-content active">
      ${movs.length ? renderTablaMovilidades(movs) : '<div class="empty-state"><i class="fa-solid fa-car-burst"></i><h3>Sin unidades</h3></div>'}
    </div>
    <div id="tabPartes" class="tab-content">
      ${partesObj.length ? renderTablaPartes(partesObj) : '<div class="empty-state"><i class="fa-solid fa-clipboard"></i><h3>Sin partes</h3></div>'}
    </div>
    <div id="tabNovedades" class="tab-content">
      ${novsObj.length ? novsObj.map(n => novedadCard(n)).join('') : '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>Sin novedades</h3></div>'}
    </div>
  `);
}

function verHistorialMovilidad(id) {
  const m = DATA.movilidades.find(x => x.id === id);
  if (!m) return;
  const partes = DATA.partes.filter(p => p.unidad === m.patente);
  const novs = DATA.novedades.filter(n => n.unidad === m.patente);
  openModal(`Historial: ${m.patente}`, `
    <div style="margin-bottom:16px">
      <strong>${escapeHtml(getVehicleDisplayName(m))}</strong> — ${estadoBadge(m.estado)}
      <div style="font-size:12px;color:var(--color-text-light);margin-top:4px">Chofer: ${m.chofer} | ${provinciaLabel(m.provincia)} | ${m.objetivo}</div>
      <div style="margin-top:8px" class="vehicle-doc-inline-list">${renderVehicleDocumentStatusStack(m)}</div>
    </div>
    <div class="vehicle-file-panel" style="margin-top:0">
      <h3>Datos técnicos</h3>
      <div class="vehicle-file-grid readonly">
        <div class="vehicle-file-card"><h4>Clase de unidad</h4><div class="vehicle-file-meta">${escapeHtml(getVehicleUnitTypeLabel(m.tipoUnidad))}</div></div>
        <div class="vehicle-file-card"><h4>Propiedad</h4><div class="vehicle-file-meta">${escapeHtml(capitalize(m.tipoPropiedad || 'propia'))}</div></div>
        <div class="vehicle-file-card"><h4>Km actual</h4><div class="vehicle-file-meta">${escapeHtml(formatVehicleKilometers(m.kmActual))}</div></div>
        <div class="vehicle-file-card"><h4>Próximo service</h4><div class="vehicle-file-meta">${escapeHtml(formatVehicleKilometers(m.kmProximoService))}</div></div>
        <div class="vehicle-file-card"><h4>Faltante</h4><div class="vehicle-file-meta">${escapeHtml(getVehicleServiceRemainingLabel(m))}</div></div>
        <div class="vehicle-file-card"><h4>Año</h4><div class="vehicle-file-meta">${escapeHtml(m.anio || 'Sin dato')}</div></div>
        <div class="vehicle-file-card"><h4>Número de motor</h4><div class="vehicle-file-meta">${escapeHtml(m.numeroMotor || 'Sin dato')}</div></div>
        <div class="vehicle-file-card"><h4>Número de chasis</h4><div class="vehicle-file-meta">${escapeHtml(m.numeroChasis || 'Sin dato')}</div></div>
      </div>
    </div>
    <div class="vehicle-file-panel">
      <h3>Documentación adjunta</h3>
      ${renderVehicleFileDocumentsReadonly(m)}
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab(event,'hTabPartes')">Partes (${partes.length})</button>
      <button class="tab-btn" onclick="switchTab(event,'hTabNovedades')">Novedades (${novs.length})</button>
    </div>
    <div id="hTabPartes" class="tab-content active">
      ${partes.length ? renderTablaPartes(partes) : '<div class="empty-state"><i class="fa-solid fa-clipboard"></i><h3>Sin partes</h3></div>'}
    </div>
    <div id="hTabNovedades" class="tab-content">
      ${novs.length ? novs.map(n => novedadCard(n)).join('') : '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>Sin novedades</h3></div>'}
    </div>
  `);
}

function verDetalleParte(id) {
  const p = DATA.partes.find(x => x.id === id);
  if (!p) return;
  openModal('Detalle del parte', `
    <div class="parte-check-shell parte-check-shell-readonly">
      ${renderPartePaper(p)}
    </div>
  `, `
    <button class="btn btn-secondary" onclick="exportarPartePDF(${id})"><i class="fa-solid fa-file-pdf"></i> Exportar PDF</button>
    <button class="btn btn-secondary" onclick="imprimirParte(${id})"><i class="fa-solid fa-print"></i> Imprimir</button>
    <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
  `);
}

function editarMovilidad(id) {
  if (!requirePermission('editVehicle')) return;
  const m = DATA.movilidades.find(x => x.id === id);
  if (!m) return;
  const lockInfo = getRealtimeMobilityLockInfo(id);
  const documentacion = normalizeVehicleFileDocuments(m);
  const allowPlateEdit = normalizeVehicleUnitType(m.tipoUnidad) === 'cuatriciclo';
  openModal(`Editar unidad: ${m.patente}`, `
    <div class="live-edit-modal-shell">
      <div id="mobilityEditLockNoticeHost">${renderMobilityEditLockNotice(lockInfo, m.patente)}</div>
      <fieldset class="live-edit-form-fieldset" id="mobilityEditFieldset" ${lockInfo.locked ? 'disabled' : ''}>
        <div class="form-grid">
      <div class="form-group"><label>Clase de unidad</label><select id="eTipoUnidad">${renderVehicleUnitTypeOptions(m.tipoUnidad || 'camioneta')}</select></div>
      ${allowPlateEdit ? `<div class="form-group"><label>Patente</label><input type="text" id="ePatente" value="${escapeHtml(m.patente)}"><small style="display:block;margin-top:6px;color:var(--color-text-light);font-size:11px">Podés actualizar la patente o identificador interno del cuatriciclo.</small></div>` : ''}
      <div class="form-group"><label>Marca</label><select id="eMarca">${renderVehicleBrandOptions(m.marca)}</select></div>
      <div class="form-group"><label>Modelo / descripción</label><input type="text" id="eDesc" value="${escapeHtml(m.descripcion)}"></div>
      <div class="form-group"><label>Tipo</label><select id="eTipoPropiedad">${renderVehicleOwnershipOptions(m.tipoPropiedad)}</select></div>
      <div class="form-group"><label>Año</label><input type="number" min="1900" max="2100" id="eAnio" value="${escapeHtml(m.anio)}"></div>
      <div class="form-group"><label>Número de motor</label><input type="text" id="eNumeroMotor" value="${escapeHtml(m.numeroMotor)}"></div>
      <div class="form-group"><label>Número de chasis</label><input type="text" id="eNumeroChasis" value="${escapeHtml(m.numeroChasis)}"></div>
      <div class="form-group"><label>Estado</label>
        <select id="eEstado">
          <option value="disponible" ${m.estado === 'disponible' ? 'selected' : ''}>Disponible</option>
          <option value="servicio" ${m.estado === 'servicio' ? 'selected' : ''}>En servicio</option>
          <option value="mantenimiento" ${m.estado === 'mantenimiento' ? 'selected' : ''}>En mantenimiento</option>
          <option value="fuera" ${m.estado === 'fuera' ? 'selected' : ''}>Fuera de servicio</option>
        </select>
      </div>
      <div class="form-group"><label>Provincia</label><select id="eProvincia">${renderVehicleProvinceOptions(m.provincia || 'mendoza')}</select></div>
      <div class="form-group"><label>Chofer</label><input type="text" id="eChofer" value="${m.chofer}"></div>
      <div class="form-group"><label>Km actual</label><input type="number" min="0" step="1" id="eKmActual" value="${escapeHtml(m.kmActual)}"></div>
      <div class="form-group"><label>Km próximo service</label><input type="number" min="0" step="1" id="eKmProximoService" value="${escapeHtml(m.kmProximoService)}"></div>
      <div class="form-group"><label>Vencimiento RTO</label><input type="date" id="eRtoVencimiento" value="${escapeHtml(m.rtoVencimiento)}"></div>
      <div class="form-group"><label>Vencimiento seguro</label><input type="date" id="eSeguroVencimiento" value="${escapeHtml(m.seguroVencimiento)}"></div>
      <div class="form-group full"><label>Ubicación</label><input type="text" id="eUbicacion" value="${m.ubicacion}"></div>
      <div class="form-group full"><label>Última novedad</label><input type="text" id="eNovedad" value="${m.ultimaNovedad}"></div>
        </div>
        <div class="parte-section-title" style="margin-top:18px">Documentación adjunta</div>
        ${renderVehicleFileDocumentsEditor('eDoc', documentacion)}
      </fieldset>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-danger" id="mobilityEditDeactivateButton" ${lockInfo.locked ? 'disabled' : ''} onclick="darDeBajaMovilidad(${id})"><i class="fa-solid fa-ban"></i> Dar de baja</button>
    <button class="btn btn-primary" id="mobilityEditSaveButton" ${lockInfo.locked ? 'disabled' : ''} onclick="aplicarEdicionMovilidad(${id})"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
  modalOverlay.dataset.mobilityEditId = String(m.id);
  if (lockInfo.locked) {
    showToast(`${lockInfo.namesText} ${lockInfo.editors.length === 1 ? 'está editando' : 'están editando'} esta unidad. La abriste en modo solo lectura.`, 'warning');
    clearRealtimeEditContext();
  } else {
    setRealtimeEditContext({
      mode: 'editing',
      entityType: 'movilidad',
      entityId: m.id,
      entityLabel: m.patente || getVehicleDisplayName(m),
    });
  }
  syncMobilityEditModalState();
}

function aplicarEdicionMovilidad(id) {
  if (!requirePermission('editVehicle')) return;
  const m = DATA.movilidades.find(x => x.id === id);
  if (!m) return;
  const nextUnitType = normalizeVehicleUnitType(document.getElementById('eTipoUnidad')?.value || m.tipoUnidad || 'camioneta');
  const nextPatente = nextUnitType === 'cuatriciclo'
    ? (document.getElementById('ePatente')?.value || m.patente).trim().toUpperCase()
    : m.patente;
  if (nextUnitType === 'cuatriciclo' && !nextPatente) {
    showToast('Ingresá la patente o identificador del cuatriciclo.', 'warning');
    return;
  }
  const validationError = validateVehicleTechnicalFields({
    anio: document.getElementById('eAnio')?.value || '',
    numeroMotor: document.getElementById('eNumeroMotor')?.value || '',
    numeroChasis: document.getElementById('eNumeroChasis')?.value || '',
  });
  if (validationError) {
    showToast(validationError, 'warning');
    return;
  }
  const serviceValidationError = validateVehicleServiceFields({
    kmActual: document.getElementById('eKmActual')?.value || '',
    kmProximoService: document.getElementById('eKmProximoService')?.value || '',
  });
  if (serviceValidationError) {
    showToast(serviceValidationError, 'warning');
    return;
  }
  apiRequest(`/api/movilidades/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      patente: nextPatente,
      tipoUnidad: nextUnitType,
      marca: document.getElementById('eMarca')?.value || m.marca || '',
      descripcion: document.getElementById('eDesc')?.value || m.descripcion,
      tipoPropiedad: document.getElementById('eTipoPropiedad')?.value || m.tipoPropiedad || 'propia',
      anio: document.getElementById('eAnio')?.value || m.anio || '',
      numeroMotor: document.getElementById('eNumeroMotor')?.value || m.numeroMotor || '',
      numeroChasis: document.getElementById('eNumeroChasis')?.value || m.numeroChasis || '',
      estado: document.getElementById('eEstado')?.value || m.estado,
      provincia: document.getElementById('eProvincia')?.value || m.provincia || 'mendoza',
      chofer: document.getElementById('eChofer')?.value || m.chofer,
      kmActual: document.getElementById('eKmActual')?.value || m.kmActual || '',
      kmProximoService: document.getElementById('eKmProximoService')?.value || m.kmProximoService || '',
      rtoVencimiento: document.getElementById('eRtoVencimiento')?.value || m.rtoVencimiento || '',
      seguroVencimiento: document.getElementById('eSeguroVencimiento')?.value || m.seguroVencimiento || '',
      tarjetaVerdeAdjunto: collectVehicleFileDocuments('eDoc').tarjetaVerde,
      tituloAdjunto: collectVehicleFileDocuments('eDoc').titulo,
      contratoFirmadoAdjunto: collectVehicleFileDocuments('eDoc').contratoFirmado,
      rtoAdjunto: collectVehicleFileDocuments('eDoc').rto,
      ubicacion: document.getElementById('eUbicacion')?.value || m.ubicacion,
      ultimaNovedad: document.getElementById('eNovedad')?.value || m.ultimaNovedad,
    }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Unidad actualizada', 'success');
      filtrarMovilidades();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo actualizar la unidad.', 'error');
    });
}

function darDeBajaMovilidad(id) {
  if (!requirePermission('editVehicle')) return;
  const movilidad = DATA.movilidades.find(item => item.id === id);
  if (!movilidad) return;
  if (!window.confirm(`¿Querés dar de baja la unidad ${movilidad.patente}? Quedará fuera de servicio.`)) return;

  apiRequest(`/api/movilidades/${id}/deactivate`, { method: 'PATCH' })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Unidad dada de baja', 'success');
      renderPageWithFilter(currentPage, currentFilter);
    })
    .catch(error => {
      showToast(error.message || 'No se pudo dar de baja la unidad.', 'error');
    });
}

function eliminarMovilidad(id) {
  if (!requirePermission('deleteVehicle', 'Tu rol no tiene permiso para eliminar movilidades.')) return;
  const movilidad = DATA.movilidades.find(item => item.id === id);
  if (!movilidad) return;
  if (!window.confirm(`¿Querés eliminar la unidad ${movilidad.patente}? Esta acción no se puede deshacer.`)) return;

  apiRequest(`/api/movilidades/${id}`, { method: 'DELETE' })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      showToast('Unidad eliminada', 'success');
      renderPageWithFilter(currentPage, currentFilter);
    })
    .catch(error => {
      showToast(error.message || 'No se pudo eliminar la unidad.', 'error');
    });
}

function editarParte(id) {
  if (!requirePermission('editPart')) return;
  const parte = DATA.partes.find(item => item.id === id);
  if (!parte) return;
  const cabecera = normalizeParteCabecera(parte.cabecera, parte);
  const documentacion = normalizeParteDocumentacion(parte.documentacion);
  const checklist = normalizeParteChecklist(parte.checklist);
  const adjunto = normalizeParteAdjunto(parte.adjunto);

  openModal('Editar parte diario', `
    <div class="parte-check-shell">
      <div class="parte-check-legend">Terminologia: B = Bien, R = Revisar, L = Faltante, D = Desgastado, P = Reparar, C = Limpiar, NC = No corresponde, O = Observar.</div>
      <div class="form-grid">
      <div class="form-group"><label>Empresa</label><input type="text" id="epCabEmpresa" value="${escapeHtml(cabecera.empresa)}"></div>
      <div class="form-group"><label>Móvil interno</label><input type="text" id="epCabMovilInterno" value="${escapeHtml(cabecera.movilInterno)}"></div>
      <div class="form-group"><label>N° control</label><input type="text" id="epCabNumeroControl" value="${escapeHtml(cabecera.numeroControl)}"></div>
      <div class="form-group"><label>Fecha</label><input type="date" id="epFecha" value="${parte.fecha}"></div>
      <div class="form-group"><label>Provincia</label>
        <select id="epProvincia">
          <option value="mendoza" ${parte.provincia === 'mendoza' ? 'selected' : ''}>Mendoza</option>
          <option value="san-juan" ${parte.provincia === 'san-juan' ? 'selected' : ''}>San Juan</option>
          <option value="santa-cruz" ${parte.provincia === 'santa-cruz' ? 'selected' : ''}>Santa Cruz</option>
        </select>
      </div>
      <div class="form-group"><label>Objetivo</label>
        <select id="epObjetivo">
          ${DATA.objetivos.map(o => `<option ${o.nombre === parte.objetivo ? 'selected' : ''}>${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Unidad</label>
        <select id="epUnidad" onchange="syncParteVehicleData('ep')">
          ${DATA.movilidades.map(m => `<option ${m.patente === parte.unidad ? 'selected' : ''}>${m.patente}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Patente</label><input type="text" id="epCabPatente" value="${escapeHtml(cabecera.patente || parte.unidad)}"></div>
      <div class="form-group"><label>Marca</label><input type="text" id="epCabMarca" value="${escapeHtml(cabecera.marca)}"></div>
      <div class="form-group"><label>Modelo</label><input type="text" id="epCabModelo" value="${escapeHtml(cabecera.modelo)}"></div>
      <div class="form-group"><label>Chofer</label><input type="text" id="epChofer" value="${escapeHtml(parte.chofer)}"></div>
      <div class="form-group"><label>KM actual</label><input type="number" id="epCabKmActual" value="${escapeHtml(cabecera.kmActual)}"></div>
      <div class="form-group"><label>Km inicial</label><input type="number" id="epKmIni" value="${parte.kmInicial}"></div>
      <div class="form-group"><label>Km final</label><input type="number" id="epKmFin" value="${parte.kmFinal}"></div>
      <div class="form-group"><label>Combustible (L)</label><input type="number" id="epCombustible" value="${parte.combustible}"></div>
      <div class="form-group"><label>Fecha último service</label><input type="date" id="epCabFechaUltimoService" value="${escapeHtml(cabecera.fechaUltimoService)}"></div>
      <div class="form-group"><label>Km próximo service</label><input type="text" id="epCabKmProximoService" value="${escapeHtml(cabecera.kmProximoService)}"></div>
      <div class="form-group"><label>Estado</label>
        <select id="epEstado">
          <option value="completo" ${parte.estado === 'completo' ? 'selected' : ''}>Completo</option>
          <option value="observado" ${parte.estado === 'observado' ? 'selected' : ''}>Observado</option>
        </select>
      </div>
      </div>
      <div class="parte-section-title">Documentación</div>
      <div class="parte-doc-grid">${renderParteDocumentacionEditor('epDoc', documentacion)}</div>
      <div class="parte-section-title">Checklist vehicular</div>
      ${renderParteChecklistEditor('epChk', checklist)}
      <div class="parte-section-title">Check firmado adjunto</div>
      ${renderParteAdjuntoEditor('ep', adjunto)}
      <div class="form-grid">
      <div class="form-group full"><label>Observaciones</label><textarea id="epObservaciones">${escapeHtml(parte.observaciones)}</textarea></div>
      <div class="form-group full"><label>Desperfectos</label><textarea id="epDesperfectos">${escapeHtml(parte.desperfectos)}</textarea></div>
      <div class="form-group"><label>Entrega, firma y aclaración</label><input type="text" id="epCabFirmaEntrega" value="${escapeHtml(cabecera.firmaEntrega)}"></div>
      <div class="form-group"><label>Recibe, firma y aclaración</label><input type="text" id="epCabFirmaRecibe" value="${escapeHtml(cabecera.firmaRecibe)}"></div>
      <div class="form-group"><label>Supervisor, firma y aclaración</label><input type="text" id="epCabFirmaSupervisor" value="${escapeHtml(cabecera.firmaSupervisor)}"></div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="aplicarEdicionParte(${id})"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function editarNovedad(id) {
  if (!requirePermission('editNews')) return;
  const novedad = DATA.novedades.find(item => item.id === id);
  if (!novedad) return;

  openModal('Editar novedad', `
    <div class="form-grid">
      <div class="form-group full"><label>Título</label><input type="text" id="enTitulo" value="${escapeHtml(novedad.titulo)}"></div>
      <div class="form-group"><label>Fecha</label><input type="date" id="enFecha" value="${novedad.fecha}"></div>
      <div class="form-group"><label>Unidad</label>
        <select id="enUnidad" onchange="syncEditNovedadDriver()">
          ${DATA.movilidades.map(m => `<option ${m.patente === novedad.unidad ? 'selected' : ''}>${m.patente}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Chofer</label><input type="text" id="enChofer" value="${escapeHtml(novedad.chofer)}"></div>
      <div class="form-group"><label>Objetivo</label>
        <select id="enObjetivo">
          ${DATA.objetivos.map(o => `<option ${o.nombre === novedad.objetivo ? 'selected' : ''}>${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Tipo</label>
        <select id="enTipo">
          <option value="rotura" ${novedad.tipo === 'rotura' ? 'selected' : ''}>Rotura</option>
          <option value="mantenimiento" ${novedad.tipo === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
          <option value="retraso" ${novedad.tipo === 'retraso' ? 'selected' : ''}>Retraso</option>
          <option value="incidente" ${novedad.tipo === 'incidente' ? 'selected' : ''}>Incidente</option>
          <option value="observacion" ${novedad.tipo === 'observacion' ? 'selected' : ''}>Observación</option>
        </select>
      </div>
      <div class="form-group"><label>Prioridad</label>
        <select id="enPrioridad">
          <option value="urgente" ${novedad.prioridad === 'urgente' ? 'selected' : ''}>Urgente</option>
          <option value="pendiente" ${novedad.prioridad === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="resuelto" ${novedad.prioridad === 'resuelto' ? 'selected' : ''}>Resuelto</option>
        </select>
      </div>
      <div class="form-group"><label>Estado</label>
        <select id="enEstado">
          <option value="urgente" ${novedad.estado === 'urgente' ? 'selected' : ''}>Urgente</option>
          <option value="pendiente" ${novedad.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="resuelto" ${novedad.estado === 'resuelto' ? 'selected' : ''}>Resuelto</option>
        </select>
      </div>
      <div class="form-group full"><label>Descripción</label><textarea id="enDescripcion">${escapeHtml(novedad.descripcion)}</textarea></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="aplicarEdicionNovedad(${id})"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function aplicarEdicionParte(id) {
  if (!requirePermission('editPart')) return;

  const kmInicial = parseInt(document.getElementById('epKmIni')?.value || 0, 10);
  const kmFinal = parseInt(document.getElementById('epKmFin')?.value || 0, 10);
  const chofer = document.getElementById('epChofer')?.value.trim() || '';

  if (!chofer) {
    showToast('Ingresá el chofer del parte.', 'warning');
    return;
  }

  if (kmFinal < kmInicial) {
    showToast('Km final no puede ser menor al inicial.', 'warning');
    return;
  }

  apiRequest(`/api/partes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      fecha: document.getElementById('epFecha')?.value || '',
      provincia: document.getElementById('epProvincia')?.value || 'mendoza',
      objetivo: document.getElementById('epObjetivo')?.value || '',
      unidad: document.getElementById('epUnidad')?.value || '',
      chofer,
      kmInicial,
      kmFinal,
      combustible: parseInt(document.getElementById('epCombustible')?.value || 0, 10),
      observaciones: document.getElementById('epObservaciones')?.value || 'Sin novedad',
      desperfectos: document.getElementById('epDesperfectos')?.value || 'Ninguno',
      cabecera: collectParteCabecera('ep'),
      documentacion: collectParteDocumentacion('epDoc'),
      checklist: collectParteChecklist('epChk'),
      adjunto: collectParteAdjunto('ep'),
      estado: document.getElementById('epEstado')?.value || 'completo',
    }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Parte actualizado correctamente', 'success');
      renderPartes();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo actualizar el parte.', 'error');
    });
}

function syncEditNovedadDriver() {
  const unidad = document.getElementById('enUnidad')?.value || '';
  const choferInput = document.getElementById('enChofer');
  if (!choferInput || !unidad) return;

  const movilidad = DATA.movilidades.find(item => item.patente === unidad);
  if (movilidad && movilidad.chofer) {
    choferInput.value = movilidad.chofer;
  }
}

function aplicarEdicionNovedad(id) {
  if (!requirePermission('editNews')) return;

  const titulo = document.getElementById('enTitulo')?.value.trim() || '';
  if (!titulo) {
    showToast('Ingresá un título para la novedad.', 'warning');
    return;
  }

  apiRequest(`/api/novedades/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      titulo,
      unidad: document.getElementById('enUnidad')?.value || '',
      chofer: document.getElementById('enChofer')?.value || '',
      objetivo: document.getElementById('enObjetivo')?.value || '',
      fecha: document.getElementById('enFecha')?.value || new Date().toISOString().slice(0, 10),
      tipo: document.getElementById('enTipo')?.value || 'rotura',
      prioridad: document.getElementById('enPrioridad')?.value || 'pendiente',
      descripcion: document.getElementById('enDescripcion')?.value || '',
      estado: document.getElementById('enEstado')?.value || 'pendiente',
    }),
  })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      closeModal();
      showToast('Novedad actualizada correctamente', 'success');
      renderNovedades();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo actualizar la novedad.', 'error');
    });
}

function editarUsuario(id) {
  if (!requireAdminAccess()) return;
  openModalEditarUsuario(id);
}

function eliminarUsuario(id) {
  if (!requireAdminAccess()) return;
  if (currentUser && currentUser.id === id) { showToast('No podés eliminar la sesión activa.', 'warning'); return; }
  apiRequest(`/api/users/${id}`, { method: 'DELETE' })
    .then(async () => {
      await loadUsers();
      renderUsuarios();
      showToast('Usuario eliminado', 'success');
    })
    .catch(error => {
      showToast(error.message || 'No se pudo eliminar el usuario.', 'error');
    });
}

function resolverNovedad(id) {
  if (!requirePermission('resolveNews')) return;
  apiRequest(`/api/novedades/${id}/resolve`, { method: 'PATCH' })
    .then(data => {
      DATA.movilidades = data.movilidades || [];
      DATA.objetivos = data.objetivos || [];
      DATA.partes = data.partes || [];
      DATA.novedades = data.novedades || [];
      updateAlertBadges();
      showToast('Novedad marcada como resuelta', 'success');
      filtrarNovedades();
    })
    .catch(error => {
      showToast(error.message || 'No se pudo actualizar la novedad.', 'error');
    });
}

function guardarConfiguracion() {
  if (!requirePermission('manageSettings')) return;
  showToast('Configuración guardada', 'success');
}

// ===========================
// TABS
// ===========================
function switchTab(e, targetId) {
  const container = e.target.closest('.modal-body') || e.target.closest('.page-content');
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  const target = container.querySelector('#' + targetId);
  if (target) target.classList.add('active');
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
        <div class="search-result-item" onclick="handleSearchResult('${r.page}','${r.filter || ''}')">
          <i class="fa-solid ${r.icon}"></i>
          <div><div class="result-title">${r.title}</div><div class="result-sub">${r.sub}</div></div>
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
// EXPORT CSV
// ===========================
function exportarTabla() {
  if (!requirePermission('exportData')) return;
  showToast('Exportando datos...', 'success');
}

function exportarCSV(tipo) {
  if (!requirePermission('exportData')) return;
  let rows = [], headers = [];
  if (tipo === 'movilidades') {
    headers = ['Patente', 'Descripcion', 'Clase', 'Estado', 'Provincia', 'Objetivo', 'Chofer', 'Ubicacion', 'Km actual', 'Km proximo service', 'Km restantes service'];
    rows = DATA.movilidades.map(m => [m.patente, m.descripcion, getVehicleUnitTypeLabel(m.tipoUnidad), m.estado, m.provincia, m.objetivo, m.chofer, m.ubicacion, m.kmActual || '', m.kmProximoService || '', getVehicleServiceRemainingLabel(m)]);
  } else if (tipo === 'partes') {
    headers = ['Fecha', 'Provincia', 'Objetivo', 'Unidad', 'Chofer', 'Km_Ini', 'Km_Fin', 'Recorrido', 'Combustible', 'Estado'];
    rows = DATA.partes.map(p => [p.fecha, p.provincia, p.objetivo, p.unidad, p.chofer, p.kmInicial, p.kmFinal, p.kmFinal - p.kmInicial, p.combustible, p.estado]);
  } else if (tipo === 'novedades') {
    headers = ['Titulo', 'Unidad', 'Chofer', 'Objetivo', 'Fecha', 'Tipo', 'Estado'];
    rows = DATA.novedades.map(n => [n.titulo, n.unidad, n.chofer, n.objetivo, n.fecha, n.tipo, n.estado]);
  }
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${tipo}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast(`Exportando ${tipo}.csv...`, 'success');
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
// TOAST
// ===========================
function createToastContainer() {
  const div = document.createElement('div');
  div.className = 'toast-container'; div.id = 'toastContainer';
  document.body.appendChild(div);
}

function showToast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===========================
// HELPERS
// ===========================
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

function normalizeParteAdjunto(adjunto) {
  const value = adjunto && typeof adjunto === 'object' ? adjunto : {};
  return {
    name: value.name || '',
    type: value.type || '',
    dataUrl: value.dataUrl || '',
  };
}

function normalizeVehicleFileDocuments(movilidad = {}) {
  return {
    tarjetaVerde: normalizeParteAdjunto(movilidad.tarjetaVerdeAdjunto),
    titulo: normalizeParteAdjunto(movilidad.tituloAdjunto),
    contratoFirmado: normalizeParteAdjunto(movilidad.contratoFirmadoAdjunto),
    rto: normalizeParteAdjunto(movilidad.rtoAdjunto),
  };
}

function renderVehicleFileDocumentsEditor(prefix, documents) {
  const tarjetaVerde = normalizeParteAdjunto(documents?.tarjetaVerde);
  const titulo = normalizeParteAdjunto(documents?.titulo);
  const contratoFirmado = normalizeParteAdjunto(documents?.contratoFirmado);
  const rto = normalizeParteAdjunto(documents?.rto);
  const items = [
    { key: 'TarjetaVerde', title: 'Tarjeta verde', file: tarjetaVerde },
    { key: 'Titulo', title: 'Título', file: titulo },
    { key: 'ContratoFirmado', title: 'Contrato firmado', file: contratoFirmado },
    { key: 'Rto', title: 'PDF de RTO', file: rto },
  ];

  return `
    <div class="vehicle-file-grid">
      ${items.map(item => `
        <div class="vehicle-file-card">
          <h4>${item.title}</h4>
          <input type="hidden" id="${prefix}${item.key}Nombre" value="${escapeHtml(item.file.name)}">
          <input type="hidden" id="${prefix}${item.key}Tipo" value="${escapeHtml(item.file.type)}">
          <input type="hidden" id="${prefix}${item.key}Data" value="${escapeHtml(item.file.dataUrl)}">
          <label class="btn btn-secondary btn-sm" for="${prefix}${item.key}File"><i class="fa-solid fa-file-pdf"></i> Cargar PDF</label>
          <input type="file" id="${prefix}${item.key}File" accept="application/pdf,.pdf" style="display:none" onchange="handleVehicleDocumentChange('${prefix}','${item.key}')">
          <div class="vehicle-file-meta" id="${prefix}${item.key}Meta">${item.file.name ? escapeHtml(item.file.name) : 'Sin PDF cargado'}</div>
          <div class="vehicle-file-actions" id="${prefix}${item.key}Actions">
            ${item.file.dataUrl ? `<a class="btn btn-secondary btn-sm" href="${item.file.dataUrl}" target="_blank" rel="noopener noreferrer" download="${escapeHtml(item.file.name || `${item.title}.pdf`)}"><i class="fa-solid fa-up-right-from-square"></i> Abrir PDF</a><button class="btn btn-secondary btn-sm" type="button" onclick="clearVehicleDocument('${prefix}','${item.key}')"><i class="fa-solid fa-trash"></i> Quitar</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderVehicleFileDocumentsReadonly(movilidad) {
  const documents = normalizeVehicleFileDocuments(movilidad);
  const items = [
    { title: 'Tarjeta verde', file: documents.tarjetaVerde },
    { title: 'Título', file: documents.titulo },
    { title: 'Contrato firmado', file: documents.contratoFirmado },
    { title: 'PDF de RTO', file: documents.rto },
  ];

  return `
    <div class="vehicle-file-grid readonly">
      ${items.map(item => `
        <div class="vehicle-file-card">
          <h4>${item.title}</h4>
          <div class="vehicle-file-meta">${item.file.name ? escapeHtml(item.file.name) : 'Sin archivo cargado'}</div>
          <div class="vehicle-file-actions">
            ${item.file.dataUrl ? `<a class="btn btn-secondary btn-sm" href="${item.file.dataUrl}" target="_blank" rel="noopener noreferrer" download="${escapeHtml(item.file.name || `${item.title}.pdf`)}"><i class="fa-solid fa-up-right-from-square"></i> Abrir PDF</a>` : '<span class="vehicle-file-empty">No disponible</span>'}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function collectVehicleFileDocuments(prefix) {
  return {
    tarjetaVerde: {
      name: document.getElementById(`${prefix}TarjetaVerdeNombre`)?.value || '',
      type: document.getElementById(`${prefix}TarjetaVerdeTipo`)?.value || '',
      dataUrl: document.getElementById(`${prefix}TarjetaVerdeData`)?.value || '',
    },
    titulo: {
      name: document.getElementById(`${prefix}TituloNombre`)?.value || '',
      type: document.getElementById(`${prefix}TituloTipo`)?.value || '',
      dataUrl: document.getElementById(`${prefix}TituloData`)?.value || '',
    },
    contratoFirmado: {
      name: document.getElementById(`${prefix}ContratoFirmadoNombre`)?.value || '',
      type: document.getElementById(`${prefix}ContratoFirmadoTipo`)?.value || '',
      dataUrl: document.getElementById(`${prefix}ContratoFirmadoData`)?.value || '',
    },
    rto: {
      name: document.getElementById(`${prefix}RtoNombre`)?.value || '',
      type: document.getElementById(`${prefix}RtoTipo`)?.value || '',
      dataUrl: document.getElementById(`${prefix}RtoData`)?.value || '',
    },
  };
}

function handleVehicleDocumentChange(prefix, key) {
  const fileInput = document.getElementById(`${prefix}${key}File`);
  const file = fileInput?.files?.[0];
  if (!file) return;

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Solo podés adjuntar archivos PDF.', 'warning');
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    showToast('El PDF supera los 8 MB permitidos.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : '';
    const nameInput = document.getElementById(`${prefix}${key}Nombre`);
    const typeInput = document.getElementById(`${prefix}${key}Tipo`);
    const dataInput = document.getElementById(`${prefix}${key}Data`);
    const meta = document.getElementById(`${prefix}${key}Meta`);
    const actions = document.getElementById(`${prefix}${key}Actions`);

    if (nameInput) nameInput.value = file.name;
    if (typeInput) typeInput.value = file.type || 'application/pdf';
    if (dataInput) dataInput.value = dataUrl;
    if (meta) meta.textContent = file.name;
    if (actions) {
      actions.innerHTML = `<a class="btn btn-secondary btn-sm" href="${dataUrl}" target="_blank" rel="noopener noreferrer" download="${escapeHtml(file.name)}"><i class="fa-solid fa-up-right-from-square"></i> Abrir PDF</a><button class="btn btn-secondary btn-sm" type="button" onclick="clearVehicleDocument('${prefix}','${key}')"><i class="fa-solid fa-trash"></i> Quitar</button>`;
    }
  };
  reader.readAsDataURL(file);
}

function clearVehicleDocument(prefix, key) {
  const fileInput = document.getElementById(`${prefix}${key}File`);
  const nameInput = document.getElementById(`${prefix}${key}Nombre`);
  const typeInput = document.getElementById(`${prefix}${key}Tipo`);
  const dataInput = document.getElementById(`${prefix}${key}Data`);
  const meta = document.getElementById(`${prefix}${key}Meta`);
  const actions = document.getElementById(`${prefix}${key}Actions`);

  if (fileInput) fileInput.value = '';
  if (nameInput) nameInput.value = '';
  if (typeInput) typeInput.value = '';
  if (dataInput) dataInput.value = '';
  if (meta) meta.textContent = 'Sin PDF cargado';
  if (actions) actions.innerHTML = '';
}

function renderParteStatusOptions(selectedValue) {
  return PARTE_STATUS_OPTIONS.map(option => `<option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>${option.label}</option>`).join('');
}

function renderParteDocumentacionEditor(prefix, documentacion) {
  return ['seguro', 'vtv', 'habilitacion'].map(key => {
    const labels = {
      seguro: 'Seguro',
      vtv: 'Verificacion tecnica vehicular',
      habilitacion: 'Habilitacion conductores',
    };
    const entry = documentacion[key] || { estado: '', vencimiento: '' };
    return `
      <div class="parte-doc-card">
        <h4>${labels[key]}</h4>
        <div class="form-grid parte-doc-inner">
          <div class="form-group"><label>Estado</label><select id="${prefix}_${key}_estado">${renderParteStatusOptions(entry.estado)}</select></div>
          <div class="form-group"><label>Vencimiento</label><input type="date" id="${prefix}_${key}_vencimiento" value="${escapeHtml(entry.vencimiento)}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderParteDocumentacionReadonly(documentacion) {
  return ['seguro', 'vtv', 'habilitacion'].map(key => {
    const labels = {
      seguro: 'Seguro',
      vtv: 'Verificacion tecnica vehicular',
      habilitacion: 'Habilitacion conductores',
    };
    const entry = documentacion[key] || { estado: '', vencimiento: '' };
    return `
      <div class="parte-doc-card parte-doc-card-readonly">
        <h4>${labels[key]}</h4>
        <p><strong>Estado:</strong> ${entry.estado || 'Sin dato'}</p>
        <p><strong>Vencimiento:</strong> ${formatMaybeDate(entry.vencimiento)}</p>
      </div>
    `;
  }).join('');
}

function renderParteChecklistEditor(prefix, checklist) {
  return `
    <div class="parte-check-grid">
      ${PARTE_CHECKLIST_SECTIONS.map(section => `
        <div class="parte-check-section">
          <h4>${section.title}</h4>
          <div class="parte-check-items">
            ${section.items.map(item => `
              <div class="parte-check-row">
                <span>${item.label}</span>
                <select id="${prefix}_${section.key}_${item.key}">${renderParteStatusOptions(checklist?.[section.key]?.[item.key] || '')}</select>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderParteChecklistReadonly(checklist) {
  return `
    <div class="parte-check-grid parte-check-grid-readonly">
      ${PARTE_CHECKLIST_SECTIONS.map(section => `
        <div class="parte-check-section">
          <h4>${section.title}</h4>
          <div class="parte-check-items parte-check-items-readonly">
            ${section.items.map(item => `
              <div class="parte-check-row parte-check-row-readonly">
                <span>${item.label}</span>
                <strong>${checklist?.[section.key]?.[item.key] || '-'}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderParteAdjuntoEditor(prefix, adjunto) {
  const normalized = normalizeParteAdjunto(adjunto);
  return `
    <div class="parte-attachment-editor">
      <input type="hidden" id="${prefix}AdjuntoNombre" value="${escapeHtml(normalized.name)}">
      <input type="hidden" id="${prefix}AdjuntoTipo" value="${escapeHtml(normalized.type)}">
      <input type="hidden" id="${prefix}AdjuntoData" value="${escapeHtml(normalized.dataUrl)}">
      <label class="btn btn-secondary btn-sm" for="${prefix}AdjuntoFile"><i class="fa-solid fa-image"></i> Cargar foto del check</label>
      <input type="file" id="${prefix}AdjuntoFile" accept="image/*" style="display:none" onchange="handleParteAttachmentChange('${prefix}')">
      <div class="parte-attachment-meta" id="${prefix}AdjuntoMeta">${normalized.name ? escapeHtml(normalized.name) : 'Sin imagen cargada'}</div>
      <div class="parte-attachment-preview ${normalized.dataUrl ? 'has-image' : ''}" id="${prefix}AdjuntoPreview">${normalized.dataUrl ? `<img src="${normalized.dataUrl}" alt="Adjunto del check">` : '<span>Vista previa de la imagen firmada</span>'}</div>
      ${normalized.dataUrl ? `<button class="btn btn-secondary btn-sm" type="button" onclick="clearParteAttachment('${prefix}')"><i class="fa-solid fa-trash"></i> Quitar imagen</button>` : ''}
    </div>
  `;
}

function renderParteAdjuntoReadonly(adjunto) {
  const normalized = normalizeParteAdjunto(adjunto);
  if (!normalized.dataUrl) {
    return '<div class="parte-attachment-empty">No hay imagen adjunta del check firmado.</div>';
  }

  return `
    <div class="parte-attachment-readonly">
      <div class="parte-attachment-meta">${escapeHtml(normalized.name || 'Imagen adjunta')}</div>
      <div class="parte-attachment-preview has-image"><img src="${normalized.dataUrl}" alt="Check firmado adjunto"></div>
    </div>
  `;
}

function collectParteAdjunto(prefix) {
  return {
    name: document.getElementById(`${prefix}AdjuntoNombre`)?.value || '',
    type: document.getElementById(`${prefix}AdjuntoTipo`)?.value || '',
    dataUrl: document.getElementById(`${prefix}AdjuntoData`)?.value || '',
  };
}

function handleParteAttachmentChange(prefix) {
  const fileInput = document.getElementById(`${prefix}AdjuntoFile`);
  const file = fileInput?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Solo podés adjuntar imágenes.', 'warning');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('La imagen supera los 5 MB permitidos.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : '';
    const nameInput = document.getElementById(`${prefix}AdjuntoNombre`);
    const typeInput = document.getElementById(`${prefix}AdjuntoTipo`);
    const dataInput = document.getElementById(`${prefix}AdjuntoData`);
    const meta = document.getElementById(`${prefix}AdjuntoMeta`);
    const preview = document.getElementById(`${prefix}AdjuntoPreview`);

    if (nameInput) nameInput.value = file.name;
    if (typeInput) typeInput.value = file.type;
    if (dataInput) dataInput.value = dataUrl;
    if (meta) meta.textContent = file.name;
    if (preview) {
      preview.classList.add('has-image');
      preview.innerHTML = `<img src="${dataUrl}" alt="Adjunto del check">`;
    }

    showToast('Imagen adjunta cargada.', 'success');
  };
  reader.readAsDataURL(file);
}

function clearParteAttachment(prefix) {
  const fileInput = document.getElementById(`${prefix}AdjuntoFile`);
  const nameInput = document.getElementById(`${prefix}AdjuntoNombre`);
  const typeInput = document.getElementById(`${prefix}AdjuntoTipo`);
  const dataInput = document.getElementById(`${prefix}AdjuntoData`);
  const meta = document.getElementById(`${prefix}AdjuntoMeta`);
  const preview = document.getElementById(`${prefix}AdjuntoPreview`);

  if (fileInput) fileInput.value = '';
  if (nameInput) nameInput.value = '';
  if (typeInput) typeInput.value = '';
  if (dataInput) dataInput.value = '';
  if (meta) meta.textContent = 'Sin imagen cargada';
  if (preview) {
    preview.classList.remove('has-image');
    preview.innerHTML = '<span>Vista previa de la imagen firmada</span>';
  }
}

function renderPartePaper(parte) {
  const cabecera = normalizeParteCabecera(parte.cabecera, parte);
  const documentacion = normalizeParteDocumentacion(parte.documentacion);
  const checklist = normalizeParteChecklist(parte.checklist);
  const adjunto = normalizeParteAdjunto(parte.adjunto);

  return `
    <div class="parte-paper">
      <div class="parte-paper-top">
        <div class="parte-paper-brand">
          <div class="parte-paper-logo">HUARPE</div>
          <div>
            <h2>Check vehicular</h2>
            <p>Control de estado de unidad y documentación</p>
          </div>
        </div>
        <div class="parte-paper-meta">
          <div><span>Fecha</span><strong>${formatFecha(parte.fecha)}</strong></div>
          <div><span>Control</span><strong>${escapeHtml(cabecera.numeroControl || 'Sin dato')}</strong></div>
          <div><span>Estado</span><strong>${escapeHtml(parte.estado)}</strong></div>
        </div>
      </div>

      <div class="parte-paper-header-grid">
        <div><span>Empresa</span><strong>${escapeHtml(cabecera.empresa)}</strong></div>
        <div><span>Móvil interno</span><strong>${escapeHtml(cabecera.movilInterno || 'Sin dato')}</strong></div>
        <div><span>Patente</span><strong>${escapeHtml(cabecera.patente || parte.unidad)}</strong></div>
        <div><span>Unidad</span><strong>${escapeHtml(parte.unidad || 'Sin dato')}</strong></div>
        <div><span>Marca</span><strong>${escapeHtml(cabecera.marca || 'Sin dato')}</strong></div>
        <div><span>Modelo</span><strong>${escapeHtml(cabecera.modelo || 'Sin dato')}</strong></div>
        <div><span>Chofer</span><strong>${escapeHtml(parte.chofer || 'Sin dato')}</strong></div>
        <div><span>Objetivo</span><strong>${escapeHtml(parte.objetivo || 'Sin dato')}</strong></div>
        <div><span>Provincia</span><strong>${escapeHtml(provinciaLabel(parte.provincia))}</strong></div>
        <div><span>Km actual</span><strong>${escapeHtml(cabecera.kmActual || '0')}</strong></div>
        <div><span>Km inicial</span><strong>${parte.kmInicial.toLocaleString()}</strong></div>
        <div><span>Km final</span><strong>${parte.kmFinal.toLocaleString()}</strong></div>
        <div><span>Recorrido</span><strong>${(parte.kmFinal - parte.kmInicial).toLocaleString()} km</strong></div>
        <div><span>Combustible</span><strong>${parte.combustible} L</strong></div>
        <div><span>Último service</span><strong>${formatMaybeDate(cabecera.fechaUltimoService)}</strong></div>
        <div><span>Próximo service</span><strong>${escapeHtml(cabecera.kmProximoService || 'Sin dato')}</strong></div>
      </div>

      <div class="parte-paper-block">
        <h3>Documentación</h3>
        <div class="parte-paper-doc-grid">
          ${['seguro', 'vtv', 'habilitacion'].map(key => {
            const labels = {
              seguro: 'Seguro',
              vtv: 'Verificación técnica',
              habilitacion: 'Habilitación conductores',
            };
            const entry = documentacion[key] || { estado: '', vencimiento: '' };
            return `<div class="parte-paper-doc-card"><span>${labels[key]}</span><strong>${entry.estado || 'Sin dato'}</strong><small>Vence: ${formatMaybeDate(entry.vencimiento)}</small></div>`;
          }).join('')}
        </div>
      </div>

      <div class="parte-paper-block">
        <h3>Checklist vehicular</h3>
        <div class="parte-paper-sections">
          ${PARTE_CHECKLIST_SECTIONS.map(section => `
            <div class="parte-paper-section">
              <h4>${section.title}</h4>
              <table>
                <tbody>
                  ${section.items.map(item => `<tr><td>${item.label}</td><td>${escapeHtml(checklist?.[section.key]?.[item.key] || '-')}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="parte-paper-block">
        <h3>Observaciones</h3>
        <p>${escapeHtml(parte.observaciones || 'Sin observaciones').replace(/\n/g, '<br>')}</p>
      </div>

      <div class="parte-paper-block">
        <h3>Desperfectos</h3>
        <p>${escapeHtml(parte.desperfectos || 'Sin desperfectos').replace(/\n/g, '<br>')}</p>
      </div>

      <div class="parte-paper-signatures">
        <div><span>Entrega</span><strong>${escapeHtml(cabecera.firmaEntrega || 'Sin dato')}</strong></div>
        <div><span>Recibe</span><strong>${escapeHtml(cabecera.firmaRecibe || 'Sin dato')}</strong></div>
        <div><span>Supervisor</span><strong>${escapeHtml(cabecera.firmaSupervisor || 'Sin dato')}</strong></div>
      </div>

      ${adjunto.dataUrl ? `
        <div class="parte-paper-block">
          <h3>Check firmado adjunto</h3>
          <div class="parte-paper-image-wrap"><img src="${adjunto.dataUrl}" alt="Imagen adjunta del check firmado"></div>
        </div>
      ` : ''}
    </div>
  `;
}

function getPartePrintStyles() {
  return `
    <style>
      body{font-family:Segoe UI,system-ui,sans-serif;background:#f3f4f6;color:#111827;margin:0;padding:24px}
      .parte-paper{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #dbe3ea;border-radius:18px;padding:24px;box-shadow:0 14px 36px rgba(15,23,42,.08)}
      .parte-paper-top,.parte-paper-header-grid,.parte-paper-doc-grid,.parte-paper-signatures,.parte-paper-sections{display:grid;gap:12px}
      .parte-paper-top{grid-template-columns:1.3fr .9fr;align-items:start;margin-bottom:18px}
      .parte-paper-brand{display:flex;gap:14px;align-items:center}.parte-paper-logo{width:72px;height:72px;border-radius:16px;background:#dbeafe;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-weight:800}.parte-paper-brand h2{margin:0 0 4px;font-size:24px}.parte-paper-brand p{margin:0;color:#64748b;font-size:13px}
      .parte-paper-meta{grid-template-columns:repeat(3,1fr)}
      .parte-paper-header-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:18px}
      .parte-paper-header-grid div,.parte-paper-meta div,.parte-paper-doc-card,.parte-paper-signatures div{border:1px solid #dbe3ea;border-radius:10px;padding:10px 12px;background:#f8fafc}
      .parte-paper-header-grid span,.parte-paper-meta span,.parte-paper-doc-card span,.parte-paper-signatures span{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:4px}
      .parte-paper-header-grid strong,.parte-paper-meta strong,.parte-paper-doc-card strong,.parte-paper-signatures strong{font-size:13px}
      .parte-paper-doc-card small{display:block;margin-top:4px;color:#64748b}
      .parte-paper-block{margin-top:18px}.parte-paper-block h3{margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #dbe3ea;font-size:15px}.parte-paper-block p{margin:0;font-size:13px;line-height:1.6;color:#334155}
      .parte-paper-doc-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      .parte-paper-sections{grid-template-columns:repeat(2,minmax(0,1fr))}
      .parte-paper-section{border:1px solid #dbe3ea;border-radius:12px;overflow:hidden}.parte-paper-section h4{margin:0;padding:10px 12px;background:#f8fafc;font-size:12px;text-transform:uppercase;letter-spacing:.05em}.parte-paper-section table{width:100%;border-collapse:collapse}.parte-paper-section td{padding:8px 12px;border-top:1px solid #eef2f7;font-size:12px}.parte-paper-section td:last-child{width:90px;text-align:center;font-weight:700}
      .parte-paper-signatures{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:18px}
      .parte-paper-image-wrap{border:1px dashed #cbd5e1;border-radius:14px;padding:12px;background:#f8fafc}.parte-paper-image-wrap img{display:block;max-width:100%;height:auto;border-radius:10px}
      @media print{body{background:#fff;padding:0}.parte-paper{box-shadow:none;border:none;border-radius:0;padding:0}}
    </style>
  `;
}

function openPartePrintWindow(parte, autoPrint = true) {
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    showToast('El navegador bloqueó la ventana de impresión.', 'warning');
    return null;
  }

  printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Parte ${escapeHtml(parte.unidad || parte.id)}</title>${getPartePrintStyles()}</head><body>${renderPartePaper(parte)}</body></html>`);
  printWindow.document.close();

  if (autoPrint) {
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  return printWindow;
}

function imprimirParte(id) {
  const parte = DATA.partes.find(item => item.id === id);
  if (!parte) return;
  openPartePrintWindow(parte, true);
}

function exportarPartePDF(id) {
  const parte = DATA.partes.find(item => item.id === id);
  if (!parte) return;
  openPartePrintWindow(parte, true);
  showToast('Se abrió la impresión. Elegí Guardar como PDF.', 'info');
}

function collectParteCabecera(prefix) {
  return {
    empresa: document.getElementById(`${prefix}CabEmpresa`)?.value.trim() || 'HUARPE',
    movilInterno: document.getElementById(`${prefix}CabMovilInterno`)?.value.trim() || '',
    numeroControl: document.getElementById(`${prefix}CabNumeroControl`)?.value.trim() || '',
    patente: document.getElementById(`${prefix}CabPatente`)?.value.trim() || '',
    marca: document.getElementById(`${prefix}CabMarca`)?.value.trim() || '',
    modelo: document.getElementById(`${prefix}CabModelo`)?.value.trim() || '',
    kmActual: document.getElementById(`${prefix}CabKmActual`)?.value.trim() || '',
    fechaUltimoService: document.getElementById(`${prefix}CabFechaUltimoService`)?.value || '',
    kmProximoService: document.getElementById(`${prefix}CabKmProximoService`)?.value.trim() || '',
    firmaEntrega: document.getElementById(`${prefix}CabFirmaEntrega`)?.value.trim() || '',
    firmaRecibe: document.getElementById(`${prefix}CabFirmaRecibe`)?.value.trim() || '',
    firmaSupervisor: document.getElementById(`${prefix}CabFirmaSupervisor`)?.value.trim() || '',
  };
}

function collectParteDocumentacion(prefix) {
  const result = {};
  ['seguro', 'vtv', 'habilitacion'].forEach(key => {
    result[key] = {
      estado: document.getElementById(`${prefix}_${key}_estado`)?.value || '',
      vencimiento: document.getElementById(`${prefix}_${key}_vencimiento`)?.value || '',
    };
  });
  return result;
}

function collectParteChecklist(prefix) {
  const result = {};
  PARTE_CHECKLIST_SECTIONS.forEach(section => {
    result[section.key] = {};
    section.items.forEach(item => {
      result[section.key][item.key] = document.getElementById(`${prefix}_${section.key}_${item.key}`)?.value || '';
    });
  });
  return result;
}

function syncParteVehicleData(prefix) {
  const unidadSelect = document.getElementById(`${prefix}Unidad`);
  const patente = unidadSelect?.value || '';
  const movilidad = DATA.movilidades.find(item => item.patente === patente);
  if (!movilidad) return;

  const patenteInput = document.getElementById(`${prefix}CabPatente`);
  const marcaInput = document.getElementById(`${prefix}CabMarca`);
  const modeloInput = document.getElementById(`${prefix}CabModelo`);
  const choferInput = document.getElementById(`${prefix}Chofer`);
  const description = movilidad.descripcion || '';
  const marca = movilidad.marca || description.split(' ').filter(Boolean)[0] || '';

  if (patenteInput && !patenteInput.value.trim()) patenteInput.value = movilidad.patente;
  if (marcaInput && !marcaInput.value.trim()) marcaInput.value = marca;
  if (modeloInput && !modeloInput.value.trim()) modeloInput.value = description;
  if (choferInput && !choferInput.value.trim()) choferInput.value = movilidad.chofer || '';
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

function getRtoAlertInfo(fecha) {
  return getDocumentAlertInfo(fecha);
}

function renderVehicleDocumentBadge(documento, fecha) {
  const info = getDocumentAlertInfo(fecha);
  const classMap = {
    expired: 'rto-badge rto-badge-expired',
    critical: 'rto-badge rto-badge-critical',
    warning: 'rto-badge rto-badge-warning',
    ok: 'rto-badge rto-badge-ok',
    missing: 'rto-badge rto-badge-missing',
  };
  return `<span class="${classMap[info.level] || classMap.missing}">${escapeHtml(documento.label)}: ${escapeHtml(info.label)}</span>`;
}

function renderRtoBadge(fecha) {
  return renderVehicleDocumentBadge({ label: 'RTO' }, fecha);
}

function getAllVehicleDocumentAlerts(movilidades) {
  return movilidades
    .filter(isVehicleDocumentTrackingEnabled)
    .flatMap(movilidad => VEHICLE_DOCUMENTS.map(document => ({
    movilidad,
    document,
    info: getDocumentAlertInfo(movilidad[document.field]),
  })));
}

function hasAnyVehicleDocumentAlert(movilidad) {
  if (!isVehicleDocumentTrackingEnabled(movilidad)) return false;
  return VEHICLE_DOCUMENTS.some(document => {
    const info = getDocumentAlertInfo(movilidad[document.field]);
    return info.level === 'critical' || info.level === 'expired' || info.level === 'warning';
  });
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

function isVehicleDocumentTrackingEnabled(movilidad) {
  return movilidad?.estado !== 'fuera';
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

function renderVehicleDocumentStatusStack(movilidad) {
  return `
    <div class="vehicle-doc-stack">
      ${VEHICLE_DOCUMENTS.map(document => renderVehicleDocumentBadge(document, movilidad[document.field])).join('')}
    </div>
  `;
}

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || '--';
}

function renderVehicleBrandOptions(selectedValue = '') {
  return ['<option value="">Seleccionar marca</option>', ...VEHICLE_BRANDS.map(brand => `<option value="${brand}" ${brand === selectedValue ? 'selected' : ''}>${brand}</option>`)].join('');
}

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

function renderVehicleUnitTypeOptions(selectedValue = 'camioneta') {
  const normalized = normalizeVehicleUnitType(selectedValue);
  return Object.entries(VEHICLE_UNIT_TYPES).map(([value, config]) => `<option value="${value}" ${value === normalized ? 'selected' : ''}>${config.label}</option>`).join('');
}

function renderVehicleOwnershipOptions(selectedValue = 'propia') {
  return VEHICLE_OWNERSHIP_OPTIONS.map(option => `<option value="${option}" ${option === selectedValue ? 'selected' : ''}>${capitalize(option)}</option>`).join('');
}

function renderVehicleProvinceOptions(selectedValue = '') {
  return VEHICLE_PROVINCES.map(province => `<option value="${province}" ${province === selectedValue ? 'selected' : ''}>${provinciaLabel(province)}</option>`).join('');
}

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

function countVehicleLoadedFiles(movilidad) {
  const documents = normalizeVehicleFileDocuments(movilidad);
  return [documents.tarjetaVerde, documents.titulo, documents.contratoFirmado, documents.rto]
    .filter(file => file && file.dataUrl)
    .length;
}

function renderVehicleFileIndicator(movilidad) {
  const count = countVehicleLoadedFiles(movilidad);
  if (!count) {
    return '<span class="vehicle-file-indicator empty"><i class="fa-regular fa-file"></i> Sin archivos</span>';
  }
  return `<span class="vehicle-file-indicator loaded"><i class="fa-solid fa-file-circle-check"></i> ${count}</span>`;
}

function renderVehicleUnitTypeBadge(unitType) {
  const config = getVehicleUnitConfig(unitType);
  return `<span class="vehicle-file-indicator loaded"><i class="fa-solid ${config.icon}"></i> ${config.label}</span>`;
}

function getVehicleDisplayName(movilidad) {
  const marca = String(movilidad?.marca || '').trim();
  const descripcion = String(movilidad?.descripcion || '').trim();
  if (!marca) return descripcion;
  if (!descripcion) return marca;
  return descripcion.toUpperCase().startsWith(marca.toUpperCase()) ? descripcion : `${marca} ${descripcion}`;
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function estadoBadge(estado) {
  const map = { disponible: ['status-disponible', 'Disponible'], servicio: ['status-servicio', 'En servicio'], mantenimiento: ['status-mantenimiento', 'Mantenimiento'], fuera: ['status-fuera', 'Fuera de servicio'] };
  const [cls, label] = map[estado] || ['status-fuera', estado];
  return `<span class="status-badge ${cls}">${label}</span>`;
}

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

function formatFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function renderPageWithFilter(page, filter) {
  renderPage(page, filter);
}
