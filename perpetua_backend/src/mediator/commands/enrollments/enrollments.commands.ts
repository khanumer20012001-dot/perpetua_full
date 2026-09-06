// ─── Enrollment Commands ──────────────────────────────────────────────────────

export class EnrollCourseCommand {
  readonly type = 'EnrollCourseCommand' as const;
  constructor(
    public readonly courseId: string,
    public readonly userId: string
  ) {}
}

export class UpdateProgressCommand {
  readonly type = 'UpdateProgressCommand' as const;
  constructor(
    public readonly enrollmentId: string,
    public readonly completedChapters: number,
    public readonly totalChapters: number
  ) {}
}
