let barcodeReader = null;
let scannerPollTimer = null;
let scannerMessageTimeout = null;
let lastScannedCode = "";
let lastScanTime = 0;

async function openScanner() {
  alert("Coming soon");
  return;
  const overlay = document.getElementById("scannerOverlay");
  const messageEl = document.getElementById("scannerMessage");
  messageEl.classList.add("hidden");
  overlay.classList.remove("hidden");
  lastScannedCode = "";
  lastScanTime = 0;
  torchOn = false;
  updateTorchButton();

  if (typeof ZXingBrowser === "undefined") {
    showScannerMessage(tr("scannerUnsupported"), "error");
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showScannerMessage(tr("scannerNoCamera"), "error");
    return;
  }

  try {
    const constraints = { video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoEl = document.getElementById("scannerVideo");
    videoEl.srcObject = stream;
    await videoEl.play().catch(function() {});

    const track = stream.getVideoTracks()[0];
    applyContinuousFocus(track);
    setTimeout(function() { applyContinuousFocus(track); }, 400);

    if (track && typeof track.getCapabilities === "function") {
      try {
        const caps = track.getCapabilities();
        const torchBtn = document.getElementById("scannerTorchBtn");
        if (caps.torch && torchBtn) torchBtn.classList.remove("hidden");
        else if (torchBtn) torchBtn.classList.add("hidden");
      } catch (capsErr) {}
    }

    barcodeReader = new ZXingBrowser.BrowserMultiFormatReader();
    clearInterval(scannerPollTimer);
    scannerPollTimer = setInterval(pollScannerFrame, 200);
  } catch (err) {
    showScannerMessage(tr("scannerNoCamera"), "error");
  }
}

function applyContinuousFocus(track) {
  if (!track || typeof track.getCapabilities !== "function") return;
  try {
    const caps = track.getCapabilities();
    if (caps.focusMode && caps.focusMode.indexOf("continuous") > -1) {
      track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(function() {});
    }
  } catch (focusErr) {}
}

let torchOn = false;
function toggleTorch() {
  const videoEl = document.getElementById("scannerVideo");
  if (!videoEl || !videoEl.srcObject) return;
  const track = videoEl.srcObject.getVideoTracks()[0];
  if (!track) return;
  torchOn = !torchOn;
  track.applyConstraints({ advanced: [{ torch: torchOn }] }).catch(function() { torchOn = !torchOn; });
  updateTorchButton();
}
function updateTorchButton() {
  const btn = document.getElementById("scannerTorchBtn");
  if (btn) btn.classList.toggle("torch-active", torchOn);
}

function pollScannerFrame() {
  const videoEl = document.getElementById("scannerVideo");
  if (!videoEl || !videoEl.videoWidth || !barcodeReader) return;

  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;

  const canvas = document.getElementById("scannerCanvas");
  canvas.width = vw;
  canvas.height = vh;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, vw, vh);

  try {
    const result = barcodeReader.decodeFromCanvas(canvas);
    if (result) handleScannedCode(result.getText());
  } catch (decodeErr) {}
}

function closeScanner() {
  document.getElementById("scannerOverlay").classList.add("hidden");
  clearInterval(scannerPollTimer);
  scannerPollTimer = null;
  if (barcodeReader) {
    try { barcodeReader.reset(); } catch (e) {}
    barcodeReader = null;
  }
  const videoEl = document.getElementById("scannerVideo");
  if (videoEl && videoEl.srcObject) {
    try { videoEl.srcObject.getTracks().forEach(function(t) { t.stop(); }); } catch (e) {}
    videoEl.srcObject = null;
  }
}

function showScannerMessage(text, type) {
  const messageEl = document.getElementById("scannerMessage");
  messageEl.textContent = text;
  messageEl.className = "scanner-message " + type;
  messageEl.classList.remove("hidden");
  clearTimeout(scannerMessageTimeout);
  if (type === "success") {
    scannerMessageTimeout = setTimeout(function() { messageEl.classList.add("hidden"); }, 1800);
  }
}

function handleScannedCode(code) {
  const now = Date.now();
  if (code === lastScannedCode && (now - lastScanTime) < 2000) return;
  lastScannedCode = code;
  lastScanTime = now;

  const match = products.find(function(p) { return p.sku && p.sku.trim() !== "" && p.sku.trim() === code.trim(); });
  if (match) {
    addProductToCart(match);
    showScannerMessage(tr("scannerFound") + " " + match.name, "success");
    if (navigator.vibrate) navigator.vibrate(80);
  } else {
    showScannerMessage(tr("scannerNotFound") + " " + code, "error");
  }
}
