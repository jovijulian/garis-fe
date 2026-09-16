export type ReimbursementStatus =
  | 'WAITING_MANAGER'
  | 'WAITING_GA'
  | 'CLOSED'
  | 'REJECTED';

export interface ReimbursementItemOption {
  id: number;
  item_name: string;
}

export interface ReimbursementDetailItem {
  id?: number;
  reimbursement_id?: number;
  item_id: number;
  claim_amount: number | string;
  paid_amount?: number | string;
  notes: string | null;
  has_receipt?: number; // 0 or 1
  item?: {
    id: number;
    item_name: string;
    is_default?: number;
    is_active?: number;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

export interface ReimbursementAttachment {
  id: number;
  reimbursement_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  created_at?: string | null;
}

export interface ReimbursementApproval {
  id: number;
  reference_id: number;
  module_name: string;
  approver_type: string;
  approval_order: number;
  assigned_to?: string | null;
  action_by?: string | null;
  status: string;
  notes?: string | null;
  action_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  assigned_user?: {
    id_user: string;
    nama_user: string;
    hak_akses?: string;
    avatar?: string | null;
    role_garis?: number;
  } | null;
}

export interface ReimbursementListItem {
  id: number;
  document_number: string;
  user_id: string;
  cab_id: number;
  dept_id: number;
  destination: string;
  start_date: string;
  end_date: string;
  duration: number;
  duration_type: string; // 'Hari' | 'Malam'
  purpose: string;
  participant_count: number;
  total_claim: string;
  status: ReimbursementStatus;
  is_active: number;
  created_at: string;
  updated_at: string;
  requester?: {
    id_user: string;
    nama_user: string;
  };
  department?: {
    id_dept?: number;
    nama_dept: string;
  };
}

export interface ReimbursementDetail extends ReimbursementListItem {
  requester: {
    id_user: string;
    nama_user: string;
    hak_akses?: string;
    avatar?: string | null;
    role_garis?: number;
  };
  department: {
    no_dept?: number;
    id_dept?: number;
    nama_dept: string;
  };
  approvals: ReimbursementApproval[];
  details: ReimbursementDetailItem[];
  attachments: ReimbursementAttachment[];
}
