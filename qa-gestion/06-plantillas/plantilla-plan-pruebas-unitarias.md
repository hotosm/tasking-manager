# Plan de Pruebas Unitarias

## 1. Alcance y Objetivos (TP1)
Este plan define la estrategia y ejecución exclusiva de las **Pruebas Unitarias** para el proyecto Tasking Manager. 
*   **Objetivo:** Asegurar el correcto funcionamiento aislado de funciones, clases y métodos, alcanzando una cobertura de diseño funcional y estructural aceptable.
*   **Fuera de alcance:** Interacciones entre módulos (cubierto en Plan de Integración), UI completa y despliegues.

## 2. Estrategia de Pruebas (TP5)
En base a la ISO 29119-4, utilizaremos las siguientes técnicas y enfoques:
*   **Enfoque de Desarrollo:** TDD para nuevas implementaciones y BDD para validación de reglas de negocio complejas.
*   **Técnicas de Diseño (Caja Negra):** Particiones de clases de equivalencia, Análisis de valores límite y Error guessing.
*   **Manejo de Pruebas Existentes:** Se referenciarán mediante URLs al repositorio oficial. No se transcribirá lógica automatizada a manual.

## 3. Organización y Asignación (TP2 y TP6)
El equipo actual (Fase 1) se distribuye de la siguiente manera:
*   **Integrante 1 ([Nombre]):** Seguridad, Usuarios, Comunicaciones. Revisión general y consolidación del plan.
*   **Integrante 2 ([Nombre]):** Servicios Core y Lógica de Negocio.
*   **Integrante 3 ([Nombre]):** Modelos, DTOs y Validaciones Base.
*(Nota: 3 integrantes adicionales se incorporarán en las fases de Integración y Sistema).*

## 4. Gestión de Riesgos (TP3 y TP4)
| Riesgo Identificado | Impacto | Estrategia de Mitigación |
| :--- | :--- | :--- |
| Refactorización rompe pruebas existentes | Alto | Integración de pruebas unitarias en pipeline de CI/CD (GitHub Actions) antes del merge. |
| Cobertura insuficiente en legacy code | Medio | Aplicar técnicas de partición de equivalencia para identificar brechas críticas a cubrir en esta fase. |

## 5. Criterios de Aprobación (Finalización)
*   **Métrica ISO 29119:** Cobertura de Elementos de Prueba (N/T * 100%) superior al 80% en los módulos críticos.
*   **Trazabilidad:** 100% de los módulos asignados mapeados en la Matriz de Trazabilidad.
