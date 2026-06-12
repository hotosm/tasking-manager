# Plan de Pruebas Funcionales (Caja Negra)

**Proyecto:** HOT OSM Tasking Manager  
**Equipo de Pruebas:** Escarabajo Rinoceronte  
**Estándar de Referencia:** ISO/IEC/IEEE 29119-3:2013 (Sub-process Test Plan)  
**Tipo de documento:** Plan de Pruebas Funcionales (Conceptual)  

---

## 1. Introducción

### 1.1. Propósito y Enfoque del Documento
El presente documento define el Plan de Pruebas Funcionales de Caja Negra para el proyecto Tasking Manager. El objetivo primordial es estructurar la validación del sistema centrándose exclusivamente en el comportamiento observable de la interfaz gráfica de usuario (UI), asegurando que las funcionalidades operen de acuerdo con las expectativas y necesidades operativas de los usuarios finales (Mapeadores y Validadores).

### 1.2. Declaración de Ingeniería Inversa de Requisitos (Importante)
Dado que el repositorio original de código abierto **HOT OSM Tasking Manager** no cuenta con una especificación formal de requisitos de software (SRS) o un documento de requerimientos funcionales explícitos en su código base, **el equipo de Aseguramiento de la Calidad (QA) ha generado y formalizado de manera analítica los requerimientos funcionales a propio criterio y mediante ingeniería inversa** (documentados en `02-diseno-de-pruebas/funcionales/01-requerimientos-funcionales.md`). Esta especificación deducida actúa como la línea base funcional oficial para el diseño y ejecución de todos los escenarios de Caja Negra.

---

## 2. Alcance del Testing Funcional

### Dentro del Alcance (In-Scope):
*   Validación de la interfaz de usuario (React) interactuando con los endpoints de la API.
*   Pruebas manuales de Caja Negra sobre los flujos de administración de proyectos, mapeo y bloqueo de tareas.
*   Verificación de restricciones lógicas, control de acceso basado en roles (RBAC) y validación de formularios.

### Fuera del Alcance (Out-of-Scope):
*   Pruebas de la arquitectura interna de código, análisis estático y cobertura lógica (cubiertos en el Plan Unitario).
*   Pruebas de rendimiento, escalabilidad o respuesta ante cargas concurrentes extremas en el servidor local.

---

## 3. Estrategia de Pruebas de Caja Negra

Para garantizar la cobertura del comportamiento del sistema, los Test Designers aplicarán las siguientes técnicas estipuladas por la norma **ISO/IEC/IEEE 29119-4**:

### 3.1. Partición de Equivalencia (PE)
Se dividirá el dominio de los datos de entrada en clases válidas e inválidas para minimizar la cantidad de casos necesarios manteniendo una cobertura exhaustiva (ejemplo: validar la carga de polígonos GeoJSON correctos vs. formatos de archivos no permitidos).

### 3.2. Análisis de Valores Límite (AVL)
Verificación de los extremos numéricos y de longitud en campos restrictivos del sistema (ejemplo: probar nombres de proyectos vacíos, con un solo carácter o que excedan el límite de 100 caracteres).

### 3.3. Tablas de Decisión (TD)
Modelado de combinaciones lógicas de permisos y roles del sistema para evaluar flujos restrictivos de seguridad (ejemplo: validar que un mapper común no pueda aprobar tareas o que un usuario no pueda auto-validarse).

### 3.4. Transición de Estados (TE)
Validación del ciclo de vida transaccional del mapa, asegurando que las tareas sigan la secuencia de estados permitidos de la base PostGIS (`READY`, `LOCKED`, `MAPPED`, `VALIDATED`).

---

## 4. Criterios de Entrada y Salida

### 4.1. Criterios de Entrada (Fase de Ejecución)
*   Disponer del entorno de pruebas unificado (QA local) desplegado de forma estable con Docker Compose.
*   Contar con el documento de especificación de requerimientos de QA y el diseño de casos de prueba finalizado y aprobado por el Test Lead en la Wiki.
*   Base de datos inicializada con usuarios de prueba y roles configurados.

### 4.2. Criterios de Salida
*   Haber ejecutado el 100% de los casos de prueba diseñados para los módulos seleccionados.
*   Alcanzar una tasa de éxito de pruebas funcionales aprobadas igual o superior al **95%**.
*   No contar con defectos de prioridad Crítica o Alta sin corregir o sin mitigar.

---

## 5. Entregables de la Fase Funcional
*   **Plan de Pruebas Funcionales:** El presente documento estratégico.
*   **Diseño de Casos de Prueba Funcionales:** Especificación detallada de entradas, pasos y resultados esperados.
*   **Informe de Ejecución de Pruebas Funcionales:** Registro de la ejecución manual en el entorno de QA, detallando éxitos, fallos identificados y adjuntando las capturas de pantalla de la interfaz como evidencias físicas.
