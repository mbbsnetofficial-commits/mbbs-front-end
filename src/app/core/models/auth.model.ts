export interface RegisterRequest {

  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    student_id?: string;
  };
}

export interface AuthMutationResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}
