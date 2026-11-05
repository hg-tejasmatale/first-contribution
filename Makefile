# Repo-root shortcuts. The Taskflow app lives in ./taskflow.
.PHONY: test test-backend test-frontend lint

test test-backend test-frontend lint:
	$(MAKE) -C taskflow $@
