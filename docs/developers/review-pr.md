
# Review of Pull Requests

All team members are encouraged to regularly review Pull
Requests (PR). Within the team we are open to assign people we feel
are the best for a certain topic to be checked. A best practice is to
have two reviewers, one that looks more on the code and one that has
an overview of behaviour and functionality. Note that all PRs should
be made from a fork of the primary branch.

For many small PRs, they can be reviewed by clicking on the PR number
to the right side of the patch. For larger PRs you need to checkout
the pull request. You can see the branch name on the page for the
PR. Since you should be developing in a fork, you need to clone the
primary repository to see the PR branch. Once your primary sources are
up to date, you can check out the PR branch.

	git checkout BRANCHNAME

To see the differences you can use *git diff*.

	git diff BRANCHNAME..develop

1 . Check whether Continuous Integration runs without errors

Have a look on the CI results. In case they fail, add a comment to the
PR and ask the person to check on the error. If the CI tests are good,
you are good to go with the next step.

2 . Review code

Check on the code a using this criterias:

* Is the code of a good quality?
* Are there any typos included?
* Is the code commented?
* Are there unit tests related to new functionality?

If there are any issues, add a comment to the PR page on github. A PR
should not be approved until all issues with the PR are resolved.

3 . Merge a PR

  * On the github page for the PR, click the *Merge pull request*
    button.
  * Delete the PR branch

	git push origin --delete BRANCHNAME
