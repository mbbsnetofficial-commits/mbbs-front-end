import { GamsatResultQuestion, GamsatTestResult } from '../models/gamsat.model';

/**
 * Authoritative normalizer for GAMSAT test result responses.
 * Unpacks backend envelope structures and normalizes KPI scores, metrics,
 * and per-question reviews into a uniform GamsatTestResult shape.
 */
export function normalizeGamsatResult(
  raw: any,
  fallbackSessionId?: string
): GamsatTestResult | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  // Unpack common envelope layers
  const payload = raw.data ?? raw.result ?? raw;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const effectiveSessionId =
    payload.sessionId ||
    payload.session_id ||
    raw.sessionId ||
    raw.session_id ||
    fallbackSessionId ||
    '';

  // Extract raw questions or review list
  const rawQuestionsList: any[] = Array.isArray(payload.review)
    ? payload.review
    : Array.isArray(payload.questions)
    ? payload.questions
    : Array.isArray(payload.answers)
    ? payload.answers
    : Array.isArray(raw.review)
    ? raw.review
    : Array.isArray(raw.questions)
    ? raw.questions
    : [];

  // Normalize each question review item
  const normalizedReview: GamsatResultQuestion[] = rawQuestionsList.map((q: any, idx: number) => {
    const questionId = q.question_id ?? q.questionId ?? q.id ?? idx + 1;
    const selectedOption =
      q.selected_option ?? q.selectedOption ?? q.selected ?? q.answer ?? q.user_answer ?? null;
    const correctAnswer =
      q.correct_answer ?? q.correctAnswer ?? q.correctOption ?? q.correct ?? q.answer_key ?? null;

    const isSkipped =
      q.is_skipped !== undefined
        ? Boolean(q.is_skipped)
        : q.isSkipped !== undefined
        ? Boolean(q.isSkipped)
        : selectedOption === null || selectedOption === undefined || selectedOption === '';

    const isCorrect =
      q.is_correct !== undefined
        ? Boolean(q.is_correct)
        : q.isCorrect !== undefined
        ? Boolean(q.isCorrect)
        : !isSkipped &&
          selectedOption !== null &&
          correctAnswer !== null &&
          String(selectedOption).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase();

    return {
      question_id: questionId,
      questionId,
      id: questionId,
      question: q.question ?? q.question_text ?? q.stimulus_text ?? q.passage ?? '',
      option_a: q.option_a ?? q.optionA ?? (Array.isArray(q.options) ? q.options[0] : ''),
      option_b: q.option_b ?? q.optionB ?? (Array.isArray(q.options) ? q.options[1] : ''),
      option_c: q.option_c ?? q.optionC ?? (Array.isArray(q.options) ? q.options[2] : ''),
      option_d: q.option_d ?? q.optionD ?? (Array.isArray(q.options) ? q.options[3] : ''),
      selected_option: selectedOption,
      selected: selectedOption,
      correct_answer: correctAnswer,
      correct: correctAnswer,
      isCorrect,
      is_correct: isCorrect,
      is_skipped: isSkipped,
      isSkipped,
      explanation: q.explanation ?? q.solution ?? '',
      stimulus_text: q.stimulus_text ?? q.passage ?? q.stimulus ?? '',
      timeSpent: typeof (q.timeSpent ?? q.time_spent) === 'number' ? (q.timeSpent ?? q.time_spent) : 0,
      section: q.section ?? q.section_code ?? q.sectionCode
    };
  });

  const totalQuestions =
    typeof (payload.totalQuestions ?? payload.total_questions) === 'number'
      ? (payload.totalQuestions ?? payload.total_questions)
      : typeof (raw.totalQuestions ?? raw.total_questions) === 'number'
      ? (raw.totalQuestions ?? raw.total_questions)
      : normalizedReview.length;

  const correctCount =
    typeof (payload.correct ?? payload.correct_count ?? payload.correctAnswers) === 'number'
      ? (payload.correct ?? payload.correct_count ?? payload.correctAnswers)
      : normalizedReview.filter((r) => r.isCorrect).length;

  const wrongCount =
    typeof (payload.wrong ?? payload.incorrect ?? payload.wrong_count ?? payload.incorrectAnswers) === 'number'
      ? (payload.wrong ?? payload.incorrect ?? payload.wrong_count ?? payload.incorrectAnswers)
      : normalizedReview.filter((r) => !r.isCorrect && !r.is_skipped).length;

  const skippedCount =
    typeof (payload.skipped ?? payload.unanswered ?? payload.skipped_count) === 'number'
      ? (payload.skipped ?? payload.unanswered ?? payload.skipped_count)
      : normalizedReview.filter((r) => r.is_skipped).length;

  let accuracyVal = payload.accuracy ?? payload.percentage ?? raw.accuracy ?? raw.percentage;
  if (typeof accuracyVal === 'string') {
    accuracyVal = parseFloat(accuracyVal.replace('%', ''));
  }
  if (typeof accuracyVal !== 'number' || isNaN(accuracyVal)) {
    accuracyVal = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  }

  const rawScore =
    typeof payload.rawScore === 'number'
      ? payload.rawScore
      : correctCount;

  const maximumRawScore =
    typeof payload.maximumRawScore === 'number'
      ? payload.maximumRawScore
      : totalQuestions;

  const scoreDisplay =
    payload.score !== undefined && payload.score !== null
      ? String(payload.score)
      : `${rawScore} / ${maximumRawScore}`;

  return {
    sessionId: effectiveSessionId,
    testId: payload.testId ?? payload.test_id ?? payload.paperId ?? payload.paper_id,
    testName: payload.testName ?? payload.test_name ?? payload.title ?? payload.name,
    testType: payload.testType ?? payload.test_type,
    status: payload.status ?? 'COMPLETED',
    score: scoreDisplay,
    rawScore,
    maximumRawScore,
    correct: correctCount,
    wrong: wrongCount,
    incorrect: wrongCount,
    skipped: skippedCount,
    accuracy: accuracyVal,
    percentage: accuracyVal,
    totalQuestions,
    total_questions: totalQuestions,
    duration: payload.duration ?? payload.duration_minutes ?? payload.durationMinutes,
    timeSpent: payload.timeSpent ?? payload.time_spent ?? payload.total_time_spent,
    started_at: payload.started_at ?? payload.startedAt,
    submitted_at: payload.submitted_at ?? payload.submittedAt,
    sections: payload.sections,
    review: normalizedReview,
    questions: normalizedReview
  };
}
