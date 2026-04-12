/**
 * MÓDULO: PÁGINA DE PARTES DIARIOS
 * 
 * Contiene toda la lógica de renderizado y manejo de la sección de partes diarios.
 * Incluye: listado, filtros, modal de nuevo parte, edición, eliminación.
 */

// ===========================
// RENDERIZADO PRINCIPAL
// ===========================

function renderPartes(filter) {
  let data = [...(DATA.partes || [])];
  const canCreate = can('createPart');
  const canEdit = can('editPart');

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-list" style="color:var(--color-primary);margin-right:8px;"></i>Partes Diarios</h2>
        <p>Registro de partes y mantenimiento de unidades</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" data-action="openNewParteModal"><i class="fa-solid fa-plus"></i> Nuevo parte</button>` : ''}
      </div>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Unidad</label>
        <select id="filtParteUnidad" data-change-action="filtrarPartes">
          <option value="">Todas</option>
          ${(DATA.movilidades || []).map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.patente)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Estado</label>
        <select id="filtParteEstado" data-change-action="filtrarPartes">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="completado">Completado</option>
          <option value="revisado">Revisado</option>
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="limpiarFiltrosPartes">
        <i class="fa-solid fa-rotate-left"></i> Limpiar
      </button>
    </div>

    <div class="list-container">
      <table style="width:100%">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Unidad</th>
            <th>Chofer</th>
            <th>Estado</th>
            <th>KM</th>
            <th>Novedad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.length ? data.map(p => `
            <tr>
              <td>${escapeHtml(p.fecha || '')}</td>
              <td><strong>${escapeHtml(p.movilidad || '')}</strong></td>
              <td>${escapeHtml(p.chofer || '')}</td>
              <td><span class="badge">${escapeHtml(p.estado || 'pendiente')}</span></td>
              <td>${escapeHtml(p.km || '')}</td>
              <td style="color:var(--color-text-light);font-size:12px;max-width:200px">${escapeHtml(p.novedad || '')}</td>
              <td>
                <div style="display:flex;gap:4px">
                  ${canEdit ? `<button class="btn-icon" data-action="editarParte" data-id="${p.id}"><i class="fa-solid fa-pen"></i></button>` : ''}
                  <button class="btn-icon" data-action="verDetalleParte" data-id="${p.id}"><i class="fa-solid fa-eye"></i></button>
                </div>
              </td>
            </tr>
          `).join('') : `<tr><td colspan="7" style="text-align:center;padding:20px"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No hay partes diarios</p></div></td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

// ===========================
// MODALES Y FORMULARIOS
// ===========================

function openNewParteModal() {
  if (!requirePermission('createPart')) return;
  const hoy = new Date().toISOString().slice(0, 10);

  openModal('Nuevo parte diario', `
    <div class="form-grid">
      <div class="form-group"><label>Fecha</label><input type="date" id="pFecha" value="${hoy}"></div>
      <div class="form-group"><label>Unidad</label>
        <select id="pUnidad">
          <option value="">Seleccionar</option>
          ${(DATA.movilidades || []).map(m => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.patente)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Chofer</label><input type="text" id="pChofer" placeholder="Nombre del chofer"></div>
      <div class="form-group"><label>KM</label><input type="text" id="pKm" placeholder="1000" maxlength="7"></div>
      <div class="form-group full"><label>Novedad</label><textarea id="pNovedad" placeholder="Describe la novedad..." rows="4"></textarea></div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-primary" data-action="guardarParte"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

async function guardarParte() {
  if (!requirePermission('createPart')) return;

  const fecha = document.getElementById('pFecha')?.value;
  const unidad = document.getElementById('pUnidad')?.value;
  const chofer = document.getElementById('pChofer')?.value.trim();
  const km = document.getElementById('pKm')?.value.trim();

  if (!fecha || !unidad) {
    showToast('Completá fecha y unidad.', 'warning');
    return;
  }

  try {
    const response = await apiRequest('/api/partes', {
      method: 'POST',
      body: JSON.stringify({
        fecha,
        unidad,
        chofer,
        km,
        novedad: document.getElementById('pNovedad')?.value.trim() || '',
        estado: 'pendiente',
      }),
    });

    DATA.partes = response.partes || [];
    closeModal();
    showToast('Parte agregado correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo guardar el parte.', 'error');
  }
}

function editarParte(id) {
  if (!requirePermission('editPart')) return;
  const parte = (DATA.partes || []).find(p => p.id === id);
  if (!parte) {
    showToast('Parte no encontrado.', 'error');
    return;
  }

  openModal(`Editar parte de ${escapeHtml(parte.fecha)}`, `
    <div class="form-grid">
      <div class="form-group"><label>Fecha</label><input type="date" id="pFecha" value="${escapeHtml(parte.fecha)}"></div>
      <div class="form-group"><label>Chofer</label><input type="text" id="pChofer" value="${escapeHtml(parte.chofer)}"></div>
      <div class="form-group"><label>KM</label><input type="text" id="pKm" value="${escapeHtml(parte.km)}" maxlength="7"></div>
      <div class="form-group"><label>Estado</label>
        <select id="pEstado">
          <option value="pendiente" ${parte.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="completado" ${parte.estado === 'completado' ? 'selected' : ''}>Completado</option>
          <option value="revisado" ${parte.estado === 'revisado' ? 'selected' : ''}>Revisado</option>
        </select>
      </div>
      <div class="form-group full"><label>Novedad</label><textarea id="pNovedad" rows="4">${escapeHtml(parte.novedad || '')}</textarea></div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="eliminarParte" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
    <button class="btn btn-primary" data-action="guardarParteEditado" data-id="${id}"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
  `);
}

async function guardarParteEditado(id) {
  if (!requirePermission('editPart')) return;

  const fecha = document.getElementById('pFecha')?.value;
  if (!fecha) {
    showToast('Completá la fecha.', 'warning');
    return;
  }

  try {
    const response = await apiRequest(`/api/partes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fecha,
        chofer: document.getElementById('pChofer')?.value.trim() || '',
        km: document.getElementById('pKm')?.value.trim() || '',
        estado: document.getElementById('pEstado')?.value || 'pendiente',
        novedad: document.getElementById('pNovedad')?.value.trim() || '',
      }),
    });

    DATA.partes = response.partes || [];
    closeModal();
    showToast('Parte actualizado correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar el parte.', 'error');
  }
}

function eliminarParte(id) {
  if (!requirePermission('deletePart')) return;
  const parte = (DATA.partes || []).find(p => p.id === id);
  if (!parte) {
    showToast('Parte no encontrado.', 'error');
    return;
  }

  openModal('Confirmar eliminación', `
    <p>¿Estás seguro de que querés eliminar el parte de ${escapeHtml(parte.fecha)}?</p>
    <p style="color:var(--color-text-light);font-size:12px">Esta acción no se puede deshacer.</p>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="confirmarEliminarParte" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
  `);
}

async function confirmarEliminarParte(id) {
  if (!requirePermission('deletePart')) return;

  try {
    const response = await apiRequest(`/api/partes/${id}`, {
      method: 'DELETE',
    });

    DATA.partes = response.partes || [];
    closeModal();
    showToast('Parte eliminado correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar el parte.', 'error');
  }
}

function verDetalleParte(id) {
  const parte = (DATA.partes || []).find(p => p.id === id);
  if (!parte) return;
  
  openModal(`Detalle del parte de ${escapeHtml(parte.fecha)}`, `
    <div style="line-height:1.8">
      <p><strong>Unidad:</strong> ${escapeHtml(parte.movilidad || '')}</p>
      <p><strong>Chofer:</strong> ${escapeHtml(parte.chofer || '')}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(parte.fecha || '')}</p>
      <p><strong>KM:</strong> ${escapeHtml(parte.km || '')}</p>
      <p><strong>Estado:</strong> <span class="badge">${escapeHtml(parte.estado || 'pendiente')}</span></p>
      <hr>
      <p><strong>Novedad:</strong></p>
      <p style="color:var(--color-text-light);white-space:pre-wrap">${escapeHtml(parte.novedad || '')}</p>
    </div>
  `, `<button class="btn btn-secondary" data-action="closeModal">Cerrar</button>`);
}

function limpiarFiltrosPartes() {
  document.getElementById('filtParteUnidad').value = '';
  document.getElementById('filtParteEstado').value = '';
  renderPageWithFilter(currentPage, null);
}

function filtrarPartes() {
  // Placeholder - lógica de filtrado
  renderPageWithFilter(currentPage, currentFilter);
}

console.log('✅ Módulo pages-partes.js cargado.');
