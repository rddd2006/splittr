.PHONY: help dev prod stop logs clean test migrate seed setup

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS=":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start full dev stack (Nginx LB + 3 backends + Redis + Postgres + Frontend)
	docker compose up --build

dev-d: ## Start detached
	docker compose up --build -d

stop: ## Stop all
	docker compose down

stop-v: ## Stop and wipe volumes
	docker compose down -v

logs: ## Tail all logs
	docker compose logs -f

logs-back: ## Tail backend_1 logs
	docker compose logs -f backend_1

prod: ## Start production stack
	docker compose -f docker-compose.prod.yml up --build -d

prod-stop: ## Stop production
	docker compose -f docker-compose.prod.yml down

migrate: ## Run DB migrations
	docker compose exec backend_1 npx prisma migrate dev

migrate-prod: ## Deploy migrations (production)
	docker compose exec backend_1 npx prisma migrate deploy

seed: ## Seed the database
	docker compose exec backend_1 npx prisma db seed

studio: ## Open Prisma Studio
	docker compose exec backend_1 npx prisma studio

test: ## Run all tests
	docker compose run --rm backend_1 npm test

test-unit: ## Backend unit tests only
	docker compose run --rm backend_1 npm run test:unit

test-integration: ## Backend integration tests
	docker compose run --rm backend_1 npm run test:integration

test-frontend: ## Frontend tests
	docker compose run --rm frontend npm test

lint: ## Lint both projects
	docker compose run --rm backend_1 npm run lint
	docker compose run --rm frontend npm run lint

setup: ## First-time setup
	@test -f .env || (cp .env.example .env && echo "✅ .env created — fill in your secrets")
	make dev

clean: ## Remove containers, images, volumes for this project
	docker compose down -v --rmi local
	docker compose -f docker-compose.prod.yml down -v --rmi local 2>/dev/null || true
