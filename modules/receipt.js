function printReceipt() {
  const select = document.getElementById("paperSize");
  let width;
  if (select.value === "auto") width = "auto";
  else if (select.value === "custom") width = Number(document.getElementById("customWidth").value) || 80;
  else width = Number(select.value);
  updatePrintStyle(width);
  window.print();
}

function getDocumentTitle() {
  const type = document.getElementById("documentType").value;
  if (type === "invoice") return tr("invoice");
  if (type === "payment") return tr("payment");
  return tr("receipt");
}

function computeTotalsFromItems(items, taxRate, discountType, discountValue) {
  let subtotal = 0;
  let taxableSubtotal = 0;
  items.forEach(function(it) {
    const lineTotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
    subtotal += lineTotal;
    if (!it.taxExempt) taxableSubtotal += lineTotal;
  });

  let discount;
  if (discountType === "amount") {
    discount = Math.max(0, Math.min(Number(discountValue) || 0, subtotal));
  } else {
    discount = subtotal * (Number(discountValue) || 0) / 100;
  }
  const afterDiscount = subtotal - discount;

  // Spread the discount across taxable and tax-exempt items in proportion
  // to their share of the subtotal, so a flat/percent discount doesn't
  // unfairly shift how much of the remaining total counts as taxable.
  const taxableRatio = subtotal > 0 ? taxableSubtotal / subtotal : 0;
  const taxableAfterDiscount = afterDiscount * taxableRatio;
  const tax = taxableAfterDiscount * (Number(taxRate) || 0) / 100;
  const grandTotal = afterDiscount + tax;

  return { subtotal: subtotal, discount: discount, tax: tax, grandTotal: grandTotal };
}

function computeTotals() {
  const taxRate = Number(val("taxRate")) || 0;
  const discountType = val("discountType") || "percent";
  const discountValue = Number(val("discountRate")) || 0;
  return computeTotalsFromItems(cart, taxRate, discountType, discountValue);
}

function renderReceiptItems() {
  const receiptItems = document.getElementById("receiptItems");
  const emptyHint = document.getElementById("receiptEmptyHint");
  receiptItems.innerHTML = "";
  emptyHint.textContent = tr("receiptEmptyHint");
  emptyHint.classList.toggle("hidden", cart.length > 0);

  cart.forEach(function(c) {
    const div = document.createElement("div");
    div.className = "receipt-item";
    div.setAttribute("data-id", c.id);
    div.innerHTML =
      "<div class=\"receipt-item-line\">" +
        "<div class=\"receipt-item-name-input\" contenteditable=\"true\" data-placeholder=\"" + escapeAttr(tr("customItemName")) + "\">" + escapeHtml(c.name) + "</div>" +
        "<span class=\"receipt-item-qty\">" + c.qty + "</span>" +
        "<span class=\"receipt-item-total\">" + "</span>" +
      "</div>" +
      "<div class=\"receipt-item-description-input" + (c.showDescription ? "" : " hidden") + "\" contenteditable=\"true\" data-placeholder=\"" + escapeAttr(tr("itemDescriptionPlaceholder")) + "\">" + escapeHtml(c.description || "") + "</div>" +
      "<div class=\"receipt-item-detail-print\"></div>" +
      "<div class=\"receipt-item-controls no-print\">" +
        "<input class=\"price-input\" type=\"number\" min=\"0\" step=\"" + amountStep() + "\" value=\"" + Number(c.price) + "\">" +
        "<button type=\"button\" class=\"qty-btn\" data-action=\"dec\">−</button>" +
        "<button type=\"button\" class=\"qty-btn\" data-action=\"inc\">+</button>" +
        "<label class=\"cart-tax-exempt-label\" title=\"" + escapeAttr(tr("taxExemptLabel")) + "\">" +
          "<input class=\"cart-tax-exempt\" type=\"checkbox\"" + (c.taxExempt ? " checked" : "") + "> " + escapeHtml(tr("taxExemptTag")) +
        "</label>" +
        "<label class=\"cart-description-label\" title=\"" + escapeAttr(tr("itemDescriptionLabel")) + "\">" +
          "<input class=\"cart-description-toggle\" type=\"checkbox\"" + (c.showDescription ? " checked" : "") + "> " + escapeHtml(tr("itemDescriptionTag")) +
        "</label>" +
        "<button type=\"button\" class=\"remove-cart-btn\">" + tr("removeButton") + "</button>" +
      "</div>";

    const nameEl = div.querySelector(".receipt-item-name-input");
    nameEl.addEventListener("input", function() { c.name = this.textContent; updateTotalsAndHeader(); });
    nameEl.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); this.blur(); } });
    div.querySelector(".cart-tax-exempt").addEventListener("change", function() { c.taxExempt = this.checked; updateTotalsAndHeader(); });

    const descEl = div.querySelector(".receipt-item-description-input");
    descEl.addEventListener("input", function() { c.description = this.textContent; });
    descEl.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); this.blur(); } });
    div.querySelector(".cart-description-toggle").addEventListener("change", function() {
      c.showDescription = this.checked;
      descEl.classList.toggle("hidden", !c.showDescription);
      if (c.showDescription) descEl.focus();
    });

    div.querySelector(".price-input").addEventListener("input", function() { c.price = Number(this.value) || 0; updateTotalsAndHeader(); });
    div.querySelector("[data-action=\"dec\"]").addEventListener("click", function() { stepCartQty(c.id, -1); });
    div.querySelector("[data-action=\"inc\"]").addEventListener("click", function() { stepCartQty(c.id, 1); });
    div.querySelector(".remove-cart-btn").addEventListener("click", function() { removeCartItem(c.id); });

    receiptItems.appendChild(div);
  });
}

