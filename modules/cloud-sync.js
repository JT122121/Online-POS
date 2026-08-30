// Optional Cloud Sync (Premium, purchased code only - see hasRealPremiumCode()).
// Uses Supabase Auth (Google or any other enabled provider) + the tables in
// supabase/schema.sql. The anon/public key below is meant to be embedded
// client-side - it's not a secret, every write it makes is still enforced
// by the Row Level Security policies in that schema.
const SUPABASE_URL = "https://kimaefdizuvkxzvttzhh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_n3YJh5yBQkzNg-xv6OgeoQ_f_owgu-9";

let cloudSyncClient = null;
let cloudSyncUser = null;

function getCloudSyncClient() {
  if (!cloudSyncClient && window.supabase && typeof window.supabase.createClient === "function") {
    cloudSyncClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cloudSyncClient;
}

async function initCloudSync() {
  const client = getCloudSyncClient();
  if (!client) return;
  client.auth.onAuthStateChange(function() {
    client.auth.getSession().then(function(res) {
      cloudSyncUser = (res.data && res.data.session && res.data.session.user) || null;
      renderCloudSyncStatus();
    });
  });
  const initial = await client.auth.getSession();
  cloudSyncUser = (initial.data && initial.data.session && initial.data.session.user) || null;
  renderCloudSyncStatus();
}

async function hasRealPremiumCode() {
  if (!premiumUnlocked) return false;
  const code = await storageGet("pos-premium-code-used");
  return !!code && code !== "PROMO1";
}

async function refreshCloudSyncLock() {
  const allowed = await hasRealPremiumCode();
  const lockMsg = document.getElementById("cloudSyncLockMsg");
  const content = document.getElementById("cloudSyncUnlockedContent");
  if (lockMsg) lockMsg.classList.toggle("hidden", allowed);
  if (content) content.classList.toggle("hidden", !allowed);
}

function renderCloudSyncStatus() {
  const signedOutEl = document.getElementById("cloudSyncSignedOut");
  const signedInEl = document.getElementById("cloudSyncSignedIn");
  const emailEl = document.getElementById("cloudSyncEmail");
  if (!signedOutEl || !signedInEl) return;
  const signedIn = !!cloudSyncUser;
  signedOutEl.classList.toggle("hidden", signedIn);
  signedInEl.classList.toggle("hidden", !signedIn);
  if (emailEl) emailEl.textContent = cloudSyncUser ? (cloudSyncUser.email || "") : "";
}

function cloudSyncShowError() {
  const box = document.getElementById("cloudSyncError");
  if (box) { box.textContent = tr("cloudSyncErrorText"); box.classList.remove("hidden"); }
}
function cloudSyncClearError() {
  const box = document.getElementById("cloudSyncError");
  if (box) box.classList.add("hidden");
}

async function cloudSignIn() {
  const client = getCloudSyncClient();
  if (!client) { cloudSyncShowError(); return; }
  cloudSyncClearError();
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href }
  });
  if (error) { console.error("Cloud sync sign-in failed:", error); cloudSyncShowError(); }
}

async function cloudSignOut() {
  const client = getCloudSyncClient();
  if (!client) return;
  await client.auth.signOut();
  cloudSyncUser = null;
  renderCloudSyncStatus();
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function bulkInsert(client, table, rows) {
  if (!rows.length) return;
  const chunks = chunkArray(rows, 500);
  for (let i = 0; i < chunks.length; i++) {
    const { error } = await client.from(table).insert(chunks[i]);
    if (error) throw error;
  }
}

// "DD/MM/YYYY HH:MM:SS" (local time, see updateDate()) <-> ISO, both directions.
function saleDateTimeToIso(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(String(str || ""));
  if (!m) return new Date().toISOString();
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6]));
  return d.toISOString();
}
function isoToSaleDateTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  const p = function(n) { return String(n).padStart(2, "0"); };
  return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

