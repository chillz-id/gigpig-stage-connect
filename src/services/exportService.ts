/**
 * Export Service
 *
 * Handles CSV and PDF export functionality for event management data:
 * - Applications list (with comedian details, status, spot type)
 * - Lineup/Schedule (with times, payments, assignments)
 * - Financial reports (deals, revenue, payments)
 *
 * Uses papaparse for CSV generation and jspdf + jspdf-autotable for PDFs.
 */

import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Export applications to CSV
 * Uses 'applications' table which has spot_type field
 */
export async function exportApplicationsToCSV(eventId: string): Promise<void> {
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      applied_at,
      status,
      spot_type,
      comedian:profiles!fk_applications_comedian (
        name,
        email,
        phone
      )
    `)
    .eq('event_id', eventId)
    .order('applied_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // Transform data for CSV
  const csvData = (applications || []).map((app: any) => ({
    'Application ID': app.id,
    'Applied Date': formatDate(app.applied_at),
    'Status': app.status || 'pending',
    'Spot Type': app.spot_type || 'N/A',
    'Comedian Name': app.comedian?.name || 'N/A',
    'Email': app.comedian?.email || 'N/A',
    'Phone': app.comedian?.phone || 'N/A',
  }));

  // Generate CSV string
  const headers = Object.keys(csvData[0] || {});
  const csvRows = [
    headers.join(','),
    ...csvData.map((row: any) =>
      headers.map(header => {
        const value = row[header]?.toString() || '';
        // Escape commas and quotes
        return value.includes(',') || value.includes('"')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');

  // Download file
  downloadFile(csvString, `applications-${eventId}.csv`, 'text/csv');
}

/**
 * Export lineup/schedule to CSV
 * Uses payment breakdown fields (payment_gross, payment_tax, payment_net, payment_status)
 */
export async function exportLineupToCSV(eventId: string): Promise<void> {
  const { data: spots, error } = await supabase
    .from('event_spots')
    .select(`
      id,
      spot_name,
      spot_order,
      is_filled,
      duration_minutes,
      payment_gross,
      payment_tax,
      payment_net,
      payment_status,
      currency,
      confirmation_status,
      comedian:profiles!event_spots_comedian_id_fkey (
        name,
        email
      )
    `)
    .eq('event_id', eventId)
    .order('spot_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch lineup: ${error.message}`);
  }

  // Transform data for CSV
  const csvData = (spots || []).map((spot: any) => ({
    'Order': spot.spot_order,
    'Spot Name': spot.spot_name,
    'Status': spot.is_filled ? 'Filled' : 'Open',
    'Duration (min)': spot.duration_minutes || 0,
    'Comedian': spot.comedian?.name || 'Unassigned',
    'Email': spot.comedian?.email || 'N/A',
    'Payment Gross': formatCurrency(spot.payment_gross || 0),
    'Payment Tax (GST)': formatCurrency(spot.payment_tax || 0),
    'Payment Net': formatCurrency(spot.payment_net || 0),
    'Currency': spot.currency || 'AUD',
    'Payment Status': spot.payment_status || 'unpaid',
    'Confirmation': spot.confirmation_status || 'N/A',
  }));

  // Generate CSV string
  const headers = Object.keys(csvData[0] || {});
  const csvRows = [
    headers.join(','),
    ...csvData.map((row: any) =>
      headers.map(header => {
        const value = row[header]?.toString() || '';
        return value.includes(',') || value.includes('"')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');

  // Download file
  downloadFile(csvString, `lineup-${eventId}.csv`, 'text/csv');
}

/**
 * Export financial report (deals + revenue) to CSV
 *
 * Exports multi-party deal data with participant split percentages.
 * Non-owners only see deals they're part of and that are fully confirmed.
 */
export async function exportFinancialReportToCSV(
  eventId: string,
  userId: string,
  isOwner: boolean
): Promise<void> {
  const { data: deals, error } = await supabase
    .from('event_deals')
    .select(`
      id,
      deal_name,
      deal_type,
      status,
      total_revenue,
      deal_participants (
        participant_id,
        split_type,
        split_percentage,
        flat_fee_amount,
        door_split_percentage,
        guaranteed_minimum,
        approval_status,
        user:profiles!deal_participants_participant_id_fkey (
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    throw new Error(`Failed to fetch financial data: ${error.message}`);
  }

  // Apply revenue visibility rules
  let visibleDeals = deals || [];
  if (!isOwner) {
    visibleDeals = (deals || []).filter((deal: any) => {
      const isParticipant = deal.deal_participants.some((p: any) => p.participant_id === userId);
      if (!isParticipant) return false;
      const allConfirmed = deal.deal_participants.every((p: any) => p.approval_status === 'approved');
      return allConfirmed;
    });
  }

  // Transform to flat CSV format with one row per participant
  const csvData = visibleDeals.flatMap((deal: any) =>
    deal.deal_participants.map((participant: any) => {
      // Format split details based on split_type
      let splitDetails = '';
      switch (participant.split_type) {
        case 'percentage':
          splitDetails = `${participant.split_percentage}%`;
          break;
        case 'flat_fee':
          splitDetails = formatCurrency(participant.flat_fee_amount || 0);
          break;
        case 'door_split':
          splitDetails = `${participant.door_split_percentage}% of door`;
          break;
        case 'guaranteed_minimum':
          splitDetails = `${participant.split_percentage}% (min: ${formatCurrency(participant.guaranteed_minimum || 0)})`;
          break;
        default:
          splitDetails = 'N/A';
      }

      return {
        'Deal ID': deal.id,
        'Deal Name': deal.deal_name,
        'Deal Type': deal.deal_type,
        'Total Revenue': formatCurrency(deal.total_revenue || 0),
        'Participant': `${participant.user?.first_name || ''} ${participant.user?.last_name || ''}`.trim() || 'N/A',
        'Email': participant.user?.email || 'N/A',
        'Split Type': participant.split_type,
        'Split Details': splitDetails,
        'Participant Status': participant.approval_status,
        'Deal Status': deal.status,
      };
    })
  );

  if (csvData.length === 0) {
    throw new Error('No financial data available to export');
  }

  // Generate CSV string
  const headers = Object.keys(csvData[0]);
  const csvRows = [
    headers.join(','),
    ...csvData.map((row: any) =>
      headers.map(header => {
        const value = row[header]?.toString() || '';
        return value.includes(',') || value.includes('"')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');

  // Download file
  downloadFile(csvString, `financial-report-${eventId}.csv`, 'text/csv');
}

/**
 * Export applications to PDF
 */
export async function exportApplicationsToPDF(eventId: string, eventTitle: string): Promise<void> {
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      applied_at,
      status,
      spot_type,
      is_shortlisted,
      comedian:profiles!fk_applications_comedian (
        first_name,
        last_name,
        email
      )
    `)
    .eq('event_id', eventId)
    .order('applied_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(`Applications Report: ${eventTitle}`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Prepare table data
  const tableData = (applications || []).map((app: any) => [
    formatDate(app.applied_at),
    `${app.comedian?.first_name || ''} ${app.comedian?.last_name || ''}`.trim() || 'N/A',
    app.comedian?.email || 'N/A',
    app.spot_type || 'N/A',
    app.status,
    app.is_shortlisted ? 'Yes' : 'No',
  ]);

  // Add table
  autoTable(doc, {
    head: [['Applied', 'Comedian', 'Email', 'Spot Type', 'Status', 'Shortlisted']],
    body: tableData,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [147, 51, 234] }, // Purple
  });

  // Download PDF
  doc.save(`applications-${eventId}.pdf`);
}

/**
 * Export lineup to PDF
 */
export async function exportLineupToPDF(eventId: string, eventTitle: string): Promise<void> {
  const { data: spots, error } = await supabase
    .from('event_spots')
    .select(`
      id,
      spot_type,
      position,
      status,
      start_time,
      duration_minutes,
      payment_net,
      comedian:profiles!event_spots_assigned_comedian_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('event_id', eventId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch lineup: ${error.message}`);
  }

  // Dynamic import
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(`Lineup: ${eventTitle}`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Prepare table data
  const tableData = (spots || []).map((spot: any) => [
    spot.position,
    spot.spot_type,
    spot.comedian
      ? `${spot.comedian.first_name} ${spot.comedian.last_name}`
      : 'Unassigned',
    spot.start_time || 'N/A',
    spot.duration_minutes ? `${spot.duration_minutes} min` : 'N/A',
    formatCurrency(spot.payment_net || 0),
    spot.status,
  ]);

  // Add table
  autoTable(doc, {
    head: [['#', 'Type', 'Comedian', 'Start', 'Duration', 'Payment', 'Status']],
    body: tableData,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [147, 51, 234] },
  });

  // Download PDF
  doc.save(`lineup-${eventId}.pdf`);
}

/**
 * Export financial report to PDF
 */
export async function exportFinancialReportToPDF(
  eventId: string,
  eventTitle: string,
  userId: string,
  isOwner: boolean
): Promise<void> {
  const { data: deals, error } = await supabase
    .from('event_deals')
    .select(`
      id,
      deal_name,
      deal_type,
      status,
      total_revenue,
      deal_participants (
        participant_id,
        split_type,
        split_percentage,
        flat_fee_amount,
        door_split_percentage,
        guaranteed_minimum,
        approval_status,
        user:profiles!deal_participants_participant_id_fkey (
          first_name,
          last_name
        )
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    throw new Error(`Failed to fetch deals: ${error.message}`);
  }

  // Apply privacy rules
  let visibleDeals = deals || [];
  if (!isOwner) {
    visibleDeals = (deals || []).filter((deal: any) => {
      const isParticipant = deal.deal_participants.some((p: any) => p.participant_id === userId);
      if (!isParticipant) return false;
      const allConfirmed = deal.deal_participants.every((p: any) => p.approval_status === 'approved');
      return allConfirmed;
    });
  }

  if (visibleDeals.length === 0) {
    throw new Error('No financial data available to export');
  }

  // Dynamic import
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(`Financial Report: ${eventTitle}`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Prepare table data
  const tableData = visibleDeals.flatMap((deal: any) =>
    deal.deal_participants.map((participant: any) => {
      // Format split details
      let splitDetails = '';
      switch (participant.split_type) {
        case 'percentage':
          splitDetails = `${participant.split_percentage}%`;
          break;
        case 'flat_fee':
          splitDetails = formatCurrency(participant.flat_fee_amount || 0);
          break;
        case 'door_split':
          splitDetails = `${participant.door_split_percentage}% door`;
          break;
        case 'guaranteed_minimum':
          splitDetails = `${participant.split_percentage}% (${formatCurrency(participant.guaranteed_minimum || 0)} min)`;
          break;
        default:
          splitDetails = 'N/A';
      }

      return [
        deal.deal_name,
        deal.deal_type,
        formatCurrency(deal.total_revenue || 0),
        `${participant.user?.first_name || ''} ${participant.user?.last_name || ''}`.trim() || 'N/A',
        participant.split_type,
        splitDetails,
        participant.approval_status,
        deal.status,
      ];
    })
  );

  // Add table
  autoTable(doc, {
    head: [['Deal', 'Type', 'Total', 'Participant', 'Split Type', 'Split Details', 'P. Status', 'D. Status']],
    body: tableData,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 6 },
    headStyles: { fillColor: [147, 51, 234] },
  });

  // Download PDF
  doc.save(`financial-report-${eventId}.pdf`);
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
