import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../db/prisma';

export const learnerRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Get All Courses
  server.get(
    '/courses',
    async (request, reply) => {
      const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return courses;
    }
  );

  // Get Course Details
  server.get(
    '/courses/:course_id',
    {
      schema: {
        params: z.object({ course_id: z.string() })
      }
    },
    async (request, reply) => {
      const courseId = request.params.course_id;

      // Eager load nested relations just like we did with SQLModel
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            include: {
              chapters: true
            }
          },
          assessments: true
        }
      });

      if (!course) {
        return reply.status(404).send({ detail: "Course not found" });
      }

      return course;
    }
  );

  // Enroll in Course
  server.post(
    '/courses/:course_id/enroll',
    {
      schema: {
        params: z.object({ course_id: z.string() }),
        body: z.object({ user_id: z.string() })
      }
    },
    async (request, reply) => {
      const courseId = request.params.course_id;
      const userId = request.body.user_id;

      const existing = await prisma.enrollment.findFirst({
        where: { course_id: courseId, user_id: userId }
      });

      if (existing) {
        return { message: "Already enrolled", enrollment_id: existing.id };
      }

      const newEnrollment = await prisma.enrollment.create({
        data: {
          user_id: userId,
          course_id: courseId,
          progress_percent: 0.0
        }
      });

      return { message: "Enrolled successfully", enrollment_id: newEnrollment.id };
    }
  );
};
