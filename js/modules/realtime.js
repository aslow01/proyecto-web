/**
 * MÓDULO: SINCRONIZACIÓN EN TIEMPO REAL
 *
 * Integra heartbeat, locks y alertas con la API existente.
 */

let realtimeHeartbeatInterval = null;
let realtimeLocksInterval = null;
let realtimeAlertsInterval = null;
let realtimeStatusInterval = null;
let realtimeObserver = null;
let realtimeSyncInitialized = false;
let realtimeLastDataSync = null;

function getRealtimeHeartbeatMs() {
  return typeof REALTIME_HEARTBEAT_MS === 'number' ? REALTIME_HEARTBEAT_MS : 5000;
}

function canRunRealtime() {
  return Boolean(currentUser);
}

async function heartbeatRealtime() {
  if (!canRunRealtime()) return;

  const trackedPages = Array.isArray(REALTIME_TRACKED_PAGES) ? REALTIME_TRACKED_PAGES : [];
  const page = trackedPages.includes(currentPage) ? currentPage : '';

  const data = await apiRequest('/api/realtime/heartbeat', {
    method: 'POST',
    suppressAuthHandling: true,
    body: JSON.stringify({
      page,
      filter: currentFilter || '',
      context: realtimeState?.editContext || { mode: '', entityType: '', entityId: null, entityLabel: '' },
    }),
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

  if (typeof syncRealtimeMobilityUI === 'function') {
    syncRealtimeMobilityUI();
  }
  if (typeof renderRealtimePageContext === 'function') {
    renderRealtimePageContext();
  }

  realtimeLastDataSync = new Date();
}

function startRealtimeHeartbeat() {
  stopRealtimeHeartbeat();
  if (!canRunRealtime()) return;

  heartbeatRealtime().catch(() => {});
  realtimeHeartbeatInterval = window.setInterval(() => {
    heartbeatRealtime().catch(() => {});
  }, getRealtimeHeartbeatMs());
}

function stopRealtimeHeartbeat() {
  if (realtimeHeartbeatInterval) {
    window.clearInterval(realtimeHeartbeatInterval);
    realtimeHeartbeatInterval = null;
  }

  realtimeState.samePageUsers = [];
  realtimeState.pendingRefresh = false;
  realtimeState.notifiedVersion = 0;
  realtimeState.lastChangedByName = '';
  realtimeState.lastChangedPage = '';
  realtimeState.editContext = { mode: '', entityType: '', entityId: null, entityLabel: '' };

  if (typeof renderRealtimePageContext === 'function') {
    renderRealtimePageContext();
  }
}

async function updateRealtimeMobilityLocks() {
  if (!canRunRealtime()) return;

  try {
    const payload = await apiRequest('/api/movilidades/locks', { suppressAuthHandling: true });
    const locks = Array.isArray(payload) ? payload : Array.isArray(payload?.locks) ? payload.locks : [];
    realtimeState.mobilityLocks = locks;

    document.querySelectorAll('tbody tr[data-movilidad-id]').forEach(row => {
      const movilidadId = Number(row.dataset.movilidadId || 0);
      if (!movilidadId) return;

      const lock = locks.find(l => Number(l.movilidad_id) === movilidadId);
      const badgeEl = row.querySelector('.editing-badge');
      if (!badgeEl) return;

      if (lock && Number(lock.user_id) !== Number(currentUser?.id || 0)) {
        badgeEl.style.display = 'inline-block';
        badgeEl.textContent = `Editando: ${lock.user_name || 'Usuario'}`;
      } else {
        badgeEl.style.display = 'none';
      }
    });
  } catch (_error) {
  }
}

async function acquireMobilityLock(movilidadId) {
  try {
    await apiRequest(`/api/movilidades/${movilidadId}/lock`, {
      method: 'POST',
      suppressAuthHandling: true,
    });
    return true;
  } catch (_error) {
    return false;
  }
}

async function releaseMobilityLock(movilidadId) {
  try {
    await apiRequest(`/api/movilidades/${movilidadId}/lock`, {
      method: 'DELETE',
      suppressAuthHandling: true,
    });
    return true;
  } catch (_error) {
    return false;
  }
}

async function pollRealtimeAlerts() {
  if (!canRunRealtime()) return;

  try {
    const data = await apiRequest('/api/alerts', { suppressAuthHandling: true });
    const alerts = Array.isArray(data?.alerts) ? data.alerts : Array.isArray(data) ? data : [];

    alerts.forEach(alert => {
      const type = String(alert?.type || 'info');
      const message = String(alert?.message || '').trim();
      if (!message) return;
      if (type === 'novedad_urgente') {
        showToast(`Novedad urgente: ${message}`, 'warning');
      } else if (type === 'service_alert') {
        showToast(`Mantenimiento: ${message}`, 'info');
      }
    });
  } catch (_error) {
  }
}

function updateRealtimeSyncState(sync) {
  if (sync && typeof realtimeState !== 'undefined') {
    const version = Number(sync?.changeVersion || 0);
    if (version) {
      realtimeState.lastSeenVersion = Math.max(realtimeState.lastSeenVersion || 0, version);
    }
  }

  const indicator = document.getElementById('sync-status');
  if (!indicator) return;

  const syncAge = realtimeLastDataSync ? Math.floor((Date.now() - realtimeLastDataSync.getTime()) / 1000) : null;
  if (syncAge === null) {
    indicator.className = 'sync-status syncing';
    indicator.title = 'Sincronizando...';
  } else if (syncAge < 60) {
    indicator.className = 'sync-status synced';
    indicator.title = 'Sincronizado hace poco';
  } else if (syncAge < 300) {
    indicator.className = 'sync-status stale';
    indicator.title = `Ultima sincronizacion hace ${syncAge}s`;
  } else {
    indicator.className = 'sync-status offline';
    indicator.title = 'Sin sincronizar por mas de 5 minutos';
  }
}

function setupRealtimeObservers() {
  if (realtimeObserver) return realtimeObserver;

  const target = pageContent || document.body;
  realtimeObserver = new MutationObserver((mutations) => {
    const hasTableRows = mutations.some(mutation =>
      Array.from(mutation.addedNodes || []).some(node =>
        node.nodeName === 'TR' || (typeof node.querySelector === 'function' && node.querySelector('[data-movilidad-id]'))
      )
    );
    if (hasTableRows) {
      updateRealtimeMobilityLocks().catch(() => {});
    }
  });

  realtimeObserver.observe(target, { childList: true, subtree: true });
  return realtimeObserver;
}

async function initRealtimeSync() {
  if (realtimeSyncInitialized || !canRunRealtime()) return;
  realtimeSyncInitialized = true;

  startRealtimeHeartbeat();
  await updateRealtimeMobilityLocks();
  await pollRealtimeAlerts();

  realtimeLocksInterval = window.setInterval(() => {
    updateRealtimeMobilityLocks().catch(() => {});
  }, 20000);

  realtimeAlertsInterval = window.setInterval(() => {
    pollRealtimeAlerts().catch(() => {});
  }, 45000);

  realtimeStatusInterval = window.setInterval(() => {
    updateRealtimeSyncState();
  }, 10000);

  setupRealtimeObservers();
}

function cleanupRealtimeSync() {
  stopRealtimeHeartbeat();

  if (realtimeLocksInterval) {
    window.clearInterval(realtimeLocksInterval);
    realtimeLocksInterval = null;
  }
  if (realtimeAlertsInterval) {
    window.clearInterval(realtimeAlertsInterval);
    realtimeAlertsInterval = null;
  }
  if (realtimeStatusInterval) {
    window.clearInterval(realtimeStatusInterval);
    realtimeStatusInterval = null;
  }
  if (realtimeObserver) {
    realtimeObserver.disconnect();
    realtimeObserver = null;
  }

  realtimeSyncInitialized = false;
}

console.log('✅ Módulo realtime.js cargado.');
