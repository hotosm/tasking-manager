# Ejecución del Proyecto

Este manual técnico explica paso a paso cómo clonar, configurar y levantar el entorno estandarizado del proyecto utilizando Docker de manera limpia, segura y sin conflictos.

---

## 1. Requisitos Previos

Asegúrate de contar con las siguientes herramientas instaladas y activas en tu equipo antes de iniciar:

- **Docker Desktop** (con Docker Compose v2+ habilitado).
---

## 2. Clonar el Proyecto

Abre una terminal en tu computadora, clona el repositorio e ingresa a la carpeta raíz del proyecto:

```bash
git clone <https://github.com/escarabajo-rinoceronte/gestor-tareas-pruebas.git>
cd gestor-tareas-pruebas
```

---

## 3. Configurar Variables de Entorno

El sistema requiere leer las configuraciones locales desde archivos de entorno específicos. El repositorio incluye una plantilla base preconfigurada llamada `example.env`.

Ejecuta el comando correspondiente a tu sistema operativo para generar las copias requeridas:

**En Linux / macOS / Git Bash:**
```bash
cp example.env tasking-manager.env
cp example.env .env
```

**En Windows (Símbolo del sistema / CMD):**
```dos
copy example.env tasking-manager.env
copy example.env .env
```

**En Windows (PowerShell):**
```powershell
Copy-Item example.env tasking-manager.env
Copy-Item example.env .env
```
---

## 4. Levantar el Entorno

Para construir las imágenes del proyecto desde cero (omitiendo la caché para asegurar que se use el código más reciente) y levantar todos los servicios en segundo plano, ejecuta:

```bash
# 1. Construir las imágenes del sistema
docker compose build --no-cache

# 2. Levantar todos los servicios en segundo plano
docker compose up -d
```

---

## 5. Verificar Estado Operativo

Para validar que el entorno estandarizado se ha montado correctamente y comprobar la salud de los contenedores, ejecuta el siguiente comando:

```bash
docker compose ps
```
---

## 6. Acceso al Sistema


- **Portal Web (Frontend):** http://127.0.0.1:3000
- **Documentación de la API (Backend):** http://127.0.0.1:3000/api/docs
---

## 7. Detener el Sistema

Cuando termines tus pruebas de software, puedes apagar y remover los contenedores de forma segura:

```bash
docker compose down
```
