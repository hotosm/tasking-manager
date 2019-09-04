
# Review of Pull Requests

All team members are encouraged to regularly review Pull Requests. Within the team we are open to assign people we feel are the best for a certain topic to be checked. The person who opens a PR should initially assign reviewers. A best practice is to have two reviewers, one that looks more on the code and one that has an overview of behaviour and functionality. 

## Pre-review

1. Check naming convention of the PR branch
   For all team Pull Requests make sure they follow the established naming schema:
   * `feature/ISSUENUMBER-SOME-DESCRIPTION` for all new features
   * `hotfix/ISSUENUMBER-SOME-DESCRIPTION` for urgent bugs

  In case the branch name doesn’t fit. Ask the PR contributor to adjust the naming to our 
git flow model.

  PRs from external people are exempted to this best practice and you can continue with 
the next step.

2. Check out the pull request

  Team PRs: `git fetch origin && git checkout BRANCHNAME`

  Outside collaboration PRs: `git fetch origin pull/PRNUMBER/head:feature/PRNUMBER-SOME-DISCRIPTION git checkout BRANCHNAME`

3. Check whether PR is up-to-date with `develop`

  `git fetch origin && git rebase origin/develop`

  * In case there is no rebase happening, you can just continue with the next step.
  * In case of rebasing worked fine, just update the branch with git push -f and continue with the next step.
  * In case of any conflicts, make a comment and ask the PR contributor to fix the comments.

4. Check the commit messages

  Review the commit messages. Usually there should be only one commit per Pull Request. Only more extensive ones or one PR that had to tackle two different topics may contain more. Check whether the commit messages are short and meaningful and describe the changes introduced with it.

5. Check whether there are usable testing instructions

  The description of the Pull Request needs to contain testing instructions. These shall be comprehensive and complete. They should serve you to get started easily and understand what to test and how.

  In case there are no testing instructions or they are not enough. Ask the PR contributor to provide these.

6. Check whether Continuous Integration runs without errors

  Have a look on the CircleCI results. In case they fail, give the PR back to the contributor 
and ask the person to check on the error.
  In case they run through, you are good to go with the next step.

## Code review

1. Test behaviour and edge cases
  Install the PR on your local setup, make sure you run
  a. backend dependency installation: `pip install requirements.txt`
  b. introduced database migrations: `python manage.py db upgrade`
  c. frontend dependency installation: `cd client && npm install && cd ..`
  d. rebuild the frontend: `cd client && gulp build && cd ..`

  Then test the behaviour of the introduced changes. Try to hack it! Use edge cases and find where the new changes will cause errors.

2. Review code

  Check on the code and following these criterias:
  a. Is the code of a good quality?
  b. Are there any typos included?
  c. Is the code commented?
  d. Are there unit tests related to new functionality?

3. Merge a PR

  a. Squash commit messages eventually into one (make sure you include the issue number in the commit message)
  b. Merge into `develop`
  c. Delete the merged branch


## Some step by step instructions 

Assumptions:
1. You have set all [environment variables](./setup-development.md#configuration) related to database, consumer key, and so forth.
2. You are in the `tasking-manager` base directory.
3. You have activated your Python Virtual Environment ([instructions](./setup-development.md#build)).

### Local install

The first step to testing a PR is updating your local develop branch:

`git pull origin develop`

### Fetch PR

Next, create a new local branch to pull down the remote PR branch (the PR should have these commands available to copy to your clipboard):

```
git checkout -b author-branchname develop
git pull https://github.com/author/tasking-manager.git branchname
```

### Dependencies

Make sure that python dependencies are up to date:

`pip install -r requirements.txt`

### Frontend

Rebuild the frontend client:

```
cd client
npm install
gulp build
cd ...
```

This is important to do even if there are no frontend changes because you may have a frontend built from a prior PR test still lingering.

### Database

Upgrade the database (it may be wise to back up your database first):

`python manage.py db upgrade`

If you get an error, you may have an upgraded database from a prior PR. Try downgrading to develop (`python manage.py db downgrade`).

### Tests and coverage

I have found it better to run tests on a separate database from the live version, but the choice is up to you. Again, it is probably wise to back up your database first if you choose to run it on your main database.

`venv/bin/  ./tests --with-xunit --xunit-file unitresults.xml --with-coverage --cover-erase --cover-package=./server`

### Check changes

This is a small list of possible scenarios that you should test. Ideally, you would check all of them regardless if the answer to the question is 'no' to make sure there are no collateral issues from a PR. Please add more as you see fit (maybe it should just be turned into a checklist).

* Are changes made to the frontend? Walk through them logged in and logged out (if possible).
* Are changes made to the API? Check you can poll it at `http://localhost:5000/api-docs`.
* Do changes touch history? Check project history and stats, individual tasks, user profile pages, and the contribute search page.
* Do changes touch messaging? Try logging in with two separate accounts in two browsers (e.g. one open with private browsing) and interacting between users.
* Do changes touch the check out process? Check out a task for mapping and unlock it. Check out another task for mapping and mark it done. Check out a task and unlock it. Check out a task for validation and mark it validated. Check out a task for validation and mark it invalidated.
* Do changes touch on task commenting? Comment on a task without checking it out. Comment on a task while checked out for mapping. Comment on a task while checked out for validating.


## Post-review

After reviewing, you'll want to downgrade your database, return to develop, and rebuild your client folder (just so you do not forget next time):

```
# downgrade assumes one lower revision,
#   so if a PR contains multiple revisions,
#   you may have to run this command more than once

python manage.py db downgrade

# _now_ you can return to develop.
# if you do before downgrading, flask_migrate will not
#   know what the version is pointing to.

git checkout develop
cd client
gulp build
cd ../
```
