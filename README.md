# 🎯 Platforma Lektorów

System zarządzania lekcjami języków obcych z TypeScript + Laravel.

## 📋 Wymagania

- **Docker** & **Docker Compose** - konteneryzacja aplikacji
- **Git** - wersjonowanie kodu
- **Make** - automatyzacja poleceń (opcjonalne, ale zalecane)
- **Terminal/CLI** - do wykonywania poleceń

### Sprawdź instalację:
```bash
docker --version          # >= 20.0
docker-compose --version  # >= 2.0
git --version            # >= 2.0
make --version           # dowolna
```

## 🚀 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd platforma-lektorow

# Setup (first time)
make setup

# Start development
make start

# Access at http://localhost:8000
```

### Bez Make:
```bash
# Setup
docker-compose up -d --build
docker-compose exec app php -r "echo 'APP_KEY=base64:' . base64_encode(random_bytes(32)) . PHP_EOL;"
# Copy output 'APP_KEY=base64:...' and paste to .env file
docker-compose exec app composer install
docker-compose exec vite npm install

# Start
docker-compose up -d
```

## 🛠️ Commands

- `make setup` - Complete setup (Docker + Composer + NPM)
- `make start/stop` - Control containers
- `make logs` - View application logs
- `make shell` - Access PHP container shell
- `make npm` - Access Node.js container shell
- `make build` - Build TypeScript for production

## 🌐 Porty

- **8000** - Laravel aplikacja
- **5173** - Vite dev server (HMR)
- **3306** - MySQL database
- **6379** - Redis cache

## 📁 Structure

- `resources/ts/` - TypeScript source files
- `resources/css/` - Stylesheets (SCSS/CSS)
- `app/` - Laravel backend (Models, Controllers, Services)
- `docker/` - Docker configuration files
- `config/` - Laravel configuration
- `routes/` - API and web routes

## 🔧 Development

### Hot Reload
Vite automatycznie przeładowuje zmiany w TypeScript/CSS.

### Debugging
```bash
# PHP logs
make logs

# Database access
docker-compose exec database mysql -u tutoring_user -p tutoring_platform

# Redis CLI
docker-compose exec redis redis-cli
```

### Code Quality
```bash
# TypeScript check
docker-compose exec vite npm run type-check

# Laravel code style
docker-compose exec app ./vendor/bin/pint
```

## 🎯 TODO

- [ ] Complete TypeScript services layer
- [ ] Add authentication system (Laravel Sanctum)
- [ ] Implement user management (Admin/Tutor/Student)
- [ ] Add lesson scheduling with calendar
- [ ] Video integration (Jitsi Meet)
- [ ] Real-time notifications system
- [ ] Payment integration
- [ ] Multi-language support

## 🐛 Troubleshooting

### Port conflicts:
```bash
# Check what's using ports
lsof -i :8000
lsof -i :3306

# Stop conflicting services
sudo systemctl stop mysql
sudo systemctl stop apache2
```

### Permissions:
```bash
# Fix storage permissions
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

### Clear cache:
```bash
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear

# Delete cache files directly
docker-compose exec app rm -rf storage/framework/cache/*
docker-compose exec app rm -rf bootstrap/cache/*
```


# Komendy do czyszczenia cache w Laravel

## 1. Podstawowe komendy czyszczenia cache

### Wyczyść cache aplikacji
```bash
docker-compose exec app php artisan cache:clear
```

### Wyczyść cache konfiguracji
```bash
docker-compose exec app php artisan config:clear
```

### Wyczyść cache routingu
```bash
docker-compose exec app php artisan route:clear
```

### Wyczyść cache widoków
```bash
docker-compose exec app php artisan view:clear
```

### Wyczyść cache autoloadera Composera
```bash
docker-compose exec app composer dump-autoload
```

## 2. Kompleksowe czyszczenie wszystkich cache'y

### Jedna komenda do wyczyszczenia wszystkiego
```bash
docker-compose exec app php artisan optimize:clear
```

Ta komenda wykonuje:
- `config:clear`
- `cache:clear`
- `route:clear`
- `view:clear`
- `event:clear`

## 3. Dodatkowe komendy

### Wyczyść sesje
```bash
docker-compose exec app rm -rf storage/framework/sessions/*
```

### Wyczyść logi
```bash
docker-compose exec app truncate -s 0 storage/logs/laravel.log
```

### Wyczyść cache Bootstrap
```bash
docker-compose exec app rm -rf bootstrap/cache/*
```

### Wyczyść cache npm/Vite
```bash
docker-compose exec vite npm cache clean --force
docker-compose exec vite rm -rf node_modules/.vite
```

## 4. Skrypt do pełnego czyszczenia (dodaj do Makefile)

```makefile
clear-all:
	docker-compose exec app php artisan optimize:clear
	docker-compose exec app composer dump-autoload
	docker-compose exec app rm -rf storage/framework/cache/*
	docker-compose exec app rm -rf storage/framework/views/*
	docker-compose exec app rm -rf storage/framework/sessions/*
	docker-compose exec app rm -rf bootstrap/cache/*
	docker-compose exec vite rm -rf node_modules/.vite
	@echo "✅ Wszystkie cache wyczyszczone!"
```

## 5. Regeneracja cache po czyszczeniu

### Wygeneruj nowy cache konfiguracji
```bash
docker-compose exec app php artisan config:cache
```

### Wygeneruj nowy cache routingu
```bash
docker-compose exec app php artisan route:cache
```

### Wygeneruj nowy cache widoków
```bash
docker-compose exec app php artisan view:cache
```

### Optymalizuj aplikację (wszystko naraz)
```bash
docker-compose exec app php artisan optimize
```

## 6. Rozwiązywanie problemów

### Jeśli cache nie chce się wyczyścić
```bash
# Nadaj uprawnienia
docker-compose exec app chmod -R 775 storage bootstrap/cache
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache

# Wyczyść ręcznie
docker-compose exec app rm -rf storage/framework/cache/data/*
docker-compose exec app rm -rf storage/framework/views/*
docker-compose exec app rm -rf bootstrap/cache/*
```

### Restart kontenerów po czyszczeniu
```bash
docker-compose restart app
docker-compose restart vite
```

## 7. Użycie w developmencie

Podczas developmentu najlepiej używać:
```bash
# Wyczyść wszystko i zrestartuj
make clear-all && make start
```

lub ręcznie:
```bash
docker-compose exec app php artisan optimize:clear
docker-compose exec app composer dump-autoload
docker-compose restart app
```