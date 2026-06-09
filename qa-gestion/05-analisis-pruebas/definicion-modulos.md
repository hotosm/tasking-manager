#  Definición de Módulos Finales para Pruebas (Hito 2)
**Analistas de Pruebas (Test Analysts):** Jhonatan Arias & Alexandra Quispe
**Objetivo:** Proveer a los Test Designers los módulos funcionales core del Tasking Manager y sus reglas de negocio para el diseño de Casos de Prueba de Caja Negra.

Tras realizar un análisis profundo de la arquitectura Full-Stack y el mapa de código del repositorio, hemos filtrado la lógica de negocio y definido **3 Módulos Funcionales Core** que deberán ser cubiertos para alcanzar los objetivos del Sprint 2.

---

###  Módulo 1: Gestión de Proyectos (Project Service)
* **Ref. Arquitectura:** Backend `project_service.py` [Módulo 2 del CodeMap] y API Endpoints `/api/v2/projects` [Módulo 6].
* **Descripción Funcional:** Módulo encargado del CRUD (Creación, Lectura, Actualización y Borrado) de las campañas de mapeo.
* **Directrices para Test Designers (Diseño Caja Negra):**
  * **Partición de Equivalencia:** Probar la creación de proyectos con polígonos GeoJSON válidos vs. inválidos o vacíos.
  * **Reglas de Negocio:** Validar el método `is_user_permitted_to_validate()`. ¿Qué ocurre si un usuario sin rol de Administrador intenta borrar o editar un proyecto que no le pertenece?
  * **Manejo de Errores:** Forzar la consulta de un `project_id` inexistente para validar que el sistema retorne correctamente la excepción `HTTP 404 Project not found`.

---

###  Módulo 2: Flujo de Mapeo y Bloqueo de Tareas (Mapping Service)
* **Ref. Arquitectura:** Backend `mapping_service.py` [Módulo 3 del CodeMap] y Cron Jobs `cron_jobs.py` [Módulo 10].
* **Descripción Funcional:** El corazón transaccional del sistema. Gestiona cómo los usuarios reservan (bloquean) un cuadrante del mapa para editarlo y cómo el sistema libera esos bloqueos.
* **Directrices para Test Designers (Diseño Caja Negra):**
  * **Transiciones de Estado:** Validar el cambio de estado de una tarea: de `READY` a `LOCKED_FOR_MAPPING`.
  * **Valores Límite y Concurrencia:** ¿Qué ocurre si dos usuarios intentan ejecutar `lock_task_for_mapping()` sobre el mismo `task_id` en el mismo milisegundo?
  * **Pruebas de Tiempo (Time-based):** Diseñar un caso para el "Auto-desbloqueo de Tareas" (`auto_unlock_tasks`). Validar que si el tiempo expira, la tarea regresa a `READY`.

---

###  Módulo 3: Validación y Permisos de Usuarios (Validator & User Service)
* **Ref. Arquitectura:** Backend `validator_service.py` [Módulo 4 del CodeMap] y `user_service.py` [Módulo 5].
* **Descripción Funcional:** Módulo de control de calidad interno del Tasking Manager. Gestiona quién tiene permiso para aprobar o rechazar el mapeo realizado por otros.
* **Directrices para Test Designers (Diseño Caja Negra):**
  * **Restricción de Auto-validación:** Probar la regla estricta de la línea 82 (`CannotValidateMappedTask`). Un usuario NO debe poder validar una tarea que él mismo ha mapeado.
  * **Autenticación (OAuth2):** Validar qué ocurre si se intenta acceder al endpoint de validación (`actions.py /tasks/{task_id}/state`) con un token de sesión vencido o inválido (`USER_NOT_FOUND`).
  * **Roles:** Diferenciar los permisos entre roles globales (MAPPER vs ADMIN).

---
**Instrucciones para Jorge y Yordano (Test Designers):** 
Por favor, tomen estos 3 módulos como base. Deben aplicar técnicas de Caja Negra (Valores límite, Tablas de decisión, Casos de uso) basándose en las directrices mencionadas para elaborar el *Informe de Casos de Pruebas Funcionales* requerido para el 10 de junio.
