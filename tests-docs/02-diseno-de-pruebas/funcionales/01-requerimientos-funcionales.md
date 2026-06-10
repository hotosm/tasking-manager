# Documento de Especificación de Requerimientos Funcionales (DERF)
**Proyecto:** HOTOSM Tasking Manager
**Versión del Documento:** 1.0
**Tipo de Análisis:** Ingeniería Inversa de Requisitos / Análisis de Caja Negra

---

## 1. Descripción general del sistema

El presente documento formaliza los requerimientos funcionales del **HOTOSM Tasking Manager (TM)**, la herramienta principal de coordinación para el mapeo colaborativo del Equipo Humanitario de OpenStreetMap (HOT).

*   **Objeto de análisis:** La instancia oficial de producción ([tasks.hotosm.org](https://tasks.hotosm.org)).
*   **Alcance:** El análisis abarca la funcionalidad estrictamente observable desde la interfaz gráfica de usuario (UI)
*   **Objetivo:** Establecer una línea base documentada, con alta trazabilidad que sirva como insumo oficial para el diseño, ejecución y automatización de pruebas de software (Caja Negra, Pruebas de Integración y Pruebas Unitarias).

---

## 2. Actores del sistema

El sistema implementa un modelo de Control de Acceso Basado en Roles (RBAC) superpuesto con un sistema de "Niveles de Experiencia" calculados dinámicamente.

| ID | Nombre del Actor | Descripción Funcional |
| :--- | :--- | :--- |
| **ACT-0001** | **Usuario Anónimo** | Visitante sin autenticar. Sus capacidades se limitan a la exploración de proyectos públicos, visualización de estadísticas globales y acceso a documentación. |
| **ACT-0002** | **Mapper** | Usuario autenticado vía OpenStreetMap. Posee un nivel de experiencia calculado automáticamente (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`). Puede bloquear, mapear y comentar tareas. |
| **ACT-0003** | **Validator** | Usuario con permisos elevados (por su nivel de experiencia o por membresía en un equipo de validación) autorizado para auditar, aprobar o rechazar el mapeo realizado por otros usuarios. |
| **ACT-0004** | **Project Manager (PM)** | Administrador a nivel de Organización o Equipo. Tiene privilegios para crear proyectos, definir Áreas de Interés (AOI), asignar permisos, transferir propiedad y administrar membresías. |
| **ACT-0005** | **SysAdmin** | Administrador global de la plataforma. Posee acceso irrestricto para gestionar campañas, licencias globales, roles de otros usuarios y configuraciones del sistema. |
| **ACT-0006** | **Sistema** | Procesos automatizados en segundo plano (Cron Jobs / Background Tasks) encargados de liberar tareas expiradas, actualizar estadísticas contra APIs externas (Ohsome) y disparar notificaciones. |

---

## 3. Módulos del sistema

La arquitectura funcional del Tasking Manager se ha segmentado lógicamente en los siguientes módulos para facilitar la cobertura de pruebas.

| ID | Nombre del Módulo | Descripción |
| :--- | :--- | :--- |
| **MOD-0001** | **Autenticación y Perfil** | Gestión del ciclo de vida de la sesión (OAuth 2.0 con OSM), cálculo de métricas de usuario, niveles de mapeo y aceptación de licencias. |
| **MOD-0002** | **Exploración de Proyectos** | Motor de búsqueda, filtros avanzados (por estado, dificultad, campañas), ordenamiento y renderizado en mapa (BBOX). |
| **MOD-0003** | **Ejecución de Mapeo (Tasking)** | Lógica core de bloqueo/desbloqueo de tareas, división de grillas (Split) e integración con editores geográficos externos (iD, JOSM, Rapid). |
| **MOD-0004** | **Proceso de Validación** | Flujo de control de calidad. Incluye bloqueo múltiple, prevención de auto-validación y transiciones de estado (`VALIDATED`, `INVALIDATED`). |
| **MOD-0005** | **Administración de Proyectos** | Creación de proyectos (AOI, Tareas por grilla o arbitrarias), clonación, configuración de metadatos y privacidad. |
| **MOD-0006** | **Gobernanza (Equipos y Orgs)** | Gestión jerárquica de permisos. Creación de Organizaciones, Equipos, flujos de invitación/solicitud de unión y asignación de proyectos. |
| **MOD-0007** | **Comunicación y Alertas** | Subsistema de notificaciones (in-app y email), chat general de proyectos, menciones (`@usuario`) y comentarios por tarea. |

---

## 4. Catálogo de Requerimientos Funcionales

A continuación, se detallan los requerimientos funcionales extraídos y deducidos, estructurados para su directa conversión en Casos de Prueba.

### MOD-0001: Autenticación y Perfil
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-1001** | **Login delegado (OAuth)** | El sistema debe autenticar al usuario redirigiéndolo al proveedor OAuth de OSM y crear una sesión local basada en el token devuelto. | ACT-0001 | MOD-0001 | Alta | - |
| **RF-1002** | **Cálculo de nivel de Mapper** | Tras la autenticación, el sistema debe consultar la API de OSM/Ohsome para contabilizar *changesets* y calcular el nivel del usuario (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`). | ACT-0006 | MOD-0001 | Alta | RF-1001 |
| **RF-1003** | **Aceptación de Licencias** | Si un proyecto tiene una licencia asignada, el sistema debe bloquear la contribución hasta que el usuario confirme la aceptación de los términos. | ACT-0002 | MOD-0001 | Alta | RF-1001, RF-3001 |
| **RF-1004** | **Actualización de Perfil** | El usuario debe poder modificar su correo, género, y preferencias de notificaciones desde la interfaz de ajustes de perfil. | ACT-0002 | MOD-0001 | Media | RF-1001 |

### MOD-0002: Exploración de Proyectos
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-2001** | **Filtros de Búsqueda** | El sistema debe permitir filtrar proyectos por nivel de dificultad, estado (`DRAFT`, `PUBLISHED`, `ARCHIVED`), campaña y tipo de mapeo. | ACT-0001 | MOD-0002 | Alta | - |
| **RF-2002** | **Búsqueda por BBOX** | El sistema debe renderizar en la vista de mapa solo los proyectos cuyos polígonos intersecten con las coordenadas de la vista actual (Bounding Box). | ACT-0001 | MOD-0002 | Media | - |
| **RF-2003** | **Restricción de Proyectos Privados** | Los proyectos marcados como privados no deben ser listados en la exploración general a menos que el usuario pertenezca a un equipo autorizado o sea Admin. | ACT-0002 | MOD-0002 | Alta | RF-1001 |

### MOD-0003: Ejecución de Mapeo (Tasking)
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-3001** | **Bloqueo singular de tarea** | El sistema debe permitir a un Mapper bloquear una tarea en estado `READY` cambiándola a `LOCKED_FOR_MAPPING`. Solo se permite una tarea en mapeo a la vez por usuario. | ACT-0002 | MOD-0003 | Crítica | RF-1001 |
| **RF-3002** | **Integración de Editor Web** | Al seleccionar iD o Rapid, el sistema debe inyectar la URL base con parámetros geográficos (Zoom, X, Y) y comentarios predeterminados (`changesetComment`). | ACT-0002 | MOD-0003 | Alta | RF-3001 |
| **RF-3003** | **Integración de Editor Local (JOSM)** | Al seleccionar JOSM, el sistema debe comprobar disponibilidad local (HTTP GET `127.0.0.1:8111`). Si no responde, debe mostrar un modal de error (`JOSMError`). | ACT-0002 | MOD-0003 | Alta | RF-3001 |
| **RF-3004** | **Envío de estado (Submit)** | El sistema debe permitir desbloquear la tarea asignando un estado final: `MAPPED` (completada), `BADIMAGERY` (no mapeable) o regresar a `READY`. | ACT-0002 | MOD-0003 | Crítica | RF-3001 |
| **RF-3005** | **División de tarea (Split)** | Un Mapper debe poder dividir una tarea bloqueada en 4 sub-tareas más pequeñas, sujeto al límite máximo de zoom configurado. | ACT-0002 | MOD-0003 | Media | RF-3001 |
| **RF-3006** | **Liberación por tiempo (Auto-unlock)** | El sistema debe revertir automáticamente tareas bloqueadas a estado `READY` si el tiempo de bloqueo excede la configuración (`autoUnlockSeconds`). | ACT-0006 | MOD-0003 | Alta | RF-3001 |

### MOD-0004: Proceso de Validación
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-4001** | **Bloqueo de tareas para validación** | El sistema debe permitir a un Validator bloquear una o múltiples tareas en estado `MAPPED` (pasando a `LOCKED_FOR_VALIDATION`). | ACT-0003 | MOD-0004 | Alta | RF-3004 |
| **RF-4002** | **Prevención de Auto-Validación** | El sistema debe rechazar la validación si el usuario intentando validar es el mismo que registró el estado `MAPPED` de la tarea. | ACT-0003 | MOD-0004 | Alta | RF-4001 |
| **RF-4003** | **Evaluación de calidad** | El sistema debe permitir clasificar la tarea revisada como `VALIDATED` (aprobada) o `INVALIDATED` (rechazada, vuelve a requerir mapeo). | ACT-0003 | MOD-0004 | Crítica | RF-4001 |
| **RF-4004** | **Deshacer acción (Undo)** | El usuario debe poder revertir su propia última acción en una tarea, regresando el estado previo, registrando un comentario en el historial. | ACT-0002 | MOD-0004 | Media | RF-3004, RF-4003 |

### MOD-0005: Administración de Proyectos
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-5001** | **Creación de Área de Interés (AOI)** | El sistema debe procesar archivos GeoJSON/KML o dibujos en pantalla para definir el polígono general del proyecto (AOI) y validarlo contra `MAX_AOI_AREA`. | ACT-0004 | MOD-0005 | Alta | RF-1001 |
| **RF-5002** | **Generación de Grilla** | El sistema debe calcular y recortar polígonos secundarios (Grid) para generar las Tareas dentro del AOI de forma automática. | ACT-0004 | MOD-0005 | Alta | RF-5001 |
| **RF-5003** | **Privacidad y Permisos** | El sistema debe permitir configurar la visibilidad (Público/Privado) y establecer qué niveles o Equipos pueden Mapear y/o Validar. | ACT-0004 | MOD-0005 | Alta | - |
| **RF-5004** | **Clonación de Proyectos** | El sistema debe permitir generar un nuevo proyecto copiando el AOI, grilla, intereses y descripción de un proyecto preexistente. | ACT-0004 | MOD-0005 | Media | - |
| **RF-5005** | **Transferencia de Propiedad** | El autor de un proyecto debe poder transferir la propiedad del mismo a otro usuario que posea privilegios de PM o Admin. | ACT-0004 | MOD-0005 | Baja | - |

### MOD-0006: Gobernanza (Organizaciones y Equipos)
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-6001** | **Gestión de Equipos** | Un Admin o PM debe poder crear equipos, asignarles visibilidad (`PUBLIC`/`PRIVATE`) y método de ingreso (`ANY`, `BY_REQUEST`, `BY_INVITE`). | ACT-0004 | MOD-0006 | Alta | - |
| **RF-6002** | **Solicitud de Membresía** | Si el equipo es `BY_REQUEST`, un Mapper puede solicitar unirse, generando una notificación a los administradores del equipo. | ACT-0002 | MOD-0006 | Media | RF-6001 |
| **RF-6003** | **Aprobación de Membresía** | Un Manager del equipo debe poder aceptar solicitudes de unión, cambiando el estado del usuario dentro del equipo a Activo (`MEMBER`). | ACT-0004 | MOD-0006 | Media | RF-6002 |

### MOD-0007: Comunicación y Notificaciones
| ID | Nombre | Descripción Funcional | Actor | Módulo | Prioridad | Dependencias |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-7001** | **Comentarios por Tarea** | El sistema debe permitir adjuntar comentarios de texto plano o Markdown asociados al historial de una tarea específica. | ACT-0002 | MOD-0007 | Alta | - |
| **RF-7002** | **Notificaciones in-app** | El sistema debe notificar al usuario cuando su tarea sea `INVALIDATED`, cuando sea mencionado (`@username`) o cuando suba de nivel de mapeo. | ACT-0006 | MOD-0007 | Alta | RF-4003 |
| **RF-7003** | **Envío de Emails** | Si el usuario tiene correos habilitados, el sistema debe despachar alertas SMTP para notificaciones críticas e hitos de finalización de proyectos. | ACT-0006 | MOD-0007 | Media | RF-1004 |
