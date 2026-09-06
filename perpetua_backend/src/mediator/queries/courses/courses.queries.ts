// ─── Course Queries ───────────────────────────────────────────────────────────

export class GetPublishedCoursesQuery {
  readonly type = 'GetPublishedCoursesQuery' as const;
}

export class GetCourseDetailQuery {
  readonly type = 'GetCourseDetailQuery' as const;
  constructor(public readonly courseId: string) {}
}

export class GetDesignerCoursesQuery {
  readonly type = 'GetDesignerCoursesQuery' as const;
  constructor(public readonly designerId: string) {}
}
