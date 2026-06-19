# Diseño de Pruebas Funcionales: MOD-04 - Proceso de Validación

**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo

Este módulo gestiona el flujo de control de calidad o validación de las tareas. Su objetivo principal es asegurar que los mapeos realizados cumplan con los estándares, bloqueando tareas para revisión (una o múltiples), impidiendo la auto-validación y permitiendo evaluaciones (aprobar o rechazar), además de deshacer acciones previas.

_Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](/tests-docs/02-diseno-de-pruebas/funcionales/00-requerimientos-funcionales.md)._

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general

Las pruebas se centrarán en corroborar los controles de acceso (usuario apto para la función de Validator frente a otros), la correcta transición de estados de las tareas tras cada acción y las validaciones lógicas del sistema, especialmente las políticas preventivas (auto-validación) contempladas por las reglas de plataforma.

### 2.2. Técnicas de Caja Negra Utilizadas

- **Partición de Equivalencia:** Utilizada para agrupar las condiciones del usuario que intenta validar (idéntico al que mapeó frente a usuario distinto) y el nivel del autor que efectúa la acción, dividiéndolo de acuerdo con los niveles válidos (`VALIDATOR` por experiencia) e inválidos (`MAPPER` sin nivel suficiente, Anónimo).
- **Transición de Estados:** Se aplica a los ciclos de vida de una tarea para confirmar que los estados cambien correctamente (`MAPPED` -> `LOCKED_FOR_VALIDATION` -> `VALIDATED`/`INVALIDATED`).
- **Casos de Uso / Pruebas Basadas en Escenarios:** Permite la derivación de casos asegurando que cada etapa lógica y limitación de las reglas (ej. deshacer o validar calidad) se prueben como la interacción completa de un actor contra el TM.

---

## 3. Especificaciones de Escenarios y Casos de Prueba

### 3.1. Escenario: ESC-4001 - Bloqueo y Prevención de Auto-validación

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que un usuario asumiendo la función de Validator pueda iniciar el bloqueo de una tarea para revisión, pero que el sistema le impida validar una tarea donde él mismo haya proporcionado previamente el mapeo. |
| **RF Asociados** | RF-4001, RF-4002 |
| **Precondiciones** | Usuario con nivel de experiencia para asumir la función de Validator (o Admin). Tareas disponibles en estado `MAPPED`. El usuario tiene al menos una tarea que mapeó previamente e intenta validar, y otra que fue mapeada por un tercero. |
| **Técnicas aplicadas**| Partición de Equivalencia, Transición de Estados |
| **Resultado Esperado** | El sistema debe conceder el bloqueo (`LOCKED_FOR_VALIDATION`) a tareas ajenas y emitir una denegación u ocultar la opción para la auto-validación, respetando la separación de labores. |

**B. Aplicación de Técnicas (Análisis)**

- **Partición de Equivalencia (Autoría de Mapeo):**
  - _Clase Válida:_ El usuario en función de Validator NO es el autor del último estado MAPPED.
  - _Clase Inválida:_ El usuario en función de Validator ES el autor del último estado MAPPED.
- **Transición de Estados (Pre-bloqueo):**
  - _Transición válida:_ De `MAPPED` a `LOCKED_FOR_VALIDATION`.

