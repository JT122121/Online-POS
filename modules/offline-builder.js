const OFFLINE_PREMIUM_CODE = "GOOFFLINE-LIFETIME";

function openOfflineDownloadModal() {
  if (!premiumUnlocked) return;
  const checkbox = document.getElementById("offlineAgreeCheckbox");
  if (checkbox) checkbox.checked = false;
  const confirmBtn = document.getElementById("offlineConfirmDownloadBtn");
  if (confirmBtn) confirmBtn.disabled = true;
  const cancelBtn = document.getElementById("offlineCancelBtn");
  if (cancelBtn) cancelBtn.disabled = false;
  const errorBox = document.getElementById("offlineDownloadError");
  if (errorBox) errorBox.classList.add("hidden");
  const progressBox = document.getElementById("offlineDownloadProgress");
  if (progressBox) progressBox.classList.add("hidden");
  document.getElementById("offlineDownloadOverlay").classList.remove("hidden");
  trackEvent("offline_download_viewed", {});
}
function closeOfflineDownloadModal() {
  document.getElementById("offlineDownloadOverlay").classList.add("hidden");
}
function handleOfflineAgreeChange() {
  const checkbox = document.getElementById("offlineAgreeCheckbox");
  const confirmBtn = document.getElementById("offlineConfirmDownloadBtn");
  if (confirmBtn) confirmBtn.disabled = !(checkbox && checkbox.checked);
}

async function fetchOfflineText(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch " + path + " (" + res.status + ")");
  return res.text();
}
async function fetchOfflineBlob(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch " + path + " (" + res.status + ")");
  return res.blob();
}

function stripMarked(html, marker, label) {
  const re = new RegExp("<!-- OFFLINE-STRIP:" + marker + ":START -->[\\s\\S]*?<!-- OFFLINE-STRIP:" + marker + ":END -->\\n?", "g");
  const out = html.replace(re, "");
  if (out === html) console.warn("Offline package: \"" + marker + "\" marker not found (" + label + ") - check app.html hasn't drifted from the OFFLINE-STRIP comments.");
  return out;
}

