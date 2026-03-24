# ==========================================================
# BCX Browser Extension Makefile
# ==========================================================

# --- Apps ---
PNPM_BIN = pnpm

# Default target
.DEFAULT_GOAL := help

.PHONY: help
help: ## Display this help message
	@printf "\033[33mUsage:\033[0m\n  make [target] [arg=\"val\"...]\n\n\033[33mTargets:\033[0m\n"
	@grep -hE '^[a-zA-Z0-9_-]+:.*## .*$$' $(MAKEFILE_LIST) | sort | \
	  awk 'BEGIN {FS = ": ## "}; {printf "  \033[32m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Install dependencies
	$(PNPM_BIN) install

.PHONY: setup
setup: ## Setup development environment
	$(MAKE) install
	$(PNPM_BIN) setup

.PHONY: build
build: ## Build production assets
	$(PNPM_BIN) build

.PHONY: dev
dev: ## Start development server
	$(PNPM_BIN) dev

.PHONY: test
test: ## Run tests
	$(PNPM_BIN) test

.PHONY: format
format: ## Format the code
	$(PNPM_BIN) format

.PHONY: changeset
changeset: ## Add a new changeset
	$(PNPM_BIN) changeset
