// ─── Course Commands ──────────────────────────────────────────────────────────

export class CreateCourseCommand {
  readonly type = 'CreateCourseCommand' as const;
  constructor(public readonly data: {
    title: string;
    description: string;
    cover_image?: string;
    created_by_id: string;
  }) {}
}

export class CreateModuleCommand {
  readonly type = 'CreateModuleCommand' as const;
  constructor(public readonly data: {
    course_id: string;
    title: string;
    subtitle?: string;
    order: number;
  }) {}
}

export class CreateChapterCommand {
  readonly type = 'CreateChapterCommand' as const;
  constructor(public readonly data: {
    module_id: string;
    title: string;
    content: string;
    duration: number;
    order: number;
  }) {}
}

export class CreateFullCourseCommand {
  readonly type = 'CreateFullCourseCommand' as const;
  constructor(public readonly data: {
    title: string;
    description?: string;
    created_by_id: string;
    modules: Array<{
      title: string;
      duration?: string;
      content: string;
      quiz?: {
        question: string;
        options: string[];
        correctAnswerIndex: number;
      };
    }>;
  }) {}
}

export class PublishCourseCommand {
  readonly type = 'PublishCourseCommand' as const;
  constructor(public readonly courseId: string) {}
}
