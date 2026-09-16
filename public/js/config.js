// ==============================================================================
// GLOBAL CONFIGURATION & SUPABASE LIVE REST CLIENT
// Connects to live Supabase on both Localhost & GitHub Pages
// Includes Role-Based Data Isolation & User Governance
// ==============================================================================

const SUPABASE_URL = 'https://qnawduuykgofrqwljhah.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EiF_ux_eYu1VNLBSBnQjkg_iecn0Jmn';

const isGitHubPages = window.location.hostname.includes('github.io');
const API_BASE = window.location.origin;

// Common Supabase HTTP Headers
const sbHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// Unified API Handler
const API = {
  // ----------------------------------------------------------------------------
  // 1. AUTHENTICATION & USERS API
  // ----------------------------------------------------------------------------
  loginUser: async (mobile, pin) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?mobile=eq.${encodeURIComponent(mobile)}&select=*`, {
        headers: sbHeaders
      });
      if (res.ok) {
        const users = await res.json();
        if (users && users.length > 0) {
          const u = users[0];
          if (u.pin === pin) {
            if (u.is_active === false) {
              return { success: false, error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় (Deactivated) করা হয়েছে।' };
            }
            return { success: true, data: u };
          } else {
            return { success: false, error: 'ভুল সিকিউরিটি পিন।' };
          }
        }
      }
    } catch (e) {
      console.warn('Supabase login check failed, falling back to local verification:', e);
    }
    return { success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' };
  },

  getUsers: async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*,supervisor:supervisor_id(name)&order=created_at.asc`, {
        headers: sbHeaders
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, source: 'supabase', data };
      }
    } catch (e) {
      console.warn('Supabase getUsers failed, using local storage:', e);
    }
    const defaultUsers = window.Auth?.DEFAULT_USERS || [];
    const localUsers = JSON.parse(localStorage.getItem('masco_users') || 'null') || defaultUsers;
    return { success: true, source: 'fallback', data: localUsers };
  },

  createUser: async (payload) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data: data[0] };
      }
      const err = await res.json();
      return { success: false, error: err.message };
    } catch (e) {
      console.warn('Create user online failed, saving locally:', e);
    }

    // Local fallback
    const users = JSON.parse(localStorage.getItem('masco_users') || 'null') || [...(window.Auth?.DEFAULT_USERS || [])];
    const newUser = {
      id: 'usr-' + Date.now(),
      created_at: new Date().toISOString(),
      is_active: true,
      ...payload
    };
    users.push(newUser);
    localStorage.setItem('masco_users', JSON.stringify(users));
    return { success: true, source: 'fallback', data: newUser };
  },

  updateUser: async (id, payload) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data: data[0] };
      }
    } catch (e) {
      console.warn('Update user online failed, updating locally:', e);
    }

    // Local fallback
    const users = JSON.parse(localStorage.getItem('masco_users') || 'null') || [...(window.Auth?.DEFAULT_USERS || [])];
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...payload };
      localStorage.setItem('masco_users', JSON.stringify(users));
      return { success: true, source: 'fallback', data: users[idx] };
    }
    return { success: false, error: 'User not found' };
  },

  // ----------------------------------------------------------------------------
  // 2. CLIENTS API
  // ----------------------------------------------------------------------------
  getClients: async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*&order=applicant_name.asc`, {
        headers: sbHeaders
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, source: 'supabase', data };
      }
    } catch (e) {
      console.warn('Supabase fetch failed, trying local server/storage:', e);
    }
    // Local fallback
    const list = JSON.parse(localStorage.getItem('masco_clients') || '[]');
    return { success: true, source: 'fallback', data: list };
  },

  createClient: async (payload) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data: data[0] };
      }
      const err = await res.json();
      return { success: false, error: err.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ----------------------------------------------------------------------------
  // 3. INVOICES API (WITH ROLE-BASED ACCESS CONTROL & AUDIT TRAIL)
  // ----------------------------------------------------------------------------
  getInvoices: async (params = {}) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;

    try {
      let url = `${SUPABASE_URL}/rest/v1/invoices?select=*,clients(applicant_name,country)&order=invoice_date.desc`;
      
      // Role-based data filtering:
      if (currentUser) {
        if (currentUser.role === 'worker') {
          url += `&created_by=eq.${currentUser.id}`;
        } else if (currentUser.role === 'supervisor') {
          url += `&supervisor_id=eq.${currentUser.id}`;
        }
      }

      if (params.worker_id) {
        url += `&created_by=eq.${params.worker_id}`;
      }
      if (params.supervisor_id) {
        url += `&supervisor_id=eq.${params.supervisor_id}`;
      }
      if (params.month) {
        url += `&invoice_date=gte.${params.month}-01&invoice_date=lte.${params.month}-31`;
      }
      if (params.search) {
        url += `&or=(invoice_no.ilike.*${params.search}*,exp_no.ilike.*${params.search}*)`;
      }

      const res = await fetch(url, { headers: sbHeaders });
      if (res.ok) {
        let data = await res.json();
        
        // Enrich data with worker and supervisor snapshots if missing
        const defaultUsers = window.Auth?.DEFAULT_USERS || [];
        const allUsers = JSON.parse(localStorage.getItem('masco_users') || 'null') || defaultUsers;

        data = data.map(inv => {
          const creator = allUsers.find(u => u.id === inv.created_by);
          const supervisor = allUsers.find(u => u.id === inv.supervisor_id);
          return {
            ...inv,
            creator_name: inv.creator_name || (creator ? creator.name : 'অ্যাসাইনকৃত কর্মী'),
            creator_mobile: inv.creator_mobile || (creator ? creator.mobile : '-'),
            supervisor_name: inv.supervisor_name || (supervisor ? supervisor.name : '-'),
            supervisor_mobile: inv.supervisor_mobile || (supervisor ? supervisor.mobile : '-')
          };
        });

        return { success: true, source: 'supabase', data };
      }
    } catch (e) {
      console.warn('Supabase invoices fetch failed:', e);
    }

    // Local fallback with role filtering and worker enrichment
    let list = JSON.parse(localStorage.getItem('masco_invoices') || '[]');
    const defaultUsers = window.Auth?.DEFAULT_USERS || [];
    const allUsers = JSON.parse(localStorage.getItem('masco_users') || 'null') || defaultUsers;

    if (currentUser) {
      if (currentUser.role === 'worker') {
        list = list.filter(i => !i.created_by || i.created_by === currentUser.id);
      } else if (currentUser.role === 'supervisor') {
        list = list.filter(i => !i.supervisor_id || i.supervisor_id === currentUser.id);
      }
    }
    if (params.worker_id) {
      list = list.filter(i => i.created_by === params.worker_id);
    }
    if (params.supervisor_id) {
      list = list.filter(i => i.supervisor_id === params.supervisor_id);
    }
    if (params.month) {
      list = list.filter(i => i.invoice_date && i.invoice_date.startsWith(params.month));
    }

    list = list.map(inv => {
      const creator = allUsers.find(u => u.id === inv.created_by);
      const supervisor = allUsers.find(u => u.id === inv.supervisor_id);
      return {
        ...inv,
        creator_name: inv.creator_name || (creator ? creator.name : 'অ্যাসাইনকৃত কর্মী'),
        creator_mobile: inv.creator_mobile || (creator ? creator.mobile : '-'),
        supervisor_name: inv.supervisor_name || (supervisor ? supervisor.name : '-'),
        supervisor_mobile: inv.supervisor_mobile || (supervisor ? supervisor.mobile : '-')
      };
    });

    return { success: true, source: 'fallback', data: list };
  },

  getInvoiceById: async (id) => {
    const defaultUsers = window.Auth?.DEFAULT_USERS || [];
    const allUsers = JSON.parse(localStorage.getItem('masco_users') || 'null') || defaultUsers;

    try {
      const invRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}&select=*,clients(*)`, {
        headers: sbHeaders
      });
      if (invRes.ok) {
        const invList = await invRes.json();
        if (invList && invList.length > 0) {
          const invoice = invList[0];
          const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/invoice_items?invoice_id=eq.${id}&select=*&order=created_at.asc`, {
            headers: sbHeaders
          });
          if (itemsRes.ok) {
            invoice.invoice_items = await itemsRes.json();
          }

          const creator = allUsers.find(u => u.id === invoice.created_by);
          const supervisor = allUsers.find(u => u.id === invoice.supervisor_id);
          invoice.creator_name = invoice.creator_name || (creator ? creator.name : 'অ্যাসাইনকৃত কর্মী');
          invoice.creator_mobile = invoice.creator_mobile || (creator ? creator.mobile : '-');
          invoice.supervisor_name = invoice.supervisor_name || (supervisor ? supervisor.name : '-');
          invoice.supervisor_mobile = invoice.supervisor_mobile || (supervisor ? supervisor.mobile : '-');

          return { success: true, source: 'supabase', data: invoice };
        }
      }
    } catch (e) {
      console.warn('Supabase invoice by ID fetch failed:', e);
    }
    const list = JSON.parse(localStorage.getItem('masco_invoices') || '[]');
    const inv = list.find(i => i.id === id || i.invoice_no === id);
    if (inv) {
      const creator = allUsers.find(u => u.id === inv.created_by);
      const supervisor = allUsers.find(u => u.id === inv.supervisor_id);
      inv.creator_name = inv.creator_name || (creator ? creator.name : 'অ্যাসাইনকৃত কর্মী');
      inv.creator_mobile = inv.creator_mobile || (creator ? creator.mobile : '-');
      inv.supervisor_name = inv.supervisor_name || (supervisor ? supervisor.name : '-');
      inv.supervisor_mobile = inv.supervisor_mobile || (supervisor ? supervisor.mobile : '-');
      return { success: true, source: 'fallback', data: inv };
    }
    return { success: false, error: 'Invoice not found' };
  },

  createInvoice: async (data) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;
    const defaultUsers = window.Auth?.DEFAULT_USERS || [];
    const allUsers = JSON.parse(localStorage.getItem('masco_users') || 'null') || defaultUsers;

    let supervisor = null;
    if (currentUser?.supervisor_id) {
      supervisor = allUsers.find(u => u.id === currentUser.supervisor_id);
    }

    try {
      let total_carton = 0, total_pcs = 0, total_gw = 0, total_nw = 0, total_cbm = 0, total_amt = 0;
      const validatedItems = (data.items || []).map(it => {
        const ctn = parseInt(it.total_carton, 10) || 0;
        const qty = parseInt(it.quantity || it.total_pcs, 10) || 0;
        const gw = parseFloat(it.gross_weight) || 0;
        const nw = parseFloat(it.net_weight) || 0;
        const cbm = parseFloat(it.cbm) || 0;
        const price = parseFloat(it.unit_price) || 0;
        const lineTotal = qty * price;

        total_carton += ctn;
        total_pcs += qty;
        total_gw += gw;
        total_nw += nw;
        total_cbm += cbm;
        total_amt += lineTotal;

        return {
          order_no: it.order_no || it.po_number || '',
          item_ref: it.item_ref || it.style || '152415',
          production_description: it.production_description || it.item_description || "Women's T-shirt",
          hs_code: it.hs_code || '610910',
          color_spec: it.color_spec || '',
          total_carton: ctn,
          quantity: qty,
          gross_weight: parseFloat(gw.toFixed(2)),
          net_weight: parseFloat(nw.toFixed(2)),
          cbm: parseFloat(cbm.toFixed(3)),
          unit_price: parseFloat(price.toFixed(2)),
          line_amount: parseFloat(lineTotal.toFixed(2))
        };
      });

      const isManager = currentUser && (currentUser.role === 'admin' || currentUser.role === 'master_admin');

      const masterData = {
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        exp_no: data.exp_no || '',
        exp_date: data.exp_date || null,
        sc_no: data.sc_no || '',
        sc_date: data.sc_date || null,
        client_id: data.client_id,
        exporter_name: 'MASCO INDUSTRIES LIMITED',
        factory_address: '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
        corporate_office: 'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
        contact_phone: 'TEL :(+8802)58194130 & 58954134, FAX: 8293126',
        country_of_origin: 'BANGLADESH',
        shipper_bank_name: 'PUBALI BANK PLC.',
        shipper_bank_branch: 'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
        shipper_bank_swift: 'PUBABDDH216',
        shipper_account_no: '3678901000862',
        buyer_bank_name: data.buyer_bank_name || 'DBS Bank Limited',
        buyer_bank_address: data.buyer_bank_address || '',
        buyer_bank_swift: data.buyer_bank_swift || '',
        buyer_bank_account: data.buyer_bank_account || '',
        e_tin_no: '860718316349',
        bin_no: '000188391-0102',
        erc_no: '260326210535120',
        incoterm: data.incoterm || 'FOB, CHITTAGONG',
        currency: data.currency || 'USD',
        port_of_loading: data.port_of_loading || 'CHITTAGONG, BANGLADESH',
        mode_of_shipment: data.mode_of_shipment || 'BY SEA',
        port_of_discharge: data.port_of_discharge || 'Khorgos-Almaty, Kazakistan',
        total_carton,
        total_pcs,
        total_gross_weight: parseFloat(total_gw.toFixed(2)),
        total_net_weight: parseFloat(total_nw.toFixed(2)),
        total_cbm: parseFloat(total_cbm.toFixed(3)),
        total_amount: parseFloat(total_amt.toFixed(2)),
        status: 'ISSUED',
        // Attaching creator and supervisor audit snapshots
        created_by: currentUser ? currentUser.id : null,
        creator_name: currentUser ? currentUser.name : 'Unknown Worker',
        creator_mobile: currentUser ? currentUser.mobile : '',
        supervisor_id: currentUser ? (currentUser.supervisor_id || (currentUser.role === 'supervisor' ? currentUser.id : null)) : null,
        supervisor_name: supervisor ? supervisor.name : (currentUser?.role === 'supervisor' ? currentUser.name : ''),
        supervisor_mobile: supervisor ? supervisor.mobile : (currentUser?.role === 'supervisor' ? currentUser.mobile : ''),
        approval_status: isManager ? 'APPROVED' : 'PENDING',
        approved_by: isManager ? currentUser.id : null,
        approved_by_name: isManager ? currentUser.name : null,
        approval_date: isManager ? new Date().toISOString() : null
      };

      // 1. Insert Invoice
      const invRes = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify(masterData)
      });

      if (!invRes.ok) {
        const err = await invRes.json();
        throw new Error(err.message || 'Failed to save invoice');
      }

      const insertedInv = (await invRes.json())[0];

      // 2. Insert Items
      const itemsToInsert = validatedItems.map(it => ({
        ...it,
        invoice_id: insertedInv.id
      }));

      await fetch(`${SUPABASE_URL}/rest/v1/invoice_items`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify(itemsToInsert)
      });

      return { success: true, data: insertedInv };
    } catch (e) {
      console.error('Save invoice error:', e);
      return { success: false, error: e.message };
    }
  },

  updateInvoiceApproval: async (id, approval_status) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;
    const updates = {
      approval_status: approval_status,
      approved_by: currentUser ? currentUser.id : null,
      approved_by_name: currentUser ? currentUser.name : 'অনুমোদনকারী কর্মকর্তা',
      approval_date: new Date().toISOString()
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify(updates)
      });
      if (res.ok) return { success: true };
    } catch (e) {
      console.warn('Update invoice approval failed online:', e);
    }

    // Local fallback
    const list = JSON.parse(localStorage.getItem('masco_invoices') || '[]');
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      localStorage.setItem('masco_invoices', JSON.stringify(list));
      return { success: true, source: 'fallback', data: list[idx] };
    }
    return { success: true, source: 'fallback' };
  },

  deleteInvoice: async (id) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}`, {
        method: 'DELETE',
        headers: sbHeaders
      });
      if (res.ok) return { success: true };
      const err = await res.json();
      return { success: false, error: err.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ----------------------------------------------------------------------------
  // 4. ANALYTICS API (ROLE-ISOLATED)
  // ----------------------------------------------------------------------------
  getAnalytics: async (params = {}) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;

    try {
      let url = `${SUPABASE_URL}/rest/v1/invoices?select=*,clients(applicant_name),invoice_items(*)`;
      
      // Filter by role
      if (currentUser) {
        if (currentUser.role === 'worker') {
          url += `&created_by=eq.${currentUser.id}`;
        } else if (currentUser.role === 'supervisor') {
          url += `&supervisor_id=eq.${currentUser.id}`;
        }
      }

      if (params.month) {
        url += `&invoice_date=gte.${params.month}-01&invoice_date=lte.${params.month}-31`;
      }
      const res = await fetch(url, { headers: sbHeaders });
      if (res.ok) {
        let invoices = await res.json();

        // Local role filtering assurance
        if (currentUser && currentUser.role === 'worker') {
          invoices = invoices.filter(i => !i.created_by || i.created_by === currentUser.id);
        } else if (currentUser && currentUser.role === 'supervisor') {
          invoices = invoices.filter(i => !i.supervisor_id || i.supervisor_id === currentUser.id);
        }

        let totalPcs = 0, totalCartons = 0, totalRev = 0, totalGw = 0, totalCbm = 0;
        const monthlyMap = {}, buyerMap = {};

        invoices.forEach(inv => {
          totalPcs += Number(inv.total_pcs || 0);
          totalCartons += Number(inv.total_carton || 0);
          totalRev += Number(inv.total_amount || 0);
          totalGw += Number(inv.total_gross_weight || 0);
          totalCbm += Number(inv.total_cbm || 0);

          const m = inv.invoice_date ? inv.invoice_date.substring(0, 7) : '2026-09';
          if (!monthlyMap[m]) monthlyMap[m] = { month: m, invoices: 0, pcs: 0, cartons: 0, revenue: 0 };
          monthlyMap[m].invoices += 1;
          monthlyMap[m].pcs += Number(inv.total_pcs || 0);
          monthlyMap[m].cartons += Number(inv.total_carton || 0);
          monthlyMap[m].revenue += Number(inv.total_amount || 0);

          const b = inv.clients?.applicant_name || 'Buyer';
          if (!buyerMap[b]) buyerMap[b] = { buyer: b, invoices: 0, pcs: 0, revenue: 0 };
          buyerMap[b].invoices += 1;
          buyerMap[b].pcs += Number(inv.total_pcs || 0);
          buyerMap[b].revenue += Number(inv.total_amount || 0);
        });

        return {
          success: true,
          summary: {
            total_invoices: invoices.length,
            total_pcs: totalPcs,
            total_cartons: totalCartons,
            total_revenue_usd: parseFloat(totalRev.toFixed(2)),
            total_revenue_bdt: parseFloat((totalRev * 122).toFixed(2)),
            total_gross_weight_kg: parseFloat(totalGw.toFixed(2)),
            total_cbm: parseFloat(totalCbm.toFixed(3))
          },
          monthly_summary: Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month)),
          buyer_summary: Object.values(buyerMap).sort((a, b) => b.revenue - a.revenue)
        };
      }
    } catch (e) {
      console.warn('Analytics fetch error:', e);
    }
    return {
      success: true,
      summary: { total_invoices: 0, total_pcs: 0, total_cartons: 0, total_revenue_usd: 0, total_revenue_bdt: 0, total_gross_weight_kg: 0, total_cbm: 0 },
      monthly_summary: [],
      buyer_summary: []
    };
  },

  // ----------------------------------------------------------------------------
  // 5. WORKER PERFORMANCE & MONTHLY PRODUCTIVITY ANALYTICS
  // ----------------------------------------------------------------------------
  getWorkerAnalytics: async (params = {}) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;
    try {
      const [usersRes, invRes] = await Promise.all([
        API.getUsers(),
        API.getInvoices(params)
      ]);

      const users = usersRes.data || [];
      const invoices = invRes.data || [];

      // Filter workers: if supervisor, only assigned workers; if admin/master, all workers
      let workers = users.filter(u => u.role === 'worker');
      if (currentUser && currentUser.role === 'supervisor') {
        workers = workers.filter(u => u.supervisor_id === currentUser.id);
      }

      const performanceList = workers.map(w => {
        const sv = users.find(u => u.id === w.supervisor_id);
        const svName = sv ? sv.name : (w.supervisor?.name || 'অ্যাসাইনকৃত');

        // Filter invoices by this worker
        const workerInvoices = invoices.filter(i => i.created_by === w.id);

        let totalPcs = 0;
        let totalCartons = 0;
        let totalValue = 0;
        let approvedCount = 0;
        let pendingCount = 0;

        workerInvoices.forEach(inv => {
          totalPcs += Number(inv.total_pcs || 0);
          totalCartons += Number(inv.total_carton || 0);
          totalValue += Number(inv.total_amount || 0);
          if (inv.approval_status === 'APPROVED') {
            approvedCount++;
          } else {
            pendingCount++;
          }
        });

        const totalInv = workerInvoices.length;
        const approvalRate = totalInv > 0 ? Math.round((approvedCount / totalInv) * 100) : 100;

        // Performance rating grade
        let rating = 'নিয়মিত অগ্রগতি';
        let ratingBadge = 'badge-draft';
        if (totalPcs >= 1000 || totalInv >= 2) {
          rating = '🌟 স্টার পারফর্মার';
          ratingBadge = 'badge-issued';
        } else if (totalPcs >= 500 || totalInv >= 1) {
          rating = '🟢 দক্ষ কর্মী';
          ratingBadge = 'badge-approved';
        }

        return {
          worker_id: w.id,
          name: w.name,
          mobile: w.mobile,
          department: w.department || 'Data Entry & Packing',
          supervisor_id: w.supervisor_id,
          supervisor_name: svName,
          is_active: w.is_active !== false,
          total_invoices: totalInv,
          total_pcs: totalPcs,
          total_cartons: totalCartons,
          total_value_usd: totalValue,
          approved_count: approvedCount,
          pending_count: pendingCount,
          approval_rate: approvalRate,
          rating,
          rating_badge: ratingBadge
        };
      });

      // Sort by total pcs descending
      performanceList.sort((a, b) => b.total_pcs - a.total_pcs);

      const topPerformer = performanceList.length > 0 && performanceList[0].total_invoices > 0 ? performanceList[0] : null;
      const totalTeamPcs = performanceList.reduce((sum, w) => sum + w.total_pcs, 0);
      const totalTeamCartons = performanceList.reduce((sum, w) => sum + w.total_cartons, 0);
      const totalTeamInvoices = performanceList.reduce((sum, w) => sum + w.total_invoices, 0);
      const activeWorkersCount = performanceList.filter(w => w.total_invoices > 0).length;

      return {
        success: true,
        data: performanceList,
        top_performer: topPerformer,
        summary: {
          total_workers: workers.length,
          active_workers: activeWorkersCount,
          total_invoices: totalTeamInvoices,
          total_pcs: totalTeamPcs,
          total_cartons: totalTeamCartons,
          avg_invoices_per_worker: workers.length > 0 ? (totalTeamInvoices / workers.length).toFixed(1) : 0
        }
      };
    } catch (err) {
      console.error('Error computing worker analytics:', err);
      return { success: false, data: [] };
    }
  }
};

window.API = API;
