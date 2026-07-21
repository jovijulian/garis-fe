export type ProjectRequestStatus =
  | 'WAITING_APPROVAL'
  | 'WAITING_GA'
  | 'IN_PROGRESS'
  | 'WAITING_VERIFICATION'
  | 'REVISION'
  | 'CLOSED'
  | 'REJECTED';

export type ProjectProgressType =
  | 'UPDATE_GA'
  | 'REVISION_USER'
  | 'CLOSE_COMMENT_USER';

export type ProjectApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface ProjectAttachment {
  id: number;
  progress_id?: number | null;
  request_id?: number | null;
  file_url: string;
  file_name: string;
  file_type: string;
  created_at?: string | null;
}

export interface ProjectApproval {
  id: number;
  reference_id: number;
  module_name: string;
  approver_type: string;
  approval_order: number;
  assigned_to?: string | null;
  action_by?: string | null;
  status: ProjectApprovalStatus;
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

export interface ProjectProgressTimelineItem {
  id: number;
  request_id: number;
  user_id: string;
  title: string;
  description: string;
  progress_type: ProjectProgressType;
  created_at?: string | null;
  attachments: ProjectAttachment[];
}

export interface ProjectRequestListItem {
  id: number;
  document_number: string;
  user_id: string;
  cab_id: number;
  dept_id: number;
  problem_description: string;
  root_cause: string;
  corrective_action: string;
  status: ProjectRequestStatus;
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
}

export interface ProjectRequestDetail extends ProjectRequestListItem {
  approvals: ProjectApproval[];
  attachments: ProjectAttachment[];
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
  progress_timeline: ProjectProgressTimelineItem[];
}
