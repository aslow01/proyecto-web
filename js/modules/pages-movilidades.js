/**
 * MÓDULO: PÁGINA DE MOVILIDADES
 * 
 * Contiene toda la lógica de renderizado y manejo de la sección de movilidades.
 * Incluye: listado, filtros, modal de nueva movilidad, edición, eliminación.
 */

// ===========================
// RENDERIZADO PRINCIPAL
// ===========================

function renderMovilidades(filter) {
  let data = [...(DATA.movilidades || [])];
  const canCreate = can('createVehicle');
  const canEdit = can('editVehicle');
  const canExportData = can('exportData');
  const provincias = VEHICLE_PROVINCES || [];
  const estados = ['disponibles', 'en-servicio', 'mantenimiento'];

  // Filtros
  if (filter && provincias.includes(filter)) data = data.filter(m => m.provincia === filter);
  if (filter === 'disponibles') data = data.filter(m => m.estado === 'disponible');
  if (filter === 'en-servicio') data = data.filter(m => m.estado === 'servicio');
  if (filter === 'mantenimiento') data = data.filter(m => m.estado === 'mantenimiento');
  
  const criticalDocumentCount = data.filter(movilidad => hasCriticalVehicleDocumentAlert(movilidad)).length;
  const warningDocumentCount = data.filter(movilidad => hasWarningVehicleDocumentAlert(movilidad)).length;

  const filterTitle = {
    mendoza: 'Mendoza', 'san-juan': 'San Juan', 'santa-cruz': 'Santa Cruz', jujuy: 'Jujuy', 
    salta: 'Salta', cordoba: 'Córdoba', 'san-luis': 'San Luis', 'la-rioja': 'La Rioja', 
    catamarca: 'Catamarca',
    disponibles: 'Disponibles', 'en-servicio': 'En servicio', mantenimiento: 'En mantenimiento', 
    todas: 'Todas'
  };

  pageContent.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2><i class="fa-solid fa-car" style="color:var(--color-primary);margin-right:8px;"></i>Movilidades ${filter ? '– ' + (filterTitle[filter] || '') : ''}</h2>
        <p>Listado general de unidades operativas</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn btn-primary" data-action="openVehicleTypeSelector"><i class="fa-solid fa-plus"></i> Nueva unidad</button>` : ''}
        ${canExportData ? `<button class="btn btn-secondary" data-action="exportarTabla"><i class="fa-solid fa-file-export"></i> Exportar</button>` : ''}
      </div>
    </div>

    <div class="filters-bar" id="filtrosMovilidades">
      <div class="filter-group">
        <label>Provincia</label>
        <select id="filtProvincia" data-change-action="filtrarMovilidades">
          <option value="">Todas</option>
          ${renderVehicleProvinceOptions(filter)}
        </select>
      </div>
      <div class="filter-group">
        <label>Objetivo</label>
        <select id="filtObjetivo" data-change-action="filtrarMovilidades">
          <option value="">Todos</option>
          ${(DATA.objetivos || []).map(o => `<option value="${escapeHtml(o.nombre.toLowerCase())}">${escapeHtml(o.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Estado</label>
        <select id="filtEstado" data-change-action="filtrarMovilidades">
          <option value="">Todos</option>
          <option value="disponible">Disponible</option>
          <option value="servicio">En servicio</option>
          <option value="mantenimiento">En mantenimiento</option>
          <option value="fuera">Fuera de servicio</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Tipo</label>
        <select id="filtTipoPropiedad" data-change-action="filtrarMovilidades">
          <option value="">Todas</option>
          <option value="propia">Propia</option>
          <option value="alquilada">Alquilada</option>
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="limpiarFiltrosMovilidades">
        <i class="fa-solid fa-rotate-left"></i> Limpiar
      </button>
    </div>

    <div class="table-wrapper" id="tablaMovilidadesWrapper">
      <div class="table-toolbar">
        <h3 id="countMovilidades">${data.length} unidad${data.length !== 1 ? 'es' : ''}</h3>
        ${(criticalDocumentCount || warningDocumentCount) ? `
          <div class="rto-toolbar-alert ${criticalDocumentCount ? 'danger' : 'warning'}">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            ${buildDocumentToolbarMessage(criticalDocumentCount, warningDocumentCount)}
          </div>` : ''}
        <input type="text" id="buscarMovilidad" placeholder="Buscar patente, chofer..." 
          style="padding:8px 12px;border:1px solid var(--color-border);border-radius:6px;font-size:13px;outline:none;width:220px;"
          data-input-action="filtrarMovilidades">
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
  if (!data.length) {
    return `<div class="empty-state"><i class="fa-solid fa-car-burst"></i><h3>Sin resultados</h3><p>No hay unidades que coincidan con los filtros</p></div>`;
  }
  
  return `<div style="overflow-x:auto"><table>
    <thead><tr>
      <th>Patente</th><th>Descripción</th><th>Clase</th><th>Estado</th>
      <th>Archivos</th><th>Provincia</th><th>Objetivo</th><th>Chofer</th>
      <th>Ubicación</th><th>Próx. service</th><th>Documentación</th><th>Última novedad</th><th>Acciones</th>
    </tr></thead>
    <tbody>
      ${data.map(m => {
        const lockInfo = getRealtimeMobilityLockInfo(m.id);
        const editors = lockInfo.editors || [];
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
          <td><strong>${escapeHtml(m.patente)}</strong>${editingBadge}</td>
          <td>${escapeHtml(getVehicleDisplayName(m))}</td>
          <td>${renderVehicleUnitTypeBadge(m.tipoUnidad)}</td>
          <td>${estadoBadge(m.estado)}</td>
          <td>${renderVehicleFileIndicator(m)}</td>
          <td><i class="fa-solid fa-map-pin" style="color:var(--color-primary);margin-right:4px;"></i>${escapeHtml(provinciaLabel(m.provincia))}</td>
          <td>${escapeHtml(m.objetivo || '')}</td>
          <td>${escapeHtml(m.chofer || '')}</td>
          <td style="color:var(--color-text-light);font-size:12px">${escapeHtml(m.ubicacion || '')}</td>
          <td>${renderVehicleServiceStatus(m)}</td>
          <td>${renderVehicleDocumentStatusStack(m)}</td>
          <td style="color:var(--color-text-light);font-size:12px;max-width:180px">${escapeHtml(m.ultimaNovedad || '')}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn-icon" title="Ver historial" data-action="verHistorialMovilidad" data-id="${m.id}">
                <i class="fa-solid fa-eye"></i>
              </button>
              ${canEdit ? `<button class="btn-icon ${lockInfo.locked ? 'is-locked' : ''}" title="${escapeHtml(lockInfo.locked ? 'En edición por ' + lockInfo.namesText + '. Abrís la ficha en modo bloqueado.' : 'Editar')}" data-action="editarMovilidad" data-id="${m.id}">
                <i class="fa-solid ${lockInfo.locked ? 'fa-lock' : 'fa-pen'}"></i>
              </button>` : ''}
              ${canDelete ? `<button class="btn-icon" title="Eliminar" style="color:var(--color-danger)" data-action="eliminarMovilidad" data-id="${m.id}">
                <i class="fa-solid fa-trash"></i>
              </button>` : ''}
            </div>
          </td>
        </tr>`;
      }).join('')}
    </tbody></table></div>`;
}

// ===========================
// MODALES Y FORMULARIOS
// ===========================

function openNewMobilidadModal() {
  if (!requirePermission('createVehicle')) return;
  openVehicleTypeSelector();
}

function openVehicleTypeSelector() {
  openModal('Seleccionar tipo de unidad', `
    <div class="vehicle-type-grid">
      ${Object.entries(VEHICLE_UNIT_TYPES).map(([key, config]) => `
        <div class="vehicle-type-card" data-action="createMobilidadOfType" data-type="${escapeHtml(key)}">
          <i class="fa-solid ${config.icon}" style="font-size:32px;margin-bottom:12px;color:var(--color-primary)"></i>
          <h3>${escapeHtml(config.label)}</h3>
          <p>${escapeHtml(config.description || '')}</p>
        </div>
      `).join('')}
    </div>
  `, `<button class="btn btn-secondary" data-action="closeModal">Cancelar</button>`);
}

function createMobilidadOfType(type) {
  const tipoUnidad = normalizeVehicleUnitType(type);
  openNewMobilidadForm(tipoUnidad);
}

function openNewMobilidadForm(tipoUnidad = 'camioneta') {
  openModal('Nueva unidad', `
    <div class="form-grid">
      <div class="form-group full"><label>Tipo de unidad</label><select id="mTipoUnidad">${renderVehicleUnitTypeOptions(tipoUnidad)}</select></div>
      <div class="form-group"><label>Patente</label><input type="text" id="mPatente" placeholder="ABC123"></div>
      <div class="form-group"><label>Marca</label><select id="mMarca">${renderVehicleBrandOptions()}</select></div>
      <div class="form-group full"><label>Descripción/Modelo</label><input type="text" id="mDesc" placeholder="Ej: Ford Ranger 4x4"></div>
      <div class="form-group"><label>Año</label><input type="text" id="mAnio" placeholder="2020" maxlength="4"></div>
      <div class="form-group"><label>N° Motor</label><input type="text" id="mNumeroMotor" placeholder="ABC..."></div>
      <div class="form-group"><label>N° Chasis</label><input type="text" id="mNumeroChasis" placeholder="ABC..."></div>
      <div class="form-group"><label>Tipo propiedad</label><select id="mTipoPropiedad">${renderVehicleOwnershipOptions()}</select></div>
      <div class="form-group"><label>Estado</label><select id="mEstado"><option value="disponible">Disponible</option><option value="servicio">En servicio</option><option value="mantenimiento">En mantenimiento</option></select></div>
      <div class="form-group"><label>Provincia</label><select id="mProvincia">${renderVehicleProvinceOptions()}</select></div>
      <div class="form-group"><label>Objetivo</label><select id="mObjetivo"><option value="">Seleccionar</option>${(DATA.objetivos || []).map(o => `<option value="${escapeHtml(o.nombre)}">${escapeHtml(o.nombre)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Ubicación</label><input type="text" id="mUbicacion" placeholder="Ej: Depósito central"></div>
      <div class="form-group"><label>Chofer</label><input type="text" id="mChofer" placeholder="Nombre del chofer"></div>
      <div class="form-group"><label>KM Actual</label><input type="text" id="mKmActual" placeholder="0" maxlength="7"></div>
      <div class="form-group"><label>KM Próximo Service</label><input type="text" id="mKmProximoService" placeholder="50000" maxlength="7"></div>
      <div class="form-group"><label>RTO Vencimiento</label><input type="date" id="mRtoVencimiento"></div>
      <div class="form-group"><label>Seguro Vencimiento</label><input type="date" id="mSeguroVencimiento"></div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-primary" data-action="guardarMovilidad"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
  `);
}

async function guardarMovilidad() {
  if (!requirePermission('createVehicle')) return;
  
  const patente = document.getElementById('mPatente')?.value.trim();
  const marca = document.getElementById('mMarca')?.value.trim();
  const desc = document.getElementById('mDesc')?.value.trim();
  
  if (!patente || !marca || !desc) {
    showToast('Completá patente, marca y modelo.', 'warning');
    return;
  }
  
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

  try {
    const response = await apiRequest('/api/movilidades', {
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
      }),
    });

    DATA.movilidades = response.movilidades || [];
    updateAlertBadges();
    closeModal();
    showToast('Unidad agregada correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo guardar la unidad.', 'error');
  }
}

function editarMovilidad(id) {
  if (!requirePermission('editVehicle')) return;
  const movilidad = (DATA.movilidades || []).find(m => m.id === id);
  if (!movilidad) {
    showToast('Unidad no encontrada.', 'error');
    return;
  }
  
  setRealtimeEditContext('edit', 'movilidad', id, movilidad.patente);
  
  openModal(`Editar unidad ${escapeHtml(movilidad.patente)}`, `
    <div class="form-grid">
      <div class="form-group full"><label>Tipo de unidad</label><select id="mTipoUnidad">${renderVehicleUnitTypeOptions(movilidad.tipoUnidad)}</select></div>
      <div class="form-group"><label>Patente</label><input type="text" id="mPatente" value="${escapeHtml(movilidad.patente)}"></div>
      <div class="form-group"><label>Marca</label><select id="mMarca">${renderVehicleBrandOptions(movilidad.marca)}</select></div>
      <div class="form-group full"><label>Descripción/Modelo</label><input type="text" id="mDesc" value="${escapeHtml(movilidad.descripcion)}"></div>
      <div class="form-group"><label>Año</label><input type="text" id="mAnio" value="${escapeHtml(movilidad.anio)}" maxlength="4"></div>
      <div class="form-group"><label>N° Motor</label><input type="text" id="mNumeroMotor" value="${escapeHtml(movilidad.numeroMotor)}"></div>
      <div class="form-group"><label>N° Chasis</label><input type="text" id="mNumeroChasis" value="${escapeHtml(movilidad.numeroChasis)}"></div>
      <div class="form-group"><label>Tipo propiedad</label><select id="mTipoPropiedad">${renderVehicleOwnershipOptions(movilidad.tipoPropiedad)}</select></div>
      <div class="form-group"><label>Estado</label><select id="mEstado"><option value="disponible" ${movilidad.estado === 'disponible' ? 'selected' : ''}>Disponible</option><option value="servicio" ${movilidad.estado === 'servicio' ? 'selected' : ''}>En servicio</option><option value="mantenimiento" ${movilidad.estado === 'mantenimiento' ? 'selected' : ''}>En mantenimiento</option></select></div>
      <div class="form-group"><label>Provincia</label><select id="mProvincia">${renderVehicleProvinceOptions(movilidad.provincia)}</select></div>
      <div class="form-group"><label>Objetivo</label><select id="mObjetivo"><option value="">Seleccionar</option>${(DATA.objetivos || []).map(o => `<option value="${escapeHtml(o.nombre)}" ${o.nombre === movilidad.objetivo ? 'selected' : ''}>${escapeHtml(o.nombre)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Ubicación</label><input type="text" id="mUbicacion" value="${escapeHtml(movilidad.ubicacion)}"></div>
      <div class="form-group"><label>Chofer</label><input type="text" id="mChofer" value="${escapeHtml(movilidad.chofer)}"></div>
      <div class="form-group"><label>KM Actual</label><input type="text" id="mKmActual" value="${escapeHtml(movilidad.kmActual)}" maxlength="7"></div>
      <div class="form-group"><label>KM Próximo Service</label><input type="text" id="mKmProximoService" value="${escapeHtml(movilidad.kmProximoService)}" maxlength="7"></div>
      <div class="form-group"><label>RTO Vencimiento</label><input type="date" id="mRtoVencimiento" value="${escapeHtml(movilidad.rtoVencimiento)}"></div>
      <div class="form-group"><label>Seguro Vencimiento</label><input type="date" id="mSeguroVencimiento" value="${escapeHtml(movilidad.seguroVencimiento)}"></div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="eliminarMovilidad" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
    <button class="btn btn-primary" data-action="guardarMovilidadEditada" data-id="${id}"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
  `);

  modalOverlay.dataset.mobilityEditId = id;
}

async function guardarMovilidadEditada(id) {
  if (!requirePermission('editVehicle')) return;
  
  const patente = document.getElementById('mPatente')?.value.trim();
  const marca = document.getElementById('mMarca')?.value.trim();
  const desc = document.getElementById('mDesc')?.value.trim();
  
  if (!patente || !marca || !desc) {
    showToast('Completá patente, marca y modelo.', 'warning');
    return;
  }

  try {
    const response = await apiRequest(`/api/movilidades/${id}`, {
      method: 'PUT',
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
        chofer: document.getElementById('mChofer')?.value || '',
        rtoVencimiento: document.getElementById('mRtoVencimiento')?.value || '',
        seguroVencimiento: document.getElementById('mSeguroVencimiento')?.value || '',
      }),
    });

    DATA.movilidades = response.movilidades || [];
    updateAlertBadges();
    closeModal();
    showToast('Unidad actualizada correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar la unidad.', 'error');
  }
}

function eliminarMovilidad(id) {
  if (!requirePermission('deleteVehicle')) return;
  const movilidad = (DATA.movilidades || []).find(m => m.id === id);
  if (!movilidad) {
    showToast('Unidad no encontrada.', 'error');
    return;
  }

  openModal('Confirmar eliminación', `
    <p>¿Estás seguro de que querés eliminar la unidad <strong>${escapeHtml(movilidad.patente)}</strong>?</p>
    <p style="color:var(--color-text-light);font-size:12px">Esta acción no se puede deshacer.</p>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cancelar</button>
    <button class="btn btn-danger" data-action="confirmarEliminarMovilidad" data-id="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
  `);
}

async function confirmarEliminarMovilidad(id) {
  if (!requirePermission('deleteVehicle')) return;

  try {
    const response = await apiRequest(`/api/movilidades/${id}`, {
      method: 'DELETE',
    });

    DATA.movilidades = response.movilidades || [];
    updateAlertBadges();
    closeModal();
    showToast('Unidad eliminada correctamente', 'success');
    renderPageWithFilter(currentPage, currentFilter);
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la unidad.', 'error');
  }
}

// ===========================
// FUNCIONES AUXILIARES
// ===========================

function requirePermission(action, deniedMessage) {
  if (can(action)) return true;
  showToast(deniedMessage || 'Tu rol no tiene permiso para realizar esta acción.', 'warning');
  return false;
}

function getRealtimeMobilityLockInfo(mobilityId) {
  const editors = getRealtimeEditorsForEntity('movilidad', mobilityId);
  const locked = editors.length > 0;
  const namesText = editors.map(u => u.nombre).join(', ');
  return { editors, locked, namesText };
}

function hasCriticalVehicleDocumentAlert(movilidad) {
  // Placeholder - implementar en próximo módulo
  return false;
}

function hasWarningVehicleDocumentAlert(movilidad) {
  // Placeholder - implementar en próximo módulo
  return false;
}

function buildDocumentToolbarMessage(critical, warning) {
  const messages = [];
  if (critical) messages.push(`${critical} unidad${critical !== 1 ? 'es' : ''} con documentación vencida`);
  if (warning) messages.push(`${warning} unidad${warning !== 1 ? 'es' : ''} con documentación próxima a vencer`);
  return messages.join(' • ');
}

function renderVehicleDocumentStatusStack(movilidad) {
  return '<span class="doc-status">--</span>';
}

function verHistorialMovilidad(id) {
  showToast('Historial de movilidad (próximamente)', 'info');
}

function limpiarFiltrosMovilidades() {
  document.getElementById('filtProvincia').value = '';
  document.getElementById('filtObjetivo').value = '';
  document.getElementById('filtEstado').value = '';
  document.getElementById('filtTipoPropiedad').value = '';
  document.getElementById('buscarMovilidad').value = '';
  renderPageWithFilter(currentPage, null);
}

function filtrarMovilidades() {
  // Placeholder - lógica de filtrado
  renderPageWithFilter(currentPage, currentFilter);
}

function exportarTabla() {
  showToast('Exportación (próximamente)', 'info');
}

console.log('✅ Módulo pages-movilidades.js cargado.');
