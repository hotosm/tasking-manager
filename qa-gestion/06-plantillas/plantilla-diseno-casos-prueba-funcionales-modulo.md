# Diseño de Pruebas Funcionales: [MOD-XX] - [Nombre del Módulo]
**Versión del Documento:** 1.0
**Tipo de Análisis:** Diseño de Pruebas de Sistema (Caja Negra)

---

## 1. Contexto del Módulo
[Descripción concisa de 2 o 3 líneas sobre el objetivo principal y la responsabilidad de este módulo dentro del sistema. Ejemplo: "Este módulo gestiona la lógica de bloqueo, mapeo y liberación de tareas geográficas, interactuando con los editores web y locales"].

*Para consultar el detalle exhaustivo de los actores, restricciones y reglas de negocio, referirse al [Catálogo de Requerimientos Funcionales](../../01-requerimientos-funcionales.md).*

---

## 2. Estrategia de Diseño de Pruebas

### 2.1. Enfoque general
[Breve explicación de la estrategia seleccionada para probar este módulo. Ejemplo: "Las pruebas se centrarán en la validación de los flujos de estado de las tareas (Transitions) y en el control de acceso a las mismas basado en el nivel y rol del usuario."].

### 2.2. Técnicas de Caja Negra Utilizadas
*(Listar y justificar únicamente las técnicas aplicadas en el diseño de este módulo específico)*

*   **[Nombre de la Técnica 1 - ej. Partición de Equivalencia]:** [Justificación de uso. Ejemplo: "Utilizada para agrupar los roles de usuario (Admin, Mapper, Read-Only) y los estados de la tarea (Ready, Mapped) reduciendo el número de combinaciones de prueba a clases representativas."].
*   **[Nombre de la Técnica 2 - ej. Transición de Estados]:** [Justificación de uso].
*   **[Nombre de la Técnica 3]:** [Justificación de uso].

---

## 3. Especificaciones de Escenarios y Casos de Prueba

*(Replicar esta estructura 3.X por cada escenario lógico identificado en el módulo)*

### 3.1. Escenario: [ESC-X0YY] - [Nombre descriptivo del flujo o contexto]

**A. Definición del Escenario**
| Atributo | Detalle |
| :--- | :--- |
| **Descripción** | [Objetivo principal de este escenario. Ej: "Validar que el sistema restringe el bloqueo de tareas a usuarios sin los permisos adecuados."] |
| **RF Asociados** | [RF-X0YY, RF-X0YY] |
| **Precondiciones** | [Estado previo necesario del sistema o del usuario. Ej: "Usuario autenticado. Proyecto #1 en estado PUBLISHED."] |
| **Técnicas aplicadas**| [Técnicas utilizadas para derivar los casos. Ej: Partición de Equivalencia] |
| **Resultado Esperado** | [Comportamiento global o meta del escenario. Ej: "El sistema debe denegar el bloqueo y mostrar el mensaje de error correspondiente."] |

**B. Aplicación de Técnicas (Análisis)**
*[Espacio para documentar el razonamiento analítico. Si se usó Partición de Equivalencia, listar las clases. Si se usó Tabla de Decisión, colocar la tabla reducida. Ejemplo rápido:]*
*   **Partición de Equivalencia (Roles):**
    *   *Clase Válida:* MAPPER, ADMIN
    *   *Clase Inválida:* READ_ONLY, Anónimo (sin token)
*   **Partición de Equivalencia (Estado Tarea):**
    *   *Clase Válida:* READY
    *   *Clase Inválida:* MAPPED, LOCKED_FOR_MAPPING

**C. Casos de Prueba Derivados**
| ID Caso | Pasos de Ejecución | Datos de Entrada (Clases aplicadas) | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **[CP-X0YY-01]** | 1. [Paso 1]<br>2. [Paso 2] | **[Variable 1]:** [Valor]<br>**[Variable 2]:** [Valor] | [Resultado exacto y observable en la interfaz / sistema] |
| **[CP-X0YY-02]** | 1. [Paso 1]<br>2. [Paso 2] | **[Variable 1]:** [Valor]<br>**[Variable 2]:** [Valor] | [Resultado exacto y observable] |

---

### 3.2. Escenario: [ESC-X0YY] - [Nombre descriptivo del flujo o contexto]

*(Copia y pega la estructura A, B y C para el siguiente escenario)*

---

## 4. Matriz de Trazabilidad del Módulo

Esta matriz asegura la cobertura de todos los requerimientos funcionales documentados para este módulo mediante los escenarios y casos de prueba diseñados.

| Requerimiento Funcional (RF) | Especificación de Escenario (ESC) | Casos de Prueba (CP) derivados | Técnicas de Diseño Aplicadas |
| :--- | :--- | :--- | :--- |
| [RF-X0YY] | [ESC-X0YY] | [CP-X0YY-01], [CP-X0YY-02] | [Ej. Partición de Equivalencia] |
| [RF-X0YY] | [ESC-X0YY] | [CP-X0YY-03] | [Ej. Transición de Estados] |
| [RF-X0ZZ] | [ESC-X0ZZ] | [CP-X0ZZ-01], [CP-X0ZZ-02] | [Ej. Valores Límite] |
