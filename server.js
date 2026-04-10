const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || 'huarpe-logistica-dev-secret';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'huarpe-logistica.db');
const DOCUMENT_ALERTS = [
  { key: 'rto', field: 'rto_vencimiento', label: 'RTO' },
  { key: 'seguro', field: 'seguro_vencimiento', label: 'Seguro' },
];

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
const PRESENCE_TIMEOUT_MS = 30000;
const presenceState = new Map();
const runtimeSyncState = {
  changeVersion: 1,
  lastChangedAt: '',
  lastChangedPage: '',
  lastChangedByUserId: null,
  lastChangedByName: '',
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('administrador', 'logistica', 'supervisor', 'operador')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
    ultima TEXT DEFAULT ''
  )
`);

migrateUsersRoleConstraint();

db.exec(`
  CREATE TABLE IF NOT EXISTS objetivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT '',
    icono TEXT DEFAULT 'fa-circle',
    estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo'))
  );

  CREATE TABLE IF NOT EXISTS movilidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patente TEXT NOT NULL UNIQUE,
    tipo_unidad TEXT NOT NULL DEFAULT 'camioneta',
    marca TEXT DEFAULT '',
    descripcion TEXT NOT NULL,
    tipo_propiedad TEXT DEFAULT 'propia',
    km_actual TEXT DEFAULT '',
    km_proximo_service TEXT DEFAULT '',
    anio TEXT DEFAULT '',
    numero_motor TEXT DEFAULT '',
    numero_chasis TEXT DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK(estado IN ('disponible', 'servicio', 'mantenimiento', 'fuera')),
    provincia TEXT NOT NULL,
    objetivo TEXT DEFAULT '',
    ubicacion TEXT DEFAULT '',
    ultima_novedad TEXT DEFAULT 'Sin novedades',
    chofer TEXT DEFAULT '',
    rto_vencimiento TEXT DEFAULT '',
    seguro_vencimiento TEXT DEFAULT '',
    tarjeta_verde_json TEXT DEFAULT '{}',
    titulo_json TEXT DEFAULT '{}',
    contrato_firmado_json TEXT DEFAULT '{}',
    rto_adjunto_json TEXT DEFAULT '{}',
    vtv_vencimiento TEXT DEFAULT '',
    habilitacion_vencimiento TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS partes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    provincia TEXT NOT NULL,
    objetivo TEXT DEFAULT '',
    unidad TEXT DEFAULT '',
    chofer TEXT DEFAULT '',
    km_inicial INTEGER NOT NULL DEFAULT 0,
    km_final INTEGER NOT NULL DEFAULT 0,
    combustible INTEGER NOT NULL DEFAULT 0,
    observaciones TEXT DEFAULT '',
    desperfectos TEXT DEFAULT '',
    cabecera_json TEXT DEFAULT '{}',
    documentacion_json TEXT DEFAULT '{}',
    checklist_json TEXT DEFAULT '{}',
    adjunto_json TEXT DEFAULT '{}',
    estado TEXT NOT NULL DEFAULT 'completo' CHECK(estado IN ('completo', 'observado'))
  );

  CREATE TABLE IF NOT EXISTS novedades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    unidad TEXT DEFAULT '',
    chofer TEXT DEFAULT '',
    objetivo TEXT DEFAULT '',
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'rotura',
    prioridad TEXT NOT NULL DEFAULT 'pendiente',
    descripcion TEXT DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    alerta_clave TEXT DEFAULT '',
    generado_automaticamente INTEGER NOT NULL DEFAULT 0
  );
