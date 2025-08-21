import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or newline
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  metrics?: Array<{ label: string; value: string }>;
  charts?: {
    dailySales?: Array<{ date: string; revenue: number; tickets: number }>;
    platformBreakdown?: Array<{ platform: string; revenue: number; tickets: number; percentage: number }>;
  };
  tableData?: any[];
  tableHeaders?: string[];
}

export const exportToPDF = async (options: PDFExportOptions) => {
  const { 
    title, 
    subtitle, 
    metrics = [], 
    charts = {},
    tableData = [],
    tableHeaders = []
  } = options;

  // Create new PDF document
  const doc = new jsPDF();
  let yPos = 20;

  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPos);
  yPos += 10;

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, 20, yPos);
    yPos += 15;
  } else {
    yPos += 10;
  }

  // Add metrics section
  if (metrics.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Key Metrics', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    metrics.forEach((metric, index) => {
      if (index % 2 === 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(`${metric.label}:`, 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, 70, yPos);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text(`${metric.label}:`, 110, yPos - 5);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, 160, yPos - 5);
        yPos += 5;
      }
      
      if (index % 2 === 0 && index === metrics.length - 1) {
        yPos += 5;
      }
    });
    
    yPos += 10;
  }

  // Add platform breakdown if available
  if (charts.platformBreakdown && charts.platformBreakdown.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Platform Breakdown', 20, yPos);
    yPos += 8;

    const platformData = charts.platformBreakdown.map(p => [
      p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      p.tickets.toString(),
      `$${p.revenue.toFixed(2)}`,
      `${p.percentage.toFixed(1)}%`
    ]);

    doc.autoTable({
      head: [['Platform', 'Tickets', 'Revenue', 'Share']],
      body: platformData,
      startY: yPos,
      margin: { left: 20 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Add daily sales summary if available
  if (charts.dailySales && charts.dailySales.length > 0) {
    // Only show last 7 days for summary
    const recentSales = charts.dailySales.slice(-7);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Sales (Last 7 Days)', 20, yPos);
    yPos += 8;

    const salesData = recentSales.map(s => [
      new Date(s.date).toLocaleDateString(),
      s.tickets.toString(),
      `$${s.revenue.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [['Date', 'Tickets', 'Revenue']],
      body: salesData,
      startY: yPos,
      margin: { left: 20 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Add custom table data if provided
  if (tableData.length > 0 && tableHeaders.length > 0) {
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPos,
      margin: { left: 20 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 92, 246] }
    });
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
};