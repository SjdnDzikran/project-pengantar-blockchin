#!/bin/bash

# Database Initialization Script
# This script creates the PostgreSQL database and runs migrations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$PROJECT_ROOT/backend/database/migrations/001_initial_schema.sql"
ENV_FILE="$PROJECT_ROOT/backend/.env"

echo "=========================================="
echo "Database Initialization"
echo "=========================================="

# Load environment variables from backend .env file if it exists
if [ -f "$ENV_FILE" ]; then
    echo ""
    echo "Loading configuration from: $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | grep -E '^DB_' | xargs)
fi

# Parse connection string if DB_HOST is a full PostgreSQL URL
if [[ "$DB_HOST" == postgresql://* ]] || [[ "$DB_HOST" == postgres://* ]]; then
    echo ""
    echo "⚠ Remote PostgreSQL connection string detected!"
    echo "  Skipping local database initialization."
    echo "  Make sure your remote database is already set up with the schema."
    echo ""
    echo "To initialize your remote database, run the migration manually:"
    echo "  psql \"$DB_HOST\" -f $MIGRATION_FILE"
    echo ""
    echo "Or install postgresql-client and run this script again:"
    echo "  sudo apt-get install postgresql-client"
    echo ""
    exit 0
fi

# Default PostgreSQL connection parameters (fallback if not in .env)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-company_review_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo ""
echo "Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Step 1: Check PostgreSQL connection
echo "[1/3] Checking PostgreSQL connection..."

if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw template1; then
    echo "✗ Cannot connect to PostgreSQL"
    echo "  Please ensure PostgreSQL is running"
    exit 1
fi

echo "✓ PostgreSQL connection successful"

# Step 2: Create database if not exists
echo ""
echo "[2/3] Creating database..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Database '$DB_NAME' ready"
else
    echo "✗ Failed to create database"
    exit 1
fi

# Step 3: Run migrations
echo ""
echo "[3/3] Running migrations..."

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "✗ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Failed to run migrations"
    exit 1
fi

echo ""
echo "=========================================="
echo "Database Initialization Complete!"
echo "=========================================="
echo ""
echo "Database is ready to use."
echo ""
