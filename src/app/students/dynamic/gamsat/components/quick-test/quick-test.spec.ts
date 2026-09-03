import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { GamsatQuickTest } from './quick-test';
import { environment } from '../../../../../../environments/environment';
import { API } from '../../constants/api.constants';

describe('GamsatQuickTest', () => {
  let component: GamsatQuickTest;
  let fixture: ComponentFixture<GamsatQuickTest>;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamsatQuickTest],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dynamic/gamsat/practice', component: class {} }])
      ]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(GamsatQuickTest);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('1. should create and load sections on init via GET /gamsat/test/sections', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    expect(sectionsReq.request.method).toBe('GET');
    sectionsReq.flush({
      success: true,
      data: [
        {
          key: 'WRITTEN_COMMUNICATION',
          sectionNumber: 1,
          name: 'Written Communication',
          fullName: 'Section I: Reasoning in Written Communication',
          description: 'Evaluates clarity, argument structure, and thematic reasoning'
        },
        {
          key: 'HUMANITIES_SOCIAL_SCIENCES',
          sectionNumber: 2,
          name: 'Humanities & Social Sciences',
          fullName: 'Section II: Critical Reasoning in Humanities & Social Sciences',
          description: 'Assesses critical interpretation of texts and sociocultural concepts'
        },
        {
          key: 'BIOLOGICAL_PHYSICAL_SCIENCES',
          sectionNumber: 3,
          name: 'Biological & Physical Sciences',
          fullName: 'Section III: Reasoning in Biological & Physical Sciences',
          description: 'Tests problem-solving in Biology, Chemistry, and Physics'
        }
      ]
    });

    expect(component.sections().length).toBe(3);
    expect(component.step()).toBe(1);
    expect(component.testName()).toBe('GAMSAT Custom Practice Drill');
    expect(component.isLoading()).toBe(false);
  });

  it('2. should advance through wizard steps with section and topic selection via GET /gamsat/test/topics', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({
      success: true,
      data: ['WRITTEN_COMMUNICATION', 'BIOLOGICAL_PHYSICAL_SCIENCES']
    });

    // Step 1 -> Step 2
    component.goToSections();
    expect(component.step()).toBe(2);

    // Select WRITTEN_COMMUNICATION
    component.toggleSection('WRITTEN_COMMUNICATION');
    expect(component.selectedSections()).toEqual(['WRITTEN_COMMUNICATION']);

    // Step 2 -> Step 3
    component.goToTopics();
    expect(component.step()).toBe(3);

    // Verified: GET request to /gamsat/test/topics
    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    expect(topicsReq.request.method).toBe('GET');
    topicsReq.flush({
      success: true,
      data: [
        { id: 3001, name: 'Task Interpretation', section: 'Written Communication', chapter: 'Written Communication' },
        { id: 3002, name: 'Idea Generation', section: 'Written Communication', chapter: 'Written Communication' },
        { id: 3101, name: 'Cell Biology', section: 'Biological & Physical Sciences', chapter: 'Biology' }
      ]
    });

    // Only topics matching selected section (Written Communication) should be displayed
    expect(component.topics().length).toBe(2);
    expect(component.selectedTopics()).toEqual([3001, 3002]);

    // Step 3 -> Step 4
    component.goToConfiguration();
    expect(component.step()).toBe(4);
    expect(component.questionCount()).toBe(15);
    expect(component.duration()).toBe(23); // 15 * 1.5 ~ 23 mins
  });

  it('3. should preserve selections when navigating back and forth across all wizard steps', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({ success: true, data: ['SECTION_I', 'SECTION_II'] });

    component.testName.set('High-Yield Humanities Drill');
    component.goToSections();
    expect(component.step()).toBe(2);

    component.toggleSection('SECTION_I');
    expect(component.selectedSections()).toEqual(['SECTION_I']);

    component.goToTopics();
    expect(component.step()).toBe(3);

    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    topicsReq.flush({
      success: true,
      data: [{ id: 1, name: 'Poetry Analysis', section: 'Reasoning in Humanities' }]
    });

    // Go Back to Step 2
    component.previousStep();
    expect(component.step()).toBe(2);
    expect(component.selectedSections()).toEqual(['SECTION_I']); // Preserved

    // Go Back to Step 1
    component.previousStep();
    expect(component.step()).toBe(1);
    expect(component.testName()).toBe('High-Yield Humanities Drill'); // Preserved

    // Navigate Forward again
    component.goToSections();
    expect(component.step()).toBe(2);
    expect(component.selectedSections()).toEqual(['SECTION_I']);
  });

  it('4. should handle topics loading failure gracefully without throwing errors', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({ success: true, data: ['SECTION_I'] });

    component.goToSections();
    component.toggleSection('SECTION_I');
    component.goToTopics();

    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    topicsReq.error(new ProgressEvent('Network error'), { status: 500, statusText: 'Internal Server Error' });

    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toContain('Unable to load practice topics');
    expect(component.topics().length).toBe(0);
  });

  it('5. should call ONLY POST /custom/save without calling startTest, emit testSaved, and close modal without opening test runner', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({ success: true, data: ['WRITTEN_COMMUNICATION', 'HUMANITIES_AND_SOCIAL_SCIENCES'] });

    component.goToSections();
    component.toggleSection('WRITTEN_COMMUNICATION');
    component.toggleSection('HUMANITIES_AND_SOCIAL_SCIENCES');
    component.goToTopics();

    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    topicsReq.flush({
      success: true,
      data: [
        { id: 3001, name: 'Task Interpretation', section: 'Written Communication' },
        { id: 3002, name: 'Idea Generation', section: 'Written Communication' }
      ]
    });

    component.goToConfiguration();
    component.setQuestionCount(40);
    component.setLevel('Hard');
    expect(component.questionCount()).toBe(40);

    const routerSpy = vi.spyOn(router, 'navigate');
    let emittedPayload: any = null;
    component.testSaved.subscribe((p) => {
      emittedPayload = p;
    });

    // Trigger Save to Learning Report
    component.saveTest();
    expect(component.isSaving()).toBe(true);

    // 1. Verify ONLY /custom/save POST request is made
    const saveReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.CUSTOM_SAVE}`);
    expect(saveReq.request.method).toBe('POST');
    expect(saveReq.request.body.questionCount).toBe(40);
    expect(saveReq.request.body.difficulty).toBe('Hard');
    expect(saveReq.request.body.sections).toEqual(['WRITTEN_COMMUNICATION', 'HUMANITIES_AND_SOCIAL_SCIENCES']);

    // 2. Real Backend Response: validated configuration data
    saveReq.flush({
      success: true,
      message: 'GAMSAT custom test configuration validated and created successfully',
      data: {
        name: 'GAMSAT Custom Practice Test',
        sections: [
          'WRITTEN_COMMUNICATION',
          'HUMANITIES_AND_SOCIAL_SCIENCES'
        ],
        topicIds: [3001, 3002],
        questionCount: 40,
        difficulty: 'Hard',
        durationMinutes: 79,
        availableQuestions: 2407
      }
    });

    // 3. Confirm saving completed, event emitted, and NO session/start request was made
    expect(component.isSaving()).toBe(false);
    expect(emittedPayload).toBeTruthy();
    expect(emittedPayload.title).toBe('GAMSAT Custom Practice Test');
    expect(emittedPayload.questionCount).toBe(40);
    expect(emittedPayload.duration).toBe(79);

    // Verified: startTest API is NOT called
    httpTesting.expectNone(`${environment.gamsatApiBaseUrl}${API.TEST.START}`);
    expect(routerSpy).not.toHaveBeenCalledWith(['/dynamic/gamsat/practice'], expect.anything());
  });

  it('6. should handle INSUFFICIENT_QUESTIONS error response without navigating or creating fake session', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({ success: true, data: ['WRITTEN_COMMUNICATION'] });

    component.goToSections();
    component.toggleSection('WRITTEN_COMMUNICATION');
    component.goToTopics();

    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    topicsReq.flush({
      success: true,
      data: [{ id: 3001, name: 'Task Interpretation', section: 'Written Communication' }]
    });

    component.goToConfiguration();
    component.setQuestionCount(50);

    const routerSpy = vi.spyOn(router, 'navigate');

    component.saveTest();
    expect(component.isSaving()).toBe(true);

    const saveReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.CUSTOM_SAVE}`);
    saveReq.flush(
      {
        success: false,
        error: {
          code: 'INSUFFICIENT_QUESTIONS',
          message: 'Requested 50 questions, but only 0 matching questions are available in the GAMSAT question bank for the selected criteria.'
        }
      },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.isSaving()).toBe(false);
    expect(component.step()).toBe(4); // Stays on Step 4
    expect(component.errorMessage()).toBe('Requested 50 questions, but only 0 matching questions are available in the GAMSAT question bank for the selected criteria.');
    expect(routerSpy).not.toHaveBeenCalled(); // No navigation
  });

  it('7. should prevent duplicate save requests when isSaving is true', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({ success: true, data: ['WRITTEN_COMMUNICATION'] });

    component.goToSections();
    component.toggleSection('WRITTEN_COMMUNICATION');
    component.goToTopics();

    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    topicsReq.flush({ success: true, data: [] });

    component.goToConfiguration();

    // First click
    component.saveTest();
    expect(component.isSaving()).toBe(true);

    // Second click while pending
    component.saveTest();

    // Exactly 1 POST request must be made
    const requests = httpTesting.match(`${environment.gamsatApiBaseUrl}${API.TEST.CUSTOM_SAVE}`);
    expect(requests.length).toBe(1);
    requests[0].flush({
      success: true,
      data: {
        name: 'GAMSAT Custom Practice Test',
        sections: ['WRITTEN_COMMUNICATION'],
        topicIds: [3001],
        questionCount: 15,
        difficulty: 'Medium',
        durationMinutes: 23
      }
    });

    expect(component.isSaving()).toBe(false);
  });

  it('8. should handle HTTP 500 server error cleanly without proceeding', () => {
    fixture.detectChanges();

    const sectionsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.SECTIONS}`);
    sectionsReq.flush({ success: true, data: ['WRITTEN_COMMUNICATION'] });

    component.goToSections();
    component.toggleSection('WRITTEN_COMMUNICATION');
    component.goToTopics();

    const topicsReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.TOPICS}`);
    topicsReq.flush({ success: true, data: [] });

    component.goToConfiguration();

    const routerSpy = vi.spyOn(router, 'navigate');
    component.saveTest();

    const saveReq = httpTesting.expectOne(`${environment.gamsatApiBaseUrl}${API.TEST.CUSTOM_SAVE}`);
    saveReq.error(new ProgressEvent('Server error'), { status: 500, statusText: 'Internal Server Error' });

    expect(component.isSaving()).toBe(false);
    expect(component.errorMessage()).toContain('Unable to save custom test');
    expect(routerSpy).not.toHaveBeenCalled();
  });
});
