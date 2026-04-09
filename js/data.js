// ===== MOCK DATA =====

const DATA = {
  movilidades: [
    { id: 1, patente: 'MZA-001', descripcion: 'Ford Ranger 2022', estado: 'disponible', provincia: 'mendoza', objetivo: 'barrick', ubicacion: 'Mendoza Capital', ultimaNovedad: 'Sin novedades', chofer: 'Carlos Pérez' },
    { id: 2, patente: 'MZA-002', descripcion: 'Toyota Hilux 2021', estado: 'servicio', provincia: 'mendoza', objetivo: 'barrick', ubicacion: 'Ruta 40 km 120', ultimaNovedad: 'Cambio aceite 01/04', chofer: 'Luis García' },
    { id: 3, patente: 'SJN-001', descripcion: 'VW Amarok 2023', estado: 'mantenimiento', provincia: 'san-juan', objetivo: 'minera', ubicacion: 'Taller Central', ultimaNovedad: 'Falla en frenos', chofer: 'Miguel Torres' },
    { id: 4, patente: 'SJN-002', descripcion: 'Nissan Frontier 2022', estado: 'disponible', provincia: 'san-juan', objetivo: 'gema', ubicacion: 'San Juan Ciudad', ultimaNovedad: 'Sin novedades', chofer: 'Juan Rodríguez' },
    { id: 5, patente: 'SCZ-001', descripcion: 'Chevrolet S10 2021', estado: 'servicio', provincia: 'santa-cruz', objetivo: 'barrick', ubicacion: 'Santa Cruz Norte', ultimaNovedad: 'Recorrido normal', chofer: 'Pablo Díaz' },
    { id: 6, patente: 'SCZ-002', descripcion: 'Mitsubishi L200 2022', estado: 'fuera', provincia: 'santa-cruz', objetivo: 'urbano', ubicacion: 'Depósito SC', ultimaNovedad: 'Motor fuera de servicio', chofer: 'Roberto Sosa' },
    { id: 7, patente: 'MZA-003', descripcion: 'Ford Ranger 2020', estado: 'disponible', provincia: 'mendoza', objetivo: 'urbano', ubicacion: 'Mendoza Sur', ultimaNovedad: 'Sin novedades', chofer: 'Diego Molina' },
    { id: 8, patente: 'SJN-003', descripcion: 'Toyota Hilux 2023', estado: 'servicio', provincia: 'san-juan', objetivo: 'minera', ubicacion: 'Minera Norte', ultimaNovedad: 'Operativo', chofer: 'Fernando López' },
  ],

  objetivos: [
    { id: 1, nombre: 'Barrick', descripcion: 'Minería de oro - Zona Andina', icono: 'fa-mountain', unidades: 4, choferes: 4, partes: 87, novedades: 3, estado: 'activo' },
    { id: 2, nombre: 'Minera', descripcion: 'Operaciones mineras generales', icono: 'fa-industry', unidades: 3, choferes: 3, partes: 54, novedades: 1, estado: 'activo' },
    { id: 3, nombre: 'Urbano', descripcion: 'Logística urbana y distribución', icono: 'fa-city', unidades: 2, choferes: 2, partes: 31, novedades: 0, estado: 'activo' },
    { id: 4, nombre: 'Gema / Gemera', descripcion: 'Proyecto Gema - Zona Sur', icono: 'fa-gem', unidades: 2, choferes: 2, partes: 22, novedades: 2, estado: 'activo' },
    { id: 5, nombre: 'Otros', descripcion: 'Objetivos varios y ocasionales', icono: 'fa-ellipsis', unidades: 1, choferes: 1, partes: 8, novedades: 0, estado: 'inactivo' },
  ],

  partes: [
    { id: 1, fecha: '2026-04-09', provincia: 'mendoza', objetivo: 'Barrick', unidad: 'MZA-002', chofer: 'Luis García', kmInicial: 45200, kmFinal: 45380, combustible: 40, observaciones: 'Ruta normal', desperfectos: 'Ninguno', estado: 'completo' },
    { id: 2, fecha: '2026-04-09', provincia: 'santa-cruz', objetivo: 'Barrick', unidad: 'SCZ-001', chofer: 'Pablo Díaz', kmInicial: 32100, kmFinal: 32290, combustible: 35, observaciones: 'Sin novedad', desperfectos: 'Ninguno', estado: 'completo' },
    { id: 3, fecha: '2026-04-08', provincia: 'mendoza', objetivo: 'Urbano', unidad: 'MZA-003', chofer: 'Diego Molina', kmInicial: 22400, kmFinal: 22510, combustible: 20, observaciones: 'Tráfico normal', desperfectos: 'Ruido leve en suspensión', estado: 'observado' },
    { id: 4, fecha: '2026-04-08', provincia: 'san-juan', objetivo: 'Minera', unidad: 'SJN-003', chofer: 'Fernando López', kmInicial: 18900, kmFinal: 19120, combustible: 45, observaciones: 'Carga completa', desperfectos: 'Ninguno', estado: 'completo' },
    { id: 5, fecha: '2026-04-07', provincia: 'san-juan', objetivo: 'Gema / Gemera', unidad: 'SJN-002', chofer: 'Juan Rodríguez', kmInicial: 12000, kmFinal: 12180, combustible: 30, observaciones: 'Ruta cortada km 45', desperfectos: 'Ninguno', estado: 'completo' },
    { id: 6, fecha: '2026-04-07', provincia: 'mendoza', objetivo: 'Barrick', unidad: 'MZA-001', chofer: 'Carlos Pérez', kmInicial: 38000, kmFinal: 38200, combustible: 38, observaciones: 'Sin novedad', desperfectos: 'Ninguno', estado: 'completo' },
  ],

  novedades: [
    { id: 1, titulo: 'Falla en sistema de frenos', unidad: 'SJN-001', chofer: 'Miguel Torres', objetivo: 'Minera', fecha: '2026-04-09', tipo: 'rotura', prioridad: 'urgente', descripcion: 'El vehículo presenta falla total en el sistema de frenos. Se derivó al taller central en San Juan. Se requiere reemplazo de pastillas y calibración de calipers.', estado: 'urgente' },
    { id: 2, titulo: 'Motor fuera de servicio', unidad: 'SCZ-002', chofer: 'Roberto Sosa', objetivo: 'Urbano', fecha: '2026-04-08', tipo: 'rotura', prioridad: 'urgente', descripcion: 'El motor presenta falla crítica. Requiere diagnóstico completo en taller especializado. Unidad inmovilizada.', estado: 'urgente' },
    { id: 3, titulo: 'Ruido en suspensión', unidad: 'MZA-003', chofer: 'Diego Molina', objetivo: 'Urbano', fecha: '2026-04-08', tipo: 'mantenimiento', prioridad: 'pendiente', descripcion: 'Se detectó ruido leve en suspensión delantera durante el parte diario. Se programa revisión para la próxima semana.', estado: 'pendiente' },
    { id: 4, titulo: 'Cambio de aceite realizado', unidad: 'MZA-002', chofer: 'Luis García', objetivo: 'Barrick', fecha: '2026-04-01', tipo: 'mantenimiento', prioridad: 'resuelto', descripcion: 'Se realizó cambio de aceite y filtros de motor. Vehículo en condiciones óptimas de servicio.', estado: 'resuelto' },
    { id: 5, titulo: 'Ruta cortada - desvío tomado', unidad: 'SJN-002', chofer: 'Juan Rodríguez', objetivo: 'Gema / Gemera', fecha: '2026-04-07', tipo: 'retraso', prioridad: 'resuelto', descripcion: 'Ruta 40 cortada en km 45 por obras viales. Se tomó desvío alternativo. Llegada con 45 minutos de retraso.', estado: 'resuelto' },
  ],

  usuarios: [
    { id: 1, nombre: 'Juan Díaz', email: 'jdiaz@empresa.com', rol: 'administrador', estado: 'activo', ultima: '2026-04-09' },
    { id: 2, nombre: 'María González', email: 'mgonzalez@empresa.com', rol: 'supervisor', estado: 'activo', ultima: '2026-04-09' },
    { id: 3, nombre: 'Pedro Martínez', email: 'pmartinez@empresa.com', rol: 'operador', estado: 'activo', ultima: '2026-04-08' },
    { id: 4, nombre: 'Ana López', email: 'alopez@empresa.com', rol: 'operador', estado: 'inactivo', ultima: '2026-03-20' },
  ],
};
