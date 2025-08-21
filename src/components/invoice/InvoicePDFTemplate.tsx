import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { Invoice, InvoiceItem } from '@/types/invoice';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  logo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  invoiceDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billToSection: {
    flex: 1,
    marginRight: 20,
  },
  billFromSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 3,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    textAlign: 'right',
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
  },
  headerCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 10,
    color: '#374151',
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  finalTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  finalTotalAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 5,
  },
  status: {
    position: 'absolute',
    top: 40,
    right: 40,
    padding: 8,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusPaid: {
    backgroundColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  statusOverdue: {
    backgroundColor: '#EF4444',
  },
  statusDraft: {
    backgroundColor: '#6B7280',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dateLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 10,
    color: '#374151',
  },
  notesSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.4,
  },
});

interface InvoicePDFTemplateProps {
  invoice: Invoice;
  items?: InvoiceItem[];
}

const formatCurrency = (amount: number, currency: string = 'AUD') => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
      return [styles.status, styles.statusPaid];
    case 'sent':
      return [styles.status, styles.statusPending];
    case 'overdue':
      return [styles.status, styles.statusOverdue];
    case 'draft':
      return [styles.status, styles.statusDraft];
    default:
      return [styles.status, styles.statusDraft];
  }
};

export const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({ 
  invoice, 
  items = [] 
}) => {
  // Mock items if none provided (for demo purposes)
  const mockItems = items.length > 0 ? items : [
    {
      id: '1',
      description: 'Stand-up Comedy Performance - Main Set',
      quantity: 1,
      unit_price: 400,
      subtotal: 400,
      tax_amount: 36.36,
      total: 436.36,
    },
    {
      id: '2',
      description: 'Opening Act Performance',
      quantity: 1,
      unit_price: 100,
      subtotal: 100,
      tax_amount: 9.09,
      total: 109.09,
    },
  ];

  const subtotal = mockItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = mockItems.reduce((sum, item) => sum + item.tax_amount, 0);
  const total = subtotal + taxAmount;

  const recipient = invoice.invoice_recipients?.[0];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status Badge */}
        <View style={getStatusStyle(invoice.status)}>
          <Text>{invoice.status.toUpperCase()}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.companyName}>Stand Up Sydney</Text>
            <Text style={styles.companyDetails}>ABN: 12 345 678 901</Text>
            <Text style={styles.companyDetails}>comedy@standupSydney.com</Text>
            <Text style={styles.companyDetails}>+61 2 9876 5432</Text>
            <Text style={styles.companyDetails}>123 Comedy St, Sydney NSW 2000</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Date Information */}
        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Issue Date:</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.issue_date)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Due Date:</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.billingSection}>
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.addressText}>
              {recipient?.recipient_name || 'Unknown Recipient'}
            </Text>
            <Text style={styles.addressText}>
              {recipient?.recipient_email || 'No email provided'}
            </Text>
            {invoice.client_address && (
              <Text style={styles.addressText}>{invoice.client_address}</Text>
            )}
            {invoice.client_mobile && (
              <Text style={styles.addressText}>{invoice.client_mobile}</Text>
            )}
          </View>
          <View style={styles.billFromSection}>
            <Text style={styles.sectionTitle}>From:</Text>
            <Text style={styles.addressText}>
              {invoice.sender_name || 'Stand Up Sydney'}
            </Text>
            <Text style={styles.addressText}>
              {invoice.sender_email || 'comedy@standupSydney.com'}
            </Text>
            {invoice.sender_phone && (
              <Text style={styles.addressText}>{invoice.sender_phone}</Text>
            )}
            {invoice.sender_address && (
              <Text style={styles.addressText}>{invoice.sender_address}</Text>
            )}
            {invoice.sender_abn && (
              <Text style={styles.addressText}>ABN: {invoice.sender_abn}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerCell]}>Description</Text>
            <Text style={[styles.tableCellCenter, styles.headerCell]}>Qty</Text>
            <Text style={[styles.tableCellRight, styles.headerCell]}>Rate</Text>
            <Text style={[styles.tableCellRight, styles.headerCell]}>Amount</Text>
          </View>
          {mockItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={styles.tableCellCenter}>{item.quantity}</Text>
              <Text style={styles.tableCellRight}>
                {formatCurrency(item.unit_price, invoice.currency)}
              </Text>
              <Text style={styles.tableCellRight}>
                {formatCurrency(item.subtotal, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(subtotal, invoice.currency)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (10%):</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(taxAmount, invoice.currency)}
            </Text>
          </View>
          <View style={styles.finalTotal}>
            <Text style={styles.finalTotalLabel}>Total:</Text>
            <Text style={styles.finalTotalAmount}>
              {formatCurrency(total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes Section */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business!
          </Text>
          <Text style={styles.footerText}>
            Payment terms: Net 30 days
          </Text>
          <Text style={styles.footerText}>
            For any questions about this invoice, please contact us at comedy@standupSydney.com
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// PDF Viewer Component for development/preview
export const InvoicePDFViewer: React.FC<InvoicePDFTemplateProps> = (props) => (
  <PDFViewer style={{ width: '100%', height: '600px' }}>
    <InvoicePDFTemplate {...props} />
  </PDFViewer>
);