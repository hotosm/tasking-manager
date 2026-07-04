# Plan de Pruebas de Sistema (End-to-End)

**Proyecto:** HOT OSM Tasking Manager  
**Equipo:** Escarabajo Rinoceronte  
**Tipo de documento:** Plan de Pruebas de Sistema E2E  

---

## 1. Introducción

### 1.1. Alcance
El presente plan cubre la ejecución de las **Pruebas de Sistema (End-to-End)**. El objetivo es validar que todos los componentes (Frontend en React, Backend en FastAPI, Base de Datos PostGIS y autenticación de OpenStreetMap) funcionan juntos correctamente simulando flujos completos desde la perspectiva del usuario final en el navegador.

### 1.2. Referencias
* Documento de Requerimientos Funcionales (Hito 2).
* Plan de Pruebas Funcionales (Caja Negra).
* Especificación de Casos de Uso y Arquitectura del Sistema.

### 1.3. Glosario
* **E2E (End-to-End):** Pruebas de extremo a extremo que validan el flujo completo del sistema.
* **Playwright:** Framework de automatización de pruebas para aplicaciones web.
* **AOI:** Área de Interés (Area of Interest) dibujada en el mapa.

---

## 2. Contexto de las Pruebas

### 2.1. Proyecto / Subprocesos
Se conectarán y probarán los módulos críticos del sistema: **Gestión de Proyectos, Flujo de Mapeo y Proceso de Validación**. Esto implica interactuar con el Frontend que consumirá las APIs del Backend para actualizar estados en la Base de Datos.

### 2.2. Elementos de Prueba
* **Frontend:** Interfaz de usuario (React).
* **Backend:** APIs de servicios principales.
* **Integración externa:** Autenticación vía OpenStreetMap (OAuth).

### 2.3. Alcance de la Prueba (Scope)
* **Incluido:** Flujos completos de negocio priorizados (Happy Paths). Ejemplo: Login -> Buscar Proyecto -> Bloquear Tarea -> Mapear -> Guardar.
* **Excluido:** Pruebas unitarias de código, validación individual de campos de texto (ej. probar si un campo acepta 100 caracteres, lo cual ya se hizo en Caja Negra), pruebas de rendimiento y estrés.

### 2.4. Suposiciones y Restricciones
* **Suposiciones:** El entorno local (Docker) despliega correctamente la aplicación y la base de datos ya cuenta con proyectos y tareas creadas previamente para las pruebas.
* **Restricciones:** No se probará con usuarios reales de la red de OSM de producción, sino con cuentas de prueba simuladas para evitar alterar la plataforma global.

---

## 3. Comunicación de las Pruebas

| Rol | Método de Comunicación | Frecuencia | Responsabilidad |
| :--- | :--- | :--- | :--- |
| **QA / Tester (Jonathan)** | Comentarios en GitHub Issues | Diaria | Reportar scripts fallidos o bugs encontrados durante la ejecución. |
| **DevOps (Alexandra)** | Discord / GitHub PR | Por cada PR | Verificar que los tests corran exitosamente en el workflow de CI/CD. |
| **Equipo Completo** | Reuniones (Discord) | Semanal (Viernes) | Revisar progreso general y bloqueos de las pruebas E2E. |

---

## 4. Registro de Riesgos

| Riesgo | Impacto | Probabilidad | Estrategia de Mitigación |
| :--- | :--- | :--- | :--- |
| Fallo en la autenticación con OSM (OAuth) que bloquee los tests. | Alto | Media | Usar la función `storageState` de Playwright para guardar la sesión y reutilizarla, evitando autenticarse en cada test. |
| Lentitud extrema al levantar los contenedores en CI/CD (GitHub Actions). | Medio | Alta | Optimizar el `docker-compose.yml` de pruebas para cargar solo los servicios esenciales. |

---

## 5. Estrategia de Prueba

### 5.1. Enfoque E2E
Se utilizará un enfoque de **Casos de Uso / Escenarios de Negocio**. No se probarán botones ni formularios aislados, sino **caminos completos** (Happy paths) simulando un usuario humano interactuando con el sistema.

### 5.2. Entregables
* El presente **Plan de Pruebas**.
* **Scripts automatizados** de Playwright alojados en el repositorio.
* **Informe de Ejecución**, incluyendo capturas de pantalla o videos de los tests exitosos y fallidos.

