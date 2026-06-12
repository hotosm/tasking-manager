# Diseño de Pruebas Funcionales: MOD-01 - Autenticación y Perfil
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo
Este módulo gestiona el ciclo de vida de la identidad, sesión y experiencia del usuario en la plataforma. Es responsable de controlar el acceso seguro mediante OAuth 2.0 con OpenStreetMap, calcular y actualizar el nivel técnico del mapper (BEGINNER, INTERMEDIATE, ADVANCED) según sus métricas, restringir contribuciones mediante la aceptación obligatoria de licencias, y permitir la personalización de ajustes del perfil desde la interfaz.

*Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](../funcionales/01-requerimientos-funcionales.md).*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general
Las pruebas se centrarán de manera estricta en la validación visual y de comportamiento a nivel de Interfaz de Usuario (UI). La estrategia se enfocará en verificar la correcta sincronización de datos con el proveedor externo (OSM), el bloqueo preventivo de funciones de mapeo cuando existan licencias pendientes de aprobación, y la correcta respuesta visual ante cambios en el formulario de configuración del perfil del usuario.

El alcance de estas pruebas cubre las interacciones de los siguientes actores clave del sistema:
* **ACT-01 Usuario Anónimo:** Evaluando su restricción de acceso a menús privados y su transición hacia la pasarela de autenticación.
* **ACT-02 Mapper:** Validando su experiencia visual en el Dashboard, la edición de sus preferencias y el impacto de su nivel calculado en la interfaz.
* **ACT-06 Sistema:** Verificando cómo los procesos automatizados en segundo plano (consultas de APIs externas como Ohsome) impactan y actualizan los datos visuales del perfil del Mapper en tiempo real.

| Actor de Impacto | Rol en este Módulo | Contexto de Prueba |
| :--- | :--- | :--- |
| **ACT-01** Usuario Anónimo | Solicitante de acceso | Intento de Login / Navegación pública inicial (RF-1001). |
| **ACT-02** Mapper | Usuario core autenticado | Aceptación de licencias (RF-1003) y actualización de datos (RF-1004). |
| **ACT-06** Sistema | Proveedor de datos asíncrono | Cálculo automático y visualización del nivel técnico (RF-1002). |

### 2.2. Técnicas de Caja Negra Utilizadas

* **Transición de Estados:** Utilizada para modelar y evaluar el flujo del login delegado (RF-1001) y la actualización de perfil (RF-1004). Permite verificar cómo cambia la interfaz entre diferentes estados (ej. Usuario Anónimo, Pantalla Externa de OSM, Sesión Activa, o Alertas de Validación en el formulario) basándose puramente en las interacciones y clics del usuario.
* **Partición de Equivalencia (PE) y Análisis de Valores Límite (AVL):** Aplicadas de manera conjunta para el cálculo del nivel de Mapper (RF-1002). Permiten agrupar los rangos numéricos de las ediciones en clases representativas y evaluar con total precisión en la pantalla los "bordes" o fronteras exactas donde la etiqueta visual del nivel debe cambiar de forma automática.
* **Tablas de Decisión:** Utilizada para la funcionalidad de aceptación de licencias (RF-1003). Permite validar de forma rigurosa las combinaciones lógicas de entrada (estado de la autenticación y configuración de restricciones del proyecto) para asegurar que el sistema ejecute correctamente la acción de habilitar o mantener bloqueado el botón de contribución en el mapa.

---

## 3. Especificaciones de Escenarios y Casos de Prueba

### 3.1. Escenario: ESC-1001 - Autenticación Delegada de Usuario vía OAuth 2.0 con OSM

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar el ciclo de vida del inicio y cierre de sesión del usuario en la interfaz del Tasking Manager, siguiendo las transiciones de estado del protocolo OAuth 2.0 con OpenStreetMap. |
| **RF Asociados** | RF-1001 |
| **Precondiciones** | El usuario debe contar con una cuenta activa y credenciales válidas en la plataforma oficial openstreetmap.org. El sistema debe encontrarse en la Landing Page pública. |
| **Técnicas aplicadas**| Transición de Estados |
| **Resultado Esperado** | La interfaz debe guiar al usuario a través del flujo externo de autorización y, tras el éxito o la cancelación del proceso, actualizar el estado de la pantalla local de forma segura y coherente. |

**B. Aplicación de Técnicas (Análisis)**
Para este escenario, se modela el comportamiento del sistema mediante los componentes de la técnica de **Transición de Estados** extraídos del diagrama oficial del módulo:

* **Estados del Sistema Identificados:**
    * `NoAutenticado`: Estado inicial público donde el usuario navega como invitado en la interfaz.
    * `RedirigidoOSM`: El sistema deriva el control visual a la URL externa de OpenStreetMap.
    * `AutenticandoOSM`: Estado intermedio de callback donde el Tasking Manager procesa la respuesta del token en segundo plano.
    * `SesionActiva`: Estado final exitoso donde el usuario accede a su perfil y dashboard con sus datos visibles en pantalla.
* **Transiciones / Eventos Evaluados:**
    * `Inicia autenticacion OAuth`
    * `Usuario en OSM`
    * `Autenticacion exitosa`
    * `Cancelacion o error`
    * `Cierre de sesion`

*Diagrama de Transición de Estados del Módulo:*
![Diagrama de Transición de Estados - ESC-1001](./img/transicion-estado-ESC-1001.png) 

---

**C. Casos de Prueba Derivados**

| ID Caso | Pasos de Ejecución | Datos de Entrada (Clases aplicadas) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-1001-01** | 1. Ingresar a la URL principal del Tasking Manager (`NoAutenticado`).<br>2. Hacer clic en el botón "Log In" (`Inicia autenticacion OAuth`).<br>3. En la interfaz externa de OSM (`RedirigidoOSM`), ingresar credenciales y autorizar (`Usuario en OSM`).<br>4. Esperar el procesamiento de la respuesta (`AutenticandoOSM`). | **Credenciales OSM:** Válidas.<br>**Acción en OSM:** Autorizar acceso. | El sistema completa la transición a `Autenticacion exitosa`, cargando la interfaz local en el estado `SesionActiva` con el Dashboard de mapeo disponible. |
| **CP-1001-02** | 1. Ingresar a la URL principal del Tasking Manager (`NoAutenticado`).<br>2. Hacer clic en el botón "Log In" (`Inicia autenticacion OAuth`).<br>3. En la interfaz externa de OSM (`RedirigidoOSM`), hacer clic en el botón "Denegar" o "Cancelar". | **Credenciales OSM:** N/A.<br>**Acción en OSM:** Denegar o Cancelar. | Al pasar al estado `AutenticandoOSM`, el sistema detecta la denegación y ejecuta la transición `Cancelacion o error`, devolviendo de inmediato la interfaz del usuario al estado inicial de `NoAutenticado`. |
| **CP-1001-03** | 1. Estando dentro de la plataforma con la sesión iniciada (`SesionActiva`).<br>2. Desplegar el menú de perfil en la esquina superior derecha.<br>3. Hacer clic en la opción "Log Out / Cerrar Sesión" (`Cierre de sesion`). | **Estado Inicial:** `SesionActiva`.<br>**Acción de Salida:** Clic en Logout. | La aplicación destruye la sesión de forma local y redirige la interfaz del usuario de regreso al estado inicial de `NoAutenticado` (Landing Page pública). |