**C. Casos de Prueba Derivados**
| ID Caso | Pasos de Ejecución | Datos de Entrada (Clases aplicadas) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-4001-01** | 1. Iniciar sesión con un usuario apto para la función de Validator. <br>2. Seleccionar una tarea en estado `MAPPED` de otro usuario.<br>3. Solicitar validación. | **Autoría:** Tercero<br>**Cant:** Singular | El sistema asigna la tarea al usuario, cambiando su estado a `LOCKED_FOR_VALIDATION` y habilitando el panel de evaluación. |
| **CP-4001-02** | 1. Iniciar sesión con un usuario apto para la función de Validator. <br>2. Seleccionar una tarea en estado `MAPPED` registrada por sí mismo.<br>3. Intentar validarla. | **Autoría:** Propia<br>**Cant:** Singular | El sistema impide el acceso de validación sobre la tarea y alerta sobre la restricción de validarse a sí mismo. |
| **CP-4001-03** | 1. Iniciar sesión como `Mapper` (Nivel de experiencia sin permisos de validación). <br>2. Seleccionar una tarea en estado `MAPPED` de otro usuario.<br>3. Intentar bloquearla para revisión. | **Rol:** Mapper | El sistema oculta la opción de validación o deniega el acceso con un mensaje de permisos insuficientes. |
| **CP-4001-04** | 1. Iniciar sesión con un usuario apto para la función de Validator. <br>2. Seleccionar múltiples tareas (>1) en estado `MAPPED` de otros usuarios.<br>3. Solicitar validación en lote. | **Autoría:** Tercero<br>**Cant:** Múltiple | El sistema asigna todas las tareas seleccionadas al usuario, pasando el conjunto a estado `LOCKED_FOR_VALIDATION`. |
| **CP-4001-05** | 1. Iniciar sesión con un usuario apto para la función de Validator. <br>2. Seleccionar múltiples tareas en lote (incluyendo una mapeada por sí mismo y otras de terceros).<br>3. Solicitar validación de la selección. | **Autoría:** Mixta<br>**Cant:** Múltiple | El sistema bloquea las tareas de terceros y rechaza aisladamente/advierte sobre la tarea propia impidiendo que transicione. |
| **CP-4001-06** | 1. Iniciar sesión con un usuario apto para la función de Validator. <br>2. Seleccionar tarea en estado `READY` o `LOCKED_FOR_MAPPING`.<br>3. Intentar acceder a su validación. | **Estado Tarea:** Ready | La interfaz de usuario deshabilita el botón de validación, imposibilitando la acción sobre estados no listos. |
| **CP-4001-07** | 1. Iniciar sesión con un usuario apto para la función de Validator.<br>2. Seleccionar una tarea que se encuentre en estado `LOCKED_FOR_VALIDATION` por otro validador.<br>3. Intentar forzar el inicio de validación sobre ella. | **Autoría:** Tercero<br>**Estado Tarea:** Locked por tercero | El sistema deniega la acción, notificando que la tarea ya se encuentra bloqueada en concurrencia por otro revisor, impidiendo la asignación duplicada. |
| **CP-4001-08** | 1. Iniciar sesión con un usuario apto para la función de Validator.<br>2. Seleccionar una tarea en estado `VALIDATED` (Ya aprobada definitivamente).<br>3. Intentar iniciar un bloqueo de validación sobre ella. | **Autoría:** Tercero<br>**Estado Tarea:** Validated | La interfaz deshabilita el control o el sistema rechaza la petición, impidiendo reabrir un bloqueo sobre un elemento que ya cerró su ciclo de calidad. |
| **CP-4001-09** | 1. Iniciar sesión con un usuario apto para la función de Validator.<br>2. Seleccionar una tarea en estado `INVALIDATED` (Rechazada previamente).<br>3. Intentar iniciar un nuevo bloqueo para su re-evaluación antes de que un Mapper la corrija. | **Autoría:** Tercero<br>**Estado Tarea:** Invalidated | El sistema restringe el bloqueo, exigiendo que la tarea transicione primero por el flujo de corrección antes de ser elegible nuevamente para revisión. |
| **CP-4001-10** | 1. Iniciar sesión con un usuario apto para la función de Validator que posea además privilegios de Administrador global del sistema.<br>2. Seleccionar una tarea en estado `MAPPED` registrada por sí mismo.<br>3. Intentar solicitar la validación de su propio elemento. | **Autoría:** Propia<br>**Rol:** Validator + Admin | El sistema mantiene la restricción de auto-validación de forma estricta, bloqueando la acción y anteponiendo la regla de separación de funciones sobre el nivel de privilegios. |

---

### 3.2. Escenario: ESC-4002 - Evaluación de Calidad de Tareas Mapeadas

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que un usuario apto para evaluar pueda calificar satisfactoriamente, o rechazar, una tarea bloqueada; aplicando la designación final y retornando a la cola si fuera necesario. |
| **RF Asociados** | RF-4003 |
| **Precondiciones** | Usuario apto para la función de Validator autenticado. Tarea en estado `LOCKED_FOR_VALIDATION`. |
| **Técnicas aplicadas**| Partición de Equivalencia, Transición de Estados |
| **Resultado Esperado** | El sistema categoriza la tarea finalmente como `VALIDATED` (aprobado total) o `INVALIDATED` (para volver a mapear) y libera la tarea de su estatus bloqueado. |

**B. Aplicación de Técnicas (Análisis)**

- **Partición de Equivalencia (Decisión de Calidad):**
  - _Clase Válida 1:_ Aprobar (Todo correcto).
  - _Clase Válida 2:_ Rechazar / Invalidar (Errores presentes).
