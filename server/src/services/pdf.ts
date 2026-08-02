import puppeteer from 'puppeteer';

interface VehicleWithRelations {
  id: string;
  displayName: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  engine: string | null;
  currentMileage: number | null;
  licensePlate: string | null;
  color: string | null;
  notes: string | null;
  oilType: string | null;
  oilViscosity: string | null;
  oilBrandPref: string | null;
  oilCapacity: any;
  filterPartNumber: string | null;
  filterBrandPref: string | null;
  intervalMiles: number | null;
  intervalMonths: number | null;
  photos: Array<{ filename: string; isCover: boolean }>;
  serviceRecords: Array<{
    id: string;
    serviceDate: Date;
    mileage: number;
    serviceType: string;
    oilBrand: string | null;
    oilProduct: string | null;
    oilViscosity: string | null;
    oilQuantity: any;
    filterBrand: string | null;
    filterModel: string | null;
    performedBy: string | null;
    cost: any;
    notes: string | null;
    drainPlugReplaced: boolean;
    washerReplaced: boolean;
    photos: Array<{ filename: string }>;
    receipts: Array<{ filename: string; ocrProcessed: boolean }>;
  }>;
}

export async function generateVehiclePdf(vehicle: VehicleWithRelations): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    const html = buildPdfHtml(vehicle);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:8px; text-align:center; width:100%; padding:4px 0; color:#94a3b8;">
          Dipstick Oil Tracker — Vehicle Service History
        </div>`,
      footerTemplate: `
        <div style="font-size:8px; text-align:center; width:100%; padding:4px 0; color:#94a3b8;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated ${new Date().toLocaleDateString()}
        </div>`,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function buildPdfHtml(vehicle: VehicleWithRelations): string {
  const coverPhoto = vehicle.photos.find((p) => p.isCover) || vehicle.photos[0];

  const serviceRows = vehicle.serviceRecords
    .map(
      (s, i) => `
    <tr>
      <td>${s.serviceDate.toLocaleDateString()}</td>
      <td>${s.mileage.toLocaleString()}</td>
      <td>${s.oilBrand || '—'}</td>
      <td>${s.oilProduct || '—'}</td>
      <td>${s.oilViscosity || '—'}</td>
      <td>${s.filterBrand || '—'} ${s.filterModel || ''}</td>
      <td>${s.cost ? `$${Number(s.cost).toFixed(2)}` : '—'}</td>
      <td>${s.performedBy || '—'}</td>
      <td>${s.notes ? s.notes.substring(0, 80) + (s.notes.length > 80 ? '...' : '') : '—'}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; }
    .header { display: flex; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #16a34a; }
    .header img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 20px; }
    .header h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; }
    .header .subtitle { color: #64748b; font-size: 13px; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 14px; color: #16a34a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 24px; }
    .field { margin-bottom: 4px; }
    .field-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 11px; color: #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #f1f5f9; padding: 8px 6px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; font-size: 9px; text-transform: uppercase; }
    td { padding: 6px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .footer-note { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    ${coverPhoto ? `<img src="/uploads/${coverPhoto.filename}" onerror="this.style.display='none'" />` : ''}
    <div>
      <h1>${escapeHtml(vehicle.displayName)}</h1>
      <div class="subtitle">
        ${[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'No vehicle details'}
        ${vehicle.vin ? ` | VIN: ${vehicle.vin}` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Vehicle Information</h2>
    <div class="grid-3">
      <div class="field"><div class="field-label">Year</div><div class="field-value">${vehicle.year || '—'}</div></div>
      <div class="field"><div class="field-label">Make</div><div class="field-value">${vehicle.make || '—'}</div></div>
      <div class="field"><div class="field-label">Model</div><div class="field-value">${vehicle.model || '—'}</div></div>
      <div class="field"><div class="field-label">Trim</div><div class="field-value">${vehicle.trim || '—'}</div></div>
      <div class="field"><div class="field-label">Engine</div><div class="field-value">${vehicle.engine || '—'}</div></div>
      <div class="field"><div class="field-label">Current Mileage</div><div class="field-value">${vehicle.currentMileage?.toLocaleString() || '—'}</div></div>
      <div class="field"><div class="field-label">License Plate</div><div class="field-value">${vehicle.licensePlate || '—'}</div></div>
      <div class="field"><div class="field-label">Color</div><div class="field-value">${vehicle.color || '—'}</div></div>
      <div class="field"><div class="field-label">VIN</div><div class="field-value">${vehicle.vin || '—'}</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Oil & Maintenance Specifications</h2>
    <div class="grid">
      <div class="field"><div class="field-label">Oil Type</div><div class="field-value">${vehicle.oilType || '—'}</div></div>
      <div class="field"><div class="field-label">Viscosity</div><div class="field-value">${vehicle.oilViscosity || '—'}</div></div>
      <div class="field"><div class="field-label">Preferred Brand</div><div class="field-value">${vehicle.oilBrandPref || '—'}</div></div>
      <div class="field"><div class="field-label">Capacity</div><div class="field-value">${vehicle.oilCapacity ? `${vehicle.oilCapacity} qt` : '—'}</div></div>
      <div class="field"><div class="field-label">Filter Part #</div><div class="field-value">${vehicle.filterPartNumber || '—'}</div></div>
      <div class="field"><div class="field-label">Filter Brand</div><div class="field-value">${vehicle.filterBrandPref || '—'}</div></div>
      <div class="field"><div class="field-label">Interval (Miles)</div><div class="field-value">${vehicle.intervalMiles?.toLocaleString() || '—'}</div></div>
      <div class="field"><div class="field-label">Interval (Months)</div><div class="field-value">${vehicle.intervalMonths || '—'}</div></div>
    </div>
  </div>

  ${vehicle.notes ? `
  <div class="section">
    <h2>Notes</h2>
    <p style="color:#475569; font-size:10px;">${escapeHtml(vehicle.notes)}</p>
  </div>` : ''}

  <div class="section page-break">
    <h2>Service History (${vehicle.serviceRecords.length} records)</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Mileage</th>
          <th>Oil Brand</th>
          <th>Oil Product</th>
          <th>Viscosity</th>
          <th>Filter</th>
          <th>Cost</th>
          <th>By</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${serviceRows || '<tr><td colspan="9" style="text-align:center;padding:20px;">No service records</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer-note">
    Generated by Dipstick Oil Tracker on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
