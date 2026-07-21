# Especificación Técnica: Pruebas de Seguridad
**Proyecto:** HOT OSM Tasking Manager
**Componentes Evaluados:** API REST (FastAPI) y Middleware de Autorización (JWT)

---

## 1. Estrategia y Objetivos de Ejecución

| Vector Analizado | Propósito Técnico | Herramienta Asignada | Justificación de la Selección |
| :--- | :--- | :--- | :--- |
| **SAST (Detección de Secretos)** | Escanear el árbol de commits y archivos de configuración para identificar exposición de tokens, credenciales de base de datos o variables de entorno filtradas. | **Gitleaks** | Procesamiento basado en heurística y expresiones regulares de alta precisión. Rastrea historiales Git completos en segundos sin interrumpir el flujo CI/CD. |
| **DAST (Fuzzing Dinámico)** | Interrogar directamente el API en ejecución (`:5000`) inyectando payloads corruptos y secuencias de escape para forzar fugas de información, OOM o Inyecciones SQL. | **OWASP ZAP** | Intérprete nativo del contrato OpenAPI (`/api/docs`). Despliega automáticamente ataques iterativos sobre todos los endpoints de FastAPI documentados sin necesidad de scripting manual extenso. |
| **Autorización Rota (BOLA)** | Auditar la impermeabilidad del middleware de roles intentando operaciones destructivas (ej. Crear Proyectos) utilizando tokens desprovistos de los claims pertinentes. | **Newman (Postman)** | Iteración programática dinámica. Facilita la inyección e intercambio de la cabecera `Authorization: Bearer <jwt>`, permitiendo simular suplantación de roles a nivel de integración continua. |

## 2. Preparación del Entorno y Precondiciones Críticas

| Requisito | Configuración Técnica y Justificación |
| :--- | :--- |
| **Aislamiento de Red** | El ataque ZAP de tipo *Active Scan* corrompe esquemas y altera metadatos relacionales irreparablemente. El entorno objetivo debe aislarse en una red puente local (`tm-net`) empleando volumen transitorio (`tm_db_data_test`). **Prohibición absoluta** de ejecución contra la BD de staging remoto o producción. |
| **Inhibición de Bloqueos (Rate Limiting)** | Deshabilitar middlewares de limitación de frecuencia volumétrica durante la ejecución DAST. Los limitadores interceptarían al fuzzer reportando falsos negativos, impidiendo evaluar la tolerancia del backend a inyecciones. |
| **Población de Sesiones (Seed)** | Ejecutar `e2e-seed.py` para forzar la inyección inicial de usuarios. Extraer localmente 2 tokens JWT (`e2e_mapper` de bajo privilegio; `e2e_admin` de alto privilegio). Requerido para abrir el análisis ZAP hacia rutas protegidas por autenticación. |

## 3. Escenarios de Prueba: Vectores de Ataque OWASP

| Atributo | Escenario 1: GeoJSON SQL Injection (OWASP A03:2021 - Injection) |
| :--- | :--- |
| **Endpoint Objetivo** | `POST /api/v2/projects/` |
| **Vector de Ataque (Carga Útil)** | `{"type": "FeatureCollection", "features": [{"geometry": {"type": "Polygon", "coordinates": [[[0,0]...]]'; DROP TABLE projects CASCADE;--}}]}` |
| **Justificación Técnica** | GeoAlchemy2 aplica mapeos directos entre cadenas GeoJSON y tipos geométricos binarios de PostGIS. La carencia de validación estricta de tipos de datos de entrada habilita el encadenamiento de comandos SQL destructivos (SQLi) a nivel del driver DBAPI. |
| **Criterio de Validación** | Pydantic intercepta el payload deforme antes del ruteador asíncrono, devolviendo `422 Unprocessable Entity`. La traza no alcanza el *statement compiler* de SQLAlchemy ni genera transacciones nulas en la BD. |

<br>

