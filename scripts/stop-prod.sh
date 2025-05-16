#!/bin/bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
