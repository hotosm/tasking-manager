# Plan de Pruebas Unitarias (Fase 1)

**Proyecto:** HOT OSM Tasking Manager  
**Fase de Ejecución:** Fase 1 - Pruebas Unitarias Backend  
**Estándar de Referencia:** ISO/IEC/IEEE 29119-3 (Sub-process Test Plan)  

## 1. Propósito y Enfoque del Documento
El presente documento define la estrategia, organización y planificación logística exclusiva para la fase de Pruebas Unitarias del proyecto Tasking Manager. A diferencia de las fases posteriores que evaluarán flujos de usuario, esta etapa inicial se concentra estrictamente en la validación estructural y funcional de los componentes aislados del backend, desarrollado sobre el framework FastAPI. 

En alineación con los lineamientos del Plan General de Pruebas, el esfuerzo primario consiste en delimitar exhaustivamente el alcance de los módulos, identificar las funcionalidades críticas que requieren cobertura y establecer un marco de trabajo coordinado que permita la posterior implementación bajo enfoques de desarrollo guiado por pruebas (TDD) y desarrollo guiado por comportamiento (BDD).

## 2. Alcance Funcional de la Fase Unitaria
El análisis estructural del código fuente ha permitido sectorizar el esfuerzo de aseguramiento de calidad en tres grandes dominios funcionales:

- Seguridad, Usuarios y Servicios de Comunicación, el cual abarca la lógica de autenticación OAuth, el control de acceso basado en roles (RBAC) y los mecanismos de notificación interna. El aseguramiento de este bloque es crítico debido a la sensibilidad de los datos de los mapeadores.

- Servicios Core y la Lógica de Negocio. Este sector representa el núcleo operativo de la plataforma, responsabilizándose por la creación de áreas de interés, la concurrencia en el bloqueo de tareas y la orquestación del ciclo de vida cartográfico.

- Modelos, Objetos de Transferencia de Datos (DTOs) y Validaciones Base, garantizando que las estructuras de datos que interactúan con la base espacial PostGIS posean integridad antes de cualquier transacción de persistencia. La documentación actual se centrará en la delimitación de estas áreas, preparando el terreno para el diseño detallado en iteraciones venideras.

## 3. Organización del Equipo y Asignación de Roles
La gestión de esta fase requiere una distribución técnica precisa de los seis integrantes proyectados para el equipo de Aseguramiento de Calidad. La asignación obedece a las responsabilidades formales definidas en el Plan General, garantizando que el diseño estratégico, el análisis de módulos y la ejecución técnica posean responsables directos.

Actualmente, el **Test Lead** (un integrante) asume la dirección de la fase, gestionando el cronograma general, validando la consistencia documental y supervisando el dominio de Seguridad y Comunicaciones. En paralelo, el rol de **Test Analyst** ha sido asignado a dos integrantes, quienes actualmente se encuentran realizando el análisis estático de los Servicios Core y los DTOs. Su responsabilidad radica en mapear el código existente e identificar las funcionalidades a probar, sin descender al diseño de casos. 

La arquitectura del entorno de pruebas, incluyendo la configuración de *pytest*, la orquestación de *mocks* y la integración de métricas en GitHub Actions, recae sobre un único **Test Architect**. Finalmente, los dos miembros restantes asumirán el rol de **Test Designer** en la siguiente iteración, tomando el análisis previo para redactar las especificaciones formales de entradas, salidas y técnicas de caja negra aplicables.

*(Propósito del diagrama: Visualizar la jerarquía operativa y la dependencia entre los roles técnicos del equipo de QA durante la fase de pruebas unitarias).*

![Flujo de trabajo en equipo](/tests-docs/01-plan-de-pruebas/02-plan-pruebas-unitarias/img/flujo-trabajo-equipo.png) 

## 4. Gestión del Cronograma y Operación mediante GitHub Projects
Para garantizar el cumplimiento de los hitos documentales y de ejecución, se ha determinado que GitHub Projects posee la capacidad técnica necesaria para gobernar el cronograma QA, siempre y cuando abandone su estructura básica y evolucione hacia una herramienta de gestión de ciclo de vida de pruebas. 

### 4.1. Uso de GitHub Projects
El tablero dejará de ser un simple repositorio de tareas aisladas para convertirse en el núcleo de trazabilidad operativa. Para lograrlo, la vista Kanban tradicional se complementará obligatoriamente con una vista de Cronograma (Timeline/Roadmap). Cada tarjeta generada en el tablero representará un módulo o épica de prueba y deberá contar obligatoriamente con los campos personalizados de *Esfuerzo Estimado* (en puntos o días), *Prioridad de Negocio*, *Rol Asignado* y *Milestone* (Iteración).

El flujo de los estados en GitHub Projects reflejará el proceso metodológico estipulado por ISO 29119. Las tareas iniciarán en el *Backlog QA*, transitando hacia la fase de *Análisis Estructural*, donde los Test Analysts delimitarán el alcance del módulo. Posteriormente, las tarjetas avanzarán al estado de *Diseño de Pruebas*, habilitando a los Test Designers para estructurar las condiciones lógicas. Una vez finalizado el diseño, la tarea pasará a *Revisión Documental*, estado en el cual el Test Lead auditará la propuesta mediante Pull Requests. Únicamente tras la aprobación, la tarea alcanzará el estado de *Implementación*, donde el código será desarrollado e integrado.

*(Propósito del diagrama: Estandarizar el flujo de estados de las tarjetas en GitHub Projects, asegurando que el avance del cronograma esté atado a hitos formales de validación documental).*

![Flujo de trabajo en GitHub Projects](/tests-docs/01-plan-de-pruebas/02-plan-pruebas-unitarias/img/flujo-en-github-projects.png) 

## 5. Estrategia de Coordinación y Seguimiento
La coordinación entre los analistas funcionales y la arquitectura técnica se gestionará mediante ciclos de sincronización semanales. Durante estas iteraciones, el objetivo principal será poblar la matriz de trazabilidad con los hallazgos estructurales. La comunicación y el seguimiento del cronograma dependerán enteramente de las fechas de vencimiento configuradas en los *Milestones* de GitHub.

Cualquier desviación en el esfuerzo estimado por parte de los Test Analysts deberá ser documentada en los comentarios del *Issue* correspondiente, permitiendo al Test Lead ajustar la vista de cronograma de manera dinámica sin afectar la ruta crítica del proyecto. La transición formal hacia la fase de diseño de pruebas detalladas solo ocurrirá cuando los tres dominios funcionales hayan sido completamente delimitados y mapeados contra el código fuente existente en el repositorio.
