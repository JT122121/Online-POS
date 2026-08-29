let usbScanBuffer = "";
let usbScanLastCharTime = 0;
let usbScanToastTimeout = null;

const USB_SCAN_MAX_GAP_MS = 50;
const USB_SCAN_MIN_LENGTH = 3;

function isTextEntryElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return !!el.isContentEditable;
}

function handleUsbScanKeydown(e) {
  const toggle = document.getElementById("barcodeScannerToggle");
  if (!toggle || !toggle.checked) return;
  if (isTextEntryElement(document.activeElement)) return;

  const now = Date.now();

  if (e.key === "Enter") {
    const gap = now - usbScanLastCharTime;
    const code = usbScanBuffer;
    usbScanBuffer = "";
    if (code.length >= USB_SCAN_MIN_LENGTH && gap <= USB_SCAN_MAX_GAP_MS) {
      e.preventDefault();
      handleUsbScannedCode(code);
    }
    return;
  }

  if (e.key.length !== 1) return;

  if (now - usbScanLastCharTime > USB_SCAN_MAX_GAP_MS) usbScanBuffer = "";
  usbScanBuffer += e.key;
  usbScanLastCharTime = now;
}

function handleUsbScannedCode(code) {
  const match = products.find(function(p) { return p.sku && p.sku.trim() !== "" && p.sku.trim() === code.trim(); });
  if (match) {
    addProductToCart(match);
    showUsbScanToast(tr("scannerFound") + " " + match.name, "success");
    if (navigator.vibrate) navigator.vibrate(80);
  } else {
    showUsbScanToast(tr("scannerNotFound") + " " + code, "error");
  }
}

function showUsbScanToast(text, type) {
  let toast = document.getElementById("usbScanToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "usbScanToast";
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.className = "usb-scan-toast " + type;
  clearTimeout(usbScanToastTimeout);
  usbScanToastTimeout = setTimeout(function() { toast.classList.add("hidden"); }, 1800);
}

document.addEventListener("keydown", handleUsbScanKeydown);