`);

ensureColumn('partes', 'cabecera_json', "TEXT DEFAULT '{}'");
ensureColumn('partes', 'documentacion_json', "TEXT DEFAULT '{}'");
ensureColumn('partes', 'checklist_json', "TEXT DEFAULT '{}'");
ensureColumn('partes', 'adjunto_json', "TEXT DEFAULT '{}'");
ensureColumn('movilidades', 'marca', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'tipo_unidad', "TEXT NOT NULL DEFAULT 'camioneta'");
ensureColumn('movilidades', 'tipo_propiedad', "TEXT DEFAULT 'propia'");
ensureColumn('movilidades', 'km_actual', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'km_proximo_service', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'anio', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'numero_motor', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'numero_chasis', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'rto_vencimiento', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'seguro_vencimiento', "TEXT DEFAULT ''");
ensureColumn('movilidades', 'tarjeta_verde_json', "TEXT DEFAULT '{}'");
ensureColumn('movilidades', 'titulo_json', "TEXT DEFAULT '{}'");
ensureColumn('movilidades', 'contrato_firmado_json', "TEXT DEFAULT '{}'");
ensureColumn('movilidades', 'rto_adjunto_json', "TEXT DEFAULT '{}'");
ensureColumn('novedades', 'alerta_clave', "TEXT DEFAULT ''");
ensureColumn('novedades', 'generado_automaticamente', 'INTEGER NOT NULL DEFAULT 0');

seedAdminUser();

app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  },
}));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/session', (req, res) => {
  const user = getSessionUser(req.session.userId);
  if (!user) {
    res.status(401).json({ error: 'No hay una sesión activa.' });
    return;
  }
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const rememberSession = Boolean(req.body.rememberSession);
  if (!email || !password) {
    res.status(400).json({ error: 'Ingresá correo y contraseña.' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE lower(email) = ? LIMIT 1').get(email);
  if (!row || row.estado !== 'activo') {
    res.status(401).json({ error: 'No existe un usuario activo con ese correo.' });
    return;
  }

  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'La contraseña es incorrecta.' });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  db.prepare('UPDATE users SET ultima = ? WHERE id = ?').run(today, row.id);
  req.session.userId = row.id;
  if (rememberSession) {
    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
  } else {
    req.session.cookie.expires = false;
    req.session.cookie.maxAge = null;
  }

  res.json({ user: serializeUser({ ...row, ultima: today }) });
});

app.post('/api/auth/logout', (req, res) => {
  removePresence(req.session.userId);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.post('/api/realtime/heartbeat', requireAuth, (req, res) => {
  cleanupPresence();
  const page = sanitizeRealtimePage(req.body.page);
  const filter = String(req.body.filter || '').trim().slice(0, 80);
  const context = sanitizeRealtimeContext(req.body.context);

  presenceState.set(req.currentUser.id, {
    userId: req.currentUser.id,
    nombre: req.currentUser.nombre,
    rol: req.currentUser.rol,
    page,
    filter,
    context,
    lastSeenAt: Date.now(),
  });

  const samePageUsers = [...presenceState.values()]
    .filter(item => item.userId !== req.currentUser.id && item.page === page)
    .sort((left, right) => right.lastSeenAt - left.lastSeenAt)
    .map(item => ({
      id: item.userId,
      nombre: item.nombre,
      rol: item.rol,
      page: item.page,
      filter: item.filter,
      context: item.context,
      lastSeenAt: item.lastSeenAt,
    }));

  res.json({
    samePageUsers,
    sync: buildSyncPayload(),
  });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Completá los campos de contraseña.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!row || !bcrypt.compareSync(currentPassword, row.password_hash)) {
    res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.id);
  res.json({ ok: true });
});

app.get('/api/users', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT id, nombre, email, rol, estado, ultima FROM users ORDER BY id ASC').all();
  res.json({ users: rows.map(serializeUser) });
});

app.post('/api/users', requireAdmin, (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const rol = String(req.body.rol || 'operador');

  if (!nombre || !email || !password) {
    res.status(400).json({ error: 'Completá todos los campos obligatorios.' });
    return;
  }

  if (!['administrador', 'logistica', 'supervisor', 'operador'].includes(rol)) {
    res.status(400).json({ error: 'El rol indicado no es válido.' });
    return;
  }

  const exists = db.prepare('SELECT id FROM users WHERE lower(email) = ? LIMIT 1').get(email);
  if (exists) {
    res.status(409).json({ error: 'Ese correo ya está cargado.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (nombre, email, password_hash, rol, estado, ultima) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(nombre, email, passwordHash, rol, 'activo', '');

  const created = db.prepare('SELECT id, nombre, email, rol, estado, ultima FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ user: serializeUser(created) });
});

app.put('/api/users/:id', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'El identificador de usuario no es válido.' });
    return;
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').get(userId);
  if (!existing) {
    res.status(404).json({ error: 'El usuario no existe.' });
    return;
  }

  const nombre = String(req.body.nombre || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const rol = String(req.body.rol || 'operador');
  const estado = String(req.body.estado || 'activo');
  const password = String(req.body.password || '');

  if (!nombre || !email) {
    res.status(400).json({ error: 'Completá nombre y correo del usuario.' });
    return;
  }

  if (!['administrador', 'logistica', 'supervisor', 'operador'].includes(rol)) {
    res.status(400).json({ error: 'El rol indicado no es válido.' });
    return;
  }

  if (!['activo', 'inactivo'].includes(estado)) {
    res.status(400).json({ error: 'El estado indicado no es válido.' });
    return;
  }

  const duplicated = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id <> ? LIMIT 1').get(email, userId);
  if (duplicated) {
    res.status(409).json({ error: 'Ese correo ya está cargado por otro usuario.' });
    return;
  }

  if (userId === req.session.userId && rol !== 'administrador') {
    res.status(400).json({ error: 'No podés quitar privilegios de administrador a la sesión activa.' });
    return;
  }

  if (userId === req.session.userId && estado !== 'activo') {
    res.status(400).json({ error: 'No podés desactivar la sesión activa.' });
    return;
  }

  if (password && password.length < 8) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    return;
  }

  db.prepare('UPDATE users SET nombre = ?, email = ?, rol = ?, estado = ? WHERE id = ?')
    .run(nombre, email, rol, estado, userId);

  if (password) {
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
  }

  const updated = db.prepare('SELECT id, nombre, email, rol, estado, ultima FROM users WHERE id = ?').get(userId);
  res.json({ user: serializeUser(updated) });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'El identificador de usuario no es válido.' });
    return;
  }

  if (userId === req.session.userId) {
    res.status(400).json({ error: 'No podés eliminar la sesión activa.' });
    return;
  }

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  if (!result.changes) {
    res.status(404).json({ error: 'El usuario no existe.' });
    return;
  }

  res.json({ ok: true });
});

app.get('/api/bootstrap', requireAuth, (_req, res) => {
  res.json(getOperationalData());
});

app.post('/api/objetivos', requireRoles(['administrador', 'logistica']), (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const descripcion = String(req.body.descripcion || '').trim();
  if (!nombre) {
    res.status(400).json({ error: 'Ingresá un nombre para el objetivo.' });
    return;
  }

  const exists = db.prepare('SELECT id FROM objetivos WHERE lower(nombre) = lower(?) LIMIT 1').get(nombre);
  if (exists) {
    res.status(409).json({ error: 'Ese objetivo ya existe.' });
    return;
  }

  db.prepare('INSERT INTO objetivos (nombre, descripcion, icono, estado) VALUES (?, ?, ?, ?)')
    .run(nombre, descripcion, 'fa-circle', 'activo');

  markDataChanged(req.currentUser, 'objetivos');
  res.status(201).json(getOperationalData());
});

app.post('/api/movilidades', requireRoles(['administrador', 'logistica', 'supervisor']), (req, res) => {
  const patente = String(req.body.patente || '').trim().toUpperCase();
  const marca = String(req.body.marca || '').trim().toUpperCase();
  const descripcion = String(req.body.descripcion || '').trim();
  if (!patente || !marca || !descripcion) {
    res.status(400).json({ error: 'Completá los campos obligatorios de la unidad.' });
    return;
  }
  const vehicleValidationError = validateVehicleTechnicalFields(req.body);
  if (vehicleValidationError) {
    res.status(400).json({ error: vehicleValidationError });
    return;
  }
  const vehicleServiceValidationError = validateVehicleServiceFields(req.body);
  if (vehicleServiceValidationError) {
    res.status(400).json({ error: vehicleServiceValidationError });
    return;
  }

  const exists = db.prepare('SELECT id FROM movilidades WHERE upper(patente) = ? LIMIT 1').get(patente);
  if (exists) {
    res.status(409).json({ error: 'Esa patente ya está cargada.' });
    return;
  }

  db.prepare(`
    INSERT INTO movilidades (patente, tipo_unidad, marca, descripcion, tipo_propiedad, km_actual, km_proximo_service, anio, numero_motor, numero_chasis, estado, provincia, objetivo, ubicacion, ultima_novedad, chofer, rto_vencimiento, seguro_vencimiento, tarjeta_verde_json, titulo_json, contrato_firmado_json, rto_adjunto_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    patente,
    normalizeVehicleUnitType(req.body.tipoUnidad),
    marca,
    descripcion,
    String(req.body.tipoPropiedad || 'propia'),
    String(req.body.kmActual || ''),
    String(req.body.kmProximoService || ''),
    String(req.body.anio || ''),
    String(req.body.numeroMotor || ''),
    String(req.body.numeroChasis || ''),
    String(req.body.estado || 'disponible'),
    String(req.body.provincia || 'mendoza'),
    String(req.body.objetivo || ''),
    String(req.body.ubicacion || ''),
    String(req.body.ultimaNovedad || 'Sin novedades'),
    String(req.body.chofer || ''),
    String(req.body.rtoVencimiento || ''),
    String(req.body.seguroVencimiento || ''),
    stringifyJson(req.body.tarjetaVerdeAdjunto),
    stringifyJson(req.body.tituloAdjunto),
    stringifyJson(req.body.contratoFirmadoAdjunto),
    stringifyJson(req.body.rtoAdjunto)
  );

  markDataChanged(req.currentUser, 'movilidades');
  res.status(201).json(getOperationalData());
});

