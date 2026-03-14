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
  ('a0000000-0000-0000-0000-000000000001', 'Coastal Eats');

-- ============================================================
-- LOCATIONS (4 across 2 timezones)
-- ============================================================
INSERT INTO locations (id, organization_id, name, address, timezone, edit_cutoff_hours) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Coastal Eats Downtown',   '123 Main St, New York, NY',       'America/New_York',      48),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Coastal Eats Midtown',    '456 5th Ave, New York, NY',       'America/New_York',      48),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Coastal Eats Westside',   '789 Ocean Ave, Los Angeles, CA',  'America/Los_Angeles',   48),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Coastal Eats Beachfront', '321 Pacific Hwy, San Diego, CA',  'America/Los_Angeles',   24);

-- ============================================================
-- SKILLS
-- ============================================================
INSERT INTO skills (id, organization_id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'bartender'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'line cook'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'server'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'host');

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
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'admin@coastaleats.com', '$2b$12$36LfHLBc44dV6r95.kodfOpKfuDqsdDg70CRNlZurZi8Rgo.36Urq', 'Alex', 'Rivera', 'admin');

-- Managers
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role) VALUES
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'manager.downtown@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Jordan', 'Park', 'manager'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'manager.midtown@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Taylor', 'Nguyen', 'manager'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'manager.westside@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Casey', 'Martinez', 'manager'),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'manager.beachfront@coastaleats.com', '$2b$12$nwLQ/wUwiFIDZAQqIcMsceC2yEwPP6xfbLBNOhxEfgTJZrVDbYQDa', 'Morgan', 'Lee', 'manager');

-- Staff (12 members)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, desired_weekly_hours) VALUES
  ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001',
   'sarah.johnson@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Sarah', 'Johnson', 'staff', 40),
  ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001',
   'mike.chen@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Mike', 'Chen', 'staff', 35),
  ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001',
   'emily.davis@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Emily', 'Davis', 'staff', 30),
  ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001',
   'james.wilson@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'James', 'Wilson', 'staff', 40),
  ('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001',
   'maria.garcia@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Maria', 'Garcia', 'staff', 25),
  ('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001',
   'david.brown@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'David', 'Brown', 'staff', 40),
  ('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001',
   'lisa.kim@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Lisa', 'Kim', 'staff', 20),
  ('d0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001',
   'robert.taylor@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Robert', 'Taylor', 'staff', 35),
  ('d0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001',
   'anna.white@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Anna', 'White', 'staff', 40),
  ('d0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001',
   'tom.harris@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Tom', 'Harris', 'staff', 30),
  ('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001',
   'jen.clark@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Jen', 'Clark', 'staff', 25),
  ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001',
   'chris.allen@coastaleats.com', '$2b$12$MjNEsfUO5BDLxwgKKS8V1.L6ZdsrFMpCy.sUDQesbkKzt5asVgppy', 'Chris', 'Allen', 'staff', 35);

-- ============================================================
-- MANAGER <-> LOCATION ASSIGNMENTS
-- Casey Martinez manages both Westside AND Beachfront (cross-location manager)
-- ============================================================
INSERT INTO user_locations (user_id, location_id) VALUES
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'), -- Jordan -> Downtown
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002'), -- Taylor -> Midtown
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003'), -- Casey -> Westside
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004'), -- Casey -> Beachfront (shared)
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004'); -- Morgan -> Beachfront

-- ============================================================
-- STAFF <-> LOCATION CERTIFICATIONS
-- Mike Chen is cross-timezone (Downtown NY + Westside LA)
-- Some staff at multiple locations in same timezone
-- ============================================================
INSERT INTO user_locations (user_id, location_id) VALUES
  -- Downtown (NY) staff
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001'), -- Sarah -> Downtown
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001'), -- Mike -> Downtown
  ('d0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001'), -- Emily -> Downtown
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001'), -- James -> Downtown
  ('d0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000001'), -- Maria -> Downtown
  -- Midtown (NY) staff
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002'), -- Sarah -> Midtown (cross-location NY)
  ('d0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000002'), -- David -> Midtown
  ('d0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000002'), -- Lisa -> Midtown
  ('d0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000002'), -- Robert -> Midtown
  -- Westside (LA) staff
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003'), -- Mike -> Westside (cross-timezone!)
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003'), -- Anna -> Westside
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003'), -- Tom -> Westside
  ('d0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000003'), -- Jen -> Westside
  -- Beachfront (LA) staff
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000004'), -- Tom -> Beachfront (cross-location LA)
  ('d0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000004'), -- Jen -> Beachfront (cross-location LA)
  ('d0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000004'); -- Chris -> Beachfront

