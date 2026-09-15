// ==============================================================================
// DASHBOARD ANALYTICS & RECENT INVOICES LIST LOGIC
// ==============================================================================

let allInvoices = [];

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();

  // Filter Buttons
  document.getElementById('btnFilter').addEventListener('click', () => {
    const month = document.getElementById('filterMonth').value;
    loadDashboardData({ month });
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('filterMonth').value = '';
    loadDashboardData();
  });

  // Search input
  document.getElementById('searchInvoice').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    renderInvoicesTable(allInvoices.filter(i => 
      (i.invoice_no && i.invoice_no.toLowerCase().includes(q)) ||
      (i.exp_no && i.exp_no.toLowerCase().includes(q)) ||
      (i.clients?.applicant_name && i.clients.applicant_name.toLowerCase().includes(q))
    ));
  });
});

async function loadDashboardData(params = {}) {
  try {
    // 1. Fetch Analytics Aggregations
    const aRes = await API.getAnalytics(params);
    if (aRes.success) {
      updateStatCards(aRes.summary);
      renderMonthlyTable(aRes.monthly_summary);
      renderBuyerTable(aRes.buyer_summary);
    }

    // 2. Fetch Invoices List
    const iRes = await API.getInvoices(params);
    if (iRes.success && iRes.data) {
      allInvoices = iRes.data;
      renderInvoicesTable(allInvoices);
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

function updateStatCards(summary = {}) {
  const usd = Number(summary.total_revenue_usd || 0);
  const bdt = Number(summary.total_revenue_bdt || 0);

  document.getElementById('statRevenueUSD').textContent = `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('statRevenueBDT').textContent = `BDT: ৳${bdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (USD 1 = ৳122)`;
  document.getElementById('statTotalPcs').textContent = `${(summary.total_pcs || 0).toLocaleString()} Pcs`;
  document.getElementById('statTotalCarton').textContent = `${(summary.total_cartons || 0).toLocaleString()} Ctns`;
  document.getElementById('statGrossWeight').textContent = `Gross Wt: ${Number(summary.total_gross_weight_kg || 0).toFixed(2)} KG`;
  document.getElementById('statTotalInvoices').textContent = `${summary.total_invoices || 0}`;
  document.getElementById('statTotalCBM').textContent = `Volume: ${Number(summary.total_cbm || 0).toFixed(3)} CBM`;
}

function renderMonthlyTable(monthlyList = []) {
  const tbody = document.getElementById('monthlyTableBody');
  if (!monthlyList || monthlyList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: #64748b;">No monthly export records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = monthlyList.map(m => `
    <tr>
      <td><strong>${m.month}</strong></td>
      <td class="text-center"><span class="badge badge-issued">${m.invoices} Inv</span></td>
      <td class="text-right">${m.pcs.toLocaleString()} Pcs</td>
      <td class="text-right">${m.cartons.toLocaleString()} Ctns</td>
      <td class="text-right" style="font-weight: 700; color: #1e3a8a;">
        $${m.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('');
}

function renderBuyerTable(buyerList = []) {
  const tbody = document.getElementById('buyerTableBody');
  if (!buyerList || buyerList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #64748b;">No buyer export records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = buyerList.map(b => `
    <tr>
      <td><strong>${b.buyer}</strong></td>
      <td class="text-center">${b.invoices}</td>
      <td class="text-right">${b.pcs.toLocaleString()} Pcs</td>
      <td class="text-right" style="font-weight: 700; color: #0f766e;">
        $${b.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('');
}

function renderInvoicesTable(list = []) {
  const tbody = document.getElementById('invoicesTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2rem; color: #64748b;">No commercial invoices found. <a href="invoice-entry.html">Create your first invoice</a>.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(inv => {
    const buyerName = inv.clients?.applicant_name || 'N/A';
    const badgeClass = inv.status === 'ISSUED' ? 'badge-issued' : 'badge-draft';

    return `
      <tr>
        <td>
          <a href="invoice-view.html?id=${encodeURIComponent(inv.id)}" style="font-weight: 700; color: #1e3a8a; text-decoration: none;">
            ${inv.invoice_no}
          </a>
        </td>
        <td>${inv.invoice_date}</td>
        <td><span style="font-family: monospace; font-size: 0.85rem;">${inv.exp_no || '-'}</span></td>
        <td><strong>${buyerName}</strong></td>
        <td class="text-right">${inv.total_carton}</td>
        <td class="text-right">${Number(inv.total_pcs).toLocaleString()}</td>
        <td class="text-right" style="font-weight: 700; color: #0f766e;">
          $${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td class="text-center"><span class="badge ${badgeClass}">${inv.status}</span></td>
        <td class="text-center" style="white-space: nowrap;">
          <a href="invoice-view.html?id=${encodeURIComponent(inv.id)}" class="btn btn-primary btn-sm" title="View Commercial Invoice & Packing List">
            📄 View Docs
          </a>
          <button class="btn btn-outline btn-sm btn-icon" onclick="copyInvoiceId('${inv.id}')" title="Copy Invoice ID for Autofill">
            📋 ID
          </button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteInvoiceItem('${inv.id}')" title="Delete Invoice">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.copyInvoiceId = function(id) {
  navigator.clipboard.writeText(id);
  alert('✅ Invoice ID copied to clipboard for Chrome Extension Autofill:\n' + id);
};

window.deleteInvoiceItem = async function(id) {
  if (!confirm('Are you sure you want to delete this export invoice record?')) return;
  try {
    const res = await API.deleteInvoice(id);
    if (res.success) {
      alert('Invoice deleted successfully');
      loadDashboardData();
    } else {
      alert('Error: ' + res.error);
    }
  } catch (err) {
    alert('Failed to delete invoice: ' + err.message);
  }
};
