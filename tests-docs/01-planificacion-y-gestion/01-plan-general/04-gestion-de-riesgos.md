# Plan General de Pruebas: Gestión de Riesgos

**Proyecto:** HOT OSM Tasking Manager  
**Estándar de Referencia:** ISO/IEC/IEEE 29119-2 (Proceso de Gestión de Riesgos de Pruebas)  

## 1. Metodología de Análisis de Riesgos
La identificación y tratamiento de riesgos se evalúa en base a su **Probabilidad de Ocurrencia** (Baja, Media, Alta) y su **Impacto en la Calidad/Cronograma** (Bajo, Medio, Crítico). Todo riesgo con una valoración combinada "Alta-Crítica" requiere una estrategia de mitigación de ejecución obligatoria.

## 2. Matriz de Riesgos Técnicos y Arquitectónicos
Estos riesgos están directamente vinculados con el SUT (System Under Test) y las tecnologías empleadas.

| ID | Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación y Contingencia |
| :--- | :--- | :--- | :--- | :--- |
| **RT-01** | **Bloqueo por APIs Externas:** La API de OpenStreetMap (OSM) rechaza peticiones del pipeline CI/CD debido a *rate limits*, haciendo fallar pruebas válidas. | Alta | Crítico | **Mitigación:** Desacoplar pruebas unitarias usando *Mocks* obligatorios. <br>**Contingencia:** Proveer un servidor de pruebas OSM en Docker (vía `osm-seed`) si fuera estrictamente necesario. |
| **RT-02** | **Falsos Positivos en Geometrías:** Las aserciones sobre cálculos espaciales (PostGIS) fallan en CI/CD debido a diferencias de precisión de punto flotante entre SOs locales y servidores GitHub. | Media | Medio | **Mitigación:** Estandarizar tolerancias de error (`delta`) en las aserciones numéricas espaciales de `pytest`. |


## 3. Matriz de Riesgos Organizacionales y de Proyecto
Estos riesgos contemplan las dinámicas del equipo de QA, la estructura del proyecto Open Source (HOTOSM) y la planificación.

| ID | Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación y Contingencia |
| :--- | :--- | :--- | :--- | :--- |
| **RO-01** | **Cuello de Botella Documental:** Test Lead se convierte en el único revisor de la Wiki, generando retrasos en la etapa de Diseño de pruebas de los demás roles. | Media | Alto | **Mitigación:** Establecer SLAs internos (por ejemplo, máximo 24 horas para revisión de PRs en la Wiki). Si la carga es muy alta, Test Analyst y Test Design asume el rol de revisor de respaldo (Back-up Reviewer). |
| **RO-02** | **Curva de Aprendizaje del Equipo:** Los nuevos integrantes que se sumarán en las siguientes tareas de QA carecen de contexto técnico de la API, afectando la calidad de las pruebas E2E. | Alta | Medio | **Mitigación:** Asegurar que los repositorios `qa-gestion` y `producto-docs` estén 100% finalizados y auditados antes de la incorporación del equipo completo, sirviendo como material de onboarding autogestionado. |

## 4. Plan de Seguimiento de Riesgos
Esta matriz no es estática. Test Lead es el responsable de monitorear el estado de estos riesgos y agregar nuevos hallazgos durante las sesiones de evaluación que se realizarán al finalizar cada iteración o sprint de pruebas.
