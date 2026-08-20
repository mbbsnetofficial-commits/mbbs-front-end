import { Author } from './author.model';
import { Blog } from './blog.model';
import { Category } from './category.model';
import { Pagination } from './pagination.model';

export interface Breadcrumb {
  title: string;
  slug: string;
  url: string;
}

export interface HomeContent {
  featuredBlogs: Blog[];
  latestBlogs: Blog[];
  categories: Category[];
  featuredAuthors: Author[];
}

export interface HomePageData {
  page: string;
  content: HomeContent;
  related: Blog[];
  breadcrumbs: Breadcrumb[];
  pagination: Pagination;
}

export interface PageHomeResponse {
  success: boolean;
  message: string;
  data: HomePageData;
}
