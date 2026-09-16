import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isConfigured, mockDb } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// -----------------------------------------------------------------------------
// 1. CLIENTS API
// -----------------------------------------------------------------------------
app.get('/api/clients', async (req, res) => {
  try {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('applicant_name', { ascending: true });
      if (error) throw error;
      return res.json({ success: true, source: 'supabase', data });
    } else {
      return res.json({ success: true, source: 'mock', data: mockDb.clients });
    }
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = {
      applicant_name: req.body.applicant_name,
      office_address: req.body.office_address,
      country: req.body.country,
      notify_party: req.body.notify_party || req.body.office_address,
      buyer_bank_name: req.body.buyer_bank_name || '',
      buyer_bank_branch: req.body.buyer_bank_branch || '',
      buyer_bank_swift: req.body.buyer_bank_swift || '',
      buyer_bank_account: req.body.buyer_bank_account || '',
      created_at: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    } else {
      newClient.id = 'client-' + Date.now();
      mockDb.clients.push(newClient);
      return res.status(201).json({ success: true, data: newClient });
    }
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. INVOICES API
// -----------------------------------------------------------------------------
app.get('/api/invoices', async (req, res) => {
  try {
    const { month, client_id, search } = req.query;

    if (isConfigured && supabase) {
      let query = supabase
        .from('invoices')
        .select('*, clients(applicant_name, country)')
        .order('invoice_date', { ascending: false });

      if (client_id) query = query.eq('client_id', client_id);
      if (month) {
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;
        query = query.gte('invoice_date', startDate).lte('invoice_date', endDate);
      }
      if (search) {
        query = query.or(`invoice_no.ilike.%${search}%,exp_no.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, source: 'supabase', data });
    } else {
      let list = [...mockDb.invoices];
      if (client_id) list = list.filter(i => i.client_id === client_id);
      if (month) list = list.filter(i => i.invoice_date && i.invoice_date.startsWith(month));
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(i => 
          (i.invoice_no && i.invoice_no.toLowerCase().includes(q)) ||
          (i.exp_no && i.exp_no.toLowerCase().includes(q))
        );
      }
      return res.json({ success: true, source: 'mock', data: list });
    }
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Single Invoice (Autofill API & Document Renderer)
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConfigured && supabase) {
      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .select('*, clients(*)')
        .eq('id', id)
        .single();

      if (invErr) throw invErr;
      if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

      const { data: items, error: itemsErr } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });

      if (itemsErr) throw itemsErr;

      invoice.invoice_items = items || [];
      return res.json({ success: true, source: 'supabase', data: invoice });
    } else {
      const invoice = mockDb.invoices.find(i => i.id === id || i.invoice_no === id);
      if (!invoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }
      return res.json({ success: true, source: 'mock', data: invoice });
    }
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Invoice
app.post('/api/invoices', async (req, res) => {
  try {
    const {
      invoice_no,
      invoice_date,
      exp_no,
      exp_date,
      sc_no,
      sc_date,
      client_id,
      exporter_name,
      factory_address,
      corporate_office,
      contact_phone,
      country_of_origin,
      shipper_bank_name,
      shipper_bank_branch,
      shipper_bank_swift,
      shipper_account_no,
      buyer_bank_name,
      buyer_bank_address,
      buyer_bank_swift,
      buyer_bank_account,
      e_tin_no,
      bin_no,
      erc_no,
      incoterm,
      currency,
      port_of_loading,
      mode_of_shipment,
      port_of_discharge,
      consignment_no,
      booking_no,
      bill_of_entry_no,
      bill_of_entry_date,
      shipping_marks,
      items
    } = req.body;

    if (!invoice_no || !invoice_date || !client_id) {
      return res.status(400).json({ success: false, error: 'Invoice Number, Date and Client are required.' });
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'At least one line item is required.' });
    }

    let total_carton = 0;
    let total_pcs = 0;
    let total_gross_weight = 0;
    let total_net_weight = 0;
    let total_cbm = 0;
    let total_amount = 0;

    const validatedItems = items.map(item => {
      const carton = parseInt(item.total_carton, 10) || 0;
      const qty = parseInt(item.quantity || item.total_pcs, 10) || 0;
      const gw = parseFloat(item.gross_weight) || 0;
      const nw = parseFloat(item.net_weight) || 0;
      const cbm = parseFloat(item.cbm) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const lineTotal = qty * price;

      total_carton += carton;
      total_pcs += qty;
      total_gross_weight += gw;
      total_net_weight += nw;
      total_cbm += cbm;
      total_amount += lineTotal;

      return {
        order_no: item.order_no || item.po_number || '',
        po_number: item.order_no || item.po_number || '',
        item_ref: item.item_ref || item.style || '152415',
        style: item.item_ref || item.style || '152415',
        production_description: item.production_description || item.item_description || "Women's T-shirt",
        item_description: item.production_description || item.item_description || "Women's T-shirt",
        hs_code: item.hs_code || '610910',
        color_spec: item.color_spec || '',
        total_carton: carton,
        quantity: qty,
        total_pcs: qty,
        gross_weight: parseFloat(gw.toFixed(2)),
        net_weight: parseFloat(nw.toFixed(2)),
        cbm: parseFloat(cbm.toFixed(3)),
        unit_price: parseFloat(price.toFixed(2)),
        line_amount: parseFloat(lineTotal.toFixed(2)),
        line_total: parseFloat(lineTotal.toFixed(2))
      };
    });

    const invoiceData = {
      invoice_no,
      invoice_date,
      exp_no: exp_no || '',
      exp_date: exp_date || null,
      sc_no: sc_no || '',
      sc_date: sc_date || null,
      client_id,
      exporter_name: exporter_name || 'MASCO INDUSTRIES LIMITED',
      factory_address: factory_address || '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
      corporate_office: corporate_office || 'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
      contact_phone: contact_phone || 'TEL :(+8802)58194130 & 58954134, FAX: 8293126',
      country_of_origin: country_of_origin || 'BANGLADESH',
      shipper_bank_name: shipper_bank_name || 'PUBALI BANK PLC.',
      shipper_bank_branch: shipper_bank_branch || 'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
      shipper_bank_swift: shipper_bank_swift || 'PUBABDDH216',
      shipper_account_no: shipper_account_no || '3678901000862',
      buyer_bank_name: buyer_bank_name || '',
      buyer_bank_address: buyer_bank_address || '',
      buyer_bank_swift: buyer_bank_swift || '',
      buyer_bank_account: buyer_bank_account || '',
      e_tin_no: e_tin_no || '860718316349',
      bin_no: bin_no || '000188391-0102',
      erc_no: erc_no || '260326210535120',
      incoterm: incoterm || 'FOB, CHITTAGONG',
      currency: currency || 'USD',
      port_of_loading: port_of_loading || 'CHITTAGONG, BANGLADESH',
      mode_of_shipment: mode_of_shipment || 'BY SEA',
      port_of_discharge: port_of_discharge || 'Khorgos-Almaty, Kazakistan',
      consignment_no: consignment_no || '',
      booking_no: booking_no || '',
      bill_of_entry_no: bill_of_entry_no || '',
      bill_of_entry_date: bill_of_entry_date || null,
      shipping_marks: shipping_marks || 'MAIN MARK BRAND : N/M\nSUPPLIER PO # BULK SPEC.\nSTYLE COLOR Q-TY SIZE\nDESCRIPTION MEAS NET WEIGHT\nGROSS WEIGHT CARTON NO DESTINATION',
      total_carton,
      total_pcs,
      total_gross_weight: parseFloat(total_gross_weight.toFixed(2)),
      total_net_weight: parseFloat(total_net_weight.toFixed(2)),
      total_cbm: parseFloat(total_cbm.toFixed(3)),
      total_amount: parseFloat(total_amount.toFixed(2)),
      status: 'ISSUED'
    };

    if (isConfigured && supabase) {
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();
      if (invErr) throw invErr;

      const itemsToInsert = validatedItems.map(it => ({
        invoice_id: inv.id,
        order_no: it.order_no,
        item_ref: it.item_ref,
        production_description: it.production_description,
        hs_code: it.hs_code,
        color_spec: it.color_spec,
        total_carton: it.total_carton,
        quantity: it.quantity,
        gross_weight: it.gross_weight,
        net_weight: it.net_weight,
        cbm: it.cbm,
        unit_price: it.unit_price,
        line_amount: it.line_amount
      }));

      const { data: insertedItems, error: itErr } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)
        .select();

      if (itErr) throw itErr;

      inv.invoice_items = insertedItems;
      return res.status(201).json({ success: true, data: inv });
    } else {
      const newId = 'inv-' + Date.now();
      const client = mockDb.clients.find(c => c.id === client_id) || {};
      const newInvoice = {
        id: newId,
        ...invoiceData,
        clients: client,
        created_at: new Date().toISOString(),
        invoice_items: validatedItems.map((it, idx) => ({ id: `${newId}-${idx+1}`, ...it }))
      };
      mockDb.invoices.unshift(newInvoice);
      return res.status(201).json({ success: true, data: newInvoice });
    }
  } catch (err) {
    console.error('Error saving invoice:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Invoice
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isConfigured && supabase) {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true, message: 'Invoice deleted successfully' });
    } else {
      const idx = mockDb.invoices.findIndex(i => i.id === id);
      if (idx !== -1) mockDb.invoices.splice(idx, 1);
      return res.json({ success: true, message: 'Invoice deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting invoice:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. ANALYTICS API
// -----------------------------------------------------------------------------
app.get('/api/analytics', async (req, res) => {
  try {
    const { month, year, client_id } = req.query;
    let invoiceList = [];

    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(applicant_name), invoice_items(*)');
      if (error) throw error;
      invoiceList = data || [];
    } else {
      invoiceList = mockDb.invoices;
    }

    if (year) invoiceList = invoiceList.filter(i => i.invoice_date && i.invoice_date.startsWith(year));
    if (month) invoiceList = invoiceList.filter(i => i.invoice_date && i.invoice_date.startsWith(month));
    if (client_id) invoiceList = invoiceList.filter(i => i.client_id === client_id);

    let totalInvoices = invoiceList.length;
    let totalPcs = 0;
    let totalCartons = 0;
    let totalRevenueUSD = 0;
    let totalGrossWeight = 0;
    let totalCBM = 0;

    const monthlyBreakdown = {};
    const buyerBreakdown = {};

    invoiceList.forEach(inv => {
      totalPcs += Number(inv.total_pcs) || 0;
      totalCartons += Number(inv.total_carton) || 0;
      totalRevenueUSD += Number(inv.total_amount) || 0;
      totalGrossWeight += Number(inv.total_gross_weight) || 0;
      totalCBM += Number(inv.total_cbm) || 0;

      const mKey = inv.invoice_date ? inv.invoice_date.substring(0, 7) : 'Unknown';
      if (!monthlyBreakdown[mKey]) {
        monthlyBreakdown[mKey] = { month: mKey, invoices: 0, pcs: 0, cartons: 0, revenue: 0 };
      }
      monthlyBreakdown[mKey].invoices += 1;
      monthlyBreakdown[mKey].pcs += Number(inv.total_pcs) || 0;
      monthlyBreakdown[mKey].cartons += Number(inv.total_carton) || 0;
      monthlyBreakdown[mKey].revenue += Number(inv.total_amount) || 0;

      const buyerName = inv.clients?.applicant_name || 'Direct Buyer';
      if (!buyerBreakdown[buyerName]) {
        buyerBreakdown[buyerName] = { buyer: buyerName, invoices: 0, pcs: 0, revenue: 0 };
      }
      buyerBreakdown[buyerName].invoices += 1;
      buyerBreakdown[buyerName].pcs += Number(inv.total_pcs) || 0;
      buyerBreakdown[buyerName].revenue += Number(inv.total_amount) || 0;
    });

    res.json({
      success: true,
      summary: {
        total_invoices: totalInvoices,
        total_pcs: totalPcs,
        total_cartons: totalCartons,
        total_revenue_usd: parseFloat(totalRevenueUSD.toFixed(2)),
        total_gross_weight_kg: parseFloat(totalGrossWeight.toFixed(2)),
        total_cbm: parseFloat(totalCBM.toFixed(3)),
        total_revenue_bdt: parseFloat((totalRevenueUSD * 122).toFixed(2))
      },
      monthly_summary: Object.values(monthlyBreakdown).sort((a, b) => b.month.localeCompare(a.month)),
      buyer_summary: Object.values(buyerBreakdown).sort((a, b) => b.revenue - a.revenue)
    });
  } catch (err) {
    console.error('Error computing analytics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. AUTHENTICATION & USERS API
// -----------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { mobile, pin } = req.body;
    if (!mobile || !pin) {
      return res.status(400).json({ success: false, error: 'Mobile number and PIN are required.' });
    }

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('mobile', mobile.trim())
          .single();

        if (!error && data) {
          if (data.pin !== pin.trim()) {
            return res.status(401).json({ success: false, error: 'ভুল সিকিউরিটি পিন।' });
          }
          if (data.is_active === false) {
            return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।' });
          }
          return res.json({ success: true, data });
        }
      } catch (sbErr) {
        console.warn('Supabase login query error, using mock fallback:', sbErr.message);
      }
    }

    // Fallback verification
    const user = mockDb.users.find(u => u.mobile === mobile.trim());
    if (!user) {
      return res.status(401).json({ success: false, error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }
    if (user.pin !== pin.trim()) {
      return res.status(401).json({ success: false, error: 'ভুল সিকিউরিটি পিন।' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ success: false, error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, supervisor:supervisor_id(name)')
          .order('created_at', { ascending: true });
        if (!error && data) {
          return res.json({ success: true, data });
        }
      } catch (sbErr) {
        console.warn('Supabase getUsers error, falling back to mockDb:', sbErr.message);
      }
    }
    return res.json({ success: true, data: mockDb.users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = {
      name: req.body.name,
      mobile: req.body.mobile,
      pin: req.body.pin,
      role: req.body.role,
      supervisor_id: req.body.supervisor_id || null,
      department: req.body.department || 'Commercial Export',
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();
        if (!error && data) return res.status(201).json({ success: true, data });
      } catch (sbErr) {
        console.warn('Supabase createUser failed, saving in mockDb:', sbErr.message);
      }
    }

    newUser.id = 'usr-' + Date.now();
    mockDb.users.push(newUser);
    return res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return res.json({ success: true, data });
      } catch (sbErr) {
        console.warn('Supabase updateUser failed, updating in mockDb:', sbErr.message);
      }
    }

    const idx = mockDb.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      mockDb.users[idx] = { ...mockDb.users[idx], ...updates };
      return res.json({ success: true, data: mockDb.users[idx] });
    }
    return res.status(404).json({ success: false, error: 'User not found' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restart server if task running or listen
app.listen(PORT, () => {
  console.log(`🚀 Masco Industries Export Server running at http://localhost:${PORT}`);
});

