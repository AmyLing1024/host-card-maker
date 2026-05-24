#!/bin/zsh

cd "$(dirname "$0")"

NODE_BIN="/Users/amy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
APP_URL="http://127.0.0.1:4173"

if ! lsof -iTCP:4173 -sTCP:LISTEN >/dev/null 2>&1; then
  "$NODE_BIN" server.js >/tmp/hand-card-maker.log 2>&1 &
  sleep 1
fi

open "$APP_URL"
