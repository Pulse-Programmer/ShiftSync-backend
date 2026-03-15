# ShiftSync Backend

Multi-location staff scheduling API for **Coastal Eats**, a restaurant group operating 4 locations across 2 time zones. The platform addresses real-world workforce scheduling challenges: last-minute callouts, overtime cost visibility, fair shift distribution, cross-location staffing conflicts, and centralized schedule oversight.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Database:** PostgreSQL (raw SQL via `pg` — no ORM)
- **Auth:** JWT + bcrypt (12 salt rounds)
- **Real-time:** Socket.io (JWT-authenticated connections)
- **Validation:** Zod v4
- **Timezone:** Luxon + PostgreSQL `AT TIME ZONE`
- **Hosting:** Railway (API + PostgreSQL)

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@coastaleats.com | CoastalAdmin@2026 |
| Manager (Downtown NY) | manager.downtown@coastaleats.com | CoastalMgr@2026 |
| Manager (Midtown NY) | manager.midtown@coastaleats.com | CoastalMgr@2026 |
| Manager (Westside LA) | manager.westside@coastaleats.com | CoastalMgr@2026 |
| Manager (Beachfront LA) | manager.beachfront@coastaleats.com | CoastalMgr@2026 |
| Staff | sarah.johnson@coastaleats.com | CoastalStaff@2026 |
| Staff (cross-timezone) | mike.chen@coastaleats.com | CoastalStaff@2026 |
| Staff | james.wilson@coastaleats.com | CoastalStaff@2026 |

All other staff use `CoastalStaff@2026` as password.

## Seed Data

Pre-populated with realistic data covering edge cases across multiple locations:

- **Organization:** Coastal Eats — 4 locations (Downtown NY, Midtown NY, Westside LA, Beachfront LA)
- **Users:** 17 users across admin, manager, and staff roles
- **Skills:** Bartender, Line Cook, Server, Host — assigned per staff member
- **Cross-location staff:** Mike Chen certified at both Downtown NY (Eastern) and Westside LA (Pacific)
- **Schedules:** Current-week and past-week published schedules with full shift coverage
- **Shift assignments:** Varied across skills and premium slots (Friday/Saturday evenings)
- **Swap requests:** Approved, rejected, and pending drop requests demonstrating the full workflow lifecycle
- **Availability:** Recurring weekly patterns and one-off exception overrides per user per location
- **Notifications:** Mix of read and unread across roles (shift assignments, schedule publications, swap updates, shift reminders)
- **Invitations:** Pending and accepted invitations showing the onboarding pipeline
- **Audit logs:** Shift creation, assignment, and swap approval/rejection history

## Roles & Permissions

### Admin
- Corporate oversight across all locations
- Creates/manages the organization, locations, and skills
- Invites managers and staff
- Full access to all schedules, analytics, and audit logs
- Can override any constraint

### Manager
- Scoped to assigned location(s) — Casey Martinez manages both Westside and Beachfront
- Creates schedules, defines shifts with required skills and headcount, assigns staff
- Publishes/unpublishes schedules (before configurable 48-hour cutoff)
- Approves/rejects swap and drop requests
- Views overtime dashboard and fairness analytics for their locations

### Staff
- Views published schedules for certified locations
- Sets recurring and exception availability per location
- Submits swap requests (peer-to-peer) and drop requests (max 3 pending)
- Picks up available dropped shifts matching their skills and certifications
- Manages notification preferences

## Core Capabilities

### 1. Shift Scheduling

Managers create shifts with location, date/time, required skill, and headcount. Staff are manually assigned with full constraint validation. Schedules are published to make them visible to staff, with unpublish allowed before a 48-hour cutoff.

### 2. Constraint Engine

Assignment validation runs through a dedicated constraint engine (`src/engine/`) rather than being scattered across route handlers. Every assignment — including swap approvals and shift pickups — passes through the same validation pipeline.

**8 constraints evaluated in parallel:**

