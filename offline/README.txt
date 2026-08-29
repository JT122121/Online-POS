GoOnlinePOS — Offline Edition
==============================

This folder is a fully self-contained copy of the GoOnlinePOS app. Nothing
in it calls out to the internet — you can copy this folder to a USB stick,
an offline computer, or a laptop with no wifi and it works exactly the
same as the hosted version at goonlinepos.com, except:

  - No cookie banner, analytics, or ads (nothing to track offline anyway).
  - Fonts fall back to your system's own fonts instead of downloading
    Space Grotesk / Inter / JetBrains Mono from Google Fonts. Purely
    cosmetic — nothing else is different.

Everything else — cart & checkout, split payments, receipt printing,
sales history & summaries, inventory tracking, cashiers, multi-language
(EN/AR/FIL/HI/ES/TH), CSV product import, Excel/CSV exports, USB barcode
scanning, backup & restore, and the customer-facing screen — is all
there and fully functional offline.


HOW TO RUN IT
-------------

There are two ways to open the app. Use the launcher script if you want
the Customer Screen to work reliably in every browser. For just ringing
up sales, printing, and USB barcode scanning on this one computer,
double-clicking app.html is enough.

  Option A — Recommended (enables the Customer Screen everywhere):
    Windows : double-click start-server.bat
    macOS   : double-click start-server-mac.command
              (first time: right-click it -> Open, to clear the
              "unidentified developer" warning)
    Linux   : run ./start-server.sh in a terminal

    This starts a small local web server on your own computer (needs
    Python, which macOS/Linux already include; Windows users without
    Python can install it free from https://python.org) and opens the
    app at http://localhost:8080/app.html. Nothing leaves your computer —
    "local server" here just means your browser and the app talk over
    localhost instead of over file://.

  Option B — Quick start (fastest, no setup):
    Just double-click app.html. This works fine in Chrome/Edge for a
    single register. It's not guaranteed to work for the Customer Screen
    in every browser — see below.


THE CUSTOMER SCREEN, OFFLINE
-----------------------------

Yes, it works offline — it never needed the internet even in the hosted
version. It works the same way it always has: app.html broadcasts the
live order to customer.html using your browser's own local storage and
BroadcastChannel, both of which are entirely on-device. There is no
server involved, online or offline.

The one thing that changes offline is reliability across browsers:

  - Opened via the local server (Option A), it works the same as the
    hosted site, in any browser.
  - Opened by double-clicking the files directly (Option B), it's
    reliable in Chrome/Edge but Firefox and Safari sometimes isolate
    separate double-clicked local files from each other, which can break
    the live sync between app.html and customer.html. Use Option A if
    you hit this.

To set it up: start the app, click "Customer Screen" in the header, and
follow the in-app guide — same two methods as always:
  1. Second monitor: open customer.html (http://localhost:8080/customer.html
     if using the launcher) in a new window on an extended second display.
  2. Tablet/TV: mirror this computer's screen to the tablet/TV (AirPlay,
     Windows "Connect to a wireless display", etc.) — the tablet needs to
     mirror this computer, not open the link in its own browser, since the
     sync only works between windows on the same device.


USB BARCODE SCANNER, OFFLINE
-------------------------------

Also fully local, and needs no setup at all. A USB barcode scanner acts
as a keyboard — it "types" the scanned code and presses Enter for you —
so as long as the "Barcode Scanner" toggle on the main screen is on,
scanning a barcode adds the matching product by SKU straight away. No
camera, no permissions, works the same in Option A or Option B.


YOUR DATA
---------

Same as the hosted app: everything (products, sales history, settings,
logo, cashiers, payment methods) is saved only in this browser, on this
computer. There is no cloud sync. Use Settings -> Backup -> Download
Backup regularly, and keep that .json file somewhere safe — it's the
only way to move your data to another computer or recover it if this
browser's storage is ever cleared.

Note: if you use both Option A (localhost) and Option B (file://) on the
same computer, your browser treats those as two different storage
locations — data saved under one won't show up under the other. Pick one
option and stick with it, or use Download Backup / Restore from Backup to
move data between them.


WHAT'S IN THIS FOLDER
----------------------

  app.html                 The POS app.
  customer.html             The customer-facing screen.
  favicon.png                Tab icon.
  modules/usb-scanner.js     USB barcode scanner logic.
  modules/receipt.js         Receipt/checkout rendering.
  vendor/xlsx.full.min.js    Excel export library (bundled, MIT/Apache-2.0 —
  vendor/LICENSES.txt         see vendor/LICENSES.txt).
  start-server.bat / .sh / -mac.command   Local server launchers.
  README.txt                This file.
