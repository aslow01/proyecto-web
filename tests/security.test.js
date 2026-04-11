const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const serverPath = path.join(projectRoot, 'server.js');
const appJsPath = path.join(projectRoot, 'js', 'app.js');
const serverJsPath = path.join(projectRoot, 'server.js');

function getFreePort() {
  return 3300 + Math.floor(Math.random() * 1000);
}

function waitForServerReady(child, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('El servidor de prueba no inició a tiempo.'));
    }, timeoutMs);

    function onData(data) {
      const text = String(data);
      if (text.includes('HUARPE LOGISTICA disponible')) {
        cleanup();
        resolve();
      }
    }

    function onExit(code) {
      cleanup();
      reject(new Error(`El servidor de prueba terminó antes de iniciar. Código: ${code}`));
    }

    function cleanup() {
      clearTimeout(timeout);
      child.stdout?.off('data', onData);
      child.stderr?.off('data', onData);
      child.off('exit', onExit);
    }

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', onExit);
  });
}

async function startTestServer() {
  const port = getFreePort();
  const adminEmail = `security.${Date.now()}@example.com`;
  const adminPassword = 'Segura1234!';
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      SESSION_SECRET: 'test-session-secret-1234567890',
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      ADMIN_NAME: 'Security Test Admin',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForServerReady(child);

  return {
    child,
    baseUrl: `http://127.0.0.1:${port}`,
    adminEmail,
    adminPassword,
    async stop() {
      if (child.killed) return;
      child.kill('SIGTERM');
      await new Promise(resolve => child.once('exit', resolve));
    },
  };
}

async function postJson(baseUrl, route, payload) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { response, data };
}

async function requestJson(baseUrl, route, { method = 'GET', payload, cookie = '', csrfToken = '', headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...headers,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const data = await response.json();
  return { response, data };
}

async function loginWithSession(server) {
  const { response, data } = await postJson(server.baseUrl, '/api/auth/login', {
    email: server.adminEmail,
    password: server.adminPassword,
    rememberSession: true,
  });
  assert.equal(response.status, 200);
  const cookie = (response.headers.get('set-cookie') || '').split(';')[0];
  return {
    cookie,
    csrfToken: data.csrfToken,
  };
}

test('headers de seguridad y CSP endurecida', async () => {
  const server = await startTestServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('pragma'), 'no-cache');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    const csp = response.headers.get('content-security-policy') || '';
    assert.match(csp, /script-src 'self'/);
    assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  } finally {
    await server.stop();
  }
});

test('login fallido no enumera usuarios y aplica rate limit', async () => {
  const server = await startTestServer();
  try {
    const missingUser = await postJson(server.baseUrl, '/api/auth/login', {
      email: 'desconocido@example.com',
      password: 'incorrecta',
      rememberSession: false,
    });
    assert.equal(missingUser.response.status, 401);
    assert.equal(missingUser.data.error, 'Credenciales inválidas.');

    const wrongPassword = await postJson(server.baseUrl, '/api/auth/login', {
      email: server.adminEmail,
      password: 'incorrecta',
      rememberSession: false,
    });
    assert.equal(wrongPassword.response.status, 401);
    assert.equal(wrongPassword.data.error, 'Credenciales inválidas.');

    for (let index = 0; index < 5; index += 1) {
      const attempt = await postJson(server.baseUrl, '/api/auth/login', {
        email: server.adminEmail,
        password: 'incorrecta',
        rememberSession: false,
      });
      if (index < 3) {
        assert.equal(attempt.response.status, 401);
      } else {
        assert.equal(attempt.response.status, 429);
        assert.match(attempt.data.error, /Demasiados intentos/);
      }
    }

    const ipOnlyLimitAttempts = [];
    for (let index = 0; index < 5; index += 1) {
      ipOnlyLimitAttempts.push(await requestJson(server.baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '198.51.100.20' },
        payload: {
          email: `distinto-${index}@example.com`,
          password: 'incorrecta',
          rememberSession: false,
        },
      }));
    }
    ipOnlyLimitAttempts.forEach(attempt => {
      assert.equal(attempt.response.status, 401);
    });

    const ipOnlyBlocked = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.20' },
      payload: {
        email: 'distinto-bloqueado@example.com',
        password: 'incorrecta',
        rememberSession: false,
      },
    });
    assert.equal(ipOnlyBlocked.response.status, 429);
    assert.match(ipOnlyBlocked.data.error, /Demasiados intentos/);
  } finally {
    await server.stop();
  }
});

