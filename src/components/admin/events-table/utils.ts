
export const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
    case 'open':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
};

export const getSettlementBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'outline';
    default:
      return 'outline';
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
