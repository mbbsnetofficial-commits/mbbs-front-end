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
  const baseUrl = environment.aiChatApiBaseUrl || environment.apiBaseUrl;

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

  describe('Message Persistence Across Tabs & Logout Reset', () => {
    it('should initialize with the initial welcome message', () => {
      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].sender).toBe('assistant');
    });

    it('should persist added messages to localStorage', () => {
      const userMsg = { id: 'test-1', sender: 'user' as const, text: 'Hello AI' };
      service.addMessage(userMsg);

      expect(service.messages().length).toBe(2);
      expect(service.messages()[1]).toEqual(userMsg);

      const stored = JSON.parse(localStorage.getItem('mbbs_knowledge_base_chat_messages') || '[]');
      expect(stored.length).toBe(2);
      expect(stored[1].text).toBe('Hello AI');
    });

    it('should reset messages to welcome message on clearChat()', () => {
      service.addMessage({ id: 'msg-1', sender: 'user', text: 'Questions about MBBS' });
      expect(service.messages().length).toBeGreaterThan(1);

      service.clearChat();

      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].id).toBe('welcome-1');
      expect(localStorage.getItem('mbbs_knowledge_base_chat_messages')).toBeNull();
    });

    it('should clear chat on window mbbs:auth:logout event', () => {
      service.addMessage({ id: 'msg-logout', sender: 'user', text: 'Should be cleared on logout' });
      expect(service.messages().length).toBeGreaterThan(1);

      window.dispatchEvent(new CustomEvent('mbbs:auth:logout'));

      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].id).toBe('welcome-1');
    });
  });
});
