# Code constributions

Project and code leads are experienced HOT volunteer and staff developers and the main points of contact for the project. They are also the final reviewers of issues and pull requests. Code leads will review pull requests and provide feedback. The purpose of this role is to help contributors,
provide consistency and ensure code quality.

All of the Tasking Manager development is going to happen in the [projects repository](https://github.com/hotosm/tasking-manager) and everything we work on shall be related to and documented in issues of the related [issue queue](https://github.com/hotosm/tasking-manager/issues).

## Code basics

1. Write tests to all new backend features and use some tool (like coveralls.io) to measure test coverage.
2. Consider write tests when building the new frontend
3. Stick to pep8 python style guide for the backend
4. Apply JSLint style guide rules for the frontend code.

## Code collaboration and version control

*Note: We use **git flow** as our branching model. [Read](https://nvie.com/posts/a-successful-git-branching-model/) [more](https://jeffkreeftmeijer.com/git-flow/) ([cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)) if you aren’t familiar with it, yet. Probably you want to install a [helper application](https://github.com/nvie/gitflow/wiki/Installation) to facilitate the flow a bit.*

* Use a branches on the tasking-manager project. This allows other to rebase your branch when they are reviewing or to continue started work. We follow git flow’s naming convention
  - `feature/ISSUENUMBER-SHORT-TITLE-SEPARATED-BY-HYPHENS` for general new features you are working on
  - `hotfix/ISSUENUMBER-SHORT-TITLE-SEPARATED-BY-HYPHENS` for important bug fixes that need to go into the main releases as soon as possible
(e.g. for a normal feature feature/893-restrict-available-editors).
* Make sure your PR is always up to date and rebased with the latest develop branch.
* Let’s build a nice and understandable commit history of the project. Please use [meaningful commit messages](https://code.likeagirl.io/useful-tips-for-writing-better-git-commit-messages-808770609503?gi=d287cc406699) and try to unite/squash related work into one commit. Eventually we will squash commits before merging a new feature or hotfix into the main branches (develop and master).
* Give meaningful and understandable testing instructions in your PR. Highlight important preconditions and try to make life easy for the reviewer.

### Comments

Sometimes it's not apparent from the code itself what it does, or,
more importantly, **why** it does that. Good comments help your fellow
developers to read the code and satisfy themselves that it is doing the
right thing.

When developing, you should:

* Comment your code - do not go overboard, but explain the bits which
might be difficult to understand what the code does, why it does it
and why it should be the way it is or where it might be improved in the future.
* Check existing comments to ensure that they are not misleading.

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

If you have forked this project on GitHub then the best way to submit your patches is to
push your changes back to your GitHub repository and then send a "pull request" via GitHub to the main repository.
