import { normalizeGamsatResult } from './gamsat-result.util';

describe('normalizeGamsatResult', () => {
  it('should normalize standard nested API response with data property', () => {
    const raw = {
      success: true,
      data: {
        sessionId: 'GAMSAT-PYQ-12345',
        testId: '44dba1ca30e7a59f101b1ab1',
        testName: 'GAMSAT 2019 STYLE',
        score: '100 / 137',
        rawScore: 100,
        maximumRawScore: 137,
        accuracy: 73,
        correct: 100,
        wrong: 30,
        skipped: 7,
        totalQuestions: 137,
        review: [
          {
            question_id: 1,
            question: 'Sample question text?',
            option_a: 'Opt A',
            option_b: 'Opt B',
            option_c: 'Opt C',
            option_d: 'Opt D',
            selected_option: 'A',
            correct_answer: 'A',
            isCorrect: true,
            explanation: 'Explanation here'
          }
        ]
      }
    };

    const result = normalizeGamsatResult(raw);
    expect(result).not.toBeNull();
    expect(result?.sessionId).toBe('GAMSAT-PYQ-12345');
    expect(result?.score).toBe('100 / 137');
    expect(result?.accuracy).toBe(73);
    expect(result?.correct).toBe(100);
    expect(result?.wrong).toBe(30);
    expect(result?.skipped).toBe(7);
    expect(result?.review.length).toBe(1);
    expect(result?.review[0].isCorrect).toBe(true);
    expect(result?.review[0].explanation).toBe('Explanation here');
  });

  it('should normalize direct flat result payload and preserve fallbackSessionId', () => {
    const raw = {
      score: 2,
      correct: 2,
      wrong: 0,
      skipped: 0,
      total_questions: 2,
      review: [
        {
          questionId: 101,
          question: 'Q1',
          selected: 'B',
          correct: 'B'
        },
        {
          questionId: 102,
          question: 'Q2',
          selected: 'C',
          correct: 'C'
        }
      ]
    };

    const result = normalizeGamsatResult(raw, 'FALLBACK-SESS-999');
    expect(result).not.toBeNull();
    expect(result?.sessionId).toBe('FALLBACK-SESS-999');
    expect(result?.correct).toBe(2);
    expect(result?.accuracy).toBe(100);
    expect(result?.review.length).toBe(2);
    expect(result?.review[0].selected_option).toBe('B');
    expect(result?.review[0].correct_answer).toBe('B');
  });

  it('should auto-compute correct, wrong, skipped, and accuracy if not provided by backend', () => {
    const raw = {
      questions: [
        { id: 1, selected_option: 'A', correct_answer: 'A' }, // correct
        { id: 2, selected_option: 'B', correct_answer: 'C' }, // wrong
        { id: 3, selected_option: null, correct_answer: 'D' }  // skipped
      ]
    };

    const result = normalizeGamsatResult(raw, 'SESS-COMPUTED');
    expect(result).not.toBeNull();
    expect(result?.sessionId).toBe('SESS-COMPUTED');
    expect(result?.totalQuestions).toBe(3);
    expect(result?.correct).toBe(1);
    expect(result?.wrong).toBe(1);
    expect(result?.skipped).toBe(1);
    expect(result?.accuracy).toBe(33);
  });

  it('should handle percentage string values properly', () => {
    const raw = {
      data: {
        sessionId: 'SESS-PCT',
        percentage: '85.5%' as any,
        correct: 17,
        totalQuestions: 20
      }
    };

    const result = normalizeGamsatResult(raw);
    expect(result?.accuracy).toBe(85.5);
    expect(result?.percentage).toBe(85.5);
  });

  it('should return null for null/undefined/non-object input', () => {
    expect(normalizeGamsatResult(null)).toBeNull();
    expect(normalizeGamsatResult(undefined)).toBeNull();
    expect(normalizeGamsatResult('invalid' as any)).toBeNull();
  });
});
