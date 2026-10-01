#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT/backend" || exit
source venv/bin/activate
python3 run.py &

cd "$ROOT/frontend" || exit
npm run dev
