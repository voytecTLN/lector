.PHONY: help setup start stop logs shell npm build migrate artisan fix-permissions composer-update clear-cache test dev prod prod-up prod-down prod-deploy

help:
	@echo "Language Learning Platform - Development Commands"
	@echo "  make setup         - Complete project setup (Docker + dependencies)"
	@echo "  make start         - Start all containers"
	@echo "  make stop          - Stop all containers"
	@echo "  make logs          - Show application logs"
	@echo "  make shell         - Access PHP container shell"
	@echo "  make npm           - Access Node.js container shell"
	@echo "  make build         - Build production assets"
	@echo "  make dev           - Start Vite dev server with HMR"
	@echo "  make migrate       - Run database migrations"
	@echo "  make seed          - Seed database with test data"
	@echo "  make fresh         - Fresh migration with seeders"
	@echo "  make fix-permissions - Fix storage permissions"
	@echo "  make composer-update - Update PHP dependencies"
	@echo "  make clear-cache   - Clear all Laravel caches"
	@echo "  make test          - Run tests"
	@echo "  make prod          - Build for production"
	@echo "  make prod-up       - Start production containers"
	@echo "  make prod-down     - Stop production containers"
	@echo "  make prod-deploy   - Full production deployment"

setup:
	docker-compose up -d --build
	sleep 15
	docker-compose exec app composer install
	docker-compose exec app chmod -R 775 storage bootstrap/cache
	docker-compose exec app chown -R www:www storage bootstrap/cache
	docker-compose exec vite npm install
	#docker-compose exec app php artisan migrate
	#docker-compose exec app php artisan migrate --seed
	@echo "✅ Setup complete! Access the app at http://localhost:8000"
	@echo "📧 Test credentials in README.md"

start:
	docker-compose up -d
	@echo "✅ Containers started"
	@echo "🌐 App: http://localhost:8000"
	@echo "📧 PHPMyAdmin: http://localhost:8080"

stop:
	docker-compose down

logs:
	docker-compose logs -f app

shell:
	docker-compose exec app bash

npm:
	docker-compose exec vite sh

dev:
	docker-compose exec vite npm run dev

build:
	docker-compose exec vite npm run build

migrate:
	docker-compose exec app php artisan migrate

seed:
	docker-compose exec app php artisan db:seed

fresh:
	docker-compose exec app php artisan migrate:fresh --seed

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

test:
	docker-compose exec app php artisan test

prod:
	docker-compose exec vite npm run build
	docker-compose exec app php artisan config:cache
	docker-compose exec app php artisan route:cache
	docker-compose exec app php artisan view:cache
	@echo "✅ Production build complete!"

# Production deployment commands
prod-up:
	@echo "🚀 Starting production containers..."
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ Production containers started!"

prod-down:
	@echo "🛑 Stopping production containers..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production containers stopped!"

prod-deploy:
	@echo "🚀 Starting full production deployment..."
	@echo "📦 Building production assets..."
	npm run build
	@echo "🔧 Optimizing Laravel..."
	php artisan config:cache
	php artisan route:cache  
	php artisan view:cache
	php artisan storage:link
	@echo "🐳 Building and starting containers..."
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "⏳ Waiting for containers to be ready..."
	sleep 30
	@echo "🗄️ Running migrations..."
	docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force
	@echo "✅ Production deployment complete!"
	@echo "🌐 Application available at: http://localhost"