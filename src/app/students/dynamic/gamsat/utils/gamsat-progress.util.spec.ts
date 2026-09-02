import { describe, expect, it } from 'vitest';
import {
  calculateGamsatProgress,
  countUniqueAnsweredQuestions,
  normalizeQuestionId
} from './gamsat-progress.util';

describe('GamsatProgressUtil', () => {
  describe('normalizeQuestionId', () => {
    it('should extract questionId, question_id, id, or _id correctly', () => {
      expect(normalizeQuestionId({ questionId: '101' })).toBe('101');
      expect(normalizeQuestionId({ question_id: 102 })).toBe('102');
      expect(normalizeQuestionId({ id: '103' })).toBe('103');
      expect(normalizeQuestionId({ _id: '104' })).toBe('104');
      expect(normalizeQuestionId('105')).toBe('105');
      expect(normalizeQuestionId(106)).toBe('106');
      expect(normalizeQuestionId(null)).toBe('');
      expect(normalizeQuestionId(undefined)).toBe('');
    });
  });

  describe('countUniqueAnsweredQuestions', () => {
    it('Case 1: 0 answers -> should return 0', () => {
      const states = [
        { questionId: 1, selectedOption: null },
        { questionId: 2, selectedOption: null },
        { questionId: 3, selectedOption: null }
      ];
      expect(countUniqueAnsweredQuestions(states)).toBe(0);
    });

    it('Case 2: 1 answered -> should return 1', () => {
      const states = [
        { questionId: 1, selectedOption: 'A' },
        { questionId: 2, selectedOption: null },
        { questionId: 3, selectedOption: null }
      ];
      expect(countUniqueAnsweredQuestions(states)).toBe(1);
    });

    it('Case 3: duplicate answer objects for same questionId -> should count as 1', () => {
      const rawAnswers = [
        { questionId: 1, selectedOption: 'A' },
        { questionId: 1, selectedOption: 'B' },
        { questionId: 1, selectedOption: 'C' }
      ];
      expect(countUniqueAnsweredQuestions(rawAnswers)).toBe(1);
    });

    it('Case 4: answer changed on same question -> should not increment count', () => {
      const state1 = [{ questionId: 1, selectedOption: 'A' }];
      expect(countUniqueAnsweredQuestions(state1)).toBe(1);

      const state2 = [{ questionId: 1, selectedOption: 'C' }];
      expect(countUniqueAnsweredQuestions(state2)).toBe(1);
    });

    it('Case 5: answer cleared -> should decrement count', () => {
      const state1 = [
        { questionId: 1, selectedOption: 'A' },
        { questionId: 2, selectedOption: 'B' }
      ];
      expect(countUniqueAnsweredQuestions(state1)).toBe(2);

      const state2 = [
        { questionId: 1, selectedOption: null },
        { questionId: 2, selectedOption: 'B' }
      ];
      expect(countUniqueAnsweredQuestions(state2)).toBe(1);
    });
  });

  describe('calculateGamsatProgress', () => {
    it('Case 1: 0 / 137 -> should return 0%', () => {
      expect(calculateGamsatProgress(0, 137, false)).toBe(0);
    });

    it('Case 2: 1 / 137 -> should return 1%', () => {
      expect(calculateGamsatProgress(1, 137, false)).toBe(1);
    });

    it('Case 3: 50 / 137 -> should return 36%', () => {
      expect(calculateGamsatProgress(50, 137, false)).toBe(36);
    });

    it('Case 4: 68 / 137 -> should return 50%', () => {
      expect(calculateGamsatProgress(68, 137, false)).toBe(50);
    });

    it('Case 5: 137 / 137 -> should return 100%', () => {
      expect(calculateGamsatProgress(137, 137, false)).toBe(100);
    });

    it('Case 6: Completed test -> should always return 100%', () => {
      expect(calculateGamsatProgress(0, 137, true)).toBe(100);
      expect(calculateGamsatProgress(50, 137, true)).toBe(100);
    });

    it('Case 7: 10-question mock cases', () => {
      expect(calculateGamsatProgress(0, 10)).toBe(0);
      expect(calculateGamsatProgress(1, 10)).toBe(10);
      expect(calculateGamsatProgress(5, 10)).toBe(50);
      expect(calculateGamsatProgress(10, 10)).toBe(100);
    });
  });
});