test('login exitoso limpia el límite por cuenta pero conserva el de IP', async () => {
  const server = await startTestServer();
  try {
    for (let index = 0; index < 3; index += 1) {
      const failed = await requestJson(server.baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'X-Forwarded-For': '198.51.100.30' },
        payload: {
          email: server.adminEmail,
          password: 'incorrecta',
          rememberSession: false,
        },
      });
      assert.equal(failed.response.status, 401);
    }

    const success = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.30' },
      payload: {
        email: server.adminEmail,
        password: server.adminPassword,
        rememberSession: false,
      },
    });
    assert.equal(success.response.status, 200);

    const retrySameAccount = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.30' },
      payload: {
        email: server.adminEmail,
        password: 'incorrecta',
        rememberSession: false,
      },
    });
    assert.equal(retrySameAccount.response.status, 401);

    const ipFifthFailure = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.30' },
      payload: {
        email: 'otra-cuenta@example.com',
        password: 'incorrecta',
        rememberSession: false,
      },
    });
    assert.equal(ipFifthFailure.response.status, 401);

    const ipBlockedAfterMoreAttempts = await requestJson(server.baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.30' },
      payload: {
        email: 'tercera-cuenta@example.com',
        password: 'incorrecta',
        rememberSession: false,
      },
    });
    assert.equal(ipBlockedAfterMoreAttempts.response.status, 429);
  } finally {
    await server.stop();
  }
});

test('login exitoso devuelve cookie endurecida', async () => {
  const server = await startTestServer();
  try {
    const { response, data } = await postJson(server.baseUrl, '/api/auth/login', {
      email: server.adminEmail,
      password: server.adminPassword,
      rememberSession: true,
    });
    assert.equal(response.status, 200);
    assert.equal(data.user.email, server.adminEmail);
    assert.match(data.csrfToken || '', /^[a-f0-9]{48}$/i);
    const setCookie = response.headers.get('set-cookie') || '';
    assert.match(setCookie, /huarpe\.sid=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Strict/i);
  } finally {
    await server.stop();
  }
});

test('operaciones mutables requieren token CSRF válido', async () => {
  const server = await startTestServer();
  try {
    const session = await loginWithSession(server);
    const baseName = `OBJETIVO-TEST-${Date.now()}`;

    const missingToken = await requestJson(server.baseUrl, '/api/objetivos', {
      method: 'POST',
      cookie: session.cookie,
      payload: { nombre: `${baseName}-SIN-TOKEN` },
    });
    assert.equal(missingToken.response.status, 403);
    assert.match(missingToken.data.error, /CSRF/);

    const validToken = await requestJson(server.baseUrl, '/api/objetivos', {
      method: 'POST',
      cookie: session.cookie,
      csrfToken: session.csrfToken,
      payload: { nombre: `${baseName}-VALIDO` },
    });
    assert.equal(validToken.response.status, 201);

    const invalidOrigin = await requestJson(server.baseUrl, '/api/objetivos', {
      method: 'POST',
      cookie: session.cookie,
      csrfToken: session.csrfToken,
      headers: { Origin: 'http://evil.test' },
      payload: { nombre: `${baseName}-ORIGEN-INVALIDO` },
    });
    assert.equal(invalidOrigin.response.status, 403);
    assert.match(invalidOrigin.data.error, /Origen/);
  } finally {
    await server.stop();
  }
});

test('el backend rechaza adjuntos inválidos aunque el cliente falle', async () => {
  const server = await startTestServer();
  try {
    const session = await loginWithSession(server);
    const invalidAttachment = {
      name: 'malicioso.html',
      type: 'text/html',
      dataUrl: 'data:text/html;base64,PGgxPk1hbGljaW9zbzwvaDE+',
    };

    const result = await requestJson(server.baseUrl, '/api/partes', {
      method: 'POST',
      cookie: session.cookie,
      csrfToken: session.csrfToken,
      payload: {
        fecha: '2026-04-10',
        provincia: 'san-juan',
        objetivo: 'PRUEBA',
        unidad: 'TEST-01',
        chofer: 'Chofer Test',
        kmInicial: 10,
        kmFinal: 20,
        combustible: 0,
        observaciones: 'ok',
        desperfectos: 'ninguno',
        cabecera: {},
        documentacion: {},
        checklist: {},
        adjunto: invalidAttachment,
        estado: 'completo',
      },
    });

    assert.equal(result.response.status, 400);
    assert.match(result.data.error, /tipo de archivo no permitido|formato válido/i);
  } finally {
    await server.stop();
  }
});

test('regresión estática: sin handlers inline ni CSP insegura', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const serverJs = fs.readFileSync(serverJsPath, 'utf8');

  assert.doesNotMatch(appJs, /on(click|change|input)=/);
  assert.match(appJs, /data-action=/);
  assert.doesNotMatch(serverJs, /script-src[^;]*'unsafe-inline'/);
});
