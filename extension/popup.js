// ==============================================================================
// CHROME EXTENSION POPUP LOGIC
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const apiServerInput = document.getElementById('apiServer');
  const invoiceIdInput = document.getElementById('invoiceIdInput');
  const recentSelect = document.getElementById('recentInvoicesSelect');
  const btnAutofill = document.getElementById('btnAutofill');
  const statusBox = document.getElementById('statusBox');

  // Load stored server URL
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['apiServerUrl'], (result) => {
      if (result.apiServerUrl) {
        apiServerInput.value = result.apiServerUrl;
      }
      fetchRecentInvoices(apiServerInput.value);
    });
  } else {
    fetchRecentInvoices(apiServerInput.value);
  }

  // Server URL change listener
  apiServerInput.addEventListener('change', () => {
    const url = apiServerInput.value.trim().replace(/\/$/, '');
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ apiServerUrl: url });
    }
    fetchRecentInvoices(url);
  });

  // Recent Invoices change
  recentSelect.addEventListener('change', () => {
    if (recentSelect.value) {
      invoiceIdInput.value = recentSelect.value;
    }
  });

  // Autofill Action
  btnAutofill.addEventListener('click', async () => {
    const serverUrl = apiServerInput.value.trim().replace(/\/$/, '');
    const invoiceId = invoiceIdInput.value.trim();

    if (!invoiceId) {
      showStatus('Please enter or select an Invoice ID / Invoice No.', 'error');
      return;
    }

    showStatus('Fetching invoice details from API...', 'info');
    btnAutofill.disabled = true;

    try {
      // Requirement #4: Fetch from GET /api/invoices/:id
      const res = await fetch(`${serverUrl}/api/invoices/${encodeURIComponent(invoiceId)}`);
      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'Invoice not found on server.');
      }

      const invoiceData = json.data;

      // Send payload to active tab's content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error('No active browser tab detected.');
      }

      chrome.tabs.sendMessage(tab.id, {
        action: 'AUTOFILL_INVOICE',
        payload: invoiceData
      }, (response) => {
        btnAutofill.disabled = false;
        if (chrome.runtime.lastError) {
          showStatus('Error: Make sure the target webpage is refreshed after installing the extension.', 'error');
        } else if (response && response.success) {
          showStatus(`🎉 Success! Filled ${response.filledCount} fields on page for ${invoiceData.invoice_no}`, 'success');
        } else {
          showStatus('Autofill completed, but no matching form fields were detected.', 'info');
        }
      });

    } catch (err) {
      btnAutofill.disabled = false;
      showStatus(`Failed: ${err.message}`, 'error');
    }
  });

  async function fetchRecentInvoices(serverUrl) {
    try {
      const res = await fetch(`${serverUrl}/api/invoices`);
      const json = await res.json();
      if (json.success && json.data) {
        recentSelect.innerHTML = '<option value="">-- Choose from Recent Invoices --</option>';
        json.data.slice(0, 10).forEach(inv => {
          const opt = document.createElement('option');
          opt.value = inv.id;
          opt.textContent = `${inv.invoice_no} (${inv.clients?.applicant_name || 'Buyer'} - $${Number(inv.total_amount).toFixed(0)})`;
          recentSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Could not load recent invoices list:', e.message);
    }
  }

  function showStatus(text, type) {
    statusBox.textContent = text;
    statusBox.className = `status ${type}`;
  }
});
