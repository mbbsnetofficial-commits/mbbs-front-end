import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UcatService } from './ucat.service';
import { environment } from '../../../../../environments/environment';
import { API } from '../constants/api.constants';
import {
  UcatCustomTestDetailResponse,
  UcatCustomTestListResponse,
  UcatCustomTestSaveRequest,
  UcatCustomTestSaveResponse,
  UcatStartTestRequest,
  UcatStartTestResponse
} from '../models/ucat.model';

describe('UcatService', () => {
  let service: UcatService;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UcatService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UcatService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post to /ucat/test/custom/save on saveCustomTest()', () => {
    const mockRequest: UcatCustomTestSaveRequest = {
      title: 'UCAT Decision Making Test',
      subjects: ['DECISION_MAKING'],
      chapters: ['Deductive Reasoning'],
      topic_ids: [101, 102],
      questionCount: 15,
      duration: 15,
      level: 'Intermediate'
    };

    const mockResponse: UcatCustomTestSaveResponse = {
      success: true,
      message: 'Custom test saved successfully.',
      data: {
        id: 201,
        custom_test_id: 201,
        test_name: 'UCAT Decision Making Test',
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

    service.saveCustomTest(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(baseUrl + API.TEST.CUSTOM_SAVE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    expect((req.request.body as any).student_id).toBeUndefined();
    expect((req.request.body as any).studentId).toBeUndefined();
    expect((req.request.body as any).userId).toBeUndefined();
    expect((req.request.body as any).ownerId).toBeUndefined();
    req.flush(mockResponse);
  });

  it('should get /ucat/test/custom on getCustomTests()', () => {
    const mockResponse: UcatCustomTestListResponse = {
      success: true,
      data: [
        {
          id: 201,
          custom_test_id: 201,
          test_name: 'UCAT Decision Making Test',
          test_code: 'UCAT_CUSTOM_201',
          source: 'custom',
          type: 'Custom',
          level: 'Intermediate',
          subjects: ['DECISION_MAKING'],
          chapters: ['Deductive Reasoning'],
          total_questions: 15,
          total_marks: 900,
          duration_minutes: 15,
          status: 'not_started'
        }
      ]
    };

    service.getCustomTests().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(baseUrl + API.TEST.CUSTOM_LIST);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get /ucat/test/custom/:customTestId on getCustomTestById()', () => {
    const customTestId = 201;
    const mockResponse: UcatCustomTestDetailResponse = {
      success: true,
      data: {
        id: 201,
        custom_test_id: 201,
        test_name: 'UCAT Decision Making Test',
        test_code: 'UCAT_CUSTOM_201',
        source: 'custom',
        type: 'Custom',
        level: 'Intermediate',
        subjects: ['DECISION_MAKING'],
        chapters: ['Deductive Reasoning'],
        total_questions: 15,
        total_marks: 900,
        duration_minutes: 15,
        status: 'not_started'
      }
    };

    service.getCustomTestById(customTestId).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(
      `${baseUrl}${API.TEST.CUSTOM_DETAIL}/${customTestId}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should post to /ucat/test/start with custom_test_id on startTest()', () => {
    const mockRequest: UcatStartTestRequest = {
      custom_test_id: 201
    };

    const mockResponse: UcatStartTestResponse = {
      success: true,
      sessionId: 'session-ucat-201',
      duration: 15,
      total_questions: 15,
      questions: []
    };

    service.startTest(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(baseUrl + API.TEST.START);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ custom_test_id: 201 });
    expect((req.request.body as any).student_id).toBeUndefined();
    req.flush(mockResponse);
  });

  it('should post to /ucat/test/start with raw configuration on startTest()', () => {
    const mockRequest: UcatStartTestRequest = {
      subjects: ['DECISION_MAKING'],
      chapters: ['Deductive Reasoning'],
      topic_ids: [101, 102],
      limit: 20,
      duration: 15
    };

    const mockResponse: UcatStartTestResponse = {
      success: true,
      sessionId: 'session-ucat-raw',
      duration: 15,
      total_questions: 20,
      questions: []
    };

    service.startTest(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(baseUrl + API.TEST.START);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should propagate 403 Forbidden error on getCustomTestById()', () => {
    const customTestId = 999;
    let actualError: any = null;

    service.getCustomTestById(customTestId).subscribe({
      next: () => {},
      error: (err) => {
        actualError = err;
      }
    });

    const req = httpTestingController.expectOne(
      `${baseUrl}${API.TEST.CUSTOM_DETAIL}/${customTestId}`
    );
    req.flush(
      { message: 'You are not authorized to view this custom test.' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(actualError).toBeTruthy();
    expect(actualError.status).toBe(403);
  });

  it('should patch to /ucat/test/sessions/:sessionId on saveAnswer()', () => {
    const sessionId = 'session-ucat-autosave-123';
    const mockPayload = {
      question_id: 101,
      selected_option: 'A',
      time_spent: 12
    };

    service.saveAnswer(sessionId, mockPayload).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpTestingController.expectOne(
      `${baseUrl}${API.TEST.SESSIONS}/${sessionId}`
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(mockPayload);
    req.flush({ success: true, message: 'Answer saved' });
  });
});
