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

*   **Partición de Equivalencia (Equivalence Partitioning):** Técnica fundamental para este módulo, utilizada para reducir el infinito número de interacciones de usuarios a clases representativas basadas en sus roles (ej. Admin, Org Manager, Team Manager, Mapper, Anónimo). También se aplicará para agrupar los atributos de configuración de los equipos (Visibilidad Pública vs. Privada).
*   **Tablas de Decisión (Decision Table Testing):** Se utilizará para modelar la lógica de negocio detrás de la acción de "Unirse a un Equipo". La interfaz debe reaccionar de manera diferente combinando múltiples entradas: el método de ingreso del equipo (`ANY`, `BY_REQUEST`, `BY_INVITE`), el rol del usuario y su estado de membresía actual.
*   **Transición de Estados (State Transition Testing):** Aplicada específicamente para auditar el flujo de trabajo (workflow) de las solicitudes de membresía de los usuarios. Validará que los cambios de estado del actor dentro de un equipo (de `None` a `Pending`, y de `Pending` a `Active` o `Rejected`) sigan estrictamente las transiciones permitidas por la plataforma mediante la intervención de un administrador autorizado.
