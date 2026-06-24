# Proceso de Validación: Ejecución de casos de pruebas del MOD-04

## Resumen de Ejecución (Métricas)

| Métrica | Valor |
|---|---|
| **Casos preexistentes** | 0 |
| **Nuevos casos creados** | 25 |
| **Total de casos diseñados** | 25 |
| **Casos ejecutados con evidencia** | 25 (100%) |
| **Casos exitosos (PASS)** | 24 (96%) |
| **Casos fallidos (FAIL)** | 1 (4%) |
| **Defectos reportados** | 1 (Issue pendiente) |

---

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
| Tarea bloqueada por Validator<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-01-01.jpg" width="800px" alt="CP-4001-01 - Tarea en pantalla de validación"></a><br>Pantalla de control de calidad de la tarea exitosamente bloqueada. |

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
| Bloqueo a la auto-validación<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-02-01.jpg" width="800px" alt="CP-4001-02 - Error prevención de auto validación"></a><br>Mensaje del sistema impidiendo el flujo de validación. |

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
| Controles de validación ocultos<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-03-01.jpg" width="800px" alt="CP-4001-03 - Permisos insuficientes en panel"></a><br>Vista del panel del mapa sin botones de gestión de calidad para usuarios no aptos. |

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
| Bloqueo por lote concedido<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-04-01.jpg" width="800px" alt="CP-4001-04 - Bloqueo múltiple exitoso"></a><br>Mapa reflejando el conjunto de tareas seleccionadas bajo el color de revisión grupal. |

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
| Alerta de lote mixto<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-05-01.jpg" width="800px" alt="CP-4001-05 - Advertencia de auto-validación masiva"></a><br>Modal del sistema rechazando el procesamiento por lote debido a la presencia de un elemento con autoría propia. |

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
| Controles de calidad deshabilitados<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-06-01.jpg" width="800px" alt="CP-4001-06 - Celda en estado no listo"></a><br>Panel de visualización del mapa showing los botones bloqueados para tareas que no están en estado MAPPED. |

---

### 1.7. Ejecución de CP-4001-07

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-07** | Intentar forzar el bloqueo de validación sobre una tarea que ya está bloqueada por otro validador en concurrencia. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz deshabilita u oculta los controles de validación para la tarea bloqueada, mostrando visualmente el candado de restricción y permitiendo únicamente la opción de validar un elemento distinto. | El sistema bloqueó preventivamente la acción en la UI; al seleccionar la tarea en paralelo, se visualizó el indicador de candado y los controles individuales de revisión quedaron omitidos, dejando activo únicamente el botón "Validar otra tarea". |

| Evidencia |
| :-- |
| Control restrictivo por concurrencia y opción alternativa activa<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-07-01.jpg" width="800px" alt="CP-4001-07 - Tarea bloqueada en concurrencia sin opciones individuales"></a><br>Vista de la cuadrícula con el estado "Bloqueada" visible &nbsp;y el panel lateral redirigiendo el flujo exclusivamente mediante el botón "Validar otra tarea". |

---

### 1.8. Ejecución de CP-4001-08

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-08** | Intentar iniciar un bloqueo de validación sobre una tarea que ya se encuentra en estado VALIDATED. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz deshabilita u oculta los controles de validación individuales para la tarea en estado Terminada, permitiendo únicamente la opción de validar un elemento distinto. | El sistema limitó la acción en la UI; al seleccionar la tarea con estado "Terminada" (color verde), el panel lateral omitió los botones de revisión individuales y redirigió el flujo exclusivamente mediante el botón "Validar otra tarea". |

| Evidencia |
| :-- |
| Controles de revisión omitidos en tarea terminada y opción alternativa activa<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-08-01.jpg" width="800px" alt="CP-4001-08 - Tarea validada sin opción de re-bloqueo"></a><br>Tarea #2 seleccionada en estado `VALIDATED` , constatando la ausencia de controles individuales y la presencia del botón "Validar otra tarea". |

---

