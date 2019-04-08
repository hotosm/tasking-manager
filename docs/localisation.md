# Localisation

The Tasking Manager is localised using the Transifex. Transifex is included in the requirements.txt so you should be
able to use the Transifex commands once you have set up your server side code. The Tasking Manager is using Transifex's
[CLI client](https://docs.transifex.com/client/introduction/). Commands are documented there.

Tasking Manager is using Angular Translate to display the translated strings. It works with key/value pairs in .json
format and this is also the format that is used to store the translations in Transifex.

Our [transifex repository](https://www.transifex.com/hotosm/tasking-manager-3/dashboard/).

### Setting up Transifex locally
https://docs.transifex.com/client/init
To use Transifex client, you'll need a Transifex account. In the project top level directory, initialize Transifex
service: tx init. The init process will ask for service URL (leave the default suggestion by hitting enter) and your
Transifex username/password.

The .tx folder contains the Transifex config file. This is where you can find the mappings to local translation files.

### Pushing translations
Use Transifex's ```tx push -s -t``` to push all local changes to Transifex.
* Argument ```-s``` pushes source files (English in our case)
* Argument ```-t``` pushes all translation files

### Pulling translations
Use Transifex's ```tx pull``` to get all translations from Transifex.

### Adding a new language
In this example we are adding support for German.
* Add a new .json file with the appropriate language code as the name of the file, so in this case de.json.
* Configure local mapping by using Transifex's set command: ```tx set -r tasking-manager-3.master -l de client/locale/de.json```
* Add the new language and language code to the config file so it shows up in dropdowns etc. in server/config.py

