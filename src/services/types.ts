export interface Candidate {
  id: string;
  registration_number: string;
  name: string;
  area: string;
  status_triagem?: string;
  data_hora_triagem?: string;
  analista_triagem?: string;
  rejection_reasons?: string;
  notes?: string;
  priority?: number;
  flagged?: boolean;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
