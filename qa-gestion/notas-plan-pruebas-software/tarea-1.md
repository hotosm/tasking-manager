# Análisis de pruebas unitarias de Modelos, DTOs y Validaciones Base

**Responsable:** *Yordano Hernan Boza Portilla*

## Objetivo

Realizar un análisis exhaustivo de las pruebas unitarias existentes relacionadas con modelos de dominio, entidades PostGIS y DTOs del sistema, con el fin de evaluar la cobertura actual, identificar vacíos funcionales y proponer nuevos escenarios de prueba alineados con la arquitectura y reglas de validación del proyecto.

## Alcance

Esta tarea comprende el análisis de las pruebas unitarias enfocadas a los modelos del sistema. Por ejemplo, tenemos:

```text
models/dtos/
├── test_mapping_dto.py
└── test_project_dto.py

models/postgis/
├── test_banner.py
├── test_custom_editor.py
├── test_message.py
├── test_organisation.py
├── test_project.py
├── test_project_info.py
├── test_task.py
└── test_user.py
````

El análisis deberá enfocarse en la capa de datos y validación estructural del sistema.

## Actividades específicas

* Revisar el propósito funcional de cada archivo de prueba.
* Identificar las entidades, DTOs y validaciones cubiertas actualmente.
* Analizar:
  * validaciones de atributos
  * restricciones de integridad
  * serialización/deserialización
  * relaciones entre entidades
  * valores por defecto
  * manejo de datos inválidos
* Determinar escenarios críticos no cubiertos por las pruebas actuales.
* Evaluar la calidad y granularidad de los tests existentes.
* Proponer nuevos casos de prueba priorizados según riesgo funcional.
* Documentar hallazgos técnicos y recomendaciones.

## Entregables esperados

* Documento de análisis de cobertura actual.
* Matriz:
  * archivo de prueba
  * funcionalidad cubierta
  * casos evaluados
  * vacíos detectados
* Lista priorizada de nuevas pruebas recomendadas.
* Recomendaciones técnicas para mejorar cobertura y mantenibilidad.

## Criterios de aceptación

* Todas las pruebas asignadas fueron analizadas.
* Se documentaron funcionalidades cubiertas y no cubiertas.
* Se identificaron casos borde y validaciones faltantes.
* Las propuestas de nuevas pruebas tienen justificación técnica.
* El análisis mantiene trazabilidad con entidades y DTOs reales del proyecto.

## Consideraciones técnicas

* Evaluar posibles inconsistencias entre DTOs y modelos persistentes.
* Verificar cobertura de errores y excepciones.
* Revisar uso de fixtures, mocks y factories existentes.
* Considerar escenarios de datos incompletos, inválidos o extremos.


