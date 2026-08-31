// Welcome-trial email sender.
//
// supabase/schema.sql's handle_new_user() trigger fires once, right after a
// genuinely brand-new account signs in for the first time (auth.users has
// exactly one row per unique email, so this is the correct "first time"
// signal - no separate uniqueness check needed). It generates a one-time
// 7-day Premium redemption code and inserts it into redemption_codes
// itself, then calls this Web App (via pg_net's async net.http_post(), so
// sign-in never waits on this call) with just { email, code, secret } -
// this script's only job is to email that code to the new account.
//
// WEBHOOK_SECRET exists because this endpoint has no other gate of its own
// (unlike paypal-premium/AppsScript.gs, which independently re-verifies
// everything against PayPal's own API before doing anything consequential)
// - without it, anyone who discovered this /exec URL could make it email
// arbitrary addresses with an arbitrary "code" and turn it into a spam
// relay. The secret must match the value pasted into handle_new_user()'s
// own net.http_post() call in supabase/schema.sql - pick any random string
// and use the same one in both places.
//
// NEVER commit this file back to git with real values filled in below -
// only the REPLACE_WITH_... placeholders belong in the public repo. Paste
// your real values directly into the copy inside the Apps Script editor
// (script.google.com), which is separate from this repo entirely - see
// README.md for the full setup.

var WEBHOOK_SECRET = "REPLACE_WITH_YOUR_WELCOME_TRIAL_WEBHOOK_SECRET";
var SITE_URL = "https://goonlinepos.com";

function doPost(e) {
  var params = {};
  try { params = JSON.parse(e.postData.contents); } catch (err) {}

  var email = String(params.email || "").trim();
  var code = String(params.code || "").trim();
  var secret = String(params.secret || "");

  if (secret !== WEBHOOK_SECRET) return jsonOut({ success: false, reason: "bad_secret" });
  if (!email || !code) return jsonOut({ success: false, reason: "bad_request" });

  try {
    var subject = "Your 7-day GoOnlinePOS Premium trial code";
    var body =
      "Welcome to GoOnlinePOS!\n\n" +
      "Here's a one-time code for 7 days of Premium, free - no credit card needed:\n\n" +
      "    " + code + "\n\n" +
      "To activate it:\n" +
      "1. Sign in at " + SITE_URL + "/app with the same Google account.\n" +
      "2. Open Settings -> Premium.\n" +
      "3. Paste the code above into \"Redeem Code\" and click Redeem.\n\n" +
      "Premium unlocks Company Logo on receipts, editable receipt numbers, " +
      "the Customer-facing screen, Inventory tracking with export, the " +
      "downloadable offline version, and an ad-free experience.\n\n" +
      "This is an automated message.";
    MailApp.sendEmail({ to: email, subject: subject, body: body });
    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, reason: "server_error", message: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this manually from the Apps Script editor (select testSendWelcomeTrial
// in the function dropdown, then Run) to send yourself a test email before
// wiring this up to supabase/schema.sql for real.
function testSendWelcomeTrial() {
  var result = doPost({
    postData: { contents: JSON.stringify({
      email: "REPLACE_WITH_YOUR_TEST_EMAIL@example.com",
      code: "TESTCODE123",
      secret: WEBHOOK_SECRET
    }) }
  });
  Logger.log(result.getContent());
}