- **Transición de Estados:**
  - _Transición 1:_ De `LOCKED_FOR_VALIDATION` a `VALIDATED`.
  - _Transición 2:_ De `LOCKED_FOR_VALIDATION` a `INVALIDATED`.

**C. Casos de Prueba Derivados**
| ID Caso | Pasos de Ejecución | Datos de Entrada (Clases aplicadas) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-4002-01** | 1. Dentro del panel de evaluación, marcar la tarea como correctamente mapeada.<br>2. Enviar estado. | **Decisión:** Aprobar | La tarea queda registrada en estado `VALIDATED`, finalizando su flujo básico de calidad. |
| **CP-4002-02** | 1. Dentro del panel, marcar la tarea como incorrecta, añadir comentario técnico.<br>2. Enviar estado. | **Decisión:** Rechazar | La tarea cambia a estado `INVALIDATED` y es de vuelta a disposición de los mappers, anotando la retroalimentación. |
| **CP-4002-03** | 1. Dentro del panel, marcar la tarea como incorrecta (Invalidar), dejando el comentario vacío.<br>2. Enviar estado. | **Decisión:** Rechazar<br>**Comentario:** Nulo | El sistema previene el envío, requiriendo (habilitando alert/estado de error) que se adjunte un comentario explicativo. |
| **CP-4002-04** | 1. Con un lote de tareas bloqueadas simultáneamente, seleccionar Aprobar en unas e Invalidar en otras. <br>2. Enviar evaluaciones. | **Decisión:** Mixta | El sistema actualiza cada tarea a su estado asignado individualmente (`VALIDATED` / `INVALIDATED`), liberando los bloqueos correspondientes. |
| **CP-4002-05** | 1. Mantener bloqueada una tarea para validación por tiempo excesivo (Timeout).<br>2. Intentar evaluarla después de este límite de autoliberación. | **Estado:** Expirado | El sistema informa mediante de un error de timeout ("Ya no tienes esta tarea asignada") y la tarea se devuelve a su estado anterior. |
| **CP-4002-06** | 1. Seleccionar un lote compuesto exclusivamente por múltiples tareas asignadas simultáneamente.<br>2. Dentro del panel de decisiones, marcar todo el bloque completo bajo la opción única de `VALIDATED` (Aprobación masiva).<br>3. Enviar la evaluación en lote. | **Decisión:** Aprobar<br>**Cant:** Múltiple | El sistema procesa la transacción masiva de forma directa, transicionando todas las celdas del lote al estado `VALIDATED` simultáneamente y liberando sus bloqueos. |
| **CP-4002-07** | 1. Seleccionar un lote compuesto exclusivamente por múltiples tareas asignadas simultáneamente.<br>2. Dentro del panel de decisiones, marcar todo el bloque completo bajo la opción única de `INVALIDATED` (Rechazo masivo).<br>3. Enviar la evaluación en lote de forma directa. | **Decisión:** Rechazar<br>**Cant:** Múltiple | El sistema procesa la transacción masiva, cambia el estado de todas las celdas seleccionadas a `INVALIDATED` simultáneamente sin exigir comentarios y las devuelve a la cola general. |
| **CP-4002-08** | 1. Dentro del panel de una tarea bloqueada, seleccionar la opción para rechazar el mapeo (`INVALIDATED`).<br>2. En el cuadro de comentarios opcional, ingresar una cadena de texto técnica que contenga caracteres especiales, símbolos de mapeo o formato enriquecido.<br>3. Confirmar el envío de la evaluación. | **Decisión:** Rechazar<br>**Comentario:** Caracteres especiales | El sistema procesa la invalidación cambiando el estado a `INVALIDATED` y guarda el texto en el historial de forma correcta sin corromper la codificación de los símbolos. |
| **CP-4002-09** | 1. Dentro del panel de una tarea bloqueada, seleccionar la opción para rechazar el mapeo (`INVALIDATED`).<br>2. En el cuadro de comentarios opcional, introducir un bloque de texto plano extenso continuo que simule el límite máximo de almacenamiento del campo.<br>3. Confirmar el envío de la evaluación. | **Decisión:** Rechazar<br>**Comentario:** Longitud máxima extensa | El sistema asimila el texto completo sin truncar la retroalimentación, registra la tarea como `INVALIDATED` y asocia el bloque de texto íntegro en su línea de tiempo de actividades. |
| **CP-4002-10** | 1. Dentro del panel de una tarea bloqueada, seleccionar la opción para evaluar el mapeo (`VALIDATED` o `INVALIDATED`).<br>2. En el cuadro de comentarios, redactar una descripción técnica e insertar o adjuntar una imagen que evidencie el estado del elemento geográfico.<br>3. Confirmar el envío de la evaluación. | **Decisión:** Evaluar con multimedia<br>**Comentario:** Texto e imagen | El sistema procesa el cambio de estado con éxito, guarda el comentario y almacena la imagen adjunta de forma correcta, permitiendo su visualización posterior en la línea de tiempo de la tarea. |

