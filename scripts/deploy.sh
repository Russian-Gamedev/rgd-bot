#!/usr/bin/env sh
git restore .
git pull
docker compose down
docker compose up -d --build
docker system prune --filter "until=48h" -f