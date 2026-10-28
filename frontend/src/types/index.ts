export type UserRole = 'citizen' | 'admin' | 'worker';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Reopened'
  | 'Rejected'
  | 'Escalated';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  department_id?: number;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  head_email?: string;
  phone?: string;
  sla_hours_default: number;
  created_at: string;
  active_complaints_count?: number;
}

export interface Ward {
  id: number;
  name: string;
  code: string;
  zone: string;
  center_latitude: number;
  center_longitude: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  department_id: number;
  department_name?: string;
  sla_hours: number;
  icon_name: string;
  keywords?: string;
}

export interface Attachment {
  id: number;
  complaint_id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  attachment_type: string;
  created_at: string;
}

export interface StatusHistory {
  id: number;
  complaint_id: number;
  old_status?: string;
  new_status: string;
  changed_by_name: string;
  remarks?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  complaint_id: number;
  user_id: number;
  author_name: string;
  author_role: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface Feedback {
  id: number;
  complaint_id: number;
  citizen_id: number;
  citizen_name?: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  complaint_id: string;
  title: string;
  description: string;
  original_language: string;
  translated_text?: string;
  category_id: number;
  category_name?: string;
  department_id: number;
  department_name?: string;
  ward_id?: number;
  ward_name?: string;
  citizen_id: number;
  citizen_name?: string;
  citizen_phone?: string;
  assigned_worker_id?: number;
  assigned_worker_name?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  ai_category_suggested?: string;
  ai_severity_suggested?: string;
  ai_confidence_score?: number;
  ai_reasoning?: string;
  ai_estimated_hours?: number;
  is_duplicate_of_id?: number;
  duplicate_similarity_score?: number;
  expected_resolution_at?: string;
  resolved_at?: string;
  reopened_count: number;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  feedback?: Feedback;
  status_history?: StatusHistory[];
  comments?: Comment[];
}

export interface Notification {
  id: number;
  user_id: number;
  complaint_id?: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AIClassifyResult {
  suggested_category_id: number;
  suggested_category_name: string;
  suggested_department_id: number;
  suggested_department_name: string;
  confidence: number;
  suggested_next_action: string;
}

export interface AISeverityResult {
  severity: ComplaintPriority;
  confidence: number;
  reasoning: string;
  risk_factors: string[];
}

export interface DuplicateMatchItem {
  id: number;
  complaint_id: string;
  title: string;
  category_name: string;
  similarity_score: number;
  distance_meters: number;
  status: string;
  created_at: string;
}

export interface AIDuplicateResult {
  is_likely_duplicate: boolean;
  highest_score: number;
  potential_duplicates: DuplicateMatchItem[];
}

export interface AISummaryResult {
  summary: string;
  reported_issue: string;
  location_clues: string;
  impact_assessment: string;
  missing_information: string[];
}

export interface DashboardSummary {
  total_complaints: number;
  newly_submitted: number;
  in_progress: number;
  assigned: number;
  resolved: number;
  reopened: number;
  escalated: number;
  overdue_complaints: number;
  critical_priority_complaints: number;
  average_resolution_hours: number;
  citizen_satisfaction_score: number;
  total_feedbacks_recorded: number;
}

export interface ChartsData {
  by_category: { name: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  by_ward: { ward: string; count: number }[];
  by_status: { status: string; count: number }[];
  department_performance: {
    department: string;
    code: string;
    total: number;
    resolved: number;
    pending: number;
  }[];
  complaints_over_time: { month: string; complaints: number }[];
  csat_breakdown: { rating: string; count: number }[];
}

export interface PredictiveAnalytics {
  historical_facts: {
    total_complaints_analyzed: number;
    top_wards: [string, number][];
    top_categories: [string, number][];
    status_distribution: Record<string, number>;
  };
  ai_predictions: {
    recurring_hotspots: {
      ward_name: string;
      historical_complaint_count: number;
      city_share_percentage: number;
      ai_risk_level: string;
      recommended_action: string;
    }[];
    preventive_maintenance_alerts: {
      zone: string;
      focus_area: string;
      historical_evidence: string;
      ai_predictive_projection: string;
      action_type: string;
    }[];
    seasonal_trends: {
      season: string;
      projected_category_surge: string;
      confidence: number;
      preventive_measure: string;
    }[];
    department_workload_forecasts: {
      department: string;
      total_handled: number;
      active_backlog: number;
      projected_next_week_intake: number;
      capacity_status: string;
    }[];
    disclaimer: string;
  };
}

export interface MapMarkerItem {
  id: number;
  complaint_id: string;
  title: string;
  category_name: string;
  category_icon: string;
  department_name: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  color: string;
  latitude: number;
  longitude: number;
  address: string;
  created_at: string;
  has_photos: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggested_actions?: string[];
  related_complaint_id?: string;
}
