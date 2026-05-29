# Configuración del entorno de desarrollo

## Arquitectura

El Tasking Manager está compuesto por dos partes:

* **Frontend**: Una interfaz de usuario construida con React.
* **Backend**: Una base de datos y una API construidas con Python.

Ambas partes se pueden desarrollar de forma independiente la una de la otra.

## Autenticación OSM (OSM Auth)

El Tasking Manager utiliza OAuth2 con OSM para autenticar a los usuarios.

Para poder utilizar el frontend, es posible que necesites crear claves en OSM:

1. [Inicia sesión en OSM][1]
   (_Si aún no tienes una cuenta, haz clic en el botón de registro
   en la barra de navegación superior para crear una_).

   Haz clic en la flecha desplegable en la parte superior derecha de la barra de navegación
   y selecciona "Mi configuración".

2. Registra tu instancia de Tasking Manager en las aplicaciones OAuth 2.

   Coloca tu URL de redirección de inicio de sesión como `http://127.0.0.1:3000/authorized`

   > Nota: Se requiere usar `127.0.0.1` en lugar de `localhost` para la depuración
   > debido a restricciones de OSM.

3. Permisos requeridos:
    - Leer las preferencias del usuario (read_prefs).
    - Modificar el mapa (write_api).

4. Ahora guarda tu Client ID y Client Secret para el siguiente paso.

## Configurar el archivo Dot Env (.env)

1. Copia el archivo `example.env` a `tasking-manager.env`.

    ```bash
    cp example.env tasking-manager.env
    ```

2. Actualiza las siguientes variables:

    ```dotenv
    TM_CLIENT_ID=desde-el-paso-anterior
    TM_CLIENT_SECRET=desde-el-paso-anterior
    ```

