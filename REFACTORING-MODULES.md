# REFACTORIZACIÓN MODULAR - HUARPE LOGÍSTICA

## 🎯 Estado del Proyecto

Se ha completado la **refactorización modular inicial** de la aplicación.  
El código monolítico de `app.js` (4,555 líneas) ha sido dividido en módulos semánticos y funcionales.

---

## 📁 Estructura de Módulos

```
js/
├── app-new.js                    [NUEVO] Punto de entrada refactorizado
├── app.js                        [ORIGINAL] Respaldo del código monolítico
├── data.js                       [SINCRONIZADO] Caché de datos
├── modules/
│   ├── constants.js              ✅ Constantes globales, roles, permisos
│   ├── state.js                  ✅ Variables de estado global
│   ├── utils.js                  ✅ Funciones helpers (formateo, validación, escape HTML)
│   ├── api.js                    ✅ Capa de comunicación con API
│   ├── auth.js                   ✅ Autenticación, sesión, inactividad, tema
│   ├── pages.js                  ✅ Renderizadores de páginas (páginas principales)
│   ├── pages-movilidades.js      [PRÓXIMO] Renderizador específico de movilidades
│   ├── pages-objetivos.js        [PRÓXIMO] Renderizador específico de objetivos
│   ├── pages-partes.js           [PRÓXIMO] Renderizador específico de partes
│   ├── pages-novedades.js        [PRÓXIMO] Renderizador específico de novedades
│   ├── ui-handlers.js            [PRÓXIMO] Manejadores de modales y formularios
│   ├── realtime.js               [PRÓXIMO] Sincronización en tiempo real
│   └── data-sync.js              [PRÓXIMO] Sincronización de datos
```

---

## ✅ Módulos Completados

### 1. **constants.js**
- `ROLE_PERMISSIONS`: Matriz de permisos por rol
- `VEHICLE_BRANDS`: Marcas de vehículos
- `VEHICLE_UNIT_TYPES`: Tipos de unidades
- `MONTHS_SPAN`: Opciones de rango de meses
- Todas las opciones y configuraciones estáticas

### 2. **state.js**
- `currentUser`: Usuario actual
- `csrfToken`: Token CSRF
- `currentPage`: Página actual
- `sidebarCollapsed`: Estado del sidebar
- `uiPreferences`: Preferencias de interfaz
- `realtimeState`: Estado de sincronización en tiempo real
- `presenceState`: Estado de presencia de usuarios

### 3. **utils.js**
- `escapeHtml()`: Escapa caracteres HTML
- `formatFecha()`: Formatea fechas según preferencias locales
- `provinciaLabel()`: Obtiene etiqueta legible de provincia
- `estadoBadge()`: Genera badge HTML para estado
- Funciones de validación (stubs)
- Funciones de formateo numérico

### 4. **api.js**
- `apiRequest()`: Wrapper central de fetch con autenticación CSRF
- Gestión automática de headers
- Manejo de respuestas y errores
- Redirige a login si sesión expira

### 5. **auth.js**
- `handleLogin()`: Gestiona login de usuarios
- `restoreSession()`: Restaura sesión guardada
- `logout()`: Cierra sesión
- `toggleLoginPasswordVisibility()`: Muestra/oculta contraseña
- `applyThemePreference()`: Aplica tema de interfaz
- `previewThemePreference()`: Vista previa de tema
- `persistRememberSessionPreference()`: Guarda preferencia de recordar sesión
- `bindInactivityTracking()`: Inicia seguimiento de inactividad
- Funciones de manejo de inactividad
- Función de cambio de contraseña

### 6. **pages.js** (NUEVO)
- `renderInicio()`: Página de inicio con resumen
- `renderMovilidades()`: Lista de movilidades con filtros
- `renderRequerimientos()`: Lista de requerimientos
- `renderCombustibles()`: Gestión de combustibles
- `renderObjetivos()`: Lista de objetivos
- `renderPartes()`: Lista de partes
- `renderNovedades()`: Lista de novedades con alertas
- `renderReportes()`: Sección de reportes
- `renderConfiguracion()`: Configuración de usuario
- `renderUsuarios()`: Gestión de usuarios (si tienes permisos)

---

## 🔧 app-new.js - Punto de Entrada

`app-new.js` coordina toda la aplicación:
- Carga referencias del DOM
- Vincula eventos de navegación
- Coordina renderizado de páginas
- Gestiona tiempo real y presencia de usuarios
- Sincroniza datos en tiempo real

