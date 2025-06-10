# 🚀 Instrukcje Uruchomienia - Platforma Lektorów

## 📋 Wymagania Wstępne

- **Docker** >= 20.0
- **Docker Compose** >= 2.0
- **Git** >= 2.0
- **Make** (opcjonalnie, ale zalecane)

## 🏗️ Pierwsza Instalacja

### 1. Klonowanie repozytorium
```bash
git clone <repo-url>
cd platforma-lektorow
```

### 2. Konfiguracja środowiska
```bash
# Skopiuj przykładową konfigurację
cp .env.example .env

# Wygeneruj klucz aplikacji (zostanie automatycznie dodany do .env)
make setup
```

### 3. Uruchomienie aplikacji
```bash
# Kompletna instalacja (pierwsza konfiguracja)
make setup

# Lub ręcznie:
docker-compose up -d --build
docker-compose exec app composer install
docker-compose exec app php artisan key:generate
docker-compose exec app chmod -R 775 storage bootstrap/cache
docker-compose exec vite npm install
```

### 4. Migracje i dane testowe
```bash
# Uruchom migracje
docker-compose exec app php artisan migrate

# Zainstaluj dane testowe (WAŻNE dla testowania!)
docker-compose exec app php artisan db:seed
```

## 🔐 Konta Testowe

Po uruchomieniu `php artisan db:seed` będziesz mieć dostęp do następujących kont:

### **Administrator**
- Email: `admin@test.com`
- Hasło: `password`
- Panel: `/admin/dashboard`

### **Moderator**
- Email: `moderator@test.com`
- Hasło: `password`
- Panel: `/moderator/dashboard`

### **Lektor**
- Email: `anna.kowalska@test.com`
- Hasło: `password`
- Panel: `/tutor/dashboard`

### **Student**
- Email: `jan.nowak@test.com`
- Hasło: `password`
- Panel: `/student/dashboard`

## 🌐 Dostępne URL-e

- **Aplikacja główna**: http://localhost:8000
- **Vite dev server** (HMR): http://localhost:5173
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 🧪 Testowanie Funkcjonalności

### 1. Testowanie autentykacji
```bash
# Sprawdź stronę główną
curl http://localhost:8000

# Testuj logowanie przez API
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

### 2. Testowanie dashboardów
1. Idź na http://localhost:8000
2. Kliknij "Zaloguj się"
3. Użyj jednego z kont testowych
4. Zostaniesz automatycznie przekierowany na odpowiedni dashboard

### 3. Testowanie ról i uprawnień
- **Admin**: Dostęp do wszystkich funkcji
- **Moderator**: Dostęp do moderacji treści
- **Tutor**: Panel lektora z harmonogramem
- **Student**: Panel studenta z postępami

### 4. Testowanie rejestracji
1. Idź na http://localhost:8000
2. Kliknij "Dołącz do nas"
3. Wypełnij formularz rejestracji
4. Sprawdź przekierowanie na odpowiedni dashboard

## 🛠️ Przydatne Komendy

### Docker Management
```bash
# Uruchomienie aplikacji
make start

# Zatrzymanie
make stop

# Logi aplikacji
make logs

# Shell PHP
make shell

# Shell Node.js
make npm

# Build assets
make build
```

### Laravel Commands
```bash
# Artisan commands
make artisan migrate
make artisan route:list
make artisan tinker

# Clear cache
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan route:clear
```

### Frontend Development
```bash
# Watch dla zmian TypeScript/CSS
docker-compose exec vite npm run dev

# Build production
docker-compose exec vite npm run build

# Type checking
docker-compose exec vite npm run type-check
```

## 🐛 Rozwiązywanie Problemów

### Problem: Porty są zajęte
```bash
# Sprawdź co używa portów
lsof -i :8000
lsof -i :3306

# Zatrzymaj konfliktujące usługi
sudo systemctl stop mysql
sudo systemctl stop apache2
```

### Problem: Błędy uprawnień
```bash
# Napraw uprawnienia storage
make fix-permissions

# Lub ręcznie:
docker-compose exec app chmod -R 775 storage bootstrap/cache
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
```

### Problem: Błędy bazy danych
```bash
# Restart bazy danych
docker-compose restart database

# Sprawdź status
docker-compose exec database mysql -u tutoring_user -p tutoring_platform -e "SHOW TABLES;"

# Reset bazy (UWAGA: usuwa wszystkie dane!)
docker-compose exec app php artisan migrate:fresh --seed
```

### Problem: Assets nie ładują się
```bash
# Rebuild assets
docker-compose exec vite npm run build

# Sprawdź czy Vite działa
docker-compose logs vite

# Restart Vite
docker-compose restart vite
```

## 📊 Monitoring i Debugging

### Sprawdzenie statusu
```bash
# Status wszystkich kontenerów
docker-compose ps

# Health check
curl http://localhost:8000/health

# API status
curl http://localhost:8000/api/health
```

### Logi
```bash
# Logi aplikacji
docker-compose logs app

# Logi bazy danych
docker-compose logs database

# Logi Vite
docker-compose logs vite

# Wszystkie logi
docker-compose logs -f
```

## 🔄 Resetowanie Środowiska

### Miękki reset (zachowuje dane)
```bash
docker-compose down
docker-compose up -d
```

### Twardy reset (usuwa wszystko)
```bash
docker-compose down -v
docker-compose build --no-cache
make setup
```

## 📝 Struktura Bazy Danych

Po seedowaniu masz:
- **2 administratorów** (pełne uprawnienia)
- **2 moderatorów** (moderacja treści)
- **4 lektorów** z profilami (różne języki i specjalizacje)
- **6 studentów** z profilami (różne poziomy i cele)

## 🎯 Następne Kroki

1. **Przetestuj wszystkie dashboardy** - sprawdź czy każda rola ma dostęp do odpowiednich funkcji
2. **Sprawdź system autentykacji** - logowanie, rejestracja, wylogowanie
3. **Testuj responsive design** - wszystko powinno działać na mobile
4. **Sprawdź API endpoints** - użyj kont testowych do sprawdzenia API

## 💡 Tips

- Użyj `make help` aby zobaczyć wszystkie dostępne komendy
- Zawsze uruchamiaj `php artisan db:seed` po `migrate` dla danych testowych
- W trybie development Vite automatycznie odświeża zmiany w TypeScript/CSS
- Logi Laravel znajdują się w `storage/logs/laravel.log`

---
