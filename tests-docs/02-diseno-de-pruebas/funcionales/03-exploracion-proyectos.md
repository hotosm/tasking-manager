# Diseño de Pruebas Funcionales: MOD-02 - Exploración de Proyectos
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo
Este módulo es responsable de la persistencia visual, indexación y recuperación de los proyectos de mapeo en la plataforma. Permite a los usuarios buscar proyectos mediante un motor de texto predictivo, segmentar el universo cartográfico aplicando filtros avanzados (según el estado del proyecto, la dificultad técnica del mapper y las campañas globales asociadas), ordenar los resultados por relevancia o urgencia, y renderizar geográficamente los límites espaciales (Bounding Box - BBOX) sobre un mapa interactivo.

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general
Las pruebas se concentrarán en garantizar la integridad de la interfaz de usuario (UI) al combinar múltiples criterios de búsqueda y al interactuar con el mapa. La estrategia verificará que la lista de tarjetas de proyectos se actualice de forma síncrona/asíncrona con los controles de filtrado y que el mapa encuadre correctamente el BBOX del proyecto seleccionado sin generar errores de renderizado.

El alcance cubre las interacciones de los siguientes actores:
* **ACT-01 Usuario Anónimo:** Navegación libre, aplicación de filtros y visualización del mapa público.
* **ACT-02 Mapper:** Búsqueda orientada a proyectos que coincidan estrictamente con su nivel de experiencia calculado.

| Actor de Impacto | Rol en este Módulo | Contexto de Prueba |
| :--- | :--- | :--- |
| **ACT-01** / **ACT-02** | Explorador de Proyectos | Uso del motor de búsqueda, filtros avanzados y ordenamiento. |
| **ACT-01** / **ACT-02** | Visualizador Cartográfico | Interacción con el mapa y renderizado del Bounding Box (BBOX). |

### 2.2. Técnicas de Caja Negra Utilizadas
* **Tablas de Decisión:** Aplicada al motor de búsqueda con filtros avanzados (RF-2001). Permite validar de forma matemática cómo responde la pantalla cuando se combinan o contradicen los filtros de Estado, Dificultad y Campaña.
* **Partición de Equivalencia (PE) y Análisis de Valores Límite (AVL):** Utilizadas para la barra de búsqueda por texto y las coordenadas del mapa (BBOX) (RF-2002). Limita las pruebas de caracteres en la barra de búsqueda y las fronteras geoespaciales numéricas del mapa.
* **Transición de Estados:** Aplicada a la vista del mapa interactivo (RF-2003). Modela cómo cambia la interfaz del mapa (Modo Lista, Vista de Cuadrícula, Zoom al BBOX y Carga Asíncrona de Capas) según los clics del usuario.

---

## 3. Especificaciones de Escenarios y Casos de Prueba

### 3.1. Escenario: ESC-2001 - Motor de Búsqueda y Combinación de Filtros Avanzados

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que la interfaz actualice correctamente la lista de proyectos mostrados al activar, combinar o limpiar los filtros avanzados de Estado (Activo/Archivado), Dificultad (Beginner/Intermediate/Advanced) y Campaña. |
| **RF Asociados** | RF-2001 |
| **Precondiciones** | El usuario se encuentra en la pantalla principal de exploración ("Explore Projects"). La base de datos contiene proyectos diversificados con diferentes etiquetas. |
| **Técnicas aplicadas**| Tablas de Decisión |
| **Resultado Esperado** | La UI debe renderizar exclusivamente las tarjetas de proyectos que cumplan con la intersección lógica de todos los filtros seleccionados, mostrando un mensaje claro de "No se encontraron resultados" si la combinación está vacía. |

**B. Aplicación de Técnicas (Análisis)**
Para este escenario, se modela el comportamiento lógico de la pantalla utilizando la técnica de **Tablas de Decisión**, identificando los criterios de filtrado interactivos:

* **Condiciones de Entrada (Controles de la UI):**
    * `CE-1`: Se selecciona un filtro de Estado válido (ej. "Activo").
    * `CE-2`: Se selecciona un filtro de Dificultad acorde al Mapper (ej. "Beginner").
    * `CE-3`: Se selecciona un filtro de Campaña específico (ej. "Response COVID-19").
* **Condiciones de Salida (Resultados en la UI):**
    * `CS-1`: Renderizar lista filtrada con coincidencia exacta (Intersección lógica).
    * `CS-2`: Desplegar mensaje de alerta "No se encontraron proyectos que coincidan con los filtros".
    * `CS-3`: Mostrar el catálogo completo de proyectos (Estado por defecto / Sin filtros).

#### B.1. Matriz de Tabla de Decisión Racionalizada
Se cruzan las condiciones de los selectores aplicando guiones (**-**) para representar estados indiferentes y optimizar las pruebas en la interfaz:

| Tipo de Control | Variables de la Interfaz de Usuario | A | B | C | D |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Condiciones de Entrada** | `CE-1`: Filtro de Estado seleccionado | **F** | **V** | **V** | **V** |
| | `CE-2`: Filtro de Dificultad seleccionado | **F** | **F** | **V** | **V** |
| | `CE-3`: Filtro de Campaña seleccionado | **F** | **-** | **F** | **V** |
| **Condiciones de Salida** | `CS-1`: Renderizar lista filtrada exacta | **F** | **V** | **V** | **V** |
| | `CS-2`: Desplegar mensaje "Sin resultados" | **F** | **F** | **F** | **F** |
| | `CS-3`: Mostrar catálogo completo (Defecto)| **V** | **F** | **F** | **F** |

*Nota sobre el análisis:* Si la base de datos devuelve vacío para una combinación (por ejemplo, en la columna D no hay proyectos "Activos + Beginner + COVID-19"), la salida `CS-1` pasaría a Falso y se activaría de inmediato `CS-2`.

---

**C. Casos de Prueba Derivados**

| ID Caso | Pasos de Ejecución | Datos de Entrada (Reglas Aplicadas) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **CP-2001-01** | 1. Ingresar a la sección "Explorar Proyectos".<br>2. Verificar el estado inicial de la pantalla sin interactuar con los desplegables. | **Filtros:** Ninguno activo.<br>*(Regla de Columna A)* | La interfaz carga por defecto el catálogo completo de proyectos disponibles en el sistema (`CS-3 = V`). |
| **CP-2001-02** | 1. Hacer clic en el selector de Estado y marcar "Activo".<br>2. Mantener el resto de filtros vacíos. | **Estado:** Activo.<br>**Dificultad:** Sin filtro.<br>*(Regla de Columna B)* | La pantalla se actualiza asíncronamente mostrando únicamente las tarjetas de proyectos cuyo estado sea "Activo" (`CS-1 = V`). |
| **CP-2001-03** | 1. Manteniendo el filtro "Activo", abrir el selector de Dificultad y marcar "Beginner". | **Estado:** Activo.<br>**Dificultad:** Beginner.<br>*(Regla de Columna C)* | La lista reduce sus elementos, mostrando solo los proyectos que son "Activos" y que simultáneamente aceptan mappers "Beginner" (`CS-1 = V`). |
| **CP-2001-04** | 1. Mantener activos los filtros anteriores.<br>2. Abrir el selector de Campañas y marcar una campaña existente (ej. "Malaria"). | **Estado:** Activo.<br>**Dificultad:** Beginner.<br>**Campaña:** Malaria.<br>*(Regla de Columna D)* | La interfaz procesa la intersección final. Muestra en pantalla solo los proyectos que cumplan estrictamente con los tres criterios en simultáneo (`CS-1 = V`). |