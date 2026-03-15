-- ShiftSync Seed Data for Coastal Eats
-- All passwords are bcrypt hashes of the documented passwords

-- Clean existing data (in reverse dependency order)
DELETE FROM audit_logs;
DELETE FROM notification_preferences;
DELETE FROM notifications;
DELETE FROM swap_requests;
DELETE FROM shift_assignments;
DELETE FROM shifts;
DELETE FROM schedules;
DELETE FROM availability;
DELETE FROM user_skills;
DELETE FROM user_locations;
DELETE FROM invitations;
DELETE FROM users;
DELETE FROM skills;
DELETE FROM locations;
DELETE FROM organizations;

-- ============================================================
-- ORGANIZATION
-- ============================================================
INSERT INTO organizations (id, name) VALUES
  ('a0000000-0000-4000-a000-000000000001', 'Coastal Eats');

-- ============================================================
-- LOCATIONS (4 across 2 timezones)
-- ============================================================
INSERT INTO locations (id, organization_id, name, address, timezone, edit_cutoff_hours) VALUES
  ('b0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'Coastal Eats Downtown',   '123 Main St, New York, NY',       'America/New_York',      48),
  ('b0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001', 'Coastal Eats Midtown',    '456 5th Ave, New York, NY',       'America/New_York',      48),
  ('b0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'Coastal Eats Westside',   '789 Ocean Ave, Los Angeles, CA',  'America/Los_Angeles',   48),
  ('b0000000-0000-4000-a000-000000000004', 'a0000000-0000-4000-a000-000000000001', 'Coastal Eats Beachfront', '321 Pacific Hwy, San Diego, CA',  'America/Los_Angeles',   24);

-- ============================================================
-- SKILLS
-- ============================================================
INSERT INTO skills (id, organization_id, name) VALUES
  ('c0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'bartender'),
  ('c0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001', 'line cook'),
  ('c0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'server'),
  ('c0000000-0000-4000-a000-000000000004', 'a0000000-0000-4000-a000-000000000001', 'host');

-- ============================================================
-- USERS
-- Password hashes: admin123, manager123, staff123
-- Generated with bcrypt salt rounds 12
-- ============================================================
-- admin123:  $2b$12$36LfHLBc44dV6r95.kodfOpKfuDqsdDg70CRNlZurZi8Rgo.36Urq
-- manager123: $2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa
-- staff123:   $2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy

-- Admin
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role) VALUES
  ('d0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001',
   'admin@coastaleats.com', '$2b$12$36LfHLBc44dV6r95.kodfOpKfuDqsdDg70CRNlZurZi8Rgo.36Urq', 'Alex', 'Rivera', 'admin');

-- Managers
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role) VALUES
  ('d0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001',
   'manager.downtown@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Jordan', 'Park', 'manager'),
  ('d0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001',
   'manager.midtown@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Taylor', 'Nguyen', 'manager'),
  ('d0000000-0000-4000-a000-000000000004', 'a0000000-0000-4000-a000-000000000001',
   'manager.westside@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Casey', 'Martinez', 'manager'),
  ('d0000000-0000-4000-a000-000000000005', 'a0000000-0000-4000-a000-000000000001',
   'manager.beachfront@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Morgan', 'Lee', 'manager');

-- Staff (12 members)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, desired_weekly_hours) VALUES
  ('d0000000-0000-4000-a000-000000000010', 'a0000000-0000-4000-a000-000000000001',
   'sarah.johnson@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Sarah', 'Johnson', 'staff', 40),
  ('d0000000-0000-4000-a000-000000000011', 'a0000000-0000-4000-a000-000000000001',
   'mike.chen@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Mike', 'Chen', 'staff', 35),
  ('d0000000-0000-4000-a000-000000000012', 'a0000000-0000-4000-a000-000000000001',
   'emily.davis@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Emily', 'Davis', 'staff', 30),
  ('d0000000-0000-4000-a000-000000000013', 'a0000000-0000-4000-a000-000000000001',
   'james.wilson@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'James', 'Wilson', 'staff', 40),
  ('d0000000-0000-4000-a000-000000000014', 'a0000000-0000-4000-a000-000000000001',
   'maria.garcia@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Maria', 'Garcia', 'staff', 25),
  ('d0000000-0000-4000-a000-000000000015', 'a0000000-0000-4000-a000-000000000001',
   'david.brown@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'David', 'Brown', 'staff', 40),
  ('d0000000-0000-4000-a000-000000000016', 'a0000000-0000-4000-a000-000000000001',
   'lisa.kim@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Lisa', 'Kim', 'staff', 20),
  ('d0000000-0000-4000-a000-000000000017', 'a0000000-0000-4000-a000-000000000001',
   'robert.taylor@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Robert', 'Taylor', 'staff', 35),
  ('d0000000-0000-4000-a000-000000000018', 'a0000000-0000-4000-a000-000000000001',
   'anna.white@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Anna', 'White', 'staff', 40),
  ('d0000000-0000-4000-a000-000000000019', 'a0000000-0000-4000-a000-000000000001',
   'tom.harris@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Tom', 'Harris', 'staff', 30),
  ('d0000000-0000-4000-a000-000000000020', 'a0000000-0000-4000-a000-000000000001',
   'jen.clark@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Jen', 'Clark', 'staff', 25),
  ('d0000000-0000-4000-a000-000000000021', 'a0000000-0000-4000-a000-000000000001',
   'chris.allen@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Chris', 'Allen', 'staff', 35);

-- ============================================================
-- MANAGER <-> LOCATION ASSIGNMENTS
-- Casey Martinez manages both Westside AND Beachfront (cross-location manager)
-- ============================================================
INSERT INTO user_locations (user_id, location_id) VALUES
  ('d0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001'), -- Jordan -> Downtown
  ('d0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000002'), -- Taylor -> Midtown
  ('d0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000003'), -- Casey -> Westside
  ('d0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000004'), -- Casey -> Beachfront (shared)
  ('d0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004'); -- Morgan -> Beachfront

-- ============================================================
-- STAFF <-> LOCATION CERTIFICATIONS
-- Mike Chen is cross-timezone (Downtown NY + Westside LA)
-- Some staff at multiple locations in same timezone
-- ============================================================
INSERT INTO user_locations (user_id, location_id) VALUES
  -- Downtown (NY) staff
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001'), -- Sarah -> Downtown
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000001'), -- Mike -> Downtown
  ('d0000000-0000-4000-a000-000000000012', 'b0000000-0000-4000-a000-000000000001'), -- Emily -> Downtown
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001'), -- James -> Downtown
  ('d0000000-0000-4000-a000-000000000014', 'b0000000-0000-4000-a000-000000000001'), -- Maria -> Downtown
  -- Midtown (NY) staff
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000002'), -- Sarah -> Midtown (cross-location NY)
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002'), -- David -> Midtown
  ('d0000000-0000-4000-a000-000000000016', 'b0000000-0000-4000-a000-000000000002'), -- Lisa -> Midtown
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002'), -- Robert -> Midtown
  -- Westside (LA) staff
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003'), -- Mike -> Westside (cross-timezone!)
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003'), -- Anna -> Westside
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003'), -- Tom -> Westside
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000003'), -- Jen -> Westside
  -- Beachfront (LA) staff
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000004'), -- Tom -> Beachfront (cross-location LA)
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000004'), -- Jen -> Beachfront (cross-location LA)
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004'); -- Chris -> Beachfront

-- ============================================================
-- STAFF <-> SKILLS
-- Some multi-skilled, some single
-- ============================================================
INSERT INTO user_skills (user_id, skill_id) VALUES
  -- Sarah: server + bartender (multi)
  ('d0000000-0000-4000-a000-000000000010', 'c0000000-0000-4000-a000-000000000003'),
  ('d0000000-0000-4000-a000-000000000010', 'c0000000-0000-4000-a000-000000000001'),
  -- Mike: bartender + server (multi, cross-timezone)
  ('d0000000-0000-4000-a000-000000000011', 'c0000000-0000-4000-a000-000000000001'),
  ('d0000000-0000-4000-a000-000000000011', 'c0000000-0000-4000-a000-000000000003'),
  -- Emily: host (single)
  ('d0000000-0000-4000-a000-000000000012', 'c0000000-0000-4000-a000-000000000004'),
  -- James: line cook (single)
  ('d0000000-0000-4000-a000-000000000013', 'c0000000-0000-4000-a000-000000000002'),
  -- Maria: server + host (multi)
  ('d0000000-0000-4000-a000-000000000014', 'c0000000-0000-4000-a000-000000000003'),
  ('d0000000-0000-4000-a000-000000000014', 'c0000000-0000-4000-a000-000000000004'),
  -- David: line cook + server (multi)
  ('d0000000-0000-4000-a000-000000000015', 'c0000000-0000-4000-a000-000000000002'),
  ('d0000000-0000-4000-a000-000000000015', 'c0000000-0000-4000-a000-000000000003'),
  -- Lisa: host (single)
  ('d0000000-0000-4000-a000-000000000016', 'c0000000-0000-4000-a000-000000000004'),
  -- Robert: bartender (single)
  ('d0000000-0000-4000-a000-000000000017', 'c0000000-0000-4000-a000-000000000001'),
  -- Anna: server + line cook (multi)
  ('d0000000-0000-4000-a000-000000000018', 'c0000000-0000-4000-a000-000000000003'),
  ('d0000000-0000-4000-a000-000000000018', 'c0000000-0000-4000-a000-000000000002'),
  -- Tom: bartender + server (multi)
  ('d0000000-0000-4000-a000-000000000019', 'c0000000-0000-4000-a000-000000000001'),
  ('d0000000-0000-4000-a000-000000000019', 'c0000000-0000-4000-a000-000000000003'),
  -- Jen: server (single)
  ('d0000000-0000-4000-a000-000000000020', 'c0000000-0000-4000-a000-000000000003'),
  -- Chris: line cook + bartender (multi)
  ('d0000000-0000-4000-a000-000000000021', 'c0000000-0000-4000-a000-000000000002'),
  ('d0000000-0000-4000-a000-000000000021', 'c0000000-0000-4000-a000-000000000001');

-- ============================================================
-- AVAILABILITY (recurring weekly)
-- Times are in each location's local timezone
-- ============================================================
-- Sarah (Downtown/Midtown NY): full-time Mon-Fri 8am-6pm, Sat 10am-4pm
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001', 'recurring', 5, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000001', 'recurring', 6, '10:00', '16:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000002', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000002', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000002', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000002', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000010', 'b0000000-0000-4000-a000-000000000002', 'recurring', 5, '08:00', '18:00');

-- Mike (Downtown NY + Westside LA): available 9am-5pm at both (different timezones!)
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000001', 'recurring', 1, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000001', 'recurring', 2, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000001', 'recurring', 3, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000001', 'recurring', 4, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000001', 'recurring', 5, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003', 'recurring', 1, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003', 'recurring', 2, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003', 'recurring', 3, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003', 'recurring', 4, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003', 'recurring', 5, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000011', 'b0000000-0000-4000-a000-000000000003', 'recurring', 6, '10:00', '16:00');

-- James (Downtown): full-time Mon-Sun (will be used for consecutive days test)
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 0, '06:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 1, '06:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 2, '06:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 3, '06:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 4, '06:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 5, '06:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000013', 'b0000000-0000-4000-a000-000000000001', 'recurring', 6, '06:00', '23:00');

-- Anna (Westside LA): evening availability, great for premium shift testing
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 0, '14:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 1, '14:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 2, '14:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 3, '14:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 4, '14:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 5, '14:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000018', 'b0000000-0000-4000-a000-000000000003', 'recurring', 6, '14:00', '23:59');

-- Tom (Westside + Beachfront LA): full-time
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003', 'recurring', 1, '08:00', '22:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003', 'recurring', 2, '08:00', '22:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003', 'recurring', 3, '08:00', '22:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003', 'recurring', 4, '08:00', '22:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003', 'recurring', 5, '08:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000003', 'recurring', 6, '08:00', '23:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000004', 'recurring', 0, '10:00', '20:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000004', 'recurring', 1, '08:00', '20:00'),
  ('d0000000-0000-4000-a000-000000000019', 'b0000000-0000-4000-a000-000000000004', 'recurring', 2, '08:00', '20:00');

-- David (Midtown NY): Mon-Sat 8am-6pm
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002', 'recurring', 5, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000015', 'b0000000-0000-4000-a000-000000000002', 'recurring', 6, '10:00', '18:00');

-- Lisa (Midtown NY): Mon-Thu 9am-5pm
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000016', 'b0000000-0000-4000-a000-000000000002', 'recurring', 1, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000016', 'b0000000-0000-4000-a000-000000000002', 'recurring', 2, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000016', 'b0000000-0000-4000-a000-000000000002', 'recurring', 3, '09:00', '17:00'),
  ('d0000000-0000-4000-a000-000000000016', 'b0000000-0000-4000-a000-000000000002', 'recurring', 4, '09:00', '17:00');

-- Robert (Midtown NY): Mon-Sat 10am-midnight (bar hours)
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002', 'recurring', 1, '10:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002', 'recurring', 2, '10:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002', 'recurring', 3, '10:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002', 'recurring', 4, '10:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002', 'recurring', 5, '10:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000017', 'b0000000-0000-4000-a000-000000000002', 'recurring', 6, '10:00', '23:59');

-- Jen (Westside + Beachfront LA): Mon-Fri 8am-6pm
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000003', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000003', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000003', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000003', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000003', 'recurring', 5, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000004', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000004', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000004', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000004', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-4000-a000-000000000020', 'b0000000-0000-4000-a000-000000000004', 'recurring', 5, '08:00', '18:00');

