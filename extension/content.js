// ==============================================================================
// CONTENT SCRIPT: UNIVERSAL PORTAL AUTOFILL ENGINE
// Matches and populates customs, Bangladesh Bank EXP, and buyer portal fields
// ==============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'AUTOFILL_INVOICE' && request.payload) {
    try {
      const count = performAutofill(request.payload);
      sendResponse({ success: true, filledCount: count });
    } catch (err) {
      console.error('Autofill execution error:', err);
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // Keep channel open
});

function performAutofill(inv) {
  const client = inv.clients || {};
  const firstItem = (inv.invoice_items && inv.invoice_items[0]) || {};

  // Comprehensive Field Dictionary with Synonyms & Regex Matches
  const fieldMappings = [
    {
      keys: ['invoice_no', 'invoiceno', 'inv_no', 'invoice_number', 'bill_no', 'commercial_invoice_no'],
      value: inv.invoice_no
    },
    {
      keys: ['invoice_date', 'inv_date', 'date_of_invoice', 'billing_date'],
      value: inv.invoice_date
    },
    {
      keys: ['exp_no', 'expno', 'exp_number', 'export_reg_no', 'bangladesh_bank_exp'],
      value: inv.exp_no || ''
    },
    {
      keys: ['exp_date', 'expdate', 'date_of_exp'],
      value: inv.exp_date || ''
    },
    {
      keys: ['sc_no', 'contract_no', 'sales_contract', 'lc_no', 'master_lc', 'po_no'],
      value: inv.sc_no || ''
    },
    {
      keys: ['sc_date', 'contract_date', 'lc_date'],
      value: inv.sc_date || ''
    },
    {
      keys: ['buyer', 'applicant', 'consignee', 'importer_name', 'buyer_name', 'party_name', 'customer_name'],
      value: client.applicant_name || ''
    },
    {
      keys: ['buyer_address', 'office_address', 'consignee_address', 'destination_address'],
      value: client.office_address || ''
    },
    {
      keys: ['country', 'destination_country', 'destination', 'port_country'],
      value: client.country || ''
    },
    {
      keys: ['notify_party', 'notify'],
      value: client.notify_party || ''
    },
    {
      keys: ['port_loading', 'loading_port', 'pol', 'port_of_loading'],
      value: inv.port_of_loading || ''
    },
    {
      keys: ['port_discharge', 'discharge_port', 'pod', 'port_of_discharge', 'final_destination'],
      value: inv.port_of_discharge || ''
    },
    {
      keys: ['total_amount', 'invoice_value', 'total_value', 'fob_value', 'invoice_amount', 'bill_amount'],
      value: inv.total_amount ? Number(inv.total_amount).toFixed(2) : ''
    },
    {
      keys: ['currency', 'cur', 'invoice_currency'],
      value: inv.currency || 'USD'
    },
    {
      keys: ['total_pcs', 'quantity', 'total_qty', 'export_qty', 'pcs'],
      value: inv.total_pcs ? inv.total_pcs.toString() : ''
    },
    {
      keys: ['total_carton', 'carton_qty', 'total_ctn', 'packages', 'no_of_pkgs', 'cartons'],
      value: inv.total_carton ? inv.total_carton.toString() : ''
    },
    {
      keys: ['gross_weight', 'total_gross_weight', 'gross_wt', 'gw'],
      value: inv.total_gross_weight ? Number(inv.total_gross_weight).toFixed(2) : ''
    },
    {
      keys: ['net_weight', 'total_net_weight', 'net_wt', 'nw'],
      value: inv.total_net_weight ? Number(inv.total_net_weight).toFixed(2) : ''
    },
    {
      keys: ['cbm', 'volume', 'measurement', 'total_cbm'],
      value: inv.total_cbm ? Number(inv.total_cbm).toFixed(3) : ''
    },
    {
      keys: ['hs_code', 'hscode', 'tariff_code', 'commodity_code'],
      value: firstItem.hs_code || '6109.10.00'
    },
    {
      keys: ['style', 'style_no', 'art_no', 'style_number'],
      value: firstItem.style || ''
    },
    {
      keys: ['exporter_bank', 'bank_name', 'negotiating_bank'],
      value: inv.exporter_bank_name || ''
    },
    {
      keys: ['exporter_account', 'account_no', 'bank_account'],
      value: inv.exporter_account_no || ''
    },
    {
      keys: ['swift', 'swift_code', 'bic'],
      value: inv.exporter_swift_code || ''
    }
  ];

  let filledCount = 0;
  const elements = document.querySelectorAll('input, textarea, select');

  elements.forEach(el => {
    // Skip submit/button/hidden inputs
    const type = (el.type || '').toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'hidden' || type === 'reset') return;

    // Aggregate metadata for matching
    const id = (el.id || '').toLowerCase();
    const name = (el.name || '').toLowerCase();
    const placeholder = (el.placeholder || '').toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();

    // Find nearby label text
    let labelText = '';
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) labelText = label.innerText.toLowerCase();
    }
    if (!labelText && el.closest('label')) {
      labelText = el.closest('label').innerText.toLowerCase();
    }

    const elementSearchString = `${id} ${name} ${placeholder} ${ariaLabel} ${labelText}`.replace(/[\s\-_]/g, '');

    // Check each mapping rule
    for (const rule of fieldMappings) {
      if (!rule.value) continue;

      const isMatch = rule.keys.some(k => {
        const cleanKey = k.replace(/[\s\-_]/g, '');
        return elementSearchString.includes(cleanKey);
      });

      if (isMatch) {
        setFieldValue(el, rule.value);
        highlightFilledField(el);
        filledCount++;
        break; // Stop after first match for this input
      }
    }
  });

  return filledCount;
}

function setFieldValue(el, val) {
  if (el.tagName.toLowerCase() === 'select') {
    // Attempt exact or partial match on options
    let matched = false;
    for (const opt of el.options) {
      if (opt.value.toLowerCase() === val.toString().toLowerCase() ||
          opt.text.toLowerCase().includes(val.toString().toLowerCase())) {
        el.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched && el.options.length > 0) {
      el.value = val;
    }
  } else {
    el.value = val;
  }

  // Trigger reactive events (Angular, React, Vue compatibility)
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

function highlightFilledField(el) {
  const origTransition = el.style.transition;
  const origBg = el.style.backgroundColor;
  const origBorder = el.style.borderColor;

  el.style.transition = 'all 0.3s ease';
  el.style.backgroundColor = '#ecfdf5';
  el.style.borderColor = '#10b981';

  setTimeout(() => {
    el.style.transition = origTransition;
    el.style.backgroundColor = origBg;
    el.style.borderColor = origBorder;
  }, 2500);
}
