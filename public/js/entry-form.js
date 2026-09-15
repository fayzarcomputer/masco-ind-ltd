// ==============================================================================
// ENTRY FORM LOGIC - MASCO INDUSTRIES LIMITED
// Preloaded with exact real invoice rows & real-time math
// ==============================================================================

let clientsCache = [];
let rowCounter = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await loadClientsDropdown();

  // Load the exact 4 real product rows from the invoice
  addNewRow({
    order_no: 'BLSS2700058652BN',
    item_ref: '152415',
    hs_code: '610910',
    production_description: "Women's T-shirt",
    color_spec: 'BB (black)',
    total_carton: 9,
    quantity: 405,
    gross_weight: 88.68,
    net_weight: 77.12,
    cbm: 0.410,
    unit_price: 3.08
  });

  addNewRow({
    order_no: 'BLSS2700058658ML',
    item_ref: '152415',
    hs_code: '610910',
    production_description: "Women's T-shirt",
    color_spec: 'AA (grey)',
    total_carton: 3,
    quantity: 140,
    gross_weight: 31.21,
    net_weight: 26.91,
    cbm: 0.153,
    unit_price: 3.08
  });

  addNewRow({
    order_no: 'BLSS2700058664BN',
    item_ref: '152415',
    hs_code: '610910',
    production_description: "Women's T-shirt",
    color_spec: '',
    total_carton: 7,
    quantity: 317,
    gross_weight: 73.28,
    net_weight: 64.31,
    cbm: 0.307,
    unit_price: 3.08
  });

  addNewRow({
    order_no: 'BLSS2700058670ML',
    item_ref: '152415',
    hs_code: '610910',
    production_description: "Women's T-shirt",
    color_spec: '',
    total_carton: 3,
    quantity: 140,
    gross_weight: 32.73,
    net_weight: 28.43,
    cbm: 0.153,
    unit_price: 3.08
  });

  document.getElementById('btnAddRow').addEventListener('click', () => addNewRow());
  document.getElementById('clientSelect').addEventListener('change', onClientSelectChange);
  document.getElementById('invoiceForm').addEventListener('submit', onInvoiceFormSubmit);
});

