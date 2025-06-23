# 🎓 Language Learning Platform

A modern single-page application (SPA) for managing language lessons, built with Laravel + TypeScript, powered by Docker.

---

## 📋 Requirements

- **Docker** & **Docker Compose** - containerization
- **Git** - version control
- **Make** - command automation (optional but recommended)
- **Terminal/CLI** - for running commands

### Version Check:
```bash
docker --version           # >= 20.0
docker-compose --version   # >= 2.0
git --version              # >= 2.0
make --version             # any version
````

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd platforma-lektorow

# First-time setup
make setup

# Start development environment
make start

# Visit the app
http://localhost:8000
```

### Without Make:

```bash
docker-compose up -d --build
docker-compose exec app composer install
docker-compose exec app cp .env.example .env
docker-compose exec app php artisan key:generate
docker-compose exec vite npm install
docker-compose exec app php artisan migrate --seed
```

---

## 🔐 Test Accounts

Available after seeding:

| Role      | Email                                                   | Password | Access Level              |
| --------- | ------------------------------------------------------- | -------- | ------------------------- |
| Admin     | [admin@test.com](mailto:admin@test.com)                 | password | Full system control       |
| Moderator | [moderator@test.com](mailto:moderator@test.com)         | password | User & content moderation |
| Tutor     | [anna.kowalska@test.com](mailto:anna.kowalska@test.com) | password | Teaching tools & calendar |
| Student   | [jan.nowak@test.com](mailto:jan.nowak@test.com)         | password | Lessons & progress        |

---

## 🛠️ Development Commands

```bash
make help            # List all commands
make setup           # Full initial setup
make start/stop      # Start or stop containers
make logs            # View application logs
make shell           # Access PHP container shell
make npm             # Access Node.js container shell
make dev             # Start Vite dev server
make build           # Build frontend for production
make migrate         # Run database migrations
make seed            # Seed the database
make fresh           # Fresh install + seeding
make clear-cache     # Clear all Laravel caches
make clear-all       # Full cache wipe (Laravel + Vite)
make test            # Run tests
make fix-permissions # Set correct storage permissions
```

---

## 🌐 Access Points

* **App**: [http://localhost:8000](http://localhost:8000)
* **Vite Dev Server**: [http://localhost:5173](http://localhost:5173)
* **PHPMyAdmin**: [http://localhost:8080](http://localhost:8080) (`root` / `root_secret`)
* **MySQL**: `localhost:3306`
* **Redis**: `localhost:6379`

---

## 🔧 Development Features

### 🔁 Hot Reload

```bash
make dev
```

Vite automatically reloads changes in TypeScript and CSS.

### 🔍 Debug Mode Detection (via Vite)

```ts
if (import.meta.env.DEV) {
    console.log("Development mode")
}

if (import.meta.env.PROD) {
    console.log("Production mode")
}
```

### 🔒 Dev-Only Pages

Example in `routes.ts`:

```ts
{
    path: '/dev/api-test',
    component: () => import('@/components/dev/ApiTestPage'),
    meta: {
        requiresDevelopment: true
    }
}
```

### Development-Only Security Page

Access: `http://localhost:8000/#/security-test`
Hidden in production builds automatically.

---

## 📁 Project Structure

```
├── app/                  # Laravel backend
│   ├── Http/Controllers/ # API controllers
│   └── Services/         # Business logic
├── resources/
│   ├── ts/               # TypeScript SPA
│   ├── css/              # SCSS/CSS styles
│   └── views/            # Blade templates (fallback)
├── routes/               # Laravel routes
├── docker/               # Docker configs
```

---

## 🧪 Testing & Code Quality

```bash
make test                        # Run PHP unit tests
docker-compose exec vite npm run type-check   # TypeScript type check
docker-compose exec app ./vendor/bin/pint     # Laravel code style check
```

---

## 🧼 Cache & Cleanup

### Laravel Cache

```bash
make clear-cache  # Clears config, route, view, app cache
```

### Full Cache Wipe (Laravel + Vite)

```bash
make clear-all
```

This clears:

* Laravel caches (config, route, view)
* Composer autoload
* Session files
* Logs
* Vite cache

### Manual Commands (Optional)

```bash
# Laravel
docker-compose exec app php artisan optimize:clear
docker-compose exec app composer dump-autoload

# Delete sessions, logs, cache
docker-compose exec app rm -rf storage/framework/{cache,views,sessions}/*
docker-compose exec app rm -rf bootstrap/cache/*

# Vite
docker-compose exec vite npm cache clean --force
docker-compose exec vite rm -rf node_modules/.vite
```

### Cache Rebuild

```bash
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

---

## 🐞 Troubleshooting

### Port Conflicts

```bash
lsof -i :8000
lsof -i :3306

sudo systemctl stop apache2
sudo systemctl stop mysql
```

### File Permissions

```bash
make fix-permissions
```

Or manually:

```bash
docker-compose exec app chmod -R 775 storage bootstrap/cache
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
```

### Restarting

```bash
docker-compose restart app
docker-compose restart vite
```

---

## 🚀 Production Deployment

1. Build frontend:

```bash
make prod
```

2. Set `.env`:

```
APP_ENV=production
APP_DEBUG=false
```

3. Optimize:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📝 API Documentation

Follows REST conventions:

* `POST /api/auth/login` - Log in
* `GET /api/auth/me` - Current user
* `GET /api/students` - List students

Authentication uses Laravel Sanctum (Bearer tokens).

---

## 🤝 Contributing

1. Fork & create feature branch
2. Make changes and test
3. Submit a pull request

---

## 📄 License

[MIT License](LICENSE)