app.put('/api/movilidades/:id', requireRoles(['administrador', 'logistica', 'supervisor']), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'La unidad indicada no es válida.' });
    return;
  }

  const existing = db.prepare('SELECT id, patente, tipo_unidad FROM movilidades WHERE id = ? LIMIT 1').get(id);
  if (!existing) {
    res.status(404).json({ error: 'La unidad no existe.' });
    return;
  }
  const activeEditors = getActiveMobilityEditors(id, req.currentUser.id);
  if (activeEditors.length) {
    res.status(409).json({ error: buildMobilityLockMessage(existing.patente, activeEditors) });
    return;
  }
  const vehicleValidationError = validateVehicleTechnicalFields(req.body);
  if (vehicleValidationError) {
    res.status(400).json({ error: vehicleValidationError });
    return;
  }
  const vehicleServiceValidationError = validateVehicleServiceFields(req.body);
  if (vehicleServiceValidationError) {
    res.status(400).json({ error: vehicleServiceValidationError });
    return;
  }

  const nextUnitType = normalizeVehicleUnitType(req.body.tipoUnidad || existing.tipo_unidad);
  const nextPatente = String(req.body.patente || existing.patente).trim().toUpperCase();
  if (nextUnitType === 'cuatriciclo') {
    if (!nextPatente) {
      res.status(400).json({ error: 'Ingresá la patente o identificador del cuatriciclo.' });
      return;
    }

    const duplicate = db.prepare('SELECT id FROM movilidades WHERE upper(patente) = ? AND id <> ? LIMIT 1').get(nextPatente, id);
    if (duplicate) {
      res.status(409).json({ error: 'Ya existe otra unidad con esa patente o identificador.' });
      return;
    }
  }

  db.prepare(`
    UPDATE movilidades
    SET patente = ?, tipo_unidad = ?, marca = ?, descripcion = ?, tipo_propiedad = ?, km_actual = ?, km_proximo_service = ?, anio = ?, numero_motor = ?, numero_chasis = ?, estado = ?, provincia = ?, chofer = ?, ubicacion = ?, ultima_novedad = ?, rto_vencimiento = ?, seguro_vencimiento = ?, tarjeta_verde_json = ?, titulo_json = ?, contrato_firmado_json = ?, rto_adjunto_json = ?
    WHERE id = ?
  `).run(
    nextUnitType === 'cuatriciclo' ? nextPatente : existing.patente,
    nextUnitType,
    String(req.body.marca || ''),
    String(req.body.descripcion || ''),
    String(req.body.tipoPropiedad || 'propia'),
    String(req.body.kmActual || ''),
    String(req.body.kmProximoService || ''),
    String(req.body.anio || ''),
    String(req.body.numeroMotor || ''),
    String(req.body.numeroChasis || ''),
    String(req.body.estado || 'disponible'),
    String(req.body.provincia || 'mendoza'),
    String(req.body.chofer || ''),
    String(req.body.ubicacion || ''),
    String(req.body.ultimaNovedad || 'Sin novedades'),
    String(req.body.rtoVencimiento || ''),
    String(req.body.seguroVencimiento || ''),
    stringifyJson(req.body.tarjetaVerdeAdjunto),
    stringifyJson(req.body.tituloAdjunto),
    stringifyJson(req.body.contratoFirmadoAdjunto),
    stringifyJson(req.body.rtoAdjunto),
    id
  );

  markDataChanged(req.currentUser, 'movilidades');
  res.json(getOperationalData());
});

