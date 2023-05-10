# Versions and Releases

We recently switched to a [trunk-based development model](https://trunkbaseddevelopment.com/) for managing development.

* `master` branch has recently been depreciated in favor of using `develop` as the trunk branch.
* `develop` branch contains the consistent and mostly stable development version of the Tasking Manager. It is the branch where all reviewed features are combined and tested together. This branch is automatically going to be deployed on tasks-stage.hotosm.org.
* `feature/` branches are applied to `develop` after one teammate has reviewed the pull request as approved.
* `hotfix/` branches are applied to `develop` after two teammates have reviewed the pull request as approved.
* `bugfix/` branches are applied to `develop` after two teammates have reviewed the pull request as approved. This convention applies to non-critical fixes that can be deployed in the next scheduled release.
* `deployment/` branches contain the codebase for deployed code. See [Deployment](../sysadmins/deployment.md) for more info.

*Outside collaborations from the wider community most likely will not always apply the trunk branching model and the conventions for naming the branches. This doesn’t have to be a requirement in this case.*

## Major releases

**This procedure is undergoing changes! Keep an eye on this space for updated info soon.**

We consider major releases to be counting the second digit up (e.g. 3.1.0 or 3.2.0). **Major releases shall happen around once every six weeks** and follow an established procedure:

* After four weeks coordinate a feature freeze. Which can happen immediately, or might give some one or two weeks for finishing up the features that the team wants to have in the next release.
* Freeze `develop` after agreed improvements have been implemented. The feature freeze shall last for one week, which means no feature branch pull requests can be merged for the time being.
* Create a Pull Request to `master` from the `develop` branch. Include the release notes into it, so it can be reviewed by the team.
* Ping `@hotosm/software-testers` group to test [tasks-stage.hotosm.org](https://tasks-stage.hotosm.org) extensively.
* Get approval of two code reviews of core contributors to the Tasking Manager.
* After one week and good feedback merge into `master`.
* Rebase `develop` on `master`.
* Create a tag with a release from the `master` branch.

## Minor releases

A minor release refers to the third digit (like 3.2.1 or 3.2.2). It is meant to be an emergency release to fix bugs that are crucial. Only hotfix branches can be applied.

* Create a Pull Request to `master` from a `hotfix` branch. Include brief release notes into it, so it can be reviewed by the team.
* Get approval of two code reviews of core contributors to the Tasking Manager.
* Merge into `master` and `develop`.
* Rebase `develop` on `master`.
* Create a tag with a release from the `master` branch.
