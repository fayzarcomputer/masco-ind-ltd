// ==============================================================================
// CLIENTS / BUYERS MANAGEMENT LOGIC
// ==============================================================================

let allClients = [];

document.addEventListener('DOMContentLoaded', () => {
  loadClients();

  // Search input filter
  document.getElementById('searchClients').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    renderClients(allClients.filter(c => 
      c.applicant_name.toLowerCase().includes(q) || 
      c.country.toLowerCase().includes(q)
    ));
  });

  // Modal toggle
  const section = document.getElementById('addClientSection');
  document.getElementById('btnOpenAddModal').addEventListener('click', () => {
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btnCloseAddSection').addEventListener('click', () => {
    section.style.display = 'none';
  });

  document.getElementById('btnCancelAdd').addEventListener('click', () => {
    section.style.display = 'none';
  });

  // Add form submission
  document.getElementById('addClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      applicant_name: document.getElementById('newApplicantName').value.trim(),
      country: document.getElementById('newCountry').value.trim(),
      swift_code: document.getElementById('newSwift').value.trim(),
      bank_name: document.getElementById('newBankName').value.trim(),
      bank_branch: document.getElementById('newBankBranch').value.trim(),
      account_no: document.getElementById('newAccountNo').value.trim(),
      office_address: document.getElementById('newAddress').value.trim(),
      notify_party: document.getElementById('newNotifyParty').value.trim()
    };

    try {
      const res = await API.createClient(payload);
      if (res.success) {
        alert('✅ Buyer profile registered successfully!');
        document.getElementById('addClientForm').reset();
        section.style.display = 'none';
        loadClients();
      } else {
        alert('Error: ' + (res.error || 'Failed to create buyer profile'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error: ' + err.message);
    }
  });
});

async function loadClients() {
  try {
    const res = await API.getClients();
    if (res.success && res.data) {
      allClients = res.data;
      renderClients(allClients);
    }
  } catch (err) {
    console.error('Error fetching clients:', err);
    document.getElementById('clientsTableBody').innerHTML = `
      <tr><td colspan="6" class="text-center" style="color: red;">Failed to load clients: ${err.message}</td></tr>
    `;
  }
}

function renderClients(list) {
  const tbody = document.getElementById('clientsTableBody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: #64748b; padding: 2rem;">No buyer profiles found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td><strong>${c.applicant_name}</strong></td>
      <td><span class="badge badge-issued">${c.country}</span></td>
      <td style="font-size: 0.8rem; max-width: 250px;">${c.office_address}</td>
      <td style="font-size: 0.8rem; max-width: 200px;">${c.notify_party || 'Same as consignee'}</td>
      <td style="font-size: 0.8rem;">
        <strong>${c.bank_name || 'N/A'}</strong><br>
        <span style="color: #64748b;">SWIFT: ${c.swift_code || 'N/A'} | A/C: ${c.account_no || 'N/A'}</span>
      </td>
      <td class="text-center">
        <a href="invoice-entry.html" class="btn btn-outline btn-sm">Create Invoice</a>
      </td>
    </tr>
  `).join('');
}
