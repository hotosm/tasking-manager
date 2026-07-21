# Plan Maestro de Pruebas: Estrategia Organizacional

**Proyecto:** HOT OSM Tasking Manager  
**Estándar de Referencia:** ISO/IEC/IEEE 29119-2 (Procesos de Pruebas) y 29119-3  

## 1. Estrategia General de Pruebas
El proyecto adopta un enfoque de pruebas estructurado de **"Abajo hacia Arriba" (Bottom-Up)** combinado con una filosofía **Shift-Left Testing**. Esto implica que la calidad se inyecta desde la fase de desarrollo mediante metodologías como TDD (Test-Driven Development) y BDD (Behavior-Driven Development), minimizando el descubrimiento de defectos en las fases tardías de UI/E2E.

### 1.1. Ciclo de Vida Organizacional de las Pruebas
Todas las pruebas, independientemente de su nivel (Unitaria, Integración, Sistema), seguirán el siguiente flujo estándar estipulado por el equipo QA.

![Flujo de trabajo con Wiki](/tests-docs/01-plan-de-pruebas/01-plan-general/img/workflow-wiki.png) 

*(Propósito del diagrama: Establecer la regla inquebrantable de que ninguna prueba se codifica sin antes haber sido diseñada y aprobada en la Wiki de QA).*

## 2. Organización del Equipo y Responsabilidades
El equipo opera en un esquema progresivo. La fase de planeación inicial se ejecuta con el **Core QA Team (3 miembros)**, escalando a 6 miembros para las fases posteriores. Las responsabilidades se especifican en la siguiente tabla:

| Rol | Integrantes | Justificación |
| --- | ---: | --- |
| **Test Lead** | 1 | Responsable de coordinar al equipo, supervisar el cumplimiento de hitos, gestionar el tablero de trabajo, validar entregables y realizar el seguimiento general del avance del proyecto. |
| **Test Analyst** | 2 | Encargados de analizar el software, identificar funcionalidades y determinar los elementos que serán considerados dentro del plan de pruebas. |
| **Test Design** | 2 | Responsables de diseñar los casos de prueba, definiendo entradas, pasos de ejecución, resultados esperados y criterios de aceptación correspondientes. |
| **Test Architect** | 1 | Define la estructura técnica del proceso de pruebas, la organización del repositorio y la estrategia de pruebas; además, brinda soporte en tareas relacionadas con CI/CD y GitHub Actions cuando sea requerido. |

## 3. Control Documental y Criterios de Revisión
Para garantizar la integridad, consistencia y auditabilidad del Plan de Pruebas, se adopta un enfoque de Docs-as-Code (Documentación como Código). Toda la estructura de /tests-docs reside en un repositorio Git, lo que permite control de versiones, revisión por pares y trazabilidad histórica.

### 3.1. Flujo de Revisión por Pares (Peer Review)
Dado que la documentación es compartida por todo el equipo, queda **estrictamente prohibida la edición directa (commit directo)** sobre la rama principal (en este caso `develop`) de la documentación.

El flujo de trabajo colaborativo debe seguir estos pasos:
1.  **Creación de Rama:** El integrante que deba documentar una nueva suite o modificar un plan creará una rama específica (ej. `docs/suite-core-services`).
2.  **Desarrollo Documental:** Se redacta el contenido utilizando las plantillas obligatorias ubicadas en `.github/`.
3.  **Pull Request (PR):** Se abre un PR solicitando la integración de los cambios.
4.  **Revisión Obligatoria:** El PR requiere la aprobación de al menos un revisor calificado.
    *   *Regla de Aprobación:* El Test Lead es el aprobador principal de los planes maestros y estrategias.
    *   *Aprobación Delegada:* Para cambios en especificaciones de diseño (Suites), los Test Analyst pueden realizar revisiones cruzadas.

### 3.2. Criterios de Aceptación Documental (DoD de QA)
Un Pull Request documental solo será aprobado si cumple los siguientes criterios:
*   **Consistencia Estructural:** Utiliza la plantilla oficial sin alterar las secciones obligatorias.
*   **Trazabilidad Garantizada:** Todos los hipervínculos a requisitos (Épicas/Issues) y a scripts de código (`.py`, `.js`) son funcionales y precisos.
*   **Cero Ambigüedad:** Los pasos de las pruebas o condiciones lógicas están redactados de forma determinista (un único resultado esperado claro).
*   **Alineamiento ISO:** Las técnicas de diseño (*Valores Límite*, *Particiones de Equivalencia*) están explícitamente declaradas.

### 3.3. Versionado de la Documentación (SemVer)
El versionado del Plan de Pruebas no sigue las versiones del software, sino su propio ciclo de madurez basándose en **Versionado Semántico (SemVer - X.Y.Z)**:

*   **Cambio Mayor (X.0.0):** Se incrementa cuando hay un cambio de paradigma o se inicia una nueva gran fase del estándar.
    *   *Ejemplo:* Pasar de la Fase de Pruebas Unitarias a la Fase de Pruebas de Integración (versión `1.x.x` a `2.0.0`).
