export interface Category {
  _id: string;
  categoryName: string;
  slug: string;
  description: string;
  icon: string;
  bannerImage: string;
  totalBlogs?: number;
}
