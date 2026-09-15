// ==============================================================================
// GLOBAL CONFIGURATION & DUAL API / LOCALSTORAGE ENGINE
// Seamlessly works on both Node.js server (localhost:5000) & static GitHub Pages
// ==============================================================================

const API_BASE = window.location.origin;
const isGitHubPages = window.location.hostname.includes('github.io');

// Default initial seed data for static GitHub Pages hosting
const DEFAULT_CLIENTS = [
  {
    id: 'm1111111-1111-1111-1111-111111111111',
    applicant_name: 'MALACCA SOURCING PTE. LTD.,',
    office_address: '6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
    country: 'SINGAPORE',
    notify_party: 'MALACCA SOURCING PTE. LTD.,\n6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
    buyer_bank_name: 'DBS Bank Limited',
    buyer_bank_address: '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982',
    buyer_bank_swift: 'DBSSSGSG',
    buyer_bank_account: 'USD Account No.: 0729034931',
    created_at: '2026-09-12T10:00:00Z'
  }
];

const DEFAULT_INVOICES = [
  {
    id: 'd1205000-0000-0000-0000-000000001205',
    invoice_no: 'MIL/MS/1205/2026',
    invoice_date: '2026-09-12',
    exp_no: '0216-023253-2026',
    exp_date: '2026-09-12',
    sc_no: 'MS26/5002-SS27',
    sc_date: '2026-04-10',
    client_id: 'm1111111-1111-1111-1111-111111111111',
    exporter_name: 'MASCO INDUSTRIES LIMITED',
    factory_address: '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
    corporate_office: 'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
    contact_phone: 'TEL :(+8802)58194130 & 58954134, FAX: 8293126',
    country_of_origin: 'BANGLADESH',
    shipper_bank_name: 'PUBALI BANK PLC.',
    shipper_bank_branch: 'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
    shipper_bank_swift: 'PUBABDDH216',
    shipper_account_no: '3678901000862',
    buyer_bank_name: 'DBS Bank Limited',
    buyer_bank_address: '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982',
    buyer_bank_swift: 'DBSSSGSG',
    buyer_bank_account: 'USD Account No.: 0729034931',
    consignment_no: '',
    booking_no: '',
    e_tin_no: '860718316349',
    bin_no: '000188391-0102',
    erc_no: '260326210535120',
    incoterm: 'FOB, CHITTAGONG',
    currency: 'USD',
    port_of_loading: 'CHITTAGONG, BANGLADESH',
    mode_of_shipment: 'BY SEA',
    port_of_discharge: 'Khorgos-Almaty, Kazakistan',
    bill_of_entry_no: '',
    bill_of_entry_date: null,
    shipping_marks: 'MAIN MARK BRAND : N/M\nSUPPLIER PO # BULK SPEC.\nSTYLE COLOR Q-TY SIZE\nDESCRIPTION MEAS NET WEIGHT\nGROSS WEIGHT CARTON NO DESTINATION',
    total_carton: 22,
    total_pcs: 1002,
    total_gross_weight: 225.90,
    total_net_weight: 196.77,
    total_cbm: 1.023,
    total_amount: 3086.16,
    status: 'ISSUED',
    created_at: '2026-09-12T10:00:00Z',
    clients: DEFAULT_CLIENTS[0],
    invoice_items: [
      {
        id: '1',
        order_no: 'BLSS2700058652BN',
        po_number: 'BLSS2700058652BN',
        item_ref: '152415',
        style: '152415',
        production_description: "Women's T-shirt",
        item_description: "Women's T-shirt",
        hs_code: '610910',
        color_spec: 'BB (black)',
        total_carton: 9,
        quantity: 405,
        total_pcs: 405,
        gross_weight: 88.68,
        net_weight: 77.12,
        cbm: 0.410,
        unit_price: 3.08,
        line_amount: 1247.40,
        line_total: 1247.40
      },
      {
        id: '2',
        order_no: 'BLSS2700058658ML',
        po_number: 'BLSS2700058658ML',
        item_ref: '152415',
        style: '152415',
        production_description: "Women's T-shirt",
        item_description: "Women's T-shirt",
        hs_code: '610910',
        color_spec: 'AA (grey)',
        total_carton: 3,
        quantity: 140,
        total_pcs: 140,
        gross_weight: 31.21,
        net_weight: 26.91,
        cbm: 0.153,
        unit_price: 3.08,
        line_amount: 431.20,
        line_total: 431.20
      },
      {
        id: '3',
        order_no: 'BLSS2700058664BN',
        po_number: 'BLSS2700058664BN',
        item_ref: '152415',
        style: '152415',
        production_description: "Women's T-shirt",
        item_description: "Women's T-shirt",
        hs_code: '610910',
        color_spec: '',
        total_carton: 7,
        quantity: 317,
        total_pcs: 317,
        gross_weight: 73.28,
        net_weight: 64.31,
        cbm: 0.307,
        unit_price: 3.08,
        line_amount: 976.36,
        line_total: 976.36
      },
      {
        id: '4',
        order_no: 'BLSS2700058670ML',
        po_number: 'BLSS2700058670ML',
        item_ref: '152415',
        style: '152415',
        production_description: "Women's T-shirt",
        item_description: "Women's T-shirt",
        hs_code: '610910',
        color_spec: '',
        total_carton: 3,
        quantity: 140,
        total_pcs: 140,
        gross_weight: 32.73,
        net_weight: 28.43,
        cbm: 0.153,
        unit_price: 3.08,
        line_amount: 431.20,
        line_total: 431.20
      }
    ]
  }
];

