import { QuizzesRepository, quizzesRepository } from './quizzes.repository';
import { NotFoundError } from '../../common/errors/custom-errors';

export class QuizzesService {
  constructor(private repo: QuizzesRepository = quizzesRepository) {}

  async getQuiz(assessmentId: string) {
    const assessment = await this.repo.findAssessmentById(assessmentId);
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }
    return assessment;
  }

  async submitQuiz(assessmentId: string, userId: string, answers: Record<string, string>) {
    const selectedOptionIds = Object.values(answers);
    const selectedOptions = await this.repo.findOptionsByIds(selectedOptionIds);

    const score = selectedOptions.filter((opt: any) => opt.isCorrect).length;
    const totalQuestions = Object.keys(answers).length;
    const passed = score >= totalQuestions * 0.7;

    if (passed) {
      const assessment = await this.repo.findAssessmentById(assessmentId);
      if (assessment) {
        const enrollment = await this.repo.findEnrollment(assessment.courseId, userId);
        if (enrollment) {
          await this.repo.updateEnrollmentProgress(enrollment.id, 100.0);
        }
      }
    }

    return {
      score,
      total_questions: totalQuestions,
      passed,
    };
  }
}

export const quizzesService = new QuizzesService();
