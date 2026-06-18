# Diseño de Pruebas Funcionales: MOD-0005 - Administración de Proyectos

**Proyecto:** HOTOSM Tasking Manager  
**Versión del Documento:** 1.0  
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)  
**Módulo evaluado:** MOD-0005 - Administración de Proyectos  

---

## 1. Contexto del Módulo

El módulo **MOD-0005: Administración de Proyectos** permite a un usuario con rol de **Project Manager (ACT-0004)** crear, configurar y administrar proyectos dentro de HOTOSM Tasking Manager.

Este módulo cubre el flujo de creación de un proyecto desde la definición del Área de Interés (AOI), la generación de tareas mediante grilla, la configuración de metadatos, permisos, privacidad, fuentes de imágenes, publicación, clonación, transferencia de propiedad y eliminación controlada.

Desde el punto de vista de pruebas funcionales, este módulo es importante porque concentra operaciones críticas del sistema: creación de proyectos, validación de datos obligatorios, cambios de estado, reglas de acceso y acciones administrativas sensibles.

*Para consultar el detalle de actores, módulos y requerimientos funcionales, referirse al documento `01-requerimientos-funcionales.md`.*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general

El enfoque de pruebas aplicado al módulo será de **caja negra**, evaluando únicamente el comportamiento observable del sistema desde la interfaz web, sin analizar la implementación interna del código.

Las pruebas se diseñan tomando como base los requerimientos funcionales del módulo **MOD-0005**. Se validará que el sistema responda correctamente ante entradas válidas, entradas incompletas, cambios de configuración, cambios de estado y acciones administrativas realizadas por un usuario autorizado.

El actor principal del flujo será:

| Actor | Rol dentro de las pruebas |
| :--- | :--- |
| **ACT-0004 - Project Manager** | Usuario autorizado para crear, editar, publicar, clonar, transferir y eliminar proyectos. |

De forma complementaria, algunas acciones pueden involucrar restricciones asociadas a usuarios con privilegios suficientes dentro de la organización o dentro de Tasking Manager.

---

### 2.2. Técnicas de Caja Negra Utilizadas

Para diseñar los casos de prueba funcionales se aplican las siguientes técnicas de caja negra:

#### Partición de Equivalencia

Se utiliza para dividir las entradas en clases válidas e inválidas. Esta técnica permite seleccionar datos representativos para comprobar si el sistema acepta o rechaza correctamente una operación.

Aplicaciones dentro del módulo:

- Archivo geográfico válido para definir el AOI.
- Campos obligatorios completos o incompletos.
- Fuente de imágenes válida.
- Usuario válido para transferencia de propiedad.

#### Tabla de Decisión

Se utiliza cuando el resultado depende de la combinación de varias condiciones. En este módulo se aplica principalmente a reglas de permisos, privacidad y transferencia de propiedad.

Aplicaciones dentro del módulo:

- Nivel mínimo requerido para mapear o validar.
- Proyecto público o privado.
- Usuario perteneciente o no a un equipo autorizado.
- Usuario con permisos suficientes para recibir la propiedad de un proyecto.

#### Transición de Estados

Se utiliza para validar que el sistema permita cambios correctos entre estados funcionales del proyecto.

Aplicaciones dentro del módulo:

- Proyecto en estado **Borrador** que pasa a **Publicado**.
- Proyecto existente que pasa a estado eliminado.
- Proyecto público que pasa a configuración privada.

#### Análisis de Valores Límite

Esta técnica es aplicable a reglas con límites numéricos, como tamaño máximo del AOI, tamaño de tareas o longitudes máximas/mínimas de campos. En este diseño se considera como técnica aplicable al módulo, aunque los casos ejecutados se enfocan principalmente en partición de equivalencia, tabla de decisión y transición de estados.

---

## 3. Especificaciones de Escenarios de Prueba

