# Code contributions

Project and code leads are experienced HOT volunteer and staff
developers and the main points of contact for the project. They are
also the final reviewers of issues and pull requests. Code leads will
review pull requests and provide feedback. The purpose of this role is
to help contributors, provide consistency and ensure code quality.

Currently, HOT has been collaborating with the developers at
[Naxa](https://www.naxa.com.np/) to help maintain and support
community development on the project. Their role as leaders on the
project and in the development community has greatly benefitted the
Tasking Manager development and sustainability of the project.
Previously [Kathmandu Living Labs](https://kathmandulivinglabs.org/)
has been maintained the Tasking Manager.

All of the development is going to happen in the [project
repository](https://github.com/hotosm/tasking-manager) and everything
we work on shall be related to and documented in issues of the related
[issue queue](https://github.com/hotosm/tasking-manager/issues).

## Code basics

1. Write tests for all new backend features and use a tool (like
   coveralls.io) to measure test coverage.
2. Consider writing tests when building new frontend.
3. Stick to pep8 python style guide for the backend.
4. Apply ESLint and [prettier](https://prettier.io/) style guide rules
   for the frontend code.
5. Export translatable strings with `make refresh-translatables` and
   include them in your commit.
6. When creating new environment variables or changing existing ones,
   make sure to add them to the AWS Cloudformation template (see [the
   deployment docs](../sysadmins/deployment.md)) and note them in the
   Pull Request.

## Code collaboration and version control

*Note: We use **git flow** as our branching model. Read more
[here](https://nvie.com/posts/a-successful-git-branching-model/) and
[here](https://jeffkreeftmeijer.com/git-flow/), and refer to this
[cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/) if
you aren’t familiar with it yet. You probably want to install a
[helper application](https://github.com/nvie/gitflow/wiki/Installation) to
facilitate the flow a bit.*

* Use branches in the tasking-manager project. This allows others to
  rebase your branch when they are reviewing or to continue started
  work. We follow git flow’s naming convention
  - `feature/ISSUENUMBER-SHORT-TITLE-SEPARATED-BY-HYPHENS` for general
    new features you are working on
  - `hotfix/ISSUENUMBER-SHORT-TITLE-SEPARATED-BY-HYPHENS` for
    important bug fixes that need to go into the main releases as soon
    as possible
  - `bugfix/ISSUENUMBER-SHORT-TITLE-SEPARATED-BY-HYPHENS` for
  non-critical fixes that can be deployed in the next scheduled
  release. (e.g. for a normal feature
  feature/893-restrict-available-editors).
* Make sure your PR is always up to date and rebased with the latest
  develop branch.
* Try to build a nice and understandable commit history of the
  project. Please use [meaningful commit
  messages](https://medium.com/@nawarpianist/git-commit-best-practices-dab8d722de99)
  and try to unite/squash related work into one commit. Eventually we
  will squash commits before merging a new feature or hotfix into the
  main branches (develop and master).
* Give meaningful and understandable testing instructions in your
  PR. Highlight important preconditions and try to make life easier
  for the reviewer.

### Comments

Sometimes it's not apparent from the code itself what it does, or
more importantly, **why** it does that. Good comments help your fellow
developers understand the code better and make sure that it is doing the
right thing.

When developing, you should:

* Comment your code - do not go overboard, but explain the bits which
might be difficult to understand. As a general rule of thumb, try to
explain what the code does, why it does it, and why it should be the
way it is or where it could be improved in the future.

* Check existing comments to ensure they are not misleading.

### Committing

When you submit pull requests, the project maintainer has to read them and
understand them. This is difficult enough at the best of times, and
misunderstanding pull requests can lead to them being more difficult to
merge. To help with this, when making pull requests you should:

* Split up large changes into smaller units of functionality.
* Keep your commit messages relevant to the changes in each individual
unit.

When writing commit messages please try and stick to the same style as
other commits, namely:

* A one line summary, starting with a capital letter.
* A blank line.
* Full description, as proper sentences.

For simple commits the one line summary is often enough and the body
of the commit message can be left out.

Before sending a PR, make sure you run the following commands and
include the changes in your commit.

* Code formatting:
  * Format all backend code by running [Black](https://pypi.org/project/black/): `black manage.py backend tests migrations` or `pdm run lint`
  * Format all frontend code with [prettier](https://prettier.io/)
    either by [configuring your
    editor](https://prettier.io/docs/en/editors.html) or by running
    `yarn prettier` inside the `frontend` directory.
* Coding standards: Make sure you adhere to the coding standards
  eventually risen by [Flake8](http://flake8.pycqa.org/en/latest/):
  `flake8 manage.py backend tests migrations` or `pdm run flake8`
* Prepare for translations: In case you have introduced new strings on
  the frontend, the translation source file must be updated this can
  be done via `make refresh-translatables` or `yarn build-locales`
  (inside the `frontend` directory).

If you have forked this project on GitHub then the best way to submit
your patches is to push your changes back to your GitHub repository
and then send a "pull request" via GitHub to the main repository.

You can use this [git pre-commit hook](https://git-scm.com/docs/githooks#_pre_commit) to format both the frontend and the backend code:

```
#!/bin/sh
JS_FILES=$(git diff --cached --name-only --diff-filter=ACMR "*.js" "*.jsx" | sed 's| |\\ |g')
PY_FILES=$(git diff --cached --name-only --diff-filter=ACMR "*.py" | sed 's| |\\ |g')
([ -z "$JS_FILES" ] && [ -z "$PY_FILES" ]) && exit 0

# Prettify all selected files
echo "$JS_FILES" | xargs ./frontend/node_modules/.bin/prettier --write
echo "$PY_FILES" | xargs black

# Add back the modified/prettified files to staging
echo "$JS_FILES" | xargs git add
echo "$PY_FILES" | xargs git add

exit 0
```
## Documentation

Project documentation should be in [Markdown
format](https://www.markdownguide.org/), and in a _docs_
subdirectory. While it is possible to use HTML in Markdown documents
for tables and images, it is prefered to use the Markdown style as
it's much easier to read.

### Reviewing Pull Requests

We welcome community members to review Pull Request. The process to
review a PR  is by adding a comment if already reviewed and everything
looks good, or specifying what change is needed.
