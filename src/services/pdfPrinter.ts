import   { CURRENCY } from '../utils/constants';

/**
 * Helper for creating print-friendly HTML based invoice/receipt templates
 * that can be printed or saved as PDF using browser's native print functionality.
 * This approach provides better Arabic text support than jsPDF.
 */

interface ReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentId: string;
  grade: string;
  feeType: string;
  amount: number;
  schoolName: string;
  schoolLogo?: string;
}

interface StudentReportData {
  studentName: string;
  studentId: string;
  grade: string;
  fees: Array<{
    type: string;
    amount: number;
    paid: number;
    balance: number;
  }>;
  schoolName: string;
  schoolLogo?: string;
}

interface SubscriptionInvoiceData {
  invoiceNumber: string;
  date: string;
  schoolName: string;
  schoolId: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  amount: number;
  paid: boolean;
  paymentDate?: string;
  status?: string;
}

// Professional background images for documents - using solid colors instead of images
const PROFESSIONAL_BACKGROUNDS = [
  'linear-gradient(to bottom right, #f9f9f9, #f0f0f0)',
  'linear-gradient(to bottom right, #f7f7f7, #eeeeee)',
  'linear-gradient(to bottom right, #fcfcfc, #f5f5f5)'
];

// Get random professional background
const getRandomBackground = () => {
  const index = Math.floor(Math.random() * PROFESSIONAL_BACKGROUNDS.length);
  return PROFESSIONAL_BACKGROUNDS[index];
};

/**
 * Generate HTML for a receipt
 */