async function pushBackupToCloud() {
  const client = getCloudSyncClient();
  const session = client ? (await client.auth.getSession()).data.session : null;
  if (!client || !session) { cloudSyncShowError(); return false; }
  const userId = session.user.id;
  const backup = await buildBackupPayload();
  const settings = backup.settings || {};
  const codeUsed = (await storageGet("pos-premium-code-used")) || "";

  const storeSettingsRow = {
    user_id: userId,
    store_name: settings.storeName || "Demo Store",
    store_details: settings.storeDetails || "",
    logo_data_url: backup.logo || "",
    tax_name: settings.taxName || "Tax",
    tax_rate: Number(settings.taxRate) || 0,
    currency_code: settings.currencyCode || "USD",
    currency_symbol: settings.currencySymbol || "$",
    receipt_prefix: receiptPrefix || "",
    receipt_counter: Number(backup.receiptCounter) || 1,
    language: settings.language || "en",
    paper_size: settings.paperSize || "80",
    premium_unlocked: !!premiumUnlocked,
    premium_code_used: codeUsed,
    footer1: settings.footer1 || "",
    footer2: settings.footer2 || "",
    settings: {
      decimalPlaces: settings.decimalPlaces,
      discountRate: settings.discountRate,
      discountType: settings.discountType,
      customWidth: settings.customWidth,
      zoomRange: settings.zoomRange,
      documentType: settings.documentType,
      barcodeScannerEnabled: settings.barcodeScannerEnabled,
      activeCashier: backup.activeCashier || ""
    }
  };
  let res = await client.from("store_settings").upsert(storeSettingsRow, { onConflict: "user_id" });
  if (res.error) throw res.error;

  res = await client.from("products").delete().eq("user_id", userId);
  if (res.error) throw res.error;
  await bulkInsert(client, "products", (backup.products || []).map(function(p) {
    return {
      user_id: userId, name: p.name || "", price: Number(p.price) || 0, category: p.category || "",
      sku: p.sku || "", stock: (p.stock === null || p.stock === undefined || p.stock === "") ? null : Number(p.stock),
      tax_exempt: !!p.taxExempt, photo: p.photo || ""
    };
  }));

  res = await client.from("cashiers").delete().eq("user_id", userId);
  if (res.error) throw res.error;
  await bulkInsert(client, "cashiers", (backup.cashiers || []).map(function(name) { return { user_id: userId, name: name }; }));

  res = await client.from("payment_methods").delete().eq("user_id", userId);
  if (res.error) throw res.error;
  await bulkInsert(client, "payment_methods", (backup.paymentMethods || []).map(function(name, i) { return { user_id: userId, name: name, sort_order: i }; }));

  res = await client.from("sales").delete().eq("user_id", userId);
  if (res.error) throw res.error;

  const salesRows = [];
  const itemRows = [];
  const paymentRowsOut = [];
  (backup.salesHistory || []).forEach(function(s) {
    const saleId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    salesRows.push({
      id: saleId, user_id: userId,
      receipt_number: s.receiptNumber || "", sale_datetime: saleDateTimeToIso(s.dateTime), document_type: s.documentType || "",
      cashier_name: s.cashierName || "", customer_name: s.customerName || "",
      subtotal: Number(s.subtotal) || 0, discount_type: s.discountType || "percent", discount_value: Number(s.discountRate) || 0,
      discount_amount: Number(s.discount) || 0, tax_name: s.taxName || "Tax", tax_rate: Number(s.taxRate) || 0, tax_amount: Number(s.tax) || 0,
      total: Number(s.grandTotal) || 0, amount_received: Number(s.amountReceived) || 0, change_amount: Number(s.change) || 0,
      store_name_snapshot: s.storeName || "", store_details_snapshot: s.storeDetails || "",
      footer1_snapshot: s.footer1 || "", footer2_snapshot: s.footer2 || "",
      meta: { currencyCode: s.currencyCode || "", currencySymbol: s.currencySymbol || "", decimalPlaces: s.decimalPlaces }
    });
    (s.items || []).forEach(function(it) {
      itemRows.push({
        user_id: userId, sale_id: saleId, name: it.name || "", sku: "", qty: Number(it.qty) || 0, price: Number(it.price) || 0,
        line_total: Number(it.lineTotal) || 0, tax_exempt: !!it.taxExempt, description: it.description || ""
      });
    });
    (s.payments || []).forEach(function(p) {
      paymentRowsOut.push({ user_id: userId, sale_id: saleId, method: p.method || "", amount: Number(p.amount) || 0 });
    });
  });
  await bulkInsert(client, "sales", salesRows);
  await bulkInsert(client, "sale_items", itemRows);
  await bulkInsert(client, "sale_payments", paymentRowsOut);

  return true;
}

