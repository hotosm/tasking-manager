#  Definición de Módulos para Pruebas Funcionales (Caja Negra) - Hito 2
**Test Analysts:** Alexandra Quispe & Jhonatan Arias

Alineados a los requerimientos del Hito 2 y las buenas prácticas de QA, hemos definido los siguientes **3 Módulos de Interfaz (UI)** del Tasking Manager sobre los cuales los Test Designers deberán diseñar y ejecutar los Casos de Prueba Manuales de Caja Negra.

---

###  Módulo 1: Formulario de Creación y Edición de Proyectos (Admin UI)
* **Descripción Funcional:** Interfaz donde el usuario Administrador o Project Manager crea una campaña, sube el área de interés (GeoJSON) y configura las reglas del proyecto (prioridad, dificultad).
* **Directrices de Técnicas de Caja Negra para Test Designers:**
  * **Análisis de Valores Límite (AVL):** Evaluar los campos de texto como "Project Name" (ej. validar comportamiento con 0 caracteres, 1 carácter, y el límite máximo permitido).
  * **Partición de Equivalencia (PE):** Al subir el archivo del mapa (AoI), probar la clase válida (archivo `.geojson` de menos de 1MB) vs clases inválidas (archivo `.pdf`, o `.geojson` mayor a 1MB).

---

###  Módulo 2: Interfaz de Mapeo y Bloqueo de Tareas (Task Grid UI)
* **Descripción Funcional:** La pantalla principal donde el voluntario interactúa con el mapa, selecciona un cuadrante (Task) y lo bloquea para mapearlo.
* **Directrices de Técnicas de Caja Negra para Test Designers:**
  * **Transición de Estados:** Diseñar casos que validen el cambio visual y lógico de la tarjeta de la tarea: de `READY` (gris) a `LOCKED` (azul) y finalmente a `MAPPED` (amarillo).
  * **Tabla de Decisión (TD):** Evaluar el comportamiento del botón "Lock Task". (Condiciones: ¿El usuario está logueado? ¿Tiene el nivel de experiencia requerido para la dificultad del proyecto? Acción: Permite bloqueo o Muestra Error).

---

###  Módulo 3: Interfaz de Validación de Tareas (Validation UI)
* **Descripción Funcional:** Pantalla donde los usuarios con rol de Validador revisan el trabajo de los mapeadores y lo aprueban o rechazan.
* **Directrices de Técnicas de Caja Negra para Test Designers:**
  * **Tabla de Decisión (TD):** Evaluar los permisos de validación cruzada. (Regla estricta: Si Usuario X mapeó la tarea 5 -> Usuario X intenta validar la tarea 5 -> Resultado: El sistema bloquea el botón "Validate" y muestra error).
  * **Partición de Equivalencia (PE):** En el campo de "Comentarios de Validación", probar el envío con texto válido, texto vacío y texto con caracteres especiales no permitidos.

---
**Instrucciones para Test Designers (Jorge y Yordano):**
Utilicen estos 3 módulos visuales para diseñar el *Informe de Casos de Pruebas Funcionales*. Deben incluir capturas de pantalla de la interfaz (Evidencias) y aplicar las técnicas mencionadas (PE, AVL, TD) tal como lo requieren las plantillas del curso.

---
**Instrucciones para Jorge y Yordano (Test Designers):** 
Por favor, tomen estos 3 módulos como base. Deben aplicar técnicas de Caja Negra (Valores límite, Tablas de decisión, Casos de uso) basándose en las directrices mencionadas para elaborar el *Informe de Casos de Pruebas Funcionales* requerido para el 10 de junio.
