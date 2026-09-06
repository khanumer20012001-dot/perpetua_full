// ─── User Queries ─────────────────────────────────────────────────────────────

export class GetAllUsersQuery {
  readonly type = 'GetAllUsersQuery' as const;
}

export class GetUserByIdQuery {
  readonly type = 'GetUserByIdQuery' as const;
  constructor(public readonly userId: string) {}
}
