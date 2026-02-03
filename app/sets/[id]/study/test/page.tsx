'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SetDTO } from '@/application/dto/SetDTO';
import { TestQuestionDTO } from '@/application/dto/StudyDTO';
import { container } from '@/lib/di';
import { LoadingState } from '@/ui/components/common/LoadingState';
import { ErrorState } from '@/ui/components/common/ErrorState';
import { ChevronLeft, Check, X } from 'lucide-react';
import { SmartText } from '@/ui/components/common/SmartText';
import { PinyinInput } from '@/ui/components/sets/PinyinInput';

interface Answer {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
}

/**
 * Test Study Mode Page
 * 
 * Take a practice test with mixed question types
 */
export default function TestPage() {
    const params = useParams();
    const setId = params.id as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [questions, setQuestions] = useState<TestQuestionDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [userAnswer, setUserAnswer] = useState('');
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        loadSetAndGenerateTest();
    }, [setId]);

    const loadSetAndGenerateTest = async () => {
        try {
            setLoading(true);
            setError(null);

            const getSet = container.getSet;
            const setResult = await getSet.execute(setId);

            if (!setResult) {
                setError('Set not found');
                return;
            }

            if (setResult.cards.length < 3) {
                setError('You need at least 3 cards to take a test');
                return;
            }

            setSet(setResult);

            // Generate test
            const generateTest = container.generateTest;
            const testQuestions = await generateTest.execute(setId);
            setQuestions(testQuestions);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load test');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        const currentQuestion = questions[currentIndex];
        const answer = currentQuestion.type === 'MULTIPLE_CHOICE' ? selectedChoice : userAnswer;

        if (!answer) {
            return;
        }

        // Validate answer
        const submitAnswer = container.submitAnswer;
        const result = submitAnswer.execute(answer, currentQuestion.correctAnswer);

        // Store answer
        setAnswers([
            ...answers,
            {
                questionId: currentQuestion.cardId,
                userAnswer: answer,
                isCorrect: result.isCorrect,
            },
        ]);

        // Move to next or finish
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setSelectedChoice(null);
        } else {
            setIsComplete(true);
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error || !set) {
        return (
            <ErrorState
                message={error || 'Set not found'}
                action={
                    <Link
                        href={`/sets/${setId}`}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                    >
                        Back to Set
                    </Link>
                }
            />
        );
    }

    if (isComplete) {
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const totalQuestions = answers.length;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        return (
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-foreground">Test Complete!</h1>
                    <p className="mt-2 text-lg text-muted">Here's how you did</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <div className="mb-6">
                        <div className="text-6xl font-bold text-primary">{score}%</div>
                        <div className="mt-2 text-muted">Your Score</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-card-hover p-4">
                            <div className="text-2xl font-bold text-foreground">{totalQuestions}</div>
                            <div className="text-sm text-muted">Total</div>
                        </div>
                        <div className="rounded-lg bg-success/10 p-4">
                            <div className="text-2xl font-bold text-success">{correctCount}</div>
                            <div className="text-sm text-muted">Correct</div>
                        </div>
                        <div className="rounded-lg bg-error/10 p-4">
                            <div className="text-2xl font-bold text-error">
                                {totalQuestions - correctCount}
                            </div>
                            <div className="text-sm text-muted">Incorrect</div>
                        </div>
                    </div>
                </div>

                {/* Review Answers */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Review Your Answers</h2>
                    {questions.map((question, index) => {
                        const answer = answers[index];
                        return (
                            <div
                                key={question.cardId}
                                className={`rounded-xl border p-6 ${answer.isCorrect
                                    ? 'border-success bg-success/5'
                                    : 'border-error bg-error/5'
                                    }`}
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted">
                                        Question {index + 1} • {question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Written'}
                                    </span>
                                    {answer.isCorrect ? (
                                        <Check className="h-5 w-5 text-success" />
                                    ) : (
                                        <X className="h-5 w-5 text-error" />
                                    )}
                                </div>
                                <div className="mb-2 font-semibold text-foreground">
                                    <SmartText text={question.question} />
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <span className="text-muted">Your answer: </span>
                                        <span className={answer.isCorrect ? 'text-success' : 'text-error'}>
                                            <SmartText text={answer.userAnswer} />
                                        </span>
                                    </div>
                                    {!answer.isCorrect && (
                                        <div>
                                            <span className="text-muted">Correct answer: </span>
                                            <span className="text-success">
                                                <SmartText text={question.correctAnswer} />
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center space-x-4">
                    <Link
                        href={`/sets/${setId}`}
                        className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                    >
                        Back to Set
                    </Link>
                    <button
                        onClick={() => {
                            setCurrentIndex(0);
                            setAnswers([]);
                            setUserAnswer('');
                            setSelectedChoice(null);
                            setIsComplete(false);
                            loadSetAndGenerateTest();
                        }}
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                    >
                        Retake Test
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
    const canSubmit =
        currentQuestion.type === 'MULTIPLE_CHOICE' ? selectedChoice !== null : userAnswer.trim() !== '';

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            {/* Header */}
            <div>
                <Link
                    href={`/sets/${setId}`}
                    className="mb-2 inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to set
                </Link>
                <h1 className="text-3xl font-bold text-foreground">
                    <SmartText text={set.title} />
                </h1>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-muted">{progress}% complete</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-card">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="rounded-2xl border border-border bg-card p-8">
                <div className="mb-2 text-sm font-medium uppercase text-muted">
                    {currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Written Answer'}
                </div>
                <div className="mb-8 text-2xl font-bold text-foreground">
                    <SmartText text={currentQuestion.question} />
                </div>

                {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
                    <div className="space-y-3">
                        {currentQuestion.choices?.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedChoice(choice)}
                                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${selectedChoice === choice
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${selectedChoice === choice
                                            ? 'border-primary bg-primary'
                                            : 'border-border'
                                            }`}
                                    >
                                        {selectedChoice === choice && (
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className="text-foreground">
                                        <SmartText text={choice} />
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="answer" className="block text-sm font-medium text-foreground">
                            Your answer
                        </label>
                            <span className="text-xs text-muted-foreground">
                                Alt+P để bật/tắt Pinyin
                            </span>
                        </div>
                        <PinyinInput
                            id="answer"
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                            onShowToast={(msg) => {
                                // Show toast notification (could add toast state if needed)
                                console.log('Pinyin toast:', msg);
                            }}
                        />
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!canSubmit}
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Test'}
                    </button>
                </div>
            </div>
        </div>
    );
}
