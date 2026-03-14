import { query } from '../db/pool';

export async function getWeeklyOverview(locationId: string, weekStart: string) {
  const result = await query(
    `SELECT
       u.id, u.first_name, u.last_name, u.desired_weekly_hours,
       COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours,
       COUNT(DISTINCT (s.start_time AT TIME ZONE l.timezone)::date) as days_worked
     FROM users u
     JOIN user_locations ul ON u.id = ul.user_id
     JOIN locations l ON ul.location_id = l.id
     LEFT JOIN shift_assignments sa ON u.id = sa.user_id AND sa.status = 'assigned'
     LEFT JOIN shifts s ON sa.shift_id = s.id
       AND (s.start_time AT TIME ZONE l.timezone)::date >= $2::date
       AND (s.start_time AT TIME ZONE l.timezone)::date < $2::date + INTERVAL '7 days'
     WHERE ul.location_id = $1 AND ul.decertified_at IS NULL
     AND u.role = 'staff' AND u.is_active = true AND l.id = $1
     GROUP BY u.id, u.first_name, u.last_name, u.desired_weekly_hours
     ORDER BY total_hours DESC`,
    [locationId, weekStart]
  );

  return result.rows.map((r: any) => ({
    ...r,
    total_hours: parseFloat(r.total_hours),
    overtime_hours: Math.max(0, parseFloat(r.total_hours) - 40),
    status: parseFloat(r.total_hours) >= 40 ? 'overtime'
      : parseFloat(r.total_hours) >= 35 ? 'warning'
      : 'normal',
  }));
}

export async function getUserWeeklyDetail(userId: string, weekStart: string) {
  // Get all shifts for the user in this week (across all locations)
  const result = await query(
    `SELECT s.id, s.start_time, s.end_time,
            l.name as location_name, l.timezone,
            sk.name as skill_name,
            EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 as hours
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND (s.start_time AT TIME ZONE l.timezone)::date >= $2::date
     AND (s.start_time AT TIME ZONE l.timezone)::date < $2::date + INTERVAL '7 days'
     ORDER BY s.start_time`,
    [userId, weekStart]
  );

  let runningTotal = 0;
  const shifts = result.rows.map((r: any) => {
    const hours = parseFloat(r.hours);
    runningTotal += hours;
    return {
      ...r,
      hours: Math.round(hours * 10) / 10,
      running_total: Math.round(runningTotal * 10) / 10,
      pushes_past_35: runningTotal > 35 && (runningTotal - hours) <= 35,
      pushes_past_40: runningTotal > 40 && (runningTotal - hours) <= 40,
    };
  });

  return {
    userId,
    weekStart,
    totalHours: Math.round(runningTotal * 10) / 10,
    overtimeHours: Math.max(0, Math.round((runningTotal - 40) * 10) / 10),
    shifts,
  };
}

export async function getOvertimeProjections(locationId: string, weekStart: string) {
  // Include both published and draft shifts for projections
  const result = await query(
    `SELECT
       u.id, u.first_name, u.last_name,
       COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours,
       COALESCE(SUM(
         CASE WHEN sc.status = 'published'
         THEN EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
         ELSE 0 END
       ), 0) as published_hours,
       COALESCE(SUM(
         CASE WHEN sc.status = 'draft'
         THEN EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
         ELSE 0 END
       ), 0) as draft_hours
     FROM users u
     JOIN user_locations ul ON u.id = ul.user_id
     JOIN locations l ON ul.location_id = l.id
     LEFT JOIN shift_assignments sa ON u.id = sa.user_id AND sa.status = 'assigned'
     LEFT JOIN shifts s ON sa.shift_id = s.id
       AND (s.start_time AT TIME ZONE l.timezone)::date >= $2::date
       AND (s.start_time AT TIME ZONE l.timezone)::date < $2::date + INTERVAL '7 days'
     LEFT JOIN schedules sc ON s.schedule_id = sc.id
     WHERE ul.location_id = $1 AND ul.decertified_at IS NULL
     AND u.role = 'staff' AND u.is_active = true AND l.id = $1
     GROUP BY u.id, u.first_name, u.last_name
     HAVING COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) > 0
     ORDER BY total_hours DESC`,
    [locationId, weekStart]
  );

  return result.rows.map((r: any) => {
    const total = parseFloat(r.total_hours);
    const overtime = Math.max(0, total - 40);
    return {
      ...r,
      total_hours: Math.round(total * 10) / 10,
      published_hours: Math.round(parseFloat(r.published_hours) * 10) / 10,
      draft_hours: Math.round(parseFloat(r.draft_hours) * 10) / 10,
      overtime_hours: Math.round(overtime * 10) / 10,
      projected_overtime_cost: Math.round(overtime * 1.5 * 100) / 100, // 1.5x multiplier placeholder
    };
  });
}
