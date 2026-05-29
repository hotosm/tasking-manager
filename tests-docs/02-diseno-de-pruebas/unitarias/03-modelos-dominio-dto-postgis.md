# Especificación de Pruebas Unitarias: Modelos de Dominio, Entidades PostGIS y DTOs
# 1. Base de Pruebas (Test Basis)

La presente suite de pruebas unitarias cubre las validaciones funcionales, reglas de integridad, restricciones estructurales y comportamiento geográfico asociados a los modelos de dominio, entidades PostGIS y objetos de transferencia de datos (DTOs) dentro de la arquitectura backend del sistema.

El alcance funcional comprende la verificación transversal de la consistencia de los datos en el almacenamiento relacional y espacial, el control de mutaciones en campos críticos y el correcto mapeo estructural en el intercambio de información.

## 1.1 Directorios y componentes relacionados al dominio

### Entidades de Dominio y Datos Geográficos (PostGIS)

Componentes del modelo de datos encargados de la persistencia base, definición de relaciones, restricciones de integridad relacional y comportamiento geométrico o espacial en el almacenamiento.

* `backend/models/postgis/`

---

### Objetos de Transferencia de Datos (DTOs) y Esquemas

Componentes encargados de la definición de estructuras, tipado fuerte, serialización/deserialización y reglas de validación de los payloads que viajan hacia y desde los puntos de acceso del sistema.

* `backend/models/dtos/`

---

### Reglas de Validación y Restricciones del Modelo

Lógica interna acoplada a las entidades del sistema encargada de restringir de manera autónoma los estados prohibidos, ciclos de vida de los registros y consistencia de los perfiles y recursos.

---
## 1.2 Suites de pruebas unitarias relacionadas

| Suite de prueba | Dominio funcional | Descripción |
| :--- | :--- | :--- |
| `test_user.py` | Gestión de Usuarios | Valida la persistencia, restricciones de unicidad, mutación segura de campos críticos del perfil (como identificadores y enlaces de avatar) y consistencia en consultas paginadas tanto en entornos síncronos como asíncronos. |
| `test_project.py` | Gestión de Proyectos | Valida la creación, relaciones base con usuarios y la integridad de los datos descriptivos y espaciales/geográficos vinculados a los proyectos de mapeo en el sistema. |
| `test_project_info.py` | Información de Proyectos | Valida la consistencia, traducción, almacenamiento y recuperación de metadatos, descripciones y especificaciones detalladas asociadas a los proyectos. |
| `test_task.py` | Gestión de Tareas | Valida el ciclo de vida de las tareas, control de estados permitidos (mapeado, validado, etc.), restricciones transaccionales y consistencia espacial de las geometrías de las tareas. |
| `test_message.py` | Mensajería y Alertas | Valida la estructura de almacenamiento, persistencia de notificaciones e integridad relacional de los mensajes enviados entre colaboradores y el sistema. |
| `test_organisation.py` | Organizaciones | Valida la persistencia de entidades organizacionales, restricciones de nombres, almacenamiento de imágenes/logos y la correcta vinculación relacional con proyectos y usuarios. |
| `test_banner.py` | Componentes de Difusión | Valida el almacenamiento, vigencia, estados de visibilidad y consistencia de los banners informativos o alertas globales del sistema. |
| `test_custom_editor.py` | Editores Personalizados | Valida la configuración, persistencia y estructuras de datos que definen los editores de mapas personalizados permitidos para los colaboradores. |
| `test_mapping_dto.py` | Validación de Datos (DTO) | Valida la estructura, tipado fuerte, restricciones de entrada y mapeo de datos orientados a los flujos y estados del proceso de mapeo. |
| `test_project_dto.py` | Validación de Datos (DTO) | Valida las reglas de serialización, deserialización y esquemas de validación estructural para la creación y actualización de la información de proyectos. |

### Directorios de pruebas relacionados

#### API (Entorno Moderno / Asíncrono)

* `tests/api/unit/models/postgis/`

#### Backend (Entorno Legado / Síncrono y DTOs)

* `tests/backend/unit/models/dtos/`
* `tests/backend/unit/models/postgis/`

---

## 1.3 Dependencias controladas o simuladas

| Dependencia | Tipo | Objetivo |
| :--- | :--- | :--- |
| Motor de Base de Datos | Componente de datos | Validar la persistencia e integridad relacional/espacial real bajo aislamiento controlado, garantizando la reversión completa (`force_rollback=True`) de transacciones en cada ciclo de prueba (`db_connection_fixture`). |
| APIs y Plataformas Externas | Servicios externos | Simular respuestas, flujos de autenticación e intercambio de perfiles remotos (como OpenStreetMap) para verificar la resiliencia y la capacidad de transformación de los modelos ante datos externos. |
| Servicios de Red y Multimedia | Servicios de red | Interceptar y simular peticiones de verificación de recursos remotos (como URLs de avatares u organización) para validar formatos permitidos sin requerir conectividad activa a internet. |

---

## 1.4 Cobertura de objetivos del proyecto

### Épicas y Objetos de Negocio Asociados
* Gestión del ciclo de vida y persistencia de datos de colaboradores, proyectos, tareas y configuraciones del sistema.
* Integridad, consistencia relacional y almacenamiento seguro de información descriptiva y geográfica (PostGIS).

### Requisitos funcionales validados
* Restricciones de integridad a nivel de datos (control de mutación de roles, flujos de estados de tareas y reglas de unicidad).
* Estructuras de intercambio de información robustas mediante DTOs para motores de búsqueda, filtros avanzados y paginación integrada.