---

### 3.3. Escenario: ESC-4003 - Revertir acciones previas (Undo)

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Asegurar que el usuario pueda usar la función "deshacer" para revocar su última operación sobre una tarea de revisión, recuperando el estado funcional idéntico antes de tal acción. |
| **RF Asociados** | RF-4004 |
| **Precondiciones** | Usuario (Mapper o con función de Validator) que acaba de ejecutar una transición en una tarea. La tarea todavía tiene a este usuario en el historial inmediato. |
| **Técnicas aplicadas**| Transición de Estados |
| **Resultado Esperado** | El estado de la tarea retorna exactamente al valor reportado anterior al dictamen, con constancia textual o sistémica de reversión. |

**B. Aplicación de Técnicas (Análisis)**

- **Transición de Estados (Vuelta atrás):** Reversión hacia los dictados anteriores (Ej. de `VALIDATED` a `LOCKED_FOR_VALIDATION` / `MAPPED` o simplemente deshacer mapping enviado).

**C. Casos de Prueba Derivados**
| ID Caso | Pasos de Ejecución | Datos de Entrada (Clases aplicadas) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-4003-01** | 1. Desde el historial de ejecución propio o del proyecto, buscar la tarea recientemente modificada.<br>2. Accionar el botón de Deshacer (Undo) último estado. | **Decisión:** Ejecutar Undo (Desde Validated) | El sistema revierte la categorización retornando la tarea al estado anterior, anotándolo en sus registros (timeline). |
| **CP-4003-02** | 1. Teniendo una tarea recién evaluada como `INVALIDATED` (roja), presionar Undo. | **Decisión:** Ejecutar Undo (Desde Invalidated) | El sistema permite devolver la tarea hacia bloqueado para revisión o Mapped para repensar la calificación, saliendo del color rojo. |
| **CP-4003-03** | 1. Visualizar una tarea `VALIDATED` cuya evaluación final fue efectuada por OTRO usuario.<br>2. Intentar Deshacer (Undo) su acción. | **Propiedad:** Tercero | La opción o botón "Undo" no está disponible (oculta/deshabilitada) o responde error de restricción, ya que la acción no pertenece al usuario actual. |
| **CP-4003-04** | 1. Tras presionar Undo una vez con éxito, presionar Undo una segunda vez consecutiva sobre la misma tarea. | **Decisión:** Undo recursivo | El sistema devuelve error o deshabilita la opción notificando que no existe otra acción reciente atribuible en el historial para ser deshecha. |
| **CP-4003-05** | 1. Iniciar sesión con un usuario estándar que no posea la función de Validator asignada.<br>2. Seleccionar una tarea del listado y abrir el modal de detalles.<br>3. Hacer clic en el Undo para solicitar revalidación. | **Rol:** Mapper estándar<br>**Decisión:** Ejecutar Undo (Invalidated) | El sistema visualiza la opción en la interfaz pero impide su ejecución en el servidor, manteniendo la tarea en su estado actual sin aplicar ningún cambio ni registrar transiciones. |


---

## 4. Matriz de Trazabilidad del Módulo

| Requerimiento Funcional (RF) | Especificación de Escenario (ESC) | Casos de Prueba (CP) derivados | Técnicas de Diseño Aplicadas |
| :--- | :--- | :--- | :--- |
| **RF-4001** | ESC-4001 | CP-4001-01, CP-4001-03, CP-4001-04, CP-4001-06, CP-4001-07, CP-4001-08, CP-4001-09 | Partición de Equivalencia, Trans. Estados |
| **RF-4002** | ESC-4001 | CP-4001-02, CP-4001-05, CP-4001-10 | Partición de Equivalencia |
| **RF-4003** | ESC-4002 | CP-4002-01, CP-4002-02, CP-4002-03, CP-4002-04, CP-4002-05, CP-4002-06, CP-4002-07, CP-4002-08, CP-4002-09, CP-4002-10 | Partición de Equivalencia, Transición Estados|
| **RF-4004** | ESC-4003 | CP-4003-01, CP-4003-02, CP-4003-03, CP-4003-04, CP-4003-05| Transición de Estados |