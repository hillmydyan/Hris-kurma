// Shared Slip Gaji Generator & Print utility for PT Kurma Group Indonesia

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val || 0);
}

export function generateSlipHtml(emp: any, periodLabel?: string): string {
  const periodMonth = periodLabel || emp.period_name || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const slipNo = `SLIP/${emp.employee_id || 'EMP'}/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Slip Gaji - ${emp.name} (${emp.employee_id}) - ${periodMonth}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .slip-card {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 10px;
      padding: 30px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-brand h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: -0.3px;
    }
    .company-brand p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-badge h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .doc-badge .period {
      margin: 3px 0 0 0;
      font-size: 12px;
      color: #047857;
      font-weight: 600;
    }
    .slip-no {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .employee-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 18px;
      font-size: 12px;
    }
    .field-row {
      display: flex;
    }
    .field-label {
      width: 130px;
      color: #64748b;
      font-weight: 500;
    }
    .field-value {
      flex: 1;
      font-weight: 600;
      color: #0f172a;
    }
    .attendance-note-box {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 18px;
      font-size: 11.5px;
      line-height: 1.5;
    }
    .attendance-note-box strong {
      color: #854d0e;
    }
    .table-slip {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .table-slip th {
      background: #0f172a;
      color: #ffffff;
      padding: 9px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table-slip td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12.5px;
    }
    .total-banner {
      background: #ecfdf5;
      border: 2px solid #059669;
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .total-banner .label {
      font-size: 13px;
      font-weight: 700;
      color: #065f46;
      text-transform: uppercase;
    }
    .total-banner .amount {
      font-size: 20px;
      font-family: monospace;
      font-weight: 900;
      color: #047857;
    }
    .bank-info {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #166534;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
    }
    .sig-space {
      height: 60px;
    }
    .sig-line {
      border-top: 1px solid #64748b;
      padding-top: 6px;
      font-weight: 600;
      color: #0f172a;
    }
    .footer-note {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      body { padding: 0; background: none; }
      .slip-card { border: 1.5px solid #000; box-shadow: none; border-radius: 0; padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="slip-card">
    <div class="header">
      <div class="company-brand">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
          <img src="${window.location.origin}/logo.ico" alt="" style="width:36px;height:36px;object-fit:contain;" />
          <div>
            <h1>PT KURMA GROUP INDONESIA</h1>
            <p>Graha Kurma Tower, Lt. 8, Jl. TB Simatupang No. 18, Jakarta Selatan</p>
          </div>
        </div>
        <p>Telp: (021) 789-2233 • Email: finance@kurmagroup.co.id</p>
      </div>
      <div class="doc-badge">
        <h2>SLIP GAJI KARYAWAN</h2>
        <div class="period">Periode: ${periodMonth}</div>
        <div class="slip-no">No: ${slipNo}</div>
      </div>
    </div>

    <div class="employee-grid">
      <div class="field-row"><div class="field-label">NIK / ID Karyawan:</div><div class="field-value">${emp.employee_id} / ${emp.nik || '-'}</div></div>
      <div class="field-row"><div class="field-label">Nama Karyawan:</div><div class="field-value">${emp.name}</div></div>
      <div class="field-row"><div class="field-label">Departemen:</div><div class="field-value">${emp.department}</div></div>
      <div class="field-row"><div class="field-label">Jabatan:</div><div class="field-value">${emp.job_position}</div></div>
      <div class="field-row"><div class="field-label">Tipe Hubungan Kerja:</div><div class="field-value">${emp.employment_type === 'permanent' ? 'Karyawan Tetap (PKWTT)' : 'Karyawan Kontrak (PKWT)'}</div></div>
      <div class="field-row"><div class="field-label">Tanggal Cetak:</div><div class="field-value">${printDate}</div></div>
    </div>

    <div class="attendance-note-box">
      <strong>Catatan Kehadiran & Basis Hari Kerja (26 Hari Kerja / Bulan):</strong><br>
      • Basis Standar Kerja: <strong>26 Hari Kerja</strong> (6 hari kerja/minggu • 1 hari libur akhir pekan)<br>
      • Kehadiran Aktual: <strong>${emp.present_days ?? 0} Hari</strong> | Tidak Hadir: <strong>${emp.unattended_days || 0} Hari</strong><br>
      • Hadir Tepat Waktu (&le; 08:15 WIB): <strong>${emp.eligible_meal_days ?? emp.present_days ?? 0} Hari</strong> (Berhak Uang Makan = ${formatRupiah(emp.meal_allowance || 0)})<br>
      • Telat Lebih dari 15 Menit (&gt; 08:15 WIB): <strong>${emp.late_over_15_days || 0} Hari</strong> (<em>Uang makan hari tersebut hangus</em>)<br>
      • Jadwal Akhir Pekan: <strong>${emp.weekend_pattern_label || 'Tetap Masuk Sabtu (Minggu OFF)'}</strong>
    </div>

    <table class="table-slip">
      <thead>
        <tr>
          <th style="width: 50%;">Komponen Penerimaan (Earnings)</th>
          <th style="width: 25%;">Keterangan Perhitungan</th>
          <th style="width: 25%; text-align: right;">Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Gaji Pokok</strong></td>
          <td>${emp.is_prorated ? `Bulanan Prorata (${emp.present_days}/26 hari kerja aktif)` : 'Bulanan Tetap (100% Utuh)'}</td>
          <td style="text-align: right; font-weight: bold;">${formatRupiah(emp.earned_basic_salary || emp.basic_salary || 0)}</td>
        </tr>
        <tr>
          <td><strong>Uang Makan Aktual</strong></td>
          <td>${emp.eligible_meal_days ?? emp.present_days ?? 0} hari hadir tepat waktu &times; Rp 11.000</td>
          <td style="text-align: right; font-weight: bold;">${formatRupiah(emp.meal_allowance || 0)}</td>
        </tr>
      </tbody>
    </table>

    <table class="table-slip">
      <thead>
        <tr>
          <th style="width: 50%;">Komponen Potongan (Deductions)</th>
          <th style="width: 25%;">Keterangan Perhitungan</th>
          <th style="width: 25%; text-align: right;">Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${emp.is_prorated && (emp.prorata_deduction || 0) > 0 ? `
        <tr>
          <td>Potongan Prorata (Tidak Masuk Penuh 1 Bulan)</td>
          <td>${emp.unattended_days || 0} hari belum bekerja / cut-off</td>
          <td style="text-align: right; color: #4f46e5;">-${formatRupiah(emp.prorata_deduction)}</td>
        </tr>` : `
        <tr>
          <td>Potongan Gaji Pokok (Izin / Sakit / Alpa)</td>
          <td>Gaji pokok utuh 100% (tidak ada potongan)</td>
          <td style="text-align: right; color: #10b981;">Rp 0</td>
        </tr>`}
        <tr>
          <td>Potongan Uang Makan (Izin / Sakit / Alpa / Telat)</td>
          <td>${emp.is_prorated ? 'Hari izin / absen setelah tanggal masuk' : `${(emp.unattended_days || 0) + (emp.late_over_15_days || 0)} hari tidak dapat uang makan`}</td>
          <td style="text-align: right; color: #dc2626;">-${formatRupiah(emp.meal_deduction || ((emp.unattended_days || 0) * 11000))}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-banner">
      <div class="label">Total Diterima (Take Home Pay):</div>
      <div class="amount">${formatRupiah(emp.total_salary || emp.net_pay || 0)}</div>
    </div>

    <div class="bank-info">
      <strong>Transfer Rekening:</strong> ${emp.bank_name || 'BCA'} • No. ${emp.bank_account_number || '-'} a.n. ${emp.bank_account_holder || emp.name}
    </div>

    <div class="signatures">
      <div>
        <p>Disetujui Oleh,</p>
        <div class="sig-space"></div>
        <div class="sig-line">Finance & HRD Kurma Group</div>
      </div>
      <div>
        <p>Diterima Oleh,</p>
        <div class="sig-space"></div>
        <div class="sig-line">${emp.name}</div>
      </div>
    </div>

    <div class="footer-note">
      Slip gaji ini dicetak secara otomatis melalui Sistem HRIS PT Kurma Group Indonesia. Dokumen ini sah dan bersifat rahasia (confidential).
    </div>
  </div>
</body>
</html>`;
}

export function printSlipDocument(emp: any, periodLabel?: string): void {
  const html = generateSlipHtml(emp, periodLabel);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }
}