app.patch('/api/movilidades/:id/deactivate', requireRoles(['administrador', 'logistica', 'supervisor']), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'La unidad indicada no es válida.' });
    return;
  }

  const existing = db.prepare('SELECT id, patente FROM movilidades WHERE id = ? LIMIT 1').get(id);
  if (!existing) {
    res.status(404).json({ error: 'La unidad no existe.' });
    return;
  }

  const activeEditors = getActiveMobilityEditors(id, req.currentUser.id);
  if (activeEditors.length) {
    res.status(409).json({ error: buildMobilityLockMessage(existing.patente, activeEditors) });
    return;
  }

  const result = db.prepare(`
    UPDATE movilidades
    SET estado = 'fuera', ultima_novedad = ?
    WHERE id = ?
  `).run('Unidad dada de baja', id);

  if (!result.changes) {
    res.status(404).json({ error: 'La unidad no existe.' });
    return;
  }

  markDataChanged(req.currentUser, 'movilidades');
  res.json(getOperationalData());
});

app.delete('/api/movilidades/:id', requireRoles(['administrador', 'supervisor']), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'La unidad indicada no es válida.' });
    return;
  }

  const existing = db.prepare('SELECT patente FROM movilidades WHERE id = ? LIMIT 1').get(id);
  if (!existing) {
    res.status(404).json({ error: 'La unidad no existe.' });
    return;
  }

  const activeEditors = getActiveMobilityEditors(id, req.currentUser.id);
  if (activeEditors.length) {
    res.status(409).json({ error: buildMobilityLockMessage(existing.patente, activeEditors) });
    return;
  }

  db.prepare('DELETE FROM novedades WHERE alerta_clave LIKE ?').run(`doc:%:${id}`);
  db.prepare('DELETE FROM movilidades WHERE id = ?').run(id);

  markDataChanged(req.currentUser, 'movilidades');
  res.json(getOperationalData());
});