| Atributo | Escenario 2: Broken Object Level Auth - BOLA (OWASP A01:2021) |
| :--- | :--- |
| **Endpoint Objetivo** | `POST /api/v2/tasks/{id}/validate/` |
| **Vector de Ataque (Carga Útil)** | Ejecución de la solicitud HTTP adjuntando el JWT asignado exclusivamente al rol raso `e2e_mapper`. |
| **Justificación Técnica** | Medir la fiabilidad del decorador de roles y de los *claims* en FastAPI. Si la validación ocurre a nivel de vista (*frontend* React) sin correlato backend, los usuarios base podrían validar sus propias áreas alterando la integridad cartográfica del proyecto. |
| **Criterio de Validación** | El middleware decodifica el JWT, comprueba la ausencia del *claim* necesario (`Validator`) y bloquea inmediatamente el acceso, emitiendo un HTTP `403 Forbidden` limpio. |

<br>

| Atributo | Escenario 3: Exposición de Entornos Debug (OWASP A05:2021) |
| :--- | :--- |
| **Endpoint Objetivo** | Mapeo de Puertos de Contenedores Host (`localhost`). |
| **Vector de Ataque (Carga Útil)** | Escaneo de *binds* mediante `nmap -p 5678,5000 localhost` bajo flag `TARGET_TAG=prod`. |
| **Justificación Técnica** | La imagen Docker despliega *DebugPy* (puerto 5678) habilitando inyección directa en memoria al intérprete de Python. Su filtración en redes expuestas confiere a un atacante capacidades absolutas de RCE (Remote Code Execution) evadiendo todas las reglas API. |
| **Criterio de Validación** | El puerto 5678 responde `closed` o `filtered` al escáner TCP; nula disponibilidad del *socket* fuera del modo `debug`. |

## 4. Procedimiento Técnico de Ejecución

| Etapa | Comando de Ejecución | Justificación de la Fase |
| :--- | :--- | :--- |
| **1. SAST (Análisis de Repositorio)** | `gitleaks detect --source . -v --report-path gl-report.json` | Auditoría retroactiva de todos los *commits* buscando claves API expuestas (Mapbox, Sentry) pre-compilación. |
| **2. ZAP Context Auth** | En OWASP ZAP (GUI): Context -> Authentication -> Inyectar Header `Authorization: Bearer <TOKEN_ADMIN>`. | Confiere autorización nivel Administrador al fuzzer; vital para atravesar `401 Unauthorized` y mapear la superficie de control total. |
| **3. DAST (Active Scan)** | Importar Swagger `/api/docs` -> Iniciar *Active Scan* -> Restringir política a `SQL Injection`, `Command Injection` y `Path Traversal`. | Concentración del *spider* dinámico en forzar vectores de inyección contra todos los parámetros *query/body* del esquema OpenAPI. |
| **4. Validación BOLA** | `newman run bola_collection.json -e jwt_env.json` | Ejecución automatizada del set determinista de violaciones de roles, aislando la lógica de autorización. |

## 5. Criterios de Aceptación Global y Mecanismos de Respuesta

| Métrica de Severidad | Umbral Transaccional (Bloqueo CI/CD) | Directiva de Respuesta y Remediación |
| :--- | :--- | :--- |
| **Vulnerabilidades Graves (CVSS >= 7.0)** | >= 1 hallazgo validado de Inyección SQL, Ejecución Remota o BOLA. | Suspensión obligatoria del *merge* hacia *main*. Recreación empírica y manual del Payload Ofensivo por QA para descartar falsos positivos de ZAP antes de reportar a Ingeniería. |
| **Filtración de Credenciales Clave** | Identificación de *passwords* de PostgreSQL, URLs privadas, o JWT *Secrets* en texto plano. | Emisión de alerta P1: Bloqueo de despliegue, rotación obligatoria de los secretos expuestos y reescritura forzada del historial Git involucrado. |
| **Fuzzing: Stacktraces y Caídas** | El servidor devuelve respuestas HTTP `500` con el volcado completo de la pila (Stacktrace de Python) o el contenedor se detiene (*Crash*). | Las trazas revelan arquitectura interna (paths, nombres de base de datos) a un atacante. FastAPI debe enmascarar excepciones genéricas (`{"detail": "Internal Server Error"}`) bajo perfiles de producción. |
