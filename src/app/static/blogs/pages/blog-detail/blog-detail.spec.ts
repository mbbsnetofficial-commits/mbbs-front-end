import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { BlogDetail } from './blog-detail';
import { PageStore } from '../../state/page.store';

describe('BlogDetail (Static Blog)', () => {
  let component: BlogDetail;
  let fixture: ComponentFixture<BlogDetail>;
  let mockStore: {
    loadHomePage: ReturnType<typeof vi.fn>;
    featuredBlogs: ReturnType<typeof signal>;
    latestBlogs: ReturnType<typeof signal>;
    homeResponse: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
    error: ReturnType<typeof signal>;
    isLiked: ReturnType<typeof vi.fn>;
    isBookmarked: ReturnType<typeof vi.fn>;
    toggleLike: ReturnType<typeof vi.fn>;
    toggleBookmark: ReturnType<typeof vi.fn>;
  };

  const sampleBlog = {
    _id: 'blog-1',
    title: 'Top 10 NEET Preparation Strategies',
    slug: 'top-10-neet-preparation-strategies',
    category: { categoryName: 'NEET Prep', slug: 'neet-prep' },
    author: { fullName: 'Dr. Sharma', designation: 'Medical Faculty' },
    contentBlocks: [{ type: 'paragraph', content: 'Study tips and tricks.' }],
    readingTime: 5,
    publishedAt: '2026-08-10T00:00:00.000Z',
    likesCount: 42,
    commentsCount: 3,
    relatedBlogs: []
  };

  beforeEach(async () => {
    mockStore = {
      loadHomePage: vi.fn(),
      featuredBlogs: signal<any[]>([sampleBlog]),
      latestBlogs: signal<any[]>([]),
      homeResponse: signal<any>({
        status: 'success',
        data: { content: { featuredBlogs: [sampleBlog], latestBlogs: [] } }
      }),
      loading: signal(false),
      error: signal<string | null>(null),
      isLiked: vi.fn().mockReturnValue(false),
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleLike: vi.fn(),
      toggleBookmark: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [BlogDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['slug', 'top-10-neet-preparation-strategies']])),
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'slug' ? 'top-10-neet-preparation-strategies' : null
              }
            }
          }
        },
        { provide: PageStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BlogDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create BlogDetail and find blog matching slug', () => {
    expect(component).toBeTruthy();
    expect(mockStore.loadHomePage).toHaveBeenCalled();
    expect(component.blog()?.title).toBe('Top 10 NEET Preparation Strategies');
  });
});
