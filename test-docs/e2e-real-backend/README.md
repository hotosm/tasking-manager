# Pruebas E2E contra Backend Real

Esta sección documenta las pruebas End-to-End (E2E) ejecutadas contra una instancia real del backend de HOT Tasking Manager. El objetivo es validar flujos críticos de usuario (mapeo, validación y administración) utilizando el stack completo: frontend React, backend FastAPI, base de datos PostgreSQL/PostGIS y autenticación de sesión.

## Alcance

- **Frontend**: aplicación React levantada con `craco start` en `http://127.0.0.1:3000`.
- **Backend**: API FastAPI/SQLAlchemy ejecutándose en Docker en `http://127.0.0.1:5000`.
- **Base de datos**: PostgreSQL/PostGIS en Docker, expuesta en `127.0.0.1:5434`.
- **Herramienta de prueba**: Playwright Test.

## Flujos en el alcance

| ID | Flujo | Estado |
|---|---|---|
| TC-E2E-MAP-001 | Mapeo: login → explorar proyecto → seleccionar tarea READY → abrir editor iD | Documentado y ejecutado |
| TC-E2E-VAL-001 | Validación: login como validador → abrir tarea MAPPED → validar/rechazar | Pendiente |
| TC-E2E-ADM-001 | Administrador: login como admin → crear proyecto → publicar | Pendiente |

## Entorno de ejecución

El backend y la base de datos se levantan mediante Docker Compose con un archivo de override exclusivo para E2E:

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  up -d tm-db tm-migration tm-backend
```

Antes de ejecutar los tests se debe sembrar la base de datos con usuarios, organización y proyecto de prueba:

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  exec tm-backend python scripts/e2e-seed.py
```

El seed genera un archivo `frontend/e2e/.e2e-seed.json` con los identificadores y tokens de sesión que consumen las pruebas.

## Consideraciones de autenticación

Las pruebas utilizan tokens de sesión firmados localmente para usuarios sembrados en la base de datos. Esto evita depender del flujo OAuth2 real de OpenStreetMap durante la ejecución automatizada, manteniendo el foco en la integración frontend-backend.

## Documentación por flujo

- [Diseño: Flujo de Mapeo](./test-design/mapping-flow-design.md)
- [Casos de prueba: Flujo de Mapeo](./test-cases/mapping-flow-cases.md)
- [Procedimiento: Flujo de Mapeo](./test-procedures/mapping-flow-procedure.md)
- [Reporte de ejecución: Flujo de Mapeo](./test-reports/mapping-flow-report.md)
