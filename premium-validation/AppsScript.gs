var CODES_SHEET_NAME = "Premium Code";
var SESSIONS_SHEET_NAME = "Active Sessions";
var MAX_SEATS = 5;
var SEAT_WINDOW_DAYS = 30;
var CODE_SEAT_LIMITS = { "PROMO1": 30 };

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (!params.code || !params.deviceId) {
    return jsonOut({ ok: false, reason: "bad_request", message: "This endpoint validates GoOnlinePOS Premium codes. Expected query params: code, deviceId." });
  }
  return validateCode(params.code, params.deviceId);
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return validateCode(body.code, body.deviceId);
}

function validateCode(rawCode, rawDeviceId) {
  var code = String(rawCode || "").trim().toUpperCase();
  var deviceId = String(rawDeviceId || "").trim();
  if (!code || !deviceId) return jsonOut({ ok: false, reason: "bad_request" });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var codesSheet = ss.getSheetByName(CODES_SHEET_NAME);
  if (!codesSheet) return jsonOut({ ok: false, reason: "server_error" });

  var validity = findCode(codesSheet, code);
  if (validity === null) return jsonOut({ ok: false, reason: "invalid" });

  var seatLimit = CODE_SEAT_LIMITS.hasOwnProperty(code) ? CODE_SEAT_LIMITS[code] : MAX_SEATS;
  var sessionsSheet = ss.getSheetByName(SESSIONS_SHEET_NAME) || createSessionsSheet(ss);
  var lock = LockService.getScriptLock();
  var claimed = false;
  try {
    lock.waitLock(10000);
    claimed = checkOrClaimSeat(sessionsSheet, code, deviceId, seatLimit);
  } finally {
    lock.releaseLock();
  }
  if (!claimed) return jsonOut({ ok: false, reason: "seat_limit" });

  return jsonOut({ ok: true, validity: validity });
}

function findCode(sheet, code) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowCode = String(data[i][0] || "").trim().toUpperCase();
    if (rowCode === code) {
      var cell = data[i][1];
      return cell instanceof Date
        ? Utilities.formatDate(cell, Session.getScriptTimeZone(), "dd-MMM-yyyy")
        : String(cell || "");
    }
  }
  return null;
}

function createSessionsSheet(ss) {
  var sheet = ss.insertSheet(SESSIONS_SHEET_NAME);
  sheet.getRange(1, 1, 1, 3).setValues([["Code", "DeviceID", "LastSeen"]]);
  return sheet;
}

function checkOrClaimSeat(sheet, code, deviceId, seatLimit) {
  var data = sheet.getDataRange().getValues();
  var cutoff = new Date(Date.now() - SEAT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  var activeOthers = 0;
  var existingRow = -1;

  for (var i = 1; i < data.length; i++) {
    var rowCode = String(data[i][0] || "").trim().toUpperCase();
    if (rowCode !== code) continue;

    var rowDevice = String(data[i][1] || "").trim();
    if (rowDevice === deviceId) {
      existingRow = i + 1;
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

  if (activeOthers >= seatLimit) return false;

  sheet.appendRow([code, deviceId, now]);
  return true;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function testLookupCode() {
  var codeToTest = "PROMO1";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CODES_SHEET_NAME);
  if (!sheet) {
    Logger.log('No tab named exactly "' + CODES_SHEET_NAME + '" found. Existing tabs: ' + ss.getSheets().map(function(s) { return s.getName(); }).join(", "));
    return;
  }
  var data = sheet.getDataRange().getValues();
  Logger.log("Rows in \"" + CODES_SHEET_NAME + "\" (including header): " + data.length);
  for (var i = 1; i < data.length; i++) {
    Logger.log("Row " + (i + 1) + ": Code=[" + data[i][0] + "] Validity=[" + data[i][1] + "]");
  }
  var result = findCode(sheet, codeToTest);
  Logger.log('Lookup for "' + codeToTest + '": ' + (result !== null ? JSON.stringify(result) : "NOT FOUND"));
}