### 5.3. Criterios de Suspensión y Reanudación
* **Suspensión:** Si el flujo de Autenticación (Login) falla consistentemente, se suspenderán todas las pruebas E2E, ya que es el paso inicial obligatorio para cualquier flujo.
* **Reanudación:** Cuando el equipo de desarrollo corrija el bug que bloqueaba el login.

### 5.4. Herramientas
* **Automatización:** Playwright (Node.js).
* **Entorno:** Contenedores Docker locales.
* **CI/CD:** GitHub Actions.

---

## 6. Actividades y Estimados

| Actividad | Esfuerzo Estimado |
| :--- | :--- |
| Configuración del entorno Playwright | 3 horas |
| Automatización Flujo de Mapeo | 5 horas |
| Automatización Flujo de Validación | 4 horas |
| Automatización Flujo de Administración | 4 horas |
| Configuración de Workflow CI/CD | 4 horas |

---

## 7. Personal (Roles y Responsabilidades)

| Rol | Miembro Asignado | Responsabilidad |
| :--- | :--- | :--- |
| **Test Designer / Automation** | Jonathan | Escribir y ejecutar los scripts E2E en Playwright. |
| **DevOps / QA Planner** | Alexandra | Redactar el Plan, configurar el CI/CD (`pr_test_e2e.yml`) y consolidar el informe final. |

---

## 8. Cronograma (Sprint 3)

| Tarea | Fecha Inicio | Fecha Fin | Estado |
| :--- | :--- | :--- | :--- |
| Elaboración del Plan E2E | 03 Jul | 04 Jul | Completado |
| Configuración y Scripts Playwright | 04 Jul | 07 Jul | Pendiente |
| Integración en GitHub Actions | 06 Jul | 08 Jul | Pendiente |

---

## 9. Anexo: Diseño de Casos de Prueba E2E

### ID: E2E-001 | Flujo Completo de Mapeo
* **Escenario:** Un usuario Voluntario bloquea una tarea y la marca como mapeada.
* **Precondiciones:** El sistema debe estar corriendo y existir un proyecto con tareas disponibles.
* **Pasos de Ejecución:**
  1. Ingresar al sistema y hacer Login.
  2. Buscar el proyecto de prueba en la página de Explorar.
  3. Ingresar al proyecto y dar clic en "Contribuir".
  4. Seleccionar una tarea en blanco (Available) en el mapa.
  5. Dar clic en "Map selected task".
  6. Hacer clic en "Yes" a la pregunta "Is this task completely mapped?".
  7. Hacer clic en "Submit task".
* **Resultados Esperados:**
  * La interfaz muestra un mensaje de éxito.
  * El estado visual de la tarea cambia de gris a azul (Mapeada).

### ID: E2E-002 | Flujo Completo de Validación
* **Escenario:** Un usuario Validador revisa una tarea mapeada y la aprueba.
* **Precondiciones:** Debe existir una tarea en estado "Mapeada".
* **Pasos de Ejecución:**
  1. Iniciar sesión con cuenta de nivel Validador.
  2. Ingresar al proyecto de prueba.
  3. Filtrar y seleccionar una tarea azul (Mapeada).
  4. Hacer clic en "Validate selected task".
  5. Marcar la opción "Yes, is well mapped" y hacer clic en "Submit".
* **Resultados Esperados:**
  * El sistema registra la validación exitosa.
  * El estado visual de la tarea cambia a verde (Validada).

### ID: E2E-003 | Flujo Completo de Administración (Crear Proyecto)
* **Escenario:** Un usuario Administrador crea un nuevo proyecto de mapeo desde cero.
* **Precondiciones:** El usuario debe tener rol `ADMIN`.
* **Pasos de Ejecución:**
  1. Iniciar sesión con cuenta de Administrador.
  2. Navegar al panel de control (`/manage`).
  3. Hacer clic en el botón "Create New Project".
  4. Dibujar un polígono en el mapa (Área de Interés - AOI) usando las herramientas de dibujo.
  5. Hacer clic en "Next" para definir el tamaño de las tareas.
  6. Llenar los metadatos obligatorios (Nombre del proyecto, descripción corta).
  7. Hacer clic en "Save".
* **Resultados Esperados:**
  * El sistema redirige a la página de edición del proyecto.
  * El proyecto queda guardado en la base de datos en estado "Draft" (Borrador).
