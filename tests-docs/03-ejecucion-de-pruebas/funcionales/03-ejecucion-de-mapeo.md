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
| Tarea bloqueada en la interfaz<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-01-tarea-bloqueada.png" width="800px" alt="CP-3001-01 - Tarea marcada como LOCKED_FOR_MAPPING"></a><br>Captura de la tarea bloqueada (candado) y que el usuario actual es el titular del bloqueo de la tarea debido a la opción `Reanudar Mapeo` y colo rojo del candado. |
| Editor iD cargado correctamente<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-01-editor-id-cargado.png" width="800px" alt="CP-3001-01 - Iframe del editor iD desplegado"></a><br>Captura del mapa satelital renderizado dentro de los límites del Bounding Box (BBOX) de la tarea seleccionada. |

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
| Alerta de conexión fallida con JOSM<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-02-error-josm.png" width="800px" alt="CP-3001-02 - Modal de error JOSM is not running"></a><br>Notificación de la plataforma alertando al usuario que debe iniciar el software JOSM. |

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
| Modal de Aceptación de Licencia<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-03-modal-licencia.png" width="800px" alt="CP-3001-03 - Modal de requerimiento de licencia"></a><br>Visualización del texto legal requerido. Pero no se evidencia bloqueo del boton Contribución |

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
| Alerta de Tareas Concurrentes<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-04-limite-concurrencia.png" width="800px" alt="CP-3001-04 - Modal UserAlreadyHasTaskLocked"></a><br>Mensaje del frontend indicando que se debe finalizar la tarea actual antes de solicitar una nueva. |

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
| Estado de botón según selección de tarea<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-05-boton-deshabilitado.png" width="800px" alt="CP-3001-05 - Botón de mapeo ausente en tarea Mapped"></a><br>Visualización de la barra lateral sin opción de mapeo para la tarea completada. |

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
| Alerta de restricción por Nivel<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-06-error-nivel.png" width="800px" alt="CP-3001-06 - Mensaje UserPermissionError"></a><br>Notificación advirtiendo que solo usuarios de nivel Avanzado pueden contribuir. |

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
| Selección de Editor web por Defecto<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3001-07-fallback-editor.png" width="800px" alt="CP-3001-07 - Inicialización de iD como fallback"></a><br>Selección del entorno web por defecto tras omitir explícitamente la selección de editor en la configuración. |

## 2. ESC-3002 Liberación y Envío de Tarea de Mapeo (Submit)

### 2.1. Ejecución de CP-3002-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3002-01** | Validar que el titular del bloqueo de una tarea (`LOCKED_FOR_MAPPING`) puede finalizar el mapeo seleccionando la opción "Yes" (Mapeo completo). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema cambia el estado topográfico de la tarea a `MAPPED`, elimina la asociación temporal (`lockHolder`) con el usuario y añade la acción al historial de la tarea. | La solicitud se procesó correctamente (`HTTP 200`). La interfaz actualizó el color de la tarea en el mapa, y en la pestaña "History" se reflejó el evento `STATE_CHANGE: MAPPED` bajo el nombre del usuario. |

| Evidencia |
| :-- |
| Confirmación de estado Mapped<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3002-01-tarea-mapped.png" width="800px" alt="CP-3002-01 - Interfaz mostrando estado Mapped y botón Submit"></a><br>Captura del panel lateral durante la selección de la opción "Yes" para finalizar la tarea. |
| Actualización del historial de la tarea<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3002-01-historial.png" width="800px" alt="CP-3002-01 - Registro de la acción en TaskHistory"></a><br>Vista del historial comprobando la transición de estado registrada en la base de datos. |

---

### 2.2. Ejecución de CP-3002-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3002-02** | Validar que el titular de la tarea puede liberar (abortar o pausar) el mapeo seleccionando la opción "No" (Mapeo incompleto). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La tarea revierte su estado a `READY`, permitiendo que quede disponible nuevamente en el *pool* del proyecto para ser tomada por otro usuario. Se remueve el bloqueo. | Tras seleccionar "No", la interfaz retornó el color de la tarea a su estado original (transparente/blanco). La API de consulta de tareas la listó nuevamente con estado `READY` sin asignación de titular. |

| Evidencia |
| :-- |
| Liberación de tarea a estado Ready<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3002-02-tarea-ready.png" width="800px" alt="CP-3002-02 - Selección de la opción No"></a><br>Luego de seleccionar NO, la tarea queda disponible para ser mapeada por cualquier colaborador |

---

### 2.3. Ejecución de CP-3002-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3002-03** | Validar la prevención de transiciones inválidas: el panel de liberación ("Submit") no debe estar visible si el usuario selecciona una tarea libre (`READY`) en el mapa. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| Al seleccionar una tarea en estado `READY`, la UI expone el botón de inicio ("Map a task"), ocultando completamente el bloque de opciones (Yes/No) y el botón "Submit", evitando envíos ilegales. | Se seleccionó una tarea libre en el explorador. En la parte inferior se muestra solo el botón para iniciar mapeo. No se renderizaron controles de finalización (Submit). |

| Evidencia |
| :-- |
| Controles de submit ocultos (Tarea Ready)<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3002-03-no-submit-ready.png" width="800px" alt="CP-3002-03 - Interfaz sin opciones de Submit en READY"></a><br>No se expone opciones de transición de finalización, solo el boton para iniciar el mapeo |

---