**Orden de carga en index.html:**
```html
<script src="js/modules/constants.js"></script>
<script src="js/modules/state.js"></script>
<script src="js/modules/utils.js"></script>
<script src="js/modules/api.js"></script>
<script src="js/modules/auth.js"></script>
<script src="js/modules/pages.js"></script>
<script src="js/data.js"></script>
<script src="js/app-new.js"></script>
```

---

## 🚀 Cómo Usar

### **OPCIÓN 1: Usar Nueva Versión Modular** (recomendado)
1. La nueva versión ya está activada en `index.html`
2. Abre la aplicación normalmente
3. Debe funcionar igual que antes pero con código modularizado

### **OPCIÓN 2: Volver a Versión Original**
Si encuentras problemas con la versión modular:
1. En `index.html`, comenta los `<script>` de módulos
2. Descomenta: `<script src="js/app.js"></script>`
3. Guarda y recarga

---

## ⚙️ Ventajas de esta Arquitectura

✅ **Modular**: Cada módulo tiene una responsabilidad única  
✅ **Mantenible**: Más fácil encontrar y modificar código específico  
✅ **Tests**: Cada módulo puede probarse independientemente  
✅ **Escalable**: Agregar nuevas funciones es más simple  
✅ **Sin Dependencias**: No requiere bundler, webpack, etc.  
✅ **Backward Compatible**: Puede coexistir con versión original  

---

## 🔄 Próximos Pasos

### **Fase 2: Módulos de Renderizado Especializados**
- Extraer lógica específica de cada página a módulos individuales
- Crear `pages-movilidades.js`, `pages-objetivos.js`, etc.

### **Fase 3: Manejadores UI**
- Crear `ui-handlers.js` con todos los manejadores de modales y formularios
- Consolidar funciones de edición, eliminación, creación

### **Fase 4: Sincronización Real-time**
- Crear `realtime.js` con sincronización en vivo
- Crear `data-sync.js` con sincronización de datos

### **Fase 5: Integración y Tests**
- Pruebas de integración completa
- Validar que NO haya cambios en funcionalidad
- Documentación final

---

## 📋 Checklist de Validación

- [ ] Aplicación carga sin errores de consola
- [ ] Login funciona normalmente
- [ ] Páginas se renderizan correctamente
- [ ] Navegación funciona
- [ ] Búsqueda global funciona
- [ ] Temas se aplican correctamente
- [ ] Sesión se restaura (si hay "Recordar sesión" activado)
- [ ] Logout funciona
- [ ] Modales cierran correctamente
- [ ] No hay alertas en consola

---

## 📝 Notas Técnicas

### Dependencias Entre Módulos
```
constants.js
    ↓
state.js → usa ROLE_PERMISSIONS de constants
    ↓
utils.js → sin dependencias
    ↓
api.js → usa state (csrfToken, currentUser)
    ↓
auth.js → usa api, state, utils
    ↓
pages.js → usa state, utils, api, constants
    ↓
app-new.js → carga todo y coordina
```

### Variables Globales Necesarias
- `DATA`: Caché de datos (desde `data.js`)
- `currentUser`: Usuario autenticado (desde `state.js`)
- `csrfToken`: Token CSRF (desde `state.js`)
- `pageContent`: Elemento DOM para contenido (desde `app-new.js`)
- `uiPreferences`: Preferencias de UI (desde `state.js`)

### Funciones Globales Principales
- `renderPage(page, filter)`: Renderiza una página
- `navigateTo(page, filter)`: Navega a una página
- `showToast(msg, type)`: Muestra notificación
- `openModal(title, body, footer)`: Abre modal
- `closeModal()`: Cierra modal
- `apiRequest(url, options)`: Hace petición a API

---

## 🐛 Troubleshooting

### "Funciones no definidas"
→ Verifica que los módulos se carguen en orden correcto en `index.html`

### "CSRF token inválido"
→ Comprueba que `constants.js` esté cargado antes de `auth.js`

### "API calls no funcionan"
→ Verifica que `api.js` esté cargado después de `state.js`

### "Páginas no se renderizan"
→ Comprueba que `pages.js` esté cargado antes de `app-new.js`

---

## 📚 Referencias

**Grupo de Módulos:** Constantes → Estado → Utils → API → Auth → Páginas → App

**Antiguo archivo monolítico:** `js/app.js` (backup disponible)

---

**Último cambio:** 2024  
**Versión:** 2.0 (Modular)  
**Estado:** En construcción progresiva
