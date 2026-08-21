import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { TestLeaderboardService } from '../../services/test-leaderboard.service';
import { TestLeaderboard } from './test-leaderboard';

describe('TestLeaderboard', () => {
  let component: TestLeaderboard;
  let fixture: ComponentFixture<TestLeaderboard>;
  let service: {
    getLeaderboard: ReturnType<typeof vi.fn>;
    getMyRank: ReturnType<typeof vi.fn>;
  };

  const entry = {
    rank: 1,
    student_id: 'STU1',
    total_questions: 200,
    test_type: 'Previous Year',
    previous_year_paper_id: 15,
    score: -1,
    correct: 0,
    wrong: 1,
    skipped: 199,
    accuracy: 0,
    submitted_at: '2026-07-25T14:37:21.206Z',
    total_time_spent: 18,
    normalized_score: -0.12,
    session_id: 'session-1',
    student_name: 'Sanjay Sivakumar'
  };

  beforeEach(async () => {
    service = {
      getLeaderboard: vi.fn().mockReturnValue(of({
        success: true,
        message: 'Loaded',
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        period: 'ALL',
        data: [entry]
      })),
      getMyRank: vi.fn().mockReturnValue(of({
        success: true,
        message: 'Rank loaded',
        period: 'ALL',
        data: {
          ...entry,
          total_questions: 15,
          test_type: 'Quick Test',
          previous_year_paper_id: null,
          score: 5,
          accuracy: 20,
          normalized_score: 8.33
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [TestLeaderboard],
      providers: [
        provideRouter([]),
        { provide: TestLeaderboardService, useValue: service }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestLeaderboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the filtered leaderboard and current student rank', () => {
    expect(service.getLeaderboard).toHaveBeenCalledWith({
      testType: 'Previous Year',
      previousYearPaperId: 15,
      period: 'ALL',
      page: 1,
      limit: 20
    });
    expect(service.getMyRank).toHaveBeenCalledWith('ALL');
    expect(component.entries()).toEqual([entry]);
    expect(component.myRank()?.test_type).toBe('Quick Test');
  });

  it('identifies the current student in the leaderboard', () => {
    expect(component.isCurrentStudent(entry)).toBe(true);
  });

  it('formats student initials and time', () => {
    expect(component.initials('Sanjay Sivakumar')).toBe('SS');
    expect(component.formatTime(78)).toBe('1m 18s');
  });
});