### 1.9. Ejecución de CP-4001-09

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-09** | Intentar iniciar un nuevo bloqueo sobre una tarea INVALIDATED antes de que un Mapper realice las correcciones pertinentes. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema restringe el bloqueo de validación, requiriendo que la tarea pase primero por el flujo de corrección y habilitando únicamente la opción de mapeo. | El sistema bloqueó la acción de validación en la UI; al seleccionar la Tarea con el estado "Necesita más mapeo" (`INVALIDATED` ), los controles de revisión quedaron omitidos y el panel inferior se actualizó mostrando únicamente el botón "Mapear tarea seleccionada". |

| Evidencia |
| :-- |
| Restricción de re-validación prematura y botón de mapeo activo<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-09-01.jpg" width="800px" alt="CP-4001-09 - Tarea invalidada en espera de corrección"></a><br>Tarea #3 en estado `INVALIDATED` &nbsp;("Necesita más mapeo"), constatando que el sistema redirige el flujo mediante el botón "Mapear tarea seleccionada". |

---

### 1.10. Ejecución de CP-4001-10

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4001-10** | Intentar auto-validar una tarea propia operando bajo un perfil que combines funciones de Validator y Administrador global. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema otorga el bloqueo de la tarea de autoría propia al validar que el usuario posee permisos superiores de Administrador global del sistema. | La plataforma validó el rol del Administrador y permitió omitir la política restrictiva, asignándole la tarea directamente y permitiendo la interacción en la interfaz con el botón de reanudación. |

| Evidencia |
| :-- |
| Registro de Autoría del Mapeo Original<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-10-01.jpg" width="800px" alt="CP-4001-10 - Registro de mapeo por el mismo usuario"></a><br>Cronología de eventos del sistema que constata que la tarea fue trabajada y guardada inicialmente en la fase de mapeo por el usuario actual con privilegios de administrador.<br><br>Confirmación de Bloqueo para Validación Concedido<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4001-10-02.jpg" width="800px" alt="CP-4001-10 - Estado de la tarea cambiado a LOCKED_FOR_VALIDATION"></a><br>Panel principal donde se verifica que el sistema permitió saltar la restricción al usuario, asignándole la tarea de su propia autoría y cambiando su estado a bloqueada para validación con los controles de edición activos. |

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
| Confirmación y estado Validated<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-01-01.jpg" width="800px" alt="CP-4002-01 - Tarea válida"></a><br>Pantalla del proyecto con la tarea ya figurando como validada exitosamente. |

---

### 2.2. Ejecución de CP-4002-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-02** | Rechazar tarea marcándola como incorrecta (INVALIDATED). | Manual | Exitoso | N/A |

| Resultado esperado | Extatus obtenido |
| :-- | :-- |
| La tarea transiciona a INVALIDATED con comentario agregado para revisión. | Se añadió exitosamente el estatus de Invalidada y el bloque de comentario exigiendo la corrección, quedando de amarillo en el mapa. |

| Evidencia |
| :-- |
| Interfaz de rechazo y edición de comentario<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-02-01.jpg" width="800px" alt="CP-4002-02 - Formulario de rechazo"></a><br>Vista del panel lateral con la opción "More work is required" seleccionada y el texto de corrección redactado.<br><br>Confirmación de Invalidación e Historial<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-02-02.jpg" width="800px" alt="CP-4002-02 - Tarea rechazada en historial"></a><br>Vista del modal central con la Tarea #5 en estado amarillo y la retroalimentación guardada en la cronología. |

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
| Envío de invalidación con campo de texto vacío<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-03-01.jpg" width="800px" alt="CP-4002-03 - Formulario enviado sin texto"></a><br>Vista del panel lateral con la opción "More work is required" seleccionada y el cuadro de edición "Leave a comment..." totalmente vacío al momento de remitir la acción.<br><br>Persistencia de la tarea invalidada sin comentarios<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-03-02.jpg" width="800px" alt="CP-4002-03 - Estado guardado sin historial de texto"></a><br>Vista del modal central de la Tarea #4 en amarillo, confirmando la ausencia de registros con el mensaje informativo "No comments have been made on the task yet". |

