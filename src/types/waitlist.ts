
export interface WaitlistEntry {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  position: number;
  is_notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaitlistFormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
}