*   **Cambio Menor (0.Y.0):** Se incrementa al agregar nuevas suites de pruebas o realizar adiciones funcionales significativas a un plan existente, sin alterar lo que ya estaba documentado.
    *   *Ejemplo:* Se documenta por primera vez la suite de validación de tareas (`1.0.0` a `1.1.0`).
*   **Parche (0.0.Z):** Se utiliza para correcciones ortográficas, actualización de enlaces rotos, formateo Markdown o clarificación de términos.
    *   *Ejemplo:* Corregir la URL de un hipervínculo en el Plan Maestro (`1.1.0` a `1.1.1`).

La trazabilidad histórica (quién, cuándo y por qué modificó un documento) queda registrada inmutablemente en el historial de *commits* de Git, sirviendo como registro de auditoría legal y de calidad.

## 4. Trazabilidad y Métricas Core

Para cumplir con la **Parte 4 (Medición y Técnicas)** y **Parte 2 (Procesos de Control)** del estándar ISO/IEC/IEEE 29119, el equipo establece un modelo matemático y relacional para medir la calidad del producto y la eficiencia del propio proceso de testing.

### 4.1. El Ecosistema de Trazabilidad Bidireccional
La trazabilidad es el eje central del QA profesional. Asegura que ningún requisito de Tasking Manager carezca de cobertura de pruebas, y que ninguna prueba exista sin justificación de negocio.

Se establece la siguiente cadena de trazabilidad bidireccional (registrada en `matriz-trazabilidad-unitaria.md`):
1.  **Requisito de Negocio / Épica** (Origen en GitHub Projects).
2.  **Módulo de Código** (Archivo fuente en `hotosm/tasking-manager`).
3.  **Especificación de Diseño de Prueba** (Caso documentado en la Wiki `/tests-docs`).
4.  **Test Script Automatizado** (Prueba automatizada en el repositorio).
5.  **Evidencia de Ejecución** (Log o reporte de CI/CD).

### 4.2. Métricas de Cobertura Base (ISO/IEC/IEEE 29119-4)
El estándar internacional exige medir la efectividad de las técnicas de diseño de pruebas empleadas. Para ello, define una fórmula universal que el equipo aplicará obligatoriamente.

**Fórmula de Cobertura de Diseño:**

```math
$$ Cobertura\ de\ Diseño\ (\%) = \left( \frac{N}{T} \right) \times 100 $$
```

*   **T** (Total de Elementos de Cobertura Identificados): Representa el número total de escenarios o condiciones que *deberían* probarse según el análisis de caja negra (por ejemplo, el total de valores límite identificados en un módulo).
*   **N** (Elementos Cubiertos / Ejecutados): Representa el número de esos escenarios que efectivamente tienen un caso de prueba documentado y ejecutado.

*Ejemplo de aplicación:* Si al analizar el módulo de "Creación de Tareas" se identifican 20 combinaciones posibles usando tablas de decisión ($T=20$), pero solo se han automatizado y ejecutado 15 ($N=15$), la cobertura de diseño de esa técnica es del **75%**.

### 4.3. Métricas de Ejecución y Calidad del Software
Adicionalmente a la cobertura de diseño de la ISO, el equipo recolectará y analizará las siguientes métricas de ejecución al finalizar cada ciclo de pruebas:

**Cobertura de Pruebas Unitarias (Code Coverage):**
*   *Definición:* Porcentaje de líneas lógicas de código fuente ejecutadas por los scripts de prueba.
*   *Fórmula:* $(Líneas\ de\ código\ ejecutadas / Líneas\ totales\ del\ módulo) \times 100$.
*   *Herramienta:* Generado automáticamente por herramientas de CI (en este caso se usará Coverage.py). Umbral mínimo aceptable: **80%**.

**Tasa de Ejecución de Pruebas:**
*   *Definición:* Refleja el estado operacional de la suite de pruebas.
*   *Desglose:*
    *   % Éxito (Passed): $(Pruebas Exitosas / Total Ejecutadas) \times 100$.
    *   % Fallo (Failed): $(Pruebas Fallidas / Total Ejecutadas) \times 100$.
    *   % Bloqueadas (Blocked): Pruebas que no pudieron ejecutarse por dependencias caídas o errores de entorno.

**Densidad de Defectos (Defect Density):**
*   *Definición:* Indica la madurez y fragilidad de un módulo de código específico.
*   *Fórmula:* $Total\ de\ Bugs\ Confirmados / Tamaño\ del\ Módulo$.
*   *Propósito:* Identificar qué componentes del Tasking Manager (por ejemplo, Lógica espacial vs. Autenticación) concentran la mayor cantidad de errores (Hotspots) para reasignar esfuerzos de QA en futuras iteraciones.

## 5. Estrategia de Evolución del Plan
Este plan es un artefacto vivo. Se ha programado una sesión de reevaluación (Test Strategy Review) al finalizar el ciclo de Pruebas de Integración (Fase 2) para incorporar los procesos metodológicos de los 3 nuevos integrantes y adaptar la estrategia hacia las pruebas de Sistema (Fase 3).
