import { CoursesRepository, coursesRepository } from './courses.repository';
import { NotFoundError } from '../../common/errors/custom-errors';

export class CoursesService {
  constructor(private repo: CoursesRepository = coursesRepository) {}

  async createCourse(data: {
    title: string;
    description?: string;
    cover_image?: string;
    created_by_id: string;
  }) {
    return this.repo.createCourse(data);
  }

  async createModule(data: {
    title: string;
    subtitle?: string;
    order: number;
    course_id: string;
  }) {
    const course = await this.repo.findCourseById(data.course_id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.createModule(data);
  }

  async createChapter(data: {
    title: string;
    content: string;
    duration: number;
    order: number;
    moduleId: string;
  }) {
    const moduleData = await this.repo.findModuleById(data.moduleId);
    if (!moduleData) {
      throw new NotFoundError('Module not found');
    }
    return this.repo.createChapter(data);
  }

  async createFullCourse(data: {
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
  }) {
    return this.repo.createFullCourse(data);
  }

  async getPublishedCourses() {
    return this.repo.findPublishedCourses();
  }

  async getCourseDetails(courseId: string) {
    const course = await this.repo.findCourseDetailsById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return course;
  }
}

export const coursesService = new CoursesService();
