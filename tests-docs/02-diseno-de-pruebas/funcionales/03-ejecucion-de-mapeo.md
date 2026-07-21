# Diseño de Pruebas Funcionales: MOD-03 - Ejecución de Mapeo (Tasking)
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo

Este módulo gestiona el flujo de trabajo central de contribución geográfica de la plataforma. Es responsable de coordinar la selección, el bloqueo exclusivo, la interacción con herramientas de edición (tanto basadas en la web como locales) y la liberación o actualización de estado de las tareas dentro de un proyecto. Su propósito principal es garantizar la concurrencia segura de múltiples usuarios, previniendo colisiones de edición y asegurando la correcta evolución del progreso de mapeo del proyecto.

*Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](/tests-docs/02-diseno-de-pruebas/funcionales/00-requerimientos-funcionales.md).*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general

El enfoque de pruebas para este módulo será de extremo a extremo (End-to-End) desde la perspectiva del comportamiento observable en la interfaz de usuario. Las pruebas se centrarán en validar el ciclo de vida completo de una tarea geográfica, tomando como protagonista al actor **`MAPPER` (ACT-0002)**, dado que es el rol principal de ejecución de este flujo. 

Se evaluará rigurosamente la reactividad del sistema frente a restricciones de acceso (licencias previas, exclusividad de bloqueos), el comportamiento de la interfaz al invocar editores cartográficos externos (validación de URLs generadas o detección de servicios locales) y la correcta respuesta visual tras el envío de resultados. De manera complementaria, se modelará la intervención del actor **`Sistema` (ACT-0006)** para auditar los flujos de liberación automática por expiración de tiempo.

### 2.2. Técnicas de Caja Negra Utilizadas

Para garantizar una cobertura óptima y reducir la redundancia en los casos de prueba, se aplicarán las siguientes metodologías de diseño:

*   **Partición de Equivalencia (Equivalence Partitioning):** Utilizada para evaluar las restricciones de acceso y selección de herramientas. Se agruparán en clases representativas las condiciones de los proyectos (por ejemplo, Proyectos que requieren nivel `BEGINNER` vs `ADVANCED`), los tipos de editores configurados (Editores Web como iD/Rapid vs Editores Locales como JOSM), y el estado legal del usuario (Licencia aceptada vs No aceptada).
*   **Análisis de Valores Límite (Boundary Value Analysis):** Se aplicará específicamente para validar las reglas de negocio dependientes de variables numéricas extremas, como los límites de zoom topográfico al intentar dividir (Split) una tarea, y el umbral de tiempo límite (`autoUnlockSeconds`) para la liberación automática de una tarea bloqueada.
*   **Tablas de Decisión (Decision Table Testing):** Se utilizará para modelar combinaciones de reglas de negocio complejas antes de permitir el bloqueo de una tarea. Combinará múltiples entradas binarias (por ejemplo, *¿Tiene el usuario otra tarea bloqueada?*, *¿Cumple con el nivel de mapeo?*, *¿El proyecto está publicado?*) para determinar la salida correcta esperada en la interfaz (habilitación del botón de mapeo o visualización de un error específico).
*   **Transición de Estados (State Transition Testing):** Esta es la técnica principal del módulo, ya que el modelo funcional depende intrínsecamente del ciclo de vida de una tarea. Se utilizará para validar que los cambios de estado (por ejemplo, de `READY` a `LOCKED_FOR_MAPPING`, y posteriormente a `MAPPED` o `BADIMAGERY`) sigan estrictamente las transiciones permitidas por la interfaz, incluyendo las reversiones (Undo).
## 3. Especificaciones de Escenarios y Casos de Prueba

Para asegurar una cobertura funcional completa del módulo **MOD-03: Ejecución de Mapeo (Tasking)** sin redundancia, se proponen **5 Especificaciones de Escenarios de Prueba (ESC)**. 

El módulo 3 contiene flujos transaccionales altamente acoplados. Dividirlo en 5 escenarios permite aislar las lógicas de negocio utilizando la técnica de caja negra más adecuada para cada una:
1. Permisos y precondiciones de entrada (Tabla de Decisión).
2. Salida, restricciones preventivas en la UI y cambio de estado de la tarea (Transición de Estados).
3. Geometría y límites matemáticos de la plataforma (Análisis de Valores Límite).
4. Acciones automatizadas del sistema y control de tiempo de sesión (Análisis de Valores Límite).
5. Interacción gráfica espacial y filtrado de auditoría visual (Partición de Equivalencia).

