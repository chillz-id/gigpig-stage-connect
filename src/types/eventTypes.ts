
export interface EventFormData {
  title: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  date: string;
  time: string;
  endTime: string;
  type: string;
  spots: number;
  description: string;
  requirements: string[];
  isVerifiedOnly: boolean;
  isPaid: boolean;
  allowRecording: boolean;
  ageRestriction: string;
  dresscode: string;
  bannerUrl: string;
  showLevel: string;
  showType: string;
  customShowType: string;
  ticketingType: 'gigpigs' | 'external';
  externalTicketUrl: string;
  tickets: EventTicket[];
  feeHandling: 'absorb' | 'pass_to_customer';
}

export interface CustomDate {
  date: Date;
  times: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface RecurringSettings {
  isRecurring: boolean;
  pattern: string;
  endDate: string;
  customDates: CustomDate[];
}

export interface EventSpot {
  spot_name: string;
  is_paid: boolean;
  payment_amount?: number;
  currency: string;
  duration_minutes?: number;
}

export interface EventTicket {
  ticket_name: string;
  description?: string;
  price: number;
  currency: string;
}
