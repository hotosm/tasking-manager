# Guía de Configuración del Entorno de Desarrollo Local

## 1. Requisitos Previos del Sistema

Antes de comenzar, asegúrese de tener instaladas las siguientes herramientas. Los nombres de los paquetes pueden variar según su distribución:

*   **Git:** Para el control de versiones.
*   **Docker:** Motor de contenedores (v20.10+).
*   **Docker Compose:** Orquestador (v2.0+, preferiblemente el plugin nativo de Docker).

### Instalación de dependencias

#### **Arch Linux**
```bash
sudo pacman -S git docker docker-compose
```

#### **Debian / Ubuntu**
```bash
sudo apt update
sudo apt install git docker.io docker-compose-v2
```

#### **Fedora**
```bash
sudo dnf install git moby-engine docker-compose-plugin
```

> [!NOTE]
> Asegúrese de que su usuario tenga permisos para ejecutar Docker sin `sudo`. En la mayoría de las distros:
> `sudo usermod -aG docker $USER` (requiere cerrar y abrir sesión).

---

## 2. Configuración Inicial del Proyecto

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/hotosm/tasking-manager.git
    cd tasking-manager
    ```

2.  **Preparar las Variables de Entorno:**
    El sistema se configura mediante un archivo `.env`. Copie el archivo de ejemplo proporcionado:
    ```bash
    cp tasking-manager.env.txt tasking-manager.env
    ```

---

## 3. Configuración de Autenticación (Paso Crítico)

Tasking Manager utiliza **OpenStreetMap (OSM)** para el inicio de sesión. Sin esto, no podrá acceder a las funciones de administración.

1.  Inicie sesión en [OpenStreetMap.org](https://www.openstreetmap.org).
2.  Vaya a **My Settings -> OAuth 2 applications -> Register new application**.
3.  Configure los siguientes campos:
    *   **Name:** TM Local Dev
    *   **Redirect URI:** `http://127.0.0.1:3000/authorized` (Debe ser exactamente así).
    *   **Permissions:** `read_prefs` y `write_api`.
4.  Copie el `Client ID` y el `Client Secret` en su archivo `tasking-manager.env`:
    ```env
    TM_CLIENT_ID=su_client_id_aqui
    TM_CLIENT_SECRET=su_client_secret_aqui
    ```

---

## 4. Ejecución con Docker Compose

El proyecto utiliza un flujo de construcción multi-etapa. Para desarrollo, utilizaremos el target `debug` que permite recarga en vivo (hot-reload).

1.  **Construir las imágenes:**
    ```bash
    docker compose build
    ```

2.  **Levantar los servicios:**
    ```bash
    docker compose up -d
    ```

### ¿Qué sucede durante este proceso?
*   `tm-db`: Levanta una instancia de PostGIS.
*   `tm-migration`: Ejecuta automáticamente las migraciones de Alembic para crear las tablas.
*   `tm-backend`: Inicia la API en Python (FastAPI/Flask) en modo debug.
*   `tm-frontend`: Inicia el servidor de desarrollo de React.
*   `traefik`: Actúa como proxy inverso en el puerto 3000.

---

## 5. Validación del Entorno

Verifique que los servicios estén respondiendo correctamente:

*   **Frontend:** Acceda a `http://127.0.0.1:3000`. Debería ver la interfaz principal.
*   **Backend (API):** Acceda a `http://127.0.0.1:3000/api/docs`. Verificará la documentación Swagger.
*   **Base de Datos:** El backend indicará en los logs si la conexión fue exitosa.

---

## 6. Comandos de Inspección y Depuración

Esta sección es esencial para diagnosticar problemas durante el desarrollo.

### A. Contenedor del Backend (`tm-backend`)
El backend es el motor de lógica y conexión a base de datos.

*   **Ver logs en tiempo real:**
    ```bash
    docker compose logs -f tm-backend
    ```
*   **Acceder a la terminal interna:**
    ```bash
    docker exec -it tm-backend bash
    ```
*   **Verificar variables de entorno cargadas:**
    ```bash
    docker exec tm-backend env | grep TM_
    ```
*   **Revisar procesos de Python activos:**
    ```bash
    docker exec tm-backend ps aux | grep python
    ```

### B. Contenedor del Frontend (`tm-frontend`)
Contenedor basado en Node.js para la interfaz React.

*   **Ver errores de compilación:**
    ```bash
    docker compose logs -f tm-frontend
    ```
*   **Reiniciar solo el frontend:**
    ```bash
    docker compose restart tm-frontend
    ```

### C. Contenedor de Base de Datos (`tm-db`)
Instancia de PostgreSQL + PostGIS.

*   **Acceder a la consola de PostgreSQL (psql):**
    ```bash
    docker exec -it tm-db psql -U tm -d tasking-manager
    ```
*   **Listar tablas para verificar migraciones:**
    ```sql
    -- Dentro de psql
    \dt
    ```
*   **Verificar logs de consultas y errores:**
    ```bash
    docker compose logs -f tm-db
    ```

### D. Comandos Globales Útiles
*   **Ver estado de salud de todos los servicios:**
    ```bash
    docker compose ps
    ```
*   **Limpiar el entorno completamente (borra datos de DB):**
    ```bash
    docker compose down -v
    ```

---

## 7. Solución de Problemas Comunes

1.  **Error de Conexión a la DB:** Si el backend falla al iniciar, verifique que `tm-migration` haya terminado exitosamente. A veces la DB tarda más en estar lista; Docker Compose tiene un `healthcheck` configurado para mitigar esto.
2.  **Error de OAuth/Login:** Verifique que el `TM_APP_BASE_URL` en el archivo `.env` coincida exactamente con la URL que usa en el navegador (usualmente `http://127.0.0.1:3000`).
3.  **Puertos ocupados:** Si el puerto 3000 está en uso por otra aplicación, cámbielo en el archivo `.env` mediante la variable `TM_DEV_PORT`.
