# Reporte de Ejecución: `<Nombre del Sprint / Release>`

> **Fecha de Ejecución:** `<YYYY-MM-DD>`  
> **Entorno:** `<Local, Staging, Producción>`  
> **QA Asignado:** `<Nombre del QA>`  
> **Versión del Código (Commit/Tag):** `<Ej: v1.4.2 o #abc1234>`

## 1. Resumen de Ejecución
Este documento registra los resultados de la ejecución de pruebas para el ciclo actual, asegurando la calidad antes de la liberación.

| Módulos Evaluados | Casos Totales | Aprobados | Fallidos | Bloqueados | Tasa de Éxito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `<Módulo 1>` | `10` | `9` | `1` | `0` | `90%` |
| `<Módulo 2>` | `5` | `5` | `0` | `0` | `100%` |

## 2. Detalle de Ejecución por Caso
*Nota: Los casos corresponden a los IDs definidos en la carpeta `02-diseno-de-pruebas/`.*

| ID del Caso | Módulo | Estado | Enlace al Defecto (Issue) si falló | Notas de Ejecución / Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| `TC-MOD-U01` | `<Módulo>` | Pasó | N/A | `<Enlace a log o screenshot si es necesario>` |
| `TC-MOD-I01` | `<Módulo>` | Falló | [#142](link_al_issue) | Devuelve HTTP 500 en lugar de HTTP 400 |

## 3. Reporte de Cobertura (Coverage)
A continuación se detalla la cobertura técnica alcanzada en este ciclo de ejecución (generada por `pytest-cov`, `Jacoco`, etc.):

*   **Cobertura Global de la Aplicación:** `<XX%>`
*   **Cobertura del Módulo `<Modulo 1>`:** `<YY%>`

### Evidencia de Cobertura
```text
# Pegar aquí el output relevante de la consola del coverage, por ejemplo:
Name                            Stmts   Miss  Cover
---------------------------------------------------
src/services/org_service.py       150     10    93%
src/utils/validators.py            45      0   100%
```

## 4. Conclusión y Sign-off
*   [ ] **Aprobado para Producción:** El incremento cumple con los Criterios de Aceptación y no existen bugs de prioridad Crítica/Alta.
*   [ ] **Rechazado:** Se deben solventar los defectos detallados en la sección 2 antes de proceder.