export const generateReceiptHTML = (data: ReceiptData): string => {
  // Calculate total
  const total = data.amount;
  const backgroundPattern = getRandomBackground();
  
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إيصال دفع - ${data.studentName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Tajawal', sans-serif;
          background-color: #f8f9fa;
          color: #333;
          padding: 20px;
          direction: rtl;
        }
        
        .receipt-container {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .receipt-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${backgroundPattern};
          opacity: 0.4;
          z-index: -1;
          border-radius: 10px;
        }
        
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        
        .receipt-header {
          background-color: #800000;
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .receipt-header h1 {
          font-size: 28px;
          margin-bottom: 0;
        }
        
        .school-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          flex-direction: column;
        }
        
        .school-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        
        .school-name {
          font-size: 24px;
          font-weight: bold;
          color: #800000;
        }
        
        .receipt-details {
          display: flex;
          justify-content: space-between;
          padding: 15px 25px;
          border: 1px solid #eee;
          margin: 0 20px;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        
        .detail-item {
          margin-bottom: 5px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #800000;
          margin-left: 5px;
        }
        
        .student-details {
          margin: 20px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #800000;
          border-bottom: 2px solid #800000;
          padding-bottom: 5px;
          display: inline-block;
        }
        
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .payment-details {
          margin: 20px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
        
        .amount {
          font-size: 22px;
          font-weight: bold;
          color: #008000;
          margin-top: 10px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 15px;
          background-color: #e6ffe6;
          color: #006600;
          font-weight: bold;
          border-radius: 20px;
          margin: 20px auto;
          text-align: center;
        }
        
        .signature {
          margin: 30px 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        
        .signature-line {
          width: 200px;
          height: 1px;
          background-color: #333;
          margin-bottom: 5px;
        }
        
        .receipt-footer {
          background-color: #800000;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 14px;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(128, 0, 0, 0.05);
          font-weight: bold;
          white-space: nowrap;
          z-index: 0;
        }
        
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          
          .receipt-container {
            padding: 0;
          }
          
          .receipt {
            box-shadow: none;
            margin: 0;
            page-break-after: always;
          }
          
          .no-print {
            display: none;
          }
          
          .receipt-background {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-background"></div>
        <div class="receipt">
          <div class="watermark">إيصال مدفوعات</div>
          <div class="receipt-header">
            <h1>إيصال دفع</h1>
          </div>
          
          <div class="school-info">
            ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="${data.schoolName}" class="school-logo">` : `<div class="school-logo" style="display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; color: #800000; font-size: 24px; font-weight: bold;">${data.schoolName.substring(0, 2)}</div>`}
            <div class="school-name">${data.schoolName}</div>
          </div>
          
          <div class="receipt-details">
            <div>
              <div class="detail-item">
                <span class="detail-label">رقم الإيصال:</span>
                <span>${data.receiptNumber}</span>
              </div>
            </div>
            <div>
              <div class="detail-item">
                <span class="detail-label">التاريخ:</span>
                <span>${data.date}</span>
              </div>
            </div>
          </div>
          
          <div class="student-details">
            <div class="section-title">معلومات الطالب</div>
            <div class="student-info">
              <div class="detail-item">
                <span class="detail-label">الاسم:</span>
                <span>${data.studentName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">رقم الطالب:</span>
                <span>${data.studentId}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">الصف:</span>
                <span>${data.grade}</span>
              </div>
            </div>
          </div>
          
          <div class="payment-details">
            <div class="section-title">تفاصيل الدفع</div>
            <div class="detail-item">
              <span class="detail-label">نوع الرسوم:</span>
              <span>${data.feeType}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">المبلغ المدفوع:</span>
              <div class="amount">${data.amount.toLocaleString()} ${CURRENCY}</div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <div class="status-badge">تم الدفع</div>
          </div>
          
          <div class="signature">
            <div class="signature-line"></div>
            <div>توقيع المستلم</div>
          </div>
          
          <div class="receipt-footer">
            شكراً لتعاملكم معنا - نظام إدارة مالية المدارس
          </div>
        </div>
      </div>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #800000; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Tajawal', sans-serif;">
          طباعة الإيصال
        </button>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for a student financial report
 */
export const generateStudentReportHTML = (data: StudentReportData): string => {
  // Calculate totals
  const totalAmount = data.fees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = data.fees.reduce((sum, fee) => sum + fee.paid, 0);
  const totalBalance = data.fees.reduce((sum, fee) => sum + fee.balance, 0);
  const backgroundPattern = getRandomBackground();
  
  // Determine payment status
  let paymentStatus;
  let statusColor;
  let statusBgColor;
  
  if (totalBalance <= 0) {
    paymentStatus = 'مدفوع بالكامل';
    statusColor = '#008000';
    statusBgColor = '#E8F5E9';
  } else if (totalPaid > 0) {
    paymentStatus = 'مدفوع جزئياً';
    statusColor = '#FF8C00';
    statusBgColor = '#FFF3E0';
  } else {
    paymentStatus = 'غير مدفوع';
    statusColor = '#FF0000';
    statusBgColor = '#FFEBEE';
  }
  
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>التقرير المالي - ${data.studentName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Tajawal', sans-serif;
          background-color: #f8f9fa;
          color: #333;
          padding: 20px;
          direction: rtl;
        }
        
        .report-container {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .report-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${backgroundPattern};
          opacity: 0.4;
          z-index: -1;
          border-radius: 10px;
        }
        
        .report {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        
        .report-header {
          background-color: #800000;
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .report-header h1 {
          font-size: 28px;
          margin-bottom: 0;
        }
        
        .school-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          flex-direction: column;
        }
        
        .school-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        
        .school-name {
          font-size: 24px;
          font-weight: bold;
          color: #800000;
        }
        
        .student-details {
          margin: 20px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #800000;
          border-bottom: 2px solid #800000;
          padding-bottom: 5px;
          display: inline-block;
        }
        
        .student-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .detail-item {
          margin-bottom: 5px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #800000;
          margin-left: 5px;
        }
        
        .financial-details {
          margin: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        table th {
          background-color: #f2f2f2;
          padding: 10px;
          text-align: right;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        
        table td {
          padding: 10px;
          border: 1px solid #ddd;
        }
        
        table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .total-row {
          background-color: #f2f2f2 !important;
          font-weight: bold;
        }
        
        .amount-positive {
          color: #008000;
        }
        
        .amount-negative {
          color: #ff0000;
        }
        
        .status-section {
          margin: 30px 20px;
          text-align: center;
        }
        
        .status-badge {
          display: inline-block;
          padding: 10px 20px;
          font-weight: bold;
          border-radius: 20px;
          margin: 0 auto;
        }
        
        .report-footer {
          background-color: #800000;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 14px;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(128, 0, 0, 0.05);
          font-weight: bold;
          white-space: nowrap;
          z-index: 0;
        }
        
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          
          .report-container {
            padding: 0;
          }
          
          .report {
            box-shadow: none;
            margin: 0;
            padding: 0;
            page-break-after: always;
          }
          
          .no-print {
            display: none;
          }
          
          .report-background {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="report-background"></div>
        <div class="report">
          <div class="watermark">تقرير مالي</div>
          <div class="report-header">
            <h1>تقرير مالي للطالب</h1>
          </div>
          
          <div class="school-info">
            ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="${data.schoolName}" class="school-logo">` : `<div class="school-logo" style="display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; color: #800000; font-size: 24px; font-weight: bold;">${data.schoolName.substring(0, 2)}</div>`}
            <div class="school-name">${data.schoolName}</div>
          </div>
          
          <div class="student-details">
            <div class="section-title">معلومات الطالب</div>
            <div class="student-info">
              <div class="detail-item">
                <span class="detail-label">الاسم:</span>
                <span>${data.studentName}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">رقم الطالب:</span>
                <span>${data.studentId}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">الصف:</span>
                <span>${data.grade}</span>
              </div>
            </div>
          </div>
          
          <div class="financial-details">
            <div class="section-title">التفاصيل المالية</div>
            
            <table>
              <thead>
                <tr>
                  <th>البيان</th>
                  <th>المبلغ</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                </tr>
              </thead>
              <tbody>
                ${data.fees.map(fee => `
                  <tr>
                    <td>${fee.type}</td>
                    <td>${fee.amount.toLocaleString()} ${CURRENCY}</td>
                    <td class="amount-positive">${fee.paid.toLocaleString()} ${CURRENCY}</td>
                    <td class="${fee.balance > 0 ? 'amount-negative' : ''}">${fee.balance.toLocaleString()} ${CURRENCY}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>الإجمالي</td>
                  <td>${totalAmount.toLocaleString()} ${CURRENCY}</td>
                  <td class="amount-positive">${totalPaid.toLocaleString()} ${CURRENCY}</td>
                  <td class="${totalBalance > 0 ? 'amount-negative' : ''}">${totalBalance.toLocaleString()} ${CURRENCY}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="status-section">
            <div class="section-title">حالة الدفع</div>
            <div class="status-badge" style="background-color: ${statusBgColor}; color: ${statusColor};">
              ${paymentStatus}
            </div>
          </div>
          
          <div class="report-footer">
            تاريخ إصدار التقرير: ${new Date().toLocaleDateString('en-GB')} - نظام إدارة مالية المدارس
          </div>
        </div>
      </div>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #800000; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Tajawal', sans-serif;">
          طباعة التقرير
        </button>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for a subscription invoice with the same style as fees receipt
 */
export const generateSubscriptionInvoiceHTML = (data: SubscriptionInvoiceData): string => {
  // Determine status styling
  let statusColor, statusText, statusBgColor;
  
  if (data.paid) {
    statusText = 'مدفوع';
    statusColor = '#008000';
    statusBgColor = '#E8F5E9';
  } else {
    statusText = 'غير مدفوع';
    statusColor = '#FF0000';
    statusBgColor = '#FFEBEE';
  }
  
  // For paused status
  if (data.status === 'paused') {
    statusText = 'متوقف مؤقتاً';
    statusColor = '#0066cc';
    statusBgColor = '#E3F2FD';
  }
  
  const backgroundPattern = getRandomBackground();
  
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة اشتراك - ${data.schoolName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Tajawal', sans-serif;
          background-color: #f8f9fa;
          color: #333;
          padding: 20px;
          direction: rtl;
        }
        
        .invoice-container {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .invoice-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${backgroundPattern};
          opacity: 0.4;
          z-index: -1;
          border-radius: 10px;
        }
        
        .invoice {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        
        .invoice-header {
          background-color: #800000;
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .invoice-header h1 {
          font-size: 28px;
          margin-bottom: 0;
        }
        
        .company-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          flex-direction: column;
        }
        
        .company-logo {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f9f9f9;
          border-radius: 50%;
          font-size: 30px;
          font-weight: bold;
          color: #800000;
          margin-bottom: 10px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #800000;
          margin-bottom: 5px;
        }
        
        .invoice-details {
          display: flex;
          justify-content: space-between;
          padding: 15px 25px;
          border: 1px solid #eee;
          margin: 0 20px;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        
        .detail-item {
          margin-bottom: 10px;
        }
        
        .detail-label {
          font-weight: bold;
          color: #800000;
          margin-left: 5px;
        }
        
        .school-details {
          margin: 20px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #800000;
          border-bottom: 2px solid #800000;
          padding-bottom: 5px;
          display: inline-block;
        }
        
        .subscription-details {
          margin: 20px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
        
        .amount {
          font-size: 22px;
          font-weight: bold;
          color: #800000;
          margin: 15px 0;
        }
        
        .status-section {
          margin: 20px;
          text-align: center;
        }
        
        .status-badge {
          display: inline-block;
          padding: 10px 25px;
          font-weight: bold;
          border-radius: 20px;
          margin: 10px auto;
          font-size: 18px;
        }
        
        .payment-instructions {
          margin: 20px;
          padding: 15px;
          background-color: #fff8f8;
          border-radius: 5px;
          display: ${data.paid ? 'none' : 'block'};
        }
        
        .thanks-note {
          margin: 30px 0;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #800000;
          display: ${data.paid ? 'block' : 'none'};
        }
        
        .invoice-footer {
          background-color: #800000;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 14px;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          color: rgba(128, 0, 0, 0.05);
          font-weight: bold;
          white-space: nowrap;
          z-index: 0;
        }
        
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          
          .invoice-container {
            padding: 0;
          }
          
          .invoice {
            box-shadow: none;
            margin: 0;
            padding: 0;
            page-break-after: always;
          }
          
          .no-print {
            display: none;
          }
          
          .invoice-background {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-background"></div>
        <div class="invoice">
          <div class="watermark">فاتورة</div>
          <div class="invoice-header">
            <h1>فاتورة اشتراك</h1>
          </div>
          
          <div class="company-info">
            <div class="company-logo">نظام</div>
            <div class="company-name">نظام إدارة مالية المدارس</div>
          </div>
          
          <div class="invoice-details">
            <div>
              <div class="detail-item">
                <span class="detail-label">رقم الفاتورة:</span>
                <span>${data.invoiceNumber}</span>
              </div>
            </div>
            <div>
              <div class="detail-item">
                <span class="detail-label">التاريخ:</span>
                <span>${data.date}</span>
              </div>
            </div>
          </div>
          
          <div class="school-details">
            <div class="section-title">معلومات المدرسة</div>
            <div class="detail-item">
              <span class="detail-label">اسم المدرسة:</span>
              <span>${data.schoolName}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">رقم المدرسة:</span>
              <span>${data.schoolId}</span>
            </div>
          </div>
          
          <div class="subscription-details">
            <div class="section-title">تفاصيل الاشتراك</div>
            <div class="detail-item">
              <span class="detail-label">تاريخ بداية الاشتراك:</span>
              <span>${data.subscriptionStart}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">تاريخ نهاية الاشتراك:</span>
              <span>${data.subscriptionEnd}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">مبلغ الاشتراك:</span>
              <div class="amount">${data.amount.toLocaleString()} ${CURRENCY}</div>
            </div>
          </div>
          
          <div class="status-section">
            <div class="section-title">حالة الاشتراك</div>
            <div class="status-badge" style="background-color: ${statusBgColor}; color: ${statusColor};">
              ${statusText}
            </div>
            ${data.paymentDate ? `
            <div style="margin-top: 10px; font-size: 14px; color: #666;">
              تاريخ الدفع: ${data.paymentDate}
            </div>
            ` : ''}
          </div>
          
          <div class="payment-instructions">
            <div class="section-title">تعليمات الدفع</div>
            <p>الرجاء تحويل المبلغ إلى الحساب البنكي رقم XXXX-XXXX-XXXX-XXXX</p>
            <p style="margin-top: 10px;">يرجى ذكر رقم الفاتورة ${data.invoiceNumber} في تفاصيل التحويل</p>
          </div>
          
          <div class="thanks-note">
            شكراً لاشتراكك في خدماتنا
          </div>
          
          <div class="invoice-footer">
            © ${new Date().getFullYear()} - نظام إدارة مالية المدارس - سلطنة عمان
          </div>
        </div>
      </div>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #800000; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Tajawal', sans-serif;">
          طباعة الفاتورة
        </button>
      </div>
    </body>
    </html>
  `;
};

/**
 * Print receipt using browser's print functionality
 */
export const printReceipt = (data: ReceiptData): void => {
  const receiptHtml = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
      }, 500);
    };
  }
}; 

/**
 * Print student report using browser's print functionality
 */
export const printStudentReport = (data: StudentReportData): void => {
  const reportHtml = generateStudentReportHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
      }, 500);
    };
  }
};

/**
 * Print subscription invoice using browser's print functionality
 */
export const printSubscriptionInvoice = (data: SubscriptionInvoiceData): void => {
  const invoiceHtml = generateSubscriptionInvoiceHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
      }, 500);
    };
  }
};

export default {
  generateReceiptHTML,
  generateStudentReportHTML,
  generateSubscriptionInvoiceHTML,
  printReceipt,
  printStudentReport,
  printSubscriptionInvoice
};
 