app.post('/api/partes', requireRoles(['administrador', 'logistica', 'supervisor', 'operador']), (req, res) => {
  const fecha = String(req.body.fecha || '').trim();
  const chofer = String(req.body.chofer || '').trim();
  const kmInicial = Number(req.body.kmInicial || 0);
  const kmFinal = Number(req.body.kmFinal || 0);
  if (!fecha || !chofer) {
    res.status(400).json({ error: 'Completá los campos obligatorios del parte.' });
    return;
  }
  if (kmFinal < kmInicial) {
    res.status(400).json({ error: 'Km final no puede ser menor al inicial.' });
    return;
  }

  db.prepare(`
    INSERT INTO partes (fecha, provincia, objetivo, unidad, chofer, km_inicial, km_final, combustible, observaciones, desperfectos, cabecera_json, documentacion_json, checklist_json, adjunto_json, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    fecha,
    String(req.body.provincia || 'mendoza'),
    String(req.body.objetivo || ''),
    String(req.body.unidad || ''),
    chofer,
    kmInicial,
    kmFinal,
    Number(req.body.combustible || 0),
    String(req.body.observaciones || 'Sin novedad'),
    String(req.body.desperfectos || 'Ninguno'),
    stringifyJson(req.body.cabecera),
    stringifyJson(req.body.documentacion),
    stringifyJson(req.body.checklist),
    stringifyJson(req.body.adjunto),
    String(req.body.estado || 'completo')
  );

  markDataChanged(req.currentUser, 'partes');
  res.status(201).json(getOperationalData());
});

app.put('/api/partes/:id', requireRoles(['administrador', 'logistica', 'supervisor']), (req, res) => {
  const id = Number(req.params.id);
  const fecha = String(req.body.fecha || '').trim();
  const chofer = String(req.body.chofer || '').trim();
  const kmInicial = Number(req.body.kmInicial || 0);
  const kmFinal = Number(req.body.kmFinal || 0);

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'El parte indicado no es válido.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM partes WHERE id = ? LIMIT 1').get(id);
  if (!existing) {
    res.status(404).json({ error: 'El parte no existe.' });
    return;
  }

  if (!fecha || !chofer) {
    res.status(400).json({ error: 'Completá los campos obligatorios del parte.' });
    return;
  }

  if (kmFinal < kmInicial) {
    res.status(400).json({ error: 'Km final no puede ser menor al inicial.' });
    return;
  }

  db.prepare(`
    UPDATE partes
    SET fecha = ?, provincia = ?, objetivo = ?, unidad = ?, chofer = ?, km_inicial = ?, km_final = ?, combustible = ?, observaciones = ?, desperfectos = ?, cabecera_json = ?, documentacion_json = ?, checklist_json = ?, adjunto_json = ?, estado = ?
    WHERE id = ?
  `).run(
    fecha,
    String(req.body.provincia || 'mendoza'),
    String(req.body.objetivo || ''),
    String(req.body.unidad || ''),
    chofer,
    kmInicial,
    kmFinal,
    Number(req.body.combustible || 0),
    String(req.body.observaciones || 'Sin novedad'),
    String(req.body.desperfectos || 'Ninguno'),
    stringifyJson(req.body.cabecera),
    stringifyJson(req.body.documentacion),
    stringifyJson(req.body.checklist),
    stringifyJson(req.body.adjunto),
    String(req.body.estado || 'completo'),
    id
  );

  markDataChanged(req.currentUser, 'partes');
  res.json(getOperationalData());
});

app.post('/api/novedades', requireRoles(['administrador', 'logistica', 'supervisor', 'operador']), (req, res) => {
  const titulo = String(req.body.titulo || '').trim();
  if (!titulo) {
    res.status(400).json({ error: 'Ingresá un título para la novedad.' });
    return;
  }

  db.prepare(`
    INSERT INTO novedades (titulo, unidad, chofer, objetivo, fecha, tipo, prioridad, descripcion, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    titulo,
    String(req.body.unidad || ''),
    String(req.body.chofer || ''),
    String(req.body.objetivo || ''),
    String(req.body.fecha || new Date().toISOString().slice(0, 10)),
    String(req.body.tipo || 'rotura'),
    String(req.body.prioridad || 'pendiente'),
    String(req.body.descripcion || ''),
    String(req.body.estado || req.body.prioridad || 'pendiente')
  );

  markDataChanged(req.currentUser, 'novedades');
  res.status(201).json(getOperationalData());
});

app.put('/api/novedades/:id', requireRoles(['administrador', 'logistica', 'supervisor']), (req, res) => {
  const id = Number(req.params.id);
  const titulo = String(req.body.titulo || '').trim();

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'La novedad indicada no es válida.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM novedades WHERE id = ? LIMIT 1').get(id);
  if (!existing) {
    res.status(404).json({ error: 'La novedad no existe.' });
    return;
  }

  if (!titulo) {
    res.status(400).json({ error: 'Ingresá un título para la novedad.' });
    return;
  }

  db.prepare(`
    UPDATE novedades
    SET titulo = ?, unidad = ?, chofer = ?, objetivo = ?, fecha = ?, tipo = ?, prioridad = ?, descripcion = ?, estado = ?
    WHERE id = ?
  `).run(
    titulo,
    String(req.body.unidad || ''),
    String(req.body.chofer || ''),
    String(req.body.objetivo || ''),
    String(req.body.fecha || new Date().toISOString().slice(0, 10)),
    String(req.body.tipo || 'rotura'),
    String(req.body.prioridad || 'pendiente'),
    String(req.body.descripcion || ''),
    String(req.body.estado || req.body.prioridad || 'pendiente'),
    id
  );

  markDataChanged(req.currentUser, 'novedades');
  res.json(getOperationalData());
});

app.patch('/api/novedades/:id/resolve', requireRoles(['administrador', 'logistica', 'supervisor']), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'La novedad indicada no es válida.' });
    return;
  }

  const result = db.prepare('UPDATE novedades SET estado = ?, prioridad = ? WHERE id = ?').run('resuelto', 'resuelto', id);
  if (!result.changes) {
    res.status(404).json({ error: 'La novedad no existe.' });
    return;
  }

  markDataChanged(req.currentUser, 'novedades');
  res.json(getOperationalData());
});

