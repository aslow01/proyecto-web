/**
 * MÓDULO: PÁGINA DE OBJETIVOS
 * 
 * Contiene toda la lógica de renderizado y manejo de la sección de objetivos.
 * Incluye: listado, filtros, modal de nuevo objetivo, edición, eliminación.
 */

// ===========================
// RENDERIZADO PRINCIPAL
// ===========================

function renderObjetivos(filter) {
  let data = [...(DATA.objetivos || [])];
  const canCreate = can('createObjective');
  const canEdit = can('editObjective');

  // Filtrar si es necesario
  if (filter && filter !== 'todos') {
    data = data.filter(o => buildObjectiveFilterKey(o.nombre) === filter);
  }

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-bullseye" style="color:var(--color-primary);margin-right:8px;"></i>Objetivos</h2>
        <p>Metas y objetivos operacionales</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" data-action="openNewObjetivoModal"><i class="fa-solid fa-plus"></i> Nuevo objetivo</button>` : ''}
      </div>
    </div>

    <div class="list-container">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
        ${data.length ? data.map(o => `
          <div class="objective-card" data-id="${escapeHtml(o.id)}">
            <div class="card-header">
              <h3>${escapeHtml(o.nombre)}</h3>
              <div class="card-actions">
                ${canEdit ? `<button class="btn-icon" data-action="editarObjetivo" data-id="${o.id}"><i class="fa-solid fa-pen"></i></button>` : ''}
              </div>
            </div>
            <div class="card-body">
              <p class="objective-description">${escapeHtml(o.descripcion || '')}</p>
              <div class="objective-meta">
                <span class="badge">${escapeHtml(o.estado || 'activo')}</span>
                <span class="meta-text">Unidades: ${(DATA.movilidades || []).filter(m => m.objetivo === o.nombre).length}</span>
              </div>
            </div>
          </div>
        `).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-target"></i><h3>Sin objetivos</h3><p>No hay objetivos definidos</p></div>`}
      </div>
    </div>

    <div id="objetivosSubmenu" style="display:none"></div>
  `;

  syncObjetivosSubmenu();
}

// ===========================
// MODALES Y FORMULARIOS
// ===========================

function openNewObjetivoModal() {
  if (!requirePermission('createObjective')) return;
  openModal('Nuevo objetivo', `
    <div class="form-grid">
      <div class="form-group full">
        <label>Nombre del objetivo</label>
        <input type="text" id="oNombre" placeholder="Ej: Traslados provinciales" maxlength="100">
      </div>
      <div class="form-group full">
        <label>Descripción</label>
        <textarea id="oDescripcion" placeholder="Describe el objetivo..." rows="4" maxlength="500"></textarea>
      </div>
      <div class="form-group">
        <label>Estado</label>
        <select id="oEstado">
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="completado">Completado</option>
        </select>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-primary" data-action="guardarObjetivo"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

async function guardarObjetivo() {
  if (!requirePermission('createObjective')) return;

  const nombre = document.getElementById('oNombre')?.value.trim();
  const descripcion = document.getElementById('oDescripcion')?.value.trim();

  if (!nombre) {
    showToast('Completá el nombre del objetivo.', 'warning');
    return;
  }

  try {
    const response = await apiRequest('/api/objetivos', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        descripcion,
        estado: document.getElementById('oEstado')?.value || 'activo',
      }),
    });

    DATA.objetivos = response.objetivos || [];
    closeModal();
    showToast('Objetivo agregado correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
    syncObjetivosSubmenu();
  } catch (error) {
    showToast(error.message || 'No se pudo guardar el objetivo.', 'error');
  }
}

function editarObjetivo(id) {
  if (!requirePermission('editObjective')) return;
  const objetivo = (DATA.objetivos || []).find(o => o.id === id);
  if (!objetivo) {
    showToast('Objetivo no encontrado.', 'error');
    return;
  }

  openModal(`Editar: ${escapeHtml(objetivo.nombre)}`, `
    <div class="form-grid">
      <div class="form-group full">
        <label>Nombre del objetivo</label>
        <input type="text" id="oNombre" value="${escapeHtml(objetivo.nombre)}" maxlength="100">
      </div>
      <div class="form-group full">
        <label>Descripción</label>
        <textarea id="oDescripcion" rows="4" maxlength="500">${escapeHtml(objetivo.descripcion || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Estado</label>
        <select id="oEstado">
          <option value="activo" ${objetivo.estado === 'activo' ? 'selected' : ''}>Activo</option>
          <option value="pausado" ${objetivo.estado === 'pausado' ? 'selected' : ''}>Pausado</option>
          <option value="completado" ${objetivo.estado === 'completado' ? 'selected' : ''}>Completado</option>
        </select>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="eliminarObjetivo" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
    <button class="btn btn-primary" data-action="guardarObjetivoEditado" data-id="${id}"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
  `);
}

async function guardarObjetivoEditado(id) {
  if (!requirePermission('editObjective')) return;

  const nombre = document.getElementById('oNombre')?.value.trim();
  const descripcion = document.getElementById('oDescripcion')?.value.trim();

  if (!nombre) {
    showToast('Completá el nombre del objetivo.', 'warning');
    return;
  }

  try {
    const response = await apiRequest(`/api/objetivos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre,
        descripcion,
        estado: document.getElementById('oEstado')?.value || 'activo',
      }),
    });

    DATA.objetivos = response.objetivos || [];
    closeModal();
    showToast('Objetivo actualizado correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
    syncObjetivosSubmenu();
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar el objetivo.', 'error');
  }
}

function eliminarObjetivo(id) {
  if (!requirePermission('deleteObjective')) return;
  const objetivo = (DATA.objetivos || []).find(o => o.id === id);
  if (!objetivo) {
    showToast('Objetivo no encontrado.', 'error');
    return;
  }

  openModal('Confirmar eliminación', `
    <p>¿Estás seguro de que querés eliminar el objetivo <strong>${escapeHtml(objetivo.nombre)}</strong>?</p>
    <p style="color:var(--color-text-light);font-size:12px">Esta acción no se puede deshacer.</p>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="confirmarEliminarObjetivo" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
  `);
}

async function confirmarEliminarObjetivo(id) {
  if (!requirePermission('deleteObjective')) return;

  try {
    const response = await apiRequest(`/api/objetivos/${id}`, {
      method: 'DELETE',
    });

    DATA.objetivos = response.objetivos || [];
    closeModal();
    showToast('Objetivo eliminado correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
    syncObjetivosSubmenu();
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar el objetivo.', 'error');
  }
}

console.log('✅ Módulo pages-objetivos.js cargado.');
