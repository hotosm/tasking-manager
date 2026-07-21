# Contribuciones de código

Los líderes del proyecto y de código son desarrolladores experimentados, tanto voluntarios como personal de HOT, y son los principales puntos de contacto para el proyecto. También son los revisores finales de los *issues* y *pull requests*. Los líderes de código revisarán los *pull requests* y proporcionarán comentarios. El propósito de este rol es ayudar a los colaboradores, aportar consistencia y garantizar la calidad del código.

Actualmente, HOT ha estado colaborando con los desarrolladores de [Naxa](https://www.naxa.com.np/) para ayudar a mantener y respaldar el desarrollo comunitario en el proyecto. Su rol como líderes en el proyecto y en la comunidad de desarrollo ha beneficiado enormemente al progreso del Tasking Manager y a la sostenibilidad del proyecto. Anteriormente, [Kathmandu Living Labs](https://kathmandulivinglabs.org/) se encargaba del mantenimiento del Tasking Manager.

Todo el desarrollo se llevará a cabo en el [repositorio del proyecto](https://github.com/hotosm/tasking-manager) y todo aquello en lo que trabajemos deberá estar relacionado y documentado en los *issues* de la correspondiente [lista de issues](https://github.com/hotosm/tasking-manager/issues).

## Conceptos básicos del código

1. Escribir pruebas para todas las nuevas funcionalidades del *backend* y usar una herramienta (como coveralls.io) para medir la cobertura de las pruebas.
2. Considerar la escritura de pruebas al construir el nuevo *frontend*.
3. Apegarse a la guía de estilo Python PEP 8 para el *backend*.
4. Aplicar las reglas de las guías de estilo de ESLint y [prettier](https://prettier.io/) para el código del *frontend*.
5. Exportar las cadenas traducibles con `make refresh-translatables` e incluirlas en tu *commit*.

* Utilizar ramas en el proyecto tasking-manager. Esto permite que otros hagan un *rebase* de tu rama cuando la estén revisando o para continuar el trabajo iniciado. Seguimos la convención de nomenclatura de git flow:
  - `feature/NUMERO_DE_ISSUE-TITULO-CORTO-SEPARADO-POR-GUIONES` para nuevas funcionalidades generales en las que estés trabajando.
  - `hotfix/NUMERO_DE_ISSUE-TITULO-CORTO-SEPARADO-POR-GUIONES` para correcciones de errores importantes que deban incluirse en las versiones principales lo antes posible.
  - `bugfix/NUMERO_DE_ISSUE-TITULO-CORTO-SEPARADO-POR-GUIONES` para correcciones no críticas que puedan desplegarse en el próximo lanzamiento programado. (Por ejemplo, para una funcionalidad normal: `feature/893-restrict-available-editors`).
  - `NUMERO_DE_ISSUE-TITULO-CORTO-SEPARADO-POR-GUIONES` Para cambios asignados directamente desde una issue en el proyecto del curso. (Por ejemplo, `32-actualizar-pruebas-de-integracion`).
* Intentar construir un historial de *commits* limpio y comprensible para el proyecto. Por favor, utiliza [*commit messages* significativos](https://medium.com/@nawarpianist/git-commit-best-practices-dab8d722de99) e intenta unificar/combinar (*squash*) el trabajo relacionado en un solo *commit*. Eventualmente, combinaremos los *commits* antes de fusionar una nueva funcionalidad o *hotfix* en las ramas principales (`develop` y `master`).
* Proporcionar instrucciones de prueba significativas y comprensibles en tu PR. Resalta las condiciones previas importantes e intenta facilitarle la vida al revisor.

### Comentarios

A veces no resulta evidente a partir del propio código qué es lo que hace, o más importante aún, **por qué** lo hace. Los buenos comentarios ayudan a tus compañeros desarrolladores a entender mejor el código y a asegurarse de que está haciendo lo correcto.

Al desarrollar, deberías:

* Comentar tu código: no te excedas, pero explica los fragmentos que puedan ser difíciles de comprender. Como regla general, intenta explicar qué hace el código, por qué lo hace, por qué debería ser así o dónde se podría mejorar en el futuro.

* Verificar los comentarios existentes para asegurarte de que no sean engañosos.

### Committing (Confirmación de cambios)

Cuando envías un *pull request*, el mantenedor del proyecto tiene que leerlo y entenderlo. Esto ya es bastante difícil de por sí, y un malentendido en los *pull requests* puede hacer que sean más complicados de fusionar. Para ayudar con esto, al realizar *pull requests* deberías:

* Dividir los cambios grandes en unidades de funcionalidad más pequeñas.
* Mantener tus mensajes de *commit* relevantes para los cambios de cada unidad individual.

Al escribir mensajes de *commit*, intenta mantener el mismo estilo que los demás *commits*, es decir:

* Un resumen de una sola línea, comenzando con una letra mayúscula.
* Una línea en blanco.
* Descripción completa, redactada en oraciones correctas.

Para *commits* simples, el resumen de una sola línea suele ser suficiente y el cuerpo del mensaje de *commit* se puede omitir.

Antes de enviar un PR, asegúrate de ejecutar los siguientes comandos e incluir los cambios en tu *commit*.

* Formateo de código:
  * Formatear todo el código del *backend* ejecutando [Black](https://pypi.org/project/black/): `black manage.py backend tests migrations` o `uv run lint`
  * Formatear todo el código del *frontend* con [prettier](https://prettier.io/), ya sea [configurando tu editor](https://prettier.io/docs/en/editors.html) o ejecutando `yarn prettier` dentro del directorio `frontend`.
* Estándares de código: Asegurarse de cumplir con los estándares de código señalados por [Flake8](http://flake8.pycqa.org/en/latest/): `flake8 manage.py backend tests migrations` o `uv run flake8`
* Preparación para traducciones: En caso de que hayas introducido nuevas cadenas en el *frontend*, el archivo fuente de traducción debe ser actualizado; esto se puede hacer mediante `make refresh-translatables` o `yarn build-locales` (dentro del directorio `frontend`).

Si has forkeado este proyecto en GitHub, la mejor manera de enviar tus parches es subir tus cambios a tu repositorio de GitHub y luego enviar un "pull request" a través de GitHub al repositorio principal.

Puedes usar este [hook de pre-commit de git](https://git-scm.com/docs/githooks#_pre_commit) para formatear tanto el código del *frontend* como el del *backend*:

## Documentación

La documentación del proyecto debe estar en [formato Markdown](https://www.markdownguide.org/) y dentro de un subdirectorio llamado _docs_. Aunque es posible usar HTML en documentos Markdown para tablas e imágenes, se prefiere utilizar el estilo propio de Markdown, ya que es mucho más fácil de leer.

### Revisión de Pull Requests

Damos la bienvenida a los miembros de la comunidad para que revisen los *Pull Requests*. El proceso para revisar un PR consiste en añadir un comentario si ya ha sido revisado y todo se ve bien, o especificar qué cambio es necesario de lo contrario.
