// PayPal order verification -> automatic Premium grant.
//
// app.html's Buy Premium modal renders real PayPal Smart Buttons. After a
// buyer approves and captures payment client-side, the browser calls this
// Web App with just { orderID, userId } - two values that are not secrets
// (an order id and a Supabase user id) and are not trusted on their own.
// This script independently confirms the purchase by calling PayPal's own
// REST API directly, using PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET below, and
// only grants Premium once PayPal itself says the order is COMPLETED for a
// recognized amount and for that same user id. A malicious caller can send
// any orderID/userId pair they like - all that does is ask "is this real
// order COMPLETED, and was it for this user", which only PayPal can answer.
//
// NEVER commit this file back to git with real values filled in below -
// only the REPLACE_WITH_... placeholders belong in the public repo. Paste
// your real Client ID/Secret directly into the copy inside the Apps Script
// editor (script.google.com), which is separate from this repo entirely -
// see README.md for the full setup.

var PAYPAL_CLIENT_ID = "REPLACE_WITH_YOUR_PAYPAL_CLIENT_ID";
var PAYPAL_CLIENT_SECRET = "REPLACE_WITH_YOUR_PAYPAL_CLIENT_SECRET";
// Sandbox while testing; switch to "https://api-m.paypal.com" only once
// you're ready to accept real payments - see README.md.
var PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

var SUPABASE_URL = "https://kimaefdizuvkxzvttzhh.supabase.co";
var SUPABASE_SERVICE_ROLE_KEY = "REPLACE_WITH_YOUR_SUPABASE_SERVICE_ROLE_KEY";

// Must match the prices shown in app.html's Buy Premium modal exactly
// (as strings, since that's how PayPal echoes the amount back). Update
// both places together if pricing ever changes.
var PLAN_DAYS_BY_AMOUNT = { "0.39": 3, "3.99": 30, "9.99": 90, "19.99": 365 };

function doPost(e) {
  var params = {};
  try { params = JSON.parse(e.postData.contents); } catch (err) {}

  var orderId = String(params.orderID || "").trim();
  var userId = String(params.userId || "").trim();
  Logger.log("doPost: orderId=" + orderId + " userId=" + userId);
  if (!orderId || !userId) return jsonOut({ success: false, reason: "bad_request" });

  try {
    var order = fetchPaypalOrder(orderId);
    if (!order) return jsonOut({ success: false, reason: "order_not_found" });
    Logger.log("PayPal order status: " + order.status);
    if (order.status !== "COMPLETED") return jsonOut({ success: false, reason: "not_completed" });

    var unit = (order.purchase_units || [])[0] || {};
    var capture = ((unit.payments || {}).captures || [])[0] || {};
    var orderUserId = capture.custom_id || unit.custom_id || "";
    Logger.log("orderUserId (PayPal custom_id): " + orderUserId + " | claimed userId: " + userId);

    // The order's custom_id was set to the buyer's Supabase user id when
    // the order was created client-side (see app.html) - if it doesn't
    // match the userId this request claims, refuse rather than crediting
    // whoever happens to call this endpoint with someone else's order id.
    if (orderUserId !== userId) return jsonOut({ success: false, reason: "user_mismatch" });

    var amount = (capture.amount && capture.amount.value) || (unit.amount && unit.amount.value) || "";
    Logger.log("Captured amount: " + amount);
    var days = PLAN_DAYS_BY_AMOUNT[amount];
    if (!days) return jsonOut({ success: false, reason: "unrecognized_amount", amount: amount });

    var result = grantPremiumInSupabase(orderId, userId, amount, days);
    Logger.log("grantPremiumInSupabase result: " + JSON.stringify(result));
    return jsonOut(result);
  } catch (err) {
    Logger.log("doPost caught error: " + String(err));
    return jsonOut({ success: false, reason: "server_error", message: String(err) });
  }
}

function fetchPaypalOrder(orderId) {
  var token = getPaypalAccessToken();
  var res = UrlFetchApp.fetch(PAYPAL_API_BASE + "/v2/checkout/orders/" + encodeURIComponent(orderId), {
    method: "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true
  });
  Logger.log("PayPal order fetch: HTTP " + res.getResponseCode());
  if (res.getResponseCode() !== 200) {
    Logger.log("PayPal order fetch body: " + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

function getPaypalAccessToken() {
  var creds = Utilities.base64Encode(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET);
  var res = UrlFetchApp.fetch(PAYPAL_API_BASE + "/v1/oauth2/token", {
    method: "post",
    headers: { Authorization: "Basic " + creds },
    contentType: "application/x-www-form-urlencoded",
    payload: "grant_type=client_credentials",
    muteHttpExceptions: true
  });
  var data = JSON.parse(res.getContentText());
  if (!data.access_token) {
    Logger.log("PayPal token request failed: HTTP " + res.getResponseCode() + " body: " + res.getContentText());
    throw new Error("Could not get a PayPal access token - check PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET");
  }
  return data.access_token;
}

function grantPremiumInSupabase(orderId, userId, amount, days) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/rpc/grant_premium_from_paypal", {
    method: "post",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({ p_order_id: orderId, p_user_id: userId, p_amount_usd: Number(amount), p_days: days }),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  var body = res.getContentText();
  Logger.log("Supabase grant_premium_from_paypal: HTTP " + code + " body: " + body);
  try { return JSON.parse(body); } catch (err) { return { success: false, reason: "supabase_error", raw: body }; }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run this manually from the Apps Script editor (select testVerifyOrder in
// the function dropdown, then Run) against a real Sandbox order id you just
// paid with a Sandbox buyer account, to check the whole chain end-to-end
// before wiring it up to the live site.
function testVerifyOrder() {
  var result = doPost({
    postData: { contents: JSON.stringify({ orderID: "REPLACE_WITH_A_SANDBOX_ORDER_ID", userId: "REPLACE_WITH_A_TEST_SUPABASE_USER_ID" }) }
  });
  Logger.log(result.getContent());
}
