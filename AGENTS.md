<!-- markdownlint-disable MD013 MD025 -->

# AGENTS.md

Guidance for AI coding agents in **Tasking Manager**.
Human maintainers are accountable for all merged changes.

---

## Project

The Tasking Manager (tasks.hotosm.org) coordinates humanitarian OpenStreetMap
mapping: project managers split an area into tasks, mappers claim and map
them, and validators review the results. It is HOT's oldest and
highest-traffic tool, with a large existing database and an active user
community - **behaviour changes affect live mapping campaigns.**

**Stack:** Python 3.10-3.11 / FastAPI / SQLAlchemy + GeoAlchemy2 / Alembic /
PostgreSQL + PostGIS / asyncpg / APScheduler / React (CRA + craco) with yarn /
Docker Compose / black / pre-commit

---

## Required Reading Order

1. `docs/developers/development-setup.md` - how to get a working environment.
2. `docs/developers/contributing.md` and
   `docs/developers/contributing-guidelines.md` - contribution rules,
   including AI tool usage.
3. `docs/developers/submit-pr.md` and `docs/developers/review-pr.md`.
4. `docs/developers/tmschema.md` - the database schema.
5. `docs/dataflow.md` - how data moves through the system.

---

## Structure

```text
backend/api/           # FastAPI route handlers, grouped by resource
backend/services/      # business logic - the layer that owns behaviour
backend/models/        # SQLAlchemy models (postgis) and DTOs
backend/config.py      # configuration
backend/cron_jobs.py   # scheduled jobs (APScheduler)
migrations/            # Alembic migrations
tests/backend/         # backend tests (unittest)
frontend/src/          # React app
docs/                  # MkDocs documentation
scripts/               # operational scripts
```

Layering: routes in `backend/api/` stay thin and delegate to
`backend/services/`. Put behaviour in the service layer, not the route.

---

## Commands

Everything runs through Docker Compose via the Makefile:

```bash
make build          # build backend and frontend images
make up             # create the tm-web network if needed and start the stack
make down           # stop the stack
make list           # docker-compose ps
make tests          # frontend and backend tests
make test-backend   # python -m unittest discover tests/backend
make test-frontend  # CI=true npm test in the frontend container
make refresh-frontend        # rebuild the frontend bundle in the container
make refresh-translatables   # yarn build-locales
make apidocs                 # doxygen API docs
```

Translations are pulled from Transifex (`make refresh-translations`) - do not
hand-edit translation files.

Pre-commit enforces `black`, `commitizen`, whitespace fixes, and secret
detection (`detect-aws-credentials`, `detect-private-key`):

```bash
pre-commit install
```

---

## Decisions Already Made

- **Dependencies are pinned exactly** in `pyproject.toml` and Python is
  constrained to `>=3.10,<=3.11`. A dependency or runtime bump is its own PR,
  never a drive-by.
- **Business logic lives in `backend/services/`.** Routes validate and
  delegate.
- **Schema changes go through Alembic.** Never edit an applied migration, and
  never change a model without the matching migration.
- **The production database is large and old.** Migrations must be safe on a
  big table: no unbounded rewrites, and no locking operations without saying so
  explicitly in the PR.
- **Translations live in Transifex.**
- **Frontend is Create React App via craco.** Do not migrate the build tooling
  as part of another change.

Approaches previously tried and rejected are not recorded in-repo. Ask a
maintainer rather than assuming a design is accidental.

---

## Where AI Help Is Welcome

- Tests for existing behaviour
- Documentation and docstrings
- Frontend components and styling
- Tightly scoped bug fixes with a reproducing test

## Where AI Must Not Act Unsupervised

- Authentication, OAuth, and permissions (`backend/api/`, `backend/services/`
  auth paths)
- Alembic migrations
- Task locking, task state transitions, and validation workflow - this is the
  core of the product and easy to break subtly
- Project splitting and geometry handling
- Scheduled jobs (`backend/cron_jobs.py`)
- CI workflows and deploy configuration

---

## Coding Standards

- Format with `black`; match the surrounding style otherwise.
- Use the service layer; do not reach into models from a route.
- Async: use `asyncpg`/async SQLAlchemy patterns already present, and do not
  block the event loop.
- Geospatial correctness matters: be explicit about CRS and do not assume
  polygons are well-behaved.
- Never string-interpolate user input into SQL.

---

## Testing Standards

- New behaviour needs a test under `tests/backend/` (unittest) or the matching
  frontend test.
- Run `make tests` with the stack up. If you could not run them, say so rather
  than reporting a pass you did not see.
- Never weaken or skip a failing test to make a change pass.

---

## Anti-Patterns

- Editing applied migrations
- Hand-editing translation files or generated assets
- Committing secrets; `example.env` is the reference
- Broad reformat-the-world diffs mixed into a behavioural change
- Adding a dependency without pinning it

---

## Workflow

1. Read the route, the service, and the tests before changing code.
2. Keep the diff scoped to the task; raise anything else separately.
3. Run the relevant tests and pre-commit; state exactly what you ran.
4. Call out anything that affects live mapping projects or the database
   explicitly in the PR description.

When uncertain, ask instead of assuming.

---

## Responsible AI Contribution Policy

- Org guidance for AI-assisted contributions: <https://responsibleai.guide>
- Declare the AI assistance level (0-5) in the PR template honestly. Never
  lower the declared level to get a PR reviewed.
- If nobody has read the result, that is level 5: open the PR as a draft.
- Do not work on issues labelled `good first issue` - they exist for humans.
- A human is accountable for every merged change.
