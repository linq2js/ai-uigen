#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

cd "$(dirname "$0")/.."

# 1. Check/install Docker
if command -v docker &>/dev/null; then
  info "Docker is installed"
else
  warn "Docker not found — installing via Homebrew..."
  if ! command -v brew &>/dev/null; then
    error "Homebrew is required to install Docker. Install it from https://brew.sh"
  fi
  brew install --cask docker
  info "Docker Desktop installed"
fi

# 2. Start Docker Desktop if daemon isn't running
if ! docker info &>/dev/null; then
  warn "Docker daemon not running — starting Docker Desktop..."
  open /Applications/Docker.app
  echo -n "  Waiting for Docker to start"
  for i in $(seq 1 30); do
    if docker info &>/dev/null; then
      echo ""
      info "Docker is ready"
      break
    fi
    echo -n "."
    sleep 2
  done
  if ! docker info &>/dev/null; then
    error "Docker failed to start after 60s. Please start Docker Desktop manually and re-run this script."
  fi
else
  info "Docker daemon is running"
fi

# 3. Copy .env if missing
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    warn "Created .env from .env.example — edit it to add your ANTHROPIC_API_KEY"
  else
    error ".env.example not found"
  fi
else
  info ".env already exists"
fi

# 4. Install dependencies
info "Installing dependencies..."
pnpm install

# 5. Start Postgres container
info "Starting Postgres container..."
docker compose up -d

echo -n "  Waiting for Postgres to accept connections"
for i in $(seq 1 15); do
  if docker exec artifex-db pg_isready -U postgres &>/dev/null; then
    echo ""
    info "Postgres is ready"
    break
  fi
  echo -n "."
  sleep 1
done
if ! docker exec artifex-db pg_isready -U postgres &>/dev/null; then
  error "Postgres failed to start. Check: docker logs artifex-db"
fi

# 6. Run Prisma migrations
info "Running database migrations..."
pnpm prisma migrate dev

echo ""
info "Setup complete! Run 'pnpm dev' to start the app."
