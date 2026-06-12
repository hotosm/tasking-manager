# Diseño de Pruebas Funcionales: MOD-06 - Gobernanza (Organizaciones y Equipos)
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo

Este módulo gestiona la estructura jerárquica de agrupaciones de usuarios y la delegación de permisos dentro de la plataforma. Su responsabilidad principal es la creación y administración de Organizaciones y Equipos, controlando sus políticas de visibilidad (`PUBLIC`, `PRIVATE`), métodos de ingreso (`ANY`, `BY_REQUEST`, `BY_INVITE`) y orquestando el ciclo de vida de las solicitudes de membresía para segmentar de forma segura el acceso a los proyectos.

*Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](./01-requerimientos-funcionales.md).*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general

El enfoque de pruebas para este módulo será de extremo a extremo (End-to-End), orientado fuertemente a la validación del Control de Acceso Basado en Roles (RBAC) y la correcta segregación de privilegios. 

La estrategia evaluará dos perspectivas complementarias: la del actor administrativo (**`Project Manager` ACT-0004** o **`SysAdmin` ACT-0005**) encargado de configurar las políticas de gobernanza, y la del actor base (**`MAPPER` ACT-0002**) que interactúa con estas estructuras para solicitar membresías. Se priorizará la verificación del comportamiento de la interfaz al exponer u ocultar información según la visibilidad del equipo, así como la correcta gestión transaccional de las solicitudes de ingreso desde que se emiten hasta que son resueltas por un administrador.

### 2.2. Técnicas de Caja Negra Utilizadas

Para garantizar una cobertura exhaustiva de las políticas de acceso y los flujos de membresía, se aplicarán las siguientes metodologías de diseño:

*   **Partición de Equivalencia (Equivalence Partitioning):** Técnica fundamental para este módulo, utilizada para reducir el infinito número de interacciones de usuarios a clases representativas basadas en sus roles (por ejemplo, Admin, Org Manager, Team Manager, Mapper, Anónimo). También se aplicará para agrupar los atributos de configuración de los equipos (Visibilidad Pública vs. Privada).
*   **Tablas de Decisión (Decision Table Testing):** Se utilizará para modelar la lógica de negocio detrás de la acción de "Unirse a un Equipo". La interfaz debe reaccionar de manera diferente combinando múltiples entradas: el método de ingreso del equipo (`ANY`, `BY_REQUEST`, `BY_INVITE`), el rol del usuario y su estado de membresía actual.
*   **Transición de Estados (State Transition Testing):** Aplicada específicamente para auditar el flujo de trabajo (workflow) de las solicitudes de membresía de los usuarios. Validará que los cambios de estado del actor dentro de un equipo (de `None` a `Pending`, y de `Pending` a `Active` o `Rejected`) sigan estrictamente las transiciones permitidas por la plataforma mediante la intervención de un administrador autorizado.

## 3. Especificaciones de Escenarios y Casos de Prueba

### 3.1. Escenario: [ESC-6001] - Creación y Configuración Inicial de Equipos

**A. Definición del Escenario**

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permite la creación y configuración inicial de un Equipo (asignando su Organización padre, nivel de visibilidad y método de ingreso) exclusivamente a usuarios con privilegios administrativos, restringiendo el acceso y la habilitación de los controles de interfaz a usuarios sin autorización. |
| **RF Asociados** | RF-6001 |
| **Precondiciones** | Organización matriz previamente creada en el sistema. |
| **Técnicas aplicadas**| Partición de Equivalencia (PE). |
| **Resultado Esperado** | El sistema procesa la creación del equipo, lo asocia a la organización correspondiente y redirige al usuario a la vista de gestión del equipo (`/manage/teams/{id}`). Las solicitudes sin privilegios o con datos incompletos son bloqueadas a nivel de interfaz o rechazadas por la API. |

**B. Aplicación de Técnicas (Análisis)**

**B.1. Partición de Equivalencia (PE)**
La creación de equipos está gobernada por estrictas reglas de Control de Acceso (RBAC) y validación de formularios. Se aplica la Partición de Equivalencia para agrupar los tipos de usuarios que interactúan con el sistema y los estados del formulario de creación, reduciendo la cantidad de pruebas necesarias y cubriendo todas las fronteras de validación.

