// ─── Auth Commands ────────────────────────────────────────────────────────────

export class SendOtpCommand {
  readonly type = 'SendOtpCommand' as const;
  constructor(public readonly email: string) {}
}

export class VerifyOtpCommand {
  readonly type = 'VerifyOtpCommand' as const;
  constructor(
    public readonly email: string,
    public readonly code: string
  ) {}
}
