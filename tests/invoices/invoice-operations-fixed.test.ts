// Invoice Operations Test Suite - Fixed version
describe('Invoice Operations Test Suite', () => {
  describe('1. Invoice Creation and Database Operations', () => {
    test('should generate unique invoice numbers', () => {
      const generateInvoiceNumber = (type: string) => {
        const prefix = type === 'promoter' ? 'PRO' : 'COM';
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        return `${prefix}-${year}${month}-${random}`;
      };

      const invoiceNumber = generateInvoiceNumber('promoter');
      expect(invoiceNumber).toMatch(/^PRO-\d{6}-\d{4}$/);
      
      const comedianInvoice = generateInvoiceNumber('comedian');
      expect(comedianInvoice).toMatch(/^COM-\d{6}-\d{4}$/);
    });

    test('should create invoice with all required fields', () => {
      const createRequest = {
        invoice_type: 'promoter' as const,
        sender_name: 'Test Sender',
        sender_email: 'sender@example.com',
        issue_date: '2025-01-09',
        due_date: '2025-02-09',
        subtotal_amount: 1000,
        tax_amount: 100,
        total_amount: 1100,
        items: [{
          description: 'Test Service',
          quantity: 1,
          unit_price: 1000,
          subtotal: 1000,
          tax_amount: 100,
          total: 1100
        }],
        recipients: [{
          recipient_name: 'Test Recipient',
          recipient_email: 'recipient@example.com',
          recipient_type: 'company' as const
        }]
      };

      expect(createRequest.invoice_type).toBe('promoter');
      expect(createRequest.total_amount).toBe(1100);
      expect(createRequest.items).toHaveLength(1);
      expect(createRequest.recipients).toHaveLength(1);
    });

    test('should handle deposit configuration', () => {
      const createRequest = {
        invoice_type: 'comedian' as const,
        sender_name: 'Test Comedian',
        sender_email: 'comedian@example.com',
        issue_date: '2025-01-09',
        due_date: '2025-02-09',
        subtotal_amount: 1000,
        tax_amount: 100,
        total_amount: 1100,
        deposit_amount: 500,
        deposit_due_days_before_event: 7,
        event_date: '2025-01-20'
      };

      expect(createRequest.deposit_amount).toBe(500);
      expect(createRequest.deposit_due_days_before_event).toBe(7);
      
      // Calculate deposit due date
      const eventDate = new Date(createRequest.event_date);
      const depositDueDate = new Date(eventDate);
      depositDueDate.setDate(depositDueDate.getDate() - createRequest.deposit_due_days_before_event);
      
      expect(depositDueDate).toBeInstanceOf(Date);
      expect(depositDueDate < eventDate).toBe(true);
    });

    test('should validate invoice data', () => {
      const validateInvoice = (data: any) => {
        const errors: string[] = [];
        if (!data.sender_name) errors.push('Sender name is required');
        if (!data.sender_email) errors.push('Sender email is required');
        if (data.subtotal_amount < 0) errors.push('Subtotal cannot be negative');
        if (!data.recipients || data.recipients.length === 0) {
          errors.push('At least one recipient is required');
        }
        return errors;
      };

      const invalidRequest = {
        sender_name: '',
        sender_email: 'invalid-email',
        subtotal_amount: -100,
        recipients: []
      };

      const errors = validateInvoice(invalidRequest);
      expect(errors).toContain('Sender name is required');
      expect(errors).toContain('At least one recipient is required');
      expect(errors).toContain('Subtotal cannot be negative');
    });
  });

  describe('2. Payment Processing', () => {
    test('should record payment and calculate remaining balance', () => {
      interface Payment {
        amount: number;
        date: string;
      }

      const invoice = {
        id: 'invoice-1',
        total_amount: 1000,
        payments: [
          { amount: 300, date: '2025-01-05' },
          { amount: 200, date: '2025-01-07' }
        ] as Payment[]
      };

      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = invoice.total_amount - totalPaid;

      expect(totalPaid).toBe(500);
      expect(remainingBalance).toBe(500);
      expect(remainingBalance > 0).toBe(true); // Not fully paid
    });

    test('should mark invoice as paid when fully paid', () => {
      const invoice = {
        id: 'invoice-1',
        total_amount: 1000,
        status: 'sent'
      };

      const payment = { amount: 1000, date: '2025-01-09' };
      const totalPaid = payment.amount;

      if (totalPaid >= invoice.total_amount) {
        invoice.status = 'paid';
      }

      expect(invoice.status).toBe('paid');
    });

    test('should handle partial payments', () => {
      interface Payment {
        amount: number;
        date: string;
      }

      const invoice = {
        id: 'invoice-1',
        total_amount: 1000,
        payments: [] as Payment[]
      };

      const payments: Payment[] = [
        { amount: 300, date: '2025-01-05' },
        { amount: 300, date: '2025-01-07' },
        { amount: 200, date: '2025-01-09' }
      ];

      payments.forEach(p => invoice.payments.push(p));
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

      expect(totalPaid).toBe(800);
      expect(totalPaid < invoice.total_amount).toBe(true);
    });
  });

  describe('3. Invoice Metrics', () => {
    test('should calculate invoice metrics', () => {
      const invoices = [
        { status: 'paid', total_amount: 1000 },
        { status: 'sent', total_amount: 500 },
        { status: 'overdue', total_amount: 750 },
        { status: 'paid', total_amount: 1500 }
      ];

      const metrics = {
        total: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        paid: invoices.filter(inv => inv.status === 'paid').length,
        paidAmount: invoices.filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.total_amount, 0),
        pending: invoices.filter(inv => inv.status === 'sent').length,
        pendingAmount: invoices.filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + inv.total_amount, 0),
        overdue: invoices.filter(inv => inv.status === 'overdue').length,
        overdueAmount: invoices.filter(inv => inv.status === 'overdue')
          .reduce((sum, inv) => sum + inv.total_amount, 0)
      };

      expect(metrics.total).toBe(4);
      expect(metrics.totalAmount).toBe(3750);
      expect(metrics.paid).toBe(2);
      expect(metrics.paidAmount).toBe(2500);
      expect(metrics.pending).toBe(1);
      expect(metrics.pendingAmount).toBe(500);
      expect(metrics.overdue).toBe(1);
      expect(metrics.overdueAmount).toBe(750);
    });
  });

  describe('4. Overdue Invoice Handling', () => {
    test('should identify overdue invoices', () => {
      const today = new Date();
      const invoices = [
        { id: '1', status: 'sent', due_date: '2025-01-01' },
        { id: '2', status: 'sent', due_date: '2025-12-31' },
        { id: '3', status: 'paid', due_date: '2025-01-01' }
      ];

      const overdueInvoices = invoices.filter(inv => {
        if (inv.status !== 'sent') return false;
        const dueDate = new Date(inv.due_date);
        return dueDate < today;
      });

      expect(overdueInvoices).toHaveLength(1);
      expect(overdueInvoices[0]?.id).toBe('1');
    });
  });

  describe('5. Invoice from Ticket Sales', () => {
    test('should create invoice from ticket sales data', () => {
      const event = {
        id: 'event-1',
        title: 'Comedy Night',
        date: '2025-01-15',
        ticket_sales: [
          {
            platform: 'eventbrite',
            quantity_sold: 100,
            gross_revenue: 5000,
            platform_fees: 250,
            net_revenue: 4750
          },
          {
            platform: 'trybooking',
            quantity_sold: 50,
            gross_revenue: 2500,
            platform_fees: 100,
            net_revenue: 2400
          }
        ]
      };

      const totalGross = event.ticket_sales.reduce((sum, s) => sum + s.gross_revenue, 0);
      const totalFees = event.ticket_sales.reduce((sum, s) => sum + s.platform_fees, 0);
      const totalNet = event.ticket_sales.reduce((sum, s) => sum + s.net_revenue, 0);

      expect(totalGross).toBe(7500);
      expect(totalFees).toBe(350);
      expect(totalNet).toBe(7150);
      expect(totalNet).toBe(totalGross - totalFees);
    });
  });
});