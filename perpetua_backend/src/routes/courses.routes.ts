import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { mediator } from '../mediator/mediator';
import {
  CreateCourseCommandHandler,
  CreateModuleCommandHandler,
  CreateChapterCommandHandler,
  CreateFullCourseCommandHandler,
  GetPublishedCoursesQueryHandler,
  GetCourseDetailQueryHandler,
  PublishCourseCommandHandler,
  DeleteCourseCommandHandler,
} from '../mediator/commands/courses/course.handlers';
import { coursesController } from '../controllers/courses.controller';

// Register mediator handlers
mediator.register('CreateCourseCommand', new CreateCourseCommandHandler());
mediator.register('CreateModuleCommand', new CreateModuleCommandHandler());
mediator.register('CreateChapterCommand', new CreateChapterCommandHandler());
mediator.register('CreateFullCourseCommand', new CreateFullCourseCommandHandler());
mediator.register('GetPublishedCoursesQuery', new GetPublishedCoursesQueryHandler());
mediator.register('GetCourseDetailQuery', new GetCourseDetailQueryHandler());
mediator.register('PublishCourseCommand', new PublishCourseCommandHandler());
mediator.register('DeleteCourseCommand', new DeleteCourseCommandHandler());

export const designerCourseRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Create Course
  server.post(
    '/courses',
    {
      schema: {
        body: z.object({
          title: z.string(),
          description: z.string(),
          cover_image: z.string().optional(),
          created_by_id: z.string(),
        }),
      },
    },
    async (request, reply) => {
      return coursesController.createCourse(request, reply);
    }
  );

  // Create Module
  server.post(
    '/courses/:course_id/modules',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
        body: z.object({
          title: z.string(),
          subtitle: z.string().optional(),
          order: z.number().int(),
        }),
      },
    },
    async (request, reply) => {
      return coursesController.createModule(request, reply);
    }
  );

  // Create Chapter
  server.post(
    '/modules/:module_id/chapters',
    {
      schema: {
        params: z.object({ module_id: z.string() }),
        body: z.object({
          title: z.string(),
          content: z.string(),
          duration: z.number().int(),
          order: z.number().int(),
        }),
      },
    },
    async (request, reply) => {
      return coursesController.createChapter(request, reply);
    }
  );

  // Create Full Course (Nested)
  server.post(
    '/courses/full',
    {
      schema: {
        body: z.object({
          title: z.string(),
          description: z.string().optional(),
          created_by_id: z.string(),
          status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
          modules: z.array(
            z.object({
              title: z.string(),
              duration: z.string().optional(),
              content: z.string().optional(),
              chapters: z
                .array(
                  z.object({
                    title: z.string().optional(),
                    content: z.string().optional(),
                    duration: z.number().optional(),
                  })
                )
                .optional(),
              quiz: z
                .object({
                  question: z.string(),
                  options: z.array(z.string()),
                  correctAnswerIndex: z.number(),
                })
                .optional(),
            })
          ),
        }),
      },
    },
    async (request, reply) => {
      return coursesController.createFullCourse(request, reply);
    }
  );

  // Publish Course
  server.post(
    '/courses/:course_id/publish',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
      },
    },
    async (request, reply) => {
      return coursesController.publishCourse(request, reply);
    }
  );

  server.patch(
    '/courses/:course_id/publish',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
      },
    },
    async (request, reply) => {
      return coursesController.publishCourse(request, reply);
    }
  );

  // Delete Course
  server.delete(
    '/courses/:course_id',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
      },
    },
    async (request, reply) => {
      return coursesController.deleteCourse(request, reply);
    }
  );
};

export const learnerCourseRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get All Published Courses
  server.get('/courses', async (request, reply) => {
    return coursesController.getPublishedCourses(request, reply);
  });

  // Get Course Details
  server.get(
    '/courses/:course_id',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
      },
    },
    async (request, reply) => {
      return coursesController.getCourseDetails(request, reply);
    }
  );
};
