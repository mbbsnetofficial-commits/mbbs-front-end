import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StudentProfileData {
  student_id: string;
  full_name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone_number: string;
  profile_picture: string | null;
  school_name: string | null;
  target_exam_year: number | null;
  batch: string | null;
  course: string | null;
  subscription_plan: string;
  subscription_expires_at: string | null;
  is_verified: boolean;
  is_institution_student: boolean;
  last_login: string | null;
}

export interface QodStreakData {
  current_streak: number;
  longest_streak: number;
  total_days_answered: number;
  correct_answer_count: number;
  last_answered_date: string | null;
  answered_today: boolean;
}

export interface PerformanceSummaryData {
  total_tests_started: number;
  total_tests_completed: number;
  total_questions_attempted: number;
  total_correct: number;
  total_wrong: number;
  total_skipped: number;
  total_score: number;
  total_practice_time_minutes: number;
  overall_accuracy_percentage: number;
}

export interface SubjectBreakdownData {
  subject: string;
  tests_taken: number;
  total_correct: number;
  total_wrong: number;
  total_skipped: number;
  accuracy: number;
}

export interface StudentDashboardSummaryResponse {
  status: string;
  message: string;
  data: {
    profile: StudentProfileData;
    streak: QodStreakData;
    performance_summary: PerformanceSummaryData;
    subject_breakdown: SubjectBreakdownData[];
    insights: any;
    recent_tests: any[];
    notifications: {
      unread_count: number;
      recent: any[];
    };
  };
}

export interface StudentDashboardStatsResponse {
  status: string;
  message: string;
  data: {
    current_streak: number;
    longest_streak: number;
    answered_today: boolean;
    tests_completed: number;
    total_questions_solved: number;
    overall_accuracy: number;
    practice_time_minutes: number;
  };
}

export interface StudentRecentActivityResponse {
  status: string;
  message: string;
  data: {
    activities: {
      id: string;
      type: string;
      title: string;
      status: string;
      score: number;
      accuracy: number;
      total_questions: number;
      timestamp: string;
    }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class StudentDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/student/dashboard`;

  getSummary(): Observable<StudentDashboardSummaryResponse> {
    return this.http.get<StudentDashboardSummaryResponse>(`${this.baseUrl}/summary`);
  }

  getStats(): Observable<StudentDashboardStatsResponse> {
    return this.http.get<StudentDashboardStatsResponse>(`${this.baseUrl}/stats`);
  }

  getPerformance(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/performance`);
  }

  getRecentActivity(page: number = 1, limit: number = 10): Observable<StudentRecentActivityResponse> {
    return this.http.get<StudentRecentActivityResponse>(`${this.baseUrl}/recent-activity?page=${page}&limit=${limit}`);
  }
}
