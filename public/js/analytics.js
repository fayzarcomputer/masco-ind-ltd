// ==============================================================================
// MASCO INDUSTRIES LIMITED - ADVANCED ANALYTICS & WORKER PERFORMANCE MONITORING
// Supports Multi-Tier Access Control, Worker Monthly Productivity & Audit Trail
// ==============================================================================

let allInvoices = [];
let allUsersList = [];
let currentUser = null;
let currentWorkerPerformance = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = window.Auth ? window.Auth.getUser() : null;

  // Apply Role Layout Modifications
  applyRoleUI();

  // Load initial data
  await loadFilterDropdowns();
  await loadDashboardData();
  await loadWorkerPerformanceData();

  // Bind Main Filter Controls
  const btnFilter = document.getElementById('btnFilter');
  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      const month = document.getElementById('filterMonth').value;
      loadDashboardData({ month });
      loadWorkerPerformanceData({ month });
    });
  }

  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filterMonth').value = '';
      loadDashboardData();
      loadWorkerPerformanceData();
    });
  }

  // Bind Worker Performance Month Filter
  const workerFilterMonth = document.getElementById('workerFilterMonth');
  if (workerFilterMonth) {
    workerFilterMonth.addEventListener('change', () => {
      const month = workerFilterMonth.value;
      loadWorkerPerformanceData({ month });
    });
  }

  const btnWorkerFilterReset = document.getElementById('btnWorkerFilterReset');
  if (btnWorkerFilterReset) {
    btnWorkerFilterReset.addEventListener('click', () => {
      if (workerFilterMonth) workerFilterMonth.value = '';
      loadWorkerPerformanceData();
    });
  }

  // Bind Invoices Table Multi-Filters
  const searchInput = document.getElementById('searchInvoice');
  const supervisorSelect = document.getElementById('filterSupervisorSelect');
  const workerSelect = document.getElementById('filterWorkerSelect');
  const approvalSelect = document.getElementById('filterApprovalSelect');

  const onFilterChange = () => applyInvoiceFilters();

  if (searchInput) searchInput.addEventListener('input', onFilterChange);
  if (supervisorSelect) supervisorSelect.addEventListener('change', onFilterChange);
  if (workerSelect) workerSelect.addEventListener('change', onFilterChange);
  if (approvalSelect) approvalSelect.addEventListener('change', onFilterChange);
});

// ------------------------------------------------------------------------------
// 1. Role-Specific UI Layout & Security Restrictions
// ------------------------------------------------------------------------------
function applyRoleUI() {
  if (!currentUser) return;
  const role = currentUser.role;

  const perfSection = document.getElementById('workerPerformanceSection');
  const supFilter = document.getElementById('filterSupervisorSelect');
  const wrkFilter = document.getElementById('filterWorkerSelect');

  if (role === 'worker') {
    // WORKER RESTRICTIONS
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

    // Relabel cards
    const lblPcs = document.getElementById('lblTotalPcs');
    if (lblPcs) lblPcs.textContent = 'আমার প্যাকিংকৃত পিস (My Pcs)';

    const lblCtn = document.getElementById('lblTotalCarton');
    if (lblCtn) lblCtn.textContent = 'আমার চালান কার্টুন (My Cartons)';

    const lblInv = document.getElementById('lblTotalInvoices');
    if (lblInv) lblInv.textContent = 'আমার মোট চালান (My Invoices)';

    // Hide Buyer card and Worker Performance card for worker
    const cardBuyer = document.getElementById('cardBuyer');
    if (cardBuyer) cardBuyer.style.display = 'none';
    if (perfSection) perfSection.style.display = 'none';

    // Make monthly table full-width
    const cardMonthly = document.getElementById('cardMonthly');
    if (cardMonthly) cardMonthly.style.gridColumn = '1 / -1';

    // Hide revenue columns
    document.querySelectorAll('.col-revenue').forEach(el => el.style.display = 'none');

    // Page headings
    const heading = document.getElementById('pageHeading');
    if (heading) heading.textContent = 'আমার বাণিজ্যিক চালান ড্যাশবোর্ড (Worker Consignments)';

    const invTitle = document.getElementById('invoicesTableTitle');
    if (invTitle) invTitle.textContent = '📑 আমার তৈরিকৃত বাণিজ্যিক চালানের তালিকা (My Entries)';

    const navClients = document.getElementById('navLinkClients');
    if (navClients) navClients.style.display = 'none';

  } else if (role === 'supervisor') {
    // SUPERVISOR VIEW
    const supervisorBanner = document.getElementById('supervisorBanner');
    const supervisorBannerText = document.getElementById('supervisorBannerText');
    if (supervisorBanner) {
      supervisorBanner.style.display = 'flex';
      supervisorBannerText.textContent = `স্বাগতম, ${currentUser.name} (সুপারভাইজার) | মোবাইল: ${currentUser.mobile} | তদারকি দায়িত্ব: কমার্শিয়াল এক্সপোর্ট ফ্লোর`;
    }

    // Show Performance Monitoring section
    if (perfSection) perfSection.style.display = 'block';
    if (wrkFilter) wrkFilter.style.display = 'inline-block';

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

  } else {
    // ADMIN & MASTER ADMIN VIEW
    const adminBanner = document.getElementById('adminBanner');
    const adminBannerText = document.getElementById('adminBannerText');
    if (adminBanner) {
      adminBanner.style.display = 'flex';
      if (role === 'master_admin') {
        adminBannerText.textContent = `মাস্টার সিস্টেম এডমিন: ${currentUser.name} (${currentUser.mobile}) | সম্পূর্ণ সিস্টেম ও ডাটাবেজ পর্যবেক্ষণ এক্সেস সক্রিয়`;
      } else {
        adminBannerText.textContent = `প্রতিষ্ঠান প্রধান এডমিন: ${currentUser.name} (${currentUser.mobile}) | সকল সুপারভাইজার, কর্মী ও রপ্তানি ডাটা নিয়ন্ত্রিত`;
      }
    }

    // Show Performance section and both filters
    if (perfSection) perfSection.style.display = 'block';
    if (supFilter) supFilter.style.display = 'inline-block';
    if (wrkFilter) wrkFilter.style.display = 'inline-block';
  }
}