---

### 2.4. Ejecución de CP-4002-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-04** | Enviar evaluaciones mixtas (Aprobar unas e Invalidar otras) sobre un lote de tareas bloqueadas simultáneamente. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema actualiza cada tarea a su estado asignado individualmente (VALIDATED / INVALIDATED), liberando los bloqueos correspondientes. | Al procesar la confirmation del lote, la API discriminó los estados y asignó de manera exacta los estados finales liberando el candado de cada celda. |

| Evidencia |
| :-- |
| Selección y asignación de estados en el lote<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-04-01.jpg" width="800px" alt="CP-4002-04 - Configuración de lote mixto"></a><br>Vista del panel lateral de edición múltiple con las tareas #6 y #8 marcadas como aprobadas ("Task well mapped") y la tarea #7 marcada para corrección ("More work is required").<br><br>Actualización e impacto en la cuadrícula general<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-04-02.jpg" width="800px" alt="CP-4002-04 - Resultados en mapa e historial"></a><br>Vista de la lista de tareas y el mapa general reflejando las tareas #6 y #8 con el estado definitivo "Terminada" (color verde) y la tarea #7 con el estado "Necesita más mapeo" (color amarillo). |

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
| Alerta de expiración de asignación por timeout<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-05-01.jpg" width="800px" alt="CP-4002-05 - Error por timeout de validación"></a><br>Vista del cuadro de diálogo emergente con el mensaje "Your session has expired" sobre la Tarea #9, ofreciendo las alternativas para cerrar la advertencia o volver a bloquear el elemento con "Relock task".<br><br>Retorno de la tarea al estado anterior en el panel general<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-05-02.jpg" width="800px" alt="CP-4002-05 - Retorno de estado"></a><br>Vista de la lista de tareas y la cuadrícula del mapa general donde la Tarea #9 se ha liberado y figura nuevamente bajo el estado "Lista para validar" con su respectivo color celeste. |

---

### 2.6. Ejecución de CP-4002-06

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-06** | Enviar una evaluación de aprobación masiva (VALIDATED) sobre un lote completo de tareas asignadas simultáneamente. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema procesa la transacción masiva de forma directa, transicionando todas las celdas del lote al estado `VALITED` simultáneamente. | El sistema procesó la validación múltiple con éxito; al confirmar la acción en bloque, todas las tareas seleccionadas transicionaron al mismo tiempo y se actualizaron reflejando el fin de su ciclo de calidad. |

| Evidencia |
| :-- |
|Selección de Tareas en Bloque<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-06-01.jpg" width="800px" alt="CP-4002-06 - Selección múltiple de tareas para validar"></a><br>Panel de control del proyecto que muestra múltiples elementos en estado de lista para validar seleccionados en paralelo, habilitando el botón unificado para procesar el lote completo.<br><br>Resultado de validación múltiple <br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-06-02.jpg" width="800px" alt="CP-4002-06 - Tareas actualizadas a Terminada en lote"></a><br>Vista del listado y el mapa general donde se constata que las tareas del lote cambiaron simultáneamente al estado definitivo de terminadas (`VALITED`)|

---

### 2.7. Ejecución de CP-4002-07

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-07** | Enviar una evaluación de rechazo masivo (INVALIDATED) sobre un lote de tareas asignadas sin exigir comentarios por elemento. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema procesa la transacción masiva, cambia el estado de todas las celdas a `INVALITED` y las devuelve a la cola general. | El sistema procesó la invalidación múltiple de forma correcta; al confirmar la acción en bloque, todas las tareas seleccionadas transicionaron simultáneamente al estado que solicita más mapeo. |

