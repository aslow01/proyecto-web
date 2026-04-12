/**
 * MÓDULO: SINCRONIZACIÓN DE DATOS
 *
 * Compatible con la API actual y con la firma apiRequest(url, options).
 */

const dataCache = {
  movilidades: null,
  objetivos: null,
  partes: null,
  novedades: null,
  lastUpdateTimes: {},
};

const CACHE_EXPIRY = {
  movilidades: 5 * 60 * 1000,
  objetivos: 10 * 60 * 1000,
  partes: 5 * 60 * 1000,
  novedades: 2 * 60 * 1000,
};

let dataSyncIntervalId = null;
let dataSyncInitialized = false;

function isCacheValid(type) {
  if (!dataCache[type] || !dataCache.lastUpdateTimes[type]) return false;
  const age = Date.now() - dataCache.lastUpdateTimes[type].getTime();
  const expiry = CACHE_EXPIRY[type] || 5 * 60 * 1000;
  return age < expiry;
}

function invalidateCache(type = null) {
  if (!type) {
    dataCache.movilidades = null;
    dataCache.objetivos = null;
    dataCache.partes = null;
    dataCache.novedades = null;
    dataCache.lastUpdateTimes = {};
    return;
  }
  dataCache[type] = null;
  delete dataCache.lastUpdateTimes[type];
}

function applyOperationalData(data) {
  DATA.movilidades = Array.isArray(data?.movilidades) ? data.movilidades : [];
  DATA.objetivos = Array.isArray(data?.objetivos) ? data.objetivos : [];
  DATA.partes = Array.isArray(data?.partes) ? data.partes : [];
  DATA.novedades = Array.isArray(data?.novedades) ? data.novedades : [];

  dataCache.movilidades = [...DATA.movilidades];
  dataCache.objetivos = [...DATA.objetivos];
  dataCache.partes = [...DATA.partes];
  dataCache.novedades = [...DATA.novedades];

  const now = new Date();
  dataCache.lastUpdateTimes.movilidades = now;
  dataCache.lastUpdateTimes.objetivos = now;
  dataCache.lastUpdateTimes.partes = now;
  dataCache.lastUpdateTimes.novedades = now;

  if (typeof syncObjetivosSubmenu === 'function') syncObjetivosSubmenu();
  if (typeof updateAlertBadges === 'function') updateAlertBadges();
  if (typeof updateRealtimeSyncState === 'function') updateRealtimeSyncState(data?.sync);
}

async function loadOperationalData(options = {}) {
  const force = options.force === true;

  if (!force && isCacheValid('movilidades') && isCacheValid('objetivos') && isCacheValid('partes') && isCacheValid('novedades')) {
    applyOperationalData({
      movilidades: dataCache.movilidades,
      objetivos: dataCache.objetivos,
      partes: dataCache.partes,
      novedades: dataCache.novedades,
    });
    return true;
  }

  try {
    const payload = await apiRequest('/api/bootstrap', { suppressAuthHandling: true });
    applyOperationalData(payload || {});
    return true;
  } catch (error) {
    DATA.movilidades = [];
    DATA.objetivos = [];
    DATA.partes = [];
    DATA.novedades = [];
    if (typeof showToast === 'function') {
      showToast(error.message || 'No se pudo cargar la información operativa.', 'error');
    }
    return false;
  }
}

async function loadMovilidades(options = {}) {
  if (!options.force && isCacheValid('movilidades')) {
    return [...(dataCache.movilidades || [])];
  }
  try {
    const payload = await apiRequest('/api/movilidades', { suppressAuthHandling: true });
    const rows = Array.isArray(payload?.movilidades) ? payload.movilidades : Array.isArray(payload) ? payload : [];
    dataCache.movilidades = rows;
    dataCache.lastUpdateTimes.movilidades = new Date();
    DATA.movilidades = [...rows];
    return rows;
  } catch (_error) {
    return [...(dataCache.movilidades || [])];
  }
}

async function loadObjetivos(options = {}) {
  if (!options.force && isCacheValid('objetivos')) {
    return [...(dataCache.objetivos || [])];
  }
  try {
    const payload = await apiRequest('/api/objetivos', { suppressAuthHandling: true });
    const rows = Array.isArray(payload?.objetivos) ? payload.objetivos : Array.isArray(payload) ? payload : [];
    dataCache.objetivos = rows;
    dataCache.lastUpdateTimes.objetivos = new Date();
    DATA.objetivos = [...rows];
    return rows;
  } catch (_error) {
    return [...(dataCache.objetivos || [])];
  }
}

async function loadPartes(options = {}) {
  if (!options.force && isCacheValid('partes')) {
    return [...(dataCache.partes || [])];
  }
  try {
    const payload = await apiRequest('/api/partes', { suppressAuthHandling: true });
    const rows = Array.isArray(payload?.partes) ? payload.partes : Array.isArray(payload) ? payload : [];
    dataCache.partes = rows;
    dataCache.lastUpdateTimes.partes = new Date();
    DATA.partes = [...rows];
    return rows;
  } catch (_error) {
    return [...(dataCache.partes || [])];
  }
}

async function loadNovedades(options = {}) {
  if (!options.force && isCacheValid('novedades')) {
    return [...(dataCache.novedades || [])];
  }
  try {
    const payload = await apiRequest('/api/novedades', { suppressAuthHandling: true });
    const rows = Array.isArray(payload?.novedades) ? payload.novedades : Array.isArray(payload) ? payload : [];
    dataCache.novedades = rows;
    dataCache.lastUpdateTimes.novedades = new Date();
    DATA.novedades = [...rows];
    return rows;
  } catch (_error) {
    return [...(dataCache.novedades || [])];
  }
}