-- Chris (Beachfront LA): Mon-Sat 8am-midnight (flexible)
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004', 'recurring', 1, '08:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004', 'recurring', 2, '08:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004', 'recurring', 3, '08:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004', 'recurring', 4, '08:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004', 'recurring', 5, '08:00', '23:59'),
  ('d0000000-0000-4000-a000-000000000021', 'b0000000-0000-4000-a000-000000000004', 'recurring', 6, '08:00', '23:59');

-- ============================================================
-- SCHEDULES & SHIFTS
-- Using relative dates: current week (published) and next week (draft)
-- ============================================================

-- Current week schedule at Downtown (published)
INSERT INTO schedules (id, location_id, week_start, status, published_at, published_by) VALUES
  ('e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   date_trunc('week', CURRENT_DATE)::date, 'published', NOW() - INTERVAL '2 days',
   'd0000000-0000-4000-a000-000000000002');

-- Next week schedule at Downtown (draft)
INSERT INTO schedules (id, location_id, week_start, status) VALUES
  ('e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')::date, 'draft');

-- Current week schedule at Midtown (published)
INSERT INTO schedules (id, location_id, week_start, status, published_at, published_by) VALUES
  ('e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   date_trunc('week', CURRENT_DATE)::date, 'published', NOW() - INTERVAL '2 days',
   'd0000000-0000-4000-a000-000000000003');