| Constraint | Severity | Description |
|-----------|----------|-------------|
| DOUBLE_BOOKING | error | No overlapping shifts across any location |
| REST_PERIOD | error | Minimum 10 hours between shifts |
| SKILL_MATCH | error | Staff must have the required skill |
| LOCATION_CERTIFICATION | error | Staff must be certified at the location |
| AVAILABILITY | error | Shift must fall within availability window |
| DAILY_HOURS | warn >8h, error >12h | Daily hour limits |
| WEEKLY_HOURS | warn >=35h, error >=40h | Weekly hour / overtime threshold |
| CONSECUTIVE_DAYS | warn 6th, error 7th | Consecutive working day limits |

Each constraint returns a structured `ConstraintResult` with severity, message, and details. The validator aggregates results — `error` severity blocks the assignment, `warning` allows it with feedback.

When constraints fail, the **suggester** (`src/engine/suggester.ts`) automatically queries eligible staff and returns the top 5 alternatives sorted by fewest warnings, addressing the requirement to suggest alternatives (e.g., "Sarah is unavailable, but John and Maria have the required skill and availability").

Managers can provide overrides for overridable constraints (consecutive days, weekly hours) with a documented reason.

### 3. Shift Swapping & Coverage

Staff can request peer-to-peer swaps, offer shifts for drop, and pick up available dropped shifts. The full workflow:

```
SWAP:   pending_peer → pending_manager → approved | rejected
                     ↘ cancelled

DROP:   pending_manager → approved | rejected | expired
                        ↘ cancelled
        (pickup sets target_user_id while still pending_manager)
```

- Staff can cancel any pending request they created
- Peer accepts advance swap to manager approval
- Manager approval re-validates constraints before finalizing
- Material shift edits (time >30 min, location, skill changes) auto-cancel pending swaps with notification
- Max 3 pending swap/drop requests per staff member
- Drop requests expire 24 hours before the shift starts if unclaimed

### 4. Overtime & Labor Compliance

Tracks and warns about weekly hours approaching 40h (warning at 35+), daily hours exceeding 8h (warning) or 12h (hard block), 6th consecutive day (warning), and 7th consecutive day (requires manager override with documented reason).

**Overtime visualization includes:**
- Dashboard showing projected overtime costs for the current week
- Highlighting which specific assignments push staff into overtime
- Per-user weekly hour breakdown with drill-down detail

### 5. Schedule Fairness Analytics

- Distribution report: hours assigned per staff member over selectable periods (1w, 2w, 4w, 8w)
- Premium shift tracking: Friday/Saturday evening shifts (5pm+) tagged as premium
- Fairness score: composite metric showing whether premium shifts are distributed equitably
- Under/over-schedule visibility: staff compared against their stated desired hours

### 6. Real-Time Features (WebSocket)

Socket.io connections authenticate via JWT on handshake. Users auto-join rooms:
- `user:{id}` — personal notifications
- `location:{id}` — location-wide events (for each certified location)
- `managers:{locationId}` — manager-only events

Events emitted: `notification:new`, `schedule:published`, `shift:updated`, `swap:new_drop`, `assignment:conflict`.

- Schedule publish/modify pushes updates to affected staff without refresh
- Swap request submission and resolution notify relevant parties in real-time
- "On-duty now" dashboard shows who is currently working at each location, updating live
- Simultaneous assignment attempts result in 409 Conflict with immediate notification

### 7. Notifications & Communication

- Staff receive: new shift assignments, shift changes, swap request updates, schedule published, shift reminders
- Managers receive: swap/drop requests needing approval, overtime warnings, staff availability changes
- Configurable preferences: in-app only, or in-app + email simulation
- All notifications persisted with read/unread status in a notification center

### 8. Timezone Handling

