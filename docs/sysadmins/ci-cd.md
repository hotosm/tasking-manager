# CI/CD

Utilizamos CircleCI para gestionar la Integración Continua (Continuous Integration) y el Despliegue Continuo (Continuous Deployment).

| **Entorno** | **Rama (Branch)** |
| :--- | :--- |
| Production | deployment/hot-tasking-manager |
| Production-frontend | deployment/hot-tasking-manager-frontend |
| Staging | develop |
| TeachOSM | deployment/teachosm-tasking-manager |
| Indonesia | deployment/id-tasking-manager |

Cada entorno tiene su propio conjunto de variables de entorno que se almacenan como secretos en la configuración de la organización de CircleCI bajo la sección Contexts (Contextos). Por el momento, estas variables son únicamente para las compilaciones (builds) del frontend. Consulta la [documentación de despliegue](deployment.md) para actualizar las variables del backend.

- OPSGENIE_API
- TM_APP_API_URL
- TM_APP_API_VERSION
- TM_APP_BASE_URL
- TM_CONSUMER_KEY
- TM_CONSUMER_SECRET
- TM_ENABLE_SERVICEWORKER
- TM_MAPBOX_TOKEN
- TM_MATOMO_ENDPOINT
- TM_MATOMO_ID
- TM_ORG_CODE
- TM_ORG_NAME
- TM_ORG_PRIVACY_POLICY_URL
- TM_ORG_URL
- TM_SERVICE_DESK

## Pruebas Automatizadas

Para cada Pull Request y rama, la CI ejecuta un conjunto de pruebas tanto para el frontend como para el backend. Disponemos de un contexto llamado "tasking-manager-testing" para configurar la base de datos con las siguientes variables de entorno:

- POSTGRES_DB
- POSTGRES_ENDPOINT
- POSTGRES_USER
- TM_ORG_CODE
- TM_ORG_NAME

Ten en cuenta que la variable `POSTGRES_DB` debe corresponder a la base de datos por defecto (en nuestro caso `tm`). El script de pruebas creará una base de datos llamada `test_$POSTGRES_DB` durante la configuración. Las variables `TM_ORG_*` son obligatorias para que ciertas pruebas se ejecuten con éxito; de manera más notable `test_variable_replacing` en el `TestTemplateService`.

## Actualización de la Caché de CircleCI

La CI almacena la carpeta `node_modules` del frontend para ahorrar tiempo en las compilaciones. A veces será necesario forzar a que todas las compilaciones utilicen una instalación limpia, por lo que la caché tendrá que actualizarse manualmente.

En la configuración de CircleCI del Tasking Manager existe una variable de entorno llamada "CACHEVERSION". Establece este valor en `v{n}`, donde `{n}` es un número entero que se incrementa en 1 cada vez que desees limpiar la caché.