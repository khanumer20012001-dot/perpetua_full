import { FastifyReply, FastifyRequest } from 'fastify';
import { mediator } from '../mediator/mediator';
import { coursesService } from '../services/courses.service';
import {
  CreateCourseCommand,
  CreateModuleCommand,
  CreateChapterCommand,
  CreateFullCourseCommand,
  UpdateFullCourseCommand,
  GetPublishedCoursesQuery,
  GetCourseDetailQuery,
  PublishCourseCommand,
  DeleteCourseCommand,
} from '../mediator/commands/courses/course.handlers';

type FastifyReq = FastifyRequest<any>;


export class CoursesController {
  async createCourse(request: FastifyReq, reply: FastifyReply) {
    try {
      const course = await mediator.send(new CreateCourseCommand(request.body as any));
      return reply.send(course);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async createModule(request: FastifyReq, reply: FastifyReply) {
    try {
      const body = (request.body || {}) as Record<string, any>;
      const params = (request.params || {}) as Record<string, any>;
      const moduleData = await mediator.send(
        new CreateModuleCommand({
          ...body,
          course_id: params.course_id,
        } as any)
      );
      return reply.send(moduleData);
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }

  async createChapter(request: FastifyReq, reply: FastifyReply) {
    try {
      const body = (request.body || {}) as Record<string, any>;
      const params = (request.params || {}) as Record<string, any>;
      const chapter = await mediator.send(
        new CreateChapterCommand({
          ...body,
          moduleId: params.module_id,
        } as any)
      );
      return reply.send(chapter);
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }

  async createFullCourse(request: FastifyReq, reply: FastifyReply) {
    try {
      const course = await mediator.send(new CreateFullCourseCommand(request.body as any));
      return reply.send(course);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async updateFullCourse(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as Record<string, any>;
      const course = await mediator.send(new UpdateFullCourseCommand(params.course_id, request.body));
      return reply.send(course);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }


  async publishCourse(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as Record<string, any>;
      const course = await mediator.send(new PublishCourseCommand(params.course_id));
      return reply.send(course);
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }

  async deleteCourse(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as Record<string, any>;
      const result = await mediator.send(new DeleteCourseCommand(params.course_id));
      return reply.send({ message: 'Course deleted successfully', course: result });
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }

  async getPublishedCourses(_request: FastifyReq, reply: FastifyReply) {
    try {
      const courses = await mediator.send(new GetPublishedCoursesQuery());
      return reply.send(courses);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async getAllCourses(_request: FastifyReq, reply: FastifyReply) {
    try {
      const courses = await coursesService.getAllCourses();
      return reply.send(courses);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({ detail: error.message });
    }
  }

  async getCourseDetails(request: FastifyReq, reply: FastifyReply) {
    try {
      const params = (request.params || {}) as Record<string, any>;
      const course = await mediator.send(new GetCourseDetailQuery(params.course_id));
      return reply.send(course);
    } catch (error: any) {
      return reply.status(error.statusCode || 404).send({ detail: error.message });
    }
  }
}

export const coursesController = new CoursesController();

