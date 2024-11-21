.PHONY: build up down dev test logs clean

# Docker compose commands
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

# Development commands
dev:
	docker compose up app

test:
	docker compose run --rm app bun test

logs:
	docker compose logs -f

# Clean up commands
clean:
	docker compose down -v
	rm -rf node_modules
	rm -rf dist

# Install dependencies
install:
	bun install

# Run tests locally
test-local:
	bun test

# Run development server locally
dev-local:
	bun run src/index.ts 