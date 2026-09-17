import { ICommand, IQuery, IHandler } from '../../mediator.interface';
import { coursesRepository, CoursesRepository } from '../../../repositories/courses.repository';
import { NotFoundError } from '../../../shared/errors/custom-errors';

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
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: CreateCourseCommand): Promise<any> {
    return this.repo.createCourse(command.data);
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
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: CreateModuleCommand): Promise<any> {
    const course = await this.repo.findCourseById(command.data.course_id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.createModule(command.data);
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
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: CreateChapterCommand): Promise<any> {
    const moduleData = await this.repo.findModuleById(command.data.moduleId);
    if (!moduleData) {
      throw new NotFoundError('Module not found');
    }
    return this.repo.createChapter(command.data);
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
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: CreateFullCourseCommand): Promise<any> {
    return this.repo.createFullCourse(command.data);
  }
}

export class UpdateFullCourseCommand implements ICommand<any> {
  readonly kind = 'UpdateFullCourseCommand';
  constructor(
    public readonly courseId: string,
    public readonly data: any
  ) {}
}

export class UpdateFullCourseCommandHandler implements IHandler<UpdateFullCourseCommand, any> {
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: UpdateFullCourseCommand): Promise<any> {
    const course = await this.repo.findCourseById(command.courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.updateFullCourse(command.courseId, command.data);
  }
}

export class GetPublishedCoursesQuery implements IQuery<any[]> {
  readonly kind = 'GetPublishedCoursesQuery';
}

export class GetPublishedCoursesQueryHandler implements IHandler<GetPublishedCoursesQuery, any[]> {
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(_query: GetPublishedCoursesQuery): Promise<any[]> {
    return this.repo.findPublishedCourses();
  }
}

export class GetCourseDetailQuery implements IQuery<any> {
  readonly kind = 'GetCourseDetailQuery';
  constructor(public readonly courseId: string) {}
}

export class GetCourseDetailQueryHandler implements IHandler<GetCourseDetailQuery, any> {
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(query: GetCourseDetailQuery): Promise<any> {
    const course = await this.repo.findCourseDetailsById(query.courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return course;
  }
}

export class PublishCourseCommand implements ICommand<any> {
  readonly kind = 'PublishCourseCommand';
  constructor(public readonly courseId: string) {}
}

export class PublishCourseCommandHandler implements IHandler<PublishCourseCommand, any> {
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: PublishCourseCommand): Promise<any> {
    const course = await this.repo.findCourseById(command.courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.updateCourseStatus(command.courseId, 'PUBLISHED');
  }
}

export class DeleteCourseCommand implements ICommand<any> {
  readonly kind = 'DeleteCourseCommand';
  constructor(public readonly courseId: string) {}
}

export class DeleteCourseCommandHandler implements IHandler<DeleteCourseCommand, any> {
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(command: DeleteCourseCommand): Promise<any> {
    const course = await this.repo.findCourseById(command.courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.deleteCourse(command.courseId);
  }
}

export class GetAllCoursesQuery implements IQuery<any[]> {
  readonly kind = 'GetAllCoursesQuery';
}

export class GetAllCoursesQueryHandler implements IHandler<GetAllCoursesQuery, any[]> {
  constructor(private repo: CoursesRepository = coursesRepository) {}
  async handle(_query: GetAllCoursesQuery): Promise<any[]> {
    return this.repo.findAllCourses();
  }
}
