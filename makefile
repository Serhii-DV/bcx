# ==========================================================
# BCX Browser Extension Makefile
# ==========================================================

# --- Apps ---
RUN        = pnpm

# Default target
.DEFAULT_GOAL := help

## help: Display this help message
.PHONY: help
help:
	@echo "Available commands:"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /' | column -t -s ':'

## install: Install dependencies
.PHONY: install
install:
	$(RUN) install

## setup: Setup development environment
.PHONY: setup
setup: install
	$(RUN) setup

## build: Build production assets
.PHONY: build
build:
	$(RUN) build

## dev: Start development server
.PHONY: dev
dev:
	$(RUN) dev

## test: Run tests
.PHONY: test
test:
	$(RUN) test
