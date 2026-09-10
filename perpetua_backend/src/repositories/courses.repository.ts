import { prisma } from '../db/prisma';

export class CoursesRepository {
  async createCourse(data: {
    title: string;
    description?: string;
    cover_image?: string;
    created_by_id: string;
  }) {
    return prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        coverImage: data.cover_image,
        createdById: data.created_by_id,
        status: 'DRAFT',
      },
    });
  }

  async findCourseById(id: string) {
    return prisma.course.findUnique({
      where: { id },
    });
  }

  async findCourseDetailsById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            chapters: true,
          },
        },
        assessments: true,
      },
    });
  }

  async findPublishedCourses() {
    return prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          include: {
            chapters: true,
          },
        },
      },
    });
  }

  async createModule(data: {
    title: string;
    subtitle?: string;
    order: number;
    course_id: string;
  }) {
    return prisma.module.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        order: data.order,
        courseId: data.course_id,
      },
    });
  }

  async findModuleById(id: string) {
    return prisma.module.findUnique({
      where: { id },
    });
  }

  async createChapter(data: {
    title: string;
    content: string;
    duration: number;
    order: number;
    moduleId: string;
  }) {
    return prisma.chapter.create({
      data: {
        title: data.title,
        content: data.content,
        duration: data.duration,
        order: data.order,
        moduleId: data.moduleId,
      },
    });
  }

  async updateCourseStatus(id: string, status: 'DRAFT' | 'PUBLISHED') {
    return prisma.course.update({
      where: { id },
      data: { status },
    });
  }

  async deleteCourse(id: string) {
    return prisma.course.delete({
      where: { id },
    });
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
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description || '',
        createdById: data.created_by_id,
        status: data.status || 'DRAFT',
        modules: {
          create: data.modules.map((mod, index) => {
            const minsMatch = (mod.duration || '15 mins').match(/(\d+)/);
            const defaultDuration = minsMatch ? parseInt(minsMatch[1], 10) : 15;

            const chaptersToCreate = mod.chapters && Array.isArray(mod.chapters) && mod.chapters.length > 0
              ? mod.chapters.map((chap, cIdx) => ({
                  title: chap.title || 'Content',
                  content: chap.content || '',
                  duration: chap.duration || defaultDuration,
                  order: cIdx,
                }))
              : [
                  {
                    title: 'Content',
                    content: mod.content || '',
                    duration: defaultDuration,
                    order: 0,
                  },
                ];

            return {
              title: mod.title,
              order: index,
              chapters: {
                create: chaptersToCreate,
              },
            };
          }),
        },
      },
      include: {
        modules: {
          include: { chapters: true },
        },
      },
    });

    const assessment = await prisma.assessment.create({
      data: {
        title: 'Course Quiz',
        courseId: course.id,
      },
    });

    for (const mod of data.modules) {
      const quiz = mod.quiz;
      if (quiz) {
        await prisma.question.create({
          data: {
            questionText: quiz.question,
            assessmentId: assessment.id,
            options: {
              create: quiz.options.map((opt, i) => ({
                optionText: opt,
                isCorrect: i === quiz.correctAnswerIndex,
              })),
            },
          },
        });
      }
    }

    return course;
  }
}

export const coursesRepository = new CoursesRepository();
