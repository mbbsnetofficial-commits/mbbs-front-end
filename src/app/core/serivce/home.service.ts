import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environments';
import {
  BlogAuthor,
  BlogCategory,
  BlogContentBlock,
  HomeBlog,
  HomeContent,
  HomeResponse,
  MediaImage
} from '../models/home.model';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly homeUrl = `${environment.apiBaseUrl}/pages/home`;

  getHome(): Observable<HomeResponse> {
    return this.http.get<HomeResponse>(this.homeUrl).pipe(
      map((response) => this.normalizeResponse(response))
    );
  }

  getBlogBySlug(slug: string): Observable<HomeBlog | undefined> {
    // Intentionally starts a new HTTP request for the article page. The dashboard
    // request supplies previews; this fresh response supplies the selected article.
    return this.getHome().pipe(
      map(({ data }) => this.allBlogs(data.content).find((blog) => blog.slug === slug))
    );
  }

  private allBlogs(content: HomeContent): HomeBlog[] {
    return [...content.featuredBlogs, ...content.latestBlogs]
      .filter((blog, index, blogs) => blogs.findIndex(({ _id }) => _id === blog._id) === index);
  }

  private normalizeResponse(response: HomeResponse): HomeResponse {
    const content = response?.data?.content;
    return {
      ...response,
      data: {
        ...response.data,
        content: {
          featuredBlogs: (content?.featuredBlogs ?? []).map((blog) => this.normalizeBlog(blog)),
          latestBlogs: (content?.latestBlogs ?? []).map((blog) => this.normalizeBlog(blog)),
          categories: content?.categories ?? [],
          featuredAuthors: content?.featuredAuthors ?? [],
          testimonials: content?.testimonials ?? []
        }
      }
    };
  }

  private normalizeBlog(source: HomeBlog): HomeBlog {
    const raw = source as HomeBlog & {
      content?: unknown;
      excerpt?: unknown;
      shortDescription?: unknown;
      author?: Partial<BlogAuthor> | null;
      category?: Partial<BlogCategory> | null;
      featuredImage?: Partial<MediaImage> | null;
    };
    const blocks = this.extractBlocks(raw.content);
    const excerpt = this.extractText(raw.excerpt)
      || this.extractText(raw.shortDescription)
      || blocks.find(({ type, text }) => type === 'paragraph' && !!text)?.text
      || blocks.find(({ text }) => !!text)?.text
      || '';

    return {
      ...source,
      _id: this.asText(source._id),
      title: this.asText(source.title),
      slug: this.asText(source.slug),
      shortDescription: this.extractText(raw.shortDescription),
      excerpt,
      content: { blocks },
      author: {
        _id: this.asText(raw.author?._id),
        fullName: this.asText(raw.author?.fullName),
        slug: this.asText(raw.author?.slug),
        designation: this.asText(raw.author?.designation),
        bio: this.asText(raw.author?.bio),
        profileImage: this.normalizeUrl(raw.author?.profileImage)
      },
      category: {
        _id: this.asText(raw.category?._id),
        categoryName: this.asText(raw.category?.categoryName),
        slug: this.asText(raw.category?.slug),
        description: this.asText(raw.category?.description),
        icon: this.normalizeUrl(raw.category?.icon),
        bannerImage: this.normalizeUrl(raw.category?.bannerImage),
        totalBlogs: raw.category?.totalBlogs ?? 0
      },
      featuredImage: {
        url: this.normalizeUrl(raw.featuredImage?.url),
        alt: this.asText(raw.featuredImage?.alt) || this.asText(source.title),
        caption: this.asText(raw.featuredImage?.caption)
      },
      publishedAt: this.asText(source.publishedAt),
      readingTime: Number(source.readingTime) || 0,
      totalLikes: Number(source.totalLikes) || 0
    };
  }

  private extractBlocks(value: unknown): BlogContentBlock[] {
    const parsed = this.parseJson(value);
    if (!parsed || typeof parsed !== 'object') {
      return [];
    }
    const blocks = (parsed as { blocks?: unknown }).blocks;
    if (!Array.isArray(blocks)) {
      return [];
    }
    return blocks
      .filter((block): block is Record<string, unknown> => !!block && typeof block === 'object')
      .map((block) => ({
        type: this.asText(block['type']) || 'paragraph',
        text: this.asText(block['text']),
        url: this.normalizeUrl(block['url']),
        alt: this.asText(block['alt']),
        caption: this.asText(block['caption']),
        items: Array.isArray(block['items'])
          ? block['items'].map((item) => this.asText(item)).filter(Boolean)
          : undefined,
        level: Number(block['level']) || undefined
      }));
  }

  private extractText(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    const text = value.trim();
    if (!text.startsWith('{') && !text.startsWith('[')) {
      return text;
    }
    const parsed = this.parseJson(text);
    const blocks = this.extractBlocks(parsed);
    return blocks.find(({ type, text: blockText }) => type === 'paragraph' && !!blockText)?.text
      || blocks.find(({ text: blockText }) => !!blockText)?.text
      || '';
  }

  private parseJson(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private asText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeUrl(value: unknown): string {
    const url = this.asText(value);
    if (!url || url.includes('example.com/')) {
      return '';
    }
    return url.startsWith('http://res.cloudinary.com/')
      ? url.replace('http://', 'https://')
      : url;
  }
}
