// ==============================================================================
// MASCO INDUSTRIES LIMITED - INVOICE VIEWER & XLSX EXPORT
// 1:1 Pixel-Perfect Replica of Real Commercial Invoice
// ==============================================================================

let currentInvoice = null;
let currentView = 'CI'; // 'CI' or 'PL'

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('id') || 'd1205000-0000-0000-0000-000000001205';

  // Bind Buttons
  document.getElementById('btnViewCI').addEventListener('click', () => switchView('CI'));
  document.getElementById('btnViewPL').addEventListener('click', () => switchView('PL'));
  document.getElementById('btnExportExcel').addEventListener('click', exportToExcel);
  document.getElementById('btnCopyId').addEventListener('click', () => {
    if (currentInvoice && currentInvoice.id) {
      navigator.clipboard.writeText(currentInvoice.id);
      alert('✅ Invoice ID copied for Autofill Extension:\n' + currentInvoice.id);
    }
  });

  try {
    const res = await API.getInvoiceById(invoiceId);
    if (res.success && res.data) {
      currentInvoice = res.data;

      // Role Access Enforcement: Worker can only view their own invoices
      const user = window.Auth ? window.Auth.getUser() : null;
      if (user && user.role === 'worker') {
        if (currentInvoice.created_by && currentInvoice.created_by !== user.id) {
          alert('🚫 অননুমোদিত এক্সেস! আপনি শুধুমাত্র আপনার নিজের তৈরিকৃত চালান দেখতে পারেন।');
          window.location.href = 'index.html';
          return;
        }
      }

      renderDocument();
    } else {
      document.getElementById('printableArea').innerHTML = `
        <div style="text-align: center; color: red; padding: 3rem;">
          <h3>Invoice Not Found</h3>
          <p>${res.error || 'The requested export invoice could not be found.'}</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading invoice:', err);
  }
});

function switchView(view) {
  currentView = view;
  const btnCI = document.getElementById('btnViewCI');
  const btnPL = document.getElementById('btnViewPL');

  if (view === 'CI') {
    btnCI.className = 'btn btn-primary btn-sm';
    btnPL.className = 'btn btn-outline btn-sm';
  } else {
    btnPL.className = 'btn btn-primary btn-sm';
    btnCI.className = 'btn btn-outline btn-sm';
  }

  renderDocument();
}

function renderDocument() {
  if (!currentInvoice) return;
  if (currentView === 'CI') {
    renderCommercialInvoice();
  } else {
    renderPackingList();
  }
}

// ------------------------------------------------------------------------------
// 1. EXACT REAL-WORLD COMMERCIAL INVOICE
// ------------------------------------------------------------------------------
function renderCommercialInvoice() {
  const inv = currentInvoice;
  const client = inv.clients || {};
  const items = inv.invoice_items || [];

  let itemsHtml = '';
  let hsCodeCommon = '610910';

  items.forEach(it => {
    const orderNo = it.order_no || it.po_number || '';
    const itemRef = it.item_ref || it.style || '152415';
    const desc = it.production_description || it.item_description || "Women's T-shirt";
    const qty = Number(it.quantity || it.total_pcs || 0);
    const unitPrice = Number(it.unit_price || 0).toFixed(2);
    const amount = Number(it.line_amount || it.line_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (it.hs_code) hsCodeCommon = it.hs_code;

    itemsHtml += `
      <tr>
        <td style="font-family: monospace; font-size: 8pt; padding: 4px 6px;">${orderNo}</td>
        <td style="text-align: center; font-size: 8pt; padding: 4px 6px;">${itemRef}</td>
        <td style="padding: 4px 6px; font-size: 8pt;">
          <div style="display: flex; justify-content: space-between;">
            <span>${desc}</span>
            <span style="font-family: monospace; color: #333;">${it.hs_code || '610910'}</span>
          </div>
        </td>
        <td style="text-align: right; font-size: 8pt; padding: 4px 6px;">
          ${qty.toLocaleString()} <span style="font-size: 7.5pt; color: #444;">PCS</span>
        </td>
        <td style="text-align: right; font-size: 8pt; padding: 4px 6px;">
          $ ${unitPrice} <span style="font-size: 7pt; color: #444;">/PCS</span>
        </td>
        <td style="text-align: right; font-weight: bold; font-size: 8pt; padding: 4px 6px;">
          $${amount}
        </td>
      </tr>
    `;
  });

  const totalQty = Number(inv.total_pcs || 0);
  const totalAmount = Number(inv.total_amount || 0);
  const totalCartons = Number(inv.total_carton || 0);
  const totalGross = Number(inv.total_gross_weight || 0).toFixed(2);
  const totalNet = Number(inv.total_net_weight || 0).toFixed(2);
  const totalCbm = Number(inv.total_cbm || 0).toFixed(3);

  const amountInWords = 'TOTAL U. S. DOLLARS ' + numberToWords(totalAmount) + '.';

  const html = `
    <!-- Masco Official Header -->
    <div class="masco-header-wrapper">
      <div class="masco-logo-box">
        <img src="assets/masco-logo.svg" alt="MASCO" style="width: 70px;">
      </div>
      <div class="masco-company-info">
        <div class="masco-company-title">MASCO INDUSTRIES LIMITED</div>
        <div class="masco-address-line">FACTORY: 221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH</div>
        <div class="masco-address-line">CORPORATE OFFICE: Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230,</div>
        <div class="masco-address-line">TEL :(+8802)58194130 & 58954134, FAX: 8293126</div>
      </div>
    </div>

    <div class="masco-doc-title">COMMERCIAL INVOICE</div>

    <!-- Master Information Table -->
    <table class="masco-master-table">
      <!-- Row 1: Exporter vs Invoice No / Date / EXP -->
      <tr>
        <td style="width: 48%;">
          <span class="masco-lbl">EXPORTER NAME & ADDRESS:</span><br>
          <strong>${inv.exporter_name || 'MASCO INDUSTRIES LIMITED'}</strong><br>
          ${inv.factory_address || '221-223, KHARTAIL, SHATAISH ROAD,'}<br>
          TONGI, GAZIPUR-1712, BANGLADESH
        </td>
        <td style="width: 52%; padding: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border: none; border-bottom: 1px solid #000; width: 50%; padding: 2px 4px;">
                <span class="masco-lbl">INVOICE NO. :</span> ${inv.invoice_no}
              </td>
              <td style="border: none; border-bottom: 1px solid #000; border-left: 1px solid #000; width: 50%; padding: 2px 4px;">
                <span class="masco-lbl">DATE :</span> ${inv.invoice_date}
              </td>
            </tr>
            <tr>
              <td style="border: none; border-bottom: 1px solid #000; padding: 2px 4px;">
                <span class="masco-lbl">EXP NO. :</span> ${inv.exp_no || '0216-023253-2026'}
              </td>
              <td style="border: none; border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 2px 4px;">
                <span class="masco-lbl">DATE :</span> ${inv.exp_date || inv.invoice_date}
              </td>
            </tr>
            <tr>
              <td style="border: none; padding: 2px 4px;">
                <span class="masco-lbl">S/C NO: :</span> ${inv.sc_no || 'MS26/5002-SS27'}
              </td>
              <td style="border: none; border-left: 1px solid #000; padding: 2px 4px;">
                <span class="masco-lbl">DATE :</span> ${inv.sc_date || '10.04.2026'}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Row 2: Applicant vs Shipper Bank -->
      <tr>
        <td>
          <span class="masco-lbl">APPLICANT:</span><br>
          <strong>${client.applicant_name || 'MALACCA SOURCING PTE. LTD.,'}</strong><br>
          ${client.office_address || '6 SHENTON WAY, #18-10, OUE DOWNTOWN , SINGAPORE 068809'}
        </td>
        <td>
          <div style="margin-bottom: 3px;">
            <span class="masco-lbl">COUNTRY OF ORIGIN :</span> ${inv.country_of_origin || 'BANGLADESH'}
          </div>
          <span class="masco-lbl">SHIPPER/NEGOTIATING BANK:</span><br>
          <strong>${inv.shipper_bank_name || 'PUBALI BANK PLC.'}</strong><br>
          ${inv.shipper_bank_branch || 'MOHAKHALI CORPORATE BRANCH,4, MOHAKHALI C/A,DHAKA-1212, BANGLADESH.'}<br>
          <span class="masco-lbl">SWIFT:</span> ${inv.shipper_bank_swift || 'PUBABDDH216'}<br>
          <span class="masco-lbl">ACCOUNT NUMBER :</span> ${inv.shipper_account_no || '3678901000862'}
        </td>
      </tr>

      <!-- Row 3: Notify Party vs Buyer Bank -->
      <tr>
        <td>
          <span class="masco-lbl">NOTIFY PARTY :</span><br>
          <strong>${client.notify_party ? client.notify_party.split('\n')[0] : (client.applicant_name || 'MALACCA SOURCING PTE. LTD.,')}</strong><br>
          ${client.notify_party ? client.notify_party.split('\n').slice(1).join('<br>') : (client.office_address || '6 SHENTON WAY, #18-10, OUE DOWNTOWN , SINGAPORE 068809')}
        </td>
        <td>
          <span class="masco-lbl">BUYER BANK:</span><br>
          <strong>${inv.buyer_bank_name || 'DBS Bank Limited'}</strong><br>
          ${inv.buyer_bank_address || '12 Marina Boulevard, Marina Bay Financial Centre Tower 3, Singapore 018982'}<br>
          USD Account No.: ${inv.buyer_bank_account || '0729034931'}, SWIFT: ${inv.buyer_bank_swift || 'DBSSSGSG'}<br>
          <div style="display: flex; gap: 15px; margin-top: 2px;">
            <span><span class="masco-lbl">Consigment#</span> ${inv.consignment_no || ''}</span>
            <span><span class="masco-lbl">Booking#</span> ${inv.booking_no || ''}</span>
          </div>
        </td>
      </tr>

      <!-- Row 4: Shipping Marks, Ports & Tax/Trade Info -->
      <tr>
        <td colspan="2" style="padding: 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 33%; border: none; border-right: 1px solid #000; vertical-align: top; padding: 4px;">
                <div style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 2px;">SHIPPING MARKS</div>
                <div style="font-size: 6.8pt; line-height: 1.25; color: #111;">
                  MAIN MARK BRAND : N/M<br>
                  SUPPLIER PO # BULK SPEC.<br>
                  STYLE COLOR Q-TY SIZE<br>
                  DESCRIPTION MEAS NET WEIGHT<br>
                  GROSS WEIGHT CARTON NO DESTINATION
                </div>
              </td>
              <td style="width: 42%; border: none; border-right: 1px solid #000; vertical-align: top; padding: 4px;">
                <span class="masco-lbl">Port of Loading:</span> ${inv.port_of_loading || 'CHITTAGONG,BANGLADESH'}<br>
                <span class="masco-lbl">MODE OF SHIPMENT:</span> ${inv.mode_of_shipment || 'BY SEA'}<br>
                <span class="masco-lbl">PORT OF DISCHARGE & Place of Delivery:</span><br>
                ${inv.port_of_discharge || 'Khorgos-Almaty, Kazakistan'}<br>
                <span class="masco-lbl">Bill of Entry no.:</span> ${inv.bill_of_entry_no || ''} &nbsp;&nbsp; <span class="masco-lbl">Date :</span> ${inv.bill_of_entry_date || ''}
              </td>
              <td style="width: 25%; border: none; vertical-align: top; padding: 4px;">
                <span class="masco-lbl">E-TIN NO. :</span> ${inv.e_tin_no || '860718316349'}<br>
                <span class="masco-lbl">BIN NO.</span> ${inv.bin_no || '000188391-0102'}<br>
                <span class="masco-lbl">ERC NO</span> ${inv.erc_no || '260326210535120'}<br>
                <span class="masco-lbl">INCOTERM:</span> :${inv.incoterm || 'FOB, CHITTAGONG'}<br>
                <span class="masco-lbl">INV CURRENCY:</span> :${inv.currency || 'USD'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Line Items Table -->
    <table class="masco-items-table">
      <thead>
        <tr>
          <th style="width: 135px;">ORDER NO</th>
          <th style="width: 90px;">ITEM REF.</th>
          <th>PRODUCTION DESCRIPTION</th>
          <th style="width: 110px;">QUANTITY</th>
          <th style="width: 100px;">UNIT PRICE</th>
          <th style="width: 110px;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <!-- Subheader -->
        <tr>
          <td></td>
          <td></td>
          <td style="font-weight: bold; text-decoration: underline; font-size: 7.5pt; padding: 2px 6px;">
            READYMADE GARMENTS
          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        ${itemsHtml}
        <!-- HS Code sub-row -->
        <tr>
          <td></td>
          <td></td>
          <td style="text-align: center; font-weight: bold; font-size: 7.5pt;">
            H.S.CODE : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${hsCodeCommon}
          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <!-- Totals Row -->
        <tr style="font-weight: bold; background: #fff;">
          <td colspan="3" style="text-align: right; padding-right: 15px;">TOTAL</td>
          <td style="text-align: right; padding-right: 6px;">${totalQty.toLocaleString()} PCS</td>
          <td></td>
          <td style="text-align: right; padding-right: 6px;">$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <!-- Total Value Bar -->
    <div style="display: flex; justify-content: flex-end; border: 1px solid #000; border-top: none; padding: 3px 6px; font-size: 8pt; font-weight: bold;">
      <span style="margin-right: 25px;">TOTAL VALUE:</span>
      <span>$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>

    <!-- Amount in Words -->
    <div class="masco-amount-words">
      ${amountInWords}
    </div>

    <!-- Bottom Summary Box (Left Box & Right Summary Table) -->
    <div class="masco-summary-container avoid-break">
      <!-- Left Box -->
      <table class="masco-left-summary-table">
        <tr>
          <td>TOTAL QNTY</td>
          <td style="text-align: right;">${totalQty.toLocaleString()} PCS</td>
        </tr>
        <tr>
          <td>TOTAL CTNS</td>
          <td style="text-align: right;">${totalCartons} CTN</td>
        </tr>
        <tr>
          <td>TOTAL GR.WT</td>
          <td style="text-align: right;">${totalGross} KGS</td>
        </tr>
        <tr>
          <td>TOTAL NT.WT</td>
          <td style="text-align: right;">${totalNet} KGS</td>
        </tr>
        <tr>
          <td>TOTAL CBM</td>
          <td style="text-align: right;">${totalCbm} CBM</td>
        </tr>
      </table>

      <!-- Right Summary Breakdown Table -->
      <table class="masco-right-summary-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>HS Code</th>
            <th>Qty</th>
            <th>Value</th>
            <th>Ctn Qty</th>
            <th>Nt.Wt.</th>
            <th>Gross Wt.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
              <td style="text-align: left; font-weight: bold;">Women's T-shirt</td>
            <td>${hsCodeCommon}</td>
            <td>${totalQty.toLocaleString()}</td>
            <td>$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${totalCartons}</td>
            <td>${totalNet}</td>
            <td>${totalGross}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Signatures & Audit Trail -->
    <div style="display: flex; justify-content: space-between; margin-top: 2rem; padding: 10px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;" class="avoid-break">
      <div style="text-align: left; font-size: 7.5pt; max-width: 220px;">
        <div style="font-weight: bold; color: #1e3a8a; text-transform: uppercase;">প্রস্তুতকারক কর্মী (PREPARED BY):</div>
        <div style="font-weight: 700; margin-top: 2px; color: #0f172a;">${inv.creator_name || 'Md. Rafiqul Islam - Operator'}</div>
        <div style="font-size: 7pt; color: #64748b;">আইডি / মোবাইল: ${inv.creator_mobile || '01711000001'}</div>
        <div style="font-size: 7pt; color: #64748b;">এন্ট্রি তারিখ: ${inv.invoice_date || '-'}</div>
      </div>

      <div style="text-align: left; font-size: 7.5pt; max-width: 230px;">
        <div style="font-weight: bold; color: #0f766e; text-transform: uppercase;">তদারককারী কর্মকর্তা (SUPERVISED BY):</div>
        <div style="font-weight: 700; margin-top: 2px; color: #0f172a;">${inv.supervisor_name || 'Kamrul Hasan - Floor Supervisor'}</div>
        <div style="font-size: 7pt; color: #64748b;">মোবাইল: ${inv.supervisor_mobile || '01811000002'}</div>
        <div style="font-size: 7pt; color: #64748b;">বিভাগ: Commercial Export Operations</div>
      </div>

      <div style="text-align: right; font-size: 7.5pt; max-width: 230px;">
        <div style="font-weight: bold; color: #000; text-transform: uppercase;">অনুমোদনকারী (AUTHORIZED SIGNATORY):</div>
        <div style="margin-top: 3px;">
          ${inv.approval_status === 'APPROVED' 
            ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-weight: bold; border: 1px solid #22c55e;">অনুমোদিত (APPROVED)</span>' 
            : '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; font-weight: bold; border: 1px solid #f59e0b;">অপেক্ষমাণ (PENDING)</span>'}
        </div>
        <div style="font-size: 7pt; color: #555; margin-top: 2px;">MASCO INDUSTRIES LIMITED</div>
      </div>
    </div>
  `;

  document.getElementById('printableArea').innerHTML = html;
}

// ------------------------------------------------------------------------------
// 2. REAL PACKING LIST (CARTON-BY-CARTON SUMMARY)
// ------------------------------------------------------------------------------
function renderPackingList() {
  const inv = currentInvoice;
  const client = inv.clients || {};
  const items = inv.invoice_items || [];

  let startCarton = 1;
  let itemsHtml = '';

  items.forEach((it, idx) => {
    const cartonCount = Number(it.total_carton || 0);
    const endCarton = startCarton + cartonCount - 1;
    const cartonRange = cartonCount > 1 ? `${startCarton} - ${endCarton}` : `${startCarton}`;
    startCarton = endCarton + 1;

    const pcs = Number(it.quantity || it.total_pcs || 0);
    const pcsPerCtn = cartonCount > 0 ? Math.round(pcs / cartonCount) : pcs;

    itemsHtml += `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center; font-weight: bold;">${cartonRange}</td>
        <td style="font-family: monospace;">${it.order_no || it.po_number || ''}</td>
        <td style="text-align: center;">${it.item_ref || it.style || '152415'}</td>
        <td style="text-align: center;">${it.color_spec || 'N/A'}</td>
        <td>${it.production_description || it.item_description || "Women's T-shirt"}</td>
        <td style="text-align: right;">${cartonCount}</td>
        <td style="text-align: right;">${pcsPerCtn}</td>
        <td style="text-align: right; font-weight: bold;">${pcs.toLocaleString()}</td>
        <td style="text-align: right;">${Number(it.net_weight || 0).toFixed(2)}</td>
        <td style="text-align: right;">${Number(it.gross_weight || 0).toFixed(2)}</td>
        <td style="text-align: right;">${Number(it.cbm || 0).toFixed(3)}</td>
      </tr>
    `;
  });

  const totalQty = Number(inv.total_pcs || 0);
  const totalCartons = Number(inv.total_carton || 0);
  const totalGross = Number(inv.total_gross_weight || 0).toFixed(2);
  const totalNet = Number(inv.total_net_weight || 0).toFixed(2);
  const totalCbm = Number(inv.total_cbm || 0).toFixed(3);

  const html = `
    <!-- Masco Official Header -->
    <div class="masco-header-wrapper">
      <div class="masco-logo-box">
        <img src="assets/masco-logo.svg" alt="MASCO" style="width: 70px;">
      </div>
      <div class="masco-company-info">
        <div class="masco-company-title">MASCO INDUSTRIES LIMITED</div>
        <div class="masco-address-line">FACTORY: 221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH</div>
        <div class="masco-address-line">CORPORATE OFFICE: Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230,</div>
        <div class="masco-address-line">TEL :(+8802)58194130 & 58954134, FAX: 8293126</div>
      </div>
    </div>

    <div class="masco-doc-title">PACKING LIST & DETAIL SHEET</div>

    <!-- Master Info -->
    <table class="masco-master-table">
      <tr>
        <td style="width: 50%;">
          <span class="masco-lbl">BUYER / CONSIGNEE:</span><br>
          <strong>${client.applicant_name || 'MALACCA SOURCING PTE. LTD.,'}</strong><br>
          ${client.office_address || '6 SHENTON WAY, #18-10, OUE DOWNTOWN , SINGAPORE 068809'}
        </td>
        <td style="width: 50%;">
          <span class="masco-lbl">INVOICE NO:</span> <strong>${inv.invoice_no}</strong> &nbsp;|&nbsp; <span class="masco-lbl">DATE:</span> ${inv.invoice_date}<br>
          <span class="masco-lbl">EXP FORM NO:</span> ${inv.exp_no || '0216-023253-2026'}<br>
          <span class="masco-lbl">S/C OR L/C NO:</span> ${inv.sc_no || 'MS26/5002-SS27'}<br>
          <span class="masco-lbl">PORT OF LOADING:</span> ${inv.port_of_loading || 'CHITTAGONG'}<br>
          <span class="masco-lbl">DISCHARGE PORT:</span> ${inv.port_of_discharge || 'Khorgos-Almaty, Kazakistan'}
        </td>
      </tr>
    </table>

    <!-- Packing Table -->
    <table class="masco-items-table">
      <thead>
        <tr>
          <th style="width: 25px;">SL</th>
          <th style="width: 70px;">CTN NO</th>
          <th style="width: 120px;">ORDER / PO NO</th>
          <th style="width: 65px;">STYLE</th>
          <th style="width: 60px;">COLOR</th>
          <th>DESCRIPTION</th>
          <th style="width: 50px;">CTNS</th>
          <th style="width: 55px;">PCS/CTN</th>
          <th style="width: 65px;">TOTAL PCS</th>
          <th style="width: 65px;">N.W (KG)</th>
          <th style="width: 65px;">G.W (KG)</th>
          <th style="width: 55px;">CBM</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="font-weight: bold; background: #f8fafc;">
          <td colspan="6" style="text-align: right; padding-right: 8px;">TOTALS:</td>
          <td style="text-align: right;">${totalCartons}</td>
          <td></td>
          <td style="text-align: right;">${totalQty.toLocaleString()}</td>
          <td style="text-align: right;">${totalNet}</td>
          <td style="text-align: right;">${totalGross}</td>
          <td style="text-align: right;">${totalCbm}</td>
        </tr>
      </tbody>
    </table>

    <!-- Packing List Audit Trail & Verification -->
    <div style="display: flex; justify-content: space-between; margin-top: 2rem; padding: 10px 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;" class="avoid-break">
      <div style="text-align: left; font-size: 7.5pt; max-width: 220px;">
        <div style="font-weight: bold; color: #1e3a8a; text-transform: uppercase;">প্যাকিং প্রস্তুতকারী কর্মী (PACKED BY):</div>
        <div style="font-weight: 700; margin-top: 2px; color: #0f172a;">${inv.creator_name || 'Md. Rafiqul Islam - Operator'}</div>
        <div style="font-size: 7pt; color: #64748b;">আইডি / মোবাইল: ${inv.creator_mobile || '01711000001'}</div>
        <div style="font-size: 7pt; color: #64748b;">তৈরি তারিখ: ${inv.invoice_date || '-'}</div>
      </div>

      <div style="text-align: left; font-size: 7.5pt; max-width: 230px;">
        <div style="font-weight: bold; color: #0f766e; text-transform: uppercase;">প্যাকিং পরিদর্শক (INSPECTED BY):</div>
        <div style="font-weight: 700; margin-top: 2px; color: #0f172a;">${inv.supervisor_name || 'Kamrul Hasan - Floor Supervisor'}</div>
        <div style="font-size: 7pt; color: #64748b;">মোবাইল: ${inv.supervisor_mobile || '01811000002'}</div>
        <div style="font-size: 7pt; color: #64748b;">বিভাগ: Quality & Packing Control</div>
      </div>

      <div style="text-align: right; font-size: 7.5pt; max-width: 230px;">
        <div style="font-weight: bold; color: #000; text-transform: uppercase;">অনুমোদনকারী (AUTHORIZED SIGNATORY):</div>
        <div style="margin-top: 3px;">
          ${inv.approval_status === 'APPROVED' 
            ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; font-weight: bold; border: 1px solid #22c55e;">অনুমোদিত (APPROVED)</span>' 
            : '<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; font-weight: bold; border: 1px solid #f59e0b;">অপেক্ষমাণ (PENDING)</span>'}
        </div>
        <div style="font-size: 7pt; color: #555; margin-top: 2px;">MASCO INDUSTRIES LIMITED</div>
      </div>
    </div>
  `;

  document.getElementById('printableArea').innerHTML = html;
}

// ------------------------------------------------------------------------------
// 3. EXCEL (XLSX) EXPORT GENERATOR
// ------------------------------------------------------------------------------
function exportToExcel() {
  if (!currentInvoice) return;
  const inv = currentInvoice;
  const client = inv.clients || {};
  const items = inv.invoice_items || [];

  const ciRows = [
    ["MASCO INDUSTRIES LIMITED"],
    ["FACTORY: 221-223, KHARTAIL, SHATAISH ROAD, TONGI, GAZIPUR-1712, BANGLADESH"],
    ["CORPORATE OFFICE: Arhams (5th Floor), Plot-79, Sector-07, Dhaka-Mymensingh Highway, Uttara, Dhaka-1230"],
    ["COMMERCIAL INVOICE"],
    [],
    ["Invoice No:", inv.invoice_no, "Date:", inv.invoice_date],
    ["EXP Form No:", inv.exp_no || '', "EXP Date:", inv.exp_date || ''],
    ["S/C No:", inv.sc_no || '', "S/C Date:", inv.sc_date || ''],
    ["Applicant / Buyer:", client.applicant_name || ''],
    ["Applicant Address:", client.office_address || ''],
    ["Country of Origin:", inv.country_of_origin || 'BANGLADESH'],
    ["Shipper Bank:", inv.shipper_bank_name || 'PUBALI BANK PLC.'],
    ["Buyer Bank:", inv.buyer_bank_name || 'DBS Bank Limited'],
    ["Port of Loading:", inv.port_of_loading, "Port of Discharge:", inv.port_of_discharge],
    ["Incoterm:", inv.incoterm, "Currency:", inv.currency],
    [],
    ["ORDER NO", "ITEM REF.", "PRODUCTION DESCRIPTION", "HS CODE", "COLOR", "QUANTITY", "UNIT PRICE (USD)", "AMOUNT (USD)"]
  ];

  items.forEach(it => {
    ciRows.push([
      it.order_no || it.po_number,
      it.item_ref || it.style,
      it.production_description || it.item_description,
      it.hs_code,
      it.color_spec || '',
      Number(it.quantity || it.total_pcs),
      Number(it.unit_price),
      Number(it.line_amount || it.line_total)
    ]);
  });

  ciRows.push([]);
  ciRows.push(["TOTAL", "", "", "", "", inv.total_pcs, "", inv.total_amount]);
  ciRows.push([]);
  ciRows.push(["GENERAL SUMMARY"]);
  ciRows.push(["TOTAL QNTY", `${inv.total_pcs} PCS`]);
  ciRows.push(["TOTAL CTNS", `${inv.total_carton} CTN`]);
  ciRows.push(["TOTAL GR.WT", `${inv.total_gross_weight} KGS`]);
  ciRows.push(["TOTAL NT.WT", `${inv.total_net_weight} KGS`]);
  ciRows.push(["TOTAL CBM", `${inv.total_cbm} CBM`]);
  ciRows.push([]);
  ciRows.push(["AUDIT & VERIFICATION TRAIL"]);
  ciRows.push(["Prepared By (Worker):", inv.creator_name || 'Worker', "Mobile:", inv.creator_mobile || '']);
  ciRows.push(["Supervised By (Supervisor):", inv.supervisor_name || 'Supervisor', "Mobile:", inv.supervisor_mobile || '']);
  ciRows.push(["Approval Status:", inv.approval_status || 'PENDING', "Authorized By:", inv.approved_by_name || 'Masco Management']);

  // Packing List Sheet
  const plRows = [
    ["MASCO INDUSTRIES LIMITED"],
    ["PACKING LIST & ITEM DETAIL SHEET"],
    [],
    ["Invoice Reference:", inv.invoice_no, "Date:", inv.invoice_date],
    ["Consignee:", client.applicant_name || ''],
    ["EXP Number:", inv.exp_no || ''],
    [],
    ["SL", "Carton Range", "Order / PO No", "Item Ref / Style", "Color", "Description", "Cartons", "Total Pcs", "Net Wt (KG)", "Gross Wt (KG)", "CBM"]
  ];

  let startCtn = 1;
  items.forEach((it, idx) => {
    const ctnCount = Number(it.total_carton || 0);
    const endCtn = startCtn + ctnCount - 1;
    const ctnRange = ctnCount > 1 ? `${startCtn}-${endCtn}` : `${startCtn}`;
    startCtn = endCtn + 1;

    plRows.push([
      idx + 1,
      ctnRange,
      it.order_no || it.po_number,
      it.item_ref || it.style,
      it.color_spec || '',
      it.production_description || it.item_description,
      ctnCount,
      Number(it.quantity || it.total_pcs),
      Number(it.net_weight),
      Number(it.gross_weight),
      Number(it.cbm)
    ]);
  });

  plRows.push([]);
  plRows.push(["TOTALS", "", "", "", "", "", inv.total_carton, inv.total_pcs, inv.total_net_weight, inv.total_gross_weight, inv.total_cbm]);
  plRows.push([]);
  plRows.push(["AUDIT & VERIFICATION TRAIL"]);
  plRows.push(["Packed By (Worker):", inv.creator_name || 'Worker', "Mobile:", inv.creator_mobile || '']);
  plRows.push(["Inspected By (Supervisor):", inv.supervisor_name || 'Supervisor', "Mobile:", inv.supervisor_mobile || '']);
  plRows.push(["Approval Status:", inv.approval_status || 'PENDING']);

  const wb = XLSX.utils.book_new();
  const wsCI = XLSX.utils.aoa_to_sheet(ciRows);
  const wsPL = XLSX.utils.aoa_to_sheet(plRows);

  XLSX.utils.book_append_sheet(wb, wsCI, "Commercial Invoice");
  XLSX.utils.book_append_sheet(wb, wsPL, "Packing List");

  const cleanInvNo = inv.invoice_no.replace(/[\/\\:]/g, '_');
  XLSX.writeFile(wb, `Invoice_${cleanInvNo}_Masco.xlsx`);
}

// ------------------------------------------------------------------------------
// 4. NUMBER TO ENGLISH WORDS
// ------------------------------------------------------------------------------
function numberToWords(amount) {
  const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertGroup(n) {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      return str;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str;
  }

  const num = Math.floor(amount);
  const cents = Math.round((amount - num) * 100);

  if (num === 0) return 'ZERO DOLLARS';

  let result = '';
  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  if (millions > 0) result += convertGroup(millions) + 'MILLION ';
  if (thousands > 0) result += convertGroup(thousands) + 'THOUSAND ';
  if (remainder > 0) result += convertGroup(remainder);

  result += 'DOLLARS';

  if (cents > 0) {
    result += ' AND CENTS ' + convertGroup(cents).trim();
  }

  result += ' ONLY';
  return result.replace(/\s+/g, ' ').trim();
}
