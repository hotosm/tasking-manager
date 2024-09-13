# Submitting a PR

Before submitting a Pull Request(PR) you should test your changes. If
your changes are nopt covered by any existing test cases, it is
strongly recommended to add a test case. If you are submitting a PR
for a bug, please add the github issue for the bug to the branch name
if possible.

It's better to have multiple PRs with a scope limited to the specific
issue being worked on, than one large one covering multiple
issues. Also creating a PR in draft mode and continuing to commit to
it works fine, but does get confusing for the reviwers. A PR in draft
mode for more than a short time runs the risk of being ignored.

## Tests and coverage

The backend has unit tests which can be run manually. These are the
same tests the CI support runs. To run all the tests, do this:

	python3 -m unittest discover ./tests

To run a specific test case, you can do it like this:

	python -m unittest tests/backend/integration/services/test_license_service.py

Whenever you add a new endpoint in the backend, you should add a test
case for it.

## Check changes

This is a small list of possible scenarios that you should
test. Ideally, you would check all of them regardless if the answer to
the question is 'no' to make sure there are no collateral issues from
a PR. This should be done in your local docker container, and not on a
production server.

* Are changes made to the frontend? Walk through them logged in and
  logged out (if possible).
* Are changes made to the API? Check you can poll it at
  `http://localhost:5000/api-docs` if you have Tasking Manager running
  in a docker container.
* Do changes touch messaging? Try logging in with two separate
  accounts in two browsers (e.g. one open with private browsing) and
  interacting between users.
* Do changes effect selecting a task to map ? Check out a task for
  mapping and unlock it. Check out another task for mapping and mark
  it done. Check out a task and unlock it. Check out a task for
  validation and mark it validated. Check out a task for validation
  and mark it invalidated.
* Do changes touch on task commenting? Comment on a task without
  checking it out. Comment on a task while checked out for
  mapping. Comment on a task while checked out for validating.
