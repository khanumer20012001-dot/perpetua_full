// ─── Enrollment Queries ───────────────────────────────────────────────────────

export class GetUserEnrollmentsQuery {
  readonly type = 'GetUserEnrollmentsQuery' as const;
  constructor(public readonly userId: string) {}
}

export class GetDashboardStatsQuery {
  readonly type = 'GetDashboardStatsQuery' as const;
  constructor(public readonly userId: string) {}
}
