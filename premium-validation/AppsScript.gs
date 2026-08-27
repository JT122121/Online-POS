var CODES_SHEET_NAME = "Premium Code";
var SESSIONS_SHEET_NAME = "Active Sessions";
var MAX_SEATS = 5;
var SEAT_WINDOW_DAYS = 30;
var UNLIMITED_CODES = ["PROMO1"];

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

  var codeRow = findCode(codesSheet, code);
  if (!codeRow) return jsonOut({ ok: false, reason: "invalid" });

  if (codeRow.validityDate && codeRow.validityDate.getTime() < Date.now()) {
    return jsonOut({ ok: false, reason: "expired", validity: codeRow.validity });
  }

  if (UNLIMITED_CODES.indexOf(code) === -1) {
    var sessionsSheet = ss.getSheetByName(SESSIONS_SHEET_NAME) || createSessionsSheet(ss);
    var lock = LockService.getScriptLock();
    var claimed = false;
    try {
      lock.waitLock(10000);
      claimed = checkOrClaimSeat(sessionsSheet, code, deviceId);
    } finally {
      lock.releaseLock();
    }
    if (!claimed) return jsonOut({ ok: false, reason: "seat_limit" });
  }

  return jsonOut({ ok: true, validity: codeRow.validity });
}

function findCode(sheet, code) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowCode = String(data[i][0] || "").trim().toUpperCase();
    if (rowCode === code) {
      var cell = data[i][1];
      var validityDate = cell instanceof Date ? cell : null;
      var validity = validityDate
        ? Utilities.formatDate(validityDate, Session.getScriptTimeZone(), "dd-MMM-yyyy")
        : String(cell || "");
      return { validity: validity, validityDate: validityDate };
    }
  }
  return null;
}

function createSessionsSheet(ss) {
  var sheet = ss.insertSheet(SESSIONS_SHEET_NAME);
  sheet.getRange(1, 1, 1, 3).setValues([["Code", "DeviceID", "LastSeen"]]);
  return sheet;
}

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

  if (activeOthers >= MAX_SEATS) return false;

  sheet.appendRow([code, deviceId, now]);
  return true;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
