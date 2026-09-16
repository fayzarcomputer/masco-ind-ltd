// ==============================================================================
// MASCO INDUSTRIES LIMITED - ROLE-AWARE ANALYTICS & DASHBOARD LOGIC
// Enforces Multi-Tier Access Control: Worker vs Supervisor vs Admin vs Master
// ==============================================================================

let allInvoices = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = window.Auth ? window.Auth.getUser() : null;

  // Apply Role Layout Modifications
  applyRoleUI();

  // Load Dashboard Data
  loadDashboardData();

  // Filter Buttons
  const btnFilter = document.getElementById('btnFilter');
  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      const month = document.getElementById('filterMonth').value;
      loadDashboardData({ month });
    });
  }

  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterMonth').value = '';
      loadDashboardData();
    });
  }

  // Search input
  const searchInput = document.getElementById('searchInvoice');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      renderInvoicesTable(allInvoices.filter(i => 
        (i.invoice_no && i.invoice_no.toLowerCase().includes(q)) ||
        (i.exp_no && i.exp_no.toLowerCase().includes(q)) ||
        (i.clients?.applicant_name && i.clients.applicant_name.toLowerCase().includes(q))
      ));
    });
  }
});

// ------------------------------------------------------------------------------
// 1. Role-Specific UI Layout & Security Restrictions
// ------------------------------------------------------------------------------
function applyRoleUI() {
  if (!currentUser) return;

  const role = currentUser.role;

  if (role === 'worker') {
    // A. WORKER RESTRICTIONS
    const workerBanner = document.getElementById('workerBanner');
    const workerBannerText = document.getElementById('workerBannerText');
    if (workerBanner) {
      workerBanner.style.display = 'flex';
      workerBannerText.textContent = `স্বাগতম, ${currentUser.name} | মোবাইল আইডি: ${currentUser.mobile} | বিভাগ: ${currentUser.department || 'প্যাকিং ও ডেটা এন্ট্রি'}`;
    }

    // Hide company financial revenue card
    const cardRev = document.getElementById('cardRevenue');
    if (cardRev) cardRev.style.display = 'none';

    // Adjust grid to 3 cards
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) statsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';

    // Relabel cards to personal context
    const lblPcs = document.getElementById('lblTotalPcs');
    if (lblPcs) lblPcs.textContent = 'আমার প্যাকিংকৃত পিস (My Pcs)';

    const lblCtn = document.getElementById('lblTotalCarton');
    if (lblCtn) lblCtn.textContent = 'আমার চালান কার্টুন (My Cartons)';

    const lblInv = document.getElementById('lblTotalInvoices');
    if (lblInv) lblInv.textContent = 'আমার মোট চালান (My Invoices)';

    // Hide Buyer-wise revenue card
    const cardBuyer = document.getElementById('cardBuyer');
    if (cardBuyer) cardBuyer.style.display = 'none';

    // Make monthly table full-width
    const cardMonthly = document.getElementById('cardMonthly');
    if (cardMonthly) cardMonthly.style.gridColumn = '1 / -1';

    // Hide all revenue column headers and cells
    document.querySelectorAll('.col-revenue').forEach(el => el.style.display = 'none');

    // Page headings
    const heading = document.getElementById('pageHeading');
    if (heading) heading.textContent = 'আমার বাণিজ্যিক চালান ড্যাশবোর্ড (Worker Consignments)';

    const invTitle = document.getElementById('invoicesTableTitle');
    if (invTitle) invTitle.textContent = '📑 আমার তৈরিকৃত বাণিজ্যিক চালানের তালিকা (My Entries)';

    // Nav: Hide Buyers link
    const navClients = document.getElementById('navLinkClients');
    if (navClients) navClients.style.display = 'none';

  } else if (role === 'supervisor') {
    // B. SUPERVISOR VIEW
    const supervisorBanner = document.getElementById('supervisorBanner');
    const supervisorBannerText = document.getElementById('supervisorBannerText');
    if (supervisorBanner) {
      supervisorBanner.style.display = 'flex';
      supervisorBannerText.textContent = `স্বাগতম, ${currentUser.name} (সুপারভাইজার) | মোবাইল: ${currentUser.mobile} | তদারকি দায়িত্ব: কমার্শিয়াল এক্সপোর্ট ফ্লোর`;
    }

    const teamCard = document.getElementById('supervisorTeamCard');
    if (teamCard) teamCard.style.display = 'block';

    const lblPcs = document.getElementById('lblTotalPcs');
    if (lblPcs) lblPcs.textContent = 'দলের মোট রপ্তানি পিস (Team Pcs)';

    const lblCtn = document.getElementById('lblTotalCarton');
    if (lblCtn) lblCtn.textContent = 'দলের চালান কার্টুন (Team Cartons)';

    const lblInv = document.getElementById('lblTotalInvoices');
    if (lblInv) lblInv.textContent = 'দলের মোট চালান (Team Invoices)';

    const lblRev = document.getElementById('lblRevenue');
    if (lblRev) lblRev.textContent = 'দলের রপ্তানি ভ্যালু (Team Revenue)';

    const invTitle = document.getElementById('invoicesTableTitle');
    if (invTitle) invTitle.textContent = '📑 তদারকি দলের চালান তালিকা ও অনুমোদন (Team Invoices)';

    loadSupervisorTeam();

  } else {
    // C. ADMIN & MASTER ADMIN VIEW
    const adminBanner = document.getElementById('adminBanner');
    const adminBannerText = document.getElementById('adminBannerText');
    if (adminBanner) {
      adminBanner.style.display = 'flex';
      if (role === 'master_admin') {
        adminBannerText.textContent = `মাস্টার সিস্টেম এডমিন: ${currentUser.name} (${currentUser.mobile}) | সম্পূর্ণ সিস্টেম ও ডাটাবেজ পর্যবেক্ষণ এক্সেস সক্রিয়`;
      } else {
        adminBannerText.textContent = `প্রতিষ্ঠান এডমিন: ${currentUser.name} (${currentUser.mobile}) | সকল সুপারভাইজার, কর্মী ও রপ্তানি ডাটা নিয়ন্ত্রিত`;
      }
    }
  }
}

