// ===== LOGIPANEL - APP.JS =====

// ---- State ----
let currentPage = 'inicio';
let currentFilter = null;
let sidebarCollapsed = false;

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

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  renderPage('inicio');
  bindNav();
  bindSidebar();
  bindSearch();
  bindModal();
  createToastContainer();
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
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      const hasSubmenu = item.classList.contains('has-submenu');

      if (hasSubmenu) {
        item.classList.toggle('open');
        const submenu = item.closest('li').querySelector('.submenu');
        if (submenu) submenu.classList.toggle('open');
        return;
      }

      setActiveNav(item);
      currentFilter = null;
      renderPage(page);
      if (window.innerWidth <= 900) sidebar.classList.remove('mobile-open');
    });
  });

  document.querySelectorAll('.nav-subitem').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      const filter = item.dataset.filter;
      currentFilter = filter;
      renderPage(page, filter);
      if (window.innerWidth <= 900) sidebar.classList.remove('mobile-open');
    });
  });
}

function setActiveNav(el) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

function navigateTo(page, filter) {
  currentFilter = filter || null;
  renderPage(page, filter);
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.page === page && !i.classList.contains('has-submenu'));
  });
}

// ---- Page Router ----
function renderPage(page, filter) {
  currentPage = page;
  const renderers = {
    inicio: renderInicio,
    movilidades: renderMovilidades,
    objetivos: renderObjetivos,
    partes: renderPartes,
    novedades: renderNovedades,
    reportes: renderReportes,
    configuracion: renderConfiguracion,
    usuarios: renderUsuarios,
  };
  pageContent.innerHTML = '';
  (renderers[page] || renderInicio)(filter);
}

