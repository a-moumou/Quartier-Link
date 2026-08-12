FROM php:8.4-cli-alpine

# PHP (pour PHPUnit) + Node (pour Vitest et Newman)
RUN apk add --no-cache \
    postgresql-dev \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    unzip \
    git \
    bash \
    rsync \
    curl \
    nodejs \
    npm \
  && docker-php-ext-install \
    pdo_pgsql \
    intl \
    mbstring \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Outils de rapport globaux (indépendants du repo)
RUN npm install -g newman newman-reporter-htmlextra serve

WORKDIR /workspace

COPY run-tests.sh /usr/local/bin/run-tests.sh
RUN chmod +x /usr/local/bin/run-tests.sh

EXPOSE 8090
CMD ["/usr/local/bin/run-tests.sh"]