// ------------------------------------------------------------------------------
// 2. Load Supervisor Team Members
// ------------------------------------------------------------------------------
async function loadSupervisorTeam() {
  const tbody = document.getElementById('teamWorkersBody');
  const badge = document.getElementById('teamCountBadge');
  if (!tbody) return;

  try {
    const res = await API.getUsers();
    if (res.success && res.data) {
      // Find workers assigned to this supervisor
      const teamWorkers = res.data.filter(u => u.supervisor_id === currentUser.id || u.role === 'worker');

      if (badge) badge.textContent = `${teamWorkers.length} জন কর্মী`;

      if (teamWorkers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: #64748b; padding: 1.25rem;">আপনার অধীনে কোনো কর্মী এখনো যুক্ত করা হয়নি।</td></tr>`;
        return;
      }

      tbody.innerHTML = teamWorkers.map(w => {
        // Count invoices created by this worker
        const workerInvoices = allInvoices.filter(i => i.created_by === w.id);
        const isActive = w.is_active !== false;

        return `
          <tr>
            <td><strong>${w.name}</strong></td>
            <td><span style="font-family: monospace;">${w.mobile}</span></td>
            <td>${w.department || 'ডেটা এন্ট্রি অপারেটর'}</td>
            <td class="text-center">
              <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 700;">
                ${workerInvoices.length} টি চালান
              </span>
            </td>
            <td class="text-center">
              <span class="badge ${isActive ? 'badge-issued' : 'badge-draft'}">
                ${isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
              </span>
            </td>
            <td class="text-center">
              <button class="btn btn-outline btn-sm" onclick="filterByWorker('${w.id}')" title="এই কর্মীর চালানগুলো দেখুন">
                🔍 চালান ফিল্টার
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (e) {
    console.warn('Failed to load supervisor team:', e);
  }
}

window.filterByWorker = function(workerId) {
  const filtered = allInvoices.filter(i => i.created_by === workerId);
  renderInvoicesTable(filtered);
};

// ------------------------------------------------------------------------------
// 3. Fetch Dashboard Analytics & Invoices
// ------------------------------------------------------------------------------
async function loadDashboardData(params = {}) {
  try {
    // 1. Fetch Analytics Aggregations (Backend or Config filters by role)
    const aRes = await API.getAnalytics(params);
    if (aRes.success) {
      updateStatCards(aRes.summary);
      renderMonthlyTable(aRes.monthly_summary);
      if (currentUser && currentUser.role !== 'worker') {
        renderBuyerTable(aRes.buyer_summary);
      }
    }

    // 2. Fetch Invoices List (Filtered by Role in config.js)
    const iRes = await API.getInvoices(params);
    if (iRes.success && iRes.data) {
      allInvoices = iRes.data;
      renderInvoicesTable(allInvoices);

      // Re-render supervisor team counters if supervisor
      if (currentUser && currentUser.role === 'supervisor') {
        loadSupervisorTeam();
      }
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// ------------------------------------------------------------------------------
// 4. Render Stat Cards
// ------------------------------------------------------------------------------
function updateStatCards(summary = {}) {
  const isWorker = currentUser && currentUser.role === 'worker';

  if (!isWorker) {
    const usd = Number(summary.total_revenue_usd || 0);
    const bdt = Number(summary.total_revenue_bdt || 0);
    const statUSD = document.getElementById('statRevenueUSD');
    const statBDT = document.getElementById('statRevenueBDT');
    if (statUSD) statUSD.textContent = `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (statBDT) statBDT.textContent = `BDT: ৳${bdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (USD 1 = ৳122)`;
  }

  const statPcs = document.getElementById('statTotalPcs');
  if (statPcs) statPcs.textContent = `${(summary.total_pcs || 0).toLocaleString()} Pcs`;

  const statCtn = document.getElementById('statTotalCarton');
  if (statCtn) statCtn.textContent = `${(summary.total_cartons || 0).toLocaleString()} Ctns`;

  const statGw = document.getElementById('statGrossWeight');
  if (statGw) statGw.textContent = `Gross Wt: ${Number(summary.total_gross_weight_kg || 0).toFixed(2)} KG`;

  const statInv = document.getElementById('statTotalInvoices');
  if (statInv) statInv.textContent = `${summary.total_invoices || 0}`;

  const statCbm = document.getElementById('statTotalCBM');
  if (statCbm) statCbm.textContent = `Volume: ${Number(summary.total_cbm || 0).toFixed(3)} CBM`;
}

// ------------------------------------------------------------------------------
// 5. Render Monthly Breakdown Table
// ------------------------------------------------------------------------------
function renderMonthlyTable(monthlyList = []) {
  const tbody = document.getElementById('monthlyTableBody');
  if (!tbody) return;

  const isWorker = currentUser && currentUser.role === 'worker';

  if (!monthlyList || monthlyList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${isWorker ? 4 : 5}" class="text-center" style="color: #64748b;">মাসিক কোনো রপ্তানি রেকর্ড পাওয়া যায়নি।</td></tr>`;
    return;
  }

  tbody.innerHTML = monthlyList.map(m => `
    <tr>
      <td><strong>${m.month}</strong></td>
      <td class="text-center"><span class="badge badge-issued">${m.invoices} টি চালান</span></td>
      <td class="text-right">${m.pcs.toLocaleString()} Pcs</td>
      <td class="text-right">${m.cartons.toLocaleString()} Ctns</td>
      ${!isWorker ? `
        <td class="text-right col-revenue" style="font-weight: 700; color: #1e3a8a;">
          $${m.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      ` : ''}
    </tr>
  `).join('');
}

// ------------------------------------------------------------------------------
// 6. Render Buyer Breakdown Table (Admins & Supervisors Only)
// ------------------------------------------------------------------------------
function renderBuyerTable(buyerList = []) {
  const tbody = document.getElementById('buyerTableBody');
  if (!tbody) return;

  if (!buyerList || buyerList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #64748b;">কোনো বায়ার রপ্তানি তথ্য পাওয়া যায়নি।</td></tr>`;
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

// ------------------------------------------------------------------------------
// 7. Render Invoices Table
// ------------------------------------------------------------------------------
function renderInvoicesTable(list = []) {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  const isWorker = currentUser && currentUser.role === 'worker';
  const isSupervisor = currentUser && currentUser.role === 'supervisor';
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'master_admin');

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2rem; color: #64748b;">কোনো চালান পাওয়া যায়নি। <a href="invoice-entry.html">নতুন চালান তৈরি করুন</a>।</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(inv => {
    const buyerName = inv.clients?.applicant_name || 'N/A';
    const isApproved = inv.approval_status === 'APPROVED';
    const badgeClass = isApproved ? 'badge-approved' : 'badge-pending';
    const badgeText = isApproved ? 'অনুমোদিত (Approved)' : 'অপেক্ষমাণ (Pending)';

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
        ${!isWorker ? `
          <td class="text-right col-revenue" style="font-weight: 700; color: #0f766e;">
            $${Number(inv.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        ` : ''}
        <td class="text-center">
          <span class="badge ${badgeClass}">${badgeText}</span>
        </td>
        <td class="text-center" style="white-space: nowrap;">
          <a href="invoice-view.html?id=${encodeURIComponent(inv.id)}" class="btn btn-primary btn-sm" title="View Commercial Invoice & Packing List">
            📄 চালান দেখুন
          </a>
          
          <button class="btn btn-outline btn-sm btn-icon" onclick="copyInvoiceId('${inv.id}')" title="Chrome Extension Autofill ID কপি করুন">
            📋 ID
          </button>

          ${(isSupervisor || isAdmin) && !isApproved ? `
            <button class="btn btn-sm" style="background: #16a34a; color: #fff; font-weight: 700;" onclick="approveInvoice('${inv.id}')" title="চালানটি অনুমোদন করুন">
              ✓ অনুমোদন
            </button>
          ` : ''}

          ${isAdmin ? `
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteInvoiceItem('${inv.id}')" title="চালান ডিলিট করুন">
              🗑️
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

// ------------------------------------------------------------------------------
// 8. Actions
// ------------------------------------------------------------------------------
window.copyInvoiceId = function(id) {
  navigator.clipboard.writeText(id);
  alert('✅ Invoice ID কপি করা হয়েছে:\n' + id + '\n\nএটি ক্রোম অটোফিল এক্সটেনশনে ব্যবহার করুন।');
};

window.approveInvoice = async function(id) {
  if (!confirm('আপনি কি এই চালানটি অনুমোদন (Approve) করতে চান?')) return;
  try {
    const res = await API.updateInvoiceApproval(id, 'APPROVED');
    if (res.success) {
      alert('✅ চালানটি সফলভাবে অনুমোদন করা হয়েছে!');
      loadDashboardData();
    }
  } catch (e) {
    alert('অনুমোদনে সমস্যা হয়েছে: ' + e.message);
  }
};

window.deleteInvoiceItem = async function(id) {
  if (!confirm('আপনি কি নিশ্চিতভাবে এই রপ্তানি চালানটি মুছে ফেলতে চান?')) return;
  try {
    const res = await API.deleteInvoice(id);
    if (res.success) {
      alert('চালানটি সফলভাবে ডিলিট করা হয়েছে');
      loadDashboardData();
    } else {
      alert('ত্রুটি: ' + res.error);
    }
  } catch (err) {
    alert('চালান ডিলিট ব্যর্থ হয়েছে: ' + err.message);
  }
};
