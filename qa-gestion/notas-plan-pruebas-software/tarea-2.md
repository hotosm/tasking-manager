# Análisis de pruebas unitarias de Servicios Core y Lógica de Negocio

**Responsable:** *Jorge Luis Mamani Huarsaya*

## Objetivo

Analizar las pruebas unitarias existentes relacionadas con servicios principales y lógica de negocio del sistema, evaluando la cobertura funcional actual y definiendo nuevos escenarios de prueba orientados a robustez, validaciones, consistencia transaccional y reglas de negocio críticas.

## Alcance

Esta tarea comprende el análisis de las pruebas unitarias de `backend` y `api` enfocadas en el servicio. A continuación se muestra algunos de los arachivos a analizar.

```text
services/
├── test_mapping_service.py
├── test_organisation_service.py
├── test_project_admin_service.py
├── test_project_search_service.py
├── test_project_service.py
├── test_recommendation_service.py
├── test_stats_service.py
├── test_team_service.py
├── test_validator_service.py

services/grid/
└── test_grid_service.py

services/mapping_badges/
└── test_mapping_badge_service.py

services/mapping_levels/
└── test_mapping_level_service.py
````

> [!IMPORTANT]
> El enfoque principal será la capa de servicios y reglas de negocio del proyecto.

## Actividades específicas

* Analizar el comportamiento funcional cubierto por cada test.
* Identificar reglas de negocio actualmente validadas.
* Evaluar cobertura sobre:
  * permisos
  * estados del sistema
  * validaciones de negocio
  * búsquedas y filtros
  * transacciones
  * integridad operativa
  * manejo de excepciones
* Detectar escenarios críticos no contemplados.
* Identificar posibles riesgos relacionados con:
  * concurrencia
  * inconsistencias de estado
  * operaciones parciales
  * errores de persistencia
* Proponer nuevos tests orientados a robustez y resiliencia.
* Elaborar recomendaciones técnicas para ampliar cobertura.

## Entregables esperados

* Documento técnico de análisis de cobertura de servicios.
* Matriz de funcionalidades cubiertas por servicio.
* Lista priorizada de escenarios faltantes.
* Propuesta de nuevas pruebas unitarias y de integración.
* Identificación de servicios críticos con baja cobertura.

## Criterios de aceptación

* Todos los servicios asignados fueron revisados.
* Se documentaron reglas de negocio actualmente cubiertas.
* Se identificaron vacíos funcionales relevantes.
* Las nuevas pruebas propuestas están alineadas con riesgos técnicos reales.
* El análisis incluye recomendaciones de priorización.

## Consideraciones técnicas

* Considerar flujos exitosos y escenarios de fallo.
* Revisar cobertura de excepciones controladas y no controladas.
* Verificar uso adecuado de mocks y dependencias externas.
