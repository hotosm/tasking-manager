# Documentación de Pruebas

Este directorio agrupa la documentación de pruebas del proyecto, organizada según los lineamientos de los estándares **IEEE 829** e **ISO/IEC/IEEE 29119**. El objetivo es mantener un registro claro del diseño, ejecución y resultados de las pruebas, facilitando la trazabilidad y reproducibilidad.

## Estructura

```
test-docs/
├── README.md                         # Este archivo
├── e2e-real-backend/                 # Pruebas E2E contra el backend real
│   ├── README.md                     # Contexto general del entorno E2E real
│   ├── test-plan.md                  # Plan de pruebas E2E contra backend real
│   ├── test-design/                  # Especificaciones de diseño de pruebas
│   ├── test-cases/                   # Especificaciones de casos de prueba
│   ├── test-procedures/              # Procedimientos de ejecución
│   └── test-reports/                 # Reportes de ejecución y resultados
```

## Convenciones

- Cada flujo E2E tiene su propio conjunto de documentos bajo las carpetas `test-design/`, `test-cases/`, `test-procedures/` y `test-reports/`.
- Los identificadores de prueba siguen el formato `TC-E2E-<FLUJO>-<NNN>`.
- Las pruebas contra backend real se distinguen explícitamente de las pruebas con API mockeada.

## Flujos documentados

1. [Flujo de Mapeo](./e2e-real-backend/README.md) (mapping flow) — backend real.
2. Flujo de Validación — pendiente.
3. Flujo de Administrador / Crear Proyecto — pendiente.