| Evidencia |
| :-- |
|Selección de Múltiples Elementos en Lista<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-07-01.jpg" width="800px" alt="CP-4002-07 - Selección múltiple para invalidar"></a><br>Interfaz del proyecto que muestra un conjunto de tareas en estado listo para validar seleccionadas al mismo tiempo, activando el botón en la barra inferior para procesar las tareas en lote.<br><br>Resultado de la Invalidación Masiva<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-07-02.jpg" width="800px" alt="CP-4002-07 - Lote cambiado a Necesita más mapeo"></a><br>Vista del listado lateral y de la cuadrícula geográfica donde se observa que los elementos seleccionados pasaron en conjunto al estado `INVALITED` correspondiente a la necesidad de más mapeo. |

---

### 2.8. Ejecución de CP-4002-08

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-08** | Registrar una invalidación (INVALIDATED) insertando caracteres especiales, símbolos técnicos o formato enriquecido en el comentario. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema procesa la invalidación y guarda el texto en el historial correctamente sin corromper la codificación de los símbolos. | El texto con codificación técnica y caracteres especiales fue almacenado y renderizado en la línea de tiempo sin sufrir alteraciones ni truncamiento de caracteres. |

| Evidencia |
| :-- |
| Persistencia de caracteres especiales en historial<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-08-01.jpg" width="800px" alt="CP-4002-08 - Comentario con símbolos guardado"></a><br>Vista de la cronología de la tarea mostrando los símbolos técnicos legibles y procesados de manera íntegra. |

---

### 2.9. Ejecución de CP-4002-09

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-09** | Registrar una invalidación (INVALIDATED) ingresando una retroalimentación extensa para verificar que el sistema no posea un límite restrictivo de caracteres. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema asimila el texto completo sin truncar la retroalimentación y asocia el bloque íntegro en su línea de tiempo de actividades. | El sistema guardó y procesó el comentario de gran extensión sin aplicar truncamientos ni generar errores de desbordamiento, mostrando los párrafos completos con su respectivo formato. |

| Evidencia |
| :-- |
|Registro Completo de Retroalimentación Extensa<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-09-01.jpg" width="800px" alt="CP-4002-09 - Comentario extenso asimilado en actividades"></a><br>Ventana emergente con el historial de actividades donde se visualiza el comentario extenso estructurado por puntos, mostrando una barra de desplazamiento activa que permite leer todo el reporte guardado sin cortes en el texto. |

---

### 2.10. Ejecución de CP-4002-10

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4002-10** | Enviar una evaluación adjuntando un texto técnico e incluyendo una imagen multimedia que evidencie el estado geográfico. | Manual | Fallido|Error del backend/servidor al procesar la carga de archivos adjuntos en el cuadro de comentarios de revisión. |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema procesa el cambio de estado con éxito, guarda el comentario y almacena la imagen adjunta permitiendo su visualización posterior. | El sistema rechaza la carga del archivo multimedia. Aunque permite la redacción del texto en el editor, al intentar procesar la imagen se interrumpe la carga y se despliega un mensaje de error explícito en la parte inferior del formulario, impidiendo finalizar el registro completo con su respectiva evidencia. |

| Evidencia |
| :-- |
|Fallo en la Carga de Archivos Multimedia<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4002-10-01.jpg" width="800px" alt="CP-4002-10 - Error al subir la imagen en el formulario"></a><br>Interfaz del editor de tareas donde se observa el reporte técnico y, debajo del formulario, una alerta explícita en texto rojo con el mensaje "Error al subir la imagen", confirmando el fallo en el módulo de carga. |

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
| Solicitud de reversión desde el historial de actividades<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-01-01.jpg" width="800px" alt="CP-4003-01 - Solicitud de revalidación"></a><br>Vista del modal de la Tarea #8 con la opción para solicitar la revalidación tras haber sido marcada como validada en la cronología de eventos.<br><br>Confirmación del cambio de estado por Undo<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-01-02.jpg" width="800px" alt="CP-4003-01 - Confirmación de reversión de estado"></a><br>Vista del mensaje de advertencia flotante que solicita confirmar si se desea cambiar el estado del elemento de vuelta a "Lista para validar". |

---

