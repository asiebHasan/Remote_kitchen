#!/bin/bash
# Start Remote Kitchen: Django API backend (:8000) + React frontend (:5173).
# The frontend dev server proxies /api requests to the backend, so only
# the frontend port needs to be exposed for preview.

set -e

BACKEND_PID=
FRONTEND_PID=

cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Apply migrations (idempotent) before starting the backend.
cd remote_kitchen
python3 manage.py migrate --noinput

# Start Django backend in the background.
python3 manage.py runserver 0.0.0.0:8000 --noreload &
BACKEND_PID=$!

cd ../frontend

# Start the React frontend (the exposed preview port).
npm run dev &
FRONTEND_PID=$!

wait