Para organizar el diseño del módulo **MOD-0005**, los casos funcionales se agrupan en cinco escenarios principales. Cada escenario reúne requerimientos relacionados y aplica una o más técnicas de caja negra.

| ID Escenario | Descripción breve | RF cubiertos | Alcance funcional | Técnica principal |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-5001** | Creación inicial del proyecto | RF-5001, RF-5002 | Definición de AOI, generación de grilla, recorte de tareas y creación inicial del proyecto. | Partición de Equivalencia / Flujo funcional |
| **ESC-5002** | Validación y guardado de metadatos | RF-5006 | Validación de campos obligatorios y guardado de información requerida del proyecto. | Partición de Equivalencia |
| **ESC-5003** | Publicación y estado del proyecto | RF-5007 | Cambio de estado del proyecto desde Borrador hacia Publicado. | Transición de Estados |
| **ESC-5004** | Permisos, privacidad y propiedad | RF-5003, RF-5005 | Configuración de permisos, privacidad y transferencia de propiedad. | Tabla de Decisión |
| **ESC-5005** | Acciones administrativas y configuración complementaria | RF-5004, RF-5009, RF-5010 | Clonación, eliminación controlada y configuración de fuente de imágenes. | Flujo funcional / Partición de Equivalencia |

---

## 4. Escenarios Detallados y Casos Derivados

## 4.1. Escenario: [ESC-5001] - Creación inicial del proyecto

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permita iniciar la creación de un proyecto mediante la definición de un Área de Interés, la generación de una grilla de tareas y la creación inicial del proyecto. |
| **RF asociados** | RF-5001, RF-5002 |
| **Actor principal** | ACT-0004 - Project Manager |
| **Precondiciones** | El usuario se encuentra autenticado y posee permisos para crear proyectos. |
| **Técnicas aplicadas** | Partición de Equivalencia y flujo funcional. |
| **Resultado esperado** | El sistema acepta un AOI válido, genera la grilla, permite recortarla y crea el proyecto inicial correctamente. |

### B. Aplicación de Técnicas

#### B.1. Partición de Equivalencia para entrada geográfica del AOI

| Clase inválida | Clase válida | Clase inválida |
| :--- | :--- | :--- |
| Archivo vacío, corrupto o con formato no soportado. | Archivo GeoJSON válido con geometría reconocida por el sistema. | Archivo geográfico con geometría inválida o fuera de restricciones. |
| **Comportamiento esperado:** el sistema debe rechazar la entrada. | **Comportamiento esperado:** el sistema debe aceptar el AOI y representarlo en el mapa. | **Comportamiento esperado:** el sistema debe rechazar la entrada o mostrar validación. |

#### B.2. Flujo funcional de creación

El flujo funcional esperado es:

1. Definir Área de Interés.
2. Generar grilla de tareas.
3. Recortar la cuadrícula si corresponde.
4. Revisar datos mínimos.
5. Crear proyecto.

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD5-001** | Cargar un archivo GeoJSON válido en el Paso 1. | GeoJSON válido con polígono de prueba. | El sistema acepta el AOI y permite avanzar al Paso 2. |
| **CP-MOD5-002** | Continuar con la generación de la grilla. | AOI previamente aceptado. | El sistema genera la grilla dentro del AOI y permite avanzar. |
| **CP-MOD5-003** | Recortar la cuadrícula de tareas. | Grilla generada previamente. | El sistema procesa el recorte y permite avanzar al Paso 4. |
| **CP-MOD5-004** | Completar datos mínimos y crear el proyecto. | Nombre y organización válidos. | El sistema crea el proyecto y redirige a la pantalla de edición. |
| **CP-MOD5-014** | Cargar un GeoJSON inválido en el Paso 1 de creación del proyecto. | GeoJSON con estructura incompleta, geometría inválida o coordenadas vacías. | El sistema rechaza el AOI inválido, no permite avanzar al Paso 2 y muestra una validación o comportamiento de error controlado. |
| **CP-MOD5-015** | Intentar cargar un archivo GeoJSON vacío en el Paso 1 de creación del proyecto. | Archivo `.geojson` sin contenido o con contenido vacío. | El sistema rechaza el archivo vacío, no permite definir el AOI y evita avanzar al Paso 2 del flujo de creación. |
| **CP-MOD5-016** | Cargar un AOI que excede las restricciones permitidas por el sistema. | GeoJSON válido en formato, pero con área demasiado grande o fuera de los límites aceptados. | El sistema rechaza el AOI o muestra una advertencia indicando que el área no cumple las restricciones permitidas. |


