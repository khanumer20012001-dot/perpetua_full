import { CoursesRepository, coursesRepository } from '../repositories/courses.repository';
import { NotFoundError } from '../shared/errors/custom-errors';

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
    status?: 'DRAFT' | 'PUBLISHED';
    modules: Array<{
      title: string;
      duration?: string;
      content?: string;
      chapters?: Array<{
        title?: string;
        content?: string;
        duration?: number;
      }>;
      quiz?: {
        question: string;
        options: string[];
        correctAnswerIndex: number;
      };
    }>;
  }) {
    return this.repo.createFullCourse(data);
  }

  async updateFullCourse(id: string, data: any) {
    const course = await this.repo.findCourseById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.updateFullCourse(id, data);
  }


  async publishCourse(courseId: string) {
    const course = await this.repo.findCourseById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.updateCourseStatus(courseId, 'PUBLISHED');
  }

  async deleteCourse(courseId: string) {
    const course = await this.repo.findCourseById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    return this.repo.deleteCourse(courseId);
  }

  async getPublishedCourses() {
    return this.repo.findPublishedCourses();
  }

  async getAllCourses() {
    return this.repo.findAllCourses();
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

