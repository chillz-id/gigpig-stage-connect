
// Xero Data Validation
export const validateXeroInvoice = (invoice) => {
  const required = ['Type', 'Contact', 'LineItems', 'Date', 'DueDate'];
  const missing = required.filter(field => !invoice[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate line items
  invoice.LineItems.forEach((item, index) => {
    if (!item.Description || !item.Quantity || !item.UnitAmount) {
      throw new Error(`Invalid line item at index ${index}`);
    }
  });
  
  return true;
};

export const validateXeroContact = (contact) => {
  if (!contact.Name) {
    throw new Error('Contact name is required');
  }
  
  if (!contact.EmailAddress && !contact.Phones?.length) {
    throw new Error('Contact must have email or phone');
  }
  
  return true;
};
