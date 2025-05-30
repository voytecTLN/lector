.PHONY: help setup start stop logs shell npm build

help:
	@echo "Platforma Lektorów - Development Commands"
	@echo "  make setup  - Complete project setup"
	@echo "  make start  - Start containers"
	@echo "  make stop   - Stop containers"
	@echo "  make logs   - Show logs"
	@echo "  make shell  - PHP shell"
	@echo "  make npm    - Node shell"
	@echo "  make build  - Build assets"

setup:
	docker-compose up -d --build
	sleep 15
	docker-compose exec app composer install
	docker-compose exec app cp .env.example .env
	docker-compose exec vite npm install
	@echo "✅ Ready at http://localhost:8000"

start:
	docker-compose up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f app

shell:
	docker-compose exec app bash

npm:
	docker-compose exec vite sh

build:
	docker-compose exec vite npm run build
