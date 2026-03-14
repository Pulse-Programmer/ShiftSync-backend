-- ShiftSync Core Schema
-- All timestamps stored as TIMESTAMPTZ (UTC internally, timezone-aware)

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE schedule_status AS ENUM ('draft', 'published');
CREATE TYPE assignment_status AS ENUM ('assigned', 'removed');
CREATE TYPE swap_type AS ENUM ('swap', 'drop');
CREATE TYPE swap_status AS ENUM ('pending_peer', 'pending_manager', 'approved', 'rejected', 'cancelled', 'expired');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email');

-- ORGANIZATIONS (top-level tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL,
  desired_weekly_hours NUMERIC(4,1),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- LOCATIONS
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  timezone VARCHAR(50) NOT NULL,
  edit_cutoff_hours INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_locations_org ON locations(organization_id);

-- SKILLS
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  UNIQUE (organization_id, name)
);
CREATE INDEX idx_skills_org ON skills(organization_id);

-- INVITATIONS
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  location_ids UUID[] DEFAULT '{}',
  skill_ids UUID[] DEFAULT '{}',
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org ON invitations(organization_id);

-- USER <-> SKILLS (many-to-many)
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
);

-- USER <-> LOCATIONS (certifications)
CREATE TABLE user_locations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  certified_at TIMESTAMPTZ DEFAULT NOW(),
  decertified_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, location_id)
);

-- AVAILABILITY
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('recurring', 'exception')),
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_availability_type CHECK (
    (type = 'recurring' AND day_of_week IS NOT NULL AND specific_date IS NULL)
    OR
    (type = 'exception' AND specific_date IS NOT NULL AND day_of_week IS NULL)
  )
);
CREATE INDEX idx_availability_user_date ON availability(user_id, specific_date);
CREATE INDEX idx_availability_user_day ON availability(user_id, day_of_week);

-- SCHEDULES (week-level container per location)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  status schedule_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (location_id, week_start)
);

-- SHIFTS
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  required_skill_id UUID REFERENCES skills(id),
  headcount_needed INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_shift_times CHECK (end_time > start_time)
);
CREATE INDEX idx_shifts_location_time ON shifts(location_id, start_time, end_time);
CREATE INDEX idx_shifts_schedule ON shifts(schedule_id);

-- SHIFT ASSIGNMENTS
CREATE TABLE shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status assignment_status DEFAULT 'assigned',
  version INTEGER DEFAULT 1,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  UNIQUE (shift_id, user_id)
);
CREATE INDEX idx_assignments_user ON shift_assignments(user_id, status);
CREATE INDEX idx_assignments_shift ON shift_assignments(shift_id, status);

-- SWAP REQUESTS
CREATE TABLE swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type swap_type NOT NULL,
  requester_assignment_id UUID NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
  target_assignment_id UUID REFERENCES shift_assignments(id),
  target_user_id UUID REFERENCES users(id),
  status swap_status DEFAULT 'pending_peer',
  manager_id UUID REFERENCES users(id),
  manager_reason TEXT,
  requester_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_swaps_requester ON swap_requests(requester_assignment_id, status);
CREATE INDEX idx_swaps_status ON swap_requests(status);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- NOTIFICATION PREFERENCES
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  channel notification_channel NOT NULL,
  enabled BOOLEAN DEFAULT true,
  UNIQUE (user_id, notification_type, channel)
);

-- AUDIT LOG
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  notes TEXT
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_logs(performed_at);
CREATE INDEX idx_audit_user ON audit_logs(performed_by);