- All timestamps stored as `TIMESTAMPTZ` (UTC) in PostgreSQL
- Each location has an IANA timezone identifier (e.g., `America/New_York`, `America/Los_Angeles`)
- Availability is stored per user **per location**, allowing different windows for the same staff across timezones
- Recurring availability resolves at query time using the location's timezone
- Shift creation converts local times to UTC via Luxon before storage
- Display conversion happens at the API boundary
- Overnight shifts (e.g., 11pm–3am) handled as a single continuous shift

### 9. Audit Trail

- All schedule changes logged: who made the change, when, before/after state
- Managers can view the history of any shift
- Admins can export audit logs for any date range and location (CSV)

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register organization + admin |
| POST | /api/auth/login | Login (returns JWT) |
| POST | /api/auth/accept-invite | Accept invitation and create account |
| GET | /api/auth/me | Get current user profile |

### Users & Availability
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users | List users (role-scoped) |
| GET | /api/users/:id | Get user details |
| PUT | /api/users/:id | Update user |
| PUT | /api/users/:id/deactivate | Deactivate user |
| PUT | /api/users/:id/reactivate | Reactivate user |
| POST | /api/users/:id/skills | Assign skill |
| DELETE | /api/users/:id/skills/:skillId | Remove skill |
| POST | /api/users/:id/locations | Certify at location |
| DELETE | /api/users/:id/locations/:locationId | Decertify from location |
| GET | /api/users/:id/availability | Get availability |
| GET | /api/users/:id/availability/effective | Get effective availability for a date |
| POST | /api/users/:id/availability | Create availability rule |
| PUT | /api/users/:id/availability/:availId | Update availability |
| DELETE | /api/users/:id/availability/:availId | Delete availability |

### Locations
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/locations | List locations |
| GET | /api/locations/:id | Get location details |
| POST | /api/locations | Create location |
| PUT | /api/locations/:id | Update location |
| GET | /api/locations/:id/staff | Get location staff |
| GET | /api/locations/:id/on-duty | Get currently on-duty staff |

### Schedules & Shifts
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/schedules/location/:locationId | Get schedules by location |
| GET | /api/schedules/:id | Get schedule |
| POST | /api/schedules | Create schedule |
| PUT | /api/schedules/:id/publish | Publish schedule |
| PUT | /api/schedules/:id/unpublish | Unpublish (before cutoff) |
| GET | /api/shifts/schedule/:scheduleId | Get shifts for schedule |
| GET | /api/shifts/:id | Get shift details |
| POST | /api/shifts | Create shift |
| PUT | /api/shifts/:id | Update shift |
| DELETE | /api/shifts/:id | Delete shift |
| POST | /api/shifts/:id/assign | Assign staff |
| POST | /api/shifts/:id/preview | Preview assignment constraints |
| DELETE | /api/shifts/:id/assign/:userId | Unassign staff |
| GET | /api/shifts/user/schedule | Get current user's schedule |
| GET | /api/shifts/location/:locationId/view | Location schedule view |

### Swap Requests
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/swap-requests | Create swap or drop request |
| GET | /api/swap-requests | List swap requests |
| GET | /api/swap-requests/available | Available shifts for pickup |
| PUT | /api/swap-requests/:id/accept | Peer accepts swap |
| PUT | /api/swap-requests/:id/approve | Manager approves |
| PUT | /api/swap-requests/:id/reject | Manager rejects |
| PUT | /api/swap-requests/:id/cancel | Requester cancels |
| POST | /api/swap-requests/:id/pickup | Pick up dropped shift |

### Overtime & Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/overtime/weekly | Weekly overview |
| GET | /api/overtime/user/:id | User weekly detail |
| GET | /api/overtime/projections | Overtime projections |
| GET | /api/analytics/fairness | Fairness report |
| GET | /api/analytics/fairness-score | Fairness score + breakdown |
| GET | /api/analytics/staff/:id/history | Staff shift history |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/notifications | Get notifications |
| GET | /api/notifications/unread-count | Unread count |
| PUT | /api/notifications/:id/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all as read |
| GET | /api/notifications/preferences | Get preferences |
| PUT | /api/notifications/preferences | Update preferences |