| ID Escenario | Descripción Breve | RF Cubiertos | Alcance Funcional | Técnica Principal |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-3001** | **Bloqueo e inicio de tarea** | RF-3001, RF-3002, RF-3003 | Verifica si el usuario (`MAPPER`) puede tomar una tarea basado en permisos, licencias, exclusividad y selecciona un editor. | Tabla de Decisión, Partición de Equivalencia |
| **ESC-3002** | **Liberación y envío de tarea (Submit)** | RF-3004 | Cubre la finalización del mapeo y las restricciones preventivas en la interfaz para evitar transiciones de estado no permitidas. | Transición de Estados, Partición de Equivalencia |
| **ESC-3003** | **División de tarea (Split)** | RF-3005 | Evalúa la capacidad de fraccionar una grilla de mapeo basándose en el límite del nivel de zoom cartográfico. | Análisis de Valores Límite, Partición de Equivalencia |
| **ESC-3004** | **Expiración y extensión de bloqueo** | RF-3006 | Valida la liberación forzada por el Sistema al exceder el límite de tiempo y la solicitud de extensión manual de la sesión por el usuario. | Análisis de Valores Límite, Partición de Equivalencia |
| **ESC-3005** | **Interacción Cartográfica y Trazabilidad** | RF-3002, RF-7001 | Valida la respuesta del editor integrado frente a la navegación (dentro y fuera del BBOX) y el filtrado del panel de historial. | Partición de Equivalencia |

### 3.1. Escenario: [ESC-3001] - Solicitud de Bloqueo e Inicio de Tarea de Mapeo

**A. Definición del Escenario**

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permite a un usuario `MAPPER` obtener el bloqueo exclusivo de una tarea para su edición, evaluando de forma concurrente las reglas de negocio restrictivas y ejecutando correctamente el editor cartográfico seleccionado. |
| **RF Asociados** | RF-3001, RF-3002, RF-3003 |
| **Precondiciones** | Proyecto en estado `PUBLISHED`. Usuario `MAPPER` (ACT-0002) autenticado en el sistema. |
| **Técnicas aplicadas**| Tabla de Decisión, Partición de Equivalencia. |
| **Resultado Esperado** | El sistema otorga el bloqueo de la tarea (`LOCKED_FOR_MAPPING`) y lanza el editor correspondiente, o en su defecto, deniega la acción mostrando el mensaje de error específico según la regla de negocio infringida. |

**B. Aplicación de Técnicas (Análisis)**

**B.1. Tabla de Decisión**
Se aplica esta técnica para modelar las reglas de negocio combinadas que el sistema evalúa antes de otorgar el bloqueo de una tarea. Se ha racionalizado la tabla utilizando guiones (`-`) para denotar condiciones "indiferentes" una vez que una restricción principal de mayor jerarquía ya ha invalidado el flujo.

| Condiciones de entrada | | | | | |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Nivel de mapeo del usuario cumple con el requerido | V | V | V | V | F |
| Estado de la tarea seleccionada es `READY` | V | V | V | F | - |
| Usuario no posee otras tareas bloqueadas actualmente | V | V | F | - | - |
| Términos de licencia del proyecto aceptados | V | F | - | - | - |
| **Condiciones de salida** | | | | | |
| Bloqueo exitoso (`LOCKED_FOR_MAPPING`) | V | F | F | F | F |
| Error: Licencia no aceptada (*UserLicenseError*) | F | V | F | F | F |
| Error: Límite de tareas excedido (*UserAlreadyHasTaskLocked*) | F | F | V | F | F |
| Error: Estado inválido de tarea (*InvalidTaskState*) | F | F | F | V | F |
| Error: Nivel insuficiente (*UserPermissionError*) | F | F | F | F | V |
| **Etiqueta** | **A** | **B** | **C** | **D** | **E** |

*(Nota: La Etiqueta A representa el "Happy Path" del proceso de validación de bloqueo).*

**B.2. Partición de Equivalencia**
Una vez superadas las validaciones de bloqueo, el sistema procesa el lanzamiento del editor seleccionado por el usuario. Se aplica esta técnica para agrupar los tipos de editores soportados y su comportamiento esperado.

| Cod. | Campo | Clase Válida | Clases No Válidas |
| :--- | :--- | :--- | :--- |
| MOD03-PE-001 | Tipo de Editor | Editores Web (por ejemplo, `iD`, `RAPID`), Editores Locales (por ejemplo, `JOSM`) | Cadena vacía, Editor no soportado (por ejemplo, `CustomApp`) |

