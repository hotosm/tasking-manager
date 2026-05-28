# Informe Técnico: Investigación e Implementación de GitHub Actions para CI Básico

**Responsable:** Jhonatan Davis Arias Quispe  
**Rol:** Analista / Ingeniero de QA  
**Fecha:** 27 de mayo de 2026  
**Proyecto:** Gestor de Tareas (Fork Open Source)

---

## 1. Resumen Ejecutivo
Como parte de los esfuerzos de control de calidad (QA) y gestión de proyectos, el presente documento certifica la investigación, análisis y documentación de la estrategia de Integración Continua (CI) implementada mediante **GitHub Actions**. 

Al tratarse de un fork de un repositorio Open Source robusto, la estrategia se basa en aprovechar, optimizar y explicar las configuraciones existentes de los *workflows*, enfocándose expresamente en las validaciones, ejecución automática de pruebas y control de calidad sobre el código (Frontend y Backend).

---

## 2. Investigación sobre GitHub Actions

**GitHub Actions** es la plataforma de Integración Continua y Despliegue Continuo (CI/CD) nativa de GitHub. Permite automatizar *workflows* directamente desde el repositorio, en base a los eventos nativos de Git y GitHub (Pushes, Pull Requests, creaciones de Issues, etc.).

Aqui les dejo una cheat sheet de GitHub Actions para que tengan a mano los comandos y sintaxis más comunes. 

