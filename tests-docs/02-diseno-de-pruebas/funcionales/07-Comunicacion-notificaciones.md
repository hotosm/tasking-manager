# Diseño de Pruebas Funcionales: MOD-0007 - Comunicación y Notificaciones

**Versión del Documento:** 1.0  
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)  
**Módulo evaluado:** MOD-0007 - Comunicación y Notificaciones  

---

## 1. Contexto del Módulo

El módulo **MOD-0007: Comunicación y Notificaciones** agrupa las funcionalidades relacionadas con la interacción comunicativa dentro del sistema HOTOSM Tasking Manager. Este módulo permite registrar comentarios asociados a tareas, utilizar menciones a usuarios y generar alertas internas o por correo electrónico ante eventos relevantes.

Desde el punto de vista funcional, este módulo es importante porque permite mantener trazabilidad de las observaciones realizadas durante el trabajo de mapeo y validación. Además, facilita que los usuarios sean informados cuando ocurre un evento que requiere su atención, como una mención, una tarea invalidada o una notificación generada por el sistema.

Los principales actores involucrados son:   

| Actor | Rol dentro del módulo |
| :--- | :--- |
| **ACT-0002 - Mapper** | Usuario que puede registrar comentarios durante el flujo de mapeo. |
| **ACT-0003 - Validator** | Usuario que puede registrar observaciones durante el proceso de validación. |
| **ACT-0006 - Sistema** | Encargado de generar notificaciones internas o por correo ante eventos relevantes. |

*Para consultar el detalle de actores, módulos y requerimientos funcionales, referirse al documento `01-requerimientos-funcionales.md`.*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general

El enfoque de pruebas aplicado al módulo será de **caja negra**, evaluando el comportamiento observable del sistema desde la interfaz web y desde las respuestas visibles para el usuario, sin analizar la implementación interna del código.

Las pruebas se diseñan a partir de los requerimientos funcionales asociados al módulo **MOD-0007**, principalmente:

- **RF-7001:** Comentarios por tarea.
- **RF-7002:** Notificaciones in-app.
- **RF-7003:** Envío de emails.

El objetivo del diseño es validar que el sistema permita registrar comentarios válidos, controle entradas no válidas, procese menciones a usuarios, genere notificaciones internas cuando corresponda y respete las condiciones necesarias para el envío de notificaciones por correo electrónico.

---

### 2.2. Técnicas de Caja Negra Utilizadas

Para este módulo se aplicarán las siguientes técnicas de diseño de pruebas funcionales:

#### Partición de Equivalencia

Se utiliza para clasificar las entradas relacionadas con comentarios y destinatarios de notificación en grupos válidos e inválidos.

Aplicaciones dentro del módulo:

- Comentario válido.
- Comentario vacío.
- Comentario con formato Markdown.
- Comentario con mención válida.
- Comentario con mención inexistente o mal formada.

#### Tabla de Decisión

Se utiliza cuando el resultado depende de la combinación de varias condiciones, especialmente en la generación de notificaciones.

Aplicaciones dentro del módulo:

- Usuario mencionado o no mencionado.
- Notificaciones activadas o desactivadas.
- Evento notificable o no notificable.
- Usuario destinatario válido o no válido.
- Preferencia de correo habilitada o deshabilitada.

#### Flujo funcional

Se utiliza para validar secuencias completas visibles para el usuario, como registrar un comentario y verificar su aparición en el historial de una tarea.

Aplicaciones dentro del módulo:

- Crear comentario.
- Guardar comentario.
- Visualizar comentario en el historial.
- Generar notificación asociada.

---

## 3. Especificaciones de Escenarios de Prueba

Para organizar el diseño del módulo **MOD-0007**, los casos funcionales se agrupan en cuatro escenarios principales.

| ID Escenario | Descripción breve | RF cubiertos | Alcance funcional | Técnica principal |
| :--- | :--- | :--- | :--- | :--- |
| **ESC-7001** | Registro de comentarios en tareas | RF-7001 | Valida que el usuario pueda registrar comentarios asociados a una tarea y que el sistema controle entradas válidas e inválidas. | Partición de Equivalencia |
| **ESC-7002** | Comentarios con formato y menciones | RF-7001, RF-7002 | Valida comentarios con Markdown básico y menciones a usuarios mediante `@usuario`. | Partición de Equivalencia / Tabla de Decisión |
| **ESC-7003** | Notificaciones internas | RF-7002 | Verifica la generación de notificaciones in-app ante eventos relevantes. | Tabla de Decisión |
| **ESC-7004** | Preferencias y envío de emails | RF-7003 | Valida las condiciones necesarias para que el sistema envíe o no notificaciones por correo. | Tabla de Decisión |

---

## 4. Escenarios Detallados y Casos Derivados

---

