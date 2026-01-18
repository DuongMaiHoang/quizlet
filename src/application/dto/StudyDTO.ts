import { StudyMode } from '@/domain/entities/StudySession';

/**
 * Study-related DTOs
 */

export interface StudyProgressDTO {
    total: number;
    answered: number;
    correct: number;
    incorrect: number;
    percentComplete: number;
    percentCorrect: number;
}

export interface StudySessionDTO {
    setId: string;
    mode: StudyMode;
    currentIndex: number;
    totalCards: number;
    isComplete: boolean;
    progress: StudyProgressDTO;
    startedAt: string;
    completedAt?: string;
}

export interface TestQuestionDTO {
    cardId: string;
    type: 'MULTIPLE_CHOICE' | 'WRITTEN';
    question: string;
    correctAnswer: string;
    choices?: string[];
    position: number;
}

export interface TestResultDTO {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

export interface TestSummaryDTO {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    score: number;
    results: TestResultDTO[];
}