![GitHub Actions Cheat Sheet](https://github.github.io/actions-cheat-sheet/actions-cheat-sheet.pdf)

### 2.1 Estructura y Sintaxis de Workflows
Los workflows se definen como archivos en formato YAML, obligatoriamente ubicados en la carpeta `.github/workflows/`. Todo flujo se estructura bajo los siguientes componentes:

*   **`name:`** Nombre descriptivo del workflow (ej. `🧪 PR Test Backend`).
*   **`on:`** Define los eventos que "disparan" o gatillan el workflow. Para un CI básico, solemos emplear la apertura o actualización de `pull_request` sobre rutas específicas (paths: `backend/**`, `frontend/**`).
*   **`jobs:`** Representa una o múltiples tareas a ejecutar. Por defecto, los *jobs* se ejecutan en paralelo.
*   **`runs-on:`** Define el "runner" o entorno del servidor (Máquina Virtual) donde el script operará. Es usual y estándar emplear `ubuntu-latest`.
*   **`steps:`** Es la secuencia lineal de directivas. Pueden ser acciones empaquetadas (con la palabra clave `uses:`, como `actions/checkout@v6`) o comandos en consola directos (usando `run:`).

### 2.2 Evaluación de Runners y Entornos
Existen dos grandes modelos de *Runners*:
1.  **GitHub-Hosted Runners:** Contenedores aislados mantenidos por GitHub (`ubuntu-latest`, `windows-latest`, `macos`). Tienen configuraciones limpias. Se instalan dependencias como Python o Node.js sobre la marcha empleando Actions de setup (ej. `actions/setup-node@v6`).
2.  **Self-Hosted Runners:** Máquinas físicas o virtuales de la organización, que ofrecen persistencia y acceso a hardware propio. 

En nuestro ecosistema configurado, se emplean los **GitHub-Hosted Runners (Ubuntu)** por su alta portabilidad y disponibilidad.

---

## 3. Implementaciones Actuales (Workflows Base del Proyecto)

El repositorio analizado cuenta con una suite pre-configurada muy sólida, la cual validamos y documentamos a continuación. Estos pipelines cumplen el rol fundamental de garantizar la calidad antes de hacer "Merge" hacia las principales ramas del repositorio.

### 3.1 Pruebas Automáticas Backend (`pr_test_backend.yml`)
Este flujo se lanza cada vez que se detectan cambios contra la carpeta `backend/` en un pull request hacia las ramas `main`, `staging`, o `develop`. 

#### a) Job de Validaciones de Estilo (PEP8 Code Check)
*   Se clona el repo y se provisiona **Python 3.10**.
*   Instala los linters estándares **Flake8** (para estilo de código y bugs analíticos) y **Black** (formateador absoluto).
*   **Validación:** Ejecuta `flake8` ignorando ciertas normas laxas e instruye a `black --check`, lo que fallará y bloqueará el Pull Request si el desarrollador no ha formateado adecuadamente el código fuente. 

#### b) Jobs de Pytest (Unit e Integration)
*   Utilizan *Actions de flujos centralizados/reutilizables* (`hotosm/gh-workflows/.github/workflows/test_compose.yml`).
*   Inician todo el ecosistema de *Docker Compose* en el runner, levantando servicios como el Backend, Base de datos (PostGIS) y Cron Jobs.
*   Se crea explícitamente una base de datos de pruebas `taskingmanagertest`.
*   Ejecutan las suites de manera aislada separando unitarias e integrales (`pytest tests/api/unit/` y `pytest tests/api/integration/`).

### 3.2 Pruebas Automáticas Frontend (`pr_test_frontend.yml`)
De igual modo, salta cuando existen alteraciones en la carpeta `frontend/`.

#### a) Job de Build
*   Instala e inicializa **Node.js 22.12.0** de Node.
*   Implementa una caché agresiva con `actions/cache@v5` para el directorio `node_modules`. Esta es una **Excelente Práctica de Integración Continua** ya que minimiza el tiempo de red al cachear el *yarn.lock* o *package.json*.
*   Manejo avanzado de "Secretos y Variables" importándolos en archivos `.env` temporales.
*   Ejecuta instintivamente `yarn install` y la suite `yarn test`.
*   Finalmente, valida el empaquetado de webpack/React con `yarn build` y arroja/públicos (upload) mediante `actions/upload-artifact` los empaquetados resultantes como Artefactos Github para cualquier revisión rápida visual.

#### b) Validaciones Genéricas de PR y Etiquetas (`pr_label.yml` y `issue_label.yml`)
Automatizan cargas de trabajo administrativas usando la utilidad `actions/labeler@v6` que categoriza el Pull Request según qué archivos o dominios (ej. Frontend o Backend) han sido alterados.

---

## 4. Evidencias y Análisis de la Configuración 

1.  **Ejecución en Pushes/Pull Requests:** Garantizadas por los disparadores del YAML. El código nunca llega a Master si no ha pasado por el escáner (linter + Pytest o Yarn test).
2.  **Manejo de Logs y Resultados:** La página de acciones de Github Action renderiza individualmente cada `step`. Pytest ha sido configurado para fallar el proceso si al menos una prueba está en rojo, al igual que los scripts de lint (`black --check`).
3.  **Ambientes Seguros:** Mediante variables `${{ secrets }}` en conjunto con configuraciones compartidas y scripts temporales `.env.expand`.

---

## 5. Recomendaciones de Escalabilidad Futura (Roadmap)

A este diseño fundacional, se visualizan oportunidades estratégicas de mejora orientadas a la expansión del CI/CD:

1.  **Análisis Estático y Cobertura (SonarQube/Codecov):**
    *   La herramienta actualiza reportes de *Tests* pero no envía la métrica de cobertura. Integrar SonarCloud validará métricas críticas como *bugs de seguridad*, *code smells*, e indicará claramente los alcances de cobertura de los `pytest`.
2.  **Escaneo de Seguridad de Dependencias (Dependabot / Snyk):**
    *   Implementar un workflow que invoque `npm audit` o escaners de librerías tipo Snyk/Trivy puede prevenir que paquetes deprecados se adhieran.

---

## 6. Criterios de Aceptación (Checklist)

* [x] **Investigación Realizada:** Estructura fundamentada de GitHub Actions y Runners.  
* [x] **Flujos Funcionales Comprendidos:** Análisis del testing en Frontend y Backend y control de calidad.  
* [x] **Tests Automatizados:** Documentada la presencia y funcionalidad de pruebas y compilación.  
* [x] **Conclusión y Escalabilidad:** Trazado del Roadmap a futuro.
* [x] **Documentación Entregada:** El presente documento sirve como base técnica del hito.

**Cambio y fuera c:**