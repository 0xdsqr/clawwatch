#!/usr/bin/env sh
set -e

CONFIG_DIR="/app/.output/public"
CONFIG_PATH="$CONFIG_DIR/config.js"

mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_PATH" <<EOF
window.__CLAWATCH_CONFIG__ = {
  convexUrl: "${VITE_CONVEX_URL:-}"
};
EOF

exec "$@"
