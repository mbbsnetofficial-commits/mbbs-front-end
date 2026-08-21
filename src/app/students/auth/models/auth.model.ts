export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  data: {
    phoneNumber: string;
    expiresInMinutes: number;
  };
}

export interface VerifyRegisterOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface LoginOtpRequest {
  phoneNumber: string;
}

export interface LoginOtpResponse {
  status: string;
  message: string;
  data: {
    phoneNumber: string;
    expiresInMinutes: number;
  };
}

export interface VerifyLoginOtpRequest {
  phoneNumber: string;
  otp: string;
}

export type AuthOtpPurpose = 'login' | 'register' | 'password-reset';

export interface ResendOtpRequest {
  phoneNumber: string;
  purpose?: AuthOtpPurpose;
}

export interface ResendOtpResponse {
  status: string;
  message: string;
  data?: {
    phoneNumber: string;
    expiresInMinutes: number;
  };
  retry_after_seconds?: number;
}

export interface AuthUser {
  id?: string;
  student_id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  authProviders?: string[];
}

export interface AuthSuccessResponse {
  status: string;
  message: string;
  data: {
    student_id?: string;
    user?: AuthUser;
    accessToken: string;
    authtoken?: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  status?: string;
  message?: string;
  data: {
    accessToken: string;
    authtoken?: string;
    refreshToken: string;
  };
}

export interface AuthMutationResponse {
  status?: string;
  success?: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ForgotPasswordResponse {
  status: string;
  message: string;
  data: {
    deliveryStatus?: string;
    expiresInMinutes: number;
  };
}

export interface VerifyResetOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  status: string;
  message?: string;
  data: {
    resetToken: string;
    expiresInMinutes: number;
  };
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  status: string;
  message: string;
}

// Backward compatibility interfaces
export interface LoginRequest {
  email?: string;
  password?: string;
  phoneNumber?: string;
}

export interface LoginResponse {
  success?: boolean;
  status?: string;
  message: string;
  data?: {
    accessToken: string;
    authtoken?: string;
    refreshToken: string;
    student_id?: string;
    user?: AuthUser;
    id?: string;
    phoneNumber?: string;
    expiresInMinutes?: number;
  };
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}
