Masz rację! Artifact nie został zaktualizowany, ponieważ pierwotnie nie był plikiem README.md, tylko skryptem bash.

Oto zaktualizowany README.md do skopiowania:

```markdown
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
```

Skopiuj to i zastąp zawartość pliku `README.md` w swoim projekcie! 📝