---

## 4.2. Escenario: [ESC-5002] - Validación y guardado de metadatos del proyecto

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema controle correctamente los campos obligatorios del proyecto y permita guardar solo cuando la información requerida se encuentra completa. |
| **RF asociados** | RF-5006 |
| **Actor principal** | ACT-0004 - Project Manager |
| **Precondiciones** | Existe un proyecto creado y el usuario se encuentra en la pantalla de edición. |
| **Técnicas aplicadas** | Partición de Equivalencia. |
| **Resultado esperado** | El sistema rechaza configuraciones incompletas y acepta configuraciones completas. |

### B. Aplicación de Técnicas

#### B.1. Partición de Equivalencia para campos obligatorios

| Clase inválida | Clase válida |
| :--- | :--- |
| Proyecto con descripción, instrucciones o tipo de mapeo incompletos. | Proyecto con descripción, instrucciones y metadatos obligatorios completos. |
| **Comportamiento esperado:** el sistema debe impedir guardar y mostrar mensajes de validación. | **Comportamiento esperado:** el sistema debe guardar correctamente y mostrar confirmación. |

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD5-005** | Intentar guardar el proyecto sin completar campos obligatorios. | Descripción, instrucciones o tipo de mapeo incompletos. | El sistema bloquea el guardado y muestra mensaje de validación. |
| **CP-MOD5-006** | Completar los campos obligatorios y guardar. | Descripción, instrucciones y metadatos completos. | El sistema guarda correctamente y muestra confirmación. |

---

## 4.3. Escenario: [ESC-5003] - Publicación y estado del proyecto

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permita cambiar el estado de un proyecto desde Borrador hacia Publicado cuando la configuración obligatoria está completa. |
| **RF asociados** | RF-5007 |
| **Actor principal** | ACT-0004 - Project Manager |
| **Precondiciones** | El proyecto existe, tiene información obligatoria completa y se encuentra inicialmente en estado Borrador. |
| **Técnicas aplicadas** | Transición de Estados. |
| **Resultado esperado** | El sistema permite la transición de estado y conserva el nuevo estado después de guardar. |

### B. Aplicación de Técnicas

#### B.1. Transición de Estados

| Estado inicial | Acción | Estado final esperado |
| :--- | :--- | :--- |
| Borrador | Seleccionar estado Publicado y guardar. | Publicado |

La transición evaluada es válida porque el proyecto cuenta con los datos obligatorios necesarios para ser publicado.

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD5-007** | Cambiar el estado del proyecto de Borrador a Publicado y guardar. | Proyecto con configuración completa. | El sistema actualiza el estado a Publicado y muestra confirmación. |

---

## 4.4. Escenario: [ESC-5004] - Permisos, privacidad y transferencia de propiedad

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permita configurar reglas de acceso al proyecto y ejecutar acciones de propiedad solo bajo condiciones válidas. |
| **RF asociados** | RF-5003, RF-5005 |
| **Actor principal** | ACT-0004 - Project Manager |
| **Precondiciones** | Existe un proyecto editable y el usuario posee permisos de administración. |
| **Técnicas aplicadas** | Tabla de Decisión y Partición de Equivalencia. |
| **Resultado esperado** | El sistema guarda correctamente permisos, privacidad y transferencia cuando se cumplen las condiciones requeridas. |

### B. Aplicación de Técnicas

