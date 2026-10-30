#!/bin/bash
set -euo pipefail

port="${1:-8000}"
python3 -m http.server "$port" --bind 127.0.0.1
