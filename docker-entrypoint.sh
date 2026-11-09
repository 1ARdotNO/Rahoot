#!/bin/sh
set -e

# Bind-mounted config folders from older images are root-owned; hand them to the
# app user, then drop root so the app itself never runs privileged.
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$CONFIG_PATH"
  chown -R nodejs:nodejs "$CONFIG_PATH"
  exec su-exec nodejs "$@"
fi

exec "$@"