*   *Comportamiento esperado (Editores Web):* El sistema redirecciona o carga el iframe embebido con los parámetros BBOX de la tarea.
*   *Comportamiento esperado (Editores Locales):* El sistema emite una petición `GET` a `127.0.0.1:8111`. Si no hay respuesta, se genera error de conexión local.
*   *Comportamiento esperado (Clases No Válidas):* El sistema aplica un *fallback* y carga el editor web por defecto (`iD`).

**C. Casos de Prueba Derivados**

| ID Caso | Datos de entrada o escenario | Resultado Esperado | Técnicas / Etiquetas Aplicadas |
| :--- | :--- | :--- | :--- |
| **CP-3001-01** | Nivel OK, Tarea `READY`, Sin bloqueos previos, Licencia OK.<br>Editor: `iD` (Web). | La tarea cambia a `LOCKED_FOR_MAPPING`. Se carga la interfaz del editor iD correctamente. | Tabla de Decisión (A)<br>PE (Clase Válida Web) |
| **CP-3001-02** | Nivel OK, Tarea `READY`, Sin bloqueos previos, Licencia OK.<br>Editor: `JOSM` (Local, servicio en puerto 8111 apagado). | Alerta de interfaz indicando "JOSM is not running". La tarea mantiene el bloqueo otorgado. | Tabla de Decisión (A)<br>PE (Clase Válida Local) |
| **CP-3001-03** | Nivel OK, Tarea `READY`, Sin bloqueos previos, Licencia: No aceptada. | Se muestra modal impidiendo el bloqueo y requiriendo aceptación de "Terms of Use" (`UserLicenseError`). | Tabla de Decisión (B) |
| **CP-3001-04** | Nivel OK, Tarea `READY`, Tareas previas bloqueadas: 1, Licencia OK. | Se muestra mensaje de error indicando límite de concurrencia excedido (`UserAlreadyHasTaskLocked`). | Tabla de Decisión (C) |
| **CP-3001-05** | Nivel OK, Tarea `MAPPED`, Sin bloqueos previos, Licencia OK. | Se muestra mensaje de error indicando estado inválido para mapeo (`InvalidTaskState`). | Tabla de Decisión (D) |
| **CP-3001-06** | Nivel Usuario: `BEGINNER`<br>Nivel Proyecto: `ADVANCED`<br>Resto de parámetros válidos. | Se muestra mensaje de error de permisos denegados (`UserPermissionError`). | Tabla de Decisión (E) |
| **CP-3001-07** | Nivel OK, Tarea `READY`, Sin bloqueos previos, Licencia OK.<br>Editor: `(Vacío)` | La tarea cambia a `LOCKED_FOR_MAPPING`. El sistema carga el editor `iD` por defecto. | Tabla de Decisión (A)<br>PE (Clase No Válida) |


### 3.2. Escenario: [ESC-3002] - Liberación y Envío de Tarea de Mapeo (Submit)

**A. Definición del Escenario**

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que la interfaz gráfica permite a un usuario `MAPPER` finalizar su sesión de mapeo sobre una tarea que posee bloqueada, reportando el progreso mediante las opciones visibles en el panel de control y liberando el bloqueo exclusivo. Asimismo, validar que la interfaz restringe visualmente estas opciones cuando la tarea no cumple las condiciones para ser liberada. |
| **RF Asociados** | RF-3004 |
| **Precondiciones** | Proyecto en estado `PUBLISHED`. Usuario `MAPPER` (ACT-0002) autenticado en el sistema. |
| **Técnicas aplicadas**| Transición de Estados (State Transition Testing), Partición de Equivalencia (PE). |
| **Resultado Esperado** | La interfaz muestra los controles de finalización ("Yes", "No") únicamente cuando el usuario posee el bloqueo de la tarea. Al confirmar, la tarea actualiza su color/estado topográfico en el mapa (`MAPPED` o `READY`). Para tareas ajenas o sin bloqueo, los controles de envío se ocultan. |

**B. Aplicación de Técnicas (Análisis)**

**B.1. Transición de Estados**
Se modelan exclusivamente los estados visuales del mapa y los controles de la interfaz que provocan las transiciones disponibles para el usuario al momento de liberar la tarea.

![Diagrama de transición ESC-3002](/tests-docs/02-diseno-de-pruebas/funcionales/img/transicion-estado-ESC-3002.png) 

**Tabla de Transición de Estados (Observable en UI)**

