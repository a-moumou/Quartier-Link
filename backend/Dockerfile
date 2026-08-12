FROM php:8.4-fpm-alpine

# Extensions PHP nécessaires
RUN apk add --no-cache \
    postgresql-dev \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    unzip \
    git \
  && docker-php-ext-install \
    pdo_pgsql \
    intl \
    mbstring \
    zip

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dépendances Composer d'abord (layer cache)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Tout le code source
COPY . .

RUN composer dump-autoload --optimize \
  && mkdir -p var/cache var/log \
  && chmod -R 777 var \
  && find config src public -type f -exec chmod 644 {} \; \
  && find config src public -type d -exec chmod 755 {} \;

EXPOSE 9000

CMD ["php-fpm"]
