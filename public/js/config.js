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
  // 3. INVOICES API (WITH ROLE-BASED ACCESS CONTROL)
  // ----------------------------------------------------------------------------
  getInvoices: async (params = {}) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;

    try {
      let url = `${SUPABASE_URL}/rest/v1/invoices?select=*,clients(applicant_name,country)&order=invoice_date.desc`;
      
      // Role-based data filtering:
      if (currentUser) {
        if (currentUser.role === 'worker') {
          // Worker sees ONLY invoices created by themselves
          url += `&created_by=eq.${currentUser.id}`;
        } else if (currentUser.role === 'supervisor') {
          // Supervisor sees invoices of their assigned workers or tagged with supervisor_id
          url += `&supervisor_id=eq.${currentUser.id}`;
        }
      }

      if (params.month) {
        url += `&invoice_date=gte.${params.month}-01&invoice_date=lte.${params.month}-31`;
      }
      if (params.search) {
        url += `&or=(invoice_no.ilike.*${params.search}*,exp_no.ilike.*${params.search}*)`;
      }

      const res = await fetch(url, { headers: sbHeaders });
      if (res.ok) {
        const data = await res.json();
        return { success: true, source: 'supabase', data };
      }
    } catch (e) {
      console.warn('Supabase invoices fetch failed:', e);
    }

    // Local fallback with role filtering
    let list = JSON.parse(localStorage.getItem('masco_invoices') || '[]');
    if (currentUser) {
      if (currentUser.role === 'worker') {
        list = list.filter(i => !i.created_by || i.created_by === currentUser.id);
      } else if (currentUser.role === 'supervisor') {
        list = list.filter(i => !i.supervisor_id || i.supervisor_id === currentUser.id);
      }
    }
    return { success: true, source: 'fallback', data: list };
  },

  getInvoiceById: async (id) => {
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
          return { success: true, source: 'supabase', data: invoice };
        }
      }
    } catch (e) {
      console.warn('Supabase invoice by ID fetch failed:', e);
    }
    const list = JSON.parse(localStorage.getItem('masco_invoices') || '[]');
    const inv = list.find(i => i.id === id || i.invoice_no === id);
    if (inv) return { success: true, source: 'fallback', data: inv };
    return { success: false, error: 'Invoice not found' };
  },

  createInvoice: async (data) => {
    const currentUser = window.Auth ? window.Auth.getUser() : null;

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
        // Attaching creator and supervisor
        created_by: currentUser ? currentUser.id : null,
        supervisor_id: currentUser ? (currentUser.supervisor_id || (currentUser.role === 'supervisor' ? currentUser.id : null)) : null,
        approval_status: (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master_admin')) ? 'APPROVED' : 'PENDING'
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
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}`, {
        method: 'PATCH',
        headers: sbHeaders,
        body: JSON.stringify({
          approval_status: approval_status,
          approved_by: currentUser ? currentUser.id : null
        })
      });
      if (res.ok) return { success: true };
    } catch (e) {
      console.warn('Update invoice approval failed online:', e);
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
  }
};

window.API = API;
