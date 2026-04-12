/**
 * AUTENTICACIÓN E INACTIVIDAD
 * Manejo de login, sesión y logout
 */

// Tema
function getResolvedTheme(themePreference = uiPreferences.theme) {
  const normalizedTheme = normalizeThemePreference(themePreference);
  if (normalizedTheme === 'system') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return normalizedTheme;
}

function getResolvedThemeLabel(themePreference = uiPreferences.theme) {
  const normalizedTheme = normalizeThemePreference(themePreference);
  const resolvedTheme = getResolvedTheme(normalizedTheme);
  if (normalizedTheme === 'system') {
    return `Sistema · ${resolvedTheme === 'dark' ? 'Oscuro activo' : 'Claro activo'}`;
  }
  return resolvedTheme === 'dark' ? 'Oscuro activo' : 'Claro activo';
}

function applyThemePreference(themePreference, { persist = true } = {}) {
  uiPreferences.theme = normalizeThemePreference(themePreference);
  const resolvedTheme = getResolvedTheme(uiPreferences.theme);

  document.body.dataset.theme = resolvedTheme;
  document.body.dataset.themePreference = uiPreferences.theme;
  document.documentElement.style.colorScheme = resolvedTheme;

  if (persist) {
    saveUiPreferences();
  }

  syncThemePreferenceControls();
}

function syncThemePreferenceControls() {
  const themeSelect = document.getElementById('themePreferenceSelect');
  const themeBadge = document.getElementById('themeResolvedBadge');
  if (themeSelect) {
    themeSelect.value = uiPreferences.theme;
  }
  if (themeBadge) {
    themeBadge.textContent = getResolvedThemeLabel(uiPreferences.theme);
  }
}

function initializeThemePreference() {
  if (window.matchMedia && !systemThemeMediaQuery) {
    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (uiPreferences.theme === 'system') {
        applyThemePreference('system', { persist: false });
      }
    };

    if (typeof systemThemeMediaQuery.addEventListener === 'function') {
      systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof systemThemeMediaQuery.addListener === 'function') {
      systemThemeMediaQuery.addListener(handleSystemThemeChange);
    }
  }

  applyThemePreference(uiPreferences.theme, { persist: false });
}

function previewThemePreference(selectEl) {
  applyThemePreference(selectEl?.value || uiPreferences.theme);
}

// Login
async function handleLogin(e) {
  e.preventDefault();

  const email = loginEmail?.value.trim().toLowerCase();
  const password = loginPassword?.value || '';
  const shouldRememberSession = rememberSession?.checked ?? true;
  if (!email || !password) {
    setLoginMessage('Ingresá correo y contraseña.', 'warning');
    return;
  }

  try {
    setLoginSubmittingState(true);
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberSession: shouldRememberSession }),
      suppressAuthHandling: true,
    });

    currentUser = data.user;
    csrfToken = data.csrfToken || '';
    await loadOperationalData();
    if (isAdmin()) {
      await loadUsers();
    } else {
      DATA.usuarios = [];
    }

    loginForm.reset();
    setLoginMessage('Acceso concedido.', 'success');
    await playLoginSuccessTransition();
    unlockApplication();
    renderPage('inicio');
    startRealtimeHeartbeat();
    showLoginWelcome(currentUser.nombre);
    showToast(`Sesión iniciada: ${currentUser.nombre}`, 'success');
  } catch (error) {
    setLoginMessage(error.message || 'No se pudo iniciar sesión.', 'error');
  } finally {
    setLoginSubmittingState(false);
  }
}

async function restoreSession() {
  try {
    const data = await apiRequest('/api/auth/session', { suppressAuthHandling: true });
    currentUser = data.user;
    csrfToken = data.csrfToken || '';
    await loadOperationalData();
    if (isAdmin()) {
      await loadUsers();
    }
  } catch (_error) {
    currentUser = null;
    csrfToken = '';
    DATA.usuarios = [];
  }
}

function setLoginSubmittingState(isSubmitting) {
  if (!loginSubmitButton) return;
  loginSubmitButton.disabled = isSubmitting;
  loginSubmitButton.classList.toggle('is-loading', isSubmitting);
  loginSubmitButton.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
}