## 4.1. Escenario: [ESC-7001] - Registro de comentarios en tareas

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema permita registrar comentarios asociados al historial de una tarea y que controle entradas no válidas. |
| **RF asociados** | RF-7001 |
| **Actor principal** | ACT-0002 - Mapper / ACT-0003 - Validator |
| **Precondiciones** | El usuario se encuentra autenticado y accede a una tarea disponible dentro de un proyecto. |
| **Técnicas aplicadas** | Partición de Equivalencia y flujo funcional. |
| **Resultado esperado** | El sistema registra comentarios válidos en el historial de la tarea y evita guardar comentarios vacíos o inválidos. |

### B. Aplicación de Técnicas

#### B.1. Partición de Equivalencia para comentarios

| Clase inválida | Clase válida | Clase válida |
| :--- | :--- | :--- |
| Comentario vacío o compuesto solo por espacios. | Comentario de texto plano válido. | Comentario con contenido descriptivo relacionado con la tarea. |
| **Comportamiento esperado:** el sistema no debe registrar el comentario o debe mostrar validación. | **Comportamiento esperado:** el sistema debe registrar el comentario. | **Comportamiento esperado:** el sistema debe registrar el comentario en el historial. |

#### B.2. Flujo funcional de registro de comentario

El flujo esperado es:

1. Ingresar a una tarea.
2. Abrir la sección de comentarios o historial.
3. Escribir un comentario válido.
4. Enviar o guardar el comentario.
5. Verificar que el comentario aparezca en la interfaz.

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD7-001** | Registrar un comentario válido en una tarea. | Comentario de texto plano relacionado con la tarea. | El sistema guarda el comentario y lo muestra en el historial. |
| **CP-MOD7-002** | Intentar registrar un comentario vacío. | Campo de comentario vacío o con espacios. | El sistema no registra el comentario o muestra una validación. |

---

## 4.2. Escenario: [ESC-7002] - Comentarios con formato y menciones

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema procese comentarios con formato básico y menciones a usuarios mediante el uso de `@usuario`. |
| **RF asociados** | RF-7001, RF-7002 |
| **Actor principal** | ACT-0002 - Mapper / ACT-0003 - Validator |
| **Precondiciones** | Existe una tarea disponible y al menos un usuario que pueda ser mencionado. |
| **Técnicas aplicadas** | Partición de Equivalencia y Tabla de Decisión. |
| **Resultado esperado** | El sistema registra comentarios con formato permitido y genera notificaciones cuando existe una mención válida. |

### B. Aplicación de Técnicas

#### B.1. Partición de Equivalencia para contenido del comentario

| Clase inválida | Clase válida | Clase válida |
| :--- | :--- | :--- |
| Mención mal formada o usuario inexistente. | Comentario con Markdown básico. | Comentario con mención válida a un usuario existente. |
| **Comportamiento esperado:** el sistema no debe generar notificación válida o debe mostrar la mención como texto normal. | **Comportamiento esperado:** el sistema debe guardar el contenido sin romper la interfaz. | **Comportamiento esperado:** el sistema debe registrar el comentario y generar notificación al usuario mencionado. |

#### B.2. Tabla de Decisión para menciones

| Condiciones / Acciones | Regla 1 | Regla 2 | Regla 3 | Regla 4 |
| :--- | :---: | :---: | :---: | :---: |
| **Condiciones** | | | | |
| ¿El comentario contiene mención? | Sí | Sí | No | Sí |
| ¿El usuario mencionado existe? | Sí | No | N/A | Sí |
| ¿El usuario mencionado tiene notificaciones activas? | Sí | N/A | N/A | No |
| **Acciones** | | | | |
| Registrar comentario | X | X | X | X |
| Generar notificación in-app | X | | | |
| No generar notificación por usuario inexistente | | X | | |
| No generar notificación por preferencias desactivadas | | | | X |

En esta tabla, `N/A` significa que la condición no aplica para esa regla. La marca `X` indica la acción esperada para cada combinación de condiciones.

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD7-003** | Registrar un comentario con formato Markdown básico. | Comentario con negrita, lista o enlace permitido. | El sistema guarda el comentario sin romper la visualización. |
| **CP-MOD7-004** | Registrar un comentario mencionando a un usuario existente. | Comentario con `@usuario`. | El sistema registra el comentario y genera notificación para el usuario mencionado. |
| **CP-MOD7-005** | Registrar un comentario con mención inexistente. | Comentario con `@usuario_inexistente`. | El sistema registra el comentario sin generar notificación válida. |

---

