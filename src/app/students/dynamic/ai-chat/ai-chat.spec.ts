import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AiChat } from './ai-chat';
import { DEFAULT_ERROR_MESSAGE, DEFAULT_WELCOME_MESSAGE } from './constants/ai-chat.constants';
import { ChatApiResponse } from './models/ai-chat.model';
import { AiChatService } from './services/ai-chat.service';

describe('AiChat Component', () => {
  let component: AiChat;
  let fixture: ComponentFixture<AiChat>;
  let aiChatServiceMock: { sendMessage: ReturnType<typeof vi.fn> };

  const mockSuccessResponse: ChatApiResponse = {
    success: true,
    data: {
      prompt: 'What are the top medical universities in Georgia?',
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

  beforeEach(async () => {
    aiChatServiceMock = {
      sendMessage: vi.fn().mockReturnValue(of(mockSuccessResponse)),
    };

    await TestBed.configureTestingModule({
      imports: [AiChat],
      providers: [
        { provide: AiChatService, useValue: aiChatServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with the default welcome message', () => {
    const messages = component.messages();
    expect(messages.length).toBe(1);
    expect(messages[0].sender).toBe('assistant');
    expect(messages[0].text).toBe(DEFAULT_WELCOME_MESSAGE);
  });

  it('should compute canSend accurately based on promptText and loading state', () => {
    expect(component.canSend()).toBe(false);

    component.promptText.set('   ');
    expect(component.canSend()).toBe(false);

    component.promptText.set('Hello');
    expect(component.canSend()).toBe(true);

    component.loading.set(true);
    expect(component.canSend()).toBe(false);
  });

  it('should ignore empty prompt and whitespace-only prompt', () => {
    component.promptText.set('');
    component.sendMessage();
    expect(aiChatServiceMock.sendMessage).not.toHaveBeenCalled();
    expect(component.messages().length).toBe(1);

    component.promptText.set('    ');
    component.sendMessage();
    expect(aiChatServiceMock.sendMessage).not.toHaveBeenCalled();
    expect(component.messages().length).toBe(1);
  });

  it('should append user message, clear input, and call service with trimmed prompt', () => {
    component.promptText.set('  What are the fees?  ');
    component.sendMessage();

    expect(component.promptText()).toBe('');
    expect(aiChatServiceMock.sendMessage).toHaveBeenCalledWith('What are the fees?');

    const messages = component.messages();
    expect(messages.length).toBe(3); // welcome + user + assistant
    expect(messages[1].sender).toBe('user');
    expect(messages[1].text).toBe('What are the fees?');
    expect(messages[2].sender).toBe('assistant');
    expect(messages[2].text).toContain('Tbilisi State Medical University');
    expect(component.loading()).toBe(false);
  });

  it('should update lastGroundedSources on success response', () => {
    component.promptText.set('Test prompt');
    component.sendMessage();

    expect(component.lastGroundedSources()).toEqual({
      countries: 50,
      universities: 363,
      courses: 374,
      courseRequirements: 374,
      countryQuestions: 483,
      sources: 536,
    });
  });

  it('should prevent duplicate sends when loading is true', () => {
    aiChatServiceMock.sendMessage.mockReturnValue(of(mockSuccessResponse));
    component.loading.set(true);
    component.promptText.set('Another message');

    component.sendMessage();

    expect(aiChatServiceMock.sendMessage).not.toHaveBeenCalled();
  });

  it('should display friendly error message and reset loading when API fails', () => {
    aiChatServiceMock.sendMessage.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.promptText.set('Valid question');
    component.sendMessage();

    expect(component.loading()).toBe(false);
    const messages = component.messages();
    expect(messages.length).toBe(3);
    expect(messages[2].sender).toBe('assistant');
    expect(messages[2].text).toBe(DEFAULT_ERROR_MESSAGE);
    expect(messages[2].isError).toBe(true);
  });

  it('should handle file selection and append user attachment message', () => {
    const file = new File(['dummy content'], 'syllabus.pdf', { type: 'application/pdf' });
    const event = {
      target: {
        files: [file],
        value: 'C:\\fakepath\\syllabus.pdf',
      },
    } as unknown as Event;

    component.onFileSelected(event);

    const messages = component.messages();
    expect(messages.length).toBe(2);
    expect(messages[1].sender).toBe('user');
    expect(messages[1].text).toContain('syllabus.pdf');
  });
});
