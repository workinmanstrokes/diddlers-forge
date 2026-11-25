#!/bin/sh
# Mac / Linux / Android (Termux): ./start.sh   (add --pin 1234 to protect it on Wi-Fi)
# Termux with Ollama on the phone itself: ./start.sh --with-ollama   (pkg install ollama first)
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Install Node.js 18+ first (Termux: pkg install nodejs)"; exit 1; }
ARGS=""
for a in "$@"; do
  if [ "$a" = "--with-ollama" ]; then
    if ! command -v ollama >/dev/null 2>&1; then echo "  ollama is not installed (Termux: pkg install ollama). Starting without it."
    elif curl -s -m 2 http://127.0.0.1:11434/api/version >/dev/null 2>&1; then echo "  Ollama is already running."
    else echo "  Starting Ollama in the background (log: ollama.log)"; nohup ollama serve >ollama.log 2>&1 & sleep 2; fi
  else ARGS="$ARGS \"$a\""; fi
done
export FORGE_LAUNCHER=1
# exit code 75 = restart after an update
while :; do
  eval node server.js --open "$ARGS"
  [ $? -eq 75 ] || break
done
