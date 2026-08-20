import { Author } from './author.model';
import { Category } from './category.model';
import { BlogContent } from './content-block.model';
import { Faq } from './faq.model';
import { FeaturedImage } from './featured-image.model';
import { GalleryImage } from './gallery.model';
import { Seo } from './seo.model';
import { Tag } from './tag.model';
import { Video } from './video.model';

export interface BlogMetadata {
  source: string;
}

export interface Blog {
  _id: string;
  title: string;
  blogCode: string;
  slug: string;
  shortDescription?: string;
  excerpt?: string;
  content?: BlogContent;
  blogType?: string;
  template?: string;
  category?: Category | null;
  tags?: Tag[];
  author?: Author | null;
  featuredImage?: FeaturedImage | null;
  gallery?: GalleryImage[];
  videos?: Video[];
  status?: string;
  visibility?: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPinned?: boolean;
  readingTime?: number;
  totalViews?: number;
  totalLikes?: number;
  totalShares?: number;
  totalComments: number;
  seo?: Seo;
  faqs?: Faq[];
  relatedBlogs?: Blog[];
  metadata?: BlogMetadata;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
