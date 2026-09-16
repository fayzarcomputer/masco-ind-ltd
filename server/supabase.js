import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-ref')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isConfigured = true;
    console.log('✅ Supabase Client initialized successfully with:', supabaseUrl);
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('ℹ️ Supabase credentials not set in .env. Running in Mock/Demo database mode.');
}

// In-Memory fallback database preloaded with the real Masco Industries Limited export invoice
export const mockDb = {
  users: [
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Fayzar IT Master Admin',
      mobile: '01611000004',
      pin: '9999',
      role: 'master_admin',
      department: 'Systems & Architecture',
      is_active: true
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Masco Commercial Admin',
      mobile: '01911000003',
      pin: '3456',
      role: 'admin',
      department: 'Commercial Management',
      is_active: true
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Kamrul Hasan - Floor Supervisor',
      mobile: '01811000002',
      pin: '2345',
      role: 'supervisor',
      department: 'Export Operations',
      is_active: true
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Md. Rafiqul Islam - Operator',
      mobile: '01711000001',
      pin: '1234',
      role: 'worker',
      supervisor_id: '22222222-2222-2222-2222-222222222222',
      department: 'Data Entry & Packing',
      is_active: true
    },
    {
      id: '11111111-1111-1111-1111-222222222222',
      name: 'Anisur Rahman - Entry Operator',
      mobile: '01711000002',
      pin: '1234',
      role: 'worker',
      supervisor_id: '22222222-2222-2222-2222-222222222222',
      department: 'Data Entry & Packing',
      is_active: true
    }
  ],
  clients: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      applicant_name: 'MALACCA SOURCING PTE. LTD.,',
      office_address: '6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
      country: 'SINGAPORE',
      notify_party: 'MALACCA SOURCING PTE. LTD.,\n6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
      buyer_bank_name: 'DBS Bank Limited',
      buyer_bank_address: '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982',
      buyer_bank_swift: 'DBSSSGSG',
      buyer_bank_account: 'USD Account No.: 0729034931',
      created_at: new Date().toISOString()
    }
  ],
  invoices: [
    {
      id: 'd1205000-0000-0000-0000-000000001205',
      invoice_no: 'MIL/MS/1205/2026',
      invoice_date: '2026-09-12',
      exp_no: '0216-023253-2026',
      exp_date: '2026-09-12',
      sc_no: 'MS26/5002-SS27',
      sc_date: '2026-04-10',
      client_id: '11111111-1111-1111-1111-111111111111',
      exporter_name: 'MASCO INDUSTRIES LIMITED',
      factory_address: '221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH',
      corporate_office: 'Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230',
      contact_phone: 'TEL :(+8802)58194130 & 58954134, FAX: 8293126',
      country_of_origin: 'BANGLADESH',
      
      // Shipper Bank (Pubali Bank PLC)
      shipper_bank_name: 'PUBALI BANK PLC.',
      shipper_bank_branch: 'MOHAKHALI CORPORATE BRANCH, 4, MOHAKHALI C/A, DHAKA-1212, BANGLADESH.',
      shipper_bank_swift: 'PUBABDDH216',
      shipper_account_no: '3678901000862',

      // Buyer Bank (DBS Bank Limited)
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
      clients: {
        applicant_name: 'MALACCA SOURCING PTE. LTD.,',
        office_address: '6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
        country: 'SINGAPORE',
        notify_party: 'MALACCA SOURCING PTE. LTD.,\n6 SHENTON WAY, #18-10, OUE DOWNTOWN, SINGAPORE 068809',
        buyer_bank_name: 'DBS Bank Limited',
        buyer_bank_address: '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982',
        buyer_bank_swift: 'DBSSSGSG',
        buyer_bank_account: 'USD Account No.: 0729034931'
      },
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
  ]
};

export { supabase, isConfigured };