-- ============================================================
-- STAFF <-> SKILLS
-- Some multi-skilled, some single
-- ============================================================
INSERT INTO user_skills (user_id, skill_id) VALUES
  -- Sarah: server + bartender (multi)
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001'),
  -- Mike: bartender + server (multi, cross-timezone)
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000003'),
  -- Emily: host (single)
  ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000004'),
  -- James: line cook (single)
  ('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000002'),
  -- Maria: server + host (multi)
  ('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000004'),
  -- David: line cook + server (multi)
  ('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000003'),
  -- Lisa: host (single)
  ('d0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000004'),
  -- Robert: bartender (single)
  ('d0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001'),
  -- Anna: server + line cook (multi)
  ('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000002'),
  -- Tom: bartender + server (multi)
  ('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000001'),
  ('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000003'),
  -- Jen: server (single)
  ('d0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000003'),
  -- Chris: line cook + bartender (multi)
  ('d0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000002'),
  ('d0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000001');

-- ============================================================
-- AVAILABILITY (recurring weekly)
-- Times are in each location's local timezone
-- ============================================================
-- Sarah (Downtown/Midtown NY): full-time Mon-Fri 8am-6pm, Sat 10am-4pm
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'recurring', 5, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'recurring', 6, '10:00', '16:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'recurring', 1, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'recurring', 2, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'recurring', 3, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'recurring', 4, '08:00', '18:00'),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'recurring', 5, '08:00', '18:00');

-- Mike (Downtown NY + Westside LA): available 9am-5pm at both (different timezones!)
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'recurring', 1, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'recurring', 2, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'recurring', 3, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'recurring', 4, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000001', 'recurring', 5, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'recurring', 1, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'recurring', 2, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'recurring', 3, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'recurring', 4, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'recurring', 5, '09:00', '17:00'),
  ('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000003', 'recurring', 6, '10:00', '16:00');

-- James (Downtown): full-time Mon-Sun (will be used for consecutive days test)
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 0, '06:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 1, '06:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 2, '06:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 3, '06:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 4, '06:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 5, '06:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000001', 'recurring', 6, '06:00', '23:00');

-- Anna (Westside LA): evening availability, great for premium shift testing
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 0, '14:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 1, '14:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 2, '14:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 3, '14:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 4, '14:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 5, '14:00', '23:59'),
  ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000003', 'recurring', 6, '14:00', '23:59');

-- Tom (Westside + Beachfront LA): full-time
INSERT INTO availability (user_id, location_id, type, day_of_week, start_time, end_time) VALUES
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 'recurring', 1, '08:00', '22:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 'recurring', 2, '08:00', '22:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 'recurring', 3, '08:00', '22:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 'recurring', 4, '08:00', '22:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 'recurring', 5, '08:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000003', 'recurring', 6, '08:00', '23:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000004', 'recurring', 0, '10:00', '20:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000004', 'recurring', 1, '08:00', '20:00'),
  ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000004', 'recurring', 2, '08:00', '20:00');

-- ============================================================
-- SCHEDULES & SHIFTS
-- Using relative dates: current week (published) and next week (draft)
-- ============================================================

-- Current week schedule at Downtown (published)
INSERT INTO schedules (id, location_id, week_start, status, published_at, published_by) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE)::date, 'published', NOW() - INTERVAL '2 days',
   'd0000000-0000-0000-0000-000000000002');

-- Next week schedule at Downtown (draft)
INSERT INTO schedules (id, location_id, week_start, status) VALUES
  ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   (date_trunc('week', CURRENT_DATE) + INTERVAL '7 days')::date, 'draft');

-- Current week schedule at Westside (published)
INSERT INTO schedules (id, location_id, week_start, status, published_at, published_by) VALUES
  ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',
   date_trunc('week', CURRENT_DATE)::date, 'published', NOW() - INTERVAL '3 days',
   'd0000000-0000-0000-0000-000000000004');