// ------------------------------------------------------------------------------
// 2. Populate Multi-Filter Dropdowns (Supervisors & Workers)
// ------------------------------------------------------------------------------
async function loadFilterDropdowns() {
  try {
    const res = await API.getUsers();
    if (res.success && res.data) {
      allUsersList = res.data;

      const supSelect = document.getElementById('filterSupervisorSelect');
      const wrkSelect = document.getElementById('filterWorkerSelect');

      const supervisors = allUsersList.filter(u => u.role === 'supervisor');
      let workers = allUsersList.filter(u => u.role === 'worker');

      if (currentUser && currentUser.role === 'supervisor') {
        workers = workers.filter(u => u.supervisor_id === currentUser.id);
      }

      if (supSelect) {
        supSelect.innerHTML = '<option value="">-- সকল সুপারভাইজার --</option>';
        supervisors.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = `👔 ${s.name}`;
          supSelect.appendChild(opt);
        });
      }

      if (wrkSelect) {
        wrkSelect.innerHTML = '<option value="">-- সকল কর্মী --</option>';
        workers.forEach(w => {
          const opt = document.createElement('option');
          opt.value = w.id;
          opt.textContent = `👷 ${w.name}`;
          wrkSelect.appendChild(opt);
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load filter users:', err);
  }
}

// ------------------------------------------------------------------------------
// 3. Load Main Dashboard Data
// ------------------------------------------------------------------------------
async function loadDashboardData(params = {}) {
  try {
    const aRes = await API.getAnalytics(params);
    if (aRes.success) {
      updateStatCards(aRes.summary);
      renderMonthlyTable(aRes.monthly_summary);
      if (currentUser && currentUser.role !== 'worker') {
        renderBuyerTable(aRes.buyer_summary);
      }
    }

    const iRes = await API.getInvoices(params);
    if (iRes.success && iRes.data) {
      allInvoices = iRes.data;
      applyInvoiceFilters();
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// ------------------------------------------------------------------------------
// 4. Load Worker Performance & Monthly Productivity Analytics
// ------------------------------------------------------------------------------
async function loadWorkerPerformanceData(params = {}) {
  // Only load for Supervisor, Admin, or Master Admin
  if (!currentUser || currentUser.role === 'worker') return;

  const tbody = document.getElementById('workerPerformanceBody');
  if (!tbody) return;

  try {
    const res = await API.getWorkerAnalytics(params);
    if (res.success && res.data) {
      currentWorkerPerformance = res.data;

      // Update KPI highlights
      const kpiTop = document.getElementById('kpiTopWorker');
      const kpiActive = document.getElementById('kpiActiveWorkers');
      const kpiAvg = document.getElementById('kpiAvgInvoices');
      const kpiAppr = document.getElementById('kpiApprovalRate');

      if (res.top_performer) {
        kpiTop.innerHTML = `<strong>${res.top_performer.name}</strong> <span style="font-size: 0.8rem; color: #166534;">(${res.top_performer.total_pcs.toLocaleString()} Pcs / ${res.top_performer.total_invoices} Inv)</span>`;
      } else {
        kpiTop.textContent = 'তথ্য নেই';
      }

      if (kpiActive) kpiActive.textContent = `${res.summary.active_workers} জন`;
      if (kpiAvg) kpiAvg.textContent = `${res.summary.avg_invoices_per_worker} টি`;

      // Calculate total approval rate across team
      let totalAppr = 0, totalCount = 0;
      res.data.forEach(w => {
        totalAppr += w.approved_count;
        totalCount += w.total_invoices;
      });
      const overallRate = totalCount > 0 ? Math.round((totalAppr / totalCount) * 100) : 100;
      if (kpiAppr) kpiAppr.textContent = `${overallRate}%`;

      // Render Worker Performance Matrix
      if (res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 1.5rem; color: #64748b;">কোনো কর্মীর রেকর্ড পাওয়া যায়নি।</td></tr>`;
        return;
      }

      tbody.innerHTML = res.data.map(w => {
        return `
          <tr>
            <td>
              <strong style="color: #0f172a;">${w.name}</strong>
              <div style="font-size: 0.75rem; color: #64748b;">বিভাগ: ${w.department}</div>
            </td>
            <td><span style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${w.mobile}</span></td>
            <td><span style="color: #0f766e; font-weight: 600;">👔 ${w.supervisor_name}</span></td>
            <td class="text-center">
              <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 0.85rem;">
                ${w.total_invoices} টি চালান
              </span>
            </td>
            <td class="text-right" style="font-weight: 700;">${w.total_pcs.toLocaleString()}</td>
            <td class="text-right" style="font-weight: 700;">${w.total_cartons.toLocaleString()}</td>
            <td class="text-center">
              <span style="font-size: 0.8rem; font-weight: 600; color: #166534;">✓ ${w.approved_count} অনুমোদিত</span>
              ${w.pending_count > 0 ? `<br><span style="font-size: 0.75rem; color: #d97706;">⏳ ${w.pending_count} অপেক্ষমাণ</span>` : ''}
            </td>
            <td class="text-center">
              <span class="badge ${w.rating_badge}">${w.rating}</span>
            </td>
            <td class="text-center">
              <button class="btn btn-outline btn-sm" onclick="filterInvoicesByWorker('${w.worker_id}')" title="এই কর্মীর চালানগুলো ফিল্টার করুন">
                🔍 চালান দেখুন
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading worker performance:', err);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="color: red;">কর্মী পারফরম্যান্স লোড ব্যর্থ হয়েছে: ${err.message}</td></tr>`;
  }
}

// ------------------------------------------------------------------------------
// 5. Invoices Filtering & Rendering
// ------------------------------------------------------------------------------
function applyInvoiceFilters() {
  const search = (document.getElementById('searchInvoice')?.value || '').toLowerCase().trim();
  const supervisorId = document.getElementById('filterSupervisorSelect')?.value || '';
  const workerId = document.getElementById('filterWorkerSelect')?.value || '';
  const status = document.getElementById('filterApprovalSelect')?.value || '';

  let filtered = [...allInvoices];

  if (supervisorId) {
    filtered = filtered.filter(i => i.supervisor_id === supervisorId);
  }

  if (workerId) {
    filtered = filtered.filter(i => i.created_by === workerId);
  }

  if (status) {
    filtered = filtered.filter(i => (i.approval_status || 'PENDING') === status);
  }

  if (search) {
    filtered = filtered.filter(i =>
      (i.invoice_no && i.invoice_no.toLowerCase().includes(search)) ||
      (i.exp_no && i.exp_no.toLowerCase().includes(search)) ||
      (i.creator_name && i.creator_name.toLowerCase().includes(search)) ||
      (i.clients?.applicant_name && i.clients.applicant_name.toLowerCase().includes(search))
    );
  }

  renderInvoicesTable(filtered);
}

window.filterInvoicesByWorker = function(workerId) {
  const wrkSelect = document.getElementById('filterWorkerSelect');
  if (wrkSelect) wrkSelect.value = workerId;
  applyInvoiceFilters();

  // Smooth scroll to invoices table
  const invTable = document.getElementById('invoicesTableTitle');
  if (invTable) invTable.scrollIntoView({ behavior: 'smooth' });
};

// ------------------------------------------------------------------------------
// 6. Render Stat Cards
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
// 7. Render Monthly Table
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
// 8. Render Buyer Table
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
// 9. Render Invoices Table with Worker & Supervisor Snapshots
// ------------------------------------------------------------------------------
function renderInvoicesTable(list = []) {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  const isWorker = currentUser && currentUser.role === 'worker';
  const isSupervisor = currentUser && currentUser.role === 'supervisor';
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'master_admin');

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center" style="padding: 2rem; color: #64748b;">কোনো চালান পাওয়া যায়নি। <a href="invoice-entry.html">নতুন চালান তৈরি করুন</a>।</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(inv => {
    const buyerName = inv.clients?.applicant_name || 'N/A';
    const isApproved = inv.approval_status === 'APPROVED';
    const badgeClass = isApproved ? 'badge-approved' : 'badge-pending';
    const badgeText = isApproved ? 'অনুমোদিত' : 'অপেক্ষমাণ';

    const creatorDisplay = inv.creator_name ? `<strong>${inv.creator_name}</strong><br><span style="font-size:0.75rem; color:#64748b;">📱 ${inv.creator_mobile || ''}</span>` : '-';
    const supervisorDisplay = inv.supervisor_name ? `<span style="color:#0f766e; font-weight:600;">👔 ${inv.supervisor_name}</span>` : '-';

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
        <td>${creatorDisplay}</td>
        <td>${supervisorDisplay}</td>
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
// 10. Actions: Copy, Approve, Delete
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
      await loadDashboardData();
      await loadWorkerPerformanceData();
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
      await loadDashboardData();
      await loadWorkerPerformanceData();
    } else {
      alert('ত্রুটি: ' + res.error);
    }
  } catch (err) {
    alert('চালান ডিলিট ব্যর্থ হয়েছে: ' + err.message);
  }
};
