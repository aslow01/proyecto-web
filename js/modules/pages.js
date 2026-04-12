/**
 * MÓDULO DE PÁGINAS - STUBS TEMPORALES
 * 
 * Estos son placeholders que se reemplazarán con los renderizadores reales.
 * Están aquí para permitir que la aplicación arranque mientras se refactorizan
 * las funciones de renderizado de cada página.
 * 
 * Cada función debe ser exportada para poder ser reemplazada más adelante.
 */

// ===========================
// PÁGINA: INICIO
// ===========================
function renderInicio(filter) {
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-house"></i> Inicio</h1>
      <p>Bienvenido a HUARPE Logística</p>
    </div>
    <div class="page-info">
      <div class="info-card">
        <i class="fa-solid fa-car"></i>
        <h3>Movilidades</h3>
        <p>Total: ${(DATA.movilidades || []).length} vehículos</p>
      </div>
      <div class="info-card">
        <i class="fa-solid fa-bullseye"></i>
        <h3>Objetivos</h3>
        <p>Total: ${(DATA.objetivos || []).length} objetivos</p>
      </div>
      <div class="info-card">
        <i class="fa-solid fa-list"></i>
        <h3>Partes</h3>
        <p>Total: ${(DATA.partes || []).length} partes</p>
      </div>
      <div class="info-card">
        <i class="fa-solid fa-bell"></i>
        <h3>Novedades</h3>
        <p>Total: ${(DATA.novedades || []).length} novedades</p>
      </div>
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: MOVILIDADES
// ===========================
function renderMovilidades(filter) {
  const filtered = applyMovilidadesFilter(DATA.movilidades || [], filter);
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-car"></i> Movilidades</h1>
      <button class="btn btn-primary" data-action="openNewMobilidadModal">
        <i class="fa-solid fa-plus"></i> Nueva movilidad
      </button>
    </div>
    <div class="list-container">
      ${filtered.length ? filtered.map(m => `
        <div class="list-item" data-id="${escapeHtml(m.id)}">
          <div class="list-item-main">
            <h4>${escapeHtml(m.patente)}</h4>
            <p>${escapeHtml(m.descripcion)}</p>
          </div>
          <div class="list-item-meta">
            <span class="badge">${escapeHtml(m.estado || 'Disponible')}</span>
          </div>
        </div>
      `).join('') : '<p class="empty">No hay movilidades.</p>'}
    </div>
  `;
  pageContent.innerHTML = html;
}

function applyMovilidadesFilter(list, filter) {
  if (!filter || filter === 'todas') return list;
  return list.filter(m => m.provincia?.toLowerCase().includes(filter?.toLowerCase()));
}

// ===========================
// PÁGINA: REQUERIMIENTOS
// ===========================
function renderRequerimientos(filter) {
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-clipboard-check"></i> Requerimientos</h1>
      <button class="btn btn-primary" data-action="openNewRequerimientoModal">
        <i class="fa-solid fa-plus"></i> Nuevo requerimiento
      </button>
    </div>
    <div class="list-container">
      <p class="empty">Módulo en construcción.</p>
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: COMBUSTIBLES
// ===========================
function renderCombustibles(filter) {
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-gas-pump"></i> Combustibles</h1>
      <button class="btn btn-primary" data-action="openNewCombustibleModal">
        <i class="fa-solid fa-plus"></i> Nuevo registro
      </button>
    </div>
    <div class="list-container">
      <p class="empty">Módulo en construcción.</p>
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: OBJETIVOS
// ===========================
function renderObjetivos(filter) {
  const filtered = applyObjetivosFilter(DATA.objetivos || [], filter);
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-bullseye"></i> Objetivos</h1>
      <button class="btn btn-primary" data-action="openNewObjetivoModal">
        <i class="fa-solid fa-plus"></i> Nuevo objetivo
      </button>
    </div>
    <div class="list-container">
      ${filtered.length ? filtered.map(o => `
        <div class="list-item" data-id="${escapeHtml(o.id)}">
          <div class="list-item-main">
            <h4>${escapeHtml(o.nombre)}</h4>
            <p>${escapeHtml(o.descripcion)}</p>
          </div>
        </div>
      `).join('') : '<p class="empty">No hay objetivos.</p>'}
    </div>
  `;
  pageContent.innerHTML = html;
}

function applyObjetivosFilter(list, filter) {
  if (!filter || filter === 'todos') return list;
  return list.filter(o => o.nombre?.toLowerCase().includes(filter?.toLowerCase()));
}

function buildObjectiveFilterKey(name) {
  return name.toString().trim().toLowerCase().replace(/\s+/g, '-');
}

// ===========================
// PÁGINA: PARTES
// ===========================
function renderPartes(filter) {
  const filtered = (DATA.partes || []).slice(0, 10);
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-list"></i> Partes</h1>
      <button class="btn btn-primary" data-action="openNewParteModal">
        <i class="fa-solid fa-plus"></i> Nuevo parte
      </button>
    </div>
    <div class="list-container">
      ${filtered.length ? filtered.map(p => `
        <div class="list-item" data-id="${escapeHtml(p.id)}">
          <div class="list-item-main">
            <h4>Parte #${p.numero || '---'}</h4>
            <p>${escapeHtml(p.movilidad || 'Sin datos')}</p>
          </div>
          <div class="list-item-meta">
            <span class="badge">${p.estado || 'Pendiente'}</span>
          </div>
        </div>
      `).join('') : '<p class="empty">No hay partes.</p>'}
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: NOVEDADES
// ===========================
function renderNovedades(filter) {
  const filtered = (DATA.novedades || []).slice(0, 10);
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-bell"></i> Novedades</h1>
      <button class="btn btn-primary" data-action="openNewNovedadModal">
        <i class="fa-solid fa-plus"></i> Nueva novedad
      </button>
    </div>
    <div class="list-container">
      ${filtered.length ? filtered.map(n => `
        <div class="list-item" data-id="${escapeHtml(n.id)}">
          <div class="list-item-main">
            <h4>${escapeHtml(n.titulo || '---')}</h4>
            <p>${escapeHtml(n.unidad || 'Sin unidad')}</p>
          </div>
          <div class="list-item-meta">
            <span class="badge ${n.estado === 'urgente' ? 'urgent' : ''}">${escapeHtml(n.estado || 'Normal')}</span>
          </div>
        </div>
      `).join('') : '<p class="empty">No hay novedades.</p>'}
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: REPORTES
// ===========================
function renderReportes(filter) {
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-chart-bar"></i> Reportes</h1>
    </div>
    <div class="list-container">
      <p class="empty">Módulo de reportes en construcción.</p>
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: CONFIGURACIÓN
// ===========================
function renderConfiguracion(filter) {
  if (!currentUser || !canViewPage('configuracion')) {
    renderAccessDenied('configuracion');
    return;
  }

  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-sliders"></i> Configuración</h1>
    </div>
    <div class="settings-container">
      <div class="settings-section">
        <h3>Preferencias de Interfaz</h3>
        <div class="setting-item">
          <label for="themeSelect">Tema</label>
          <select id="themeSelect" data-change-action="previewThemePreference">
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="auto">Automático</option>
          </select>
        </div>
      </div>
      <div class="settings-section">
        <h3>Información de Sesión</h3>
        <p>Usuario: ${escapeHtml(currentUser.nombre || 'Sin nombre')}</p>
        <p>Correo: ${escapeHtml(currentUser.email || 'Sin correo')}</p>
        <p>Rol: ${escapeHtml(currentUser.rol || 'Sin rol')}</p>
      </div>
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// PÁGINA: USUARIOS
// ===========================
function renderUsuarios(filter) {
  if (!currentUser || !canViewPage('usuarios')) {
    renderAccessDenied('usuarios');
    return;
  }

  const filtered = (DATA.usuarios || []);
  const html = `
    <div class="page-header">
      <h1><i class="fa-solid fa-users"></i> Usuarios</h1>
      <button class="btn btn-primary" data-action="openNewUsuarioModal">
        <i class="fa-solid fa-plus"></i> Nuevo usuario
      </button>
    </div>
    <div class="list-container">
      ${filtered.length ? filtered.map(u => `
        <div class="list-item" data-id="${escapeHtml(u.id)}">
          <div class="list-item-main">
            <h4>${escapeHtml(u.nombre || '---')}</h4>
            <p>${escapeHtml(u.email || 'Sin email')}</p>
          </div>
          <div class="list-item-meta">
            <span class="badge">${escapeHtml(u.rol || 'usuario')}</span>
          </div>
        </div>
      `).join('') : '<p class="empty">No hay usuarios.</p>'}
    </div>
  `;
  pageContent.innerHTML = html;
}

// ===========================
// HELPERS
// ===========================

function renderAccessDenied(page) {
  const html = `
    <div class="empty-state">
      <i class="fa-solid fa-ban"></i>
      <h3>Acceso denegado</h3>
      <p>No tienes permisos para ver esta página.</p>
    </div>
  `;
  pageContent.innerHTML = html;
}

// Exportar funciones (para compatibilidad con módulos)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderInicio,
    renderMovilidades,
    renderRequerimientos,
    renderCombustibles,
    renderObjetivos,
    renderPartes,
    renderNovedades,
    renderReportes,
    renderConfiguracion,
    renderUsuarios,
  };
}

console.log('✅ Módulo de páginas cargado.');