async function pullBackupFromCloud() {
  const client = getCloudSyncClient();
  const session = client ? (await client.auth.getSession()).data.session : null;
  if (!client || !session) { cloudSyncShowError(); return false; }
  const userId = session.user.id;

  const [settingsRes, productsRes, cashiersRes, methodsRes, salesRes] = await Promise.all([
    client.from("store_settings").select("*").eq("user_id", userId).maybeSingle(),
    client.from("products").select("*").eq("user_id", userId).order("created_at"),
    client.from("cashiers").select("*").eq("user_id", userId).order("created_at"),
    client.from("payment_methods").select("*").eq("user_id", userId).order("sort_order"),
    client.from("sales").select("*").eq("user_id", userId).order("sale_datetime")
  ]);
  [settingsRes, productsRes, cashiersRes, methodsRes, salesRes].forEach(function(r) { if (r.error) throw r.error; });

  const salesIds = (salesRes.data || []).map(function(s) { return s.id; });
  let itemsByS = {};
  let paymentsByS = {};
  if (salesIds.length) {
    const [itemsRes, paymentsRes] = await Promise.all([
      client.from("sale_items").select("*").in("sale_id", salesIds),
      client.from("sale_payments").select("*").in("sale_id", salesIds)
    ]);
    if (itemsRes.error) throw itemsRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    (itemsRes.data || []).forEach(function(it) { (itemsByS[it.sale_id] = itemsByS[it.sale_id] || []).push(it); });
    (paymentsRes.data || []).forEach(function(p) { (paymentsByS[p.sale_id] = paymentsByS[p.sale_id] || []).push(p); });
  }

  const row = settingsRes.data || {};
  const extra = row.settings || {};
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      currencyCode: row.currency_code || "USD", currencySymbol: row.currency_symbol || "$",
      decimalPlaces: extra.decimalPlaces, storeName: row.store_name || "Demo Store", storeDetails: row.store_details || "",
      taxName: row.tax_name || "Tax", taxRate: row.tax_rate, discountRate: extra.discountRate, discountType: extra.discountType,
      footer1: row.footer1 || "", footer2: row.footer2 || "", language: row.language || "en", paperSize: row.paper_size || "80",
      customWidth: extra.customWidth, zoomRange: extra.zoomRange, documentType: extra.documentType,
      barcodeScannerEnabled: extra.barcodeScannerEnabled
    },
    paymentMethods: (methodsRes.data || []).map(function(r) { return r.name; }),
    cashiers: (cashiersRes.data || []).map(function(r) { return r.name; }),
    activeCashier: extra.activeCashier || "",
    products: (productsRes.data || []).map(function(p) {
      return { name: p.name, price: Number(p.price) || 0, category: p.category || "", sku: p.sku || "", stock: p.stock, photo: p.photo || "", taxExempt: !!p.tax_exempt };
    }),
    logo: row.logo_data_url || "",
    salesHistory: (salesRes.data || []).map(function(s) {
      const items = (itemsByS[s.id] || []).map(function(it) {
        return { name: it.name, qty: Number(it.qty) || 0, price: Number(it.price) || 0, lineTotal: Number(it.line_total) || 0, taxExempt: !!it.tax_exempt, description: it.description || "" };
      });
      const payments = (paymentsByS[s.id] || []).map(function(p) { return { method: p.method, amount: Number(p.amount) || 0 }; });
      return {
        receiptNumber: s.receipt_number, dateTime: isoToSaleDateTime(s.sale_datetime), documentType: s.document_type || "",
        storeName: s.store_name_snapshot, storeDetails: s.store_details_snapshot, footer1: s.footer1_snapshot, footer2: s.footer2_snapshot,
        decimalPlaces: (s.meta && s.meta.decimalPlaces !== undefined) ? s.meta.decimalPlaces : 2,
        cashierName: s.cashier_name || "", customerName: s.customer_name || "",
        currencyCode: (s.meta && s.meta.currencyCode) || row.currency_code || "USD",
        currencySymbol: (s.meta && s.meta.currencySymbol) || row.currency_symbol || "$",
        taxName: s.tax_name, taxRate: Number(s.tax_rate) || 0, discountType: s.discount_type || "percent", discountRate: Number(s.discount_value) || 0,
        subtotal: Number(s.subtotal) || 0, discount: Number(s.discount_amount) || 0, tax: Number(s.tax_amount) || 0, grandTotal: Number(s.total) || 0,
        paymentMethod: payments.map(function(p) { return p.method; }).join(" + "),
        payments: payments, amountReceived: Number(s.amount_received) || 0, change: Number(s.change_amount) || 0,
        itemCount: items.reduce(function(sum, it) { return sum + (Number(it.qty) || 0); }, 0),
        items: items
      };
    }),
    receiptCounter: String(row.receipt_counter || 1)
  };

  await applyBackupPayload(backup);
  return true;
}

async function cloudBackupNow() {
  if (!(await hasRealPremiumCode())) return;
  if (!confirm(tr("cloudSyncBackupConfirm"))) return;
  const btn = document.getElementById("cloudSyncBackupButton");
  const label = document.getElementById("cloudSyncBackupButtonLabel");
  const originalLabel = label ? label.textContent : "";
  cloudSyncClearError();
  if (btn) btn.disabled = true;
  if (label) label.textContent = tr("cloudSyncBackingUp");
  try {
    await pushBackupToCloud();
    alert(tr("cloudSyncBackupSuccess"));
    trackEvent("cloud_backup", {});
  } catch (e) {
    console.error("Cloud backup failed:", e);
    cloudSyncShowError();
    trackEvent("cloud_backup_failed", { error_message: String(e && e.message || e) });
  } finally {
    if (btn) btn.disabled = false;
    if (label) label.textContent = originalLabel;
  }
}

async function cloudRestoreNow() {
  if (!(await hasRealPremiumCode())) return;
  if (!confirm(tr("cloudSyncRestoreConfirm"))) return;
  const btn = document.getElementById("cloudSyncRestoreButton");
  const label = document.getElementById("cloudSyncRestoreButtonLabel");
  const originalLabel = label ? label.textContent : "";
  cloudSyncClearError();
  if (btn) btn.disabled = true;
  if (label) label.textContent = tr("cloudSyncRestoring");
  try {
    await pullBackupFromCloud();
    alert(tr("restoreSuccess"));
    trackEvent("cloud_restore", {});
    location.reload();
  } catch (e) {
    console.error("Cloud restore failed:", e);
    cloudSyncShowError();
    trackEvent("cloud_restore_failed", { error_message: String(e && e.message || e) });
    if (btn) btn.disabled = false;
    if (label) label.textContent = originalLabel;
  }
}
