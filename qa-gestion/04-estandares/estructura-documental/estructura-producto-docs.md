# Manual de Arquitectura y Funcionalidad (producto-docs)

Este repositorio es la única fuente de la verdad técnica y funcional sobre el software. Su objetivo es permitir que cualquier desarrollador, QA o analista comprenda qué hace el sistema, cómo está construido y cómo interactúan sus partes.

## Estructura de Directorios

* `01-vision-y-alcance/`
  Describe el propósito del producto, objetivos de negocio, actores (roles de usuario) y el glosario de términos clave del sistema.
* `02-arquitectura/`
  Documentación puramente técnica. Incluye diagramas de infraestructura, topología de red, base de datos, stack tecnológico y patrones de diseño utilizados (ej. microservicios, eventos).
* `03-modulos-y-funcionalidades/`
  Desglose detallado de cada componente del sistema. Se documenta qué hace cada módulo, sus reglas de negocio y restricciones (ej. `autenticacion.md`, `gestion-pagos.md`, `panel-administrador.md`).
* `04-flujos-de-negocio/`
  Explicación paso a paso de los procesos transversales. Contiene diagramas de secuencia y flujogramas que ilustran el viaje del usuario (ej. ciclo de compra, proceso de registro y validación).
* `05-integraciones-y-apis/`
  Documenta la comunicación con sistemas externos (pasarelas de pago, correos, ERPs) y contratos de alto nivel de las APIs propias que expone el producto.
