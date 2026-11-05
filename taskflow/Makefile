# Test commands for Taskflow.
# From this directory: make test | make test-backend | make test-frontend

.PHONY: test test-backend test-frontend lint

# Invoked after `cd backend`, so the venv path is relative to that directory.
PY := $(if $(wildcard backend/.venv/bin/python),../backend/.venv/bin/python,python3)

test: test-backend test-frontend

test-backend:
	cd backend && $(PY) -m pytest -q

test-frontend:
	cd frontend && npm test

lint:
	cd backend && $(PY) -m ruff check .