> Si eres desarrollador frontend y no deseas configurar el
> backend, puedes utilizar la API de nuestro servidor de pruebas (staging).
>
> Actualiza la variable:
>
>    `TM_APP_API_URL='https://tasking-manager-staging-api.hotosm.org'`
>
> antes de ejecutar el comando `yarn start`.
>
> Ten en cuenta que la API de staging puede estar fuera de línea mientras desplegamos
> nuevas versiones en el servidor de pruebas y que no tendrás acceso
> a algunas vistas de administración debido a los permisos. Revisa la
> sección de [configuración](#configuration) para aprender más sobre cómo
> configurar Tasking Manager.

Para más detalles, consulta la [sección de configuración](#configuration).

## Docker

La opción más sencilla para empezar con todos los componentes puede ser el uso de Docker.

### Requisitos

[Docker Engine](https://docs.docker.com/engine/install/) debe estar disponible localmente.

### Ejecutar Tasking Manager

Una vez que tengas el motor de Docker en ejecución, genera rápidamente un archivo de entorno a partir del `example.env` existente.
```bash
cp example.env tasking-manager.env

```

Ahora puedes proceder a iniciar los servicios.

```bash
docker compose --env-file tasking-manager.env up -d

```

Tasking Manager debería estar disponible en:
[http://127.0.0.1:3000](http://127.0.0.1:3000)

#### (Opcional) Cambiar el puerto de desarrollo o el archivo dotenv

Puedes cambiar el puerto por defecto de `3000` a cualquier otro puerto.

Sin embargo, debes cambiar tu URL de redirección de OAuth para reflejar esto,
además de cualquier variable que incluya un puerto, por ejemplo, TM_APP_BASE_URL.

El archivo dotenv por defecto también se puede cambiar.

```bash
TM_DEV_PORT=9000 docker compose --env-file tasking-manager.env up -d

```

```bash
docker compose --env-file tasking-manager.env up -d

```

#### (Opcional) Sobrescribir `docker-compose.yml`

Si deseas añadir una configuración personalizada para los servicios de docker, puedes hacer una copia de `docker-compose.override.sample.yml` y editarla según tus necesidades.

Crea un archivo de invalidación (override) a partir de la muestra:

```
cp docker-compose.override.sample.yml docker-compose.override.yml

```

### Base de datos externa o autoalojada (Self-Hosted)

Si deseas utilizar tu servidor postgresql local u otro servicio de base de datos externo,
busca este conjunto de variables de entorno en `tasking-manager.env`:

```bash
POSTGRES_DB=tasking-manager
POSTGRES_USER=tm
POSTGRES_PASSWORD=tm
POSTGRES_ENDPOINT=<reemplazar-con-el-endpoint-de-tu-base-de-datos>
POSTGRES_PORT=5432

```

> ***NOTA:*** Si el servidor de la base de datos es administrado por ti mismo en tu máquina local, usa la dirección IP de tu máquina. Asegúrate también de que sea accesible desde el contenedor `tm-backend`.

Una vez actualizado, recrea los contenedores con:

```
docker compose --env-file tasking-manager.env up -d

```

### Despliegue exclusivo del Frontend

Si buscas desplegar únicamente el servicio de Frontend con docker, deberás asegurarte de que las siguientes variables de entorno sean correctas en `tasking-manager.env`:

```
TM_APP_API_URL=[http://127.0.0.1:5000](http://127.0.0.1:5000)

```

Esto se refiere al servicio backend que vas a consumir. Si no tienes una instancia backend de Tasking Manager, puedes usar el servidor de staging alojado por hotosm:

```
TM_APP_API_URL=[https://tasking-manager-staging-api.hotosm.org](https://tasking-manager-staging-api.hotosm.org)

```

Luego procede a iniciar únicamente el servicio frontend con docker:

```
docker compose --env-file tasking-manager.env up -d tm-frontend

```

Revisa los logs del servidor con:

```
docker logs tasking-manager-main-tm-frontend-1 -f

> TaskingManager-frontend@0.1.0 patch-rapid
> bash -c "cp patch/rapid-imagery.min.json public/static/rapid/data/imagery.min.json"

ℹ ｢wds｣: Project is running at [http://172.22.0.2/](http://172.22.0.2/)
ℹ ｢wds｣: webpack output is served from
ℹ ｢wds｣: Content not from webpack is served from /usr/src/app/public
ℹ ｢wds｣: 404s will fallback to /
Starting the development server...

Compiled successfully!

You can now view TaskingManager-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  [http://172.22.0.2:3000](http://172.22.0.2:3000)

Note that the development build is not optimized.
To create a production build, use yarn build.

```

Para los valores de `CLIENT_ID` y `SECRETS` relacionados con OSM, revisa la sección [OSM AUTH](https://www.google.com/search?q=%23osm-auth).

## Ejecutar componentes de forma independiente (Standalone)

### Frontend

El cliente es la interfaz de usuario front-end de Tasking Manager. Está basado en el framework React y puedes encontrar todos los archivos en el directorio `frontend`.

#### Dependencias

Las siguientes dependencias deben estar disponibles *globalmente* en tu sistema:

* Descarga e instala [NodeJS LTS v12+](https://nodejs.org/en/) y [yarn](https://classic.yarnpkg.com/en/docs/install)
* Dirígete al directorio `frontend` y ejecuta `yarn`.

#### Scripts disponibles

En el directorio del proyecto, puedes ejecutar:

##### `yarn start`

Ejecuta la aplicación en modo de desarrollo.

Abre [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) para verla en el navegador.

La página se recargará si realizas ediciones.

También verás cualquier error de lint en la consola.

##### `yarn test`

Inicia el ejecutor de pruebas (test runner) en modo de observación interactiva (watch mode).

Consulta la sección sobre [ejecución de pruebas](https://facebook.github.io/create-react-app/docs/running-tests) para más información.

##### `yarn build`

Construye la aplicación para producción en la carpeta `build`.

Empaqueta correctamente React en modo de producción y optimiza la construcción para el mejor rendimiento.

La construcción se comprime (minified) y los nombres de los archivos incluyen los hashes.

¡Tu aplicación está lista para ser desplegada!

Consulta la sección sobre [despliegue](https://facebook.github.io/create-react-app/docs/deployment) para más información.

#### Aprender más

Puedes aprender más en la [documentación de Create React App](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Backend

El backend está compuesto por una base de datos postgres y una API asociada
que realiza llamadas a varios endpoints para crear tareas, gestionar el estado de las tareas y
generar analíticas.

#### Dependencias

* [Python 3.7+](https://www.python.org/downloads/)
* Python 3.7 es la versión que HOT utiliza en producción. También puedes usar Python 3.8.
* [PostgreSQL](https://www.postgresql.org/download/) con [PostGIS](https://postgis.net/install/)
* [pip](https://pip.pypa.io/en/stable/installing/)
* [libgeos-dev](https://trac.osgeo.org/geos/)

Puedes revisar el
[Dockerfile](https://github.com/hotosm/tasking-manager/blob/develop/Dockerfile)
para tener una referencia de cómo instalarlo en un sistema Debian/Ubuntu.

#### Configuración

Hay dos formas de configurar Tasking Manager. Puedes establecer algunas
variables de entorno en tu terminal o puedes definir la
configuración en el archivo `tasking-manager.env` en el directorio raíz
del repositorio. Para usar esta última opción, sigue las instrucciones a continuación:

* Copia el archivo de configuración de ejemplo para iniciar tu propia configuración:
`cp example.env tasking-manager.env`.
* Ajusta el archivo de configuración `tasking-manager.env` para que se adapte a tus necesidades.
* Asegúrate de que las siguientes variables estén configuradas correctamente en el
archivo de configuración `tasking-manager.env`:
* `TM_APP_BASE_URL`=endpoint-del-servidor-web
* `POSTGRES_DB`=nombre-de-la-base-de-datos-del-tasking-manager
* `POSTGRES_USER`=nombre-de-usuario-de-la-base-de-datos
* `POSTGRES_PASSWORD`=contraseña-del-usuario-de-la-base-de-datos
* `POSTGRES_ENDPOINT`=endpoint-de-la-base-de-datos-puede-ser-localhost
* `POSTGRES_PORT`=puerto-de-la-base-de-datos
* `TM_SECRET`=define-libremente-cualquier-combinacion-de-numeros-y-letras
* `TM_CLIENT_ID`=oauth-client-id-de-openstreetmap
* `TM_CLIENT_SECRET`=oauth-client-secret-key-de-openstreetmap
* `TM_REDIRECT_URI`=oauth-client-redirect_uri
* `TM_SCOPE`=oauth-client-scopes
* `TM_LOG_DIR=logs`

Para enviar correos electrónicos correctamente, configura también estas variables:

* `TM_SMTP_HOST`
* `TM_SMTP_PORT`
* `TM_SMTP_USER`
* `TM_SMTP_PASSWORD`
* `TM_SMTP_USE_TLS=0`
* `TM_SMTP_USE_SSL=1` (Ya sea TLS o SSL se puede configurar en 1, pero no ambos)

#### Instalar dependencias

* Instala las dependencias del proyecto:
* Primero asegúrate de que la versión de Python especificada en `pyproject.toml:requires-python` esté instalada en tu sistema.
* `pip install --upgrade uv`
* `uv sync`

#### Pruebas (Tests)

El proyecto incluye una suite de pruebas unitarias y de integración que
deberías ejecutar después de realizar cualquier cambio.

```
python3 -m unittest discover tests/backend

```

o

```
uv run test

```

#### Exportar cadenas traducibles al archivo fuente en.json

```
cd frontend && yarn build-locales

```

### Base de datos

### Migraciones con docker

Necesitas eliminar todas las versiones en `./migrations/version`.
Luego, importa el nuevo modelo dentro del archivo `./backend/__init__.py`.
Finalmente, ingresa al contenedor de migración y ejecuta:

```
python manage.py db migrate

```

y

```
python manage.py db upgrade

```

#### Crear una base de datos nueva

Utilizamos
[Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) para
crear la base de datos desde el directorio de migraciones. Revisa las
instrucciones sobre cómo configurar una base de datos PostGIS con
[docker](https://www.google.com/search?q=%23creating-a-local-postgis-database-with-docker) o en tu
[sistema local](https://www.google.com/search?q=%23creating-a-local-postgis-database-without-docker). Luego puedes ejecutar el siguiente
comando para aplicar las migraciones:

```
flask db upgrade

```

o

```
uv run upgrade

```

#### Configurar permisos para crear proyectos

Para poder crear proyectos y tener permisos completos como usuario administrador
dentro de TM, inicia sesión en TM con tu cuenta de OSM para registrar tu
información de usuario en la base de datos, luego ejecuta el siguiente comando
en tu terminal (con el usuario del sistema operativo que sea dueño de la base de datos):

`psql -d <tu_base_de_datos> -c "UPDATE users set role = 1 where username = '<tu_nombre_de_usuario_osm>'"`

## API

Si planeas trabajar únicamente en la API, solo tienes que construir la
arquitectura del backend. Instala las dependencias del backend y ejecuta el servidor:

```bash
# Instalar dependencias
uv sync

# Ejecutar (Opción 1)
uv run start

# Ejecutar (Opción 2)
uv run flask run --debug --reload

```

Puedes acceder a la documentación de la API en
[http://localhost:5000/api-docs](https://www.google.com/search?q=http://localhost:5000/api-docs), la cual
también te permite ejecutar solicitudes en tu instancia local de TM. La documentación de la API
también está disponible en nuestras instancias de
[producción](https://tasks.hotosm.org/api-docs) y
[staging](https://tasks-stage.hotosm.org/api-docs/).

### Autenticación de la API

Para autenticarse en la API, necesitas tener un Token de Autorización (Authorization Token).

1. Ejecuta la línea de comandos `manage.py` a través de `flask` con la opción `gen_token`
y `-u <Número_ID_Usuario_OSM>`. La línea de comandos se puede ejecutar
en cualquier sesión de la terminal siempre que te encuentres en el directorio
`tasking-manager`.

```
flask gen_token -u 99999999

```

Esto generará una línea similar a esta:

> Your base64 encoded session token: b'SWpFaS5EaEoxRlEubHRVC1DSTVJZ2hfalMc0xlalu3KRk5BUGk0'

2. In la interfaz de usuario de Swagger, donde dice:

> Token sessionTokenHere==

reemplaza `sessionTokenHere==` con la cadena de caracteres que se encuentra entre las
comillas simples (' ') de arriba, de modo que termines con algo como esto en ese campo:

> Token SWpFaS5EaEoxRlEubHRVC1DSTVJZ2hfalMc0xlalu3KRk5BUGk0

Por supuesto, tu usuario debe haber iniciado sesión al menos una vez en la instancia local de pruebas/desarrollo
y contar con los permisos necesarios para la llamada a la API.

Puedes obtener tu número de ID de usuario de OSM buscándolo en tu base de datos local
de pruebas/desarrollo `select * from users` o desde OSM visualizando el
historial de edición de tu usuario, seleccionando un conjunto de cambios (changeset) de la lista, y
luego en el enlace inferior `Changeset XML`; estará en el campo `uid` del XML devuelto.

### Autenticación de la API en una instancia remota

Para obtener tu token en las instancias de producción o staging de Tasking Manager,
inicia sesión en el navegador y luego:

* ve a la página de perfil de usuario, activa el *Modo experto* en la configuración,
y copia el token desde la sección *API Key*.
* o inspecciona una solicitud de red y busca el campo `Authorization`
en la sección de encabezados (headers) de la solicitud.

## Información Adicional

### Crear una base de datos PostGIS local sin Docker

#### Crear la base de datos PostGIS

Puede darse el caso de que prefieras configurar la base de datos sin usar
Docker por una u otra razón. Esto te proporciona un conjunto de
comandos para crear la base de datos y exportar su dirección para
permitirte sumergirte en el desarrollo del backend.

#### Dependencias

Primero, asegúrate de que Postgresql y PostGIS estén instalados y ejecutándose en
tu computadora.

#### Crear el usuario de la base de datos y la base de datos

Asumiendo que tienes acceso sudo y el propietario unix de Postgresql es `postgres`:

```
$sudo -u postgres psql$ CREATE USER "hottm" PASSWORD 'hottm';
$CREATE DATABASE "tasking-manager" OWNER "hottm";$ \c "tasking-manager";
$ CREATE EXTENSION postgis;

```

Finalmente, añade la variable de entorno para acceder a la base de datos:

`export TM_DB=postgresql://hottm:hottm@localhost/tasking-manager`

Es posible instalar y ejecutar el Tasking Manager utilizando
[Docker](https://docker.com) y [Docker
Compose](https://docs.docker.com/compose/).

Clona el repositorio de Tasking Manager y utiliza `docker compose --env-file tasking-manager.env up` para
obtener una versión funcional de la API en ejecución.

## Guía para administradores de sistemas (Sysadmins)

* [Arquitectura del sistema](https://www.google.com/search?q=../sysadmins/architecture.md)
* [Gestión de CI/CD con CircleCI](https://www.google.com/search?q=../sysadmins/ci-cd.md)
* [Guía de despliegue](https://www.google.com/search?q=../sysadmins/deployment.md)
