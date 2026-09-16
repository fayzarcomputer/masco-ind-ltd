// ==============================================================================
// MASCO INDUSTRIES LIMITED - USER & WORKER MANAGEMENT LOGIC
// Admin & Master Admin Control Panel
// ==============================================================================

let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Security Check: Only Admin or Master Admin can access
  if (!window.Auth || (!window.Auth.isAdmin() && !window.Auth.isMasterAdmin())) {
    alert('অননুমোদিত এক্সেস! এই পেজে প্রবেশের অনুমতি শুধুমাত্র এডমিনের রয়েছে।');
    window.location.href = 'index.html';
    return;
  }

  await loadUsers();

  // Search input
  const searchInput = document.getElementById('searchUser');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      renderUsersTable(allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
      ));
    });
  }

  // Modal bindings
  const modal = document.getElementById('addUserModal');
  const btnOpen = document.getElementById('btnOpenAddUser');
  const btnClose = document.getElementById('btnCloseModal');
  const btnCancel = document.getElementById('btnCancelModal');
  const roleSelect = document.getElementById('userRole');
  const supervisorGroup = document.getElementById('supervisorSelectGroup');

  if (btnOpen) btnOpen.addEventListener('click', () => {
    populateSupervisorDropdown();
    modal.style.display = 'flex';
  });

  if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
  if (btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');

  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'worker') {
        supervisorGroup.style.display = 'block';
      } else {
        supervisorGroup.style.display = 'none';
      }
    });
  }

  // Add User Form Submit
  const form = document.getElementById('addUserForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('userName').value.trim();
      const mobile = document.getElementById('userMobile').value.trim().replace(/[\s\-]/g, '');
      const pin = document.getElementById('userPin').value.trim();
      const role = document.getElementById('userRole').value;
      const supervisor_id = role === 'worker' ? (document.getElementById('userSupervisor').value || null) : null;
      const department = document.getElementById('userDepartment').value.trim();

      const btnSave = document.getElementById('btnSaveUser');
      btnSave.disabled = true;
      btnSave.textContent = 'তৈরি করা হচ্ছে...';

      try {
        const payload = {
          name,
          mobile,
          pin,
          role,
          supervisor_id,
          department,
          is_active: true
        };

        const res = await API.createUser(payload);
        if (res.success) {
          alert(`✅ নতুন অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে!\nনাম: ${name}\nলগইন মোবাইল: ${mobile}\nরোল: ${role.toUpperCase()}`);
          modal.style.display = 'none';
          form.reset();
          await loadUsers();
        } else {
          alert('ত্রুটি: ' + (res.error || 'ইউজার তৈরি করা সম্ভব হয়নি'));
        }
      } catch (err) {
        alert('সার্ভার ত্রুটি: ' + err.message);
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = '💾 আইডি তৈরি নিশ্চিত করুন';
      }
    });
  }
});

