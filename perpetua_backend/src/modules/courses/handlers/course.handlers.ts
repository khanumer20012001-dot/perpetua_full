import { ICommand, IQuery, IHandler } from '../../../mediator/mediator.interface';
import { coursesService, CoursesService } from '../courses.service';

export class CreateCourseCommand implements ICommand<any> {
  readonly kind = 'CreateCourseCommand';
  constructor(
    public readonly data: {
      title: string;
      description?: string;
      cover_image?: string;
      created_by_id: string;
    }
  ) {}
}

export class CreateCourseCommandHandler implements IHandler<CreateCourseCommand, any> {
  constructor(private service: CoursesService = coursesService) {}
  async handle(command: CreateCourseCommand): Promise<any> {
    return this.service.createCourse(command.data);
  }
}

export class CreateModuleCommand implements ICommand<any> {
  readonly kind = 'CreateModuleCommand';
  constructor(
    public readonly data: {
      title: string;
      subtitle?: string;
      order: number;
      course_id: string;
    }
  ) {}
}

export class CreateModuleCommandHandler implements IHandler<CreateModuleCommand, any> {
  constructor(private service: CoursesService = coursesService) {}
  async handle(command: CreateModuleCommand): Promise<any> {
    return this.service.createModule(command.data);
  }
}

export class CreateChapterCommand implements ICommand<any> {
  readonly kind = 'CreateChapterCommand';
  constructor(
    public readonly data: {
      title: string;
      content: string;
      duration: number;
      order: number;
      moduleId: string;
    }
  ) {}
}

export class CreateChapterCommandHandler implements IHandler<CreateChapterCommand, any> {
  constructor(private service: CoursesService = coursesService) {}
  async handle(command: CreateChapterCommand): Promise<any> {
    return this.service.createChapter(command.data);
  }
}

export class CreateFullCourseCommand implements ICommand<any> {
  readonly kind = 'CreateFullCourseCommand';
  constructor(
    public readonly data: {
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
    }
  ) {}
}

export class CreateFullCourseCommandHandler implements IHandler<CreateFullCourseCommand, any> {
  constructor(private service: CoursesService = coursesService) {}
  async handle(command: CreateFullCourseCommand): Promise<any> {
    return this.service.createFullCourse(command.data);
  }
}

export class GetPublishedCoursesQuery implements IQuery<any[]> {
  readonly kind = 'GetPublishedCoursesQuery';
}

export class GetPublishedCoursesQueryHandler implements IHandler<GetPublishedCoursesQuery, any[]> {
  constructor(private service: CoursesService = coursesService) {}
  async handle(_query: GetPublishedCoursesQuery): Promise<any[]> {
    return this.service.getPublishedCourses();
  }
}

export class GetCourseDetailQuery implements IQuery<any> {
  readonly kind = 'GetCourseDetailQuery';
  constructor(public readonly courseId: string) {}
}

export class GetCourseDetailQueryHandler implements IHandler<GetCourseDetailQuery, any> {
  constructor(private service: CoursesService = coursesService) {}
  async handle(query: GetCourseDetailQuery): Promise<any> {
    return this.service.getCourseDetails(query.courseId);
  }
}
