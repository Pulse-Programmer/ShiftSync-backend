import { query } from '../db/pool';

export async function getFairnessReport(locationId: string, startDate: string, endDate: string) {
  const result = await query(
    `SELECT
       u.id, u.first_name, u.last_name, u.desired_weekly_hours,
       COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as total_hours,
       COUNT(sa.id) FILTER (WHERE sa.id IS NOT NULL) as total_shifts,
       COUNT(sa.id) FILTER (
         WHERE EXTRACT(DOW FROM s.start_time AT TIME ZONE l.timezone) IN (5, 6)
         AND EXTRACT(HOUR FROM s.start_time AT TIME ZONE l.timezone) >= 17
       ) as premium_shifts
     FROM users u
     JOIN user_locations ul ON u.id = ul.user_id
     JOIN locations l ON l.id = $1
     LEFT JOIN shift_assignments sa ON u.id = sa.user_id AND sa.status = 'assigned'
     LEFT JOIN shifts s ON sa.shift_id = s.id AND s.location_id = $1
       AND s.start_time >= $2::timestamptz AND s.start_time < $3::timestamptz
     WHERE ul.location_id = $1 AND ul.decertified_at IS NULL
     AND u.role = 'staff' AND u.is_active = true
     GROUP BY u.id, u.first_name, u.last_name, u.desired_weekly_hours
     ORDER BY u.last_name, u.first_name`,
    [locationId, startDate, endDate]
  );

  // Calculate weeks in range for target hours
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weeks = Math.max(1, (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return result.rows.map((r: any) => {
    const totalHours = parseFloat(r.total_hours);
    const targetHours = r.desired_weekly_hours ? parseFloat(r.desired_weekly_hours) * weeks : null;
    const deviation = targetHours ? totalHours - targetHours : null;

    return {
      ...r,
      total_hours: Math.round(totalHours * 10) / 10,
      target_hours: targetHours ? Math.round(targetHours * 10) / 10 : null,
      hours_deviation: deviation ? Math.round(deviation * 10) / 10 : null,
      scheduling_status: deviation === null ? 'no_target'
        : deviation > 5 ? 'over_scheduled'
        : deviation < -5 ? 'under_scheduled'
        : 'on_target',
    };
  });
}

export async function getFairnessScore(locationId: string, startDate: string, endDate: string) {
  const report = await getFairnessReport(locationId, startDate, endDate);

  if (report.length === 0) {
    return { score: 100, details: 'No staff data' };
  }

  // Calculate premium shift fairness
  const premiumCounts = report.map((r: any) => parseInt(r.premium_shifts));
  const totalPremium = premiumCounts.reduce((a: number, b: number) => a + b, 0);
  const avgPremium = totalPremium / premiumCounts.length;

  // Standard deviation of premium shifts
  const premiumVariance = premiumCounts.reduce(
    (sum: number, count: number) => sum + Math.pow(count - avgPremium, 2), 0
  ) / premiumCounts.length;
  const premiumStdDev = Math.sqrt(premiumVariance);

  // Calculate hours fairness (relative to desired hours)
  const withTargets = report.filter((r: any) => r.target_hours !== null);
  const deviations = withTargets.map((r: any) => Math.abs(r.hours_deviation));
  const avgDeviation = deviations.length > 0
    ? deviations.reduce((a: number, b: number) => a + b, 0) / deviations.length
    : 0;

  // Score: 100 = perfectly fair, lower = less fair
  // Penalize for premium shift std dev and hours deviation
  const premiumPenalty = Math.min(50, premiumStdDev * 15);
  const hoursPenalty = Math.min(50, avgDeviation * 2);
  const score = Math.max(0, Math.round(100 - premiumPenalty - hoursPenalty));

  return {
    score,
    totalStaff: report.length,
    totalPremiumShifts: totalPremium,
    avgPremiumPerStaff: Math.round(avgPremium * 10) / 10,
    premiumStdDev: Math.round(premiumStdDev * 10) / 10,
    avgHoursDeviation: Math.round(avgDeviation * 10) / 10,
    staffBreakdown: report.map((r: any) => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      premiumShifts: parseInt(r.premium_shifts),
      premiumDeviation: Math.round((parseInt(r.premium_shifts) - avgPremium) * 10) / 10,
      totalHours: r.total_hours,
      schedulingStatus: r.scheduling_status,
    })),
  };
}

export async function getStaffHistory(userId: string, startDate: string, endDate: string) {
  const result = await query(
    `SELECT s.id, s.start_time, s.end_time,
            l.name as location_name, l.timezone,
            sk.name as skill_name,
            EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600 as hours,
            CASE
              WHEN EXTRACT(DOW FROM s.start_time AT TIME ZONE l.timezone) IN (5, 6)
                AND EXTRACT(HOUR FROM s.start_time AT TIME ZONE l.timezone) >= 17
              THEN true ELSE false
            END as is_premium
     FROM shift_assignments sa
     JOIN shifts s ON sa.shift_id = s.id
     JOIN locations l ON s.location_id = l.id
     LEFT JOIN skills sk ON s.required_skill_id = sk.id
     WHERE sa.user_id = $1 AND sa.status = 'assigned'
     AND s.start_time >= $2::timestamptz AND s.start_time < $3::timestamptz
     ORDER BY s.start_time`,
    [userId, startDate, endDate]
  );

  const shifts = result.rows.map((r: any) => ({
    ...r,
    hours: Math.round(parseFloat(r.hours) * 10) / 10,
  }));

  const totalHours = shifts.reduce((sum: number, s: any) => sum + s.hours, 0);
  const premiumShifts = shifts.filter((s: any) => s.is_premium).length;

  return {
    userId,
    period: { startDate, endDate },
    totalShifts: shifts.length,
    totalHours: Math.round(totalHours * 10) / 10,
    premiumShifts,
    shifts,
  };
}
