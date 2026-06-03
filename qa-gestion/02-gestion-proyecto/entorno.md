# Entorno de Pruebas - Versiones y Configuración Estandarizada

Este documento describe con exactitud la arquitectura, las versiones de software verificadas y las especificaciones técnicas del entorno estandarizado mediante Docker Compose para el proyecto **Tasking Manager**. Su objetivo es garantizar la reproducibilidad absoluta del sistema durante las pruebas de software.

---

## Contenedores y Versiones 

### Backend (`tm-backend`)
- **Versión de Python:** `Python 3.10.20`
- **Framework & Servidor:** FastAPI / Uvicorn.
- **Gestor de Migraciones:** `Alembic 1.11.1`.
- **Límites de Recursos de Máquina:** Máximo **1 CPU** y **1500 MB** de memoria RAM (con una reserva mínima garantizada de 100 MB).

### Frontend (`tm-frontend`)
- **Servidor Web de Producción:** `Nginx 1.31.1`.

### Base de Datos (`tm-db`)
- **Versión del Motor:** `PostgreSQL 14.9`.
- **Extensión Espacial:** `PostGIS 3.3.4`.

### Proxy (`traefik`)
- **Versión del Core:** `Version 3.6.1 (Codename: ramequin, Go version: go1.24.10)`

---

## Variables de Entorno Clave (Inyectadas localmente)
Definidas de manera global en el archivo aislado `tasking-manager.env`:
* **POSTGRES_DB:** `tasking-manager`
* **POSTGRES_USER:** `tm`
* **POSTGRES_PASSWORD:** `tm`
* **POSTGRES_TEST_DB:** `taskingmanagertest`

---

