# Ejecución de Casos de Prueba del MOD-02: Exploración de Proyectos

## 1. ESC-2001: Motor de Búsqueda y Combinación de Filtros Avanzados

### 1.1. Ejecución de CP-2001-01

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-2001-01** | Verificar el estado inicial de la pantalla sin interactuar con los desplegables (sin filtros activos). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz carga por defecto el catálogo completo de proyectos disponibles en el sistema (`CS-3 = V`). | La pantalla principal de exploración cargó de manera correcta e instantánea la totalidad de las tarjetas de proyectos activos y archivados disponibles en la base de datos. |

| Evidencia |
| :-- |
| Catálogo Inicial Completo por Defecto<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-02-ejecucion-exploracion-proyectos/CP-2001-01-catalogo-defecto.png" width="800px" alt="CP-2001-01 - Catálogo completo sin filtros"></a><br>Captura de la pantalla "Explore Projects" mostrando el listado general de proyectos en su estado inicial. |

---

### 1.2. Ejecución de CP-2001-02

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-2001-02** | Validar que la pantalla se actualice asíncronamente mostrando únicamente las tarjetas de proyectos cuyo estado sea "Activo". | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La pantalla se actualiza asíncronamente mostrando únicamente las tarjetas de proyectos cuyo estado sea "Activo" (`CS-1 = V`). | Al seleccionar el filtro de estado en 'Activo', la grilla de proyectos se refrescó mediante una petición asíncrona, ocultando los archivados y listando solo los vigentes. |

| Evidencia |
| :-- |
| Grilla Filtrada por Estado Activo<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-02-ejecucion-exploracion-proyectos/CP-2001-02-filtro-activo.png" width="800px" alt="CP-2001-02 - Listado filtrado por proyectos activos"></a><br>Vista de la UI mostrando únicamente las tarjetas que cumplen con la etiqueta de estado 'Activo'. |

---

### 1.3. Ejecución de CP-2001-03

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-2001-03** | Validar la reducción de elementos mostrando solo proyectos que sean "Activos" y para mappers "Easy" en simultáneo. | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La lista reduce sus elementos, mostrando solo los proyectos que son "Activos" y que simultáneamente aceptan mappers "Easy" (`CS-1 = V`). | La interfaz procesó la intersección lógica de ambos controles de selección, reduciendo la lista visible exclusivamente a proyectos vigentes de dificultad baja (Easy). |

| Evidencia |
| :-- |
| Intersección de Filtros Estado y Dificultad<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-02-ejecucion-exploracion-proyectos/CP-2001-03-filtro-combinado.png" width="800px" alt="CP-2001-03 - Filtros de Activo y Easy activos"></a><br>Captura de la interfaz de usuario con los selectores de Estado (Activo) y Dificultad (Easy) aplicados a la vez. |

---

### 1.4. Ejecución de CP-2001-04

| ID | Descripción | Tipo | Estado | Defectos |
| :-- | :-- | :-- | :-- | :-- |
| **CP-2001-04** | Validar la combinación final de tres filtros simultáneos (Estado: Activo, Dificultad: Easy, Campaña: Malaria). | Manual | Exitoso | Ninguno |

| Resultado esperado | Resultado obtenido |
| :-- | :-- |
| La interfaz procesa la intersección final. Muestra en pantalla solo los proyectos que cumplan estrictamente con los tres criterios en simultáneo, reflejando de forma clara que la combinación está vacía si no hay coincidencia. | La UI resolvió la consulta combinada correctamente de forma asíncrona. Al no existir registros en el entorno que reúnan las tres condiciones a la vez, la grilla ocultó todas las tarjetas y actualizó el contador de control a "0 de 0" proyectos encontrados. |

| Evidencia |
| :-- |
| **Selección de los Tres Filtros**<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-02-ejecucion-exploracion-proyectos/CP-2001-04-interseccion-tres-filtros.png" width="800px" alt="CP-2001-04 - Aplicando los tres filtros en la interfaz"></a><br>Captura del momento de ejecución aplicando los tres criterios simultáneos (Activo, Easy y Campaña Malaria) en la barra superior.<br><br>**Resultado de la Grilla con "0 de 0"**<br><a href="#--------"><img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-02-ejecucion-exploracion-proyectos/CP-2001-04-resultado-cero.png" width="800px" alt="CP-2001-04 - Grilla vacía con contador mostrando 0 de 0"></a><br>Vista final de la interfaz tras procesar la consulta; se verifica que las tarjetas se ocultaron y el indicador visual numérico marca 0 de 0 resultados. |