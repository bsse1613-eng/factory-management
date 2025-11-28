import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Purchase, Delivery, PurchasePayment, DeliveryPayment } from '../types';

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-BD', { style: 'currency', currency: 'BDT' });
};

// Color Palette
const colors = {
  primary: [41, 128, 185] as [number, number, number],      // Blue
  success: [39, 174, 96] as [number, number, number],        // Green
  warning: [243, 156, 18] as [number, number, number],       // Orange
  danger: [231, 76, 60] as [number, number, number],         // Red
  dark: [44, 62, 80] as [number, number, number],            // Dark Blue
  darkGray: [52, 73, 94] as [number, number, number],        // Darker Gray
  mediumGray: [127, 140, 141] as [number, number, number],   // Medium Gray
  lightGray: [236, 240, 241] as [number, number, number],    // Light Gray
  white: [255, 255, 255] as [number, number, number],        // White
  accent: [155, 89, 182] as [number, number, number],        // Purple
};

// Helper function to add decorative header
const addDecorativeHeader = (doc: jsPDF, title: string, subtitle: string) => {
  // Background header bar
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 38, 'F');
  
  // Company name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.warning);
  doc.text('ALANKAR AGRO', 105, 8, { align: 'center' });
  
  // Title
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(title, 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 105, 28, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(...colors.warning);
  doc.setLineWidth(2);
  doc.line(40, 35, 170, 35);
};

// Helper function to add info badges
const addInfoBadge = (doc: jsPDF, label: string, value: string, x: number, y: number, color: [number, number, number]) => {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, 60, 8, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(label, x + 2, y + 5.5);
  
  doc.setFont('helvetica', 'normal');
  doc.text(value, x + 58, y + 5.5, { align: 'right' });
};