| Cod. | Campo / Condición Analizada | Clase Válida | Clases No Válidas |
| :--- | :--- | :--- | :--- |
| **MOD06-PE-001** | Privilegios del Usuario (Control de Acceso) | 1. Administrador Global (`ADMIN`).<br>2. Gestor de la Organización (`ORG MANAGER`). | 1. Usuario estándar (`MAPPER`).<br>2. Usuario no autenticado (Anónimo). |
| **MOD06-PE-002** | Entrada: Nombre del Equipo | Cadena de texto alfanumérica (> 0 caracteres). | Cadena de texto vacía. |
| **MOD06-PE-003** | Configuración: Visibilidad (`visibility`) | `PUBLIC`, `PRIVATE`. | Valores nulos o alterados en la petición (por ejemplo, `HIDDEN`). |
| **MOD06-PE-004** | Configuración: Método de ingreso (`joinMethod`) | `ANY`, `BY_REQUEST`, `BY_INVITE`. | Valores nulos o no soportados. |

*   *Comportamiento esperado (MOD06-PE-001 - Clase Válida):* El botón de "Nuevo Equipo" es visible en la interfaz de gestión y la petición `POST` al endpoint retorna `HTTP 201 Created`.
*   *Comportamiento esperado (MOD06-PE-001 - Clases No Válidas):* La interfaz oculta el botón de creación. Si se fuerza la petición vía API, el sistema retorna `HTTP 403` indicando `CreateTeamNotPermitted`.
*   *Comportamiento esperado (MOD06-PE-002 - Clases No Válidas):* La interfaz mantiene deshabilitado el botón "Crear Equipo" hasta que el campo contenga un valor.

**C. Casos de Prueba Derivados**

| ID Caso | Pasos de Ejecución | Datos de Entrada / Contexto | Resultado Esperado | Técnicas / Etiquetas Aplicadas |
| :--- | :--- | :--- | :--- | :--- |
| **CP-6001-01** | 1. Autenticar y navegar a "Crear Equipo".<br>2. Completar formulario.<br>3. Enviar. | **Rol:** `ADMIN`<br>**Nombre:** "Alpha Team"<br>**Visibilidad:** `PUBLIC`<br>**Ingreso:** `ANY` | Creación exitosa (`HTTP 201`). El sistema muestra notificación (Toast) de éxito y redirige a la vista del detalle del equipo. | PE-001 (Válido)<br>PE-002 (Válido)<br>PE-003 (Válido) |
| **CP-6001-02** | 1. Autenticar y navegar a "Crear Equipo".<br>2. Completar formulario.<br>3. Enviar. | **Rol:** `ORG MANAGER`<br>**Nombre:** "Bravo Team"<br>**Visibilidad:** `PRIVATE`<br>**Ingreso:** `BY_REQUEST` | Creación exitosa (`HTTP 201`). El usuario queda automáticamente registrado como Manager del equipo creado. | PE-001 (Válido)<br>PE-003 (Válido)<br>PE-004 (Válido) |
| **CP-6001-03** | 1. Autenticar y navegar a "Crear Equipo".<br>2. Dejar el campo nombre vacío.<br>3. Intentar enviar. | **Rol:** `ADMIN`<br>**Nombre:** `""` (Vacío)<br>**Visibilidad:** `PUBLIC` | El botón de "Crear Equipo" (`Create Team`) permanece deshabilitado (Disabled). No se envía petición de red. | PE-002 (No Válida) |
| **CP-6001-04** | 1. Autenticar como usuario base.<br>2. Acceder al dashboard de equipos.<br>3. Intentar forzar petición API de creación. | **Rol:** `MAPPER` | La UI no muestra el botón "New".<br>La petición forzada retorna error `HTTP 403: User not permitted to create team`. | PE-001 (No Válida) |
| **CP-6001-05** | 1. Cargar la URL de creación de equipos de forma directa. | **Rol:** Anónimo (Sin token) | El sistema redirige al usuario a la pantalla de inicio de sesión (`/login`) o retorna `HTTP 401`. | PE-001 (No Válida) |
