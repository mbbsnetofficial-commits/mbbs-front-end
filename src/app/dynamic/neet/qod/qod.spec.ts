import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { QodService } from '../../../core/serivce/qod.service';
import { QodComponent } from './qod';

describe('Qod', () => {
  let component: QodComponent;
  let fixture: ComponentFixture<QodComponent>;
  let service: {
    getQuestionOfTheDay: ReturnType<typeof vi.fn>;
    submitAnswer: ReturnType<typeof vi.fn>;
  };

  const question = {
    id: 4133,
    question_date: '2026-07-25T00:00:00.000Z',
    question: 'Identify the incorrect effect of deforestation.',
    option_a: 'Soil erosion',
    option_b: 'Decreasing rainfall',
    option_c: 'Accelerated nutrient recycling',
    option_d: 'Destruction of wildlife habitats',
    difficulty: 'Easy',
    question_type: 'Conceptual',
    topic_id: 912,
    alreadyAnswered: false
  };

  beforeEach(async () => {
    service = {
      getQuestionOfTheDay: vi.fn().mockReturnValue(of({
        status: 'success',
        data: question
      })),
      submitAnswer: vi.fn().mockReturnValue(of({
        status: 'success',
        message: 'Answer submitted',
        data: {
          question_id: 4133,
          selected_option: 'C',
          correct_answer: 'C',
          is_correct: true,
          explanation: 'Nutrient recycling is not accelerated.'
        }
      }))
    };

    await TestBed.configureTestingModule({
      imports: [QodComponent],
      providers: [
        { provide: QodService, useValue: service }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not fetch the question when the dashboard renders', () => {
    expect(service.getQuestionOfTheDay).not.toHaveBeenCalled();
    expect(component.question()).toBeNull();
    expect(component.isQuestionOpen()).toBe(false);
  });

  it('fetches and opens the question only after Solve Now', () => {
    component.openQuestion();

    expect(service.getQuestionOfTheDay).toHaveBeenCalledOnce();
    expect(component.question()?.id).toBe(4133);
    expect(component.isQuestionOpen()).toBe(true);
  });

  it('shows the completed state returned by the API', () => {
    service.getQuestionOfTheDay.mockReturnValue(of({
      status: 'success',
      data: {
        ...question,
        alreadyAnswered: true
      }
    }));

    component.openQuestion();

    expect(component.hasSubmitted()).toBe(true);
  });

  it('reopens the fetched question without another API request', () => {
    component.openQuestion();
    component.closeQuestion();
    component.openQuestion();

    expect(service.getQuestionOfTheDay).toHaveBeenCalledOnce();
    expect(component.isQuestionOpen()).toBe(true);
  });

  it('submits the selected answer', () => {
    component.openQuestion();
    component.selectOption('C');
    component.submitAnswer();

    expect(service.submitAnswer).toHaveBeenCalledWith({
      question_id: 4133,
      selected_option: 'C'
    });
    expect(component.hasSubmitted()).toBe(true);
    expect(component.submitResult()?.is_correct).toBe(true);
  });
});
