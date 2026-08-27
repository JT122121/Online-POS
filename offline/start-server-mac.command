#!/bin/sh
# Runs GoOnlinePOS locally via http://localhost, which is what makes the
# Customer Screen and camera barcode scanner reliable across browsers.
# (Opening app.html directly with a double-click also works for ringing up
# sales and printing — this script is only needed for those two features.)
cd "$(dirname "$0")"
PORT=8080

PYCMD=""
if command -v python3 >/dev/null 2>&1; then
  PYCMD="python3"
elif command -v python >/dev/null 2>&1; then
  PYCMD="python"
fi

if [ -z "$PYCMD" ]; then
  echo "Python wasn't found on this computer, so the local server can't start."
  echo "You can still use GoOnlinePOS by double-clicking app.html directly —"
  echo "the register works fine that way. The Customer Screen and camera"
  echo "barcode scanner are more reliable through this launcher, though, so"
  echo "installing Python from https://python.org is worth it if you need those."
  echo
  printf "Press Enter to close..."
  read _dummy
  exit 1
fi

echo "Starting GoOnlinePOS locally on port $PORT ..."
"$PYCMD" -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM

sleep 1

URL="http://localhost:$PORT/app.html"
if command -v open >/dev/null 2>&1; then
  open "$URL"            # macOS
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"         # Linux desktop
else
  echo "Open this address in your browser: $URL"
fi

echo
echo "GoOnlinePOS is running at $URL"
echo "To open the Customer Screen (on a second window, monitor, or a mirrored"
echo "tablet/TV), open a second browser window to:"
echo "  http://localhost:$PORT/customer.html"
echo
echo "Keep this window open while you work. Press Ctrl+C or close this window"
echo "to stop the server when you're done."

wait "$SERVER_PID"
