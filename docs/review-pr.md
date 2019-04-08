Assumptions:
1. You have set all [environmental variables](https://github.com/hotosm/tasking-manager#environment-vars) related to database, consumer key, and so forth.
2. You are in the `tasking-manager` base directory.
3. You have the python virtual environment in the `./venv/` directory.

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

`venv/bin/pip install -r requirements.txt`

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

`venv/bin/python manage.py db upgrade`

If you get an error, you may have an upgraded database from a prior PR. Try downgrading to develop (`venv/bin/python manage.py db downgrade`).

### Test and coverage

I have found it better to run tests on a separate database from the live version, but the choice is up to you. Again, it is probably wise to back up your database first if you choose to run it on your main database.

`venv/bin/  ./tests --with-xunit --xunit-file unitresults.xml --with-coverage --cover-erase --cover-package=./server`

### Check changes

This is a small list of possible scenarios that you should test. Ideally, you would check all of them regardless if the answer to the question is 'no' to make sure there are no collateral issues from a PR. Please add more as you see fit (maybe it should just be turned into a checklist).

* Are changes made to the frontend? Walk through them logged in and logged out (if possible).
* Are changes made to the API? Check you can poll it at `http://localinstall/api-docs`.
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

venv/bin/python manage.py db downgrade

# _now_ you can return to develop.
# if you do before downgrading, flask_migrate will not
#   know what the version is pointing to.

git checkout develop
cd client
gulp build
cd ../
```