### 2.4. Ejecución de CP-3002-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3002-04** | Validar la protección de autoría visual: la interfaz debe ocultar el panel de liberación ("Submit") y controles de edición al seleccionar una tarea bloqueada por un tercero. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| Al seleccionar una tarea con indicador de bloqueo (candado), el panel muestra "Locked by [Nombre]". No se muestran botones de edición ni el panel de preguntas de "Submit". | Se hizo clic sobre una tarea bloqueada por otro usuario. El panel renderizó la alerta "Locked for mapping by [Usuario]" y eliminó todo control de acción (botones), garantizando que no se pueda interferir con el trabajo ajeno desde la UI. |

| Evidencia |
| :-- |
| Bloqueo visual por pertenencia ajena<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3002-04-locked-by-other.png" width="800px" alt="CP-3002-04 - Tarea ajena bloqueada en UI"></a><br>Panel lateral notificando la titularidad del bloqueo y suprimiendo controles de mapeo o envío. |

---

### 2.5. Ejecución de CP-3002-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3002-05** | Validar que el panel de liberación ("Submit") permanece oculto al inspeccionar una tarea que ya ha sido finalizada (`MAPPED`) por el usuario u otros. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El panel lateral muestra el estado actual de la tarea (Mapeada, en espera de validación). Los controles de "Submit" de la etapa de mapeo no se renderizan, respetando la secuencia del ciclo de vida. | Al seleccionar una tarea en color azul (`MAPPED`), la UI mostró el historial y los botones correspondientes a validación (si los permisos lo permiten), confirmando que las opciones de "Submit" de mapeo desaparecieron del DOM. |

| Evidencia |
| :-- |
| Ocultamiento de controles post-mapeo<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3002-05-mapped-task.png" width="800px" alt="CP-3002-05 - Ausencia de controles Submit en tarea Mapped"></a><br>Visualización del estado de una tarea lista para validar, evidenciando el respeto de las transiciones de estado en la interfaz. |


## 3. ESC-3003 División de Tarea de Mapeo (Split Task)

### 3.1. Ejecución de CP-3003-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3003-01** | Validar que el sistema permite a un usuario dividir (Split) una tarea bloqueada bajo su titularidad cuando el nivel de zoom cartográfico es válido (Límite Superior Válido = 17). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema ejecuta la división exitosamente. El polígono de la tarea original desaparece del mapa y es reemplazado por 4 nuevas sub-tareas. El contador general de tareas del proyecto se incrementa en 3. | Al presionar el botón "Split task" en una tarea de nivel de zoom 17, el sistema procesó la solicitud sin errores. El mapa se refrescó mostrando la grilla subdividida en 4 sectores más pequeños dentro del espacio original. |

| Evidencia |
| :-- |
| División de tarea completada (Zoom 17)<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3003-01-split-success.png" width="800px" alt="CP-3003-01 - Grilla de tarea dividida en 4"></a><br>Visualización del mapa donde se aprecia el fraccionamiento de la tarea original en sub-tareas manejables. Al lado derecho se observa las 4 tareas recientes disponibles para mapear |

---

### 3.2. Ejecución de CP-3003-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3003-02** | Validar que el sistema restringe matemáticamente la división de una tarea si el nivel de zoom cartográfico excede el máximo soportado (Límite Superior Inválido = 18). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz muestra una notificación indicando que la tarea es demasiado pequeña para dividirse (`SmallToSplit`). El polígono original se mantiene intacto y no se alteran los contadores del proyecto. | Tras intentar dividir una sub-tarea que ya se encontraba en el nivel de zoom 18, la UI arrojó la alerta de error esperada ("Task is too small to split"). La geometría en el mapa no sufrió alteraciones. |

| Evidencia |
| :-- |
| Alerta de restricción por zoom máximo<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3003-02-split-error-zoom.png" width="800px" alt="CP-3003-02 - Toast error de tarea muy pequeña"></a><br>Captura de pantalla de la notificación del sistema advirtiendo la imposibilidad técnica de subdividir a esa escala. |

---

### 3.3. Ejecución de CP-3003-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3003-03** | Validar que la interfaz de usuario oculta o deshabilita la opción de "Split Task" si el usuario selecciona una tarea libre en el mapa (Estado `READY`), previniendo operaciones sobre geometrías no bloqueadas. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El panel lateral, al renderizar los detalles de una tarea `READY`, no debe exponer el botón o enlace "Split task", forzando al usuario a iniciar la sesión de mapeo (Lock) primero. | Se seleccionó una tarea libre (blanca/transparente). El panel de control se actualizó mostrando la descripción y el botón "Map Task", pero omitió el botón de división, confirmando el correcto control de estado en la UI. |

| Evidencia |
| :-- |
| Opción de Split oculta en tarea libre<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3003-03-no-split-ready.png" width="800px" alt="CP-3003-03 - Panel sin botón de split en estado Ready"></a><br>Panel lateral evidenciando la adaptación de los controles funcionales según el estado previo de la tarea. |

---

### 3.4. Ejecución de CP-3003-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-3003-04** | Validar que el sistema protege la geometría de tareas bloqueadas por terceros, ocultando la opción "Split Task" cuando un usuario inspecciona una tarea con titularidad ajena. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| Al seleccionar una tarea con el indicador visual de bloqueo (candado), la interfaz indica "Locked by [User]" y retira por completo el botón "Split task" del DOM. | Se inspeccionó una tarea actualmente en mapeo por otro voluntario. El panel lateral renderizó la advertencia de titularidad ("Locked for mapping by...") y no mostró ningún control interactivo que permitiera alterar o dividir la geometría. |

| Evidencia |
| :-- |
| Opción de Split oculta en tarea ajena<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-03-ejecucion-mapeado/CP-3003-04-no-split-other-user.png" width="800px" alt="CP-3003-04 - Ausencia de controles en tarea bloqueada por tercero"></a><br>Vista de protección de autoría, confirmando que la división cartográfica exige propiedad activa del bloqueo. |
