# Customize your Tasking Manager

Set up a Tasking Manager instance for your community, organization or company. This guide walks you through the configuration options for customizing the look and feel it to your preference.

Manipulate these three files to customize your Tasking Manager:

* `tasking-manager.env` for basic information and colours
* `logo.svg` for the main logo
* `frontend/src/locales/content/en.json` for static contents. File can be translated into other supported languages.

## Basic information

The site information can be defined in the configuration file https://github.com/hotosm/tasking-manager/blob/develop/example.env.
(such as name, slogan, URL of the site, default changeset hashtags, and contact email addresses, etc).

TODO: Check documentation of configuration file (e.g. seocond email address migth be missing, ...)

## Colours

Make the Tasking Manager look the way you want! Colours can be defined in: https://github.com/hotosm/tasking-manager/blob/develop/frontend/src/assets/styles/_variables.scss

TODO: Make them configurable (can ENV variable be an option for SCSS?) and name them more generically in the config file: main colour, opposite colour, etc.

## Logo

Use your own Logo. Just replace this one: https://github.com/hotosm/tasking-manager/blob/develop/frontend/src/assets/img/main-logo.svg

TODO:
* check for `logo.svg` but fallback to `logo-fallback.svg` if the first doesn't exists. Then it can be placed there without any changes to the actual code base.
* create basic logo for `logo-fallback.svg`
* include `logo.svg` in .gitignore file

## Content

// Idea: Separate language  into second .json file - this allows individual organizations to do their transifex (or similar) workflow.
// Place this second json into a specific directory and make it override the strings in it to the main files on th `npm run build` command
// For stats, check on leaderboard url

TODO: Explain how to modify the frontpage
TODO: Make footer slogan configurable
(translatable?)


Big question: Couldn't we handle ENV variables for deployments in config file rather than AWS environment? Would probably be easier to manage on the repo.