| Estado Inicial UI | Acción en Interfaz | Estado Final Esperado (UI) | Transición |
| :--- | :--- | :--- | :---: |
| Tarea `LOCKED_FOR_MAPPING` (Titular) | Seleccionar "Yes" (Mapeo completo) y "Submit" | Tarea cambia a color de `MAPPED`. Panel vuelve a estado inactivo. | Válida |
| Tarea `LOCKED_FOR_MAPPING` (Titular) | Seleccionar "No" (Mapeo incompleto) y "Submit" | Tarea cambia a color de `READY` (blanco/transparente). | Válida |

**B.2. Partición de Equivalencia (PE)**
La interfaz de usuario debe reaccionar y adaptarse (mostrando u ocultando el panel de "Submit") basándose en el estado previo de la tarea seleccionada y en quién ostenta la propiedad del bloqueo.

| Cod. | Variable Analizada en UI | Clase Válida (Muestra panel de Submit) | Clases No Válidas (Oculta panel de Submit) |
| :--- | :--- | :--- | :--- |
| **MOD03-PE-002** | Estado de la tarea y titularidad del bloqueo visual | Tarea seleccionada está `LOCKED_FOR_MAPPING` y el usuario actual es el titular. | 1. Tarea en estado `READY` (Libre).<br>2. Tarea en `LOCKED_FOR_MAPPING` por otro usuario (Aparece "Locked by [User]").<br>3. Tarea ya finalizada (`MAPPED`, `VALIDATED`). |

*   *Comportamiento esperado (Clase Válida):* El panel lateral renderiza la pregunta "¿Está la tarea completamente mapeada?" con las opciones de envío.
*   *Comportamiento esperado (Clases No Válidas):* La interfaz actúa como barrera preventiva. No renderiza los radio buttons ni el botón de "Submit Task". En su lugar, muestra botones acordes al estado (por ejemplo, "Map a task" o solo información).

**C. Casos de Prueba Derivados**

| ID Caso | Pasos de Ejecución | Datos de Entrada / Contexto | Resultado Esperado | Técnicas / Etiquetas Aplicadas |
| :--- | :--- | :--- | :--- | :--- |
| **CP-3002-01** | 1. Seleccionar tarea bloqueada propia.<br>2. Marcar "Yes".<br>3. Clic en "Submit Task". | **Estado:** `LOCKED_FOR_MAPPING` (Propia) | El panel de mapeo se cierra. La tarea se pinta con el color correspondiente a `MAPPED`. El bloqueo visual desaparece. | Transición de Estados (Válida)<br>PE (Clase Válida) |
| **CP-3002-02** | 1. Seleccionar tarea bloqueada propia.<br>2. Marcar "No".<br>3. Clic en "Submit Task". | **Estado:** `LOCKED_FOR_MAPPING` (Propia) | El panel de mapeo se cierra. La tarea se pinta con el color correspondiente a `READY`. Queda disponible en el mapa. | Transición de Estados (Válida)<br>PE (Clase Válida) |
| **CP-3002-03** | 1. Hacer clic sobre una tarea libre en el mapa de exploración. | **Estado:** `READY` | El panel lateral muestra información de la tarea y el botón "Map Task". **No se muestran** las opciones de "Submit", previniendo un envío sin bloqueo. | PE (Clase No Válida) |
| **CP-3002-04** | 1. Hacer clic sobre una tarea bloqueada por un tercero (candado rojo). | **Estado:** `LOCKED_FOR_MAPPING` (Ajena) | El panel lateral indica "Locked by [Usuario]". **No se muestran** las opciones de "Submit" ni de edición, protegiendo la autoría del mapeo. | PE (Clase No Válida) |
| **CP-3002-05** | 1. Hacer clic sobre una tarea que ya ha sido mapeada por el usuario. | **Estado:** `MAPPED` | El panel lateral refleja que la tarea espera validación. **No se muestran** los controles de "Submit" de mapeo. | PE (Clase No Válida) |

### 3.3. Escenario: [ESC-3003] - División de Tarea de Mapeo (Split Task)

**A. Definición del Escenario**

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permite a un usuario `MAPPER` fraccionar una tarea (actualmente bloqueada por él) en 4 sub-tareas más pequeñas, siempre y cuando la escala del área (zoom cartográfico) no supere el límite máximo permitido por la plataforma para evitar micro-tareas inmanejables. |
| **RF Asociados** | RF-3005 |
| **Precondiciones** | Proyecto en estado `PUBLISHED`. Usuario `MAPPER` (ACT-0002) autenticado en el sistema. Tarea seleccionada en estado `LOCKED_FOR_MAPPING`. |
| **Técnicas aplicadas**| Análisis de Valores Límite (AVL), Partición de Equivalencia (PE). |
| **Resultado Esperado** | Si se cumplen las reglas geográficas y de propiedad, el sistema divide la tarea original en 4 nuevas tareas, eliminando la original e incrementando el total de tareas del proyecto en 3. De lo contrario, se rechaza la acción con un mensaje de error específico. |

