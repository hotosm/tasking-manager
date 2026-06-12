# Diseño de Pruebas Funcionales: MOD-03 - Ejecución de Mapeo (Tasking)
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo

Este módulo gestiona el flujo de trabajo central de contribución geográfica de la plataforma. Es responsable de coordinar la selección, el bloqueo exclusivo, la interacción con herramientas de edición (tanto basadas en la web como locales) y la liberación o actualización de estado de las tareas dentro de un proyecto. Su propósito principal es garantizar la concurrencia segura de múltiples usuarios, previniendo colisiones de edición y asegurando la correcta evolución del progreso de mapeo del proyecto.

*Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](../funcionales/01-requerimientos-funcionales.md).*

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

Para asegurar una cobertura funcional completa del módulo **MOD-03: Ejecución de Mapeo (Tasking)** sin redundancia, se proponen **4 Especificaciones de Escenarios de Prueba (ESC)**. 

El módulo 3 contiene flujos transaccionales altamente acoplados. Dividirlo en 4 escenarios permite aislar las lógicas de negocio utilizando la técnica más adecuada para cada una:
1. Permisos y precondiciones de entrada (Tabla de Decisión).
2. Salida y cambio de estado de la tarea (Transición de Estados).
3. Geometría y límites de la plataforma (Análisis de Valores Límite).
4. Acciones automatizadas del sistema en segundo plano.

| ID Escenario | Descripción Breve | RF Cubiertos | Alcance Funcional | Técnica Principal |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-3001** | **Bloqueo e inicio de tarea** | RF-3001, RF-3002, RF-3003 | Verifica si el usuario (`MAPPER`) puede tomar una tarea basado en permisos, licencias, exclusividad y selecciona un editor. | Tabla de Decisión, Partición de Equivalencia |
| **ESC-3002** | **Liberación y envío de tarea** | RF-3004 | Cubre la finalización del mapeo y las opciones de estado (Completado, Mala Imagen, Dejar lista). | Transición de Estados |
| **ESC-3003** | **División de tarea (Split)** | RF-3005 | Evalúa la capacidad de fraccionar una grilla basándose en el nivel de zoom cartográfico. | Análisis de Valores Límite |
| **ESC-3004** | **Expiración de bloqueo** | RF-3006 | Valida la liberación forzada por el Sistema cuando el usuario excede el tiempo límite asignado. | Análisis de Valores Límite |


### 3.1. Escenario: [ESC-3001] - Solicitud de Bloqueo e Inicio de Tarea de Mapeo

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permite a un usuario `MAPPER` obtener el bloqueo exclusivo de una tarea en estado `READY`, evaluando concurrentemente las reglas de negocio restrictivas (niveles, licencias, tareas ya bloqueadas) y lanzar correctamente el editor seleccionado. |
| **RF Asociados** | RF-3001, RF-3002, RF-3003 |
| **Precondiciones** | Proyecto #1 en estado `PUBLISHED`. Tarea #1 en estado `READY`. Usuario `MAPPER` (ACT-0002) autenticado en el sistema. |
| **Técnicas aplicadas**| Tablas de Decisión (Decision Table Testing), Partición de Equivalencia (EP). |
| **Resultado Esperado** | Si se cumplen las condiciones, la tarea cambia de `READY` a `LOCKED_FOR_MAPPING` y se renderiza el editor de mapas correspondiente. En caso contrario, se deniega con un mensaje de error específico. |

**B. Aplicación de Técnicas**

#### B.1. Tablas de Decisión (Decision Table)
Debido a que existen múltiples condiciones lógicas que deben evaluarse simultáneamente antes de permitir el bloqueo (acceso a licencias, tareas simultáneas, nivel de mapeo permitido), se modela una Tabla de Decisión para capturar las combinaciones válidas e inválidas.

| Condiciones / Acciones | Regla 1 | Regla 2 | Regla 3 | Regla 4 | Regla 5 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Condiciones** | | | | | |
| ¿Nivel de Mapeo Cumple Requisito? | True | False | True | True | True |
| ¿Licencia Requerida Aceptada? | True | N/A | False | True | True |
| ¿Usuario NO tiene tareas bloqueadas? | True | N/A | N/A | False | True |
| ¿Tarea en estado `READY`? | True | N/A | N/A | N/A | False |
| **Acciones** | | | | | |
| Permitir Bloqueo (`LOCKED_FOR_MAPPING`) | **X** | | | | |
| Error: *UserNotAllowed* (Permisos) | | **X** | | | |
| Error: *UserLicenseError* (Licencias) | | | **X** | | |
| Error: *UserAlreadyHasTaskLocked* | | | | **X** | |
| Error: *InvalidTaskState* | | | | | **X** |

#### B.2. Partición de Equivalencia (Equivalence Partitioning)
Una vez que el bloqueo es exitoso (Regla 1 de la tabla anterior), el sistema debe derivar al usuario al editor cartográfico seleccionado. Aplicamos EP sobre el parámetro de entrada "Tipo de Editor".

| Invalid | Valid | Invalid |
| :--- | :--- | :--- |
| Editor No Soportado / Ninguno | Editores Soportados por TM | Valores Corruptos |
| *e.g., "CustomApp123"* | *e.g., "ID", "RAPID", "JOSM"* | *e.g., Null, Blank* |
| **Comportamiento esperado:** Muestra fallback al editor por defecto (iD). | **Comportamiento esperado:** Abre iD/Rapid en Iframe, o contacta a `127.0.0.1:8111` para JOSM. | **Comportamiento esperado:** Muestra fallback al editor por defecto (iD). |


**C. Casos de Prueba Derivados**

Basándonos en la Tabla de Decisión y las Particiones de Equivalencia, se consolidan los siguientes Casos de Prueba (CP) ejecutables:

| ID Caso | Pasos de Ejecución | Datos de Entrada / Contexto | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-3001-01** | 1. Clic en "Mapear Tarea".<br>2. Seleccionar editor "iD". | **Regla 1 (Happy Path)**<br>Nivel OK, Licencia OK, 0 Tareas bloqueadas, Estado: `READY`. | Bloqueo exitoso (`LOCKED_FOR_MAPPING`). La UI carga el Iframe del editor iD. |
| **CP-3001-02** | 1. Clic en "Mapear Tarea". | **Regla 2 (Fallo Nivel)**<br>Nivel Usuario: `BEGINNER`<br>Req. Proyecto: `ADVANCED` | Bloqueo denegado. Aparece Modal/Alerta: "You are not allowed to map this project". |
| **CP-3001-03** | 1. Clic en "Mapear Tarea". | **Regla 3 (Fallo Licencia)**<br>Licencia Aceptada: False | Bloqueo denegado. Aparece Modal obligando a aceptar los "Terms of Use". |
| **CP-3001-04** | 1. Bloquear Tarea #1.<br>2. Intentar bloquear Tarea #2. | **Regla 4 (Fallo Concurrencia)**<br>Tareas bloqueadas actuales: 1. | Tarea #2 denegada. Alerta: "You already have a locked task". |
| **CP-3001-05** | 1. Seleccionar editor "JOSM".<br>2. Clic en "Mapear Tarea". | **Clase Válida (Editor Local)**<br>JOSM apagado localmente. | Alerta: "JOSM is not running". Falla el envío de datos. |