// Helper function to generate Purchase PDF document
const generatePurchasePDFDoc = (data: Purchase, payments: PurchasePayment[] = []) => {
  const doc = new jsPDF();
  
  // Decorative Header
  addDecorativeHeader(doc, 'FACTORY RECEIPT', 'Purchase Order Invoice');
  
  // Info badges
  doc.setFontSize(10);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Branch:', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(data.branch, 32, 50);
  
  addInfoBadge(doc, 'Date:', data.date, 136, 46, colors.darkGray);
  
  // Invoice ID with accent
  doc.setFillColor(...colors.accent);
  doc.roundedRect(14, 56, 90, 10, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(`Invoice #${data.id.slice(0, 8).toUpperCase()}`, 18, 63);
  
  // Main Details Table with enhanced styling
  autoTable(doc, {
    startY: 72,
    head: [['Description', 'Details']],
    body: [
      ['Product Name', data.product_name || 'Raw Material'],
      ['Supplier Name', data.supplier_name],
      ['Location', data.source_location],
      ['Number of Bags', `${data.number_of_bags} Bags`],
      ['Price Per Bag', formatCurrency(data.price_per_bag)],
      ['Total Amount', formatCurrency(data.total_price)],
    ],
    theme: 'plain',
    headStyles: { 
      fillColor: colors.primary,
      textColor: colors.white,
      fontStyle: 'bold',
      fontSize: 11,
      cellPadding: 5
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 70,
        fillColor: colors.lightGray,
        textColor: colors.dark
      },
      1: { 
        cellWidth: 'auto',
        textColor: colors.darkGray
      }
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249]
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 15;

  // Payment History Section with modern card style
  if (payments.length > 0) {
    doc.setFillColor(...colors.success);
    doc.roundedRect(14, finalY - 3, 182, 8, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text('Payment History', 18, finalY + 2.5);
    
    autoTable(doc, {
      startY: finalY + 7,
      head: [['Date', 'Notes', 'Amount']],
      body: payments.map(p => [p.date, p.notes || '-', formatCurrency(p.amount)]),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.mediumGray,
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3.5
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' },
        2: { 
          halign: 'right', 
          fontStyle: 'bold',
          textColor: colors.success
        }
      },
      alternateRowStyles: {
        fillColor: [249, 252, 250]
      }
    });
    finalY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Financial Summary Box with gradient effect
  doc.setFillColor(...colors.darkGray);
  doc.roundedRect(14, finalY - 3, 182, 8, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Financial Summary', 18, finalY + 2.5);
  
  autoTable(doc, {
    startY: finalY + 7,
    body: [
      ['Total Payable Amount', formatCurrency(data.total_price)],
      ['Total Paid Amount', formatCurrency(data.paid_amount)],
      ['Remaining Due', formatCurrency(data.due_amount)],
    ],
    theme: 'plain',
    bodyStyles: {
      fontSize: 11,
      cellPadding: 5,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { 
        cellWidth: 100,
        fillColor: colors.lightGray,
        textColor: colors.dark
      },
      1: { 
        halign: 'right',
        cellWidth: 'auto'
      }
    },
    didParseCell: function (data: any) {
      if (data.row.index === 2) {
        data.cell.styles.textColor = colors.danger;
        data.cell.styles.fillColor = [255, 245, 245];
      } else if (data.row.index === 1) {
        data.cell.styles.textColor = colors.success;
      } else {
        data.cell.styles.textColor = colors.primary;
      }
    }
  });

  // Footer with modern signature area
  finalY = (doc as any).lastAutoTable.finalY + 25;
  
  // Signature boxes
  doc.setDrawColor(...colors.mediumGray);
  doc.setLineWidth(0.3);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(14, finalY, 70, 25, 2, 2, 'FD');
  doc.roundedRect(126, finalY, 70, 25, 2, 2, 'FD');
  
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.8);
  doc.line(18, finalY + 16, 80, finalY + 16);
  doc.line(130, finalY + 16, 192, finalY + 16);

  doc.setFontSize(9);
  doc.setTextColor(...colors.mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', 18, finalY + 20);
  doc.text('Supplier Signature', 130, finalY + 20);
  
  // Generated timestamp footer
  doc.setFontSize(8);
  doc.setTextColor(...colors.mediumGray);
  doc.text(`Generated: ${new Date().toLocaleString('en-BD')}`, 105, 285, { align: 'center' });

  return doc;
};

// Helper function to generate Delivery PDF document
const generateDeliveryPDFDoc = (data: Delivery, payments: DeliveryPayment[] = []) => {
  const doc = new jsPDF();

  // Decorative Header
  addDecorativeHeader(doc, 'DELIVERY CHALLAN', 'Customer Invoice & Receipt');
  
  // Info badges
  doc.setFontSize(10);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Branch:', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(data.branch, 32, 50);
  
  addInfoBadge(doc, 'Date:', data.delivery_date, 136, 46, colors.success);
  
  // Customer Details Card
  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(14, 57, 182, 28, 3, 3, 'F');
  
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 57, 182, 28, 3, 3, 'D');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('Customer Details', 18, 63);
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  doc.text(`Name: ${data.customer_name}`, 18, 70);
  doc.text(`Mobile: ${data.customer_mobile}`, 18, 76);
  doc.text(`Address: ${data.customer_address}`, 18, 82);

  // Product Table with modern design
  autoTable(doc, {
    startY: 91,
    head: [['Item Description', 'Qty (Bags)', 'Rate (BDT)', 'Total (BDT)']],
    body: [
      [
        data.product_name || 'Finished Goods / Product', 
        data.number_of_bags.toString(), 
        formatCurrency(data.price_per_bag), 
        formatCurrency(data.total_product_price),
      ],
    ],
    theme: 'plain',
    headStyles: { 
      fillColor: colors.success,
      textColor: colors.white,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 5
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 5,
      fillColor: [249, 252, 250]
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { 
        halign: 'right', 
        fontStyle: 'bold',
        textColor: colors.success,
        fontSize: 11
      }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // Transport Details Section
  doc.setFillColor(...colors.warning);
  doc.roundedRect(14, currentY - 3, 182, 8, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Transport & Driver Details', 18, currentY + 2.5);
  
  autoTable(doc, {
    startY: currentY + 7,
    head: [['Driver Name', 'Truck Number', 'Driver Pay', 'Extra Cost', 'Total Cost']],
    body: [
      [
        data.driver_name,
        data.truck_number,
        formatCurrency(data.driver_payment_amount),
        formatCurrency(data.driver_extra_cost),
        formatCurrency(data.driver_total_cost)
      ]
    ],
    theme: 'plain',
    headStyles: { 
      fillColor: [211, 84, 0],
      textColor: colors.white,
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9.5,
      cellPadding: 4,
      fillColor: [255, 248, 240]
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 40 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { 
        halign: 'right', 
        fontStyle: 'bold',
        textColor: [211, 84, 0]
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Payment History
  if (payments.length > 0) {
    doc.setFillColor(...colors.accent);
    doc.roundedRect(14, currentY - 3, 182, 8, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.white);
    doc.text('Payment History', 18, currentY + 2.5);
    
    autoTable(doc, {
      startY: currentY + 7,
      head: [['Date', 'Notes', 'Amount']],
      body: payments.map(p => [p.date, p.notes || '-', formatCurrency(p.amount)]),
      theme: 'striped',
      headStyles: { 
        fillColor: colors.mediumGray,
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3.5
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' },
        2: { 
          halign: 'right',
          fontStyle: 'bold',
          textColor: colors.accent
        }
      },
      alternateRowStyles: {
        fillColor: [252, 249, 253]
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Final Summary with enhanced styling
  doc.setFillColor(...colors.darkGray);
  doc.roundedRect(14, currentY - 3, 182, 8, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('Payment Summary', 18, currentY + 2.5);
  
  autoTable(doc, {
    startY: currentY + 7,
    body: [
      ['Total Product Value', formatCurrency(data.total_product_price)],
      ['Total Received Amount', formatCurrency(data.product_paid_amount)],
      ['Balance Due', formatCurrency(data.product_due_amount)],
    ],
    theme: 'plain',
    bodyStyles: {
      fontSize: 11,
      cellPadding: 5,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { 
        cellWidth: 100,
        fillColor: colors.lightGray,
        textColor: colors.dark
      },
      1: { 
        halign: 'right',
        cellWidth: 'auto'
      }
    },
    didParseCell: function (data: any) {
      if (data.row.index === 2) {
        data.cell.styles.textColor = colors.danger;
        data.cell.styles.fillColor = [255, 245, 245];
      } else if (data.row.index === 1) {
        data.cell.styles.textColor = colors.success;
      } else {
        data.cell.styles.textColor = colors.primary;
      }
    }
  });

  // Signature area with modern design
  const finalY = (doc as any).lastAutoTable.finalY + 25;
  
  doc.setDrawColor(...colors.mediumGray);
  doc.setLineWidth(0.3);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(14, finalY, 70, 25, 2, 2, 'FD');
  doc.roundedRect(126, finalY, 70, 25, 2, 2, 'FD');
  
  doc.setDrawColor(...colors.success);
  doc.setLineWidth(0.8);
  doc.line(18, finalY + 16, 80, finalY + 16);
  doc.line(130, finalY + 16, 192, finalY + 16);

  doc.setFontSize(9);
  doc.setTextColor(...colors.mediumGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature', 18, finalY + 20);
  doc.text('Customer/Driver Sign', 130, finalY + 20);
  
  // Generated timestamp footer
  doc.setFontSize(8);
  doc.setTextColor(...colors.mediumGray);
  doc.text(`Generated: ${new Date().toLocaleString('en-BD')}`, 105, 285, { align: 'center' });

  return doc;
};

export const generatePurchasePDF = (data: Purchase, payments: PurchasePayment[] = []) => {
  const doc = generatePurchasePDFDoc(data, payments);
  doc.save(`Purchase_${data.date}_${data.supplier_name.replace(/\s+/g, '_')}.pdf`);
};

export const generateDeliveryPDF = (data: Delivery, payments: DeliveryPayment[] = []) => {
  const doc = generateDeliveryPDFDoc(data, payments);
  doc.save(`Delivery_${data.delivery_date}_${data.customer_name.replace(/\s+/g, '_')}.pdf`);
};

export const printPurchasePDF = (data: Purchase, payments: PurchasePayment[] = []) => {
  const doc = generatePurchasePDFDoc(data, payments);
  const pdfUrl = doc.output('bloburi') as unknown as string;
  const printWindow = window.open(pdfUrl);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

export const printDeliveryPDF = (data: Delivery, payments: DeliveryPayment[] = []) => {
  const doc = generateDeliveryPDFDoc(data, payments);
  const pdfUrl = doc.output('bloburi') as unknown as string;
  const printWindow = window.open(pdfUrl);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};