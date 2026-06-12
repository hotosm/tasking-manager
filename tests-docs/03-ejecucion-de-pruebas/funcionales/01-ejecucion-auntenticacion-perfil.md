# Ejecución de Casos de Prueba del MOD-01: Autenticación y Perfil

## 1. ESC-1001: Autenticación Delegada de Usuario vía OAuth 2.0 con OSM

### 1.1. Ejecución de CP-1001-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1001-01** | Validar ciclo de inicio de sesión exitoso autorizando el acceso en la interfaz externa de OSM. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema completa la transición a `Autenticacion exitosa`, cargando la interfaz local en el estado `SesionActiva` con el Dashboard de mapeo disponible. | La interfaz cargó el Dashboard correctamente y mostró el avatar del usuario en la barra superior. |

| Evidencia |
| :-- |
| Redirección y Autorización en OSM<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1001-01-osm-auth.png" width="800px" alt="CP-1001-01 - Redirección y autorización en OpenStreetMap"></a><br>Vista de la interfaz externa de OpenStreetMap solicitando permisos de acceso. |
| Dashboard con Sesión Activa<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1001-01-dashboard.png" width="800px" alt="CP-1001-01 - Dashboard con sesión activa"></a><br>Interfaz del Tasking Manager en estado SesionActiva con el perfil del Mapper cargado. |

---

### 1.2. Ejecución de CP-1001-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1001-02** | Validar el comportamiento de la interfaz al denegar o cancelar los permisos en la plataforma externa de OSM. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| Al pasar al estado `AutenticandoOSM`, el sistema detecta la denegación y ejecuta la transición `Cancelacion o error`, devolviendo de inmediato la interfaz del usuario al estado inicial de `NoAutenticado`. | El sistema interceptó la cancelación y regresó a la Landing Page pública sin loguear. |

| Evidencia |
| :-- |
| Cancelación de Autorización<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1001-02-cancel.png" width="800px" alt="CP-1001-02 - Cancelación de autorización en OSM"></a><br>Clic en el botón 'Denegar' dentro de la pasarela de OSM. |

---

### 1.3. Ejecución de CP-1001-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1001-03** | Validar la destrucción de la sesión local al seleccionar la opción de Log Out. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La aplicación destruye la sesión de forma local y redirige la interfaz del usuario de regreso al estado inicial de `NoAutenticado` (Landing Page pública). | Se limpió el token del navegador y la UI regresó instantáneamente a la vista pública de invitado. |

| Evidencia |
| :-- |
| Cierre de Sesión Exitoso<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1001-03-logout.png" width="800px" alt="CP-1001-03 - Cierre de sesión exitoso"></a><br>Confirmación visual de la Landing Page pública tras destruir la sesión local. |