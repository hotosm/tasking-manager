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