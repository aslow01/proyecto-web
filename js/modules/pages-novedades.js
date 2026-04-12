/**
 * MÓDULO: PÁGINA DE NOVEDADES
 * 
 * Contiene toda la lógica de renderizado y manejo de la sección de novedades.
 * Incluye: listado, filtros, modal de nueva novedad, edición, eliminación.
 */

// ===========================
// RENDERIZADO PRINCIPAL
// ===========================

function renderNovedades(filter) {
  let data = [...(DATA.novedades || [])];
  const canCreate = can('createNews');
  const canEdit = can('editNews');

  // Filtrar por estado si es necesario
  if (filter === 'urgentes') {
    data = data.filter(n => n.estado === 'urgente');
  }
  if (filter === 'normales') {
    data = data.filter(n => n.estado !== 'urgente');
  }

  // Ordenar por fecha descendente
  data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const urgentCount = data.filter(n => n.estado === 'urgente').length;

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-bell" style="color:var(--color-primary);margin-right:8px;"></i>Novedades</h2>
        <p>Comunicaciones y novedades operacionales</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" data-action="openNewNovedadModal"><i class="fa-solid fa-plus"></i> Nueva novedad</button>` : ''}
      </div>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Tipo</label>
        <select id="filtNovedadTipo" data-change-action="filtrarNovedades">
          <option value="">Todas</option>
          <option value="urgentes">Urgentes (${urgentCount})</option>
          <option value="normales">Normales</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Unidad</label>
        <select id="filtNovedadUnidad" data-change-action="filtrarNovedades">
          <option value="">Todas</option>
          ${[...new Set((DATA.novedades || []).map(n => n.unidad))].map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="limpiarFiltrosNovedades">
        <i class="fa-solid fa-rotate-left"></i> Limpiar
      </button>
    </div>

    <div class="list-container">
      <div style="display:flex;flex-direction:column;gap:12px">
        ${data.length ? data.map(n => `
          <div class="novedad-card ${n.estado === 'urgente' ? 'urgente' : ''}">
            <div class="novedad-header">
              <div class="novedad-title">
                <h3>${escapeHtml(n.titulo || '')}</h3>
                <span class="badge ${n.estado === 'urgente' ? 'danger' : 'secondary'}">${escapeHtml(n.estado || 'normal')}</span>
              </div>
              <div class="novedad-actions">
                ${canEdit ? `<button class="btn-icon" data-action="editarNovedad" data-id="${n.id}"><i class="fa-solid fa-pen"></i></button>` : ''}
                <button class="btn-icon" data-action="verDetalleNovedad" data-id="${n.id}"><i class="fa-solid fa-eye"></i></button>
              </div>
            </div>
            <div class="novedad-body">
              <p class="novedad-description">${escapeHtml(n.descripcion || '').substring(0, 150)}${(n.descripcion || '').length > 150 ? '...' : ''}</p>
              <div class="novedad-meta">
                <span class="meta-item"><i class="fa-solid fa-car"></i> ${escapeHtml(n.unidad || 'General')}</span>
                <span class="meta-item"><i class="fa-solid fa-calendar"></i> ${escapeHtml(n.fecha || '')}</span>
                <span class="meta-item"><i class="fa-solid fa-user"></i> ${escapeHtml(n.autor || '')}</span>
              </div>
            </div>
          </div>
        `).join('') : `<div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>Sin novedades</h3><p>No hay novedades que mostrar</p></div>`}
      </div>
    </div>
  `;
}

// ===========================
// MODALES Y FORMULARIOS
// ===========================

function openNewNovedadModal() {
  if (!requirePermission('createNews')) return;
  const hoy = new Date().toISOString().slice(0, 10);

  openModal('Nueva novedad', `
    <div class="form-grid">
      <div class="form-group full">
        <label>Título</label>
        <input type="text" id="nTitulo" placeholder="Ej: Mantenimiento urgente" maxlength="100">
      </div>
      <div class="form-group"><label>Fecha</label><input type="date" id="nFecha" value="${hoy}"></div>
      <div class="form-group"><label>Unidad</label>
        <select id="nUnidad">
          <option value="">General (aplica a todas)</option>
          ${(DATA.movilidades || []).map(m => `<option value="${escapeHtml(m.patente)}">${escapeHtml(m.patente)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Tipo</label>
        <select id="nEstado">
          <option value="normal">Normal</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <div class="form-group full">
        <label>Descripción</label>
        <textarea id="nDescripcion" placeholder="Describe la novedad..." rows="5" maxlength="1000"></textarea>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-primary" data-action="guardarNovedad"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

async function guardarNovedad() {
  if (!requirePermission('createNews')) return;

  const titulo = document.getElementById('nTitulo')?.value.trim();
  const fecha = document.getElementById('nFecha')?.value;

  if (!titulo || !fecha) {
    showToast('Completá título y fecha.', 'warning');
    return;
  }

  try {
    const response = await apiRequest('/api/novedades', {
      method: 'POST',
      body: JSON.stringify({
        titulo,
        fecha,
        descripcion: document.getElementById('nDescripcion')?.value.trim() || '',
        unidad: document.getElementById('nUnidad')?.value || '',
        estado: document.getElementById('nEstado')?.value || 'normal',
        autor: currentUser?.nombre || 'Sistema',
      }),
    });

    DATA.novedades = response.novedades || [];
    updateAlertBadges();
    closeModal();
    showToast('Novedad agregada correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo guardar la novedad.', 'error');
  }
}

function editarNovedad(id) {
  if (!requirePermission('editNews')) return;
  const novedad = (DATA.novedades || []).find(n => n.id === id);
  if (!novedad) {
    showToast('Novedad no encontrada.', 'error');
    return;
  }

  openModal(`Editar: ${escapeHtml(novedad.titulo)}`, `
    <div class="form-grid">
      <div class="form-group full">
        <label>Título</label>
        <input type="text" id="nTitulo" value="${escapeHtml(novedad.titulo)}" maxlength="100">
      </div>
      <div class="form-group"><label>Fecha</label><input type="date" id="nFecha" value="${escapeHtml(novedad.fecha)}"></div>
      <div class="form-group"><label>Unidad</label>
        <select id="nUnidad">
          <option value="">General</option>
          ${(DATA.movilidades || []).map(m => `<option value="${escapeHtml(m.patente)}" ${m.patente === novedad.unidad ? 'selected' : ''}>${escapeHtml(m.patente)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Tipo</label>
        <select id="nEstado">
          <option value="normal" ${novedad.estado === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="urgente" ${novedad.estado === 'urgente' ? 'selected' : ''}>Urgente</option>
        </select>
      </div>
      <div class="form-group full">
        <label>Descripción</label>
        <textarea id="nDescripcion" rows="5" maxlength="1000">${escapeHtml(novedad.descripcion)}</textarea>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="eliminarNovedad" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
    <button class="btn btn-primary" data-action="guardarNovedadEditada" data-id="${id}"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
  `);
}

async function guardarNovedadEditada(id) {
  if (!requirePermission('editNews')) return;

  const titulo = document.getElementById('nTitulo')?.value.trim();
  const fecha = document.getElementById('nFecha')?.value;

  if (!titulo || !fecha) {
    showToast('Completá título y fecha.', 'warning');
    return;
  }

  try {
    const response = await apiRequest(`/api/novedades/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        titulo,
        fecha,
        descripcion: document.getElementById('nDescripcion')?.value.trim() || '',
        unidad: document.getElementById('nUnidad')?.value || '',
        estado: document.getElementById('nEstado')?.value || 'normal',
      }),
    });

    DATA.novedades = response.novedades || [];
    updateAlertBadges();
    closeModal();
    showToast('Novedad actualizada correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar la novedad.', 'error');
  }
}

function eliminarNovedad(id) {
  if (!requirePermission('deleteNews')) return;
  const novedad = (DATA.novedades || []).find(n => n.id === id);
  if (!novedad) {
    showToast('Novedad no encontrada.', 'error');
    return;
  }

  openModal('Confirmar eliminación', `
    <p>¿Estás seguro de que querés eliminar la novedad <strong>${escapeHtml(novedad.titulo)}</strong>?</p>
    <p style="color:var(--color-text-light);font-size:12px">Esta acción no se puede deshacer.</p>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="confirmarEliminarNovedad" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
  `);
}

async function confirmarEliminarNovedad(id) {
  if (!requirePermission('deleteNews')) return;

  try {
    const response = await apiRequest(`/api/novedades/${id}`, {
      method: 'DELETE',
    });

    DATA.novedades = response.novedades || [];
    updateAlertBadges();
    closeModal();
    showToast('Novedad eliminada correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la novedad.', 'error');
  }
}

function verDetalleNovedad(id) {
  const novedad = (DATA.novedades || []).find(n => n.id === id);
  if (!novedad) return;

  openModal(`${escapeHtml(novedad.titulo)}`, `
    <div style="line-height:1.8">
      <div style="margin-bottom:12px">
        <span class="badge ${novedad.estado === 'urgente' ? 'danger' : 'secondary'}">${escapeHtml(novedad.estado)}</span>
      </div>
      <p><strong>Fecha:</strong> ${escapeHtml(novedad.fecha)}</p>
      <p><strong>Unidad:</strong> ${escapeHtml(novedad.unidad || 'General (aplica a todas)')}</p>
      <p><strong>Autor:</strong> ${escapeHtml(novedad.autor || '')}</p>
      <hr>
      <p style="white-space:pre-wrap">${escapeHtml(novedad.descripcion)}</p>
    </div>
  `, `<button class="btn btn-secondary" data-action="closeModal">Cerrar</button>`);
}

function limpiarFiltrosNovedades() {
  document.getElementById('filtNovedadTipo').value = '';
  document.getElementById('filtNovedadUnidad').value = '';
  renderPageWithFilter(currentPage, null);
}

function filtrarNovedades() {
  // Placeholder - lógica de filtrado
  renderPageWithFilter(currentPage, currentFilter);
}

console.log('✅ Módulo pages-novedades.js cargado.');
