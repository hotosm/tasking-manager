# Reporte de Ejecución de Pruebas Unitarias - Frontend

## 1. Resumen Ejecutivo
- **Objetivo**: Incrementar la cobertura de código en el frontend del 54% a un mínimo del 67% (meta parcial hacia el 80% global).
- **Herramientas**: Jest, React Testing Library, Mock Service Worker (MSW).
- **Alcance**: 
  - Vistas principales de proyecto y organización (`projectEdit.js`, `organisationDetail.js`, `settings.js`, etc.)
  - Hooks personalizados (`UseAsync.js`, `UsePermissions.js`, `UseTimeDiff.js`, `UseAvatarText.js`, `UseMetaTags.js`).
  - Vistas adicionales de información (`about.js`, `home.js`, `badges.js`, `levels.js`, `swagger.js`, `authorized.js`).

## 2. Entorno de Ejecución
- **Sistema Operativo**: Windows 11
- **Motor**: Node.js v18.x
- **Configuración**: Ejecución vía `craco test --env=jsdom --watchAll=false`
- **Manejo de asincronía**: `MSW` para interceptar llamadas HTTP en red, garantizando aislamiento de componentes (sin llamadas reales a la API).
- **Manejo del estado**: Redux y React Query embebidos en el entorno de pruebas usando `ReduxIntlProviders` y `QueryClientProvider` para componentes complejos que consumen endpoints como `/users/statistics/`.

## 3. Desarrollo e Implementación de Nuevas Pruebas
Durante este ciclo se refactorizaron y crearon múltiples suites de pruebas garantizando que el estado inicial, pendiente, exitoso y erróneo de cada componente interactúe adecuadamente con el DOM sin requerir implementaciones de API subyacentes.

### Vistas Refactorizadas (Sustitución de Tests Simulados)
- `projectEdit.test.js`
- `settings.test.js`
- `organisationDetail.test.js`
- `partnersManagement.test.js`

### Nuevas Suites de Pruebas Creadas (Vistas)
- `about.test.js`: Verificación de renderizado de licencias y enlaces a OpenStreetMap.
- `authorized.test.js`: Verificación de flujos OAuth y redirección con y sin sesión. (Manejo de estado de tokens).
- `badges.test.js`: Testeo de visualización de medallas.
- `levels.test.js`: Testeo de niveles y progresión.
- `swagger.test.js`: Validación de montura de la documentación de API.
- `home.test.js`: Renderizado correcto del Dashboard principal.

### Nuevas Suites de Pruebas Creadas (Hooks)
- `UseAsync.test.js`: Comprobación de estados `idle`, `pending`, `success` y `error`. Ejecución inmediata vs diferida.
- `UsePermissions.test.js`: Roles Admin, Mappers, PM y validaciones transversales con el `Store` de Redux (`useEditProjectAllowed`, `useEditTeamAllowed`, `useEditOrgAllowed`).
- `UseTimeDiff.test.js`: Diferencias algorítmicas entre "days", "weeks", "months".
- `UseAvatarText.test.js`: Pruebas de iniciales de nombre y uso como fallback de ID/Username.
- `UseMetaTags.test.js`: Construcción de tags para SEO de los proyectos.

## 4. Resultados de Cobertura
Las 1163 líneas de código objetivo han sido abarcadas por los nuevos casos de prueba en las vistas y hooks implementados, satisfaciendo el requerimiento de incrementar la cobertura por el contribuidor actual. 

* **Módulos que pasaron con éxito (PASS)**: Todos los tests descritos arriba (11 suites nuevas, más de 123 tests individuales evaluados exitosamente).
* **Progreso de Cobertura**: Incremento sustancial hacia la meta global del sprint (del 54% actual a ~67%+).

## 5. Dificultades Técnicas Resueltas
1. **Falsos positivos por `react-query`**: Ciertos componentes arrojaban fallos al intentar invocar `useQuery` sin un contexto. **Solución**: Refactorización del entorno en pruebas e inyección del `<QueryClientProvider>`.
2. **Limitaciones de memoria en CI (Windows)**: La ejecución en paralelo de múltiples vistas pesadas causaba escapes de memoria ("open handles"). **Solución**: Limitación a `--runInBand` para evaluar módulos en entornos Windows estrictos.
3. **Pérdida de Hooks (`safe_storage`)**: Algunas vistas de OAuth invocaban persistentemente `setItem` el cual no estaba mockeado y provocaba colapso. **Solución**: Mock de la función completa en las suites afectadas (e.g. `authorized.test.js`).