### Audit
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/audit | Query audit logs |
| GET | /api/audit/shift/:id | Shift change history |
| GET | /api/audit/export | Export as CSV |

### Skills & Invitations
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/skills | List skills |
| POST | /api/skills | Create skill |
| DELETE | /api/skills/:id | Delete skill |
| POST | /api/invitations | Create invitation |
| GET | /api/invitations | List invitations |
| PUT | /api/invitations/:id/revoke | Revoke invitation |
| POST | /api/invitations/:id/resend | Resend invitation |
| GET | /api/health | Health check |

## Architecture

### Constraint Engine

Assignment validation runs through a dedicated constraint engine (`src/engine/`) rather than being scattered across route handlers. Every assignment (including swap approvals and shift pickups) passes through the same validation pipeline. Each constraint returns a structured `ConstraintResult` with severity, message, and details. The validator aggregates results — `error` severity blocks the assignment, `warning` allows it with feedback.

When constraints fail, the **suggester** (`src/engine/suggester.ts`) automatically queries eligible staff and returns the top 5 alternatives sorted by fewest warnings.

### Timezone Handling

- All timestamps stored as `TIMESTAMPTZ` (UTC) in PostgreSQL
- Each location has an IANA timezone identifier (e.g., `America/New_York`)
- Availability is stored per user **per location**, allowing different windows for the same staff at locations in different timezones
- Recurring availability resolves at query time using the location's timezone
- Shift creation converts local times to UTC via Luxon before storage
- Display conversion happens at the API boundary

### Real-time (WebSocket)

Socket.io connections authenticate via JWT on handshake. Users auto-join rooms:
- `user:{id}` — personal notifications
- `location:{id}` — location-wide events (for each certified location)
- `managers:{locationId}` — manager-only events

Events emitted: `notification:new`, `schedule:published`, `shift:updated`, `swap:new_drop`, `assignment:conflict`.

### Swap State Machine

```
SWAP:   pending_peer → pending_manager → approved | rejected
                     ↘ cancelled

DROP:   pending_manager → approved | rejected | expired
                        ↘ cancelled
        (pickup sets target_user_id while still pending_manager)
```

- Staff can cancel any pending request they created
- Peer accepts advance swap to manager approval
- Manager approval re-validates constraints before finalizing
- Material shift edits auto-cancel pending swaps with notification

### Optimistic Locking

Shift assignments use an INSERT-with-NOT-EXISTS pattern to prevent concurrent double-assignment. If two managers try to assign the same staff member simultaneously, the second gets a 409 Conflict.

## Design Decisions (Intentional Ambiguities)

1. **De-certified staff**: Historical shifts remain intact. Staff cannot be assigned new shifts at that location. A `decertified_at` timestamp preserves the record.

2. **Desired hours vs availability**: Desired hours is a soft target (warning only). Availability is a hard constraint (blocks assignment).

3. **Consecutive days**: Any shift regardless of duration counts as a worked day, aligning with typical labor law interpretation.

4. **Shift edited after swap approval**: Notify both parties. Material edits (time change >30 min, location change, skill change) auto-cancel the swap.

5. **Timezone boundary locations**: Each location has exactly one authoritative IANA timezone. The business decides which applies.

6. **Overtime threshold**: 40+ hours is a hard block (error), not just a warning. Managers must override explicitly if they need to exceed it.

## Known Limitations

- Audit log export is synchronous CSV generation (would need streaming for large datasets)
- Invitation tokens use UUID v4 (not cryptographically signed, but sufficiently random)
- WebSocket reconnection handling depends on client implementation

## Database Schema

16 tables across the following domains:

- **Identity:** organizations, users, skills, invitations
- **Relationships:** user_locations, user_skills
- **Availability:** availability (recurring + exception types)
- **Scheduling:** schedules, shifts, shift_assignments
- **Workflows:** swap_requests
- **Communication:** notifications, notification_preferences
- **Compliance:** audit_logs