app.use(express.static(__dirname));

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HUARPE LOGISTICA disponible en http://localhost:${PORT}`);
});

function seedAdminUser() {
  const adminName = process.env.ADMIN_NAME || 'Matias Ormeno';
  const adminEmail = String(process.env.ADMIN_EMAIL || 'matias.ariel.ormeno2@gmail.com').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'Aaslow1597320022@@');
  const exists = db.prepare('SELECT id FROM users WHERE lower(email) = ? LIMIT 1').get(adminEmail);
  if (exists) return;

  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(
    'INSERT INTO users (nombre, email, password_hash, rol, estado, ultima) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(adminName, adminEmail, passwordHash, 'administrador', 'activo', '');
}

function getSessionUser(userId) {
  if (!userId) return null;
  const row = db.prepare('SELECT id, nombre, email, rol, estado, ultima FROM users WHERE id = ? LIMIT 1').get(userId);
  if (!row || row.estado !== 'activo') return null;
  return serializeUser(row);
}

function serializeUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    estado: row.estado,
    ultima: row.ultima || '',
  };
}

function requireAuth(req, res, next) {
  const user = getSessionUser(req.session.userId);
  if (!user) {
    res.status(401).json({ error: 'No hay una sesión activa.' });
    return;
  }
  req.currentUser = user;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.currentUser.rol !== 'administrador') {
      res.status(403).json({ error: 'Solo el administrador puede realizar esta acción.' });
      return;
    }
    next();
  });
}

function getOperationalData() {
  syncDocumentAlertNovedades();
  const objetivos = db.prepare('SELECT id, nombre, descripcion, icono, estado FROM objetivos ORDER BY nombre ASC').all();
  const movilidades = db.prepare(`
    SELECT id, patente, tipo_unidad, marca, descripcion, tipo_propiedad, km_actual, km_proximo_service, anio, numero_motor, numero_chasis, estado, provincia, objetivo, ubicacion, ultima_novedad, chofer, rto_vencimiento, seguro_vencimiento, tarjeta_verde_json, titulo_json, contrato_firmado_json, rto_adjunto_json
    FROM movilidades
    ORDER BY patente ASC
  `).all().map(serializeMovilidad);
  const partes = db.prepare(`
    SELECT id, fecha, provincia, objetivo, unidad, chofer, km_inicial, km_final, combustible, observaciones, desperfectos, cabecera_json, documentacion_json, checklist_json, adjunto_json, estado
    FROM partes
    ORDER BY fecha DESC, id DESC
  `).all().map(serializeParte);
  const novedades = db.prepare(`
    SELECT id, titulo, unidad, chofer, objetivo, fecha, tipo, prioridad, descripcion, estado, alerta_clave, generado_automaticamente
    FROM novedades
    ORDER BY fecha DESC, id DESC
  `).all().map(serializeNovedad);

  return {
    sync: buildSyncPayload(),
    movilidades,
    objetivos: objetivos.map(objetivo => serializeObjetivo(objetivo, movilidades, partes, novedades)),
    partes,
    novedades,
  };
}

function buildSyncPayload() {
  return {
    changeVersion: runtimeSyncState.changeVersion,
    lastChangedAt: runtimeSyncState.lastChangedAt,
    lastChangedPage: runtimeSyncState.lastChangedPage,
    lastChangedByUserId: runtimeSyncState.lastChangedByUserId,
    lastChangedByName: runtimeSyncState.lastChangedByName,
  };
}

function markDataChanged(user, page) {
  runtimeSyncState.changeVersion += 1;
  runtimeSyncState.lastChangedAt = new Date().toISOString();
  runtimeSyncState.lastChangedPage = sanitizeRealtimePage(page);
  runtimeSyncState.lastChangedByUserId = user?.id || null;
  runtimeSyncState.lastChangedByName = user?.nombre || '';
}

function cleanupPresence() {
  const threshold = Date.now() - PRESENCE_TIMEOUT_MS;
  for (const [userId, presence] of presenceState.entries()) {
    if (!presence || presence.lastSeenAt < threshold) {
      presenceState.delete(userId);
    }
  }
}

function removePresence(userId) {
  if (!userId) return;
  presenceState.delete(Number(userId));
}

function getActiveMobilityEditors(movilidadId, excludingUserId = null) {
  cleanupPresence();
  const normalizedId = Number(movilidadId || 0);
  if (!normalizedId) return [];

  return [...presenceState.values()]
    .filter(item => {
      const context = item?.context || {};
      return item.userId !== excludingUserId
        && context.mode === 'editing'
        && context.entityType === 'movilidad'
        && Number(context.entityId || 0) === normalizedId;
    })
    .sort((left, right) => right.lastSeenAt - left.lastSeenAt)
    .map(item => ({
      userId: item.userId,
      nombre: item.nombre,
      entityLabel: item.context?.entityLabel || '',
    }));
}

