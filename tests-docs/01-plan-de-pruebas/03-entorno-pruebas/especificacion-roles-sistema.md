# Documentación del Modelo de Roles y Autorización

## 1. Introducción
El sistema de permisos de Tasking Manager está diseñado para permitir la colaboración masiva (Crowdsourcing) mientras se mantiene un control estricto sobre la calidad de los datos y la gestión de las organizaciones. La autorización no es lineal; un usuario puede ser un `MAPPER` a nivel global, pero actuar como `MANAGER` dentro de una organización específica.

---

## 2. Roles Globales
Estos roles se definen directamente en la entidad `User` (columna `role`) y establecen el comportamiento base en todo el sistema.

### A. ADMIN (Administrador Global)
*   **Propósito:** Control total y mantenimiento del sistema. Es el "Superusuario".
*   **Permisos:**
    *   Gestión total de todas las Organizaciones, Proyectos y Equipos.
    *   Cambiar roles y niveles de mapeo de cualquier usuario.
    *   Modificar configuraciones globales (Banners, licencias, categorías de problemas).
    *   Acceso a todas las estadísticas del sistema.
*   **Restricciones:** Ninguna.
*   **Cambios en Interfaz:** Aparece la pestaña **Manage** con todas las sub-opciones disponibles (Projects, Organisations, Teams, Users, Campaigns).
*   **Tipo de Usuario:** Personal técnico de IT o directores de la plataforma.

### B. MAPPER (Usuario Estándar)
*   **Propósito:** Rol por defecto para todos los usuarios autenticados. Participar en la contribución de datos.
*   **Permisos:**
    *   Mapear tareas en proyectos públicos.
    *   Validar tareas (si su nivel de experiencia es suficiente).
    *   Crear y gestionar sus propios equipos (si la configuración lo permite).
*   **Restricciones:** No puede crear proyectos ni organizaciones por sí mismo (a menos que se le asigne un rol de gestión). No ve la pestaña de administración global.
*   **Cambios en Interfaz:** Vista estándar enfocada en **Explore** y **Learn**. Solo ve la pestaña **Manage** si es autor de un proyecto o manager de un equipo/organización.
*   **Tipo de Usuario:** Voluntarios y mapeadores de la comunidad.

### C. READ_ONLY (Usuario Bloqueado)
*   **Propósito:** Restringir el acceso a usuarios que han violado normas de la comunidad.
*   **Permisos:** Solo lectura. Puede ver proyectos y mapas.
*   **Restricciones:** No puede bloquear tareas, comentar, validar ni realizar ninguna acción que modifique la base de datos.
*   **Cambios en Interfaz:** Desaparecen los botones de acción ("Map Task", "Post Comment").
*   **Tipo de Usuario:** Cuentas suspendidas.

---

## 3. Roles de Gestión (Scoped Roles)
Estos roles no dependen del valor global `role`, sino de las relaciones en la base de datos.

### A. Organisation Manager
*   **Propósito:** Gestionar el portafolio de proyectos de una entidad específica (por ejemplo, Cruz Roja, Médicos Sin Fronteras).
*   **Permisos:**
    *   Crear, editar y borrar proyectos vinculados a **su** organización.
    *   Gestionar los equipos vinculados a su organización.
    *   Ver estadísticas detalladas de su organización.
*   **Restricciones:** No puede gestionar otras organizaciones ni cambiar configuraciones globales del sistema.
*   **Cambios en Interfaz:** En la pestaña **Manage**, solo ve los recursos pertenecientes a su organización.
*   **Relación:** Puede supervisar a los Project Managers de su organización.

### B. Project Manager / Author
*   **Propósito:** Responsable de la ejecución de un proyecto de mapeo específico.
*   **Permisos:**
    *   Editar la descripción, instrucciones y prioridades del proyecto.
    *   Gestionar la lista de usuarios permitidos (si el proyecto es privado).
    *   Invalidar o validar tareas de forma masiva en su proyecto.
*   **Restricciones:** Solo tiene poder sobre los proyectos donde es autor o ha sido asignado.
*   **Cambios en Interfaz:** Aparece la opción de "Edit Project" en la vista de detalle del proyecto.

### C. Team Manager
*   **Propósito:** Administrar la membresía de un grupo de usuarios.
*   **Permisos:**
    *   Aceptar o rechazar solicitudes de unión al equipo.
    *   Invitar nuevos miembros.
    *   Asignar el equipo a proyectos específicos (si se le permite).
*   **Restricciones:** No tiene permisos administrativos sobre proyectos u organizaciones a menos que el equipo sea asignado explícitamente a ellos.

---

## 4. Niveles de Experiencia (Mapping Levels)
Aunque no son "roles" de gestión, actúan como un sistema de **Autorización Basada en Atributos (ABAC)**.

| Nivel | Valor | Capacidades de Autorización |
| :--- | :---: | :--- |
| **Beginner** | 1 | Solo puede mapear. No puede validar tareas. |
| **Intermediate** | 2 | Puede validar tareas en proyectos que lo permitan. |
| **Advanced** | 3 | Puede validar tareas en cualquier proyecto y suele ser requerido para proyectos desafiantes. |

---

## 5. Mecanismo de Asignación y Control

### ¿Quién puede asignar roles?
1.  **ADMIN:** Puede asignar cualquier rol global, nivel de mapeo o manager de organización.
2.  **Organisation Manager:** Puede asignar a otros usuarios como managers de **su** organización o managers de equipos bajo su mando.
3.  **Team Manager:** Puede añadir miembros a su equipo.

### Flujo de Asignación
*   **Interfaz vs Interno:** 
    *   El **Rol Global** (`role`) solo puede ser cambiado por un `ADMIN` desde `Manage -> Users`.
    *   El **Nivel de Mapeo** se actualiza automáticamente por el sistema basado en el número de cambios en OSM (vía `cron_jobs.py`), pero un `ADMIN` puede forzarlo manualmente desde la interfaz.
    *   Los **Managers de Organización** se asignan en la vista de creación/edición de la Organización.
*   **Validaciones Críticas:**
    *   El sistema no permite que un usuario se asigne a sí mismo como `ADMIN`.
    *   Para que un usuario actúe como `Organisation Manager`, debe existir una entrada en la tabla `organisation_managers`.
    *   Para operaciones de API, el backend utiliza el servicio `ProjectAdminService.is_user_action_permitted_on_project`, que verifica secuencialmente: ¿Es Admin? luego ¿Es Autor? luego ¿Es Org Manager? luego ¿Es Team Manager del proyecto?

---

## 6. Componentes Técnicos Intervinientes

*   **Base de Datos:**
    *   Tabla `users`: Columnas `role` y `mapping_level`.
    *   Tabla `organisation_managers`: Relación N:N entre usuarios y organizaciones.
    *   Tabla `team_members`: Columna `function` (1=Manager, 2=Member).
    *   Tabla `project_teams`: Determina qué rol tiene un equipo en un proyecto (`MAPPER`, `VALIDATOR`, `PROJECT_MANAGER`).
*   **Backend (Python):**
    *   `models/postgis/statuses.py`: Define los Enums de roles.
    *   `services/users/authentication_service.py`: Contiene los decoradores `@login_required` y `@admin_only`.
    *   `services/project_admin_service.py`: Centraliza la lógica de permisos para determinar quién puede editar qué.
*   **Frontend (React):**
    *   Utiliza el componente `Permissions` y hooks para renderizar condicionalmente elementos de la UI basándose en el objeto `user` obtenido tras el login.
