// ============================================================
// AUTH
// ============================================================
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'officer' | 'admin';
  preferred_language: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
  preferred_language?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================
// COMPLAINTS
// ============================================================
export interface ComplaintCreate {
  original_text: string;
  latitude: number;
  longitude: number;
  language?: string;
  category?: string;
}

export interface Complaint {
  id: string;
  citizen_id: string;
  original_text: string;
  translated_text?: string;
  detected_language?: string;
  category?: string;
  subcategory?: string;
  ai_description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  ward_id?: number;
  district_id?: number;
  severity?: number;
  status: ComplaintStatus;
  department_id?: number;
  cluster_id?: string;
  ai_analysis?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ComplaintStatus =
  | 'submitted'
  | 'analyzing'
  | 'analyzed'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'verified';

export interface ComplaintDetail extends Complaint {
  evidence: Evidence[];
  analysis?: AnalysisResult;
  cluster?: ClusterSummary;
  verifications: Verification[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// ============================================================
// EVIDENCE
// ============================================================
export interface Evidence {
  id: string;
  complaint_id: string;
  evidence_type: 'photo' | 'audio' | 'document';
  file_url?: string;
  mime_type?: string;
  ai_analysis?: Record<string, any>;
  created_at: string;
}

// ============================================================
// AI ANALYSIS
// ============================================================
export interface AnalysisResult {
  id: string;
  complaint_id: string;
  detected_language: string;
  translated_text: string;
  category: string;
  subcategory?: string;
  severity: number;
  issues: string[];
  possible_related_issue?: string;
  suggested_department: string;
  summary: string;
  confidence: number;
  model_used: string;
  analyzed_at: string;
}

// ============================================================
// CLUSTERS
// ============================================================
export interface ClusterSummary {
  id: string;
  representative_text: string;
  category: string;
  ward_id?: number;
  complaint_count: number;
  avg_severity: number;
}

export interface ClusterDetail extends ClusterSummary {
  complaints: Complaint[];
}

// ============================================================
// PRIORITY
// ============================================================
export interface PriorityScore {
  id: string;
  ward_id: number;
  ward_name: string;
  category?: string;
  total_score: number;
  demand_score: number;
  severity_score: number;
  population_score: number;
  infrastructure_gap_score: number;
  unresolved_score: number;
  explanation?: Record<string, any>;
}

export interface HotspotPoint {
  lat: number;
  lng: number;
  weight: number;
}

// ============================================================
// PROJECTS
// ============================================================
export interface ProjectCreate {
  title: string;
  description: string;
  category: string;
  ward_id: number;
  department_id: number;
  estimated_cost: number;
  affected_population: number;
  complaint_ids: string[];
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  category: string;
  ward_id?: number;
  department_id?: number;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  estimated_cost?: number;
  affected_population?: number;
  priority_score?: number;
  ai_recommendation?: Record<string, any>;
  approved_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ProjectDetail extends Project {
  complaints: Complaint[];
  verifications: Verification[];
  impact?: ImpactMeasurement;
}

// ============================================================
// VERIFICATION
// ============================================================
export interface Verification {
  id: string;
  complaint_id: string;
  project_id?: string;
  citizen_id: string;
  rating: number;
  comment?: string;
  photo_path?: string;
  is_resolved: boolean;
  verification_status: 'matches' | 'partial' | 'mismatch';
  created_at: string;
}

// ============================================================
// IMPACT
// ============================================================
export interface ImpactMeasurement {
  project_id: string;
  before_severity: number;
  after_severity: number;
  resolution_score: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
  is_estimated: boolean;
}

// ============================================================
// COPILOT
// ============================================================
export interface CopilotQuery {
  query: string;
  conversation_id?: string;
}

export interface CopilotResponse {
  response: string;
  tool_calls: ToolCall[];
  conversation_id: string;
}

export interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
}

// ============================================================
// DASHBOARD
// ============================================================
export interface DashboardSummary {
  total_complaints: number;
  active_complaints: number;
  high_priority_areas: number;
  pending_verifications: number;
  active_projects: number;
  resolved_this_month: number;
  avg_resolution_score: number;
}

export interface TrendData {
  daily: { date: string; count: number; avg_severity: number }[];
  by_category: { category: string; count: number }[];
}

// ============================================================
// SIMULATION
// ============================================================
export interface SimulationRequest {
  budget: number;
  ward_id?: number;
  category?: string;
}

export interface SimulationResult {
  options: {
    title: string;
    category: string;
    estimated_cost: number;
    affected_population: number;
    priority_score: number;
    impact_estimate: number;
    cost_efficiency: number;
  }[];
  recommendation: string;
  disclaimer: string;
}

// ============================================================
// VOICE
// ============================================================
export interface TranscriptionResult {
  text: string;
  detected_language: string;
  confidence: number;
}

// ============================================================
// TIMELINE
// ============================================================
export interface TimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  actor?: string;
}

// ============================================================
// COMPLAINT CATEGORIES
// ============================================================
export const COMPLAINT_CATEGORIES = [
  'Road Infrastructure',
  'Water Supply',
  'Drainage & Sewage',
  'Sanitation & Waste',
  'Electricity',
  'Healthcare',
  'Education',
  'Public Transport',
  'Parks & Recreation',
  'Building & Construction',
  'Pollution',
  'Public Safety',
  'Other',
] as const;

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
] as const;
