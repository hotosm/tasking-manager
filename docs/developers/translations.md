## Translations

The Tasking Manager is localised using our [Transifex
repository](https://www.transifex.com/hotosm/tasking-manager/dashboard/). This
is super easy. If you are interested, make yourself an account and
apply to join the `hotosm-translator` team. Everybody is welcome to
support translations through the Transifex website.

## Developers

For developers, Tasking Manager uses [Transifex](https://www.transifex.com/) to manage UI translations, and the integration is handled using the [Transifex CLI](https://developers.transifex.com/docs/cli).

Translations are stored in `.json` format as key/value pairs under `frontend/src/locales/`.These files follow the React-based i18n format and are synchronized with Transifex using the CLI.

### Setting up Transifex CLI

To [set up the Transifex
client](https://developers.transifex.com/docs/cli), you'll need a
Transifex account and API key. In the project's top level directory,
initialize Transifex service: `tx init`. The init process will ask for
service URL (leave the default suggestion by hitting enter) and your
Transifex username/password.

The .tx folder contains the Transifex config file. This is where you
can find the mappings to local translation files.

#### Running the Transifex CLI

You can run the CLI via Docker (recommended) or install it natively. Use one of the following methods:

##### Option 1: Docker-based CLI (Recommended)

Use the provided helper scripts to run the CLI inside Docker:

- **macOS/Linux:**

```bash
  ./scripts/transifex/tx-docker.sh pull  # Downloads the latest translations
  ./scripts/transifex/tx-docker.sh push -s  # Pushes updated source strings (English in our case)
```

- **Windows (PowerShell):**

```bash
  ./scripts/transifex/tx-docker.ps1 pull
  ./scripts/transifex/tx-docker.ps1 push -s
```

These scripts will:

- Run Transifex CLI inside a Docker container

- Mount your project directory

- Handle system certificates for secure API communication

If you run into certificate-related errors, update the paths in the script or try the manual install method.

##### Option 2: Manual (Native CLI)

- **Install CLI (macOS/Linux):**

```bash
  curl -sSL https://raw.githubusercontent.com/transifex/cli/master/install.sh | bash
```

- **Install CLI (Windows):**
  Download from [Transifex CLI Releases](https://github.com/transifex/cli/releases)
  Then run:
  ```bash
    tx pull
    tx push
  ```

### Update translation strings

- `yarn build-locales` - Execute that command in the `frontend`
  folder to get the new translatable strings from all the
  `messages.js` files in the frontend code. The changes in the strings
  will be pushed to `frontend/src/locales/en.json` file. The ideal is
  to execute that command before every pull request that change
  something in the translatable strings.
- After the pull request is merged to the `develop` branch, the
  command `tx push -s` needs to be executed in order to push the
  changes to Transifex. The translators receive a notification every
  time we push changes to Transifex.

### Update with latest translations

- Before a release, new translations need to be pulled in: `tx pull
-af --mode translator` - Gets all translations from Transifex and
  puts them into `frontend/src/locales/`.
- The [Transifex
  dashboard](https://www.transifex.com/hotosm/tasking-manager/dashboard/)
  can be used to check the status of the translations. If a language
  is not enabled in the `.tx/config` file, the translation updates
  will be downloaded to the `.tx/tasking-manager.version-4/` folder.

### Adding a new language

The steps required to add a new language support to Tasking Manager
are the following:

- Add the language support using the [Transifex
  dashboard](https://www.transifex.com/hotosm/tasking-manager/dashboard/);
- Edit `.tx/config` and add a line like: `trans.ml = frontend/src/locales/ml.json`
- Add the new language and language code to:
  - The `SUPPORTED_LANGUAGES` dictionary in the config file `backend/config.py`;
  - The `supportedLocales` array on `frontend/src/utils/internationalization.js`;
  - The polyfills in `frontend/src/utils/polyfill.js`;
  - If the new language is not yet supported by
    [iso-countries-languages](https://github.com/hotosm/iso-countries-languages),
    we need to update it and publish a new version.

### Pushing translations

You can also translate locally and push the
Use Transifex's `tx push -s` (if you are using native CLI method) to push local changes to Transifex.

- Argument `-s` pushes source files (English in our case)
- Argument `-t` pushes all translation files

### Helpful Links

[Transifex CLI Docs](https://developers.transifex.com/docs/cli)

[Tasking Manager Transifex Dashboard](https://www.transifex.com/hotosm/tasking-manager/dashboard/)

[Transifex CLI GitHub](https://github.com/transifex/cli)

[iso-countries-languages](https://github.com/hotosm/iso-countries-languages)