**B. Aplicación de Técnicas (Análisis)**

**B.1. Análisis de Valores Límite (AVL)**
La capacidad de dividir una tarea está restringida matemáticamente por el nivel de zoom cartográfico (escala del mapa). Si una tarea ya es demasiado pequeña, dividirla generaría polígonos no funcionales. El límite máximo admitido para aplicar un *Split* es un zoom level igual a `17`. Un nivel de zoom `18` o superior se considera demasiado pequeño.

| Cod. | Variable a Evaluar | Límite Superior Válido | Límite Superior Inválido | Observación |
| :--- | :--- | :--- | :--- | :--- |
| **MOD03-AVL-001** | Nivel de Zoom de la Tarea | `17` | `18` | Evalúa la frontera exacta donde el sistema bloquea la operación matemática de división cartográfica. |

**B.2. Partición de Equivalencia (PE)**
Al igual que en la liberación de tareas, la división es una operación destructiva (elimina el polígono original), por lo que requiere una estricta validación de estado y propiedad del bloqueo actual.

| Cod. | Condición Analizada | Clase Válida | Clases No Válidas |
| :--- | :--- | :--- | :--- |
| **MOD03-PE-003** | Estado y Autoría de la Tarea | Tarea en estado `LOCKED_FOR_MAPPING` cuyo `lockHolder` (titular) coincide con el usuario que emite la petición. | 1. Tarea en cualquier otro estado (por ejemplo, `READY`, `MAPPED`).<br>2. Tarea en `LOCKED_FOR_MAPPING` pero con un `lockHolder` diferente al solicitante. |

*   *Comportamiento esperado (Clase Válida):* Ejecución exitosa de la función `splitTaskGrid`.
*   *Comportamiento esperado (Clases No Válidas):* Rechazo de la solicitud indicando `LockToSplit` (para estado incorrecto) o `SplitOtherUserTask` (para titular distinto).

**C. Casos de Prueba Derivados**

| ID Caso | Datos de entrada o escenario | Resultado Esperado | Técnicas / Etiquetas Aplicadas |
| :--- | :--- | :--- | :--- |
| **CP-3003-01** | **Zoom de Tarea:** `17`<br>**Estado:** `LOCKED_FOR_MAPPING`<br>**Titular:** Solicitante actual | El sistema procesa la división. La tarea original desaparece. Se generan 4 tareas nuevas. El contador `total_tasks` aumenta en 3. | MOD03-AVL-001 (Válido)<br>MOD03-PE-003 (Válido) |
| **CP-3003-02** | **Zoom de Tarea:** `18`<br>**Estado:** `LOCKED_FOR_MAPPING`<br>**Titular:** Solicitante actual | El sistema aborta la transacción espacial. Se emite el mensaje de error: `SmallToSplit`. La tarea original se mantiene intacta. | MOD03-AVL-001 (Inválido)<br>MOD03-PE-003 (Válido) |
| **CP-3003-03** | **Zoom de Tarea:** `15`<br>**Estado:** `READY`<br>**Titular:** Ninguno | El sistema rechaza la petición por estado inválido, emitiendo el error: `LockToSplit`. | MOD03-AVL-001 (Válido)<br>MOD03-PE-003 (No Válido) |
| **CP-3003-04** | **Zoom de Tarea:** `16`<br>**Estado:** `LOCKED_FOR_MAPPING`<br>**Titular:** Usuario B (Diferente al solicitante actual) | El sistema rechaza la petición por conflicto de propiedad, emitiendo el error: `SplitOtherUserTask`. | MOD03-AVL-001 (Válido)<br>MOD03-PE-003 (No Válido) |

### 3.4. Escenario: [ESC-3004] - Expiración y Extensión de Bloqueo de Tarea (Auto-unlock / Extend)

