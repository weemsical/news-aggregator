#!/usr/bin/env bash
set -euo pipefail

# Dev setup script for I Call BullShit
# Starts a Postgres container (if Docker is available) and launches the app.

DB_NAME="icbs"
DB_USER="postgres"
DB_PASS="postgres"
DB_PORT="5432"
CONTAINER_NAME="icbs-postgres"

echo "=== I Call BullShit — Dev Setup ==="
echo ""

# --- Step 1: Database ---
if command -v docker &>/dev/null && docker info &>/dev/null; then
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✓ Postgres container '${CONTAINER_NAME}' is already running."
  elif docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Starting existing Postgres container..."
    docker start "${CONTAINER_NAME}"
    sleep 2
    echo "✓ Postgres container started."
  else
    echo "Creating Postgres container..."
    docker run --name "${CONTAINER_NAME}" \
      -e POSTGRES_PASSWORD="${DB_PASS}" \
      -e POSTGRES_DB="${DB_NAME}" \
      -p "${DB_PORT}:5432" \
      -d postgres:16
    sleep 3
    echo "✓ Postgres container created and running."
  fi
  export DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"
else
  if command -v docker &>/dev/null; then
    echo "ERROR: Docker is installed but the daemon is not running."
    echo "Please start Docker Desktop and try again."
  else
    echo "Docker not found. Make sure Postgres is running and set DATABASE_URL."
    echo "Example: export DATABASE_URL=postgres://localhost:5432/icbs"
  fi
  if [ -z "${DATABASE_URL:-}" ]; then
    echo ""
    echo "ERROR: DATABASE_URL is not set and Postgres is not available."
    echo "Either start Docker Desktop or start Postgres manually and set DATABASE_URL."
    exit 1
  fi
fi

# --- Step 2: Environment ---
export JWT_SECRET="${JWT_SECRET:-dev-secret}"
export ADMIN_EMAILS="${ADMIN_EMAILS:-admin@example.com}"

echo ""
echo "Environment:"
echo "  DATABASE_URL  = ${DATABASE_URL}"
echo "  JWT_SECRET    = ${JWT_SECRET}"
echo "  ADMIN_EMAILS  = ${ADMIN_EMAILS}"
echo ""

# --- Step 3: Dependencies ---
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# --- Step 4: Start ---
echo "Starting API server + Vite dev server..."
echo "  API:      http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo ""

DATABASE_URL="${DATABASE_URL}" \
JWT_SECRET="${JWT_SECRET}" \
ADMIN_EMAILS="${ADMIN_EMAILS}" \
npx concurrently \
  --names "api,vite" \
  --prefix-colors "blue,green" \
  "npx tsx src/server/index.ts" \
  "npx vite"