// ------------------------------------------------------------------------------
// 1. Load All Users
// ------------------------------------------------------------------------------
async function loadUsers() {
  try {
    const res = await API.getUsers();
    if (res.success && res.data) {
      allUsers = res.data;
      updateStatsCards();
      renderUsersTable(allUsers);
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

// ------------------------------------------------------------------------------
// 2. Update Stats
// ------------------------------------------------------------------------------
function updateStatsCards() {
  const workers = allUsers.filter(u => u.role === 'worker');
  const supervisors = allUsers.filter(u => u.role === 'supervisor');
  const admins = allUsers.filter(u => u.role === 'admin' || u.role === 'master_admin');

  const wEl = document.getElementById('statWorkerCount');
  const sEl = document.getElementById('statSupervisorCount');
  const aEl = document.getElementById('statAdminCount');

  if (wEl) wEl.textContent = workers.length;
  if (sEl) sEl.textContent = supervisors.length;
  if (aEl) aEl.textContent = admins.length;
}

// ------------------------------------------------------------------------------
// 3. Populate Supervisor Dropdown
// ------------------------------------------------------------------------------
function populateSupervisorDropdown() {
  const select = document.getElementById('userSupervisor');
  if (!select) return;

  const supervisors = allUsers.filter(u => u.role === 'supervisor' && u.is_active !== false);

  select.innerHTML = '<option value="">-- সুপারভাইজার নির্ধারণ করুন --</option>';
  supervisors.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.mobile})`;
    select.appendChild(opt);
  });
}

// ------------------------------------------------------------------------------
// 4. Render Table
// ------------------------------------------------------------------------------
function renderUsersTable(list = []) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem; color: #64748b;">কোনো ইউজার পাওয়া যায়নি।</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(u => {
    // Role styling
    let roleBadge = '<span class="badge role-badge-worker">কর্মী (Worker)</span>';
    if (u.role === 'supervisor') roleBadge = '<span class="badge role-badge-supervisor">সুপারভাইজার</span>';
    else if (u.role === 'admin') roleBadge = '<span class="badge role-badge-admin">কোম্পানি এডমিন</span>';
    else if (u.role === 'master_admin') roleBadge = '<span class="badge role-badge-master">মাস্টার এডমিন</span>';

    // Supervisor Name Lookup
    let supervisorName = '-';
    if (u.supervisor_id) {
      const sv = allUsers.find(s => s.id === u.supervisor_id);
      supervisorName = sv ? sv.name : (u.supervisor?.name || 'অ্যাসাইনকৃত');
    }

    const isActive = u.is_active !== false;

    return `
      <tr>
        <td>
          <strong style="color: #0f172a;">${u.name}</strong>
        </td>
        <td>
          <span style="font-family: monospace; font-weight: 700; color: #1e3a8a;">${u.mobile}</span>
        </td>
        <td>${roleBadge}</td>
        <td>${supervisorName}</td>
        <td>${u.department || 'Commercial Export'}</td>
        <td class="text-center">
          <span class="badge ${isActive ? 'badge-issued' : 'badge-draft'}">
            ${isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </span>
        </td>
        <td class="text-center" style="white-space: nowrap;">
          <button class="btn btn-outline btn-sm" onclick="toggleUserStatus('${u.id}', ${!isActive})" title="স্ট্যাটাস পরিবর্তন">
            ${isActive ? '⛔ ডিঅ্যাক্টিভেট' : '✅ অ্যাক্টিভেট'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="resetUserPin('${u.id}', '${u.name}')" title="পিন রিসেট">
            🔑 পিন রিসেট
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ------------------------------------------------------------------------------
// 5. Actions: Toggle Status & Reset PIN
// ------------------------------------------------------------------------------
window.toggleUserStatus = async function(id, newStatus) {
  const actionText = newStatus ? 'অ্যাক্টিভেট' : 'ডিঅ্যাক্টিভেট';
  if (!confirm(`আপনি কি এই আইডিটি ${actionText} করতে চান?`)) return;

  try {
    const res = await API.updateUser(id, { is_active: newStatus });
    if (res.success) {
      alert(`আইডি সফলভাবে ${actionText} করা হয়েছে।`);
      await loadUsers();
    }
  } catch (err) {
    alert('ব্যর্থ হয়েছে: ' + err.message);
  }
};

window.resetUserPin = async function(id, name) {
  const newPin = prompt(`${name} এর জন্য নতুন ৪ অথবা ৬ ডিজিটের সিকিউরিটি পিন লিখুন:`);
  if (!newPin || newPin.trim().length < 4) {
    if (newPin !== null) alert('পিন ন্যূনতম ৪ ডিজিটের হতে হবে।');
    return;
  }

  try {
    const res = await API.updateUser(id, { pin: newPin.trim() });
    if (res.success) {
      alert(`✅ ${name} এর নতুন পিন সফলভাবে সেট করা হয়েছে: ${newPin.trim()}`);
    }
  } catch (err) {
    alert('পিন রিসেট ব্যর্থ হয়েছে: ' + err.message);
  }
};
