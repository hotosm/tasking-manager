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

---

## 2. ESC-1002: Clasificación Automatizada y Visualización del Nivel del Mapper

### 2.1. Ejecución de CP-1002-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1002-01** | Validar que la interfaz cargue y muestre explícitamente la etiqueta BEGINNER con el valor base de 0 cambios. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz gráfica de usuario carga el perfil mostrando explícitamente la etiqueta con el texto **BEGINNER**. | La UI procesó el valor base de forma limpia, renderizando la medalla de nivel en gris con la palabra BEGINNER junto al contador en cero. |

| Evidencia |
| :-- |
| Perfil con Nivel Base Beginner<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1002-01-nivel-beginner-base.png" width="800px" alt="CP-1002-01 - Perfil inicial con nivel BEGINNER"></a><br>Captura de la pantalla de perfil mostrando el contador de cambios en 0 y la etiqueta BEGINNER activa. |

---

### 2.2. Ejecución de CP-1002-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1002-02** | Validar que la interfaz mantenga la consistencia visual de la etiqueta BEGINNER en el tope exacto de 250 cambios. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz gráfica de usuario carga el perfil mostrando explícitamente la etiqueta con el texto **BEGINNER**. | La pantalla procesó el límite superior de la primera clase, manteniendo la etiqueta de BEGINNER fija y visualizando la barra de progreso al 100%. |

| Evidencia |
| :-- |
| Perfil en Límite Superior Beginner<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1002-02-nivel-beginner-tope.png" width="800px" alt="CP-1002-02 - Perfil en límite superior BEGINNER"></a><br>Captura de la interfaz de usuario con 250 cambios reflejando el tope del rango inicial. |

---

### 2.3. Ejecución de CP-1002-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1002-03** | Validar que la interfaz mute automáticamente la medalla a INTERMEDIATE al superar la frontera con 251 cambios. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema calcula la transición y la interfaz del usuario cambia de forma automática la medalla a la categoría **INTERMEDIATE**. | Al detectar el cambio número 251, la interfaz actualizó asíncronamente el componente visual, inyectando la etiqueta INTERMEDIATE con su respectivo color distintivo. |

| Evidencia |
| :-- |
| Transición a Nivel Intermediate<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1002-03-cambio-intermediate.png" width="800px" alt="CP-1002-03 - Interfaz con medalla INTERMEDIATE"></a><br>Captura de la medalla actualizada a INTERMEDIATE inmediatamente tras cruzar el límite fronterizo. |

---

### 2.4. Ejecución de CP-1002-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1002-04** | Validar la consistencia visual de la etiqueta INTERMEDIATE en su límite estricto de 1000 cambios. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz gráfica de usuario mantiene la consistencia visual mostrando la etiqueta fija de **INTERMEDIATE**. | El sistema mantuvo la estabilidad visual del perfil sin saltos erráticos, renderizando correctamente la medalla INTERMEDIATE fija en el valor tope del rango medio. |

| Evidencia |
| :-- |
| Perfil en Límite de Clase Intermedia<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1002-04-intermediate-tope.png" width="800px" alt="CP-1002-04 - Perfil en tope de INTERMEDIATE"></a><br>Vista del perfil del Mapper con el contador exactamente en 1000 cambios y la etiqueta intermedia estable. |

---

### 2.5. Ejecución de CP-1002-05

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-1002-05** | Validar la mutación inmediata en la interfaz a la etiqueta ADVANCED al registrar 1001 cambios mappers. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| El sistema evalúa el cambio de rango de forma inmediata y la interfaz de usuario renderiza la etiqueta de máximo nivel: **ADVANCED**. | La pantalla asimiló la ruptura del límite intermedio por un dígito, renderizando instantáneamente la medalla dorada de máximo rango con el texto ADVANCED. |

| Evidencia |
| :-- |
| Medalla de Máximo Nivel Advanced<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-01-ejecucion-autenticacion-perfil/CP-1002-05-nivel-advanced.png" width="800px" alt="CP-1002-05 - Interfaz con medalla ADVANCED"></a><br>Captura de pantalla de la barra de usuario mostrando la insignia final de ADVANCED activa en la UI. |