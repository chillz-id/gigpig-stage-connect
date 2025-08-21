export interface SpotConfirmation {
  id: string;
  spot_id: string;
  comedian_id: string;
  status: 'pending' | 'confirmed' | 'declined';
  response_deadline: string;
  response_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SpotConfirmationWithDetails extends SpotConfirmation {
  spot: {
    id: string;
    spot_name: string;
    payment_amount: number | null;
    currency: string;
    duration_minutes: number | null;
    spot_order: number;
    event_id: string;
    event: {
      id: string;
      title: string;
      event_date: string;
      start_time: string;
      end_time?: string;
      venue: string;
      address: string;
      description?: string;
      requirements?: string;
      promoter?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
      };
    };
  };
  comedian: {
    id: string;
    first_name: string;
    last_name: string;
    stage_name?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
}

export interface SpotConfirmationResponse {
  status: 'confirmed' | 'declined';
  notes?: string;
}

export interface SpotConfirmationHistory {
  id: string;
  spot_id: string;
  comedian_id: string;
  action: 'invited' | 'confirmed' | 'declined' | 'deadline_passed';
  notes?: string;
  created_at: string;
  created_by: string;
}