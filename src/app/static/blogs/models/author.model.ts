export interface Author {
  _id: string;
  fullName: string;
  slug: string;
  designation: string;
  bio: string;
  profileImage: string;
  totalBlogs?: number;
}