function updateTotalsAndHeader() {
  const symbol = symbolNow();
  const taxName = val("taxName").trim() || tr("tax");
  const taxRate = Number(val("taxRate")) || 0;

  document.getElementById("receiptStoreName").textContent = val("storeName") || "Demo Store";
  document.getElementById("receiptStoreDetails").innerHTML = escapeHtml(val("storeDetails")).replace(/\n/g, "<br>");
  document.getElementById("receiptDocumentTitle").textContent = getDocumentTitle();
  document.getElementById("receiptNumber").textContent = currentReceiptNumber;
  if (document.activeElement !== document.getElementById("receiptNumberInput")) {
    document.getElementById("receiptNumberInput").value = receiptCounterValue;
  }

  const cashierName = activeCashierName;
  document.getElementById("receiptCashierName").textContent = cashierName;
  document.getElementById("receiptCashierRow").classList.toggle("hidden", !cashierName);

  const customerName = val("customerName").trim();
  document.getElementById("receiptCustomerName").textContent = customerName;
  document.getElementById("receiptCustomerRow").classList.toggle("hidden", !customerName);

  cart.forEach(function(c) {
    const row = document.querySelector('.receipt-item[data-id="' + c.id + '"]');
    if (!row) return;
    const total = (Number(c.qty) || 0) * (Number(c.price) || 0);
    const totalEl = row.querySelector(".receipt-item-total");
    const detailEl = row.querySelector(".receipt-item-detail-print");
    if (totalEl) totalEl.textContent = symbol + " " + total.toFixed(decimalsNow());
    if (detailEl) detailEl.textContent = symbol + " " + Number(c.price).toFixed(decimalsNow()) + " × " + c.qty + (c.taxExempt ? " (" + tr("taxExemptTag") + ")" : "");
  });

  const totals = computeTotals();
  const received = totalEntered();
  let change = received - totals.grandTotal;
  if (change < 0) change = 0;

  const paymentLinesEl = document.getElementById("receiptPaymentLines");
  paymentLinesEl.innerHTML = "";
  const activeRows = paymentRows.filter(function(r) { return Number(r.amount) > 0; });
  const rowsToShow = activeRows.length ? activeRows : (paymentRows[0] ? [paymentRows[0]] : []);
  rowsToShow.forEach(function(r) {
    const line = document.createElement("div");
    line.className = "receipt-payment-line";
    line.innerHTML = "<span>" + escapeHtml(r.method || "") + "</span><span>" + escapeHtml(symbol) + " " + (Number(r.amount) || 0).toFixed(decimalsNow()) + "</span>";
    paymentLinesEl.appendChild(line);
  });

  document.getElementById("receiptTaxLabel").textContent = taxName + " (" + taxRate + "%)";
  document.getElementById("subtotal").textContent = symbol + " " + totals.subtotal.toFixed(decimalsNow());
  document.getElementById("discountAmount").textContent = symbol + " " + totals.discount.toFixed(decimalsNow());
  document.getElementById("taxAmount").textContent = symbol + " " + totals.tax.toFixed(decimalsNow());
  document.getElementById("grandTotal").textContent = symbol + " " + totals.grandTotal.toFixed(decimalsNow());
  document.getElementById("receiptReceived").textContent = symbol + " " + received.toFixed(decimalsNow());
  document.getElementById("receiptChange").textContent = symbol + " " + change.toFixed(decimalsNow());
  document.getElementById("changePreview").textContent = symbol + " " + change.toFixed(decimalsNow());
  document.getElementById("totalEnteredPreview").textContent = symbol + " " + received.toFixed(decimalsNow());
  document.getElementById("receiptFooter1").textContent = val("footer1");
  document.getElementById("receiptFooter2").textContent = val("footer2");

  document.getElementById("proceedAmount").textContent = symbol + " " + totals.grandTotal.toFixed(decimalsNow());
  document.getElementById("checkoutTotalAmount").textContent = symbol + " " + totals.grandTotal.toFixed(decimalsNow());
  document.getElementById("proceedBtn").disabled = cart.length === 0;

  renderProductCatalog();
  saveSettings();
  broadcastCustomerScreenOrder();
}

function updateReceipt() {
  renderReceiptItems();
  updateTotalsAndHeader();
}
