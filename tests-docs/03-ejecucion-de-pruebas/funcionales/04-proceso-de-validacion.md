# Ejecución de casos de pruebas del MOD-04: Proceso de Validación

## 1. ESC-4001 Bloqueo y Prevención de Auto-validación

### 1.1. Ejecución de CP-4001-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-01** | Validar que el sistema asigna la tarea al Validator, cambiando su estado a LOCKED_FOR_VALIDATION. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema asigna la tarea al Validator, mostrando la interfaz de validación y cambiando el estado a Locked. | El sistema asignó exitosamente la tarea al usuario logueado como Validator, permitiéndole interactuar en la vista de control de calidad. |

| Evidencia |
| :-- |
| Tarea bloqueada por Validator<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-01-01.png" width="800px" alt="CP-4001-01 - Tarea en pantalla de validación"></a><br>Pantalla de control de calidad de la tarea exitosamente bloqueada. |

---

### 1.2. Ejecución de CP-4001-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-02** | Impedir validación sobre una tarea mapeada por el propio usuario validador. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema alerta sobre la restricción de auto-validación y declina el requerimiento de bloqueo para evaluación. | Al intentar ingresar a revisar una tarea que mapeó el mismo usuario en sesión, el sistema arrojó la restricción de flujo y denegó el acceso de validación. |

| Evidencia |
| :-- |
| Bloqueo a la auto-validación<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-02-01.png" width="800px" alt="CP-4001-02 - Error prevención de auto validación"></a><br>Mensaje del sistema impidiendo el flujo de validación. |

---

## 2. ESC-4002 Evaluación de Calidad de Tareas Mapeadas

### 2.1. Ejecución de CP-4002-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-01** | Aprobar tarea marcándola como correctamente mapeada (VALIDATED). | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La tarea se registra en estado VALIDATED finalizando su revisión positivamente. | La tarea transicionó exitosamente a estado VALIDATED después de confirmarse en el panel y ser devuelta en verde. |

| Evidencia |
| :-- |
| Confirmación y estado Validated<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-01-01.png" width="800px" alt="CP-4002-01 - Tarea válida"></a><br>Pantalla del proyecto con la tarea ya figurando como validada exitosamente. |

---

### 2.2. Ejecución de CP-4002-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-02** | Rechazar tarea marcándola como incorrecta (INVALIDATED). | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La tarea transiciona a INVALIDATED con comentario agregado para revisión. | Se añadió exitosamente el estatus de Invalidada y el bloque de comentario exigiendo la corrección, quedando de rojo en el mapa. |

| Evidencia |
| :-- |
| Confirmación de Invalidación<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-02-01.png" width="800px" alt="CP-4002-02 - Tarea rechazada"></a><br>El mapa refleja la tarea invalidada con el comentario asociado en historial temporal. |

---

## 3. ESC-4003 Revertir acciones previas (Undo)

### 3.1. Ejecución de CP-4003-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-01** | Ejecución de "Undo" para revertir la última acción de categorización. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| Se revierte la categorización retornando al estado anterior, deshaciendo la acción y mostrando anotación en el timeline. | El sistema aceptó clicar en 'deshacer', anuló el flujo final y regresó la tarea al estatus previo como si la última acción no se hubiese cerrado. |

| Evidencia |
| :-- |
| Historial y reversión<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-01-01.png" width="800px" alt="CP-4003-01 - Acción deshecha"></a><br>Reflejo del historial retractando validaciones pasadas por Undo. |