function buildOfflineAppHtml(html) {
  html = stripMarked(html, "COOKIE-CONSENT", "cookie consent script");
  html = stripMarked(html, "GOOGLE-FONTS", "google fonts links");
  html = stripMarked(html, "COOKIE-SETTINGS-LINK", "cookie settings footer link");
  html = stripMarked(html, "COOKIE-BANNER", "cookie banner markup");
  html = stripMarked(html, "JSZIP", "jszip script tag");
  html = stripMarked(html, "OFFLINE-BUILDER-SCRIPT", "offline builder module script tag");
  html = stripMarked(html, "DOWNLOAD-SECTION", "download settings section");
  html = stripMarked(html, "DOWNLOAD-MODAL", "download modal");
  html = stripMarked(html, "BUY-PREMIUM-BUTTON", "buy premium button");
  html = stripMarked(html, "BUY-PREMIUM-MODAL", "buy premium modal");
  html = stripMarked(html, "CREATE-INVOICE-BUTTON", "create invoice button");
  html = stripMarked(html, "CREATE-RECEIPT-BUTTON", "create receipt button");
  const heartbeatRe = /\/\* OFFLINE-STRIP:HEARTBEAT:START \*\/[\s\S]*?\/\* OFFLINE-STRIP:HEARTBEAT:END \*\/\n?/;
  html = heartbeatRe.test(html) ? html.replace(heartbeatRe, "") : (console.warn("Offline package: heartbeat marker not found"), html);
  const createInvoiceJsRe = /\/\* OFFLINE-STRIP:CREATE-INVOICE-JS:START \*\/[\s\S]*?\/\* OFFLINE-STRIP:CREATE-INVOICE-JS:END \*\/\n?/;
  html = createInvoiceJsRe.test(html) ? html.replace(createInvoiceJsRe, "") : (console.warn("Offline package: create-invoice-js marker not found"), html);
  const createReceiptJsRe = /\/\* OFFLINE-STRIP:CREATE-RECEIPT-JS:START \*\/[\s\S]*?\/\* OFFLINE-STRIP:CREATE-RECEIPT-JS:END \*\/\n?/;
  html = createReceiptJsRe.test(html) ? html.replace(createReceiptJsRe, "") : (console.warn("Offline package: create-receipt-js marker not found"), html);

  const offlineActivationJs = [
    'const DEFAULT_PREMIUM_CODE = "' + OFFLINE_PREMIUM_CODE + '";',
    'async function activatePremiumCode() {',
    '  const errorBox = document.getElementById("premiumCodeError");',
    '  errorBox.classList.add("hidden");',
    '  const entered = getEnteredPremiumCode();',
    '  if (entered === DEFAULT_PREMIUM_CODE) {',
    '    await unlockPremiumLocally(entered, "");',
    '  } else {',
    '    errorBox.textContent = tr("premiumCodeInvalid");',
    '    errorBox.classList.remove("hidden");',
    '  }',
    '}',
    'async function autoGrantDefaultPremium() {',
    '  await unlockPremiumLocally(DEFAULT_PREMIUM_CODE, "");',
    '}'
  ].join("\n");
  const activationRe = /\/\* OFFLINE-SWAP:PREMIUM-ACTIVATION:START \*\/[\s\S]*?\/\* OFFLINE-SWAP:PREMIUM-ACTIVATION:END \*\//;
  html = activationRe.test(html) ? html.replace(activationRe, offlineActivationJs) : (console.warn("Offline package: premium-activation marker not found"), html);

  const defaultOptionRe = /<!-- OFFLINE-SWAP:DEFAULT-CODE-OPTION:START -->[\s\S]*?<!-- OFFLINE-SWAP:DEFAULT-CODE-OPTION:END -->/;
  const offlineDefaultOption = '<option value="' + OFFLINE_PREMIUM_CODE + '" id="premiumCodeDefaultOption">' + OFFLINE_PREMIUM_CODE + '</option>';
  html = defaultOptionRe.test(html) ? html.replace(defaultOptionRe, offlineDefaultOption) : (console.warn("Offline package: default-code-option marker not found"), html);

  const buyPremiumJsRe = /\/\* OFFLINE-STRIP:BUY-PREMIUM-JS:START \*\/[\s\S]*?\/\* OFFLINE-STRIP:BUY-PREMIUM-JS:END \*\/\n?/;
  html = buyPremiumJsRe.test(html) ? html.replace(buyPremiumJsRe, "") : (console.warn("Offline package: buy-premium-js marker not found"), html);

  return html;
}
function buildOfflineCustomerHtml(html) {
  html = stripMarked(html, "GOOGLE-FONTS", "customer.html google fonts links");
  html = stripMarked(html, "CUSTOMER-ANALYTICS", "customer.html analytics script");
  return html;
}
async function confirmOfflineDownload() {
  if (!premiumUnlocked) { closeOfflineDownloadModal(); return; }
  const confirmBtn = document.getElementById("offlineConfirmDownloadBtn");
  const cancelBtn = document.getElementById("offlineCancelBtn");
  const errorBox = document.getElementById("offlineDownloadError");
  const progressBox = document.getElementById("offlineDownloadProgress");

  errorBox.classList.add("hidden");
  progressBox.classList.remove("hidden");
  confirmBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    if (typeof JSZip === "undefined") throw new Error("JSZip not loaded");

    const [appHtml, customerHtml, faviconBlob, faviconIcoBlob, xlsxBlob, licensesText, readmeText, shText, batText, macCommandText, translationsJsText, usbScannerJsText, receiptJsText] = await Promise.all([
      fetchOfflineText("app.html"),
      fetchOfflineText("customer.html"),
      fetchOfflineBlob("favicon.png"),
      fetchOfflineBlob("favicon.ico"),
      fetchOfflineBlob("vendor/xlsx.full.min.js"),
      fetchOfflineText("offline/vendor/LICENSES.txt"),
      fetchOfflineText("offline/README.txt"),
      fetchOfflineText("offline/start-server.sh"),
      fetchOfflineText("offline/start-server.bat"),
      fetchOfflineText("offline/start-server-mac.command"),
      fetchOfflineText("modules/translations.js"),
      fetchOfflineText("modules/usb-scanner.js"),
      fetchOfflineText("modules/receipt.js")
    ]);

    const zip = new JSZip();
    zip.file("app.html", buildOfflineAppHtml(appHtml));
    zip.file("customer.html", buildOfflineCustomerHtml(customerHtml));
    zip.file("favicon.png", faviconBlob);
    zip.file("favicon.ico", faviconIcoBlob);
    zip.file("vendor/xlsx.full.min.js", xlsxBlob);
    zip.file("vendor/LICENSES.txt", licensesText);
    zip.file("modules/translations.js", translationsJsText);
    zip.file("modules/usb-scanner.js", usbScannerJsText);
    zip.file("modules/receipt.js", receiptJsText);
    zip.file("README.txt", readmeText);
    zip.file("start-server.sh", shText, { unixPermissions: "755" });
    zip.file("start-server.bat", batText);
    zip.file("start-server-mac.command", macCommandText, { unixPermissions: "755" });

    const blob = await zip.generateAsync({ type: "blob", platform: "UNIX" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GoOnlinePOS-Offline.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function() { URL.revokeObjectURL(url); }, 4000);

    trackEvent("offline_download", {});
    closeOfflineDownloadModal();
  } catch (e) {
    console.error("Offline package build failed:", e);
    errorBox.textContent = tr("offlineDownloadErrorText");
    errorBox.classList.remove("hidden");
    trackEvent("offline_download_failed", { error_message: String(e && e.message || e) });
  } finally {
    progressBox.classList.add("hidden");
    const checkbox = document.getElementById("offlineAgreeCheckbox");
    confirmBtn.disabled = !(checkbox && checkbox.checked);
    cancelBtn.disabled = false;
  }
}
