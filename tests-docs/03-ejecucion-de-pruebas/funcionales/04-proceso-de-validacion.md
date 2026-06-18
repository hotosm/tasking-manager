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
| El sistema alerta sobre la restricción de auto-validación and declina el requerimiento de bloqueo para evaluación. | Al intentar ingresar a revisar una tarea que mapeó el mismo usuario en sesión, el sistema arrojó la restricción de flujo y denegó el acceso de validación. |

| Evidencia |
| :-- |
| Bloqueo a la auto-validación<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-02-01.png" width="800px" alt="CP-4001-02 - Error prevención de auto validación"></a><br>Mensaje del sistema impidiendo el flujo de validación. |

---

### 1.3. Ejecución de CP-4001-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-03** | Intento de bloqueo para validación por parte de un usuario con nivel de experiencia insuficiente (Mapper normal). | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema oculta la opción de validación o deniega el acceso con un mensaje de permisos insuficientes debido a la falta de experiencia requerida. | La interfaz detectó el perfil de Mapper sin los requerimientos mínimos de experiencia y ocultó por completo el control de bloqueo para revisión. |

| Evidencia |
| :-- |
| Controles de validación ocultos<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-03-01.png" width="800px" alt="CP-4001-03 - Permisos insuficientes en panel"></a><br>Vista del panel del mapa sin botones de gestión de calidad para usuarios no aptos. |

---

### 1.4. Ejecución de CP-4001-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-04** | Bloqueo grupal/masivo de múltiples tareas ajenas en estado MAPPED simultáneamente. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema asigna todas las tareas seleccionadas al usuario en función de Validator, pasando el conjunto completo al estado LOCKED_FOR_VALIDATION. | Al procesar la selección múltiple, el sistema bloqueó el lote de celdas ajenas simultáneamente y activó la barra de edición masiva de calidad. |

| Evidencia |
| :-- |
| Bloqueo por lote concedido<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-04-01.png" width="800px" alt="CP-4001-04 - Bloqueo múltiple exitoso"></a><br>Mapa reflejando el conjunto de tareas seleccionadas bajo el color de revisión grupal. |

---

### 1.5. Ejecución de CP-4001-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-05** | Intento de bloqueo masivo de tareas en lote con autoría mixta (ajenas y una propia). | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema bloquea las tareas de terceros and rechaza aisladamente o advierte sobre la tarea propia impidiendo que transicione. | El sistema inhabilitó el guardado grupal arrojando un modal de alerta que forzó la exclusión de la tarea propia mapeada por el usuario actual. |

| Evidencia |
| :-- |
| Alerta de lote mixto<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-05-01.png" width="800px" alt="CP-4001-05 - Advertencia de auto-validación masiva"></a><br>Modal del sistema rechazando el procesamiento por lote debido a la presencia de un elemento con autoría propia. |

---

### 1.6. Ejecución de CP-4001-06

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-06** | Intento de validación sobre una tarea en estado READY o LOCKED_FOR_MAPPING. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz de usuario deshabilita el botón de validación, imposibilitando la acción sobre estados no listos. | Al hacer clic en una celda que aún no ha completado la fase de mapeo, los controles del panel impidieron cualquier transición de validación. |

| Evidencia |
| :-- |
| Controles de calidad deshabilitados<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-06-01.png" width="800px" alt="CP-4001-06 - Celda en estado no listo"></a><br>Panel de visualización del mapa showing los botones bloqueados para tareas que no están en estado MAPPED. |

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
| La tarea transiciona a INVALIDATED con comentario agregado para revisión. | Se añadió exitosamente el estatus de Invalidada y el bloque de comentario exigiendo la corrección, quedando de amarillo en el mapa. |

| Evidencia |
| :-- |
| Interfaz de rechazo y edición de comentario<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-02-01.png" width="800px" alt="CP-4002-02 - Formulario de rechazo"></a><br>Vista del panel lateral con la opción "More work is required" seleccionada y el texto de corrección redactado.<br><br>Confirmación de Invalidación e Historial<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-02-02.png" width="800px" alt="CP-4002-02 - Tarea rechazada en historial"></a><br>Vista del modal central con la Tarea #5 en estado amarillo y la retroalimentación guardada en la cronología. |

---

### 2.3. Ejecución de CP-4002-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-03** | Intentar rechazar una tarea (Invalidar) dejando el campo de comentario obligatorio vacío. | Manual | Fallido | El sistema permite invalidar tareas con comentarios vacíos sin restricción ni alertas. |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema previene el envío, requiriendo que se adjunte obligatoriamente un comentario explicativo mediante un alert o estado de error. | El sistema procesó y aceptó el cambio de estado con el comentario vacío, permitiendo el envío sin mostrar ninguna alerta, bloqueo o mensaje de error en la interfaz. |

| Evidencia |
| :-- |
| Envío de invalidación con campo de texto vacío<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-03-01.png" width="800px" alt="CP-4002-03 - Formulario enviado sin texto"></a><br>Vista del panel lateral con la opción "More work is required" seleccionada y el cuadro de edición "Leave a comment..." totalmente vacío al momento de remitir la acción.<br><br>Persistencia de la tarea invalidada sin comentarios<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-03-02.png" width="800px" alt="CP-4002-03 - Estado guardado sin historial de texto"></a><br>Vista del modal central de la Tarea #4 en amarillo, confirmando la ausencia de registros con el mensaje informativo "No comments have been made on the task yet". |

---

### 2.4. Ejecución de CP-4002-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-04** | Enviar evaluaciones mixtas (Aprobar unas e Invalidar otras) sobre un lote de tareas bloqueadas simultáneamente. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema actualiza cada tarea a su estado asignado individualmente (VALIDATED / INVALIDATED), liberando los bloqueos correspondientes. | Al procesar la confirmación del lote, la API discriminó los estados y asignó de manera exacta los estados finales liberando el candado de cada celda. |

