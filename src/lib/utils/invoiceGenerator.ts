export interface InvoiceData {
  invoiceNumber?: string;
  clientName: string;
  amount: string | number;
  tax?: string;
  service?: string;
  date?: string;
  status?: string;
}

export const generateInvoiceHTML = (data: InvoiceData): string => {
  const invNumber = data.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = data.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const client = data.clientName || 'Valued Client';
  const serviceDesc = data.service || 'Enterprise AI Consulting & Software Services';
  
  // Clean raw numeric amount
  let numAmount = 50000;
  if (typeof data.amount === 'number') {
    numAmount = data.amount;
  } else if (typeof data.amount === 'string') {
    const cleaned = data.amount.replace(/[^0-9.]/g, '');
    if (cleaned) numAmount = parseFloat(cleaned);
  }

  const gstAmount = Math.round(numAmount * 0.18);
  const totalAmount = numAmount + gstAmount;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GST Tax Invoice - ${invNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 40px 20px;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #8b5cf6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
    }
    .invoice-title-box {
      text-align: right;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: 800;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .invoice-meta {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .detail-box {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 10px;
    }
    .detail-box h4 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .detail-box p {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .table th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table th:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    .table th:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
      text-align: right;
    }
    .table td {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      color: #334155;
    }
    .table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    .totals {
      width: 320px;
      margin-left: auto;
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
    }
    .row.grand {
      border-top: 2px solid #c084fc;
      padding-top: 10px;
      margin-top: 10px;
      font-weight: 800;
      font-size: 16px;
      color: #6b21a8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    .stamp {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 11px;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; border: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">FM</div>
        <div>
          <div class="brand-title">FlowMind AI</div>
          <div class="brand-sub">Enterprise Agent Orchestration Platform</div>
        </div>
      </div>
      <div class="invoice-title-box">
        <div class="invoice-title">Tax Invoice</div>
        <div class="invoice-meta">Invoice #: <strong>${invNumber}</strong></div>
        <div class="invoice-meta">Date: ${dateStr}</div>
        <div class="invoice-meta">GSTIN: 36AAACF5542A1Z8</div>
      </div>
    </div>

    <div class="details-grid">
      <div class="detail-box">
        <h4>Billed To (Client):</h4>
        <p>${client}</p>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">GSTIN / PAN: Client Standard Account</div>
      </div>
      <div class="detail-box">
        <h4>Issued By (Finance Agent):</h4>
        <p>FlowMind AI Finance Hub</p>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Authorized Agent Mesh Decision Engine</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description of Services</th>
          <th>Taxable Amount</th>
          <th>GST Rate</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${serviceDesc}</td>
          <td>₹${numAmount.toLocaleString('en-IN')}</td>
          <td>18% (CGST 9% + SGST 9%)</td>
          <td>₹${totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row">
        <span>Subtotal (Base):</span>
        <span>₹${numAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="row">
        <span>GST (18% Tax):</span>
        <span>₹${gstAmount.toLocaleString('en-IN')}</span>
      </div>
      <div class="row grand">
        <span>Total Payable:</span>
        <span>₹${totalAmount.toLocaleString('en-IN')}</span>
      </div>
    </div>

    <div class="footer">
      <div class="stamp">
        ✓ APPROVED BY FLOWMIND FINANCE AGENT
      </div>
      <div class="no-print" style="margin-left: auto;">
        <button onclick="window.print()" style="background: #7c3aed; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const downloadInvoiceFile = (data: InvoiceData) => {
  const htmlContent = generateInvoiceHTML(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const invNumber = data.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `FlowMind_Invoice_${invNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const openInvoicePreview = (data: InvoiceData) => {
  const htmlContent = generateInvoiceHTML(data);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(htmlContent);
    win.document.close();
  } else {
    // Fallback to download if popups are blocked
    downloadInvoiceFile(data);
  }
};
