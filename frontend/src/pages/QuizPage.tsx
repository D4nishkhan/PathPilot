import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle, CheckCircle, XCircle, ArrowLeft,
  Clock, Loader2, ChevronRight, Trophy, RotateCcw, Zap
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { quizAPI } from '../lib/api';
import type { Quiz, QuizQuestion, QuizAttempt } from '../types/index';
import toast from 'react-hot-toast';

type Phase = 'loading' | 'intro' | 'quiz' | 'result';

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number[]>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [prevAttempts, setPrevAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      quizAPI.getQuiz(id),
      quizAPI.getAttempts(id),
    ]).then(([quizRes, attemptsRes]) => {
      setQuiz(quizRes.data.quiz);
      setPrevAttempts(attemptsRes.data.attempts);
      if (quizRes.data.quiz.timeLimit) {
        setTimeLeft(quizRes.data.quiz.timeLimit);
      }
      setPhase('intro');
    }).catch(() => {
      toast.error('Failed to load quiz');
    });
  }, [id]);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz' || !timeLeft) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleOptionSelect = (questionId: string, optionIndex: number, isMulti: boolean) => {
    setSelectedOptions(prev => {
      const current = prev[questionId] || [];
      if (isMulti) {
        if (current.includes(optionIndex)) {
          return { ...prev, [questionId]: current.filter(i => i !== optionIndex) };
        }
        return { ...prev, [questionId]: [...current, optionIndex] };
      }
      return { ...prev, [questionId]: [optionIndex] };
    });
  };

  const handleSubmit = async () => {
    if (!quiz || !id) return;
    setSubmitting(true);
    try {
      const answers = quiz.questions.map(q => ({
        questionId: q._id,
        selectedOptions: selectedOptions[q._id] || [],
      }));
      const res = await quizAPI.submitQuiz(id, answers);
      setAttempt(res.data.attempt);
      setPhase('result');
      if (res.data.passed) {
        toast.success(`Passed! Score: ${res.data.score}% 🎉`);
      } else {
        toast.error(`Score: ${res.data.score}%. Need ${quiz.passingScore}% to pass.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setSelectedOptions({});
    setCurrentQuestion(0);
    setAttempt(null);
    setPhase('quiz');
    if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit);
  };

  if (phase === 'loading') return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-indigo-400 animate-spin" />
      </div>
    </AppLayout>
  );

  if (!quiz) return (
    <AppLayout>
      <div className="text-center py-16">
        <p className="text-red-400">Quiz not found</p>
      </div>
    </AppLayout>
  );

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(selectedOptions).filter(k => (selectedOptions[k]?.length || 0) > 0).length;

  // ─── INTRO PHASE ──────────────────────────────────────────────
  if (phase === 'intro') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 inline-flex">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
            <HelpCircle size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">{quiz.title}</h1>
          <p className="text-slate-500 mb-6">Test your knowledge and unlock the next topic</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Questions', value: quiz.questions.length },
              { label: 'Pass Score', value: `${quiz.passingScore}%` },
              { label: 'XP Reward', value: `+${quiz.xpReward}` },
            ].map((info) => (
              <div key={info.label} className="bg-white/3 rounded-xl p-3">
                <div className="text-xl font-bold gradient-text">{info.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{info.label}</div>
              </div>
            ))}
          </div>

          {prevAttempts.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-slate-500 mb-2">Previous Attempts</p>
              <div className="space-y-1.5">
                {prevAttempts.slice(0, 3).map((a) => (
                  <div key={a._id} className="flex items-center justify-between px-4 py-2 bg-white/3 rounded-lg">
                    <span className="text-xs text-slate-500">Attempt #{a.attemptNumber}</span>
                    <span className={`badge text-xs ${a.passed ? 'badge-success' : 'badge-error'}`}>{a.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setPhase('quiz')} className="btn-primary px-8 py-3 text-base">
            Start Quiz <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </AppLayout>
  );

  // ─── QUIZ PHASE ───────────────────────────────────────────────
  if (phase === 'quiz') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <div className="flex items-center gap-3">
              {timeLeft !== null && (
                <span className={`flex items-center gap-1 ${timeLeft < 60 ? 'text-red-400' : 'text-slate-500'}`}>
                  <Clock size={14} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              )}
              <span>{answeredCount}/{quiz.questions.length} answered</span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question card */}
        <div className="glass-card p-6 mb-4 animate-fade-in-up">
          <div className="flex items-start gap-3 mb-5">
            <span className="badge badge-primary text-xs flex-shrink-0">{question.type}</span>
            {question.type === 'multiSelect' && (
              <span className="text-xs text-slate-500">(Select all that apply)</span>
            )}
          </div>

          <h2 className="text-base font-semibold text-slate-100 mb-2 leading-relaxed">{question.question}</h2>

          {question.code && (
            <pre className="p-4 rounded-xl text-sm overflow-x-auto mb-4 text-slate-300">
              <code>{question.code}</code>
            </pre>
          )}

          {/* Options */}
          <div className="space-y-2 mt-4">
            {question.options.map((option, idx) => {
              const isSelected = (selectedOptions[question._id] || []).includes(idx);
              return (
                <button
                  key={option._id}
                  onClick={() => handleOptionSelect(question._id, idx, question.type === 'multiSelect')}
                  className={`quiz-option w-full text-left ${isSelected ? 'selected' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary disabled:opacity-40"
          >
            Previous
          </button>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="btn-primary"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary px-6"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : `Submit (${answeredCount}/${quiz.questions.length})`}
            </button>
          )}
        </div>

        {/* Question navigator */}
        <div className="mt-4 glass-card p-3">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, i) => {
              const answered = (selectedOptions[quiz.questions[i]._id]?.length || 0) > 0;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    i === currentQuestion ? 'bg-indigo-500 text-white' :
                    answered ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    'bg-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );

  // ─── RESULT PHASE ─────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center mb-5">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
            attempt?.passed ? 'bg-green-500/15' : 'bg-red-500/15'
          }`}>
            {attempt?.passed
              ? <Trophy size={36} className="text-green-400" />
              : <XCircle size={36} className="text-red-400" />
            }
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {attempt?.passed ? 'Congratulations! 🎉' : 'Not quite there yet'}
          </h2>
          <p className="text-slate-500 mb-6">
            {attempt?.passed ? 'You passed! This topic is now unlocked.' : `You need ${quiz.passingScore}% to pass. Keep practicing!`}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/3 rounded-xl p-4">
              <div className={`text-3xl font-bold ${attempt?.passed ? 'text-green-400' : 'text-red-400'}`}>
                {attempt?.score}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Your Score</div>
            </div>
            <div className="bg-white/3 rounded-xl p-4">
              <div className="text-3xl font-bold text-slate-300">{quiz.passingScore}%</div>
              <div className="text-xs text-slate-500 mt-1">Pass Score</div>
            </div>
            <div className="bg-white/3 rounded-xl p-4">
              <div className="text-3xl font-bold gradient-text-gold">+{attempt?.passed ? quiz.xpReward : 0}</div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1"><Zap size={10} />XP Earned</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={restartQuiz} className="btn-secondary">
              <RotateCcw size={16} /> Retry
            </button>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Continue Learning <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Answer review */}
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold text-slate-200 mb-4">Answer Review</h3>
          <div className="space-y-4">
            {quiz.questions.map((q, i) => {
              const answerData = attempt?.answers.find(a => a.questionId === q._id);
              const isCorrect = answerData?.isCorrect;

              return (
                <div key={q._id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-sm font-medium text-slate-200">{q.question}</p>
                  </div>
                  <div className="pl-6 space-y-1">
                    {q.options.map((opt, idx) => {
                      const wasSelected = answerData?.selectedOptions.includes(idx);
                      const isRight = answerData?.correctOptions.includes(idx);
                      return (
                        <div key={opt._id} className={`quiz-option py-1.5 px-3 rounded-lg text-xs ${
                          wasSelected && isRight ? 'correct' :
                          wasSelected && !isRight ? 'wrong' :
                          isRight ? 'border border-green-500/30 bg-green-500/5 text-green-400' : ''
                        }`}>
                          {opt.text}
                        </div>
                      );
                    })}
                  </div>
                  {answerData?.explanation && (
                    <p className="text-xs text-slate-500 mt-2 pl-6 italic">💡 {answerData.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
