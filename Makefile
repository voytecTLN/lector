.PHONY: help setup start stop logs shell npm build migrate artisan fix-permissions composer-update

help:
	@echo "Platforma Lektorów - Development Commands"
	@echo "  make setup         - Complete project setup"
	@echo "  make start         - Start containers"
	@echo "  make stop          - Stop containers"
	@echo "  make logs          - Show logs"
	@echo "  make shell         - PHP shell"
	@echo "  make npm           - Node shell"
	@echo "  make build         - Build assets"
	@echo "  make migrate       - Run migrations"
	@echo "  make fix-permissions - Fix file permissions"
	@echo "  make composer-update - Update composer dependencies"

setup:
	docker-compose up -d --build
	sleep 15
	docker-compose exec app composer install
	docker-compose exec app cp .env.example .env
	docker-compose exec app php artisan key:generate
	docker-compose exec app chmod -R 775 storage bootstrap/cache
	docker-compose exec app chown -R www:www storage bootstrap/cache
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

migrate:
	docker-compose exec app php artisan migrate

artisan:
	docker-compose exec app php artisan $(CMD)

fix-permissions:
	docker-compose exec app chmod -R 775 storage bootstrap/cache
	docker-compose exec app chown -R www:www storage bootstrap/cache

composer-update:
	docker-compose exec app composer update
	docker-compose exec app composer dump-autoload

clear-cache:
	@echo "🧹 Clearing all caches..."
	docker-compose exec app php artisan cache:clear
	docker-compose exec app php artisan config:clear
	docker-compose exec app php artisan route:clear
	docker-compose exec app php artisan view:clear
	docker-compose exec app php artisan event:clear
	docker-compose exec app php artisan clear-compiled
	docker-compose exec app php artisan optimize:clear
	docker-compose exec app composer dump-autoload
	docker-compose exec app rm -rf bootstrap/cache/*
	docker-compose exec app rm -rf storage/framework/cache/*
	docker-compose exec app rm -rf storage/framework/sessions/*
	docker-compose exec app rm -rf storage/framework/views/*
	docker-compose exec app touch bootstrap/cache/.gitkeep
	docker-compose exec app touch storage/framework/cache/.gitkeep
	docker-compose exec app touch storage/framework/sessions/.gitkeep
	docker-compose exec app touch storage/framework/views/.gitkeep
	docker-compose exec app chown -R www:www storage bootstrap/cache
	docker-compose exec app chmod -R 775 storage bootstrap/cache
	@echo "✅ All caches cleared!"