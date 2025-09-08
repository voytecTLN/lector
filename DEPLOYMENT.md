# Deployment Guide - Platforma Lektorów

## 🚀 Production Deployment

### Prerequisites

1. **Server Requirements**
   - Docker & Docker Compose
   - Domain name with SSL certificate
   - At least 2GB RAM, 2 CPU cores
   - 20GB+ storage

2. **Required Services**
   - MySQL 8.0+
   - Redis
   - Nginx
   - ClamAV (for antivirus scanning)

### Quick Deployment

1. **Clone Repository**
   ```bash
   git clone <repository-url> platforma-lektorow
   cd platforma-lektorow
   ```

2. **Environment Configuration**
   ```bash
   cp .env.production.example .env
   # Edit .env with your production settings
   ```

3. **Deploy Application**
   ```bash
   make prod-deploy
   ```

### Manual Deployment Steps

#### 1. Environment Setup

```bash
# Copy production environment
cp .env.production.example .env

# Generate application key
php artisan key:generate

# Configure database, mail, etc.
vim .env
```

#### 2. Build Assets

```bash
# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci --only=production

# Build frontend assets
npm run build
```

#### 3. Laravel Optimization

```bash
# Cache configuration and routes
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Link storage
php artisan storage:link
```

#### 4. Start Production Containers

```bash
# Start with production configuration
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force
```

### SSL Configuration

#### Using Let's Encrypt with Certbot

1. **Install Certbot**
   ```bash
   apt-get update
   apt-get install certbot python3-certbot-nginx
   ```

2. **Generate Certificate**
   ```bash
   certbot --nginx -d your-domain.com
   ```

3. **Update Nginx Configuration**
   ```bash
   # Uncomment SSL section in docker/nginx/prod.conf
   # Add certificate paths
   ```

### Health Checks

The application includes several health check endpoints:

- `GET /health` - Basic health check
- `GET /api/health` - API health check

### Monitoring & Logs

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# View database logs
docker-compose -f docker-compose.prod.yml logs -f database
```

### Backup Strategy

#### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec database mysqldump -u root -p platforma_lektorow > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T database mysql -u root -p platforma_lektorow < backup.sql
```

#### File Backup

```bash
# Backup storage directory
tar -czf storage-backup.tar.gz storage/

# Backup entire application
tar -czf app-backup.tar.gz --exclude=node_modules --exclude=vendor .
```

### Performance Optimization

#### PHP-FPM Tuning

Edit `docker-compose.prod.yml` to add PHP-FPM environment variables:

```yaml
environment:
  - PHP_FPM_PM=dynamic
  - PHP_FPM_PM_MAX_CHILDREN=20
  - PHP_FPM_PM_START_SERVERS=2
  - PHP_FPM_PM_MIN_SPARE_SERVERS=1
  - PHP_FPM_PM_MAX_SPARE_SERVERS=3
```

#### MySQL Tuning

Add MySQL configuration in `docker-compose.prod.yml`:

```yaml
command: >
  --max_connections=200
  --innodb_buffer_pool_size=512M
  --innodb_log_file_size=128M
  --query_cache_type=1
  --query_cache_size=64M
```

### Security Considerations

1. **Environment Variables**
   - Never commit `.env` to repository
   - Use strong passwords and secrets
   - Rotate keys regularly

2. **File Permissions**
   ```bash
   # Set proper permissions
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

3. **Firewall Configuration**
   ```bash
   # Only expose necessary ports
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

### Troubleshooting

#### Common Issues

1. **Storage Permission Errors**
   ```bash
   make fix-permissions
   ```

2. **Cache Issues**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app php artisan cache:clear
   docker-compose -f docker-compose.prod.yml exec app php artisan config:clear
   ```

3. **Database Connection Issues**
   - Check database credentials in `.env`
   - Verify database container is running
   - Check network connectivity

#### Log Locations

- Application logs: `storage/logs/laravel.log`
- Nginx logs: `/var/log/nginx/`
- PHP-FPM logs: `/var/log/php-fpm/`
- System logs: `/var/log/supervisor/`

### Maintenance

#### Regular Tasks

1. **Update Dependencies**
   ```bash
   composer update --no-dev
   npm update
   ```

2. **Clear Old Logs**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app php artisan log:clear
   ```

3. **Database Maintenance**
   ```bash
   docker-compose -f docker-compose.prod.yml exec app php artisan queue:prune-batches
   ```

#### Zero-Downtime Deployment

For zero-downtime deployments, consider using:
- Blue-green deployment strategy
- Load balancers
- Database migration strategies
- Asset versioning

### Support

For deployment issues:
1. Check logs using commands above
2. Verify environment configuration
3. Test database connectivity
4. Check file permissions

Remember to test deployment process on staging environment before production deployment.