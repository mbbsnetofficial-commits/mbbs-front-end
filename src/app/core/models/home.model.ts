export interface MediaImage {
  url: string;
  alt: string;
  caption?: string;
  _id?: string;
}

export interface BlogCategory {
  _id: string;
  categoryName: string;
  slug: string;
  description: string;
  icon: string;
  bannerImage: string;
  totalBlogs?: number;
}

export interface BlogAuthor {
  _id: string;
  fullName: string;
  slug: string;
  designation: string;
  bio: string;
  profileImage: string;
  totalBlogs?: number;
}

export interface HomeBlog {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  excerpt: string;
  content: {
    blocks: BlogContentBlock[];
  };
  category: BlogCategory;
  author: BlogAuthor;
  featuredImage: MediaImage;
  publishedAt: string;
  readingTime: number;
  isFeatured: boolean;
  isTrending: boolean;
  totalLikes: number;
  totalViews?: number;
  totalShares?: number;
  totalComments?: number;
  tags?: Array<{
    _id: string;
    tagName: string;
    slug: string;
    color?: string;
  }>;
  gallery?: MediaImage[];
  videos?: Array<{ _id: string; title: string; url: string }>;
}

export interface BlogContentBlock {
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'list' | string;
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
  items?: string[];
  level?: number;
}

export interface Testimonial {
  _id?: string;
  name?: string;
  message?: string;
  content?: string;
  profileImage?: string;
  designation?: string;
}

export interface HomeContent {
  featuredBlogs: HomeBlog[];
  latestBlogs: HomeBlog[];
  categories: BlogCategory[];
  featuredAuthors: BlogAuthor[];
  testimonials: Testimonial[];
}

export interface HomeResponse {
  success: boolean;
  message: string;
  data: {
    page: string;
    content: HomeContent;
  };
}
