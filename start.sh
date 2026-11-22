#!/bin/sh
# Mac / Linux / Android (Termux): ./start.sh   (add --pin 1234 to protect it on Wi-Fi)
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Install Node.js 18+ first (Termux: pkg install nodejs)"; exit 1; }
exec node server.js --open "$@"
