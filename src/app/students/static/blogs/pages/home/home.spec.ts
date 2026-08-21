import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { BlogHome } from './home';
import { PageStore } from '../../state/page.store';

describe('BlogHome (Static Blog)', () => {
  let component: BlogHome;
  let fixture: ComponentFixture<BlogHome>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      loadHomePage: vi.fn(),
      loading: signal(false),
      error: signal<string | null>(null),
      homeResponse: signal<any>({
        status: 'success',
        data: {
          content: {
            featuredBlogs: [],
            latestBlogs: [],
            categories: [],
            featuredAuthors: []
          }
        }
      }),
      activeTab: signal('forYou'),
      selectedCategorySlug: signal<string | null>(null),
      feedBlogs: signal([]),
      featuredBlogs: signal([]),
      latestBlogs: signal([]),
      categories: signal([]),
      allAuthors: signal([]),
      featuredAuthors: signal([]),
      setActiveTab: vi.fn(),
      selectCategory: vi.fn(),
      retry: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BlogHome],
      providers: [
        provideRouter([]),
        { provide: PageStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BlogHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  it('should create BlogHome in static/blogs module', () => {
    expect(component).toBeTruthy();
    expect(mockStore.loadHomePage).toHaveBeenCalled();
  });

  it('should toggle banner visibility with dismissBanner()', () => {
    expect(component.showBanner()).toBe(true);
    component.dismissBanner();
    expect(component.showBanner()).toBe(false);
  });
});
