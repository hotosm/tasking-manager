# Ejecución de casos de pruebas del MOD-06: Gobernanza (Organizaciones y Equipos)

## 1. ESC-6001 Creación y Configuración Inicial de Equipos

### 1.1. Ejecución de CP-6001-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-6001-01** | Validar la creación exitosa de un equipo con visibilidad `PUBLIC` y método de ingreso `ANY` por parte de un usuario con rol de Administrador Global (`ADMIN`). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema procesa la solicitud retornando `HTTP 201`. Se muestra una notificación (Toast) de éxito en la interfaz y se redirige automáticamente a la vista de detalle del nuevo equipo. | La API respondió con código `201 Created`. La UI renderizó el mensaje "Team created successfully" y navegó correctamente a la ruta `/manage/teams/{id}` mostrando la información del equipo "Alpha Team". |

| Evidencia |
| :-- |
| Notificación de éxito y redirección<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-06-gobernanza-organizaciones-equipos/CP-6001-01-toast-success.png" width="800px" alt="CP-6001-01 - Toast de creación exitosa de equipo"></a><br>Captura de la pantalla confirmando la creación y visualización del detalle del equipo. |

---

### 1.2. Ejecución de CP-6001-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-6001-02** | Validar la creación de un equipo `PRIVATE` con método de ingreso `BY_REQUEST` por un `ORG MANAGER`, asegurando que el creador herede automáticamente el rol de Manager del equipo. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| Creación exitosa (`HTTP 201`). El usuario creador ("Bravo Team") se registra automáticamente en la base de datos y en la interfaz como Manager (administrador) del equipo creado. | El equipo privado fue instanciado correctamente en la organización asignada. Al revisar la pestaña "Team members", el creador aparece listado con el rol de `MANAGER`. |

| Evidencia |
| :-- |
| Asignación automática de rol Manager<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-06-gobernanza-organizaciones-equipos/CP-6001-02-team-manager-role.png" width="800px" alt="CP-6001-02 - Creador listado como Manager del equipo"></a><br>Visualización de la tabla de miembros donde el Gestor de Organización figura como administrador del equipo. |

---

### 1.3. Ejecución de CP-6001-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-6001-03** | Validar que la interfaz de usuario restringe la creación de un equipo (deshabilitando el botón de envío) si el campo de nombre del equipo se encuentra vacío. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El botón de "Crear Equipo" (`Create Team`) permanece en estado deshabilitado (Disabled). El frontend no dispara ninguna petición de red hacia el backend. | Al ingresar al formulario y dejar el campo de nombre vacío (o al borrar su contenido), el botón "Create Team" mantiene el atributo `disabled`. No se generaron peticiones en la pestaña Network del navegador. |

| Evidencia |
| :-- |
| Validación de formulario en UI<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-06-gobernanza-organizaciones-equipos/CP-6001-03-boton-disabled.png" width="800px" alt="CP-6001-03 - Botón de creación deshabilitado por campo vacío"></a><br>Captura del formulario mostrando el campo de nombre vacío y el botón de acción inactivado. |

---

### 1.4. Ejecución de CP-6001-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-6001-04** | Validar que un usuario sin privilegios administrativos (rol `MAPPER` base) no puede crear equipos, confirmando la ausencia del botón en UI. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz de gestión no renderiza el botón "New". | Al acceder al dashboard de equipos con cuenta Mapper, el botón "New" no existe en el DOM. |

| Evidencia |
| :-- |
| Ausencia de botón de creación en UI<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-06-gobernanza-organizaciones-equipos/CP-6001-04-ui-sin-boton.png" width="800px" alt="CP-6001-04 - UI de equipos para usuario Mapper"></a><br>Dashboard de equipos visualizado por usuario base, sin controles administrativos. |
| Respuesta 403 desde la API<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-06-gobernanza-organizaciones-equipos/CP-6001-04-api-403.png" width="800px" alt="CP-6001-04 - Postman mostrando error 403"></a><br>Captura de la respuesta del servidor bloqueando la creación no autorizada a nivel de backend. |

---

### 1.5. Ejecución de CP-6001-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-6001-05** | Validar el rechazo de acceso al flujo de creación de equipos cuando se fuerza la navegación mediante URL directa por parte de un usuario no autenticado (Anónimo). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema intercepta la navegación hacia la vista protegida (`/manage/teams/new`) y redirige al visitante a la pantalla de inicio de sesión (`/login`), protegiendo el formulario. | Al ingresar la URL absoluta en una sesión de incógnito, el middleware de enrutamiento del frontend detectó la falta de token y ejecutó una redirección limpia hacia `/login`. |

| Evidencia |
| :-- |
| Redirección por falta de sesión<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-06-gobernanza-organizaciones-equipos/CP-6001-05-redirect-login.png" width="800px" alt="CP-6001-05 - Redirección a la pantalla de Login"></a><br>Barra de direcciones mostrando la ruta de login tras el intento de acceso a la vista de creación de equipos. |
