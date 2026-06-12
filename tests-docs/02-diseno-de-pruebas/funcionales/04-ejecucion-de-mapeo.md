# Diseño de Pruebas Funcionales: MOD-03 - Ejecución de Mapeo (Tasking)
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo

Este módulo gestiona el flujo de trabajo central de contribución geográfica de la plataforma. Es responsable de coordinar la selección, el bloqueo exclusivo, la interacción con herramientas de edición (tanto basadas en la web como locales) y la liberación o actualización de estado de las tareas dentro de un proyecto. Su propósito principal es garantizar la concurrencia segura de múltiples usuarios, previniendo colisiones de edición y asegurando la correcta evolución del progreso de mapeo del proyecto.

*Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](../funcionales/01-requerimientos-funcionales.md).*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general

El enfoque de pruebas para este módulo será de extremo a extremo (End-to-End) desde la perspectiva del comportamiento observable en la interfaz de usuario. Las pruebas se centrarán en validar el ciclo de vida completo de una tarea geográfica, tomando como protagonista al actor **`MAPPER` (ACT-0002)**, dado que es el rol principal de ejecución de este flujo. 

Se evaluará rigurosamente la reactividad del sistema frente a restricciones de acceso (licencias previas, exclusividad de bloqueos), el comportamiento de la interfaz al invocar editores cartográficos externos (validación de URLs generadas o detección de servicios locales) y la correcta respuesta visual tras el envío de resultados. De manera complementaria, se modelará la intervención del actor **`Sistema` (ACT-0006)** para auditar los flujos de liberación automática por expiración de tiempo.

### 2.2. Técnicas de Caja Negra Utilizadas

Para garantizar una cobertura óptima y reducir la redundancia en los casos de prueba, se aplicarán las siguientes metodologías de diseño:

*   **Partición de Equivalencia (Equivalence Partitioning):** Utilizada para evaluar las restricciones de acceso y selección de herramientas. Se agruparán en clases representativas las condiciones de los proyectos (por ejemplo, Proyectos que requieren nivel `BEGINNER` vs `ADVANCED`), los tipos de editores configurados (Editores Web como iD/Rapid vs Editores Locales como JOSM), y el estado legal del usuario (Licencia aceptada vs No aceptada).
*   **Análisis de Valores Límite (Boundary Value Analysis):** Se aplicará específicamente para validar las reglas de negocio dependientes de variables numéricas extremas, como los límites de zoom topográfico al intentar dividir (Split) una tarea, y el umbral de tiempo límite (`autoUnlockSeconds`) para la liberación automática de una tarea bloqueada.
*   **Tablas de Decisión (Decision Table Testing):** Se utilizará para modelar combinaciones de reglas de negocio complejas antes de permitir el bloqueo de una tarea. Combinará múltiples entradas binarias (por ejemplo, *¿Tiene el usuario otra tarea bloqueada?*, *¿Cumple con el nivel de mapeo?*, *¿El proyecto está publicado?*) para determinar la salida correcta esperada en la interfaz (habilitación del botón de mapeo o visualización de un error específico).
*   **Transición de Estados (State Transition Testing):** Esta es la técnica principal del módulo, ya que el modelo funcional depende intrínsecamente del ciclo de vida de una tarea. Se utilizará para validar que los cambios de estado (por ejemplo, de `READY` a `LOCKED_FOR_MAPPING`, y posteriormente a `MAPPED` o `BADIMAGERY`) sigan estrictamente las transiciones permitidas por la interfaz, incluyendo las reversiones (Undo).
