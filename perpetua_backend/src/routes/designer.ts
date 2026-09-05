import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../db/prisma';

export const designerRoutes: FastifyPluginAsync = async (app) => {
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
        })
      }
    },
    async (request, reply) => {
      const course = await prisma.course.create({
        data: {
          title: request.body.title,
          description: request.body.description,
          cover_image: request.body.cover_image,
          created_by_id: request.body.created_by_id,
          status: 'DRAFT'
        }
      });
      return course;
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
          order: z.number().int()
        })
      }
    },
    async (request, reply) => {
      const courseId = request.params.course_id;
      
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return reply.status(404).send({ detail: "Course not found" });
      }

      const module = await prisma.module.create({
        data: {
          title: request.body.title,
          subtitle: request.body.subtitle,
          order: request.body.order,
          course_id: courseId
        }
      });
      return module;
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
          order: z.number().int()
        })
      }
    },
    async (request, reply) => {
      const moduleId = request.params.module_id;

      const moduleData = await prisma.module.findUnique({ where: { id: moduleId } });
      if (!moduleData) {
        return reply.status(404).send({ detail: "Module not found" });
      }

      const chapter = await prisma.chapter.create({
        data: {
          title: request.body.title,
          content: request.body.content,
          duration: request.body.duration,
          order: request.body.order,
          moduleId: moduleId
        }
      });
      return chapter;
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
          modules: z.array(z.object({
            title: z.string(),
            duration: z.string().optional(),
            content: z.string(),
            quiz: z.object({
              question: z.string(),
              options: z.array(z.string()),
              correctAnswerIndex: z.number()
            }).optional()
          }))
        })
      }
    },
    async (request, reply) => {
      const { title, description, created_by_id, modules } = request.body;

      const course = await prisma.course.create({
        data: {
          title,
          description: description || "",
          createdById: created_by_id,
          status: 'DRAFT',
          modules: {
            create: modules.map((mod, index) => {
              // Parse duration (e.g. "15 mins" -> 15)
              const minsMatch = (mod.duration || "15 mins").match(/(\d+)/);
              const duration = minsMatch ? parseInt(minsMatch[1], 10) : 15;

              return {
                title: mod.title,
                order: index,
                chapters: {
                  create: [
                    {
                      title: "Content",
                      content: mod.content,
                      duration: duration,
                      order: 0
                    }
                  ]
                }
              };
            })
          }
        },
        include: {
          modules: {
            include: { chapters: true }
          }
        }
      });

      // Now create quizzes (assessments) if they exist
      const assessment = await prisma.assessment.create({
        data: {
          title: "Course Quiz",
          courseId: course.id,
        }
      });

      for (const mod of modules) {
        if (mod.quiz) {
          const question = await prisma.question.create({
            data: {
               questionText: mod.quiz.question,
               assessmentId: assessment.id,
               options: {
                 create: mod.quiz.options.map((opt, i) => ({
                   optionText: opt,
                   isCorrect: i === mod.quiz.correctAnswerIndex
                 }))
               }
            }
          });
        }
      }

      return course;
    }
  );
};
