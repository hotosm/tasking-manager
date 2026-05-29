# Estructura y Gobierno Documental del Plan de Pruebas (tests-docs)

Este documento establece la normativa oficial para la organización de la Wiki de Aseguramiento de Calidad (`tests-docs`). Su estructura está estrictamente alineada con los procesos del estándar internacional **ISO/IEC/IEEE 29119**, garantizando trazabilidad, escalabilidad y una gestión profesional del ciclo de vida del testing.

El objetivo de este espacio es centralizar el diseño y la gestión funcional de las pruebas. **Regla de oro:** No se debe transcribir código fuente automatizado en esta Wiki; se deben utilizar hipervínculos hacia el repositorio oficial del proyecto.

## Jerarquía de Directorios y Responsabilidades

La Wiki utiliza prefijos numéricos para mantener un orden secuencial e inquebrantable en el menú de navegación (`_Sidebar.md`).

### `01-planificacion-y-gestion/`
*(Alineado a ISO 29119 - Parte 2: Procesos de Gestión)*
Centraliza la estrategia, organización y cronogramas.
*   **`plan-maestro-de-pruebas.md`:** Visión global del proyecto, asignación del equipo QA, gestión de riesgos y enlaces a tableros Kanban (GitHub Projects).
*   **Sub-planes por Nivel:** Documentos específicos para cada fase del testing (ej. `plan-pruebas-unitarias.md`, `plan-pruebas-integracion.md`, `plan-pruebas-sistema.md`, `plan-pruebas-aceptacion.md`). Definen el alcance, las herramientas (TDD/BDD) y las técnicas a utilizar.

### `02-diseno-de-pruebas/`
*(Alineado a ISO 29119 - Parte 2 y 3: Especificación de Diseño)*
Almacena el diseño funcional de las pruebas, organizado por niveles y módulos de negocio. Los integrantes del equipo trabajan activamente aquí.
*   **`unitarias/`:** Suites enfocadas en componentes aislados (ej. `01-seguridad-usuarios-comms.md`, `02-servicios-core-negocio.md`). 
*   **`integracion/` / `sistema/`:** (Se poblarán en fases posteriores).
*   *Nota de uso:* Cada documento de suite debe identificar funcionalidades, mapear mediante URLs las pruebas ya existentes en el código base y proponer nuevas pruebas para cubrir brechas utilizando técnicas formales (caja negra/blanca).

### `03-trazabilidad-y-cobertura/`
*(Alineado a ISO 29119 - Parte 4: Medición de Cobertura)*
Garantiza que ningún componente quede sin probar y conecta la documentación con el código.
*   **`matriz-trazabilidad.md`:** Tabla central que vincula: *Módulo del Producto -> Condición de Prueba en la Wiki -> Archivo de Código en GitHub*.

### `04-ejecucion-y-reportes/`
*(Alineado a ISO 29119 - Parte 2: Control, Seguimiento y Finalización)*
Registra la evidencia de las iteraciones de prueba y los resultados métricos.
*   **`ciclos-de-prueba/`:** Informes de estado por sprint, iteración o release.
*   **`metricas-y-cobertura/`:** Resultados de cobertura de código (ej. SonarQube, Coverage.py) y aplicación de la fórmula de cobertura de diseño del estándar ($N/T * 100\%$).
*   **`reportes-cierre/`:** Documento formal de aprobación (QA Sign-off) para avanzar a la siguiente fase o a producción.

## Estándares de Trabajo en la Wiki

1.  **Uso Obligatorio de Plantillas:** Todo nuevo documento (Plan o Suite) debe crearse utilizando las plantillas base ubicadas en `qa-gestion/06-plantillas/`.
2.  **Manejo de Evidencias:** Queda prohibido subir videos o archivos de log pesados al repositorio git de la Wiki. Se deben utilizar servicios de almacenamiento en la nube e incluir únicamente las URLs en los reportes de ejecución.
3.  **Gestión de Bugs:** Los defectos individuales no se documentan en esta Wiki. Se levantan como *Issues* en el repositorio del código fuente. La Wiki solo alojará métricas de tendencias o análisis de causa raíz (RCA) a nivel gerencial.