// LocalStorage Helper for GitHub Pages
function getLocal(key, def) {
  try {
    const v = localStorage.getItem('masco_' + key);
    return v ? JSON.parse(v) : def;
  } catch (e) {
    return def;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem('masco_' + key, JSON.stringify(val));
  } catch (e) {}
}

// Initialize LocalStorage if empty
if (!localStorage.getItem('masco_clients')) setLocal('clients', DEFAULT_CLIENTS);
if (!localStorage.getItem('masco_invoices')) setLocal('invoices', DEFAULT_INVOICES);

// Unified API Object
const API = {
  // 1. Clients
  getClients: async () => {
    if (isGitHubPages) {
      return { success: true, source: 'localStorage', data: getLocal('clients', DEFAULT_CLIENTS) };
    }
    try {
      const r = await fetch(`${API_BASE}/api/clients`);
      if (r.ok) return await r.json();
    } catch (e) {}
    return { success: true, source: 'localStorage', data: getLocal('clients', DEFAULT_CLIENTS) };
  },

  createClient: async (data) => {
    if (!isGitHubPages) {
      try {
        const r = await fetch(`${API_BASE}/api/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    const clients = getLocal('clients', DEFAULT_CLIENTS);
    const newC = { id: 'client-' + Date.now(), ...data, created_at: new Date().toISOString() };
    clients.push(newC);
    setLocal('clients', clients);
    return { success: true, data: newC };
  },

  // 2. Invoices
  getInvoices: async (params = {}) => {
    if (!isGitHubPages) {
      try {
        const qs = new URLSearchParams(params).toString();
        const r = await fetch(`${API_BASE}/api/invoices${qs ? '?' + qs : ''}`);
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    let list = getLocal('invoices', DEFAULT_INVOICES);
    if (params.month) list = list.filter(i => i.invoice_date && i.invoice_date.startsWith(params.month));
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(i => 
        (i.invoice_no && i.invoice_no.toLowerCase().includes(q)) ||
        (i.exp_no && i.exp_no.toLowerCase().includes(q)) ||
        (i.clients?.applicant_name && i.clients.applicant_name.toLowerCase().includes(q))
      );
    }
    return { success: true, source: 'localStorage', data: list };
  },

  getInvoiceById: async (id) => {
    if (!isGitHubPages) {
      try {
        const r = await fetch(`${API_BASE}/api/invoices/${encodeURIComponent(id)}`);
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    const list = getLocal('invoices', DEFAULT_INVOICES);
    const inv = list.find(i => i.id === id || i.invoice_no === id);
    if (inv) return { success: true, source: 'localStorage', data: inv };
    return { success: false, error: 'Invoice not found' };
  },

  createInvoice: async (data) => {
    if (!isGitHubPages) {
      try {
        const r = await fetch(`${API_BASE}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    const list = getLocal('invoices', DEFAULT_INVOICES);
    const clients = getLocal('clients', DEFAULT_CLIENTS);
    const client = clients.find(c => c.id === data.client_id) || {};

    let total_carton = 0, total_pcs = 0, total_gw = 0, total_nw = 0, total_cbm = 0, total_amt = 0;
    const validatedItems = (data.items || []).map((it, idx) => {
      const ctn = parseInt(it.total_carton, 10) || 0;
      const pcs = parseInt(it.quantity || it.total_pcs, 10) || 0;
      const gw = parseFloat(it.gross_weight) || 0;
      const nw = parseFloat(it.net_weight) || 0;
      const cbm = parseFloat(it.cbm) || 0;
      const price = parseFloat(it.unit_price) || 0;
      const lineTotal = pcs * price;

      total_carton += ctn;
      total_pcs += pcs;
      total_gw += gw;
      total_nw += nw;
      total_cbm += cbm;
      total_amt += lineTotal;

      return {
        id: `item-${Date.now()}-${idx + 1}`,
        order_no: it.order_no || it.po_number || '',
        po_number: it.order_no || it.po_number || '',
        item_ref: it.item_ref || it.style || '152415',
        style: it.item_ref || it.style || '152415',
        production_description: it.production_description || it.item_description || "Women's T-shirt",
        item_description: it.production_description || it.item_description || "Women's T-shirt",
        hs_code: it.hs_code || '610910',
        color_spec: it.color_spec || '',
        total_carton: ctn,
        quantity: pcs,
        total_pcs: pcs,
        gross_weight: parseFloat(gw.toFixed(2)),
        net_weight: parseFloat(nw.toFixed(2)),
        cbm: parseFloat(cbm.toFixed(3)),
        unit_price: parseFloat(price.toFixed(2)),
        line_amount: parseFloat(lineTotal.toFixed(2)),
        line_total: parseFloat(lineTotal.toFixed(2))
      };
    });

    const newInv = {
      id: 'inv-' + Date.now(),
      ...data,
      exporter_name: 'MASCO INDUSTRIES LIMITED',
      factory_address: '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
      corporate_office: 'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
      contact_phone: 'TEL :(+8802)58194130 & 58954134, FAX: 8293126',
      country_of_origin: 'BANGLADESH',
      shipper_bank_name: 'PUBALI BANK PLC.',
      shipper_bank_branch: 'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
      shipper_bank_swift: 'PUBABDDH216',
      shipper_account_no: '3678901000862',
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
      clients: client,
      created_at: new Date().toISOString(),
      invoice_items: validatedItems
    };

    list.unshift(newInv);
    setLocal('invoices', list);
    return { success: true, data: newInv };
  },

  deleteInvoice: async (id) => {
    if (!isGitHubPages) {
      try {
        const r = await fetch(`${API_BASE}/api/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (r.ok) return await r.json();
      } catch (e) {}
    }
    let list = getLocal('invoices', DEFAULT_INVOICES);
    list = list.filter(i => i.id !== id);
    setLocal('invoices', list);
    return { success: true, message: 'Deleted' };
  },

  // 3. Analytics
  getAnalytics: async (params = {}) => {
    if (!isGitHubPages) {
      try {
        const qs = new URLSearchParams(params).toString();
        const r = await fetch(`${API_BASE}/api/analytics${qs ? '?' + qs : ''}`);
        if (r.ok) return await r.json();
      } catch (e) {}
    }

    let list = getLocal('invoices', DEFAULT_INVOICES);
    if (params.month) list = list.filter(i => i.invoice_date && i.invoice_date.startsWith(params.month));

    let totalPcs = 0, totalCartons = 0, totalRev = 0, totalGw = 0, totalCbm = 0;
    const monthlyMap = {}, buyerMap = {};

    list.forEach(inv => {
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
        total_invoices: list.length,
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
};

window.API = API;