async function loadClientsDropdown() {
  try {
    const res = await API.getClients();
    if (res.success && res.data) {
      clientsCache = res.data;
      const select = document.getElementById('clientSelect');
      select.innerHTML = '<option value="">-- Choose Buyer / Importer --</option>';

      clientsCache.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.applicant_name} (${c.country})`;
        select.appendChild(opt);
      });

      if (clientsCache.length > 0) {
        select.value = clientsCache[0].id;
        onClientSelectChange();
      }
    }
  } catch (err) {
    console.error('Failed to load clients:', err);
  }
}

function onClientSelectChange() {
  const selectedId = document.getElementById('clientSelect').value;
  const client = clientsCache.find(c => c.id === selectedId);

  if (client) {
    document.getElementById('clientCountry').value = client.country || 'SINGAPORE';
    document.getElementById('clientAddress').value = client.office_address || '';
    document.getElementById('clientNotify').value = client.notify_party || client.office_address || '';
    document.getElementById('buyerBankName').value = client.buyer_bank_name || 'DBS Bank Limited';
    document.getElementById('buyerBankAddress').value = client.buyer_bank_branch || client.buyer_bank_address || '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982';
    document.getElementById('buyerBankSwift').value = client.buyer_bank_swift || 'DBSSSGSG';
    document.getElementById('buyerBankAccount').value = client.buyer_bank_account || '0729034931';
  }
}

function addNewRow(initialData = {}) {
  rowCounter++;
  const tbody = document.getElementById('itemsTableBody');

  const tr = document.createElement('tr');
  tr.id = `row-${rowCounter}`;
  tr.innerHTML = `
    <td class="text-center row-index" style="font-weight: 600; color: #64748b;">${tbody.children.length + 1}</td>
    <td>
      <input type="text" class="table-input item-order" placeholder="PO / Order No" value="${initialData.order_no || ''}" required style="font-family: monospace;">
    </td>
    <td>
      <input type="text" class="table-input text-center item-ref" placeholder="152415" value="${initialData.item_ref || '152415'}" required>
    </td>
    <td>
      <input type="text" class="table-input text-center item-hs" placeholder="610910" value="${initialData.hs_code || '610910'}">
    </td>
    <td>
      <input type="text" class="table-input item-desc" placeholder="Product Description" value="${initialData.production_description || "Women's T-shirt"}">
    </td>
    <td>
      <input type="text" class="table-input item-color" placeholder="Color/Spec" value="${initialData.color_spec || ''}">
    </td>
    <td>
      <input type="number" min="1" step="1" class="table-input text-right item-carton" placeholder="0" value="${initialData.total_carton || ''}" required>
    </td>
    <td>
      <input type="number" min="1" step="1" class="table-input text-right item-qty" placeholder="0" value="${initialData.quantity || ''}" required>
    </td>
    <td>
      <input type="number" min="0" step="0.01" class="table-input text-right item-gross-wt" placeholder="0.00" value="${initialData.gross_weight || ''}">
    </td>
    <td>
      <input type="number" min="0" step="0.01" class="table-input text-right item-net-wt" placeholder="0.00" value="${initialData.net_weight || ''}">
    </td>
    <td>
      <input type="number" min="0" step="0.001" class="table-input text-right item-cbm" placeholder="0.000" value="${initialData.cbm || ''}">
    </td>
    <td>
      <input type="number" min="0" step="0.01" class="table-input text-right item-price" placeholder="0.00" value="${initialData.unit_price || '3.08'}" required>
    </td>
    <td class="text-right" style="font-weight: 700; color: #0f766e;">
      <span class="item-line-total">$0.00</span>
    </td>
    <td class="text-center">
      <button type="button" class="btn btn-danger btn-sm btn-icon btn-remove-row" title="Remove Row">✕</button>
    </td>
  `;

  tbody.appendChild(tr);

  const inputs = tr.querySelectorAll('.item-carton, .item-qty, .item-gross-wt, .item-net-wt, .item-cbm, .item-price');
  inputs.forEach(input => {
    input.addEventListener('input', calculateTotals);
  });

  tr.querySelector('.btn-remove-row').addEventListener('click', () => {
    if (tbody.children.length <= 1) {
      alert('At least one product line item is required.');
      return;
    }
    tr.remove();
    reindexRows();
    calculateTotals();
  });

  reindexRows();
  calculateTotals();
}

function reindexRows() {
  const rows = document.querySelectorAll('#itemsTableBody tr');
  rows.forEach((row, idx) => {
    row.querySelector('.row-index').textContent = idx + 1;
  });
}

function calculateTotals() {
  let totalCarton = 0;
  let totalPcs = 0;
  let totalGross = 0;
  let totalNet = 0;
  let totalCbm = 0;
  let totalAmount = 0;

  const rows = document.querySelectorAll('#itemsTableBody tr');
  rows.forEach(tr => {
    const carton = parseInt(tr.querySelector('.item-carton').value, 10) || 0;
    const qty = parseInt(tr.querySelector('.item-qty').value, 10) || 0;
    const gross = parseFloat(tr.querySelector('.item-gross-wt').value) || 0;
    const net = parseFloat(tr.querySelector('.item-net-wt').value) || 0;
    const cbm = parseFloat(tr.querySelector('.item-cbm').value) || 0;
    const price = parseFloat(tr.querySelector('.item-price').value) || 0;

    const lineTotal = qty * price;
    tr.querySelector('.item-line-total').textContent = `$${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    totalCarton += carton;
    totalPcs += qty;
    totalGross += gross;
    totalNet += net;
    totalCbm += cbm;
    totalAmount += lineTotal;
  });

  document.getElementById('sumCartons').textContent = `${totalCarton} CTN`;
  document.getElementById('sumPcs').textContent = `${totalPcs.toLocaleString()} PCS`;
  document.getElementById('sumGrossWt').textContent = `${totalGross.toFixed(2)} KGS`;
  document.getElementById('sumNetWt').textContent = `${totalNet.toFixed(2)} KGS`;
  document.getElementById('sumCBM').textContent = `${totalCbm.toFixed(3)} CBM`;
  document.getElementById('sumAmount').textContent = `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function onInvoiceFormSubmit(e) {
  e.preventDefault();

  const clientId = document.getElementById('clientSelect').value;
  if (!clientId) {
    alert('Please select a Buyer / Client');
    return;
  }

  const rows = document.querySelectorAll('#itemsTableBody tr');
  const items = [];
  rows.forEach(tr => {
    items.push({
      order_no: tr.querySelector('.item-order').value.trim(),
      po_number: tr.querySelector('.item-order').value.trim(),
      item_ref: tr.querySelector('.item-ref').value.trim() || '152415',
      style: tr.querySelector('.item-ref').value.trim() || '152415',
      hs_code: tr.querySelector('.item-hs').value.trim() || '610910',
      production_description: tr.querySelector('.item-desc').value.trim(),
      item_description: tr.querySelector('.item-desc').value.trim(),
      color_spec: tr.querySelector('.item-color').value.trim(),
      total_carton: parseInt(tr.querySelector('.item-carton').value, 10) || 0,
      quantity: parseInt(tr.querySelector('.item-qty').value, 10) || 0,
      total_pcs: parseInt(tr.querySelector('.item-qty').value, 10) || 0,
      gross_weight: parseFloat(tr.querySelector('.item-gross-wt').value) || 0,
      net_weight: parseFloat(tr.querySelector('.item-net-wt').value) || 0,
      cbm: parseFloat(tr.querySelector('.item-cbm').value) || 0,
      unit_price: parseFloat(tr.querySelector('.item-price').value) || 0
    });
  });

  const payload = {
    invoice_no: document.getElementById('invoiceNo').value.trim(),
    invoice_date: document.getElementById('invoiceDate').value,
    exp_no: document.getElementById('expNo').value.trim(),
    exp_date: document.getElementById('expDate').value || null,
    sc_no: document.getElementById('scNo').value.trim(),
    sc_date: document.getElementById('scDate').value || null,
    client_id: clientId,
    port_of_loading: document.getElementById('portLoading').value.trim(),
    mode_of_shipment: document.getElementById('modeShipment').value,
    port_of_discharge: document.getElementById('portDischarge').value.trim(),
    incoterm: document.getElementById('incoterm').value.trim(),
    currency: document.getElementById('currency').value,
    buyer_bank_name: document.getElementById('buyerBankName').value.trim(),
    buyer_bank_address: document.getElementById('buyerBankAddress').value.trim(),
    buyer_bank_swift: document.getElementById('buyerBankSwift').value.trim(),
    buyer_bank_account: document.getElementById('buyerBankAccount').value.trim(),
    items
  };

  const submitBtn = document.getElementById('btnSubmitInvoice');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving Commercial Invoice...';

  try {
    const res = await API.createInvoice(payload);
    if (res.success && res.data) {
      alert(`🎉 Commercial Invoice ${res.data.invoice_no} saved successfully!`);
      window.location.href = `invoice-view.html?id=${encodeURIComponent(res.data.id)}`;
    } else {
      alert('Error: ' + (res.error || 'Failed to save invoice'));
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save & Generate Commercial Invoice';
    }
  } catch (err) {
    alert('Server error: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Save & Generate Commercial Invoice';
  }
}
