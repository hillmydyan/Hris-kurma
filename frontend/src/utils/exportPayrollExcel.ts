import ExcelJS from 'exceljs';

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface ExportPayrollParams {
  employees: any[];
  periodLabel?: string;
  periodKey?: string;
  cutoffEndDate?: string;
}

export async function exportPayrollToExcel({
  employees,
  periodLabel,
  periodKey,
  cutoffEndDate
}: ExportPayrollParams): Promise<void> {
  // Tentukan Bulan & Tahun untuk penamaan file
  let monthName = 'Bulan';
  let year = new Date().getFullYear().toString();

  if (cutoffEndDate) {
    const parts = cutoffEndDate.split('-');
    if (parts.length >= 2) {
      year = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        monthName = INDO_MONTHS[mIdx];
      }
    }
  } else if (periodKey) {
    const parts = periodKey.split('-');
    if (parts.length >= 2) {
      year = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        monthName = INDO_MONTHS[mIdx];
      }
    }
  } else if (periodLabel) {
    for (const m of INDO_MONTHS) {
      if (periodLabel.toLowerCase().includes(m.toLowerCase())) {
        monthName = m;
        break;
      }
    }
    const yearMatch = periodLabel.match(/\b(20\d\d)\b/);
    if (yearMatch) {
      year = yearMatch[1];
    }
  } else {
    const now = new Date();
    monthName = INDO_MONTHS[now.getMonth()];
    year = now.getFullYear().toString();
  }

  const filename = `Gaji_Pokok_Uang_Makan_${monthName}_${year}.xlsx`;

  // Buat workbook & sheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HRIS Kurma Group';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Gaji Pokok & Uang Makan', {
    views: [{ showGridLines: true }]
  });

  // Definisi Header Kolom sesuai urutan:
  // No | Nama Karyawan | NIK/ID Karyawan | Divisi/Jabatan | Gaji Pokok | Uang Makan | Total (Gaji Pokok + Uang Makan)
  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nama Karyawan', key: 'name', width: 28 },
    { header: 'NIK/ID Karyawan', key: 'nik_id', width: 22 },
    { header: 'Divisi/Jabatan', key: 'division_job', width: 28 },
    { header: 'Gaji Pokok', key: 'basic_salary', width: 18 },
    { header: 'Uang Makan', key: 'meal_allowance', width: 18 },
    { header: 'Total (Gaji Pokok + Uang Makan)', key: 'total_amount', width: 30 },
  ];

  // Styling Header (Row 1): Bold, background halus, alignment
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' } // Slate 100
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
    if (colNumber === 2 || colNumber === 4) {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    } else if (colNumber >= 5) {
      cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
    }
  });

  let totalBasicSalary = 0;
  let totalMealAllowance = 0;
  let totalOverall = 0;

  // Isi Baris Data
  employees.forEach((emp, index) => {
    const basic = Number(emp.earned_basic_salary ?? emp.basic_salary ?? 0);
    const meal = Number(emp.meal_allowance ?? 0);
    const total = basic + meal;

    totalBasicSalary += basic;
    totalMealAllowance += meal;
    totalOverall += total;

    const nikId = emp.nik && emp.employee_id 
      ? `${emp.employee_id} / ${emp.nik}`
      : (emp.employee_id || emp.nik || '-');

    const divisionJob = `${emp.department || '-'} / ${emp.job_position || '-'}`;

    const row = worksheet.addRow({
      no: index + 1,
      name: emp.name || '-',
      nik_id: nikId,
      division_job: divisionJob,
      basic_salary: basic,
      meal_allowance: meal,
      total_amount: total,
    });

    row.height = 22;
    row.font = { name: 'Calibri', size: 10 };

    // Alignment & Number format
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

    // Format angka: pemisah ribuan, tanpa desimal (#,##0)
    for (let c = 5; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = '#,##0';
    }

    // Border tipis
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Baris Terakhir: TOTAL Keseluruhan
  const totalRowNumber = worksheet.rowCount + 1;
  const totalRow = worksheet.addRow({
    no: '',
    name: 'TOTAL',
    nik_id: '',
    division_job: '',
    basic_salary: totalBasicSalary,
    meal_allowance: totalMealAllowance,
    total_amount: totalOverall,
  });

  totalRow.height = 24;
  totalRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };

  // Format angka baris total
  for (let c = 5; c <= 7; c++) {
    const cell = totalRow.getCell(c);
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    cell.numFmt = '#,##0';
  }

  // Border & background khusus untuk baris TOTAL
  totalRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' }
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'double', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  // Merge kolom 1-4 untuk tulisan TOTAL agar rapi
  worksheet.mergeCells(totalRowNumber, 1, totalRowNumber, 4);
  const mergedCell = worksheet.getCell(totalRowNumber, 1);
  mergedCell.value = 'TOTAL';
  mergedCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Otomatis menyesuaikan lebar kolom berdasarkan isi
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      let cellLen = 0;
      if (cell.value) {
        if (typeof cell.value === 'number') {
          cellLen = cell.value.toLocaleString('id-ID').length;
        } else {
          cellLen = String(cell.value).length;
        }
      }
      if (cellLen > maxLength) {
        maxLength = cellLen;
      }
    });
    const calculatedWidth = Math.max(maxLength + 4, 12);
    column.width = calculatedWidth;
  });

  // Pastikan kolom No tidak terlalu lebar dan Total cukup lebar
  worksheet.getColumn(1).width = 8;
  if ((worksheet.getColumn(7).width || 0) < 30) {
    worksheet.getColumn(7).width = 30;
  }

  // Generate & Download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
