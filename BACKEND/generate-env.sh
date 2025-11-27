#!/bin/bash

# Script per generare automaticamente il file .env con tutti i secret necessari

echo "Generazione del file .env..."

# Genera tutti i secret necessari
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
API_TOKEN_SALT=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
APP_KEY_1=$(openssl rand -base64 32)
APP_KEY_2=$(openssl rand -base64 32)
APP_KEY_3=$(openssl rand -base64 32)
APP_KEY_4=$(openssl rand -base64 32)

# Crea il file .env
cat > .env << EOF
# Admin JWT Secret - Obbligatorio per l'autenticazione admin
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}

# API Token Salt - Obbligatorio per la generazione dei token API
API_TOKEN_SALT=${API_TOKEN_SALT}

# Transfer Token Salt - Obbligatorio per i transfer token
TRANSFER_TOKEN_SALT=${TRANSFER_TOKEN_SALT}

# Encryption Key - Obbligatorio per la crittografia
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# App Keys - Obbligatorio, array di chiavi separate da virgola
APP_KEYS=${APP_KEY_1},${APP_KEY_2},${APP_KEY_3},${APP_KEY_4}

# Server Configuration (opzionali)
HOST=0.0.0.0
PORT=1337

# Database Configuration (opzionali - default: SQLite)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Se usi MySQL o PostgreSQL, decommenta e configura:
# DATABASE_HOST=localhost
# DATABASE_PORT=3306
# DATABASE_NAME=strapi
# DATABASE_USERNAME=strapi
# DATABASE_PASSWORD=strapi
# DATABASE_SSL=false
EOF

echo "✅ File .env creato con successo!"
echo ""
echo "⚠️  IMPORTANTE: Il file .env contiene informazioni sensibili."
echo "   Assicurati che sia nel .gitignore e non committarlo nel repository."