function playLoginSuccessTransition() {
  if (!document.body || !authOverlay) {
    return Promise.resolve();
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDuration = reduceMotion ? 0 : LOGIN_SUCCESS_TRANSITION_MS;

  document.body.classList.add('auth-entering');
  authOverlay.classList.add('is-exiting');

  return new Promise(resolve => {
    window.setTimeout(() => {
      resolve();
    }, transitionDuration);
  });
}

function showLoginWelcome(userName = '') {
  const safeName = String(userName || '').trim() || 'equipo';
  const greeting = getTimeBasedWelcomeGreeting();
  const existing = document.getElementById('loginWelcomeOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'login-welcome-overlay';
  overlay.id = 'loginWelcomeOverlay';
  overlay.innerHTML = `
    <div class="login-welcome-card" role="status" aria-live="polite">
      <div class="login-welcome-kicker">HUARPE LOGISTICA</div>
      <div class="login-welcome-title">${greeting}</div>
      <div class="login-welcome-name">${escapeHtml(safeName)}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lifetime = reduceMotion ? 700 : LOGIN_WELCOME_MS;

  window.setTimeout(() => {
    overlay.classList.add('hide');
    window.setTimeout(() => overlay.remove(), reduceMotion ? 180 : 420);
  }, lifetime);
}

function getTimeBasedWelcomeGreeting(date = new Date()) {
  const hour = Number(date.getHours());
  if (hour >= 6 && hour < 12) return 'Buen dia';
  if (hour >= 12 && hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

async function logout(options = {}) {
  const reason = options.reason || 'manual';
  try {
    await apiRequest('/api/auth/logout', { method: 'POST', suppressAuthHandling: true });
  } catch (_error) {
  }

  DATA.usuarios = [];
  currentUser = null;
  csrfToken = '';
  if (typeof cleanupRealtimeSync === 'function') {
    cleanupRealtimeSync();
  }
  if (typeof cleanupDataSync === 'function') {
    cleanupDataSync();
  }
  if (typeof invalidateCache === 'function') {
    invalidateCache();
  }
  closeModal({ force: true });
  lockApplication();
  if (reason === 'inactivity') {
    setLoginMessage('Sesion cerrada por inactividad. Ingresá nuevamente para continuar.', 'warning');
    showToast('Sesion cerrada por inactividad', 'warning');
    return;
  }
  setLoginMessage('Sesión cerrada. Ingresá nuevamente para continuar.', 'info');
  showToast('Sesión cerrada', 'info');
}

function lockApplication() {
  stopInactivityTracking();
  document.body.classList.remove('auth-entering');
  authOverlay?.classList.remove('is-exiting');
  document.body.classList.add('auth-locked');
  authOverlay?.classList.add('show');
  pageContent.innerHTML = '';
  document.title = 'Iniciar sesion | HUARPE LOGISTICA';
  stopRealtimeHeartbeat();
  syncCurrentUserUI();
}

function unlockApplication() {
  startInactivityTracking();
  document.body.classList.remove('auth-entering');
  authOverlay?.classList.remove('is-exiting');
  document.body.classList.remove('auth-locked');
  authOverlay?.classList.remove('show');
  document.title = APP_TITLE;
  setLoginMessage('Ingresá con un usuario habilitado en el sistema.', 'info');
  syncCurrentUserUI();
}

function syncCurrentUserUI() {
  const user = currentUser;
  const initials = user ? getInitials(user.nombre) : '--';

  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (topbarAvatar) topbarAvatar.textContent = initials;
  if (sidebarUserName) sidebarUserName.textContent = user ? user.nombre : 'Sin usuario';
  if (topbarUserName) topbarUserName.textContent = user ? user.nombre : 'Sin usuario';
  if (sidebarUserRole) sidebarUserRole.textContent = user ? capitalize(user.rol) : 'Perfil no configurado';
  updateNavigationByPermissions();
}

function setLoginMessage(message, type) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.dataset.state = type || 'info';
}

function openAccountModal() {
  if (!currentUser) return;
  openModal('Sesión activa', `
    <div class="account-summary">
      <div class="avatar" style="width:48px;height:48px">${escapeHtml(getInitials(currentUser.nombre))}</div>
      <div>
        <h3 style="font-size:18px;margin-bottom:4px">${escapeHtml(currentUser.nombre)}</h3>
        <p style="color:var(--color-text-light);margin-bottom:6px">${escapeHtml(currentUser.email)}</p>
        <span class="status-badge status-servicio">${escapeHtml(currentUser.rol)}</span>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="closeModal">Cerrar</button>
    <button class="btn btn-primary" data-action="openChangePasswordModal"><i class="fa-solid fa-key"></i> Cambiar contraseña</button>
    <button class="btn btn-danger" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
  `);
}

function openChangePasswordModal() {
  if (!currentUser) return;
  openModal('Cambiar contraseña', `
    <div class="form-grid">
      <div class="form-group full"><label>Contraseña actual</label><input type="password" id="cpCurrent" placeholder="Ingresar contraseña actual"></div>
      <div class="form-group full"><label>Nueva contraseña</label><input type="password" id="cpNew" placeholder="Ingresar nueva contraseña"></div>
      <div class="form-group full"><label>Repetir nueva contraseña</label><input type="password" id="cpConfirm" placeholder="Repetir nueva contraseña"></div>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="openAccountModal">Volver</button>
    <button class="btn btn-primary" data-action="changeCurrentPassword"><i class="fa-solid fa-floppy-disk"></i> Guardar contraseña</button>
  `);
}

async function changeCurrentPassword() {
  if (!currentUser) return;

  const currentPassword = document.getElementById('cpCurrent')?.value || '';
  const newPassword = document.getElementById('cpNew')?.value || '';
  const confirmPassword = document.getElementById('cpConfirm')?.value || '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('Completá todos los campos de contraseña.', 'warning');
    return;
  }

  if (newPassword.length < 8) {
    showToast('La nueva contraseña debe tener al menos 8 caracteres.', 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('La confirmación no coincide con la nueva contraseña.', 'warning');
    return;
  }

  try {
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    closeModal();
    showToast('Contraseña actualizada correctamente.', 'success');
  } catch (error) {
    showToast(error.message || 'No se pudo actualizar la contraseña.', 'error');
  }
}

// Inactividad
function bindInactivityTracking() {
  if (inactivityTrackingBound) return;
  INACTIVITY_ACTIVITY_EVENTS.forEach(eventName => {
    document.addEventListener(eventName, handleInactivityActivity, true);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleInactivityActivity();
    }
  });
  inactivityTrackingBound = true;
}

function handleInactivityActivity() {
  if (!currentUser || inactivityWarningOpen) return;
  resetInactivityTimers();
}

function startInactivityTracking() {
  if (!currentUser) return;
  resetInactivityTimers();
}

function stopInactivityTracking() {
  if (inactivityWarningTimeoutId) {
    window.clearTimeout(inactivityWarningTimeoutId);
    inactivityWarningTimeoutId = null;
  }
  if (inactivityCountdownIntervalId) {
    window.clearInterval(inactivityCountdownIntervalId);
    inactivityCountdownIntervalId = null;
  }
  inactivityDeadlineAt = 0;
  closeInactivityWarning({ force: true });
}

function resetInactivityTimers() {
  if (!currentUser) return;
  if (inactivityWarningOpen) {
    closeInactivityWarning({ force: true });
  }
  if (inactivityWarningTimeoutId) {
    window.clearTimeout(inactivityWarningTimeoutId);
  }
  const warningDelay = Math.max(1000, getInactivityTimeoutMs() - INACTIVITY_WARNING_MS);
  inactivityWarningTimeoutId = window.setTimeout(() => {
    openInactivityWarning();
  }, warningDelay);
}

function openInactivityWarning() {
  if (!currentUser) return;
  inactivityWarningOpen = true;
  inactivityDeadlineAt = Date.now() + INACTIVITY_WARNING_MS;

  openModal('Sesion por inactividad', `
    <div class="inactivity-warning-body">
      <p>Tu sesion se cerrara por seguridad si no hay actividad.</p>
      <p>Tiempo restante: <strong id="inactiveCountdown">01:00</strong></p>
    </div>
  `, `
    <button class="btn btn-secondary" data-action="keepSessionAlive"><i class="fa-solid fa-clock-rotate-left"></i> Seguir conectado</button>
    <button class="btn btn-danger" data-action="logout"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>
  `);

  updateInactivityCountdown();
  if (inactivityCountdownIntervalId) {
    window.clearInterval(inactivityCountdownIntervalId);
  }
  inactivityCountdownIntervalId = window.setInterval(() => {
    const remainingMs = updateInactivityCountdown();
    if (remainingMs <= 0) {
      forceLogoutByInactivity();
    }
  }, 250);
}

function updateInactivityCountdown() {
  const countdownEl = document.getElementById('inactiveCountdown');
  const remainingMs = Math.max(0, inactivityDeadlineAt - Date.now());
  if (countdownEl) {
    countdownEl.textContent = formatMsAsClock(remainingMs);
  }
  return remainingMs;
}

function closeInactivityWarning({ force = false } = {}) {
  if (!inactivityWarningOpen) return;
  if (!force) return;

  inactivityWarningOpen = false;
  inactivityDeadlineAt = 0;
  if (inactivityCountdownIntervalId) {
    window.clearInterval(inactivityCountdownIntervalId);
    inactivityCountdownIntervalId = null;
  }
  closeModal({ force: true });
}

function keepSessionAlive() {
  if (!currentUser) return;
  closeInactivityWarning({ force: true });
  resetInactivityTimers();
  showToast(`Sesion extendida por ${normalizeInactivityTimeoutMinutes(uiPreferences.inactivityMinutes)} minutos.`, 'success');
}

function forceLogoutByInactivity() {
  closeInactivityWarning({ force: true });
  logout({ reason: 'inactivity' });
}

// Contraseña
function toggleLoginPasswordVisibility() {
  if (!loginPassword || !passwordToggle) return;

  const shouldShow = loginPassword.type === 'password';
  loginPassword.type = shouldShow ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', shouldShow ? 'true' : 'false');
  passwordToggle.setAttribute('aria-label', shouldShow ? 'Ocultar contraseña' : 'Mostrar contraseña');
  passwordToggle.innerHTML = shouldShow
    ? '<i class="fa-regular fa-eye-slash"></i>'
    : '<i class="fa-regular fa-eye"></i>';
}

function persistRememberSessionPreference() {
  if (!rememberSession) return;
  window.localStorage.setItem('huarpe.rememberSession', String(rememberSession.checked));
}