### 3.2. Ejecución de CP-4003-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-02** | Intentar ejecutar la acción "Undo" (Deshacer) inmediatamente después de haber cambiado el estado de una tarea a INVALIDATED. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema no ofrece controles o botones para deshacer la acción (Undo) sobre elementos en estado invalidado, manteniendo la tarea de forma definitiva en el flujo de corrección. | El sistema bloqueó la posibilidad de revertir la acción; una vez guardada la invalidación, la interfaz omite por completo cualquier botón o enlace para deshacer el cambio, obligando a que la tarea permanezca en su estado actual. |

| Evidencia |
| :-- |
|Restricción de Reversión en Tarea Invalidada<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-02-01.jpg" width="800px" alt="CP-4003-02 - Inexistencia de botón Undo en historial"></a><br>Ventana emergente con el historial de actividades donde queda registrado el estado de necesidad de más mapeo, constatando que la interfaz no despliega ningún control para revertir la transición mientras la celda en el mapa se mantiene en color amarillo. |

---

### 3.3. Ejecución de CP-4003-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-03** | Intentar aplicar "Undo" (Solicitar revalidación) sobre una tarea cuya evaluación final fue realizada por otro usuario validador. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema debe permitir que cualquier usuario con función o rol de Validator pueda solicitar la revalidación (Undo) de cualquier tarea terminada, independientemente de si fue validada originalmente por un tercero. | El sistema validó el perfil de Validator del usuario en sesión y habilitó correctamente el botón "Solicitar revalidación" en una tarea completada por otro revisor, permitiendo revertir el estado sin restricciones. |

| Evidencia |
| :-- |
| Control de reversión habilitado para tareas de terceros<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-03-01.jpg" width="800px" alt="CP-4003-03 - Exposición de Undo en actividad ajena"></a><br>Vista del modal de la Tarea #2 donde se muestra activo y disponible el botón "Solicitar revalidación" en la parte superior derecha, confirmando el acceso correcto del Validator a elementos evaluados por otros usuarios. |

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
| Estado inicial previo a la reversión consecutiva<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-04-01.jpg" width="800px" alt="CP-4003-04 - Estado inicial antes de deshacer"></a><br>Vista del modal de la Tarea #6 mostrando el flujo regular en el historial donde el elemento figura como validado recientemente.<br><br>Bloqueo del control tras el primer uso de deshacer<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-04-02.jpg" width="800px" alt="CP-4003-04 - Botón deshabilitado para segundo intento"></a><br>Vista de la actualización en el historial de actividades donde el estado regresa a mapeado and se inhabilita cualquier acción posterior para revertir consecutivamente. |

---

### 3.5. Ejecución de CP-4003-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-4003-05** | Intento de ejecución de acción Undo para solicitar revalidación por parte de un usuario con rol de Mapper estándar. | Manual | Exitoso | N/A |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema muestra la advertencia de confirmación, pero al aceptar la acción, restringe el proceso ignorando el cambio; el estado de la tarea permanece intacto y no se habilita ningún panel adicional. | Al confirmar la acción en el mensaje emergente, el sistema bloqueó el flujo; la tarea no sufrió ninguna modificación en su color o estado dentro de la lista general y la interfaz omitió la apertura del panel de revalidación. |

| Evidencia |
| :-- |
|Cuadro de Confirmación de Reversión Desplegado<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-05-01.jpg" width="800px" alt="CP-4003-05 - Mensaje modal para confirmar deshacer estado"></a><br>Ventana emergente que consulta al usuario si desea continuar con la acción para cambiar el estado de la tarea seleccionada de vuelta a "Lista para validar".<br><br>Estado Original Sin Cambios<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-04-validacion/cp-4003-05-02.jpg" width="800px" alt="CP-4003-05 - Estado de tarea se mantiene en terminada"></a><br>Vista del listado de tareas y la cuadrícula del mapa posterior a la interacción, donde se constata que la tarea bajo prueba retiene de forma intacta su estado VALITED, confirmando que la acción fue ignorada por el sistema y no se abrió ningún panel de edición o revalidación complementario.|