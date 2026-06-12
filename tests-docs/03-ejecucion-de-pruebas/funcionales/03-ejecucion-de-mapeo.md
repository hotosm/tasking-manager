# Ejecución de casos de pruebas del MOD-03: Ejecución de Mapeo (Tasking)

## 1. ESC-3001 Solicitud de Bloqueo e Inicio de Tarea de Mapeo

### 1.1. Ejecución de CP-3001-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-01** | Validar el bloqueo de una tarea en estado `READY` por un usuario con nivel adecuado, licencia aceptada y sin bloqueos previos, seleccionando el editor web `iD`. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La tarea cambia a estado `LOCKED_FOR_MAPPING`. La interfaz de usuario carga correctamente el iframe del editor iD embebido en la plataforma. | La tarea cambia a `LOCKED_FOR_MAPPING` y la UI carga correctamente el entorno del editor iD integrado sin errores en consola. |

| Evidencia |
| :-- |
| Tarea bloqueada en la interfaz<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-01-tarea-bloqueada.png" width="800px" alt="CP-3001-01 - Tarea marcada como LOCKED_FOR_MAPPING"></a><br>Captura de la tarea bloqueada (candado) y que el usuario actual es el titular del bloqueo de la tarea debido a la opción `Reanudar Mapeo` y colo rojo del candado. |
| Editor iD cargado correctamente<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-01-editor-id-cargado.png" width="800px" alt="CP-3001-01 - Iframe del editor iD desplegado"></a><br>Captura del mapa satelital renderizado dentro de los límites del Bounding Box (BBOX) de la tarea seleccionada. |

---

### 1.2. Ejecución de CP-3001-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-02** | Validar el comportamiento del sistema al intentar mapear seleccionando el editor local `JOSM` cuando el servicio de control remoto (puerto 8111) se encuentra inactivo. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema otorga el bloqueo de la tarea (`LOCKED_FOR_MAPPING`), pero muestra una alerta visible al usuario indicando que "JOSM is not running". | El sistema muestra correctamente el modal de error de conexión con JOSM. Al verificar el estado, la tarea aparece bloqueada por el usuario activo, previniendo pérdida del candado. |

| Evidencia |
| :-- |
| Alerta de conexión fallida con JOSM<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-02-error-josm.png" width="800px" alt="CP-3001-02 - Modal de error JOSM is not running"></a><br>Notificación de la plataforma alertando al usuario que debe iniciar el software JOSM. |

---

### 1.3. Ejecución de CP-3001-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-03** | Validar que el sistema restringe el inicio de sesión de mapeo si el usuario no ha aceptado los términos y condiciones de la licencia asociada al proyecto. | Manual | Fallido | El botón no se bloques |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El bloqueo es denegado preventivamente (`UserLicenseError`). Aparece un modal de aceptación obligatoria de los términos de uso de las imágenes satelitales. | Al hacer clic en "Contribuir" y luego "Mapear Tarea", la petición sí procesa el bloqueo. No se despliega inmediatamente el modal con el texto de la licencia y los botones de aceptación. |

| Evidencia |
| :-- |
| Modal de Aceptación de Licencia<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-03-modal-licencia.png" width="800px" alt="CP-3001-03 - Modal de requerimiento de licencia"></a><br>Visualización del texto legal requerido. Pero no se evidencia bloqueo del boton Contribución |

---

### 1.4. Ejecución de CP-3001-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-04** | Validar que el sistema impide a un usuario (Mapper) mantener múltiples tareas bloqueadas simultáneamente para el mismo propósito (Mapeo). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema deniega el bloqueo de la segunda tarea solicitada y muestra una alerta/modal indicando que el usuario ya posee una tarea bloqueada (`UserAlreadyHasTaskLocked`). | La petición de bloqueo sobre la segunda tarea es rechazada con un HTTP 403. La UI muestra un modal informando sobre la restricción de concurrencia y provee un enlace hacia la tarea previamente bloqueada. |

| Evidencia |
| :-- |
| Alerta de Tareas Concurrentes<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-04-limite-concurrencia.png" width="800px" alt="CP-3001-04 - Modal UserAlreadyHasTaskLocked"></a><br>Mensaje del frontend indicando que se debe finalizar la tarea actual antes de solicitar una nueva. |

---

### 1.5. Ejecución de CP-3001-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-05** | Validar que el sistema impide bloquear para mapeo una tarea que se encuentra en un estado topográfico inconsistente (por ejemplo, `MAPPED`). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema deniega la acción por estado inválido (`InvalidTaskState`). La interfaz debe ocultar/deshabilitar el botón "Mapear Tarea" para tareas en dicho estado. | Al seleccionar una tarea en estado `MAPPED`, la interfaz oculta el botón "Mapear Tarea" y expone las acciones de validación (sujetas a permisos). |

| Evidencia |
| :-- |
| Estado de botón según selección de tarea<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-05-boton-deshabilitado.png" width="800px" alt="CP-3001-05 - Botón de mapeo ausente en tarea Mapped"></a><br>Visualización de la barra lateral sin opción de mapeo para la tarea completada. |

---

### 1.6. Ejecución de CP-3001-06

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-06** | Validar el rechazo de bloqueo cuando el nivel de experiencia del usuario (`BEGINNER`) es inferior al nivel requerido por la configuración del proyecto (`ADVANCED`). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El bloqueo es denegado (`UserPermissionError`). Aparece un mensaje explícito indicando que el usuario no cuenta con el nivel necesario para participar en este proyecto. | El sistema evalúa correctamente el nivel del usuario. La interfaz notifica la restricción mediante una alerta indicando que el nivel requerido es superior al actual. |

| Evidencia |
| :-- |
| Alerta de restricción por Nivel<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-06-error-nivel.png" width="800px" alt="CP-3001-06 - Mensaje UserPermissionError"></a><br>Notificación advirtiendo que solo usuarios de nivel Avanzado pueden contribuir. |

---

### 1.7. Ejecución de CP-3001-07

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3001-07** | Validar el comportamiento predeterminado cuando se solicita un bloqueo de tarea no seleccionando un tipo específico de editor. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La tarea selecciona un editor predeterminado ante la ausencia de un editor seleccinado. El sistema selecciona automáticamente el entorno web predeterminado (`iD`). | La tarea se bloqueó correctamente. La interfaz detectó la selección predeterminada de editor e inicializó la vista de mapeo utilizando el iframe del editor iD. |

| Evidencia |
| :-- |
| Selección de Editor web por Defecto<br><a href="#--------"><img src="tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-mapeado/CP-3001-07-fallback-editor.png" width="800px" alt="CP-3001-07 - Inicialización de iD como fallback"></a><br>Selección del entorno web por defecto tras omitir explícitamente la selección de editor en la configuración. |