function getMovilidades() {
  return DATA.movilidades || [];
}

function getObjetivos() {
  return DATA.objetivos || [];
}

function getPartes() {
  return DATA.partes || [];
}

function getNovedades() {
  return DATA.novedades || [];
}

function getMovilidadById(id) {
  return getMovilidades().find(item => Number(item.id) === Number(id));
}

function getObjetivoById(id) {
  return getObjetivos().find(item => Number(item.id) === Number(id));
}

function getParteById(id) {
  return getPartes().find(item => Number(item.id) === Number(id));
}

function getNovedadById(id) {
  return getNovedades().find(item => Number(item.id) === Number(id));
}

function searchMovilidades(query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return getMovilidades();

  return getMovilidades().filter(m => {
    const patente = String(m.patente || '').toLowerCase();
    const desc = String(m.descripcion || '').toLowerCase();
    const chofer = String(m.chofer || '').toLowerCase();
    return patente.includes(q) || desc.includes(q) || chofer.includes(q);
  });
}

function searchNovedades(query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return getNovedades();

  return getNovedades().filter(n => {
    const titulo = String(n.titulo || '').toLowerCase();
    const contenido = String(n.contenido || '').toLowerCase();
    const unidad = String(n.unidad || '').toLowerCase();
    return titulo.includes(q) || contenido.includes(q) || unidad.includes(q);
  });
}

function filterMovilidades(filters = {}) {
  let rows = getMovilidades();

  if (filters.provincia) rows = rows.filter(m => String(m.provincia || '') === String(filters.provincia));
  if (filters.estado) rows = rows.filter(m => String(m.estado || '') === String(filters.estado));
  if (filters.search) {
    const q = String(filters.search || '').toLowerCase();
    rows = rows.filter(m => String(m.patente || '').toLowerCase().includes(q) || String(m.descripcion || '').toLowerCase().includes(q));
  }

  return rows;
}

function filterPartes(filters = {}) {
  let rows = getPartes();
  if (filters.unidad) rows = rows.filter(p => String(p.unidad_id || '') === String(filters.unidad));
  if (filters.estado) rows = rows.filter(p => String(p.estado || '') === String(filters.estado));
  return rows;
}

function filterNovedades(filters = {}) {
  let rows = getNovedades();
  if (filters.tipo) rows = rows.filter(n => String(n.tipo || '') === String(filters.tipo));
  if (filters.unidad) rows = rows.filter(n => String(n.unidad_id || '') === String(filters.unidad));
  return rows.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());
}

function getDataStatistics() {
  return {
    totalMovilidades: getMovilidades().length,
    totalObjetivos: getObjetivos().length,
    totalPartes: getPartes().length,
    totalNovedades: getNovedades().length,
    novedadesUrgentes: getNovedades().filter(n => String(n.tipo || '') === 'urgente').length,
    cacheStatus: {
      movilidades: isCacheValid('movilidades'),
      objetivos: isCacheValid('objetivos'),
      partes: isCacheValid('partes'),
      novedades: isCacheValid('novedades'),
    },
  };
}

function logDataStatistics() {
  console.table(getDataStatistics());
}

function addMovilidadToCache(item) {
  DATA.movilidades = [...getMovilidades(), item];
  dataCache.movilidades = [...DATA.movilidades];
  dataCache.lastUpdateTimes.movilidades = new Date();
}

function updateMovilidadInCache(id, updates) {
  DATA.movilidades = getMovilidades().map(item => (Number(item.id) === Number(id) ? { ...item, ...updates } : item));
  dataCache.movilidades = [...DATA.movilidades];
  dataCache.lastUpdateTimes.movilidades = new Date();
}

function removeMovilidadFromCache(id) {
  DATA.movilidades = getMovilidades().filter(item => Number(item.id) !== Number(id));
  dataCache.movilidades = [...DATA.movilidades];
  dataCache.lastUpdateTimes.movilidades = new Date();
}

function addNovedadToCache(item) {
  DATA.novedades = [item, ...getNovedades()];
  dataCache.novedades = [...DATA.novedades];
  dataCache.lastUpdateTimes.novedades = new Date();
}

function updateNovedadInCache(id, updates) {
  DATA.novedades = getNovedades().map(item => (Number(item.id) === Number(id) ? { ...item, ...updates } : item));
  dataCache.novedades = [...DATA.novedades];
  dataCache.lastUpdateTimes.novedades = new Date();
}

function removeNovedadFromCache(id) {
  DATA.novedades = getNovedades().filter(item => Number(item.id) !== Number(id));
  dataCache.novedades = [...DATA.novedades];
  dataCache.lastUpdateTimes.novedades = new Date();
}

async function initDataSync() {
  if (dataSyncInitialized) return;
  dataSyncInitialized = true;

  await loadOperationalData();

  dataSyncIntervalId = window.setInterval(() => {
    loadOperationalData({ force: true }).catch(() => {});
  }, 120000);
}

function cleanupDataSync() {
  if (dataSyncIntervalId) {
    window.clearInterval(dataSyncIntervalId);
    dataSyncIntervalId = null;
  }
  dataSyncInitialized = false;
}

console.log('✅ Módulo data-sync.js cargado.');