#### B.1. Tabla de Decisión para permisos y privacidad

| Condiciones / Acciones | Regla 1 | Regla 2 | Regla 3 | Regla 4 |
| :--- | :---: | :---: | :---: | :---: |
| **Condiciones** | | | | |
| ¿Proyecto privado? | No | No | Sí | Sí |
| ¿Usuario pertenece a equipo autorizado? | N/A | N/A | Sí | No |
| ¿Usuario cumple nivel mínimo requerido? | Sí | No | Sí | Sí |
| **Acciones** | | | | |
| Permitir mapear / validar | X | | X | |
| Restringir por nivel insuficiente | | X | | |
| Restringir por no pertenecer al equipo | | | | X |

#### B.2. Partición de Equivalencia para transferencia de propiedad

| Clase inválida | Clase válida |
| :--- | :--- |
| Usuario inexistente o sin permisos suficientes. | Usuario administrador o Project Manager válido dentro de la organización. |
| **Comportamiento esperado:** el sistema no debe permitir la transferencia. | **Comportamiento esperado:** el sistema debe permitir transferir la propiedad. |

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD5-008** | Cambiar niveles mínimos de mapeo y validación. | Nivel mínimo configurado como INTERMEDIATE. | El sistema guarda los permisos correctamente. |
| **CP-MOD5-009** | Activar la opción de proyecto privado y guardar. | Proyecto existente con configuración editable. | El sistema guarda la privacidad del proyecto. |
| **CP-MOD5-011** | Seleccionar un nuevo propietario válido y transferir propiedad. | Usuario administrador de Tasking Manager perteneciente a la organización. | El sistema transfiere correctamente la propiedad del proyecto. |

---

## 4.5. Escenario: [ESC-5005] - Acciones administrativas y configuración complementaria

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar acciones administrativas adicionales del proyecto, como clonación, eliminación controlada y configuración de fuente de imágenes. |
| **RF asociados** | RF-5004, RF-5009, RF-5010 |
| **Actor principal** | ACT-0004 - Project Manager |
| **Precondiciones** | Existe un proyecto administrable y el usuario posee permisos suficientes. |
| **Técnicas aplicadas** | Flujo funcional, transición de estados y partición de equivalencia. |
| **Resultado esperado** | El sistema permite completar correctamente acciones administrativas válidas y conserva los resultados esperados. |

### B. Aplicación de Técnicas

#### B.1. Flujo funcional para clonación

El flujo de clonación esperado es:

1. Ingresar a acciones del proyecto.
2. Seleccionar clonar proyecto.
3. Confirmar o continuar el flujo de creación del clon.
4. Crear el nuevo proyecto.
5. Verificar que el proyecto clonado aparezca como una entidad independiente.

#### B.2. Transición funcional para eliminación

| Estado inicial | Acción | Estado final esperado |
| :--- | :--- | :--- |
| Proyecto existente | Confirmar eliminación | Proyecto eliminado y redirección a gestión de proyectos |

#### B.3. Partición de Equivalencia para fuente de imágenes

| Clase inválida | Clase válida |
| :--- | :--- |
| Fuente vacía, no soportada o configuración inválida. | Fuente disponible en el sistema, como Bing o ESRI World Imagery. |
| **Comportamiento esperado:** el sistema debe rechazar o advertir. | **Comportamiento esperado:** el sistema debe guardar correctamente la fuente seleccionada. |

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD5-010** | Seleccionar clonar proyecto y completar el flujo del nuevo proyecto. | Proyecto original existente. | El sistema crea un proyecto clonado independiente. |
| **CP-MOD5-012** | Eliminar un proyecto desde la sección de acciones. | Proyecto clonado o administrable. | El sistema elimina el proyecto y redirige a gestión de proyectos. |
| **CP-MOD5-013** | Seleccionar una fuente de imágenes válida y guardar. | Fuente Bing seleccionada. | El sistema guarda correctamente la fuente de imágenes. |

---
