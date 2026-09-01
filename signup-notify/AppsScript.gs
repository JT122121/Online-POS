// New-signup email notification.
//
// supabase/schema.sql's handle_new_user() trigger fires once, right after a
// genuinely brand-new account signs in for the first time (auth.users has
// exactly one row per unique email, so this is the correct "first time"
// signal - no separate uniqueness check needed). It calls this Web App
// (via pg_net's async net.http_post(), so sign-in never waits on this
// call) with just { email, secret } - this script's only job is to email
// the site owner that a new user just signed up, including that user's
// email address.
//
// WEBHOOK_SECRET exists because this endpoint has no other gate of its own
// (unlike paypal-premium/AppsScript.gs, which independently re-verifies
// everything against PayPal's own API before doing anything consequential)
// - without it, anyone who discovered this /exec URL could spam OWNER_EMAIL
// with fake "new signup" emails. The secret must match the value pasted
// into handle_new_user()'s own net.http_post() call in supabase/schema.sql
// - pick any random string and use the same one in both places.
//
// NEVER commit this file back to git with real values filled in below -
// only the REPLACE_WITH_... placeholders belong in the public repo. Paste
// your real values directly into the copy inside the Apps Script editor
// (script.google.com), which is separate from this repo entirely - see
// README.md for the full setup.

var WEBHOOK_SECRET = "REPLACE_WITH_YOUR_SIGNUP_NOTIFY_WEBHOOK_SECRET";
var OWNER_EMAIL = "REPLACE_WITH_YOUR_EMAIL@example.com";

function doPost(e) {
  var params = {};
  try { params = JSON.parse(e.postData.contents); } catch (err) {}

  var newUserEmail = String(params.email || "").trim();
  var secret = String(params.secret || "");

  if (secret !== WEBHOOK_SECRET) return jsonOut({ success: false, reason: "bad_secret" });
  if (!newUserEmail) return jsonOut({ success: false, reason: "bad_request" });

  try {
    var subject = "New GoOnlinePOS sign-up: " + newUserEmail;
    var body =
      "A new user just signed in to GoOnlinePOS for the first time.\n\n" +
      "Email: " + newUserEmail + "\n" +
      "Time: " + new Date().toString() + "\n\n" +
      "This is an automated message.";
    MailApp.sendEmail({ to: OWNER_EMAIL, subject: subject, body: body });
    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, reason: "server_error", message: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this manually from the Apps Script editor (select testSendSignupNotify
// in the function dropdown, then Run) to send yourself a test notification
// before wiring this up to supabase/schema.sql for real.
function testSendSignupNotify() {
  var result = doPost({
    postData: { contents: JSON.stringify({
      email: "REPLACE_WITH_A_TEST_USER_EMAIL@example.com",
      secret: WEBHOOK_SECRET
    }) }
  });
  Logger.log(result.getContent());
}
