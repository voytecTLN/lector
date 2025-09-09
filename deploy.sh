#!/bin/bash
# deploy.sh - super-prosta wersja na CyberFolks bez shared i releases

set -e

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ustawienia
PUBLIC_HTML="/home/$(whoami)/domains/telenauka.pl/public_html"
REPO_URL="https://github.com/voytecTLN/lector.git"

echo -e "${GREEN}🚀 DEPLOY STARTED${NC}"

# Parametry
if [ -z "$1" ]; then
    echo -e "${RED}❌ Użycie: $0 <tag-or-branch> [--migrate]${NC}"
    exit 1
fi

TAG_OR_BRANCH=$1
RUN_MIGRATIONS=false

if [ "$2" = "--migrate" ]; then
    RUN_MIGRATIONS=true
fi

# -------------------------------------------
echo -e "${GREEN}📂 Przechodzę do katalogu public_html${NC}"
cd "$PUBLIC_HTML"

# -------------------------------------------
# GIT SETUP
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🟡 Brak .git - klonuję repo...${NC}"
    rm -rf * .[^.]* || true
    git clone $REPO_URL ./
fi

echo -e "${GREEN}📦 Pobieram repozytorium...${NC}"
git fetch --all --tags --prune

echo -e "${GREEN}🌀 Resetuję lokalny stan...${NC}"
git reset --hard
#git clean -fd

echo -e "${GREEN}✅ Checkout branch/tag: $TAG_OR_BRANCH${NC}"
git checkout $TAG_OR_BRANCH
git pull origin $TAG_OR_BRANCH

# -------------------------------------------
echo -e "${GREEN}✅ Repozytorium zaktualizowane${NC}"

# -------------------------------------------
echo -e "${GREEN}📦 Sprawdzam composer.phar${NC}"
if [ ! -f "composer.phar" ]; then
    echo -e "${YELLOW}⚠️  composer.phar nie znaleziony – pobieram...${NC}"
    curl -sS https://getcomposer.org/installer | php
    echo -e "${GREEN}✅ composer.phar pobrany${NC}"
else
    echo -e "${GREEN}✅ composer.phar już istnieje${NC}"
fi

echo -e "${GREEN}📚 Instaluję composer dependencies${NC}"
php composer.phar install --no-dev --optimize-autoloader

# -------------------------------------------
echo -e "${GREEN}📦 NPM install & build${NC}"
npm install
npm run build

# -------------------------------------------
echo -e "${GREEN}📂 Kopiuję zawartość katalogu public/ do root (public_html)${NC}"
# Usuń stary storage link jeśli istnieje
rm -f storage
# Kopiuj wszystko z public/ oprócz storage (żeby uniknąć konfliktu)
find public/ -maxdepth 1 -not -name 'storage' -not -name 'public' -exec cp -r {} ./ \;

echo -e "${GREEN}🔗 Tworzę symbolic link do storage${NC}"
ln -sf storage/app/public storage

echo -e "${GREEN}🔧 Poprawiam index.php (ścieżki produkcyjne)${NC}"
sed -i "s|__DIR__.'/../vendor/autoload.php'|__DIR__.'/vendor/autoload.php'|g" index.php
sed -i "s|__DIR__.'/../bootstrap/app.php'|__DIR__.'/bootstrap/app.php'|g" index.php
sed -i "s|__DIR__.'/../storage/framework/maintenance.php'|__DIR__.'/storage/framework/maintenance.php'|g" index.php

# -------------------------------------------
if [ "$RUN_MIGRATIONS" = true ]; then
    echo -e "${GREEN}🗄️ Uruchamiam migracje...${NC}"
    php artisan migrate --force
fi

# -------------------------------------------
echo -e "${GREEN}🧹 Cache i optimize${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

echo -e "${GREEN}✅ DEPLOY ZAKOŃCZONY!${NC}"