**A. Definición del Escenario**

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema libera automáticamente una tarea bloqueada al expirar su tiempo límite de edición para prevenir el acaparamiento de tareas (operación del Sistema). Adicionalmente, validar que un `MAPPER` pueda solicitar una extensión explícita de su tiempo de bloqueo antes de que este caduque. |
| **RF Asociados** | RF-3006 |
| **Precondiciones** | Proyecto en estado `PUBLISHED`. Tarea en estado `LOCKED_FOR_MAPPING`. Usuario `MAPPER` (ACT-0002) autenticado (para extensiones). Cron de expiración de tareas (ACT-0006) activo. |
| **Técnicas aplicadas**| Análisis de Valores Límite (AVL), Partición de Equivalencia (PE). |
| **Resultado Esperado** | Si el tiempo transcurrido supera el umbral configurado, la tarea vuelve a `READY`. Si el usuario solicita una extensión bajo condiciones válidas, el temporizador se reinicia; de lo contrario, la extensión es denegada con el error correspondiente. |

**B. Aplicación de Técnicas (Análisis)**

**B.1. Análisis de Valores Límite (AVL)**
La liberación de la tarea depende de un umbral temporal (`autoUnlockSeconds`, típicamente 2 horas / 7200 segundos). Se evalúa el límite de expiración, donde `L` es el límite de tiempo y `T` es el tiempo transcurrido desde que se bloqueó la tarea.

| Cod. | Campo / Condición Evaluada | Límite Inferior (Válido) | Límite Exacto (No Válido) | Límite Superior (No Válido) | Observación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MOD03-AVL-002** | Tiempo transcurrido `T` vs `L` | `T = L - 1` segundo | `T = L` | `T = L + 1` segundo | Evalúa la frontera cronológica donde el sistema debe revocar forzosamente el bloqueo del usuario. |

**B.2. Partición de Equivalencia (PE)**
Al solicitar una "Extensión del Bloqueo" (*Extend Session*), el sistema debe verificar el estado topográfico actual y la autoría del bloqueo para garantizar la seguridad de la operación.

| Cod. | Campo / Condición | Clase Válida | Clases No Válidas |
| :--- | :--- | :--- | :--- |
| **MOD03-PE-004** | Estado y Propiedad de la Tarea al extender | Tarea en estado `LOCKED_FOR_MAPPING` y el `lockHolder` (titular) coincide con el solicitante. | 1. Tarea no bloqueada (por ejemplo, `READY`, `MAPPED`).<br>2. Tarea en `LOCKED_FOR_MAPPING` pero asignada a otro usuario. |

*   *Comportamiento esperado (Clase Válida):* El sistema reinicia el contador de tiempo y registra la acción `EXTENDED_FOR_MAPPING` en el historial.
*   *Comportamiento esperado (Clases No Válidas):* Rechazo de la solicitud indicando `TaskStatusNotLocked` (para estado incorrecto) o `LockedByAnotherUser` (para titular distinto).

**C. Casos de Prueba Derivados**

| ID Caso | Datos de entrada o escenario | Resultado Esperado | Técnicas / Etiquetas Aplicadas |
| :--- | :--- | :--- | :--- |
| **CP-3004-01** | Evaluación del sistema.<br>**Tiempo transcurrido:** `L - 1 segundo`. | La tarea conserva su estado `LOCKED_FOR_MAPPING`. No se revoca el acceso del usuario. | MOD03-AVL-002 (Válido) |
| **CP-3004-02** | Evaluación del sistema.<br>**Tiempo transcurrido:** Igual a `L` o `L + 1 segundo`. | El sistema revoca el acceso. La tarea cambia a `READY`. El historial registra la acción `AUTO_UNLOCKED_FOR_MAPPING`. | MOD03-AVL-002 (No Válido) |
| **CP-3004-03** | Solicitud de Extensión.<br>**Estado:** `LOCKED_FOR_MAPPING`.<br>**Titular:** Coincide con solicitante. | Operación exitosa (HTTP 200). Retorna "Successfully extended task expiry". Historial registra `EXTENDED_FOR_MAPPING`. | MOD03-PE-004 (Clase Válida) |
| **CP-3004-04** | Solicitud de Extensión.<br>**Estado:** `READY`. | Operación denegada (HTTP 403). Retorna el mensaje de error: `TaskStatusNotLocked`. | MOD03-PE-004 (Clase No Válida) |
| **CP-3004-05** | Solicitud de Extensión.<br>**Estado:** `LOCKED_FOR_MAPPING`.<br>**Titular:** Usuario B (Diferente al solicitante). | Operación denegada (HTTP 403). Retorna el mensaje de error: `LockedByAnotherUser`. El bloqueo original no se altera. | MOD03-PE-004 (Clase No Válida) |

### 3.5. Escenario: [ESC-3005] - Interacción Cartográfica y Visualización de Trazabilidad (Historial)

