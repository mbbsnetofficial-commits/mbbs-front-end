/* ── Comment data returned by API ── */
export interface Comment {
  id: string;
  student_id: string;
  commenterName: string;
  profilePicture: string;
  comment: string;
  isEdited: boolean;
  totalLikes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ── Blog stub inside comments response ── */
export interface CommentBlog {
  id: string;
  slug: string;
  title: string;
}

/* ── Pagination ── */
export interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ── GET /comments response ── */
export interface CommentListData {
  blog: CommentBlog;
  comments: Comment[];
  pagination: CommentPagination;
}

export interface CommentListResponse {
  success: boolean;
  message: string;
  data: CommentListData;
}

/* ── POST / PATCH response (single comment) ── */
export interface CommentSingleResponse {
  success: boolean;
  message: string;
  data: Comment;
}

/* ── DELETE comment response ── */
export interface CommentDeleteResponse {
  success: boolean;
  message: string;
}

/* ── Like / Unlike response ── */
export interface CommentLikeData {
  commentId: string;
  totalLikes: number;
  isLiked: boolean;
}

export interface CommentLikeResponse {
  success: boolean;
  message: string;
  data: CommentLikeData;
}