function buildMobilityLockMessage(patente, editors) {
  const names = editors.map(item => item.nombre).join(', ');
  return `${names} ${editors.length === 1 ? 'está editando' : 'están editando'} la unidad ${patente || 'seleccionada'}. Esperá a que termine para evitar pisar cambios.`;
}

function sanitizeRealtimePage(page) {
  const value = String(page || '').trim().toLowerCase();
  return ['inicio', 'movilidades', 'objetivos', 'partes', 'novedades', 'reportes'].includes(value) ? value : '';
}

function sanitizeRealtimeContext(context) {
  const mode = String(context?.mode || '').trim().toLowerCase();
  const entityType = String(context?.entityType || '').trim().toLowerCase();
  const entityId = Number(context?.entityId || 0) || null;
  const entityLabel = String(context?.entityLabel || '').trim().slice(0, 80);

  if (mode !== 'editing' || entityType !== 'movilidad' || !entityId) {
    return { mode: '', entityType: '', entityId: null, entityLabel: '' };
  }

  return {
    mode,
    entityType,
    entityId,
    entityLabel,
  };
}

function serializeObjetivo(row, movilidades, partes, novedades) {
  const movs = movilidades.filter(item => normalize(item.objetivo) === normalize(row.nombre));
  const parts = partes.filter(item => normalize(item.objetivo) === normalize(row.nombre));
  const novs = novedades.filter(item => normalize(item.objetivo) === normalize(row.nombre));
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    icono: row.icono || 'fa-circle',
    unidades: movs.length,
    choferes: new Set(movs.map(item => item.chofer).filter(Boolean)).size,
    partes: parts.length,
    novedades: novs.length,
    estado: row.estado,
  };
}

function serializeMovilidad(row) {
  return {
    id: row.id,
    patente: row.patente,
    tipoUnidad: normalizeVehicleUnitType(row.tipo_unidad),
    marca: row.marca || '',
    descripcion: row.descripcion,
    tipoPropiedad: row.tipo_propiedad || 'propia',
    kmActual: row.km_actual || '',
    kmProximoService: row.km_proximo_service || '',
    anio: row.anio || '',
    numeroMotor: row.numero_motor || '',
    numeroChasis: row.numero_chasis || '',
    estado: row.estado,
    provincia: row.provincia,
    objetivo: row.objetivo || '',
    ubicacion: row.ubicacion || '',
    ultimaNovedad: row.ultima_novedad || 'Sin novedades',
    chofer: row.chofer || '',
    rtoVencimiento: row.rto_vencimiento || '',
    seguroVencimiento: row.seguro_vencimiento || '',
    tarjetaVerdeAdjunto: parseJson(row.tarjeta_verde_json),
    tituloAdjunto: parseJson(row.titulo_json),
    contratoFirmadoAdjunto: parseJson(row.contrato_firmado_json),
    rtoAdjunto: parseJson(row.rto_adjunto_json),
  };
}

function serializeParte(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    provincia: row.provincia,
    objetivo: row.objetivo || '',
    unidad: row.unidad || '',
    chofer: row.chofer || '',
    kmInicial: row.km_inicial,
    kmFinal: row.km_final,
    combustible: row.combustible,
    observaciones: row.observaciones || '',
    desperfectos: row.desperfectos || '',
    cabecera: parseJson(row.cabecera_json),
    documentacion: parseJson(row.documentacion_json),
    checklist: parseJson(row.checklist_json),
    adjunto: parseJson(row.adjunto_json),
    estado: row.estado,
  };
}

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some(column => column.name === columnName)) return;
  db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

function migrateUsersRoleConstraint() {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (!table?.sql || table.sql.includes("'logistica'")) return;

  db.exec(`
    BEGIN;
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('administrador', 'logistica', 'supervisor', 'operador')),
      estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo')),
      ultima TEXT DEFAULT ''
    );
    INSERT INTO users_new (id, nombre, email, password_hash, rol, estado, ultima)
    SELECT id, nombre, email, password_hash, rol, estado, ultima FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    COMMIT;
  `);
}

