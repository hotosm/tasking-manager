# Wiki de Pruebas — Escarabajo Rinoceronte

**Proyecto:** HOT OSM Tasking Manager  
**Curso:** Pruebas de Software — Sprint 2 (Hito 2)  
**Repositorio:** [escarabajo-rinoceronte/gestor-tareas-pruebas](https://github.com/escarabajo-rinoceronte/gestor-tareas-pruebas)

> **Esta wiki se actualiza automáticamente** al hacer push a `develop`. No editar directamente desde la web de GitHub.

---

## Accesos rápidos — Entregables Hito 2

| Entregable | Documento |
|---|---|
| Plan de Pruebas Unitarias | [[plan pruebas unitarias]] |
| Plan de Pruebas Funcionales | [[plan pruebas funcionales]] |
| Plan de Pruebas de Integración | [[plan pruebas integracion]] |
| Informe Unitarias Frontend | [[01 ejecucion pruebas unitarias frontend]] |
| Informe Funcionales — Mapeo (MOD-03) | [[03 ejecucion ejecucion de mapeo]] |
| Informe Funcionales — Validación (MOD-04) | [[04 ejecucion proceso de validacion]] |
| Informe Funcionales — Administración (MOD-05) | [[05 ejecucion administracion de proyectos]] |

---

## Estructura de la documentación

```
1. Planificación y Gestión
   ├── Plan general de pruebas (introducción, estrategia, recursos, riesgos)
   ├── Entorno de pruebas (Linux, Windows/Software)
   ├── Roles del sistema (Mapper, Validator, Admin...)
   ├── Plan de pruebas unitarias
   ├── Plan de pruebas funcionales
   └── Plan de pruebas de integración

2. Diseño de Pruebas
   ├── Funcionales → 7 módulos del sistema (128 casos de caja negra)
   └── Unitarias  → 3 módulos del backend (seguridad, servicios, modelos)

3. Ejecución de Pruebas
   ├── Unitarias → Frontend: 1,090 casos ejecutados
   └── Funcionales → MOD-03, MOD-04, MOD-05: 75 casos ejecutados con evidencia
```

---

## Roles del sistema evaluados

El sistema HOT OSM Tasking Manager define roles de usuario jerárquicos que condicionan el comportamiento esperado en cada caso de prueba. Ver: [[especificacion roles sistema]]

---

## Entorno de pruebas

- **Linux (Docker):** [[entorno pruebas linux]]  
- **Windows / Software:** [[entorno pruebas software]]