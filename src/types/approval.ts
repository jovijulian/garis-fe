export interface ApprovalNotificationItem {
  id_approval: number;
  reference_id: number;
  module_name: string;
  approver_type: string;
  title: string;
  description: string;
  requester_name: string;
  created_at: string | null;
}

export interface ApprovalInfo {
  id_approval: number;
  module_name: string;
  approver_type: string;
  status: string;
  can_forward: boolean;
  created_at: string | null;
}

export interface ApprovalRequestDetailAttachment {
  id: number;
  progress_id?: number | null;
  request_id?: number | null;
  file_url: string;
  file_name: string;
  file_type: string;
  created_at?: string | null;
}

export interface ApprovalRequestDetail {
  id: number;
  document_number: string;
  user_id: string;
  cab_id: number;
  dept_id: number;
  problem_description: string;
  root_cause: string;
  corrective_action: string;
  status: string;
  request_date: string;
  completion_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active: number;
  requester?: {
    id_user: string;
    nama_user: string;
  };
  department?: {
    id_dept?: number;
    nama_dept: string;
  };
  attachments?: ApprovalRequestDetailAttachment[];
}

export interface ApprovalNotificationDetailResponse {
  approval_info: ApprovalInfo;
  request_detail: ApprovalRequestDetail;
}

export interface ApprovalActionPayload {
  status: 'APPROVED' | 'REJECTED';
  notes: string;
  forward_to_head1: boolean;
}
