# Procedimiento de Ejecución — Flujo de Mapeo (Backend Real)

## 1. Identificación

- **Identificador del procedimiento**: TP-E2E-MAP-001
- **Nombre**: Ejecución del flujo de mapeo contra backend real
- **Caso de prueba asociado**: TC-E2E-MAP-001
- **Fecha**: 2026-07-15
- **Responsable**: JhonAQ

## 2. Propósito

Describir los pasos manuales y automáticos necesarios para ejecutar el caso de prueba TC-E2E-MAP-001 contra el backend real de HOT Tasking Manager.

## 3. Requisitos previos

### 3.1 Software instalado

- Docker Engine / Docker Desktop
- Docker Compose
- Node.js y Yarn
- Navegador Chromium (gestionado por Playwright)

### 3.2 Repositorio configurado

- Rama de trabajo actualizada.
- Dependencias del frontend instaladas (`cd frontend && yarn install`).

### 3.3 Variables de entorno

- `tasking-manager.env` creado a partir de `example.env` con valores locales.
- `TM_SECRET` definido y conocido (usado por el seed para firmar tokens).

## 4. Preparación del ambiente

### 4.1 Levantar backend y base de datos

Ejecutar desde la raíz del repositorio:

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  up -d tm-db tm-migration tm-backend
```

Esperar a que los contenedores estén saludables:

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  ps
```

El backend debe responder en:

```bash
curl http://127.0.0.1:5000/api/docs
```

### 4.2 Sembrar datos de prueba

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  exec tm-backend python scripts/e2e-seed.py
```

Esto genera `frontend/e2e/.e2e-seed.json` con:

- IDs y tokens de `e2e_mapper`, `e2e_validator` y `e2e_admin`.
- ID y nombre del proyecto `E2E Mapping Project`.

Verificar que el archivo fue creado:

```bash
cat frontend/e2e/.e2e-seed.json
```

## 5. Ejecución de la prueba

### 5.1 Ejecutar el caso de prueba

```bash
cd frontend
E2E_BACKEND=real yarn test:e2e --grep "Flujo de Mapeo"
```

### 5.2 Ejecutar con interfaz gráfica (opcional, para depuración)

```bash
cd frontend
E2E_BACKEND=real yarn test:e2e --grep "Flujo de Mapeo" --headed
```

### 5.3 Ejecutar todos los flujos E2E con backend real

```bash
cd frontend
E2E_BACKEND=real yarn test:e2e
```

## 6. Recolección de evidencias

Playwright genera automáticamente:

- Video de la ejecución en `frontend/test-results/`.
- Capturas de pantalla en caso de fallo.
- Trazas (`trace`) en el primer reintento.

## 7. Limpieza

Para detener el entorno E2E:

```bash
docker compose --env-file tasking-manager.env \
  -f docker-compose.yml -f docker-compose.e2e.yml \
  down
```

Para re-seedear y repetir la prueba, ejecutar nuevamente el paso 4.2.

## 8. Solución de problemas

| Síntoma | Posible causa | Solución |
|---|---|---|
| El backend no responde en `:5000` | Los workers de uvicorn aún están iniciando | Esperar 30-60 segundos y reintentar. |
| El seed falla por proyecto existente | Datos previos sin limpiar | El seed es idempotente; reintentar normalmente. |
| Aparece popup "Update your email" | El usuario no tiene email verificado | Re-ejecutar el seed (actualiza email). |
| La tarjeta del proyecto no aparece | `TM_APP_API_URL` apunta al puerto equivocado | Verificar `E2E_BACKEND=real` en Playwright. |
| El editor iD no carga | Problema de red o assets estáticos | Aumentar timeout o verificar consola del navegador. |