-- Current week schedule at Westside (published)
INSERT INTO schedules (id, location_id, week_start, status, published_at, published_by) VALUES
  ('e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   date_trunc('week', CURRENT_DATE)::date, 'published', NOW() - INTERVAL '3 days',
   'd0000000-0000-4000-a000-000000000004');

-- Current week schedule at Beachfront (published)
INSERT INTO schedules (id, location_id, week_start, status, published_at, published_by) VALUES
  ('e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   date_trunc('week', CURRENT_DATE)::date, 'published', NOW() - INTERVAL '1 day',
   'd0000000-0000-4000-a000-000000000005');

-- Shifts for Downtown current week (Eastern Time)
-- Monday-Friday day shifts + evening shifts, creates overtime scenario for James
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  -- Monday
  ('f0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 2), -- line cook, 8h
  ('f0000000-0000-4000-a000-000000000002', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 2), -- server, 8h
  -- Tuesday
  ('f0000000-0000-4000-a000-000000000003', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1), -- line cook
  ('f0000000-0000-4000-a000-000000000004', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 1), -- bartender
  -- Wednesday
  ('f0000000-0000-4000-a000-000000000005', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1), -- line cook
  -- Thursday
  ('f0000000-0000-4000-a000-000000000006', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1), -- line cook
  -- Friday evening (premium shift)
  ('f0000000-0000-4000-a000-000000000007', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 17 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 23 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 2), -- bartender, premium
  -- Saturday evening (premium shift)
  ('f0000000-0000-4000-a000-000000000008', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 17 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 23 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 2), -- server, premium
  -- Sunday overnight shift (11pm Sun -> 3am Mon) for next week testing
  ('f0000000-0000-4000-a000-000000000009', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days 23 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days 3 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 1); -- bartender, overnight

-- Downtown Friday day shift (pushes James to 44h = overtime)
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  ('f0000000-0000-4000-a000-000000000010', 'e0000000-0000-4000-a000-000000000001', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 7 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 19 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1); -- line cook Fri 7am-7pm (12h)

-- Shifts for Westside current week (Pacific Time)
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  ('f0000000-0000-4000-a000-000000000020', 'e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 2), -- server Mon
  ('f0000000-0000-4000-a000-000000000021', 'e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 23 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000001', 1); -- bartender Fri evening (premium)

-- Additional Westside shifts (Pacific Time)
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  -- Tuesday server 9-5
  ('f0000000-0000-4000-a000-000000000022', 'e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 9 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 17 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Wednesday line cook 9-5
  ('f0000000-0000-4000-a000-000000000023', 'e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 9 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Thursday server 10-4
  ('f0000000-0000-4000-a000-000000000024', 'e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 10 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 16 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Saturday evening server 5-11 (premium)
  ('f0000000-0000-4000-a000-000000000025', 'e0000000-0000-4000-a000-000000000003', 'b0000000-0000-4000-a000-000000000003',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 23 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 1);

-- Shifts for Midtown current week (Eastern Time)
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  -- Monday host 9-5
  ('f0000000-0000-4000-a000-000000000030', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000004', 1),
  -- Monday bartender 11-7
  ('f0000000-0000-4000-a000-000000000031', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '11 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '19 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 1),
  -- Tuesday server 10-6
  ('f0000000-0000-4000-a000-000000000032', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 10 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 18 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Wednesday line cook 9-5
  ('f0000000-0000-4000-a000-000000000033', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Wednesday bartender 11-7
  ('f0000000-0000-4000-a000-000000000034', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 11 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 19 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 1),
  -- Thursday server 10-6
  ('f0000000-0000-4000-a000-000000000035', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 10 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 18 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Thursday host 10-4
  ('f0000000-0000-4000-a000-000000000036', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 10 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 16 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000004', 1),
  -- Friday evening bartender 5-11 (premium)
  ('f0000000-0000-4000-a000-000000000037', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 17 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 23 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 1),
  -- Saturday evening server 5-11 (premium)
  ('f0000000-0000-4000-a000-000000000038', 'e0000000-0000-4000-a000-000000000004', 'b0000000-0000-4000-a000-000000000002',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 17 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 23 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 1);

-- Shifts for Beachfront current week (Pacific Time)
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  -- Monday server 10-6
  ('f0000000-0000-4000-a000-000000000040', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '10 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '18 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Monday line cook 9-5
  ('f0000000-0000-4000-a000-000000000041', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Tuesday bartender 11-7
  ('f0000000-0000-4000-a000-000000000042', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 11 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 19 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000001', 1),
  -- Tuesday server 10-6
  ('f0000000-0000-4000-a000-000000000043', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 10 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 18 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Wednesday server 10-4
  ('f0000000-0000-4000-a000-000000000044', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 10 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 16 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Thursday line cook 9-5
  ('f0000000-0000-4000-a000-000000000045', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 9 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Friday evening bartender 5-11 (premium)
  ('f0000000-0000-4000-a000-000000000046', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 23 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000001', 1),
  -- Saturday evening bartender 5-11 (premium)
  ('f0000000-0000-4000-a000-000000000047', 'e0000000-0000-4000-a000-000000000005', 'b0000000-0000-4000-a000-000000000004',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 23 hours') AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-4000-a000-000000000001', 1);

-- ============================================================
-- NEXT-WEEK DRAFT SHIFTS (Downtown) — Overtime projection scenario
-- James projected at 42h again = system should flag risk before publish
-- ============================================================
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  -- Mon line cook 7am-5pm (10h)
  ('f0000000-0000-4000-a000-000000000050', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days 7 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Mon server 9am-5pm (8h)
  ('f0000000-0000-4000-a000-000000000051', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Tue line cook 9am-5pm (8h)
  ('f0000000-0000-4000-a000-000000000052', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '8 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '8 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Tue bartender 11am-7pm (8h)
  ('f0000000-0000-4000-a000-000000000053', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '8 days 11 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '8 days 19 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000001', 1),
  -- Wed line cook 9am-5pm (8h)
  ('f0000000-0000-4000-a000-000000000054', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Wed server 9am-5pm (8h)
  ('f0000000-0000-4000-a000-000000000055', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '9 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000003', 1),
  -- Thu line cook 9am-5pm (8h)
  ('f0000000-0000-4000-a000-000000000056', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '10 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '10 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1),
  -- Fri line cook 9am-5pm (8h)
  ('f0000000-0000-4000-a000-000000000057', 'e0000000-0000-4000-a000-000000000002', 'b0000000-0000-4000-a000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '11 days 9 hours') AT TIME ZONE 'America/New_York',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '11 days 17 hours') AT TIME ZONE 'America/New_York',
   'c0000000-0000-4000-a000-000000000002', 1);

-- Next-week draft assignments (James 42h, Sarah 16h, Mike 8h)
INSERT INTO shift_assignments (id, shift_id, user_id, assigned_by) VALUES
  ('aa000000-0000-4000-a000-000000000050', 'f0000000-0000-4000-a000-000000000050', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000051', 'f0000000-0000-4000-a000-000000000051', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000052', 'f0000000-0000-4000-a000-000000000052', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000053', 'f0000000-0000-4000-a000-000000000053', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000054', 'f0000000-0000-4000-a000-000000000054', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000055', 'f0000000-0000-4000-a000-000000000055', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000056', 'f0000000-0000-4000-a000-000000000056', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  ('aa000000-0000-4000-a000-000000000057', 'f0000000-0000-4000-a000-000000000057', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002');

-- ============================================================
-- SHIFT ASSIGNMENTS (current week)
-- James gets 5 consecutive days (Mon-Fri) = approaching consecutive day warning
-- Sarah gets premium shifts unevenly (for fairness test)
-- ============================================================
INSERT INTO shift_assignments (id, shift_id, user_id, assigned_by) VALUES
  -- Monday line cook: James
  ('aa000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  -- Monday server: Sarah
  ('aa000000-0000-4000-a000-000000000002', 'f0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002'),
  -- Monday server: Maria
  ('aa000000-0000-4000-a000-000000000003', 'f0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000014', 'd0000000-0000-4000-a000-000000000002'),
  -- Tuesday line cook: James (day 2)
  ('aa000000-0000-4000-a000-000000000004', 'f0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  -- Tuesday bartender: Mike
  ('aa000000-0000-4000-a000-000000000005', 'f0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000002'),
  -- Wednesday line cook: James (day 3)
  ('aa000000-0000-4000-a000-000000000006', 'f0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  -- Thursday line cook: James (day 4)
  ('aa000000-0000-4000-a000-000000000007', 'f0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002'),
  -- Friday evening bartender: Sarah (premium - uneven distribution)
  ('aa000000-0000-4000-a000-000000000008', 'f0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002'),
  -- Friday evening bartender: Mike
  ('aa000000-0000-4000-a000-000000000009', 'f0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000002'),
  -- Saturday evening server: Sarah (premium again - uneven!)
  ('aa000000-0000-4000-a000-000000000010', 'f0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002'),
  -- Westside Monday server: Anna
  ('aa000000-0000-4000-a000-000000000011', 'f0000000-0000-4000-a000-000000000020', 'd0000000-0000-4000-a000-000000000018', 'd0000000-0000-4000-a000-000000000004'),
  -- Westside Monday server: Tom
  ('aa000000-0000-4000-a000-000000000012', 'f0000000-0000-4000-a000-000000000020', 'd0000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000004'),
  -- Westside Friday bartender: Tom (premium)
  ('aa000000-0000-4000-a000-000000000013', 'f0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000004'),
  -- Downtown Friday line cook: James (day 5 → 44h total = overtime!)
  ('aa000000-0000-4000-a000-000000000020', 'f0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000002');

-- Additional Westside assignments
INSERT INTO shift_assignments (id, shift_id, user_id, assigned_by) VALUES
  -- Tue server: Jen
  ('aa000000-0000-4000-a000-000000000021', 'f0000000-0000-4000-a000-000000000022', 'd0000000-0000-4000-a000-000000000020', 'd0000000-0000-4000-a000-000000000004'),
  -- Wed line cook: Anna
  ('aa000000-0000-4000-a000-000000000022', 'f0000000-0000-4000-a000-000000000023', 'd0000000-0000-4000-a000-000000000018', 'd0000000-0000-4000-a000-000000000004'),
  -- Thu server: Tom
  ('aa000000-0000-4000-a000-000000000023', 'f0000000-0000-4000-a000-000000000024', 'd0000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000004'),
  -- Sat server: Anna (premium)
  ('aa000000-0000-4000-a000-000000000024', 'f0000000-0000-4000-a000-000000000025', 'd0000000-0000-4000-a000-000000000018', 'd0000000-0000-4000-a000-000000000004');

-- Midtown assignments
INSERT INTO shift_assignments (id, shift_id, user_id, assigned_by) VALUES
  -- Mon host: Lisa
  ('aa000000-0000-4000-a000-000000000030', 'f0000000-0000-4000-a000-000000000030', 'd0000000-0000-4000-a000-000000000016', 'd0000000-0000-4000-a000-000000000003'),
  -- Mon bartender: Robert
  ('aa000000-0000-4000-a000-000000000031', 'f0000000-0000-4000-a000-000000000031', 'd0000000-0000-4000-a000-000000000017', 'd0000000-0000-4000-a000-000000000003'),
  -- Tue server: David
  ('aa000000-0000-4000-a000-000000000032', 'f0000000-0000-4000-a000-000000000032', 'd0000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000003'),
  -- Wed line cook: David
  ('aa000000-0000-4000-a000-000000000033', 'f0000000-0000-4000-a000-000000000033', 'd0000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000003'),
  -- Wed bartender: Robert
  ('aa000000-0000-4000-a000-000000000034', 'f0000000-0000-4000-a000-000000000034', 'd0000000-0000-4000-a000-000000000017', 'd0000000-0000-4000-a000-000000000003'),
  -- Thu server: David
  ('aa000000-0000-4000-a000-000000000035', 'f0000000-0000-4000-a000-000000000035', 'd0000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000003'),
  -- Thu host: Lisa
  ('aa000000-0000-4000-a000-000000000036', 'f0000000-0000-4000-a000-000000000036', 'd0000000-0000-4000-a000-000000000016', 'd0000000-0000-4000-a000-000000000003'),
  -- Fri bartender: Robert (premium)
  ('aa000000-0000-4000-a000-000000000037', 'f0000000-0000-4000-a000-000000000037', 'd0000000-0000-4000-a000-000000000017', 'd0000000-0000-4000-a000-000000000003'),
  -- Sat server: David (premium)
  ('aa000000-0000-4000-a000-000000000038', 'f0000000-0000-4000-a000-000000000038', 'd0000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000003');

-- Beachfront assignments (Chris gets all premium shifts = fairness disparity)
INSERT INTO shift_assignments (id, shift_id, user_id, assigned_by) VALUES
  -- Mon server: Jen
  ('aa000000-0000-4000-a000-000000000040', 'f0000000-0000-4000-a000-000000000040', 'd0000000-0000-4000-a000-000000000020', 'd0000000-0000-4000-a000-000000000005'),
  -- Mon line cook: Chris
  ('aa000000-0000-4000-a000-000000000041', 'f0000000-0000-4000-a000-000000000041', 'd0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000005'),
  -- Tue bartender: Chris
  ('aa000000-0000-4000-a000-000000000042', 'f0000000-0000-4000-a000-000000000042', 'd0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000005'),
  -- Tue server: Tom
  ('aa000000-0000-4000-a000-000000000043', 'f0000000-0000-4000-a000-000000000043', 'd0000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000005'),
  -- Wed server: Jen
  ('aa000000-0000-4000-a000-000000000044', 'f0000000-0000-4000-a000-000000000044', 'd0000000-0000-4000-a000-000000000020', 'd0000000-0000-4000-a000-000000000005'),
  -- Thu line cook: Chris
  ('aa000000-0000-4000-a000-000000000045', 'f0000000-0000-4000-a000-000000000045', 'd0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000005'),
  -- Fri bartender: Chris (premium)
  ('aa000000-0000-4000-a000-000000000046', 'f0000000-0000-4000-a000-000000000046', 'd0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000005'),
  -- Sat bartender: Chris (premium)
  ('aa000000-0000-4000-a000-000000000047', 'f0000000-0000-4000-a000-000000000047', 'd0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000005');

-- ============================================================
-- SWAP REQUESTS (edge cases)
-- ============================================================
-- Pending swap: Sarah wants to swap her Friday evening with someone
INSERT INTO swap_requests (id, type, requester_assignment_id, target_assignment_id, status, requester_reason) VALUES
  ('bb000000-0000-4000-a000-000000000001', 'swap',
   'aa000000-0000-4000-a000-000000000008', -- Sarah's Friday bartender
   'aa000000-0000-4000-a000-000000000009', -- Mike's Friday bartender
   'pending_peer', 'Family dinner on Friday');

-- Pending drop: Maria wants to drop her Monday server shift
INSERT INTO swap_requests (id, type, requester_assignment_id, status, requester_reason, expires_at) VALUES
  ('bb000000-0000-4000-a000-000000000002', 'drop',
   'aa000000-0000-4000-a000-000000000003', -- Maria's Monday server
   'pending_manager', 'Doctor appointment',
   date_trunc('week', CURRENT_DATE) + INTERVAL '23 hours'); -- expires 24h before Mon shift

-- ============================================================
-- AUDIT LOG ENTRIES — comprehensive change history
-- Tells the story of how this week's schedules were built
-- ============================================================
INSERT INTO audit_logs (entity_type, entity_id, action, before_state, after_state, performed_by, performed_at, notes) VALUES
  -- Schedule creation across all locations (7 days ago)
  ('schedule', 'e0000000-0000-4000-a000-000000000001', 'create', NULL,
   '{"location": "Coastal Eats Downtown", "week_start": "current_week", "status": "draft"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '7 days', 'Weekly schedule created'),
  ('schedule', 'e0000000-0000-4000-a000-000000000004', 'create', NULL,
   '{"location": "Coastal Eats Midtown", "week_start": "current_week", "status": "draft"}',
   'd0000000-0000-4000-a000-000000000003', NOW() - INTERVAL '6 days 18 hours', 'Weekly schedule created'),
  ('schedule', 'e0000000-0000-4000-a000-000000000003', 'create', NULL,
   '{"location": "Coastal Eats Westside", "week_start": "current_week", "status": "draft"}',
   'd0000000-0000-4000-a000-000000000004', NOW() - INTERVAL '6 days 12 hours', 'Weekly schedule created'),
  ('schedule', 'e0000000-0000-4000-a000-000000000005', 'create', NULL,
   '{"location": "Coastal Eats Beachfront", "week_start": "current_week", "status": "draft"}',
   'd0000000-0000-4000-a000-000000000005', NOW() - INTERVAL '5 days 20 hours', 'Weekly schedule created'),

  -- Key shift assignments at Downtown (5-6 days ago)
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000001', 'create', NULL,
   '{"shift": "Monday line cook 9am-5pm", "staff": "James Wilson", "location": "Downtown"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '5 days 16 hours', 'Staff assigned to shift'),
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000002', 'create', NULL,
   '{"shift": "Monday server 9am-5pm", "staff": "Sarah Johnson", "location": "Downtown"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '5 days 15 hours', 'Staff assigned to shift'),
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000008', 'create', NULL,
   '{"shift": "Friday bartender 5pm-11pm (premium)", "staff": "Sarah Johnson", "location": "Downtown"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '5 days 10 hours', 'Premium shift assigned'),
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000020', 'create', NULL,
   '{"shift": "Friday line cook 7am-7pm (12h)", "staff": "James Wilson", "location": "Downtown", "projected_weekly_hours": 44}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '4 days 8 hours', 'WARNING: Assignment pushes James to 44h — overtime threshold exceeded'),

  -- Beachfront assignments — fairness concern (4 days ago)
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000046', 'create', NULL,
   '{"shift": "Friday bartender 5pm-11pm (premium)", "staff": "Chris Allen", "location": "Beachfront"}',
   'd0000000-0000-4000-a000-000000000005', NOW() - INTERVAL '4 days 2 hours', 'Premium shift assigned'),
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000047', 'create', NULL,
   '{"shift": "Saturday bartender 5pm-11pm (premium)", "staff": "Chris Allen", "location": "Beachfront"}',
   'd0000000-0000-4000-a000-000000000005', NOW() - INTERVAL '4 days 1 hour', 'Premium shift assigned — Chris now has all premium shifts at this location'),

  -- Schedule publishing (2-3 days ago)
  ('schedule', 'e0000000-0000-4000-a000-000000000003', 'publish',
   '{"status": "draft"}', '{"status": "published", "location": "Coastal Eats Westside"}',
   'd0000000-0000-4000-a000-000000000004', NOW() - INTERVAL '3 days', 'Schedule published — staff notified'),
  ('schedule', 'e0000000-0000-4000-a000-000000000001', 'publish',
   '{"status": "draft"}', '{"status": "published", "location": "Coastal Eats Downtown"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '2 days 12 hours', 'Schedule published — staff notified'),
  ('schedule', 'e0000000-0000-4000-a000-000000000004', 'publish',
   '{"status": "draft"}', '{"status": "published", "location": "Coastal Eats Midtown"}',
   'd0000000-0000-4000-a000-000000000003', NOW() - INTERVAL '2 days 6 hours', 'Schedule published — staff notified'),
  ('schedule', 'e0000000-0000-4000-a000-000000000005', 'publish',
   '{"status": "draft"}', '{"status": "published", "location": "Coastal Eats Beachfront"}',
   'd0000000-0000-4000-a000-000000000005', NOW() - INTERVAL '1 day 18 hours', 'Schedule published — staff notified'),

  -- Swap and drop requests (1-2 days ago)
  ('swap_request', 'bb000000-0000-4000-a000-000000000001', 'create', NULL,
   '{"type": "swap", "requester": "Sarah Johnson", "target": "Mike Chen", "shift": "Friday bartender 5pm-11pm", "reason": "Family dinner on Friday"}',
   'd0000000-0000-4000-a000-000000000010', NOW() - INTERVAL '1 day 14 hours', 'Swap request submitted — awaiting peer acceptance'),
  ('swap_request', 'bb000000-0000-4000-a000-000000000002', 'create', NULL,
   '{"type": "drop", "requester": "Maria Garcia", "shift": "Monday server 9am-5pm", "reason": "Doctor appointment"}',
   'd0000000-0000-4000-a000-000000000014', NOW() - INTERVAL '1 day 8 hours', 'Drop request submitted — awaiting manager approval'),

  -- Next-week draft creation (recent)
  ('schedule', 'e0000000-0000-4000-a000-000000000002', 'create', NULL,
   '{"location": "Coastal Eats Downtown", "week_start": "next_week", "status": "draft"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '18 hours', 'Next week draft schedule created'),
  ('shift_assignment', 'aa000000-0000-4000-a000-000000000050', 'create', NULL,
   '{"shift": "Next Mon line cook 7am-5pm (10h)", "staff": "James Wilson", "location": "Downtown", "schedule": "draft"}',
   'd0000000-0000-4000-a000-000000000002', NOW() - INTERVAL '12 hours', 'Draft assignment — projected 42h next week, overtime risk');

-- ============================================================
-- NOTIFICATIONS — system alerts that demonstrate real-time value
-- ============================================================

-- Admin notifications (Alex Rivera)
INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at) VALUES
  ('d0000000-0000-4000-a000-000000000001', 'overtime_warning',
   'Overtime Alert: James Wilson', 'James Wilson has exceeded 40 hours this week at Downtown (44h total). Review schedule to reduce labor costs.',
   '{"staffId": "d0000000-0000-4000-a000-000000000013", "hours": 44, "locationId": "b0000000-0000-4000-a000-000000000001"}',
   false, NOW() - INTERVAL '2 days'),
  ('d0000000-0000-4000-a000-000000000001', 'swap_request',
   'Drop Request Needs Approval', 'Maria Garcia is requesting to drop her Monday server shift at Downtown. Reason: Doctor appointment.',
   '{"swapRequestId": "bb000000-0000-4000-a000-000000000002"}',
   false, NOW() - INTERVAL '1 day 8 hours'),
  ('d0000000-0000-4000-a000-000000000001', 'schedule_published',
   'All Locations Published', 'Schedules for all 4 locations have been published for this week. 35 shift assignments across 12 staff members.',
   NULL, true, NOW() - INTERVAL '2 days'),
  ('d0000000-0000-4000-a000-000000000001', 'fairness_alert',
   'Fairness Alert: Beachfront', 'Premium shift distribution at Beachfront is uneven. Chris Allen has received all 2 premium shifts while 2 other staff have none.',
   '{"locationId": "b0000000-0000-4000-a000-000000000004", "score": 55}',
   false, NOW() - INTERVAL '1 day');

-- Manager notifications (Jordan Park — Downtown)
INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at) VALUES
  ('d0000000-0000-4000-a000-000000000002', 'overtime_warning',
   'Overtime Risk: James Wilson', 'James Wilson is at 44h this week at your location. Consider redistributing Friday shifts to avoid overtime penalties.',
   '{"staffId": "d0000000-0000-4000-a000-000000000013", "hours": 44}',
   false, NOW() - INTERVAL '2 days'),
  ('d0000000-0000-4000-a000-000000000002', 'swap_request',
   'Swap Request: Sarah Johnson', 'Sarah Johnson wants to swap her Friday bartender shift with Mike Chen. Reason: Family dinner on Friday.',
   '{"swapRequestId": "bb000000-0000-4000-a000-000000000001"}',
   false, NOW() - INTERVAL '1 day 14 hours'),
  ('d0000000-0000-4000-a000-000000000002', 'swap_request',
   'Drop Request: Maria Garcia', 'Maria Garcia wants to drop her Monday server shift. Reason: Doctor appointment. Expires 24h before shift start.',
   '{"swapRequestId": "bb000000-0000-4000-a000-000000000002"}',
   false, NOW() - INTERVAL '1 day 8 hours');

-- Staff notifications (Sarah Johnson)
INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at) VALUES
  ('d0000000-0000-4000-a000-000000000010', 'shift_assigned',
   'New Shift: Monday Server', 'You have been assigned to Monday server shift (9am-5pm) at Coastal Eats Downtown.',
   '{"shiftId": "f0000000-0000-4000-a000-000000000002"}',
   true, NOW() - INTERVAL '5 days'),
  ('d0000000-0000-4000-a000-000000000010', 'shift_assigned',
   'New Shift: Friday Bartender', 'You have been assigned to Friday bartender shift (5pm-11pm) at Coastal Eats Downtown. This is a premium shift.',
   '{"shiftId": "f0000000-0000-4000-a000-000000000007"}',
   true, NOW() - INTERVAL '5 days'),
  ('d0000000-0000-4000-a000-000000000010', 'schedule_published',
   'Schedule Published: Downtown', 'This week''s schedule at Coastal Eats Downtown has been published. You have 3 shifts totaling 20 hours.',
   NULL, true, NOW() - INTERVAL '2 days');

-- Staff notifications (James Wilson)
INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at) VALUES
  ('d0000000-0000-4000-a000-000000000013', 'schedule_published',
   'Schedule Published: Downtown', 'This week''s schedule at Coastal Eats Downtown has been published. You have 5 shifts totaling 44 hours.',
   NULL, true, NOW() - INTERVAL '2 days'),
  ('d0000000-0000-4000-a000-000000000013', 'overtime_warning',
   'Overtime Notice', 'You are scheduled for 44 hours this week, which exceeds the 40-hour threshold. Please check with your manager if adjustments are needed.',
   '{"hours": 44}',
   false, NOW() - INTERVAL '2 days');

-- Staff notifications (Maria Garcia)
INSERT INTO notifications (user_id, type, title, message, metadata, is_read, created_at) VALUES
  ('d0000000-0000-4000-a000-000000000014', 'swap_update',
   'Drop Request Submitted', 'Your request to drop Monday server shift has been submitted and is awaiting manager approval.',
   '{"swapRequestId": "bb000000-0000-4000-a000-000000000002"}',
   true, NOW() - INTERVAL '1 day 8 hours');
