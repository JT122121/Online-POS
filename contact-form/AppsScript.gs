var OWNER_EMAIL = "REPLACE_WITH_YOUR_EMAIL@example.com";
var OTP_TTL_SECONDS = 60;
var RESEND_COOLDOWN_SECONDS = 60;
var MAX_VERIFY_ATTEMPTS = 5;

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || "";
  if (action === "requestOtp") return handleRequestOtp(params);
  if (action === "verifyOtp") return handleVerifyOtp(params);
  return jsonOut({ ok: false, reason: "bad_request", message: "This endpoint powers the GoOnlinePOS.com contact form. Expected action=requestOtp or action=verifyOtp." });
}

function doPost(e) {
  var params = {};
  try { params = JSON.parse(e.postData.contents); } catch (err) {}
  var action = params.action || "";
  if (action === "requestOtp") return handleRequestOtp(params);
  if (action === "verifyOtp") return handleVerifyOtp(params);
  return jsonOut({ ok: false, reason: "bad_request" });
}

function handleRequestOtp(params) {
  var name = String(params.name || "").trim().slice(0, 200);
  var email = String(params.email || "").trim().slice(0, 200);
  var message = String(params.message || "").trim().slice(0, 1000);

  if (!name || !email || !message) return jsonOut({ ok: false, reason: "bad_request" });
  if (!isValidEmail(email)) return jsonOut({ ok: false, reason: "invalid_email" });

  var cache = CacheService.getScriptCache();
  var emailKey = email.toLowerCase();
  var cooldownKey = "cooldown_" + emailKey;
  if (cache.get(cooldownKey)) return jsonOut({ ok: false, reason: "cooldown" });

  var otp = generateOtp();
  var record = { otp: otp, name: name, email: email, message: message, attempts: 0, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 };

  try {
    sendOtpEmail(email, name, otp);
  } catch (err) {
    return jsonOut({ ok: false, reason: "server_error" });
  }

  cache.put("otp_" + emailKey, JSON.stringify(record), OTP_TTL_SECONDS);
  cache.put(cooldownKey, "1", RESEND_COOLDOWN_SECONDS);

  return jsonOut({ ok: true });
}

function handleVerifyOtp(params) {
  var email = String(params.email || "").trim().toLowerCase();
  var otp = String(params.otp || "").trim();
  if (!email || !otp) return jsonOut({ ok: false, reason: "bad_request" });

  var cache = CacheService.getScriptCache();
  var key = "otp_" + email;
  var raw = cache.get(key);
  if (!raw) return jsonOut({ ok: false, reason: "expired" });

  var record = JSON.parse(raw);
  var remainingTtl = Math.floor((record.expiresAt - Date.now()) / 1000);
  if (remainingTtl <= 0) {
    cache.remove(key);
    return jsonOut({ ok: false, reason: "expired" });
  }

  if (String(record.otp) !== otp) {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      cache.remove(key);
      return jsonOut({ ok: false, reason: "too_many_attempts" });
    }
    // Preserve the original expiry (don't let repeated wrong guesses extend
    // the code's lifetime) - only re-store for whatever time is left.
    cache.put(key, JSON.stringify(record), remainingTtl);
    return jsonOut({ ok: false, reason: "invalid_code", attemptsLeft: MAX_VERIFY_ATTEMPTS - record.attempts });
  }

  cache.remove(key);

  try {
    sendOwnerNotification(record);
    sendVisitorConfirmation(record);
  } catch (err) {
    return jsonOut({ ok: false, reason: "server_error" });
  }

  return jsonOut({ ok: true });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendOtpEmail(toEmail, name, otp) {
  var subject = "Your GoOnlinePOS.com verification code";
  var body =
    "Hi " + name + ",\n\n" +
    "Thanks for reaching out to GoOnlinePOS.com! To keep spam out of our inbox, we just need to confirm it's really you before your message goes through.\n\n" +
    "Your verification code is:\n\n" +
    "    " + otp + "\n\n" +
    "Enter this code on the contact page to send your message. It expires in 1 minute.\n\n" +
    "If you didn't request this, you can safely ignore this email - no message will be sent without the code.\n\n" +
    "- GoOnlinePOS.com\n\n" +
    "This is an automated message. Please do not reply directly to this email.";
  MailApp.sendEmail({ to: toEmail, subject: subject, body: body });
}

function sendOwnerNotification(record) {
  var subject = "GoOnlinePOS.com Site Inquiry";
  var body =
    "New verified inquiry from the GoOnlinePOS.com contact form:\n\n" +
    "Name: " + record.name + "\n" +
    "Email: " + record.email + "\n\n" +
    "Message:\n" + record.message + "\n\n" +
    "(Reply-To is set to their email, so you can just hit Reply.)";
  MailApp.sendEmail({ to: OWNER_EMAIL, subject: subject, body: body, replyTo: record.email });
}

function sendVisitorConfirmation(record) {
  var subject = "GoOnlinePOS.com Site Inquiry";
  var body =
    "Hi " + record.name + ",\n\n" +
    "Thank you for your inquiry. I've received your message and will get back to you as soon as I can.\n\n" +
    "Your message:\n\"" + record.message + "\"\n\n" +
    "- GoOnlinePOS.com\n\n" +
    "This is an automated message. Please do not reply directly to this email.";
  MailApp.sendEmail({ to: record.email, subject: subject, body: body });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function testSendOtp() {
  var result = handleRequestOtp({ name: "Test User", email: "REPLACE_WITH_A_TEST_EMAIL@example.com", message: "This is a test message from testSendOtp()." });
  Logger.log(result.getContent());
}
