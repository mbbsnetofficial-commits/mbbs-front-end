import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UcatQuickTest } from './quick-test';
import { UcatService } from '../../services/ucat.service';
import { UcatModalService } from '../../services/ucat-modal.service';
import {
  UcatChaptersResponse,
  UcatCustomTestSaveResponse,
  UcatSubjectsResponse,
  UcatTopicsResponse
} from '../../models/ucat.model';

describe('UcatQuickTest', () => {
  let component: UcatQuickTest;
  let fixture: ComponentFixture<UcatQuickTest>;
  let ucatServiceMock: {
    getSubjects: ReturnType<typeof vi.fn>;
    getChapters: ReturnType<typeof vi.fn>;
    getTopics: ReturnType<typeof vi.fn>;
    saveCustomTest: ReturnType<typeof vi.fn>;
  };
  let ucatModalService: UcatModalService;
  let routerMock: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
  };

  const mockSubjectsResponse: UcatSubjectsResponse = {
    success: true,
    data: ['VERBAL_REASONING', 'DECISION_MAKING', 'QUANTITATIVE_REASONING']
  };

  const mockChaptersResponse: UcatChaptersResponse = {
    success: true,
    data: [
      { chapter: 'Deductive Reasoning' },
      { chapter: 'Evaluating Arguments' }
    ]
  };

  const mockTopicsResponse: UcatTopicsResponse = {
    success: true,
    total: 2,
    data: [
      { id: 101, name: 'Syllogisms', subject: 'DECISION_MAKING', chapter: 'Deductive Reasoning' },
      { id: 102, name: 'Logic Puzzles', subject: 'DECISION_MAKING', chapter: 'Deductive Reasoning' }
    ]
  };

  const mockSaveResponse: UcatCustomTestSaveResponse = {
    success: true,
    message: 'Custom test saved successfully.',
    data: {
      id: 201,
      custom_test_id: 201,
      test_name: 'UCAT Custom Practice Test',
      test_code: 'UCAT_CUSTOM_201',
      source: 'custom',
      type: 'Custom',
      subjects: ['DECISION_MAKING'],
      chapters: ['Deductive Reasoning'],
      total_questions: 15,
      total_marks: 900,
      duration_minutes: 15,
      status: 'not_started'
    }
  };

  beforeEach(async () => {
    ucatServiceMock = {
      getSubjects: vi.fn().mockReturnValue(of(mockSubjectsResponse)),
      getChapters: vi.fn().mockReturnValue(of(mockChaptersResponse)),
      getTopics: vi.fn().mockReturnValue(of(mockTopicsResponse)),
      saveCustomTest: vi.fn().mockReturnValue(of(mockSaveResponse))
    };

    routerMock = {
      url: '/dynamic/ucat',
      navigate: vi.fn().mockResolvedValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [UcatQuickTest],
      providers: [
        { provide: UcatService, useValue: ucatServiceMock },
        { provide: Router, useValue: routerMock },
        UcatModalService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UcatQuickTest);
    component = fixture.componentInstance;
    ucatModalService = TestBed.inject(UcatModalService);
    fixture.detectChanges();
  });

  it('should create UcatQuickTest component and load subjects on init', () => {
    expect(component).toBeTruthy();
    expect(ucatServiceMock.getSubjects).toHaveBeenCalledTimes(1);
    expect(component.subjects()).toEqual(['VERBAL_REASONING', 'DECISION_MAKING', 'QUANTITATIVE_REASONING']);
    expect(component.step()).toBe(1);
  });

  it('should validate test name before advancing to step 2', () => {
    component.testName.set('   ');
    component.goToSubjects();
    expect(component.step()).toBe(1);

    component.testName.set('My Custom UCAT Drill');
    component.goToSubjects();
    expect(component.step()).toBe(2);
  });

  it('should allow toggling subjects in step 2', () => {
    component.toggleSubject('DECISION_MAKING');
    expect(component.selectedSubjects()).toEqual(['DECISION_MAKING']);

    component.toggleSubject('DECISION_MAKING');
    expect(component.selectedSubjects()).toEqual([]);
  });

  it('should load chapters and advance to step 3 when subjects are selected', () => {
    component.selectedSubjects.set(['DECISION_MAKING']);
    component.goToChapters();

    expect(ucatServiceMock.getChapters).toHaveBeenCalledWith({
      subjects: ['DECISION_MAKING']
    });
    expect(component.chapters()).toEqual(['Deductive Reasoning', 'Evaluating Arguments']);
    expect(component.step()).toBe(3);
  });

  it('should allow selecting all and toggling chapters in step 3', () => {
    component.chapters.set(['Deductive Reasoning', 'Evaluating Arguments']);
    component.toggleAllChapters();
    expect(component.selectedChapters()).toEqual(['Deductive Reasoning', 'Evaluating Arguments']);

    component.toggleAllChapters();
    expect(component.selectedChapters()).toEqual([]);

    component.toggleChapter('Deductive Reasoning');
    expect(component.selectedChapters()).toEqual(['Deductive Reasoning']);
  });

  it('should load topics and advance to step 4 when chapters are selected', () => {
    component.selectedSubjects.set(['DECISION_MAKING']);
    component.selectedChapters.set(['Deductive Reasoning']);
    component.goToConfiguration();

    expect(ucatServiceMock.getTopics).toHaveBeenCalledWith({
      subjects: ['DECISION_MAKING'],
      chapters: ['Deductive Reasoning']
    });
    expect(component.topics().length).toBe(2);
    expect(component.topicCount()).toBe(2);
    expect(component.step()).toBe(4);
  });

  it('should navigate back through steps with previousStep()', () => {
    component.step.set(4);
    component.previousStep();
    expect(component.step()).toBe(3);

    component.previousStep();
    expect(component.step()).toBe(2);

    component.previousStep();
    expect(component.step()).toBe(1);
  });

  it('should allow configuring question count and duration', () => {
    component.setQuestionCount(25);
    expect(component.questionCount()).toBe(25);

    const event = { target: { value: '30' } } as unknown as Event;
    component.setDuration(event);
    expect(component.duration()).toBe(30);
  });

  it('should call saveCustomTest with valid payload without student_id', () => {
    component.testName.set('My Decision Making Drill');
    component.selectedSubjects.set(['DECISION_MAKING']);
    component.selectedChapters.set(['Deductive Reasoning']);
    component.topics.set([
      { id: 101, name: 'Syllogisms', subject: 'DECISION_MAKING', chapter: 'Deductive Reasoning' },
      { id: 102, name: 'Logic Puzzles', subject: 'DECISION_MAKING', chapter: 'Deductive Reasoning' }
    ]);
    component.questionCount.set(20);
    component.duration.set(20);

    const testSavedSpy = vi.spyOn(component.testSaved, 'emit');
    const modalSaveSpy = vi.spyOn(ucatModalService, 'saveTest');

    component.saveTest();

    expect(ucatServiceMock.saveCustomTest).toHaveBeenCalledWith({
      title: 'My Decision Making Drill',
      subjects: ['DECISION_MAKING'],
      chapters: ['Deductive Reasoning'],
      topic_ids: [101, 102],
      questionCount: 20,
      duration: 20,
      level: 'Intermediate'
    });

    const callPayload = ucatServiceMock.saveCustomTest.mock.calls[0][0];
    expect((callPayload as any).student_id).toBeUndefined();
    expect((callPayload as any).studentId).toBeUndefined();
    expect((callPayload as any).userId).toBeUndefined();

    expect(testSavedSpy).toHaveBeenCalledWith({
      title: 'My Decision Making Drill',
      subjects: ['DECISION_MAKING'],
      chapters: ['Deductive Reasoning'],
      questionCount: 20,
      duration: 20
    });
    expect(modalSaveSpy).toHaveBeenCalled();
  });

  it('should handle saveCustomTest failure and reset isSaving state', () => {
    ucatServiceMock.saveCustomTest.mockReturnValue(
      throwError(() => ({ status: 500, error: { message: 'Internal Server Error' } }))
    );

    component.testName.set('My Drill');
    component.selectedSubjects.set(['DECISION_MAKING']);
    component.selectedChapters.set(['Deductive Reasoning']);

    component.saveTest();

    expect(component.isSaving()).toBe(false);
    expect(component.errorMessage()).toBe('Internal Server Error');
  });

  it('should prevent duplicate submission while already saving', () => {
    component.isSaving.set(true);
    component.saveTest();
    expect(ucatServiceMock.saveCustomTest).not.toHaveBeenCalled();
  });
});
