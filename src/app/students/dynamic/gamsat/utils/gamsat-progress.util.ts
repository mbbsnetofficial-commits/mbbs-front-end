/**
 * GAMSAT Progress Calculation & Question Normalization Utility
 *
 * Guarantees exact, unique-question-based progress calculation:
 * progress = Math.max(0, Math.min(100, Math.round((answeredCount / totalQuestions) * 100)))
 *
 * Rules:
 * 1. Only valid, non-null, non-empty selected answers count as answered.
 * 2. Duplicate question entries (e.g. from autosave history) are deduplicated by question ID.
 * 3. Answer changes on the same question never increment the count.
 * 4. Navigating between questions never changes the count.
 * 5. Not-started / 0 answered = 0% (never 50%).
 * 6. Completed / submitted = 100%.
 */

/**
 * Normalizes question ID from any supported shape
 */
export function normalizeQuestionId(q: any): string | number {
  if (q === undefined || q === null) return '';
  if (typeof q === 'object') {
    const id = q.questionId ?? q.question_id ?? q.id ?? q._id;
    return id !== undefined && id !== null ? String(id).trim() : '';
  }
  return String(q).trim();
}

/**
 * Counts unique answered questions from question states or answer objects.
 */
export function countUniqueAnsweredQuestions(answersOrStates: Array<any> | undefined | null): number {
  if (!Array.isArray(answersOrStates) || answersOrStates.length === 0) {
    return 0;
  }

  const answeredQuestionIds = new Set<string | number>();

  for (let i = 0; i < answersOrStates.length; i++) {
    const item = answersOrStates[i];
    if (!item) continue;

    const opt = item.selectedOption ?? item.selected_option ?? item.selected ?? item.answer;
    // Must have a valid, non-null, non-empty answer
    if (opt !== null && opt !== undefined && opt !== '') {
      const rawId = item.questionId ?? item.question_id ?? item.id ?? item._id ?? (i + 1);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        answeredQuestionIds.add(String(rawId).trim());
      }
    }
  }

  return answeredQuestionIds.size;
}

/**
 * Calculates clamped integer progress percentage (0 - 100).
 */
export function calculateGamsatProgress(
  answeredCount: number,
  totalQuestions: number,
  isCompleted: boolean = false
): number {
  if (isCompleted) {
    return 100;
  }
  if (!totalQuestions || totalQuestions <= 0 || !answeredCount || answeredCount <= 0) {
    return 0;
  }

  const rawPercent = (answeredCount / totalQuestions) * 100;
  const rounded = Math.round(rawPercent);
  return Math.max(0, Math.min(100, isNaN(rounded) ? 0 : rounded));
}
