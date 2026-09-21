import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding fake stats for courses...");
  
  // 1. Get all published courses
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      modules: {
        include: { chapters: true }
      }
    }
  });

  // 2. Set some durations and enrollments
  for (const course of courses) {
    console.log(`Processing course: ${course.title}`);
    
    // Set duration for each chapter
    for (const mod of course.modules) {
      for (const chapter of mod.chapters) {
        if (!chapter.duration || chapter.duration === 0) {
          await prisma.chapter.update({
            where: { id: chapter.id },
            data: { duration: Math.floor(Math.random() * 20) + 10 } // 10-30 mins
          });
        }
      }
    }
    
    // Add fake enrollments
    const user = await prisma.user.findFirst();
    if (!user) continue;

    // Check if enrollment exists
    const existing = await prisma.enrollment.findFirst({
      where: { courseId: course.id, userId: user.id }
    });

    if (!existing) {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          progressPercent: Math.random() > 0.5 ? 100 : 50, // Either completed or in progress
        }
      });
      console.log(`Added fake enrollment for ${course.title}`);
    }
  }

  console.log("Done seeding stats!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
