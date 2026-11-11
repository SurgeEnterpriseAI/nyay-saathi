#!/bin/bash
# Deploy the committed HEAD to a Linux server with Docker over SSH.
# Usage: HOST=myserver DIR=/srv/apps/nyay-saathi PORT=6690 bash deploy/server-deploy.sh
# The server keeps its own .env.production (create it from .env.example first) and, if it needs one,
# a docker-compose.server.yml override (e.g. network_mode: bridge when Docker's address pools are full).
set -euo pipefail
cd "$(dirname "$0")/.."
: "${HOST:?set HOST to your ssh host}"
DIR=${DIR:-/srv/apps/nyay-saathi}
PORT=${PORT:-6690}
SHA=$(git rev-parse --short=8 HEAD)
echo "shipping $SHA to $HOST:$DIR"
git archive --format=tar HEAD | ssh "$HOST" "mkdir -p $DIR && cd $DIR && find . -mindepth 1 -maxdepth 1 ! -name .env.production ! -name docker-compose.server.yml -exec rm -rf {} + && tar -xf - && echo $SHA > REVISION"
ssh "$HOST" "cd $DIR && test -f .env.production && HOST_PORT=$PORT docker compose -f docker-compose.prod.yml \$(test -f docker-compose.server.yml && echo -f docker-compose.server.yml) up -d --build && docker image prune -f >/dev/null"
for i in $(seq 1 30); do
  code=$(ssh "$HOST" "curl -s -o /dev/null -w '%{http_code}' -m 5 http://127.0.0.1:$PORT/healthz" || true)
  [ "$code" = "200" ] && { echo "up: $SHA on 127.0.0.1:$PORT"; exit 0; }
  sleep 3
done
echo "not answering on 127.0.0.1:$PORT"; exit 1