// ===========================
// INICIO
// ===========================
function renderInicio() {
  const mov = DATA.movilidades;
  const totalDisp = mov.filter(m => m.estado === 'disponible').length;
  const totalServ = mov.filter(m => m.estado === 'servicio').length;
  const totalMant = mov.filter(m => m.estado === 'mantenimiento').length;
  const totalFuera = mov.filter(m => m.estado === 'fuera').length;
  const novedadesUrgentes = DATA.novedades.filter(n => n.estado === 'urgente').length;

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
          <div class="stat-value">${totalFuera + novedadesUrgentes}</div>
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

    <h3 style="margin-bottom:16px;font-size:15px;font-weight:700;">Módulos</h3>
    <div class="home-cards">
      <div class="home-card" style="--card-accent:#2563eb;--card-icon-bg:#dbeafe;--card-icon-color:#2563eb;" onclick="navigateTo('movilidades')">
        <div class="home-card-icon"><i class="fa-solid fa-car"></i></div>
        <h3>Movilidades</h3>
        <p>Gestión de vehículos, choferes y estados operativos por provincia.</p>
        <div class="card-stat">${mov.length}</div>
      </div>
      <div class="home-card" style="--card-accent:#8b5cf6;--card-icon-bg:#ede9fe;--card-icon-color:#8b5cf6;" onclick="navigateTo('objetivos')">
        <div class="home-card-icon"><i class="fa-solid fa-bullseye"></i></div>
        <h3>Objetivos</h3>
        <p>Clientes y proyectos con unidades, choferes y partes asignados.</p>
        <div class="card-stat" style="color:#8b5cf6">${DATA.objetivos.length}</div>
      </div>
      <div class="home-card" style="--card-accent:#22c55e;--card-icon-bg:#dcfce7;--card-icon-color:#16a34a;" onclick="navigateTo('partes')">
        <div class="home-card-icon"><i class="fa-solid fa-clipboard-list"></i></div>
        <h3>Partes Diarios</h3>
        <p>Registro diario de servicios: km, combustible, chofer y observaciones.</p>
        <div class="card-stat" style="color:#16a34a">${DATA.partes.length}</div>
      </div>
      <div class="home-card" style="--card-accent:#f59e0b;--card-icon-bg:#fef3c7;--card-icon-color:#d97706;" onclick="navigateTo('novedades')">
        <div class="home-card-icon"><i class="fa-solid fa-bell"></i></div>
        <h3>Novedades</h3>
        <p>Roturas, mantenimientos, incidentes y observaciones con prioridad visual.</p>
        <div class="card-stat" style="color:#d97706">${DATA.novedades.length}</div>
      </div>
      <div class="home-card" style="--card-accent:#06b6d4;--card-icon-bg:#cffafe;--card-icon-color:#0891b2;" onclick="navigateTo('reportes')">
        <div class="home-card-icon"><i class="fa-solid fa-chart-bar"></i></div>
        <h3>Reportes</h3>
        <p>Partes por fecha, novedades por unidad, historial y exportación.</p>
        <div class="card-stat" style="color:#0891b2">4</div>
      </div>
      <div class="home-card" style="--card-accent:#64748b;--card-icon-bg:#f1f5f9;--card-icon-color:#475569;" onclick="navigateTo('configuracion')">
        <div class="home-card-icon"><i class="fa-solid fa-gear"></i></div>
        <h3>Configuración</h3>
        <p>Parámetros del sistema, notificaciones y gestión de la plataforma.</p>
        <div class="card-stat" style="color:#475569">—</div>
      </div>
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

// ===========================
// MOVILIDADES
// ===========================
function renderMovilidades(filter) {
  let data = [...DATA.movilidades];
  const provincias = ['mendoza', 'san-juan', 'santa-cruz'];
  const estados = ['disponibles', 'en-servicio', 'mantenimiento'];

  if (filter && provincias.includes(filter)) data = data.filter(m => m.provincia === filter);
  if (filter === 'disponibles') data = data.filter(m => m.estado === 'disponible');
  if (filter === 'en-servicio') data = data.filter(m => m.estado === 'servicio');
  if (filter === 'mantenimiento') data = data.filter(m => m.estado === 'mantenimiento');

  const filterTitle = {
    mendoza: 'Mendoza', 'san-juan': 'San Juan', 'santa-cruz': 'Santa Cruz',
    disponibles: 'Disponibles', 'en-servicio': 'En servicio', mantenimiento: 'En mantenimiento', todas: 'Todas'
  };

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-car" style="color:var(--color-primary);margin-right:8px;"></i>Movilidades ${filter ? '– ' + (filterTitle[filter] || '') : ''}</h2>
        <p>Listado general de unidades operativas</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openModalNuevaMovilidad()"><i class="fa-solid fa-plus"></i> Nueva unidad</button>
        <button class="btn btn-secondary" onclick="exportarTabla()"><i class="fa-solid fa-file-export"></i> Exportar</button>
      </div>
    </div>

    <div class="filters-bar" id="filtrosMovilidades">
      <div class="filter-group">
        <label>Provincia</label>
        <select id="filtProvincia" onchange="filtrarMovilidades()">
          <option value="">Todas</option>
          <option value="mendoza" ${filter==='mendoza'?'selected':''}>Mendoza</option>
          <option value="san-juan" ${filter==='san-juan'?'selected':''}>San Juan</option>
          <option value="santa-cruz" ${filter==='santa-cruz'?'selected':''}>Santa Cruz</option>
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
      <button class="btn btn-secondary btn-sm" onclick="limpiarFiltrosMovilidades()"><i class="fa-solid fa-rotate-left"></i> Limpiar</button>
    </div>

    <div class="table-wrapper" id="tablaMovilidadesWrapper">
      <div class="table-toolbar">
        <h3 id="countMovilidades">${data.length} unidad${data.length !== 1 ? 'es' : ''}</h3>
        <input type="text" id="buscarMovilidad" placeholder="Buscar patente, chofer..." 
          style="padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;font-size:13px;outline:none;width:220px;"
          oninput="filtrarMovilidades()">
      </div>
      <div id="tablaMovilidadesContent">
        ${renderTablaMovilidades(data)}
      </div>
    </div>
  `;

  if (filter && provincias.includes(filter)) {
    document.getElementById('filtProvincia').value = filter;
  }
}

function renderTablaMovilidades(data) {
  if (!data.length) return `<div class="empty-state"><i class="fa-solid fa-car-burst"></i><h3>Sin resultados</h3><p>No hay unidades que coincidan con los filtros</p></div>`;
  return `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th>Patente</th><th>Descripción</th><th>Estado</th>
      <th>Provincia</th><th>Objetivo</th><th>Chofer</th>
      <th>Ubicación</th><th>Última novedad</th><th>Acciones</th>
    </tr></thead>
    <tbody>
      ${data.map(m => `<tr>
        <td><strong>${m.patente}</strong></td>
        <td>${m.descripcion}</td>
        <td>${estadoBadge(m.estado)}</td>
        <td><i class="fa-solid fa-map-pin" style="color:var(--color-primary);margin-right:4px;"></i>${provinciaLabel(m.provincia)}</td>
        <td>${m.objetivo}</td>
        <td>${m.chofer}</td>
        <td style="color:var(--color-text-light);font-size:12px">${m.ubicacion}</td>
        <td style="color:var(--color-text-light);font-size:12px;max-width:180px">${m.ultimaNovedad}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-icon" title="Ver historial" onclick="verHistorialMovilidad(${m.id})"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-icon" title="Editar" onclick="editarMovilidad(${m.id})"><i class="fa-solid fa-pen"></i></button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function filtrarMovilidades() {
  const prov = (document.getElementById('filtProvincia')?.value || '').toLowerCase();
  const obj = (document.getElementById('filtObjetivo')?.value || '').toLowerCase();
  const est = (document.getElementById('filtEstado')?.value || '').toLowerCase();
  const busca = (document.getElementById('buscarMovilidad')?.value || '').toLowerCase();

  let data = DATA.movilidades.filter(m => {
    if (prov && m.provincia !== prov) return false;
    if (obj && !m.objetivo.toLowerCase().includes(obj)) return false;
    if (est && m.estado !== est) return false;
    if (busca && !m.patente.toLowerCase().includes(busca) && !m.chofer.toLowerCase().includes(busca) && !m.descripcion.toLowerCase().includes(busca)) return false;
    return true;
  });

  document.getElementById('tablaMovilidadesContent').innerHTML = renderTablaMovilidades(data);
  document.getElementById('countMovilidades').textContent = `${data.length} unidad${data.length !== 1 ? 'es' : ''}`;
}

function limpiarFiltrosMovilidades() {
  ['filtProvincia', 'filtObjetivo', 'filtEstado', 'buscarMovilidad'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  filtrarMovilidades();
}

// ===========================
// OBJETIVOS
// ===========================
function renderObjetivos(filter) {
  let data = [...DATA.objetivos];
  if (filter && filter !== 'todos') data = data.filter(o => o.nombre.toLowerCase().replace(/\s/g, '') === filter.replace('-', '').toLowerCase() || o.nombre.toLowerCase().includes(filter.toLowerCase()));

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-bullseye" style="color:#8b5cf6;margin-right:8px;"></i>Objetivos</h2>
        <p>Clientes y proyectos asignados</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openModalNuevoObjetivo()"><i class="fa-solid fa-plus"></i> Nuevo objetivo</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;">
      ${data.map(o => objetivoCard(o)).join('')}
    </div>
  `;
}

function objetivoCard(o) {
  const colores = { activo: 'green', inactivo: 'red' };
  return `
    <div class="objetivo-card" onclick="verDetalleObjetivo(${o.id})">
      <div class="objetivo-card-header">
        <div class="objetivo-icon"><i class="fa-solid ${o.icono}"></i></div>
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

// ===========================
// PARTES DIARIOS
// ===========================
function renderPartes() {
  let data = [...DATA.partes];

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-clipboard-list" style="color:#22c55e;margin-right:8px;"></i>Partes Diarios</h2>
        <p>Registro diario de servicios por unidad</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openModalNuevoParte()"><i class="fa-solid fa-plus"></i> Cargar parte</button>
        <button class="btn btn-secondary" onclick="exportarTabla()"><i class="fa-solid fa-file-export"></i> Exportar</button>
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
        ${renderTablaPartes(data)}
      </div>
    </div>
  `;
}

function renderTablaPartes(data) {
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
            <button class="btn-icon" title="Editar" onclick="editarParte(${p.id})"><i class="fa-solid fa-pen"></i></button>
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

  document.getElementById('tablaPartesContent').innerHTML = renderTablaPartes(data);
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
  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-bell" style="color:#f59e0b;margin-right:8px;"></i>Novedades</h2>
        <p>Roturas, mantenimientos, incidentes y observaciones operativas</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="openModalNovedad()"><i class="fa-solid fa-plus"></i> Nueva novedad</button>
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
  const tipos = { rotura: 'fa-wrench', mantenimiento: 'fa-screwdriver-wrench', retraso: 'fa-clock', incidente: 'fa-triangle-exclamation', observacion: 'fa-eye' };
  return `
    <div class="novedad-card ${n.estado}">
      <div class="novedad-header">
        <div style="display:flex;align-items:center;gap:8px">
          <i class="fa-solid ${tipos[n.tipo] || 'fa-circle-info'}" style="color:${n.estado === 'urgente' ? '#ef4444' : n.estado === 'pendiente' ? '#f59e0b' : '#22c55e'}"></i>
          <span class="novedad-title">${n.titulo}</span>
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
        ${n.estado !== 'resuelto' ? `<button class="btn btn-success btn-sm" onclick="resolverNovedad(${n.id})"><i class="fa-solid fa-check"></i> Marcar resuelto</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="editarNovedad(${n.id})"><i class="fa-solid fa-pen"></i> Editar</button>
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
            <i class="fa-solid ${o.icono}" style="color:var(--color-primary);font-size:16px"></i>
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
  const panel = document.getElementById('reportePanel');
  panel.className = 'card';
  panel.innerHTML = `
    <h3 style="margin-bottom:16px;font-size:15px;font-weight:700">Exportar datos</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-secondary" onclick="exportarCSV('movilidades')"><i class="fa-solid fa-file-csv"></i> Exportar Movilidades (.csv)</button>
      <button class="btn btn-secondary" onclick="exportarCSV('partes')"><i class="fa-solid fa-file-csv"></i> Exportar Partes Diarios (.csv)</button>
      <button class="btn btn-secondary" onclick="exportarCSV('novedades')"><i class="fa-solid fa-file-csv"></i> Exportar Novedades (.csv)</button>
    </div>
    <p style="margin-top:14px;font-size:12px;color:var(--color-text-light)">Los archivos se descargarán en formato CSV compatible con Excel.</p>
  `;
}

// ===========================
// CONFIGURACION
// ===========================
function renderConfiguracion() {
  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-gear" style="color:#64748b;margin-right:8px;"></i>Configuración</h2>
        <p>Parámetros y preferencias del sistema</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="guardarConfiguracion()"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
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
function renderUsuarios() {
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
      <div class="table-toolbar"><h3>${DATA.usuarios.length} usuarios</h3></div>
      <div style="overflow-x:auto"><table>
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
            <td style="font-size:12px;color:var(--color-text-light)">${formatFecha(u.ultima)}</td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="btn-icon" title="Editar" onclick="editarUsuario(${u.id})"><i class="fa-solid fa-pen"></i></button>
                ${u.id !== 1 ? `<button class="btn-icon" title="Eliminar" style="color:var(--color-danger)" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
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
}

function bindModal() {
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
}

function openModalNuevaMovilidad() {
  openModal('Nueva unidad', `
    <div class="form-grid">
      <div class="form-group"><label>Patente</label><input type="text" placeholder="ej. MZA-001" id="mPatente"></div>
      <div class="form-group"><label>Descripción</label><input type="text" placeholder="ej. Ford Ranger 2022" id="mDesc"></div>
      <div class="form-group"><label>Provincia</label>
        <select id="mProvincia">
          <option value="mendoza">Mendoza</option>
          <option value="san-juan">San Juan</option>
          <option value="santa-cruz">Santa Cruz</option>
        </select>
      </div>
      <div class="form-group"><label>Objetivo</label>
        <select id="mObjetivo">
          ${DATA.objetivos.map(o => `<option value="${o.nombre.toLowerCase()}">${o.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Chofer</label><input type="text" placeholder="Nombre del chofer" id="mChofer"></div>
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
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMovilidad()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function guardarMovilidad() {
  const patente = document.getElementById('mPatente')?.value.trim();
  const desc = document.getElementById('mDesc')?.value.trim();
  if (!patente || !desc) { showToast('Completá los campos obligatorios', 'warning'); return; }

  const nueva = {
    id: DATA.movilidades.length + 1,
    patente: patente,
    descripcion: desc,
    estado: document.getElementById('mEstado')?.value || 'disponible',
    provincia: document.getElementById('mProvincia')?.value || 'mendoza',
    objetivo: document.getElementById('mObjetivo')?.options[document.getElementById('mObjetivo').selectedIndex]?.text || '',
    ubicacion: document.getElementById('mUbicacion')?.value || '',
    ultimaNovedad: 'Sin novedades',
    chofer: document.getElementById('mChofer')?.value || '',
  };
  DATA.movilidades.push(nueva);
  closeModal();
  showToast('Unidad agregada correctamente', 'success');
  renderPageWithFilter(currentPage, currentFilter);
}

function openModalNuevoParte() {
  const hoy = new Date().toISOString().slice(0, 10);
  openModal('Cargar parte diario', `
    <div class="form-grid">
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
        <select id="pUnidad">
          ${DATA.movilidades.map(m => `<option>${m.patente}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Chofer</label><input type="text" id="pChofer" placeholder="Nombre del chofer"></div>
      <div class="form-group"><label>Km inicial</label><input type="number" id="pKmIni" placeholder="0"></div>
      <div class="form-group"><label>Km final</label><input type="number" id="pKmFin" placeholder="0"></div>
      <div class="form-group"><label>Combustible (L)</label><input type="number" id="pCombustible" placeholder="0"></div>
      <div class="form-group full"><label>Observaciones</label><textarea id="pObservaciones" placeholder="Novedades del día..."></textarea></div>
      <div class="form-group full"><label>Desperfectos</label><textarea id="pDesperfectos" placeholder="Ninguno / descripción del problema..."></textarea></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarParte()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function guardarParte() {
  const kmIni = parseInt(document.getElementById('pKmIni')?.value || 0);
  const kmFin = parseInt(document.getElementById('pKmFin')?.value || 0);
  if (!document.getElementById('pChofer')?.value.trim()) { showToast('Ingresá el chofer', 'warning'); return; }
  if (kmFin < kmIni) { showToast('Km final no puede ser menor al inicial', 'warning'); return; }

  const nuevo = {
    id: DATA.partes.length + 1,
    fecha: document.getElementById('pFecha')?.value,
    provincia: document.getElementById('pProvincia')?.value,
    objetivo: document.getElementById('pObjetivo')?.options[document.getElementById('pObjetivo').selectedIndex]?.text,
    unidad: document.getElementById('pUnidad')?.options[document.getElementById('pUnidad').selectedIndex]?.text,
    chofer: document.getElementById('pChofer')?.value.trim(),
    kmInicial: kmIni, kmFinal: kmFin,
    combustible: parseInt(document.getElementById('pCombustible')?.value || 0),
    observaciones: document.getElementById('pObservaciones')?.value || 'Sin novedad',
    desperfectos: document.getElementById('pDesperfectos')?.value || 'Ninguno',
    estado: 'completo',
  };
  DATA.partes.unshift(nuevo);
  closeModal();
  showToast('Parte cargado correctamente', 'success');
  renderPartes();
}

function openModalNovedad() {
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
  const titulo = document.getElementById('nTitulo')?.value.trim();
  if (!titulo) { showToast('Ingresá un título', 'warning'); return; }

  const unidadSel = document.getElementById('nUnidad');
  const objSel = document.getElementById('nObjetivo');
  const unidadPatente = unidadSel?.options[unidadSel.selectedIndex]?.text || '';
  const mov = DATA.movilidades.find(m => m.patente === unidadPatente);

  const nueva = {
    id: DATA.novedades.length + 1,
    titulo,
    unidad: unidadPatente,
    chofer: mov ? mov.chofer : '',
    objetivo: objSel?.options[objSel.selectedIndex]?.text || '',
    fecha: new Date().toISOString().slice(0, 10),
    tipo: document.getElementById('nTipo')?.value || 'rotura',
    prioridad: document.getElementById('nPrioridad')?.value || 'pendiente',
    descripcion: document.getElementById('nDescripcion')?.value || '',
    estado: document.getElementById('nPrioridad')?.value || 'pendiente',
  };
  DATA.novedades.unshift(nueva);

  const urgent = DATA.novedades.filter(n => n.estado === 'urgente').length;
  const badge = document.getElementById('badgeNovedades');
  if (badge) badge.textContent = urgent;
  document.querySelectorAll('.topbar-btn .badge').forEach(b => b.textContent = urgent);

  closeModal();
  showToast('Novedad cargada correctamente', 'success');
  renderNovedades();
}

function openModalNuevoObjetivo() {
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
  const nombre = document.getElementById('oNombre')?.value.trim();
  if (!nombre) { showToast('Ingresá un nombre', 'warning'); return; }
  DATA.objetivos.push({ id: DATA.objetivos.length + 1, nombre, descripcion: document.getElementById('oDesc')?.value || '', icono: 'fa-circle', unidades: 0, choferes: 0, partes: 0, novedades: 0, estado: 'activo' });
  closeModal();
  showToast('Objetivo agregado', 'success');
  renderObjetivos();
}

function openModalNuevoUsuario() {
  openModal('Nuevo usuario', `
    <div class="form-grid">
      <div class="form-group full"><label>Nombre completo</label><input type="text" id="uNombre" placeholder="Juan Pérez"></div>
      <div class="form-group full"><label>Email</label><input type="email" id="uEmail" placeholder="usuario@empresa.com"></div>
      <div class="form-group"><label>Rol</label>
        <select id="uRol">
          <option value="administrador">Administrador</option>
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

function guardarUsuario() {
  const nombre = document.getElementById('uNombre')?.value.trim();
  const email = document.getElementById('uEmail')?.value.trim();
  if (!nombre || !email) { showToast('Completá todos los campos', 'warning'); return; }
  DATA.usuarios.push({ id: DATA.usuarios.length + 1, nombre, email, rol: document.getElementById('uRol')?.value || 'operador', estado: 'activo', ultima: new Date().toISOString().slice(0, 10) });
  closeModal();
  showToast('Usuario creado', 'success');
  renderUsuarios();
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
      <strong>${m.descripcion}</strong> — ${estadoBadge(m.estado)}
      <div style="font-size:12px;color:var(--color-text-light);margin-top:4px">Chofer: ${m.chofer} | ${provinciaLabel(m.provincia)} | ${m.objetivo}</div>
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
    <div class="form-grid" style="pointer-events:none">
      <div class="form-group"><label>Fecha</label><input type="text" value="${formatFecha(p.fecha)}" readonly></div>
      <div class="form-group"><label>Unidad</label><input type="text" value="${p.unidad}" readonly></div>
      <div class="form-group"><label>Chofer</label><input type="text" value="${p.chofer}" readonly></div>
      <div class="form-group"><label>Objetivo</label><input type="text" value="${p.objetivo}" readonly></div>
      <div class="form-group"><label>Km inicial</label><input type="text" value="${p.kmInicial.toLocaleString()}" readonly></div>
      <div class="form-group"><label>Km final</label><input type="text" value="${p.kmFinal.toLocaleString()}" readonly></div>
      <div class="form-group"><label>Recorrido</label><input type="text" value="${(p.kmFinal - p.kmInicial).toLocaleString()} km" readonly></div>
      <div class="form-group"><label>Combustible</label><input type="text" value="${p.combustible} L" readonly></div>
      <div class="form-group full"><label>Observaciones</label><textarea readonly>${p.observaciones}</textarea></div>
      <div class="form-group full"><label>Desperfectos</label><textarea readonly>${p.desperfectos}</textarea></div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>`);
}

function editarMovilidad(id) {
  const m = DATA.movilidades.find(x => x.id === id);
  if (!m) return;
  openModal(`Editar unidad: ${m.patente}`, `
    <div class="form-grid">
      <div class="form-group"><label>Estado</label>
        <select id="eEstado">
          <option value="disponible" ${m.estado === 'disponible' ? 'selected' : ''}>Disponible</option>
          <option value="servicio" ${m.estado === 'servicio' ? 'selected' : ''}>En servicio</option>
          <option value="mantenimiento" ${m.estado === 'mantenimiento' ? 'selected' : ''}>En mantenimiento</option>
          <option value="fuera" ${m.estado === 'fuera' ? 'selected' : ''}>Fuera de servicio</option>
        </select>
      </div>
      <div class="form-group"><label>Chofer</label><input type="text" id="eChofer" value="${m.chofer}"></div>
      <div class="form-group full"><label>Ubicación</label><input type="text" id="eUbicacion" value="${m.ubicacion}"></div>
      <div class="form-group full"><label>Última novedad</label><input type="text" id="eNovedad" value="${m.ultimaNovedad}"></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="aplicarEdicionMovilidad(${id})"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

function aplicarEdicionMovilidad(id) {
  const m = DATA.movilidades.find(x => x.id === id);
  if (!m) return;
  m.estado = document.getElementById('eEstado')?.value || m.estado;
  m.chofer = document.getElementById('eChofer')?.value || m.chofer;
  m.ubicacion = document.getElementById('eUbicacion')?.value || m.ubicacion;
  m.ultimaNovedad = document.getElementById('eNovedad')?.value || m.ultimaNovedad;
  closeModal();
  showToast('Unidad actualizada', 'success');
  filtrarMovilidades();
}

function editarParte(id) {
  showToast('Función de edición disponible en la versión completa', 'warning');
}

function editarNovedad(id) {
  showToast('Función de edición disponible en la versión completa', 'warning');
}

function editarUsuario(id) {
  showToast('Función de edición disponible en la versión completa', 'warning');
}

function eliminarUsuario(id) {
  const idx = DATA.usuarios.findIndex(u => u.id === id);
  if (idx !== -1) { DATA.usuarios.splice(idx, 1); renderUsuarios(); showToast('Usuario eliminado', 'success'); }
}

function resolverNovedad(id) {
  const n = DATA.novedades.find(x => x.id === id);
  if (n) { n.estado = 'resuelto'; n.prioridad = 'resuelto'; }
  const urgent = DATA.novedades.filter(n => n.estado === 'urgente').length;
  const badge = document.getElementById('badgeNovedades');
  if (badge) badge.textContent = urgent || '';
  showToast('Novedad marcada como resuelta', 'success');
  filtrarNovedades();
}

function guardarConfiguracion() {
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

    if (!results.length) {
      searchDropdown.innerHTML = `<div style="padding:14px;text-align:center;color:var(--color-text-light);font-size:13px">Sin resultados</div>`;
    } else {
      searchDropdown.innerHTML = results.map(r => `
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
function exportarTabla() { showToast('Exportando datos...', 'success'); }

function exportarCSV(tipo) {
  let rows = [], headers = [];
  if (tipo === 'movilidades') {
    headers = ['Patente', 'Descripcion', 'Estado', 'Provincia', 'Objetivo', 'Chofer', 'Ubicacion'];
    rows = DATA.movilidades.map(m => [m.patente, m.descripcion, m.estado, m.provincia, m.objetivo, m.chofer, m.ubicacion]);
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
function estadoBadge(estado) {
  const map = { disponible: ['status-disponible', 'Disponible'], servicio: ['status-servicio', 'En servicio'], mantenimiento: ['status-mantenimiento', 'Mantenimiento'], fuera: ['status-fuera', 'Fuera de servicio'] };
  const [cls, label] = map[estado] || ['status-fuera', estado];
  return `<span class="status-badge ${cls}">${label}</span>`;
}

function provinciaLabel(p) {
  return { mendoza: 'Mendoza', 'san-juan': 'San Juan', 'santa-cruz': 'Santa Cruz' }[p] || p;
}

function formatFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function renderPageWithFilter(page, filter) {
  renderPage(page, filter);
}