| Evidencia |
| :-- |
| Selección y asignación de estados en el lote<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-04-01.png" width="800px" alt="CP-4002-04 - Configuración de lote mixto"></a><br>Vista del panel lateral de edición múltiple con las tareas #6 y #8 marcadas como aprobadas ("Task well mapped") y la tarea #7 marcada para corrección ("More work is required").<br><br>Actualización e impacto en la cuadrícula general<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-04-02.png" width="800px" alt="CP-4002-04 - Resultados en mapa e historial"></a><br>Vista de la lista de tareas y el mapa general reflejando las tareas #6 y #8 con el estado definitivo "Terminada" (color verde) y la tarea #7 con el estado "Necesita más mapeo" (color amarillo). |

---

### 2.5. Ejecución de CP-4002-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-05** | Intentar evaluar una tarea retenida en revisión después de superar el tiempo límite de asignación (Timeout). | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema informa mediante un error de timeout ("Ya no tienes esta tarea asignada") and la tarea se devuelve a su estado anterior. | Al intentar mandar la evaluación tras expirar la sesión de bloqueo, el backend rechazó la petición por token vencido y limpió el panel lateral con la alerta correspondiente. |

| Evidencia |
| :-- |
| Alerta de expiración de asignación por timeout<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-05-01.png" width="800px" alt="CP-4002-05 - Error por timeout de validación"></a><br>Vista del cuadro de diálogo emergente con el mensaje "Your session has expired" sobre la Tarea #9, ofreciendo las alternativas para cerrar la advertencia o volver a bloquear el elemento con "Relock task".<br><br>Retorno de la tarea al estado anterior en el panel general<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-05-02.png" width="800px" alt="CP-4002-05 - Retorno de estado"></a><br>Vista de la lista de tareas y la cuadrícula del mapa general donde la Tarea #9 se ha liberado y figura nuevamente bajo el estado "Lista para validar" con su respectivo color celeste. |

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
| Solicitud de reversión desde el historial de actividades<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-01-01.png" width="800px" alt="CP-4003-01 - Solicitud de revalidación"></a><br>Vista del modal de la Tarea #8 con la opción para solicitar la revalidación tras haber sido marcada como validada en la cronología de eventos.<br><br>Confirmación del cambio de estado por Undo<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-01-02.png" width="800px" alt="CP-4003-01 - Confirmación de reversión de estado"></a><br>Vista del mensaje de advertencia flotante que solicita confirmar si se desea cambiar el estado del elemento de vuelta a "Lista para validar". |

---

### 3.2. Ejecución de CP-4003-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-02** | Presionar el botón "Undo" inmediatamente después de haber cambiado el estado de una tarea a INVALIDATED. | Manual | Fallido |  El botón "Undo" no se encuentra disponible ni se muestra en la interfaz tras invalidar una tarea. |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema permite devolver la tarea hacia bloqueado para revisión o Mapped para repensar la calificación, removiendo el estatus amarillo. | El sistema no presenta el botón "Undo" en la interfaz tras realizar la invalidación, imposibilitando por completo cualquier intento de revertir el estado o rescatar la tarea. |

| Evidencia |
| :-- |
| Ausencia absoluta del botón Undo en tarea invalidada<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-02-01.png" width="800px" alt="CP-4003-02 - Botón Undo Inexistente"></a><br>Vista del modal central de la Tarea #7 donde se constata la persistencia del estado "necesita más mapeo" (color amarillo) y la inexistencia total de un control o botón para deshacer la acción en la ventana de actividades. |

---

### 3.3. Ejecución de CP-4003-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-03** | Intentar aplicar "Undo" sobre una tarea cuya evaluación final fue realizada por otro usuario validador. | Manual | Fallido | El sistema expone de forma incorrecta el botón "Solicitar revalidación" (Undo), permitiendo revertir acciones ejecutadas por otros usuarios. |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La opción o botón "Undo" no está disponible (oculta/deshabilitada) o responde error de restricción, ya que la acción no pertenece al usuario actual. | El sistema no validó la autoría del último cambio de estado; a pesar de pertenecer a otro usuario, el control para revertir la acción se renderizó y quedó completamente habilitado en la interfaz. |

| Evidencia |
| :-- |
| Presencia indebida del control de reversión en tarea ajena<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-03-01.png" width="800px" alt="CP-4003-03 - Exposición de Undo en actividad ajena"></a><br>Vista del modal de la Tarea #2 donde se muestra activo el botón "Solicitar revalidación" en la parte superior derecha, ignorando que el historial de actividades registra la última validación bajo un usuario distinto. |

---

### 3.4. Ejecución de CP-4003-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-04** | Intentar accionar el botón "Undo" de manera consecutiva o recursiva sobre una misma tarea. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema devuelve error o deshabilita la opción notificando que no existe otra acción reciente atribuible en el historial inmediato para ser deshecha. | Tras consumarse la primera reversión con éxito, el sistema deshabilitó el botón impidiendo llamadas recursivas hacia atrás en la pila de historial. |

| Evidencia |
| :-- |
| Estado inicial previo a la reversión consecutiva<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-04-01.png" width="800px" alt="CP-4003-04 - Estado inicial antes de deshacer"></a><br>Vista del modal de la Tarea #6 mostrando el flujo regular en el historial donde el elemento figura como validado recientemente.<br><br>Bloqueo del control tras el primer uso de deshacer<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-04-02.png" width="800px" alt="CP-4003-04 - Botón deshabilitado para segundo intento"></a><br>Vista de la actualización en el historial de actividades donde el estado regresa a mapeado and se inhabilita cualquier acción posterior para revertir consecutivamente. |