# Contributions to the localization

## Translators

The Tasking Manager is localised using our [Transifex repository](https://www.transifex.com/hotosm/tasking-manager/dashboard/).
This is super easy. If you are interested click yourself an account and apply to join the `hotosm-translator` team.
Everybody is welcome to support translations through the Transifex website.

## Developers

For developers Transifex offers a [CLI client](https://docs.transifex.com/client/introduction/) and the Tasking
Manager is offering commands to interact with it. The client is already included in the requirements.txt so you should 
have the Transifex commands installed, once you have set up your server side code.

The Tasking Manager is using Angular Translate to display the translated strings. It works with key/value pairs
in .json format and this is also the format that is used to store the translations in Transifex.

### Setting up Transifex locally

To [setup the Transifex client](https://docs.transifex.com/client/init), you'll need a Transifex account and API key.
In the project top level directory, initialize Transifex service: tx init. The init process will ask for service URL
(leave the default suggestion by hitting enter) and your Transifex username/password.

The .tx folder contains the Transifex config file. This is where you can find the mappings to local translation files.

### Extract strings for translation

* ```make refresh-translatables``` -  Collects translatable strings and moves them into `frontend/src/locales/en.json`.
* Push to the `develop` branch and it will be automatically picked up by Transifex (twice a day).

### Update with latest translations

* Before a release new translations need to be pulled in:
* ```tx pull -af``` -  Gets all translations from Transifex and puts them into `frontend/locale`.

### Adding a new language

In this example we are adding support for German.

* Add a new .json file with the appropriate language code as the name of the file, so in this case de.json.
* Configure local mapping by using Transifex's set command: ```tx set -r tasking-manager.master -l de frontend/src/locales/de.json```
* Add the new language and language code to the config file so it shows up in dropdowns etc. in server/config.py

### Pushing translations

You can also translate locally and push the
Use Transifex's ```tx push -s -t``` to push all local changes to Transifex.

* Argument ```-s``` pushes source files (English in our case)
* Argument ```-t``` pushes all translation files