**A. Definición del Escenario**

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el entorno de edición integrado (Editor iD) responde de manera dinámica a la selección de elementos geográficos en el mapa, mostrando sus atributos correspondientes. Simultáneamente, validar que el panel de control del Tasking Manager renderiza el historial de la tarea, permitiendo filtrar correctamente los eventos de trazabilidad (comentarios y transiciones de estado). |
| **RF Asociados** | RF-3002 (Integración de Editor Web), RF-7001 (Comentarios por Tarea) |
| **Precondiciones** | Proyecto en estado `PUBLISHED`. Usuario `MAPPER` (ACT-0002) autenticado en el sistema. Tarea seleccionada en estado `LOCKED_FOR_MAPPING` con el editor web (iD) completamente cargado en la interfaz. |
| **Técnicas aplicadas**| Partición de Equivalencia (PE). |
| **Resultado Esperado** | El sistema debe mostrar los detalles y etiquetas del polígono/línea seleccionada en el panel izquierdo (Editor iD). En el panel derecho (Tasking Manager), la pestaña "Historial" debe aplicar los filtros visuales correctamente, discriminando entre comentarios de usuarios y registros del sistema, sin recargar la página. |

**B. Aplicación de Técnicas (Análisis)**

Para este escenario se ha seleccionado la **Partición de Equivalencia (PE)**. Esta técnica es la más adecuada funcionalmente porque nos permite dividir los tipos de datos de entrada observables en la interfaz en grupos lógicos que el sistema debe procesar de manera distinta:
1.  **Filtros de Trazabilidad:** El usuario tiene tres opciones excluyentes en la UI (radio buttons) que alteran la renderización del DOM en el panel derecho.
2.  **Interacción Espacial:** La interacción del cursor sobre el mapa se divide en dos grandes "clases" funcionales: clics dentro de la zona permitida (polígono de la tarea) y clics fuera del límite establecido.

**B.1. Partición de Equivalencia (Filtros del Historial)**
Evalúa la reactividad del componente visual que lista la cronología de eventos de la tarea.

| Cod. | Variable Analizada en UI | Clases Válidas (Filtros UI) |
| :--- | :--- | :--- |
| **MOD03-PE-005** | Filtro de vista "Historial" | 1. **Comentarios:** Oculta eventos del sistema, muestra solo mensajes de texto ingresados por usuarios.<br>2. **Actividades:** Oculta mensajes, muestra solo transiciones de estado automáticas y manuales (por ejemplo, "bloqueada para mapeo", "dividió una tarea").<br>3. **Todos:** Renderiza la unión cronológica de las dos clases anteriores. |

**B.2. Partición de Equivalencia (Límites y Geometría en Editor Web)**
Se ajusta la partición para evaluar la respuesta de la interfaz (renderizado de guías visuales) frente al área de trabajo, no como un bloqueo transaccional.

| Cod. | Variable Analizada en UI | Clase Válida (Dentro del AOI) | Clase Válida (Fuera del AOI) |
| :--- | :--- | :--- | :--- |
| **MOD03-PE-006** | Área visual de interacción cartográfica (BBOX) | Navegación e interacción dentro del polígono delimitado (sin máscara de sombreado). | Navegación e interacción fuera del polígono delimitado para la tarea asignada. |

*   *Comportamiento esperado (Dentro del AOI):* El usuario interactúa con los elementos con visibilidad normal.
*   *Comportamiento esperado (Fuera del AOI):* La interfaz superpone un sombreado oscuro, el límite magenta y el texto *"Task for project [ID]. Do not edit outside of this area!"*. **El sistema permite la inserción del elemento cartográfico**, cumpliendo la premisa de "guiar visualmente, no bloquear".

---

**C. Casos de Prueba Derivados**

