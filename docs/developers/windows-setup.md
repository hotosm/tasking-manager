# Guía de configuración y ejecución en Windows

Esta guía cubre la configuración del entorno de desarrollo del Tasking Manager en **Windows** de forma nativa (sin Docker), incluyendo la obtención de credenciales OAuth de OpenStreetMap, la configuración del archivo de entorno y la ejecución del frontend y sus pruebas unitarias.

---

## Requisitos previos

Instala las siguientes herramientas antes de comenzar. Todas deben estar disponibles en el `PATH` del sistema.

| Herramienta | Versión mínima | Descarga |
| :-- | :-- | :-- |
| **Node.js** | 18.x LTS | https://nodejs.org/en/download |
| **Yarn** | 1.22.x | `npm install -g yarn` |
| **Git** | 2.x | https://git-scm.com/download/win |
| **Python** | 3.11+ | https://www.python.org/downloads/windows/ |
| **PostgreSQL** | 14+ con PostGIS | https://www.enterprisedb.com/downloads/postgres-postgresql-downloads |

> **Nota:** Durante la instalación de Python en Windows, marca la opción **"Add Python to PATH"** para que esté disponible desde PowerShell.

> **Nota:** Node.js puede gestionarse con [Volta](https://volta.sh/) o [nvm-windows](https://github.com/coreybutler/nvm-windows) para mayor control de versiones. El proyecto incluye configuración de Volta en `package.json`.

---

## 1. Obtener credenciales OAuth 2.0 de OpenStreetMap

El Tasking Manager utiliza OAuth 2.0 con OpenStreetMap para autenticar a los usuarios. Es obligatorio registrar una aplicación en OSM antes de levantar el proyecto.

### 1.1. Crear una cuenta en OpenStreetMap

Si aún no tienes una cuenta, regístrate en: https://www.openstreetmap.org/user/new

### 1.2. Registrar una aplicación OAuth 2.0

1. Inicia sesión en https://www.openstreetmap.org
2. Haz clic en tu nombre de usuario (esquina superior derecha) → **"My Settings"** → **"OAuth 2 Applications"**
3. Haz clic en **"Register new application"**
4. Completa el formulario con los siguientes valores:

   | Campo | Valor para desarrollo local |
   | :-- | :-- |
   | **Name** | `Tasking Manager Dev` (o cualquier nombre) |
   | **Redirect URIs** | `http://127.0.0.1:3000/authorized` |
   | **Confidential application** | ✅ Marcado |
   | **Permissions** | ✅ `read_prefs` — ✅ `write_api` |

   > **Importante:** Usa `127.0.0.1` y NO `localhost`. OSM no acepta `localhost` como URI de redirección válida.

5. Haz clic en **"Register"**
6. Copia y guarda de forma segura:
   - **Client ID**
   - **Client Secret**

   > El Client Secret solo se muestra una vez. Si lo pierdes, deberás regenerarlo.

---

## 2. Clonar el repositorio

Abre **PowerShell** o **Git Bash** y ejecuta:

```powershell
git clone https://github.com/escarabajo-rinoceronte/gestor-tareas-pruebas.git
cd gestor-tareas-pruebas
```

---

## 3. Configurar el archivo de entorno

### 3.1. Copiar el archivo de ejemplo

En PowerShell, desde la raíz del repositorio:

```powershell
Copy-Item example.env tasking-manager.env
```

### 3.2. Editar las variables obligatorias

Abre `tasking-manager.env` con un editor de texto (VS Code, Notepad++, etc.) y actualiza como mínimo las siguientes variables:

```dotenv
# URL base del frontend (NO cambiar en desarrollo local)
TM_APP_BASE_URL=http://127.0.0.1:3000

# URL de la API backend
# Opción A — backend local:
TM_APP_API_URL=http://127.0.0.1:5000/api
# Opción B — servidor de staging de HOT (sin necesidad de backend local):
# TM_APP_API_URL=https://tasking-manager-staging-api.hotosm.org

# Credenciales OAuth 2.0 obtenidas en el paso 1
TM_CLIENT_ID=<tu-client-id-de-osm>
TM_CLIENT_SECRET=<tu-client-secret-de-osm>

# URI de redirección (debe coincidir exactamente con la registrada en OSM)
TM_REDIRECT_URI=http://127.0.0.1:3000/authorized

# Permisos solicitados
TM_SCOPE=read_prefs write_api

# Secreto interno de la aplicación (puede ser cualquier cadena larga aleatoria)
TM_SECRET=alguna-cadena-larga-y-aleatoria-aqui
```

> **Tip para frontend only:** Si solo trabajas en el frontend sin levantar el backend, usa la opción B (`TM_APP_API_URL` apuntando al servidor de staging). Esto permite probar la UI sin necesidad de configurar PostgreSQL ni Python.

---

## 4. Instalar dependencias del frontend

Desde PowerShell, navega al directorio `frontend` e instala las dependencias:

```powershell
cd frontend
yarn install
```

> La instalación puede tardar entre 5 y 10 minutos en la primera ejecución, ya que incluye paquetes pesados como `maplibre-gl`, `@rapideditor/rapid` y `@hotosm/id`.

---

## 5. Levantar el frontend en modo desarrollo

Desde el directorio `frontend`:

```powershell
yarn start
```

Este comando ejecuta en secuencia:

1. `preparation` — genera el archivo `.env` a partir de `tasking-manager.env`
2. `build-sandbox-id` — compila el editor sandbox iD
3. `copy-static` — copia archivos estáticos del editor Rapid
4. `copy-id-static` — copia archivos estáticos del editor iD
5. `patch-rapid` — aplica el parche de imágenes para Rapid
6. `craco start` — inicia el servidor de desarrollo

Una vez compilado, la aplicación estará disponible en:

```
http://127.0.0.1:3000
```

> **Nota:** El primer arranque puede tardar varios minutos. Los arranques posteriores son más rápidos gracias al caché de webpack.

---

## 6. Configurar y levantar el backend (opcional)

Si necesitas el backend completo (no solo el frontend contra staging):

### 6.1. Instalar dependencias de Python

```powershell
pip install --upgrade uv
uv sync
```

### 6.2. Configurar PostgreSQL con PostGIS

Usando `psql` (incluido con la instalación de PostgreSQL):

```sql
CREATE USER tm WITH PASSWORD 'tm';
CREATE DATABASE "tasking-manager" OWNER tm;
\c "tasking-manager"
CREATE EXTENSION postgis;
```

Actualiza en `tasking-manager.env`:

```dotenv
POSTGRES_DB=tasking-manager
POSTGRES_USER=tm
POSTGRES_PASSWORD=tm
POSTGRES_ENDPOINT=localhost
POSTGRES_PORT=5432
```

### 6.3. Aplicar migraciones

```powershell
uv run upgrade
```

### 6.4. Iniciar el servidor de API

```powershell
# Opción 1
uv run start

# Opción 2
uv run flask run --debug --reload
```

La API estará disponible en `http://127.0.0.1:5000` y su documentación Swagger en `http://127.0.0.1:5000/api-docs`.

---

## 7. Ejecutar las pruebas unitarias del frontend

### 7.1. Pruebas en modo interactivo (watch)

```powershell
cd frontend
.\node_modules\.bin\craco test --env=jsdom
```

### 7.2. Pruebas sin modo interactivo (ejecución única)

```powershell
.\node_modules\.bin\craco test --env=jsdom --watchAll=false
```

### 7.3. Pruebas con reporte de cobertura

```powershell
.\node_modules\.bin\craco test --env=jsdom --watchAll=false --coverage --coverageReporters=text --coverageReporters=json-summary
```

El reporte de cobertura en HTML se genera en `frontend/coverage/index.html`.

> **Nota importante en Windows:** El script `yarn test` definido en `package.json` ejecuta `eslint` antes de los tests. Si `eslint` no está instalado globalmente o los `node_modules` aún no están listos, usa directamente `.\node_modules\.bin\craco test` como se muestra arriba para omitir el paso de lint.

### 7.4. Ejecutar una suite específica

```powershell
.\node_modules\.bin\craco test --env=jsdom --watchAll=false --testPathPattern="nombre-del-archivo"
```

Ejemplo:

```powershell
.\node_modules\.bin\craco test --env=jsdom --watchAll=false --testPathPattern="UseTimeDiff"
```

### 7.5. Depurar fallos de timeout

Si una suite falla por timeout (error `Exceeded timeout of 5000 ms`), ejecuta en modo de un solo hilo para reducir la carga de memoria:

```powershell
.\node_modules\.bin\craco test --env=jsdom --watchAll=false --runInBand --testPathPattern="nombre-del-archivo"
```

---

## 8. Problemas comunes en Windows

### Error: `eslint no se reconoce como un comando`

El script `yarn test` llama a `npm run lint` que requiere `eslint` instalado. Usa directamente `craco test` desde `node_modules\.bin\` como se describe en la sección 7.

### Error: `.\node_modules\.bin\craco no se reconoce`

Las dependencias no están instaladas. Ejecuta `yarn install` en el directorio `frontend` primero.

### Error: `ENOENT` al copiar archivos estáticos (`copy-static`, `copy-id-static`)

Los scripts de copia usan comandos `bash`. En Windows nativo (sin Git Bash o WSL), estos comandos no funcionan. Opciones:

- Usar **Git Bash** como terminal en lugar de PowerShell.
- Usar **WSL 2** (Windows Subsystem for Linux).
- Ejecutar directamente `craco start` o `craco test` sin los scripts de preparación (solo para tests, no para levantar el servidor de desarrollo completo).

### Error: `TM_APP_BASE_URL` o `TM_CLIENT_ID` no definidos

El archivo `tasking-manager.env` no existe o no tiene las variables configuradas. Verifica que copiaste `example.env` a `tasking-manager.env` y que las variables críticas están correctamente asignadas (ver sección 3.2).

### Error de autenticación OSM: `redirect_uri mismatch`

La URI de redirección configurada en `tasking-manager.env` no coincide exactamente con la registrada en la aplicación OAuth de OSM. Verifica que ambas sean `http://127.0.0.1:3000/authorized` (sin barra final, sin `localhost`).

---

## 9. Resumen de comandos rápidos (Quick Reference)

```powershell
# Clonar e instalar
git clone <url-del-repo> && cd gestor-tareas-pruebas
Copy-Item example.env tasking-manager.env
# (editar tasking-manager.env con credenciales OSM)
cd frontend && yarn install

# Levantar el frontend
yarn start   # (desde Git Bash)
# o directamente desde PowerShell:
.\node_modules\.bin\craco start

# Ejecutar todos los tests unitarios
.\node_modules\.bin\craco test --env=jsdom --watchAll=false

# Ejecutar tests con cobertura
.\node_modules\.bin\craco test --env=jsdom --watchAll=false --coverage

# Levantar el backend (si es necesario)
cd .. && uv sync && uv run start
```
