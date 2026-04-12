/**
 * FUNCIONES DE API
 * Comunicación con el backend
 */

async function apiRequest(url, options = {}) {
  const { suppressAuthHandling = false, headers, ...fetchOptions } = options;
  let response;
  const method = String(fetchOptions.method || 'GET').toUpperCase();
  const shouldSendCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && url !== '/api/auth/login' && csrfToken;

  try {
    response = await fetch(`${API_ORIGIN}${url}`, {
      credentials: 'same-origin',
      headers: {
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(shouldSendCsrf ? { 'X-CSRF-Token': csrfToken } : {}),
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
    const data = await apiRequest('/api/users', { suppressAuthHandling: true });
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

// Permisos
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

function isAdmin() {
  return currentUser?.rol === 'administrador';
}

function requireAdminAccess() {
  if (isAdmin()) return true;
  showToast('Solo el administrador puede realizar esta acción.', 'warning');
  return false;
}

// Realtime
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
