import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { AI_CHAT_API } from '../constants/ai-chat.constants';
import { ChatApiResponse } from '../models/ai-chat.model';
import { AiChatService } from './ai-chat.service';

describe('AiChatService', () => {
  let service: AiChatService;
  let httpTestingController: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AiChatService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post to /knowledge-base/chat with correct body on sendMessage()', () => {
    const mockPrompt = 'What are the top medical universities in Georgia?';
    const mockResponse: ChatApiResponse = {
      success: true,
      data: {
        prompt: mockPrompt,
        response: '### Top Medical Universities in Georgia\n\n• Tbilisi State Medical University',
        groundedSourcesCount: {
          countries: 50,
          universities: 363,
          courses: 374,
          courseRequirements: 374,
          countryQuestions: 483,
          sources: 536,
        },
      },
    };

    service.sendMessage(mockPrompt).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.success).toBe(true);
      expect(res.data.response).toContain('Tbilisi State Medical University');
      expect(res.data.groundedSourcesCount.countries).toBe(50);
    });

    const expectedUrl = `${baseUrl}${AI_CHAT_API.CHAT}`;
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ prompt: mockPrompt });

    req.flush(mockResponse);
  });

  it('should propagate HTTP error when API returns 500 error', () => {
    const mockPrompt = 'Test prompt';
    let errorResponse: any;

    service.sendMessage(mockPrompt).subscribe({
      next: () => {},
      error: (err) => {
        errorResponse = err;
      },
    });

    const expectedUrl = `${baseUrl}${AI_CHAT_API.CHAT}`;
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');

    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(errorResponse).toBeDefined();
    expect(errorResponse.status).toBe(500);
  });
});
