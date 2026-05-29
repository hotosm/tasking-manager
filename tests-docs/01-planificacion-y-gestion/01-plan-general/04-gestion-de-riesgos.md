# Plan Maestro de Pruebas: Gestión de Riesgos

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
| **RT-03** | **Degradación por Refactorización:** Cambios en la arquitectura de FastAPI por parte del equipo de Dev rompen las pruebas unitarias existentes (Legacy tests). | Alta | Alto | **Mitigación:** Integración estricta de análisis de código en CI. QA no actualiza los scripts heredados hasta analizar el cambio mediante ingeniería inversa en la Wiki (`tests-docs`). |

## 3. Matriz de Riesgos Organizacionales y de Proyecto
Estos riesgos contemplan las dinámicas del equipo de QA, la estructura del proyecto Open Source (HOTOSM) y la planificación.

| ID | Riesgo Identificado | Probabilidad | Impacto | Estrategia de Mitigación y Contingencia |
| :--- | :--- | :--- | :--- | :--- |
| **RO-01** | **Dinámica Open Source:** Contribuciones masivas (Pull Requests) de voluntarios de la comunidad introducen código no probado que salta los estándares ISO definidos. | Alta | Crítico | **Mitigación:** Bloquear la rama `main` y `develop`. Forzar reglas de rama en GitHub (Branch Protection) exigiendo la aprobación del *Lead QA* (Integrante 1) y el éxito del Pipeline. |
| **RO-02** | **Cuello de Botella Documental:** El Integrante 1 se convierte en el único revisor de la Wiki, generando retrasos en la etapa de Diseño de pruebas de los Integrantes 2 y 3. | Media | Alto | **Mitigación:** Establecer SLAs internos (ej. máximo 24 horas para revisión de PRs en la Wiki). Si la carga es muy alta, el Integrante 2 asume el rol de revisor de respaldo (Back-up Reviewer). |
| **RO-03** | **Curva de Aprendizaje del Equipo Futuro:** Los 3 nuevos integrantes que se sumarán en las Fases 3 y 4 carecen de contexto técnico de la API, afectando la calidad de las pruebas E2E. | Alta | Medio | **Mitigación:** Asegurar que los repositorios `qa-gestion` y `producto-docs` estén 100% finalizados y auditados antes de la incorporación de este personal, sirviendo como material de onboarding autogestionado. |

## 4. Plan de Seguimiento de Riesgos
Esta matriz no es estática. El **Integrante 1** es el responsable de monitorear el estado de estos riesgos y agregar nuevos hallazgos durante las sesiones de evaluación que se realizarán al finalizar cada iteración o sprint de pruebas.
