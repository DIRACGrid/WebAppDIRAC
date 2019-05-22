
# Contribution Guidelines for DIRAC


## Pull Requests

When making a `Pull Request` please explain what and why things were
changed. Please include a short description in the
BEGINRELEASENOTES/ENDRELEASENOTES block, which will appear in the
relase.notes, once a new tag is made.

Please prepend the title of your pull request with `[targetReleaseBranch]`.

We are happy if you create pull-requests also if you feature is not ready, yet.
In that case please mark it as a draft (https://github.blog/2019-02-14-introducing-draft-pull-requests/).
For these work-in-progress pull-request, we propose to have a check list of things that still need to be done.

## Issue tracking

Use the GitHub issue tracker. Reference the issues that you are working on.
If you notice an issue, consider first creating an issue and then refering to it
in your pull-request and commit messages with `#[issue-id]`.

## Coding Conventions
 For the python code:
 * You should follow the [DIRAC Coding Conventions](https://dirac.readthedocs.io/en/latest/DeveloperGuide/CodingConvention/index.html).
 * Your code should not introduce any new pylint warnings, and fix as many existing warnings as possible.
 * Use autopep8

## Git workflow

 The DIRAC Development Model is described in the [documentation](https://dirac.readthedocs.io/en/latest/DeveloperGuide/DevelopmentModel/index.html) with detailed instructions on the git workflow listed [here](https://dirac.readthedocs.io/en/latest/DeveloperGuide/DevelopmentModel/ContributingCode/index.html). For additional help on the git(hub) workflow please see this [tutorial](https://github.com/andresailer/tutorial#working-updating-pushing).
