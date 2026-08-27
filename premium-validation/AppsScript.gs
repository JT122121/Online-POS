/**
 * GoOnlinePOS — Premium code validation backend.
 *
 * This is a Google Apps Script bound to the "Premium Code" Google Sheet.
 * It's what app.html's PREMIUM_VALIDATION_URL calls to check a code, so
 * codes can live in a spreadsheet you edit instead of being hardcoded in
 * the page source.
 *
 * SHEET LAYOUT
 * ------------
 * Tab "Premium Code" (must be named exactly this):
 *   Column A: Code
 *   Column B: Validity   (shown to the user — NOT enforced; codes never
 *                          expire on their own, see PROJECT NOTES below)
 *   Column C: Purchase Date (optional, informational — not read by this
 *                             script)
 *   Row 1 is a header row and is skipped.
 *
 * A second tab, "Active Sessions", tracks which browsers have activated
 * which code, to enforce the per-code device limit. This script creates
 * it automatically on first run if it doesn't already exist — you don't
 * need to set it up yourself. Columns: Code | DeviceID | LastSeen.
 *
 * HOW THE SEAT LIMIT WORKS
 * -------------------------
 * Each code allows up to MAX_SEATS distinct browsers "active" at once.
 * A browser counts as active if it has checked in (activated, or sent a
 * background heartbeat) within SEAT_WINDOW_DAYS days. A browser that goes
 * quiet for longer than that silently drops out of the count, freeing a
 * seat for someone else — nothing needs to be manually cleaned up in the
 * sheet. A browser re-using its own DeviceID always succeeds (it's
 * refreshing its own seat, not claiming a new one), even after being
 * away past the window.
 *
 * PROJECT NOTES (see CLAUDE.md in the repo for the full picture)
 * ----------------------------------------------------------------
 * - The Validity column (B) is returned to the client and shown to the
 *   user as "Valid until: <value>" — purely informational. This script
 *   never rejects a code for being past its validity date. Once a code
 *   is accepted on a browser, that browser stays unlocked locally (in
 *   its own storage) until its site data is cleared — this script is
 *   never re-consulted to decide whether to lock someone back out.
 * - The downloadable offline package does NOT use this at all — it has
 *   its own separate, fully local code check (OFFLINE_PREMIUM_CODE in
 *   app.html), since it needs to work with zero internet.
 *
 * DEPLOYMENT
 * ----------
 * 1. Open the "Premium Code" Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Delete any starter code in Code.gs, paste this file's contents in.
 * 4. Deploy -> New deployment -> select type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Deploy, authorize when prompted, then copy the Web app URL — it
 *    ends in /exec.
 * 6. Paste that URL into PREMIUM_VALIDATION_URL in app.html (search for
 *    it — currently a REPLACE_WITH_YOUR_DEPLOYMENT_ID placeholder).
 * 7. Every time you edit this script afterward, you must create a NEW
 *    deployment version (Deploy -> Manage deployments -> edit -> new
 *    version) for the changes to take effect on the existing URL.
 *
 * This script never hardcodes the sheet's URL or ID — being bound to the
 * sheet, it reaches it via SpreadsheetApp.getActiveSpreadsheet(), so the
 * sheet's own URL never needs to appear here or in the website's code.
 */

var CODES_SHEET_NAME = "Premium Code";
var SESSIONS_SHEET_NAME = "Active Sessions";
var MAX_SEATS = 5;
var SEAT_WINDOW_DAYS = 30;

// The app never calls this — it always POSTs. This only exists so that
// visiting the deployed URL directly in a browser (a GET request) shows a
// clear message instead of Apps Script's default "Script function not
// found: doGet" error.
function doGet(e) {
  return jsonOut({ ok: false, reason: "get_not_supported", message: "This endpoint only accepts POST requests from the GoOnlinePOS app." });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, reason: "bad_request" });
  }

  var code = String(body.code || "").trim().toUpperCase();
  var deviceId = String(body.deviceId || "").trim();
  if (!code || !deviceId) return jsonOut({ ok: false, reason: "bad_request" });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var codesSheet = ss.getSheetByName(CODES_SHEET_NAME);
  if (!codesSheet) return jsonOut({ ok: false, reason: "server_error" });

  var codeRow = findCode(codesSheet, code);
  if (!codeRow) return jsonOut({ ok: false, reason: "invalid" });

  var sessionsSheet = ss.getSheetByName(SESSIONS_SHEET_NAME) || createSessionsSheet(ss);

  // A script-wide lock avoids two near-simultaneous activations both
  // reading the seat count before either has written its new row.
  var lock = LockService.getScriptLock();
  var claimed = false;
  try {
    lock.waitLock(10000);
    claimed = checkOrClaimSeat(sessionsSheet, code, deviceId);
  } finally {
    lock.releaseLock();
  }

  if (!claimed) return jsonOut({ ok: false, reason: "seat_limit" });
  return jsonOut({ ok: true, validity: codeRow.validity });
}

function findCode(sheet, code) {
  var data = sheet.getDataRange().getValues(); // [Code, Validity, Purchase Date]
  for (var i = 1; i < data.length; i++) {
    var rowCode = String(data[i][0] || "").trim().toUpperCase();
    if (rowCode === code) {
      var cell = data[i][1];
      var validity = cell instanceof Date
        ? Utilities.formatDate(cell, Session.getScriptTimeZone(), "dd-MMM-yyyy")
        : String(cell || "");
      return { validity: validity };
    }
  }
  return null;
}

function createSessionsSheet(ss) {
  var sheet = ss.insertSheet(SESSIONS_SHEET_NAME);
  sheet.getRange(1, 1, 1, 3).setValues([["Code", "DeviceID", "LastSeen"]]);
  return sheet;
}

// Returns true if `deviceId` has (or now has) a seat for `code`.
function checkOrClaimSeat(sheet, code, deviceId) {
  var data = sheet.getDataRange().getValues();
  var cutoff = new Date(Date.now() - SEAT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  var activeOthers = 0;
  var existingRow = -1;

  for (var i = 1; i < data.length; i++) {
    var rowCode = String(data[i][0] || "").trim().toUpperCase();
    if (rowCode !== code) continue;

    var rowDevice = String(data[i][1] || "").trim();
    if (rowDevice === deviceId) {
      existingRow = i + 1; // 1-indexed sheet row
      continue;
    }

    var lastSeen = data[i][2] instanceof Date ? data[i][2] : new Date(data[i][2]);
    if (lastSeen && lastSeen >= cutoff) activeOthers++;
  }

  var now = new Date();

  if (existingRow > 0) {
    sheet.getRange(existingRow, 3).setValue(now);
    return true;
  }

  if (activeOthers >= MAX_SEATS) return false;

  sheet.appendRow([code, deviceId, now]);
  return true;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
