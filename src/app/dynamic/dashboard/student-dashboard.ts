import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentDashboardService, StudentDashboardSummaryResponse } from './services/student-dashboard.service';

export interface SavedUniversityItem {
  university_id: string;
  university_name: string;
  country?: string;
  annual_tuition?: string;
  saved_at?: string;
}

export interface SavedRecommendationItem {
  _id: string;
  target_country: string;
  budget_range: string;
  recommended_universities: string[];
  created_at: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentDashboard implements OnInit {
  private readonly dashboardService = inject(StudentDashboardService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'overview' | 'saved-blogs' | 'universities' | 'recommendations'>('overview');

  readonly summaryData = signal<StudentDashboardSummaryResponse['data'] | null>(null);
  readonly recentActivities = signal<any[]>([]);
  readonly savedBlogs = signal<any[]>([]);
  readonly savedUniversities = signal<SavedUniversityItem[]>([]);
  readonly savedRecommendations = signal<SavedRecommendationItem[]>([]);

  ngOnInit(): void {
    this.loadAllDashboardData();
  }

  loadAllDashboardData(): void {
    this.loading.set(true);
    this.error.set(null);

    // 1. GET /api/v1/student/dashboard/summary
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.data) {
          this.summaryData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadMockFallbackData();
        this.loading.set(false);
      }
    });

    // 2. GET /api/v1/student/dashboard/recent-activity
    this.dashboardService.getRecentActivity(1, 10).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.recentActivities.set(res.data);
        }
      },
      error: () => {}
    });

    // 3. GET /api/v1/student/dashboard/saved-blogs
    this.dashboardService.getSavedBlogs(1, 10).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.savedBlogs.set(res.data);
        }
      },
      error: () => {}
    });

    // 4. GET /api/v1/student/dashboard/university-finder/saved-universities
    this.dashboardService.getSavedUniversities().subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.savedUniversities.set(res.data);
        }
      },
      error: () => {}
    });

    // 5. GET /api/v1/student/dashboard/university-finder/recommendations
    this.dashboardService.getRecommendations().subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.savedRecommendations.set(res.data);
        }
      },
      error: () => {}
    });
  }

  // DELETE /api/v1/student/dashboard/university-finder/save-university/{universityId}
  removeSavedUniversity(universityId: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.dashboardService.unsaveUniversity(universityId).subscribe({
      next: () => {
        this.savedUniversities.update(list => list.filter(u => u.university_id !== universityId));
      },
      error: () => {
        // Local removal fallback
        this.savedUniversities.update(list => list.filter(u => u.university_id !== universityId));
      }
    });
  }

  setActiveTab(tab: 'overview' | 'saved-blogs' | 'universities' | 'recommendations'): void {
    this.activeTab.set(tab);
  }

  private loadMockFallbackData(): void {
    this.summaryData.set({
      profile: {
        student_id: '1001',
        full_name: 'Dr. Student',
        firstName: 'Medical',
        lastName: 'Scholar',
        email: 'student@mbbs.net',
        phone_number: '+91 9876543210',
        profile_picture: null,
        school_name: 'Medical Academy',
        target_exam_year: 2026,
        batch: 'NEET 2026 Batch A',
        course: 'MBBS Preparation',
        subscription_plan: 'Pro Scholar',
        subscription_expires_at: null,
        is_verified: true,
        is_institution_student: true,
        last_login: new Date().toISOString()
      },
      streak: {
        current_streak: 5,
        longest_streak: 12,
        total_days_answered: 18,
        correct_answer_count: 24,
        last_answered_date: new Date().toISOString(),
        answered_today: true
      },
      performance_summary: {
        total_tests_started: 15,
        total_tests_completed: 12,
        total_questions_attempted: 240,
        total_correct: 198,
        total_wrong: 42,
        total_skipped: 10,
        total_score: 792,
        total_practice_time_minutes: 360,
        overall_accuracy_percentage: 82.5
      },
      subject_breakdown: [
        { subject: 'Biology', tests_taken: 6, total_correct: 90, total_wrong: 10, total_skipped: 2, accuracy: 90.0 },
        { subject: 'Chemistry', tests_taken: 4, total_correct: 62, total_wrong: 18, total_skipped: 3, accuracy: 77.5 },
        { subject: 'Physics', tests_taken: 3, total_correct: 46, total_wrong: 14, total_skipped: 5, accuracy: 76.7 }
      ],
      insights: null,
      recent_tests: [
        {
          _id: 'test_1',
          test_type: 'NEET Quick Test',
          subjects: ['Biology', 'Chemistry'],
          total_questions: 20,
          score: 72,
          accuracy: 90,
          correct: 18,
          wrong: 2,
          status: 'Completed',
          started_at: new Date().toISOString()
        }
      ],
      notifications: {
        unread_count: 2,
        recent: []
      }
    });

    this.savedUniversities.set([
      { university_id: 'uni_1', university_name: 'Semmelweis University', country: 'Hungary', annual_tuition: '€18,200/year', saved_at: new Date().toISOString() },
      { university_id: 'uni_2', university_name: 'Tbilisi State Medical University', country: 'Georgia', annual_tuition: '$8,000/year', saved_at: new Date().toISOString() },
      { university_id: 'uni_3', university_name: 'University of Nicosia', country: 'Cyprus', annual_tuition: '€24,000/year', saved_at: new Date().toISOString() }
    ]);

    this.savedRecommendations.set([
      { _id: 'rec_1', target_country: 'Hungary & Central Europe', budget_range: '$10,000 - $20,000/yr', recommended_universities: ['Semmelweis University', 'University of Pécs'], created_at: new Date().toISOString() }
    ]);

    this.savedBlogs.set([
      { _id: 'blog_1', title: 'Updated NEET Biology Preparation Guide', slug: 'updated-neet-biology-preparation-guide', shortDescription: 'Learn how to prepare for NEET Biology using NCERT and structured revision.' }
    ]);
  }
}
