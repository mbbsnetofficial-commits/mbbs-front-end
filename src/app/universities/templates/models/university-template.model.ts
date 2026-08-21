export interface UniversityTemplate {
  _id: string;
  organizationId?: string;
  name: string;
  subject: string;
  message: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplatePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UniversityTemplateListResponse {
  success: boolean;
  message?: string;
  data:
    | UniversityTemplate[]
    | {
        items: UniversityTemplate[];
        pagination?: TemplatePagination;
      };
}

export interface SingleTemplateResponse {
  success: boolean;
  message?: string;
  data: UniversityTemplate;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  message: string;
}

export interface CreateTemplateResponse {
  success: boolean;
  message?: string;
  data: UniversityTemplate;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  message?: string;
}

export interface UpdateTemplateResponse {
  success: boolean;
  message?: string;
  data: UniversityTemplate;
}

export interface DeleteTemplateData {
  deleted: boolean;
  templateId: string;
}

export interface DeleteTemplateResponse {
  success: boolean;
  message: string;
  data: DeleteTemplateData;
}