| ID Caso | Pasos de Ejecución | Datos de Entrada / Contexto | Resultado Esperado | Técnicas / Etiquetas Aplicadas |
| :--- | :--- | :--- | :--- | :--- |
| **CP-3005-01** | 1. En el panel derecho de Tasking Manager, hacer clic en la pestaña "Historial".<br>2. Seleccionar el radio button "Actividades". | **Filtro UI:** `Actividades` | La interfaz renderiza únicamente el rastro de auditoría del sistema (por ejemplo, "[Usuario] bloqueada para mapeo hace 42 minutos", "desbloqueada automáticamente..."). Los comentarios desaparecen de la vista. | PE-005 (Filtro Actividades) |
| **CP-3005-02** | 1. En el panel derecho, seleccionar el radio button "Comentarios". | **Filtro UI:** `Comentarios` | La lista se actualiza dinámicamente ocultando los registros del sistema. Solo se visualizan avatares y mensajes de texto dejados por los mappers/validators previos. | PE-005 (Filtro Comentarios) |
| **CP-3005-03** | 1. En el área del mapa central, hacer clic sobre un polígono existente (por ejemplo, zona residencial) situado dentro del cuadro delimitador de la tarea. | **Elemento:** Área dentro del BBOX | El panel izquierdo (iD) reacciona mostrando los metadatos del elemento (Tipo de elemento, Nombre, Etiquetas como `type=multipolygon`). | PE-006 (Clase Válida Espacial) |
| **CP-3005-04** | 1. Desplazar la vista (Pan) hacia el exterior del borde magenta de la tarea.<br>2. Seleccionar la herramienta "Punto" o "Área".<br>3. Hacer clic para crear el elemento en la zona sombreada. | **Elemento:** Geometría nueva fuera del BBOX. | La UI mantiene visible el sombreado y la advertencia textual permanente. **El elemento se crea exitosamente en el mapa**, confirmando que el sistema proporciona una guía visual restrictiva pero no un bloqueo a nivel de herramienta. | PE-006 (Clase Válida Fuera del AOI) |
## 4. Matriz de Trazabilidad del Módulo

Esta matriz consolida la relación bidireccional entre los Requerimientos Funcionales (RF) documentados y los artefactos de diseño generados para el módulo **MOD-03: Ejecución de Mapeo (Tasking)**. 

Se han incorporado las actualizaciones derivadas de los rediseños funcionales, incluyendo la adaptación del Escenario 2 a un enfoque estrictamente basado en la interfaz (eliminando las pruebas a nivel de API) y la integración del nuevo Escenario 5, asegurando así una cobertura total y coherente de las reglas de negocio.

| Requerimiento Funcional (RF) | Especificación de Escenario (ESC) | Casos de Prueba (CP) Derivados | Técnicas de Diseño Aplicadas |
| :--- | :--- | :--- | :--- |
| **RF-3001**, RF-3002, RF-3003 | **ESC-3001:** Solicitud de Bloqueo e Inicio de Tarea de Mapeo | **CP-3001-01** | Tabla de Decisión (A), PE (Clase Válida Web) |
| **RF-3001**, RF-3002, RF-3003 | ESC-3001 | **CP-3001-02** | Tabla de Decisión (A), PE (Clase Válida Local) |
| **RF-3001**, RF-3002, RF-3003 | ESC-3001 | **CP-3001-03**, **CP-3001-04**, **CP-3001-05**, **CP-3001-06** | Tabla de Decisión (B, C, D, E) |
| **RF-3001**, RF-3002, RF-3003 | ESC-3001 | **CP-3001-07** | Tabla de Decisión (A), PE (Clase No Válida) |
| **RF-3004** | **ESC-3002:** Liberación y Envío de Tarea de Mapeo (Submit) | **CP-3002-01**, **CP-3002-02** | Transición de Estados (Válida), PE (Clase Válida) |
| **RF-3004** | ESC-3002 | **CP-3002-03**, **CP-3002-04**, **CP-3002-05** | PE (Clase No Válida en UI) |
| **RF-3005** | **ESC-3003:** División de Tarea de Mapeo (Split Task) | **CP-3003-01** | AVL-001 (Válido), PE-003 (Válido) |
| **RF-3005** | ESC-3003 | **CP-3003-02** | AVL-001 (Inválido), PE-003 (Válido) |
| **RF-3005** | ESC-3003 | **CP-3003-03**, **CP-3003-04** | AVL-001 (Válido), PE-003 (No Válido) |
| **RF-3006** | **ESC-3004:** Expiración y Extensión de Bloqueo de Tarea | **CP-3004-01** | AVL-002 (Válido) |
| **RF-3006** | ESC-3004 | **CP-3004-02** | AVL-002 (Inválido) |
| **RF-3006** | ESC-3004 | **CP-3004-03** | PE-004 (Clase Válida) |
| **RF-3006** | ESC-3004 | **CP-3004-04**, **CP-3004-05** | PE-004 (Clase No Válida) |
| **RF-3002**, **RF-7001** | **ESC-3005:** Interacción Cartográfica y Visualización de Trazabilidad | **CP-3005-01**, **CP-3005-02** | PE-005 (Filtros UI) |
| **RF-3002**, **RF-7001** | ESC-3005 | **CP-3005-03** | PE-006 (Clase Válida Dentro del AOI) |
| **RF-3002**, **RF-7001** | ESC-3005 | **CP-3005-04** | PE-006 (Clase Válida Fuera del AOI) |