function parseJson(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function stringifyJson(value) {
  try {
    return JSON.stringify(value && typeof value === 'object' ? value : {});
  } catch (_error) {
    return '{}';
  }
}

function normalizeVehicleUnitType(value) {
  return String(value || '').trim().toLowerCase() === 'cuatriciclo' ? 'cuatriciclo' : 'camioneta';
}

function validateVehicleServiceFields(payload = {}) {
  const kmActual = String(payload.kmActual || '').trim();
  const kmProximoService = String(payload.kmProximoService || '').trim();

  if (kmActual && !/^\d{1,7}$/.test(kmActual)) {
    return 'El km actual debe contener solo números.';
  }

  if (kmProximoService && !/^\d{1,7}$/.test(kmProximoService)) {
    return 'El km próximo service debe contener solo números.';
  }

  return '';
}

function serializeNovedad(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    unidad: row.unidad || '',
    chofer: row.chofer || '',
    objetivo: row.objetivo || '',
    fecha: row.fecha,
    tipo: row.tipo,
    prioridad: row.prioridad,
    descripcion: row.descripcion || '',
    estado: row.estado,
    alertaClave: row.alerta_clave || '',
    generadoAutomaticamente: Boolean(row.generado_automaticamente),
  };
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

function getDocumentAlertStatus(value) {
  if (!value) return { isAlert: false, isExpired: false, daysRemaining: null, level: 'missing' };

  const dueDate = parseDateOnly(value);
  if (!dueDate) return { isAlert: false, isExpired: false, daysRemaining: null, level: 'missing' };

  const today = getTodayDateOnly();
  const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { isAlert: true, isExpired: true, daysRemaining, level: 'expired' };
  }

  if (daysRemaining <= 15) {
    return { isAlert: true, isExpired: false, daysRemaining, level: 'critical' };
  }

  if (daysRemaining <= 30) {
    return { isAlert: false, isExpired: false, daysRemaining, level: 'warning' };
  }

  return { isAlert: false, isExpired: false, daysRemaining, level: 'ok' };
}

function syncDocumentAlertNovedades() {
  const movilidades = db.prepare(`
    SELECT id, patente, chofer, objetivo, estado, rto_vencimiento, seguro_vencimiento
    FROM movilidades
  `).all();
  const today = new Date().toISOString().slice(0, 10);

  movilidades.forEach(movilidad => {
    DOCUMENT_ALERTS.forEach(documento => {
      const info = getDocumentAlertStatus(movilidad[documento.field]);
      const alertaClave = `doc:${documento.key}:${movilidad.id}`;
      const existing = db.prepare('SELECT id FROM novedades WHERE alerta_clave = ? ORDER BY id ASC LIMIT 1').get(alertaClave);
      const trackingEnabled = movilidad.estado !== 'fuera';

      if (trackingEnabled && info.isAlert) {
        const title = `${documento.label} ${info.isExpired ? 'vencida' : 'próxima a vencer'} - ${movilidad.patente}`;
        const description = info.isExpired
          ? `${documento.label} de la unidad ${movilidad.patente} vencida hace ${Math.abs(info.daysRemaining)} día${Math.abs(info.daysRemaining) !== 1 ? 's' : ''}.`
          : `${documento.label} de la unidad ${movilidad.patente} vence en ${info.daysRemaining} día${info.daysRemaining !== 1 ? 's' : ''}.`;

        if (existing) {
          db.prepare(`
            UPDATE novedades
            SET titulo = ?, unidad = ?, chofer = ?, objetivo = ?, fecha = ?, tipo = ?, prioridad = ?, descripcion = ?, estado = ?, generado_automaticamente = 1
            WHERE id = ?
          `).run(title, movilidad.patente, movilidad.chofer || '', movilidad.objetivo || '', today, 'observacion', 'urgente', description, 'urgente', existing.id);
        } else {
          db.prepare(`
            INSERT INTO novedades (titulo, unidad, chofer, objetivo, fecha, tipo, prioridad, descripcion, estado, alerta_clave, generado_automaticamente)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(title, movilidad.patente, movilidad.chofer || '', movilidad.objetivo || '', today, 'observacion', 'urgente', description, 'urgente', alertaClave);
        }
      } else if (existing) {
        db.prepare(`
          UPDATE novedades
          SET prioridad = ?, estado = ?, fecha = ?, descripcion = ?
          WHERE id = ?
        `).run('resuelto', 'resuelto', today, trackingEnabled ? `${documento.label} de la unidad ${movilidad.patente} fuera de la zona de alerta o renovada.` : `${documento.label} de la unidad ${movilidad.patente} ignorada por estar dada de baja.`, existing.id);
      }
    });
  });
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function validateVehicleTechnicalFields(payload = {}) {
  const anio = String(payload.anio || '').trim();
  const numeroMotor = String(payload.numeroMotor || '').trim();
  const numeroChasis = String(payload.numeroChasis || '').trim();
  const currentYear = new Date().getFullYear() + 1;

  if (anio && !/^(19|20)\d{2}$/.test(anio)) {
    return 'El año debe tener 4 dígitos válidos.';
  }

  if (anio) {
    const yearNumber = Number(anio);
    if (yearNumber < 1900 || yearNumber > currentYear) {
      return `El año debe estar entre 1900 y ${currentYear}.`;
    }
  }

  if (numeroMotor && !/^[A-Za-z0-9-\/]{4,40}$/.test(numeroMotor)) {
    return 'El número de motor solo puede incluir letras, números, guiones o barra, entre 4 y 40 caracteres.';
  }

  if (numeroChasis && !/^[A-Za-z0-9-\/]{6,40}$/.test(numeroChasis)) {
    return 'El número de chasis solo puede incluir letras, números, guiones o barra, entre 6 y 40 caracteres.';
  }

  return '';
}

function requireRoles(roles) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!roles.includes(req.currentUser.rol)) {
        res.status(403).json({ error: 'Tu rol no tiene permiso para realizar esta acción.' });
        return;
      }
      next();
    });
  };
}