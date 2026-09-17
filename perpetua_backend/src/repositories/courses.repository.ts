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
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assessments: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        enrollments: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!course) return null;

    const questions = course.assessments.flatMap((a) => a.questions) || [];
    const formattedModules = course.modules.map((mod, index) => {
      const q = questions.find((item: any) => item.moduleId === mod.id) || questions[index];
      let quiz = null;
      if (q && q.questionText && q.options && q.options.length > 0) {
        const options = q.options.map((o) => o.optionText);
        const correctIdx = q.options.findIndex((o) => o.isCorrect);
        quiz = {
          id: q.id,
          question: q.questionText,
          options,
          correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
        };
      }
      return {
        ...mod,
        quiz,
      };
    });

    return {
      ...course,
      modules: formattedModules,
    };
  }

  async findPublishedCourses() {
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assessments: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        enrollments: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return courses.map((course) => {
      const questions = course.assessments.flatMap((a) => a.questions) || [];
      const formattedModules = course.modules.map((mod, index) => {
        const q = questions.find((item: any) => item.moduleId === mod.id) || questions[index];
        let quiz = null;
        if (q && q.questionText && q.options && q.options.length > 0) {
          const options = q.options.map((o) => o.optionText);
          const correctIdx = q.options.findIndex((o) => o.isCorrect);
          quiz = {
            id: q.id,
            question: q.questionText,
            options,
            correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
          };
        }
        return {
          ...mod,
          quiz,
        };
      });

      return {
        ...course,
        modules: formattedModules,
      };
    });
  }

  async findAllCourses() {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
        assessments: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        enrollments: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return courses.map((course) => {
      const questions = course.assessments.flatMap((a) => a.questions) || [];
      const formattedModules = course.modules.map((mod, index) => {
        const q = questions.find((item: any) => item.moduleId === mod.id) || questions[index];
        let quiz = null;
        if (q && q.questionText && q.options && q.options.length > 0) {
          const options = q.options.map((o) => o.optionText);
          const correctIdx = q.options.findIndex((o) => o.isCorrect);
          quiz = {
            id: q.id,
            question: q.questionText,
            options,
            correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
          };
        }
        return {
          ...mod,
          quiz,
        };
      });

      return {
        ...course,
        modules: formattedModules,
      };
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
          orderBy: { order: 'asc' },
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

    const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);

    const questionsToCreate = data.modules
      .map((mod, i) => ({ mod, createdMod: sortedModules[i] }))
      .filter(({ mod }) => mod.quiz && mod.quiz.question && mod.quiz.options && mod.quiz.options.length > 0);

    if (questionsToCreate.length > 0) {
      await prisma.$transaction(
        questionsToCreate.map(({ mod, createdMod }) => {
          const quiz = mod.quiz!;
          return prisma.question.create({
            data: {
              questionText: quiz.question,
              assessmentId: assessment.id,
              moduleId: createdMod ? createdMod.id : undefined,
              options: {
                create: quiz.options.map((opt, optIdx) => ({
                  optionText: opt,
                  isCorrect: optIdx === quiz.correctAnswerIndex,
                })),
              },
            },
          });
        })
      );
    }

    return this.findCourseDetailsById(course.id);
  }

  async updateFullCourse(id: string, data: {
    title?: string;
    description?: string;
    cover_image?: string;
    status?: 'DRAFT' | 'PUBLISHED';
    modules?: Array<{
      id?: string;
      title: string;
      subtitle?: string;
      duration?: string;
      content?: string;
      chapters?: Array<{
        id?: string;
        title?: string;
        content?: string;
        duration?: number;
      }>;
      quiz?: {
        id?: string;
        question: string;
        options: string[];
        correctAnswerIndex: number;
      };
    }>;
  }) {
    // 1. Update basic fields on course
    await prisma.course.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.cover_image !== undefined ? { coverImage: data.cover_image } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });

    // 2. If modules provided, replace modules, chapters, and assessment questions
    if (data.modules && Array.isArray(data.modules)) {
      await prisma.$transaction([
        prisma.chapter.deleteMany({ where: { module: { courseId: id } } }),
        prisma.question.deleteMany({ where: { assessment: { courseId: id } } }),
        prisma.assessment.deleteMany({ where: { courseId: id } }),
        prisma.module.deleteMany({ where: { courseId: id } }),
      ]);

      const createdModules: any[] = [];
      for (let index = 0; index < data.modules.length; index++) {
        const mod = data.modules[index];
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

        const createdMod = await prisma.module.create({
          data: {
            title: mod.title,
            subtitle: mod.subtitle || null,
            order: index,
            courseId: id,
            chapters: {
              create: chaptersToCreate,
            },
          },
        });
        createdModules.push({ mod, createdMod });
      }

      // Re-create assessments and quiz questions
      const questionsToCreate = createdModules.filter(({ mod }) => mod.quiz && mod.quiz.question && mod.quiz.options && mod.quiz.options.length > 0);

      if (questionsToCreate.length > 0) {
        const assessment = await prisma.assessment.create({
          data: {
            title: 'Course Quiz',
            courseId: id,
          },
        });

        for (const { mod, createdMod } of questionsToCreate) {
          const quiz = mod.quiz;
          await prisma.question.create({
            data: {
              questionText: quiz.question,
              assessmentId: assessment.id,
              moduleId: createdMod.id,
              options: {
                create: quiz.options.map((opt: string, optIdx: number) => ({
                  optionText: opt,
                  isCorrect: optIdx === quiz.correctAnswerIndex,
                })),
              },
            },
          });
        }
      }
    }

    return this.findCourseDetailsById(id);
  }
}

export const coursesRepository = new CoursesRepository();

