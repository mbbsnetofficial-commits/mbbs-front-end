export interface UniversityLoginRequest {
  email: string;
  password: string;
}

export interface UniversityIdentity {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  email: string;
  role: string;
  country: string;
  city: string;
  logo?: string;
}

export interface UniversityAuthData {
  token: string;
  university: UniversityIdentity;
}

export interface UniversityAuthResponse {
  success: boolean;
  message?: string;
  data?: UniversityAuthData;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface UniversityLogoutResponse {
  success: boolean;
  message: string;
  data?: {
    organizationId: string;
    revokedAt: string;
  };
}
