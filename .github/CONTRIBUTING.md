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

- You should follow the [DIRAC Coding Conventions](https://dirac.readthedocs.io/en/latest/DeveloperGuide/CodingConvention/index.html).
- Your code should not introduce any new pylint warnings, and fix as many existing warnings as possible. See [Running the pylint check locally](#running-the-pylint-check-locally) for how to run it with the same environment as the CI.
- Use autopep8

## Running the pylint check locally

The CI `pyLint` job (`.github/workflows/codestyle.yml`) runs in a locked
[pixi](https://pixi.sh) environment declared in `pixi.toml` and pinned in the
committed `pixi.lock`: DIRAC's runtime dependencies (from the `integration`
branch, which this branch lints against) plus pylint.

1. [Install pixi](https://pixi.sh/latest/#installation), then from the root of
   this repository:

   ```bash
   pixi install
   ```

2. Check out DIRAC (`integration` branch) next to this repository and install
   it, including its `dirac-common` subpackage (which holds `DIRACCommon`),
   into the pixi environment. `--no-deps` because the dependencies come from
   the pixi environment; `--no-build-isolation` so the build backends come
   from the lock file too:

   ```bash
   git clone https://github.com/DIRACGrid/DIRAC.git ../DIRAC
   pixi run python -m pip install --no-deps --no-build-isolation -e ../DIRAC/dirac-common -e ../DIRAC
   ```

3. Run the linter exactly as the CI does:

   ```bash
   pixi run pylint -E src/WebAppDIRAC
   ```

### Updating dependencies

Dependencies are declared in `pixi.toml`; `pixi.lock` is committed and kept up
to date by Renovate, so do not hand-edit the lock file. If you change
`pixi.toml`, run `pixi lock` and commit the updated `pixi.lock` together with
your change. Note that `exclude-newer = "7d"` in `pixi.toml` enforces a 7-day
release-age cooldown at solve time, so a package version released less than a
week ago is not picked up.

## Git workflow

The DIRAC Development Model is described in the [documentation](https://dirac.readthedocs.io/en/latest/DeveloperGuide/DevelopmentModel/index.html) with detailed instructions on the git workflow listed [here](https://dirac.readthedocs.io/en/latest/DeveloperGuide/DevelopmentModel/ContributingCode/index.html). For additional help on the git(hub) workflow please see this [tutorial](https://github.com/andresailer/tutorial#working-updating-pushing).