## 4.3. Escenario: [ESC-7003] - Notificaciones internas in-app

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema genere notificaciones internas visibles para el usuario cuando ocurre un evento relevante. |
| **RF asociados** | RF-7002 |
| **Actor principal** | ACT-0006 - Sistema |
| **Precondiciones** | Existe un usuario autenticado que puede recibir notificaciones internas. |
| **Técnicas aplicadas** | Tabla de Decisión. |
| **Resultado esperado** | El sistema muestra una notificación interna cuando ocurre un evento notificable. |

### B. Aplicación de Técnicas

#### B.1. Tabla de Decisión para notificaciones in-app

| Condiciones / Acciones | Regla 1 | Regla 2 | Regla 3 | Regla 4 |
| :--- | :---: | :---: | :---: | :---: |
| **Condiciones** | | | | |
| ¿Existe evento notificable? | Sí | Sí | No | Sí |
| ¿Existe destinatario válido? | Sí | No | N/A | Sí |
| ¿Notificaciones in-app activas? | Sí | N/A | N/A | No |
| **Acciones** | | | | |
| Mostrar notificación in-app | X | | | |
| No mostrar notificación por destinatario inválido | | X | | |
| No mostrar notificación porque no existe evento | | | X | |
| No mostrar notificación por preferencia desactivada | | | | X |

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD7-006** | Generar un evento de mención hacia un usuario válido. | Usuario mencionado con notificaciones activas. | El sistema muestra una notificación interna. |
| **CP-MOD7-007** | Revisar la bandeja o área de notificaciones después de un evento. | Evento notificable ejecutado previamente. | La notificación aparece en la interfaz del usuario destinatario. |

---

## 4.4. Escenario: [ESC-7004] - Preferencias y envío de emails

### A. Definición del Escenario

| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | Validar que el sistema respete las condiciones necesarias para el envío de notificaciones por correo electrónico. |
| **RF asociados** | RF-7003 |
| **Actor principal** | ACT-0006 - Sistema |
| **Precondiciones** | El usuario posee correo registrado y el entorno cuenta con configuración SMTP disponible. |
| **Técnicas aplicadas** | Tabla de Decisión y Partición de Equivalencia. |
| **Resultado esperado** | El sistema envía correos solo cuando el usuario tiene correo habilitado, existe un evento notificable y el entorno permite el envío SMTP. |

### B. Aplicación de Técnicas

#### B.1. Tabla de Decisión para envío de emails

| Condiciones / Acciones | Regla 1 | Regla 2 | Regla 3 | Regla 4 |
| :--- | :---: | :---: | :---: | :---: |
| **Condiciones** | | | | |
| ¿Evento notificable? | Sí | Sí | Sí | No |
| ¿Usuario tiene email registrado? | Sí | No | Sí | N/A |
| ¿Correos habilitados en preferencias? | Sí | N/A | No | N/A |
| ¿SMTP disponible? | Sí | N/A | N/A | N/A |
| **Acciones** | | | | |
| Enviar correo | X | | | |
| No enviar por falta de email | | X | | |
| No enviar por preferencia desactivada | | | X | |
| No enviar porque no existe evento | | | | X |

#### B.2. Partición de Equivalencia para correo del usuario

| Clase inválida | Clase válida |
| :--- | :--- |
| Usuario sin correo registrado o con correo no válido. | Usuario con correo registrado y preferencias de correo activas. |
| **Comportamiento esperado:** el sistema no debe enviar correo. | **Comportamiento esperado:** el sistema debe enviar correo si existe evento notificable y SMTP disponible. |

### C. Casos de Prueba Derivados

| ID Caso | Pasos de ejecución resumidos | Datos de entrada / contexto | Resultado esperado |
| :--- | :--- | :--- | :--- |
| **CP-MOD7-008** | Activar preferencias de correo y generar un evento notificable. | Usuario con email registrado y SMTP disponible. | El sistema envía o programa el envío de correo. |
| **CP-MOD7-009** | Desactivar preferencias de correo y generar un evento notificable. | Usuario con correo registrado, pero correos desactivados. | El sistema no envía correo. |
| **CP-MOD7-010** | Generar evento notificable con usuario sin correo registrado. | Usuario sin email válido. | El sistema no envía correo. |

---

## 5. Matriz de Trazabilidad del Diseño

| Requisito funcional | Escenario asociado | Casos derivados | Técnica principal |
| :--- | :--- | :--- | :--- |
| **RF-7001** | ESC-7001, ESC-7002 | CP-MOD7-001, CP-MOD7-002, CP-MOD7-003, CP-MOD7-004, CP-MOD7-005 | Partición de Equivalencia / Flujo funcional |
| **RF-7002** | ESC-7002, ESC-7003 | CP-MOD7-004, CP-MOD7-006, CP-MOD7-007 | Tabla de Decisión |
| **RF-7003** | ESC-7004 | CP-MOD7-008, CP-MOD7-009, CP-MOD7-010 | Tabla de Decisión / Partición de Equivalencia |

---
