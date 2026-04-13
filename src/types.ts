export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number; // Index of the correct option
  explanation?: string;
  type: 'mcq' | 'true_false' | 'short_answer';
}

export interface ExamData {
  title: string;
  questions: Question[];
  language: 'en' | 'bn';
}

export interface EvaluationResult {
  score: number;
  totalQuestions: number;
  answers: {
    questionId: string;
    userAnswer: number | string;
    isCorrect: boolean;
    feedback: string;
  }[];
  plagiarismScore?: number; // 0-100
  plagiarismReport?: string;
}
