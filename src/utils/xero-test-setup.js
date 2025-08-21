
// Xero Test Environment Setup
export const setupXeroTestEnv = async () => {
  // Set test credentials
  process.env.XERO_CLIENT_ID = '196EF4DE2119488F8F6C4228849D650C';
  process.env.XERO_REDIRECT_URI = 'https://agents.standupsydney.com/auth/xero-callback';
  
  // Create test data
  const testInvoice = {
    invoice_number: 'TEST-' + Date.now(),
    recipient_name: 'Test Customer',
    recipient_email: 'test@example.com',
    items: [{
      description: 'Comedy Show Ticket Sales',
      quantity: 50,
      unit_price: 25.00
    }],
    tax_rate: 10,
    status: 'draft'
  };
  
  return { testInvoice };
};