-- Shifts for Downtown current week (Eastern Time)
-- Monday-Friday day shifts + evening shifts, creates overtime scenario for James
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  -- Monday
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000002', 2), -- line cook, 8h
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000003', 2), -- server, 8h
  -- Tuesday
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 9 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 17 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000002', 1), -- line cook
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 9 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '1 day 17 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000001', 1), -- bartender
  -- Wednesday
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 9 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '2 days 17 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000002', 1), -- line cook
  -- Thursday
  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 9 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '3 days 17 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000002', 1), -- line cook
  -- Friday evening (premium shift)
  ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 17 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 23 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000001', 2), -- bartender, premium
  -- Saturday evening (premium shift)
  ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 17 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '5 days 23 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000003', 2), -- server, premium
  -- Sunday overnight shift (11pm Sun -> 3am Mon) for next week testing
  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   date_trunc('week', CURRENT_DATE) + INTERVAL '6 days 23 hours' AT TIME ZONE 'America/New_York',
   date_trunc('week', CURRENT_DATE) + INTERVAL '7 days 3 hours' AT TIME ZONE 'America/New_York',
   'c0000000-0000-0000-0000-000000000001', 1); -- bartender, overnight

-- Shifts for Westside current week (Pacific Time)
INSERT INTO shifts (id, schedule_id, location_id, start_time, end_time, required_skill_id, headcount_needed) VALUES
  ('f0000000-0000-0000-0000-000000000020', 'e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',
   date_trunc('week', CURRENT_DATE) + INTERVAL '9 hours' AT TIME ZONE 'America/Los_Angeles',
   date_trunc('week', CURRENT_DATE) + INTERVAL '17 hours' AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-0000-0000-000000000003', 2), -- server Mon
  ('f0000000-0000-0000-0000-000000000021', 'e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 17 hours' AT TIME ZONE 'America/Los_Angeles',
   date_trunc('week', CURRENT_DATE) + INTERVAL '4 days 23 hours' AT TIME ZONE 'America/Los_Angeles',
   'c0000000-0000-0000-0000-000000000001', 1); -- bartender Fri evening (premium)

-- ============================================================
-- SHIFT ASSIGNMENTS
-- James gets 5 consecutive days (Mon-Fri) = approaching consecutive day warning
-- Sarah gets premium shifts unevenly (for fairness test)
-- ============================================================
INSERT INTO shift_assignments (id, shift_id, user_id, assigned_by) VALUES
  -- Monday line cook: James
  ('aa000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002'),
  -- Monday server: Sarah
  ('aa000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002'),
  -- Monday server: Maria
  ('aa000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000002'),
  -- Tuesday line cook: James (day 2)
  ('aa000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002'),
  -- Tuesday bartender: Mike
  ('aa000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002'),
  -- Wednesday line cook: James (day 3)
  ('aa000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002'),
  -- Thursday line cook: James (day 4)
  ('aa000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002'),
  -- Friday evening bartender: Sarah (premium - uneven distribution)
  ('aa000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002'),
  -- Friday evening bartender: Mike
  ('aa000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002'),
  -- Saturday evening server: Sarah (premium again - uneven!)
  ('aa000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002'),
  -- Westside Monday server: Anna
  ('aa000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000004'),
  -- Westside Monday server: Tom
  ('aa000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000004'),
  -- Westside Friday bartender: Tom (premium)
  ('aa000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000004');

-- ============================================================
-- SWAP REQUESTS (edge cases)
-- ============================================================
-- Pending swap: Sarah wants to swap her Friday evening with someone
INSERT INTO swap_requests (id, type, requester_assignment_id, target_assignment_id, status, requester_reason) VALUES
  ('bb000000-0000-0000-0000-000000000001', 'swap',
   'aa000000-0000-0000-0000-000000000008', -- Sarah's Friday bartender
   'aa000000-0000-0000-0000-000000000009', -- Mike's Friday bartender
   'pending_peer', 'Family dinner on Friday');

-- Pending drop: Maria wants to drop her Monday server shift
INSERT INTO swap_requests (id, type, requester_assignment_id, status, requester_reason, expires_at) VALUES
  ('bb000000-0000-0000-0000-000000000002', 'drop',
   'aa000000-0000-0000-0000-000000000003', -- Maria's Monday server
   'pending_manager', 'Doctor appointment',
   date_trunc('week', CURRENT_DATE) + INTERVAL '23 hours'); -- expires 24h before Mon shift

-- ============================================================
-- AUDIT LOG ENTRIES (sample history)
-- ============================================================
INSERT INTO audit_logs (entity_type, entity_id, action, after_state, performed_by, performed_at) VALUES
  ('schedule', 'e0000000-0000-0000-0000-000000000001', 'create',
   '{"location": "Downtown", "week_start": "current_week", "status": "draft"}',
   'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days'),
  ('schedule', 'e0000000-0000-0000-0000-000000000001', 'publish',
   '{"location": "Downtown", "status": "published"}',
   'd0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days');
