export type UserRole = 'admin' | 'manager' | 'staff';
export type ScheduleStatus = 'draft' | 'published';
export type AssignmentStatus = 'assigned' | 'removed';
export type SwapType = 'swap' | 'drop';
export type SwapStatus = 'pending_peer' | 'pending_manager' | 'approved' | 'rejected' | 'cancelled' | 'expired';
export type NotificationChannel = 'in_app' | 'email';

export interface Organization {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  desired_weekly_hours: number | null;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  timezone: string;
  edit_cutoff_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface Skill {
  id: string;
  organization_id: string;
  name: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  location_ids: string[];
  skill_ids: string[];
  token: string;
  invited_by: string;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
}

export interface UserSkill {
  user_id: string;
  skill_id: string;
}

export interface UserLocation {
  user_id: string;
  location_id: string;
  certified_at: Date;
  decertified_at: Date | null;
}

export interface Availability {
  id: string;
  user_id: string;
  location_id: string;
  type: 'recurring' | 'exception';
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: Date;
}

export interface Schedule {
  id: string;
  location_id: string;
  week_start: string;
  status: ScheduleStatus;
  published_at: Date | null;
  published_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Shift {
  id: string;
  schedule_id: string;
  location_id: string;
  start_time: Date;
  end_time: Date;
  required_skill_id: string | null;
  headcount_needed: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  user_id: string;
  status: AssignmentStatus;
  version: number;
  assigned_by: string;
  assigned_at: Date;
  removed_at: Date | null;
}

export interface SwapRequest {
  id: string;
  type: SwapType;
  requester_assignment_id: string;
  target_assignment_id: string | null;
  target_user_id: string | null;
  status: SwapStatus;
  manager_id: string | null;
  manager_reason: string | null;
  requester_reason: string | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  performed_by: string;
  performed_at: Date;
  ip_address: string | null;
  notes: string | null;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  role: UserRole;
  organizationId: string;
}

// Express request augmentation
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { locationIds: string[] };
    }
  }
}
