import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Country, enrichCountry } from '../models/country.model';
import { CseCountryQuestion, Question, QuestionOptionItem, StudentDetails } from '../models/question.model';
import { Recommendation } from '../models/recommendation.model';
import { University } from '../models/university.model';

@Injectable({
  providedIn: 'root'
})
export class CseService {
  private readonly baseUrl = environment.cseApiBaseUrl;

  // Mock initial dataset for rich interactive experience
  private readonly MOCK_COUNTRIES: Country[] = [
    {
      id: 'georgia',
      country_id: 'georgia',
      name: 'Georgia',
      code: 'GE',
      flagUrl: 'https://flagcdn.com/w80/ge.png',
      heroImage: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
      description: 'Affordable European medical education with 100% English medium programs.',
      popularCourses: ['MD General Medicine', 'Dentistry', 'Pharmacy'],
      averageTuitionFee: '$4,500 - $8,000 / yr',
      currency: 'USD',
      livingCost: '$350 / mo',
      language: 'English',
      duration: '6 Years',
      advantages: ['100% English Medium', 'High FMGE/NMC Pass Rate', 'EU Curriculum Standard', 'No Entrance Exam'],
      recognition: ['WHO', 'NMC', 'ECFMG', 'WFME'],
      isPopular: true,
      totalUniversities: 18,
      is_active: true,
      status: 'ACTIVE',
      display_order: 1
    },
    {
      id: 'kazakhstan',
      country_id: 'kazakhstan',
      name: 'Kazakhstan',
      code: 'KZ',
      flagUrl: 'https://flagcdn.com/w80/kz.png',
      heroImage: 'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=800&q=80',
      description: 'Modern state medical universities with low tuition and high FMGE coaching.',
      popularCourses: ['MD Physician', 'Stomatology', 'Pediatrics'],
      averageTuitionFee: '$3,800 - $5,500 / yr',
      currency: 'USD',
      livingCost: '$250 / mo',
      language: 'English',
      duration: '5 Years',
      advantages: ['Ultra Affordable', '5-Year Fast-Track', 'Indian Mess Facilities', 'Modern Simulated Labs'],
      recognition: ['WHO', 'NMC', 'ECFMG'],
      isPopular: true,
      totalUniversities: 12,
      is_active: true,
      status: 'ACTIVE',
      display_order: 2
    },
    {
      id: 'uk',
      country_id: 'uk',
      name: 'United Kingdom',
      code: 'GB',
      flagUrl: 'https://flagcdn.com/w80/gb.png',
      heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      description: 'World-renowned clinical training with prestigious GMC registration path.',
      popularCourses: ['MBChB Medicine', 'Biomedical Science', 'Surgery Spec'],
      averageTuitionFee: '$28,000 - $42,000 / yr',
      currency: 'GBP',
      livingCost: '$1,200 / mo',
      language: 'English',
      duration: '5 - 6 Years',
      advantages: ['GMC Approved', 'NHS Clinical Rotations', 'Global Recognition', 'Post-Study Work Visa'],
      recognition: ['GMC', 'WHO', 'ECFMG', 'NMC'],
      isPopular: true,
      totalUniversities: 34,
      is_active: true,
      status: 'ACTIVE',
      display_order: 3
    },
    {
      id: 'russia',
      country_id: 'russia',
      name: 'Russia',
      code: 'RU',
      flagUrl: 'https://flagcdn.com/w80/ru.png',
      heroImage: 'https://images.unsplash.com/photo-1513326718677-b964603b136d?auto=format&fit=crop&w=800&q=80',
      description: 'Longstanding medical heritage with top government universities and state subsidies.',
      popularCourses: ['General Medicine (MD)', 'Pediatrics', 'Dentistry'],
      averageTuitionFee: '$4,000 - $6,500 / yr',
      currency: 'USD',
      livingCost: '$300 / mo',
      language: 'English / Russian',
      duration: '6 Years',
      advantages: ['Government Universities', 'Advanced Research Centers', 'Low Living Costs', 'Subsidized Fees'],
      recognition: ['WHO', 'NMC', 'UNESCO', 'ECFMG'],
      isPopular: true,
      totalUniversities: 45,
      is_active: true,
      status: 'ACTIVE',
      display_order: 4
    },
    {
      id: 'philippines',
      country_id: 'philippines',
      name: 'Philippines',
      code: 'PH',
      flagUrl: 'https://flagcdn.com/w80/ph.png',
      heroImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
      description: 'US-based BS-MD curriculum with highest USMLE & FMGE success rates in Asia.',
      popularCourses: ['BS-MD Medicine', 'Dental Medicine'],
      averageTuitionFee: '$5,000 - $7,500 / yr',
      currency: 'USD',
      livingCost: '$300 / mo',
      language: 'English',
      duration: '5.5 Years',
      advantages: ['American MD Curriculum', '99% English Speaking Nation', 'USMLE Focused Training', 'Tropical Climate'],
      recognition: ['WHO', 'NMC', 'ECFMG', 'CHED'],
      isPopular: false,
      totalUniversities: 15,
      is_active: true,
      status: 'ACTIVE',
      display_order: 5
    },
    {
      id: 'uzbekistan',
      country_id: 'uzbekistan',
      name: 'Uzbekistan',
      code: 'UZ',
      flagUrl: 'https://flagcdn.com/w80/uz.png',
      heroImage: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=800&q=80',
      description: 'Rapidly emerging hub for international medical students with brand-new campuses.',
      popularCourses: ['MD General Medicine', 'Pediatrics'],
      averageTuitionFee: '$3,200 - $4,800 / yr',
      currency: 'USD',
      livingCost: '$200 / mo',
      language: 'English',
      duration: '6 Years',
      advantages: ['Safe Environment', 'High FMGE Results', 'Proximity to India', 'English Medium'],
      recognition: ['WHO', 'NMC', 'Ministry of Health'],
      isPopular: false,
      totalUniversities: 10,
      is_active: true,
      status: 'ACTIVE',
      display_order: 6
    },
    {
      id: 'inactive_test',
      country_id: 'inactive_test',
      name: 'Inactive Sample Country',
      code: 'XX',
      is_active: false,
      status: 'INACTIVE',
      display_order: 99
    }
  ];

  private readonly MOCK_QUESTIONS: Question[] = [
    {
      id: 'budget',
      step: 1,
      title: 'What is your annual tuition budget preference?',
      subtitle: 'Select the annual fee range that best aligns with your financial plan.',
      type: 'single-choice',
      required: true,
      options: [
        { id: 'b1', label: 'Under $5,000 / year', value: '5000', description: 'Ultra affordable government & state options', icon: 'sparkles' },
        { id: 'b2', label: '$5,000 - $10,000 / year', value: '10000', description: 'Optimal balance of quality, infrastructure & cost', icon: 'chart' },
        { id: 'b3', label: '$10,000 - $20,000 / year', value: '20000', description: 'Premium European & Asian medical institutes', icon: 'globe' },
        { id: 'b4', label: 'Above $20,000 / year', value: '50000', description: 'Top-tier UK, US, and Tier-1 International universities', icon: 'microscope' }
      ]
    },
    {
      id: 'academic',
      step: 2,
      title: 'What is your aggregate Class 12 Science percentage (PCB)?',
      subtitle: 'Physics, Chemistry, Biology aggregate percentage score.',
      type: 'single-choice',
      required: true,
      options: [
        { id: 'ac1', label: '85% and above', value: 85, description: 'Eligible for direct admission to top-ranked medical schools', badge: 'High Eligibility' },
        { id: 'ac2', label: '70% - 84%', value: 75, description: 'Eligible for 95%+ international medical programs', badge: 'Strong Profile' },
        { id: 'ac3', label: '50% - 69%', value: 60, description: 'Meets standard NMC & WHO international admission criteria', badge: 'Eligible' }
      ]
    },
    {
      id: 'neet_status',
      step: 3,
      title: 'Have you qualified for NEET UG?',
      subtitle: 'NEET qualification is mandatory for Indian citizens practicing back in India.',
      type: 'single-choice',
      required: true,
      options: [
        { id: 'ns1', label: 'Yes, Qualified (Score 200+)', value: 'qualified_high', description: 'Eligible for NMC approval & FMGE exam in India', icon: 'check' },
        { id: 'ns2', label: 'Yes, Just Qualified (Cut-off cleared)', value: 'qualified', description: 'Eligible for abroad medical university entry', icon: 'check' },
        { id: 'ns3', label: 'Appearing / Awaiting Results', value: 'appearing', description: 'Provisional admissions open with conditional offer letters', icon: 'clock' }
      ]
    },
    {
      id: 'preferences',
      step: 4,
      title: 'What are your top priorities for university selection?',
      subtitle: 'Select up to 3 factors that matter most to you.',
      type: 'multi-choice',
      required: false,
      options: [
        { id: 'p1', label: 'High FMGE / NExT Passing Rate', value: 'fmge', icon: 'flame' },
        { id: 'p2', label: '100% English Medium Curriculum', value: 'english', icon: 'globe' },
        { id: 'p3', label: 'USMLE Step 1 & 2 Coaching Available', value: 'usmle', icon: 'sparkles' },
        { id: 'p4', label: 'Indian Mess & Hostel Facilities', value: 'indian_food', icon: 'heart' },
        { id: 'p5', label: 'Hospital On-Campus Clinical Rotations', value: 'hospital', icon: 'activity' }
      ]
    }
  ];

  private readonly MOCK_UNIVERSITIES: University[] = [
    {
      id: 'tsmu-georgia',
      name: 'Tbilisi State Medical University',
      slug: 'tbilisi-state-medical-university',
      country: 'Georgia',
      countryCode: 'GE',
      city: 'Tbilisi',
      establishedYear: 1918,
      type: 'Public',
      logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581093458791-9f3c3250ac34?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&w=800&q=80'
      ],
      description: 'Tbilisi State Medical University is the premier medical university in Georgia with over 100 years of clinical academic excellence, approved by WHO, NMC, and ECFMG.',
      overviewHtml: `<p>Tbilisi State Medical University (TSMU) is the leading medical university in Tbilisi, Georgia. Founded in 1918, TSMU is one of the oldest and largest higher medical institutions in Georgia and the Caucasus region.</p><p>With over 7,000 undergraduate and postgraduate students, including 2,500 international students from 65 countries, TSMU offers premier European medical qualifications accredited worldwide.</p>`,
      ranking: { world: 3450, national: 2 },
      accreditations: ['WHO', 'NMC', 'ECFMG', 'WFME', 'GMC (UK)'],
      mediumOfInstruction: '100% English',
      durationYears: 6,
      tuitionFeePerYear: 8000,
      hostelFeePerYear: 1500,
      currency: 'USD',
      eligibilityCriteria: [
        '50% aggregate score in 10+2 (PCB)',
        'NEET UG qualified in current or past 2 years',
        'Valid Passport',
        'Minimum 17 years of age'
      ],
      fmgePassingRate: '68%',
      usmlePreparation: true,
      features: ['US Medical License (USMLE) Prep Cell', 'European Credit Transfer (ECTS)', '1000+ Bed Teaching Hospital', 'Indian Food Hostel'],
      admissionDeadline: '30th September 2026',
      feeBreakdown: [
        { year: 1, tuitionFee: 8000, hostelFee: 1500, otherExpenses: 1200, currency: 'USD' },
        { year: 2, tuitionFee: 8000, hostelFee: 1200, otherExpenses: 800, currency: 'USD' },
        { year: 3, tuitionFee: 8000, hostelFee: 1200, otherExpenses: 800, currency: 'USD' },
        { year: 4, tuitionFee: 8000, hostelFee: 1200, otherExpenses: 800, currency: 'USD' },
        { year: 5, tuitionFee: 8000, hostelFee: 1200, otherExpenses: 800, currency: 'USD' },
        { year: 6, tuitionFee: 8000, hostelFee: 1200, otherExpenses: 800, currency: 'USD' }
      ]
    },
    {
      id: 'ksmu-kazakhstan',
      name: 'Kazakh National Medical University',
      slug: 'kazakh-national-medical-university',
      country: 'Kazakhstan',
      countryCode: 'KZ',
      city: 'Almaty',
      establishedYear: 1930,
      type: 'Public',
      logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'
      ],
      description: 'KazNMU is the No.1 national university in Kazakhstan, offering top-notch medical training, modern clinical labs, and ultra-affordable fee packages.',
      ranking: { world: 2800, national: 1 },
      accreditations: ['WHO', 'NMC', 'ECFMG', 'Ministry of Education KZ'],
      mediumOfInstruction: '100% English',
      durationYears: 5,
      tuitionFeePerYear: 5200,
      hostelFeePerYear: 800,
      currency: 'USD',
      eligibilityCriteria: [
        '50% in 10+2 (Physics, Chemistry, Biology)',
        'NEET UG qualified',
        'Valid Passport'
      ],
      fmgePassingRate: '62%',
      usmlePreparation: true,
      features: ['5-Year MD Program', 'Dedicated Indian Student Welfare Cell', 'State-of-the-Art Robotic Surgery Lab', 'Affordable Living'],
      admissionDeadline: '15th October 2026'
    },
    {
      id: 'kzn-russia',
      name: 'Kazan Federal University',
      slug: 'kazan-federal-university',
      country: 'Russia',
      countryCode: 'RU',
      city: 'Kazan',
      establishedYear: 1804,
      type: 'Public',
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80'
      ],
      description: 'One of Russia’s oldest and most prestigious federal universities with high NMC clearance rates and world-class research infrastructure.',
      ranking: { world: 396, national: 3 },
      accreditations: ['WHO', 'NMC', 'ECFMG', 'Ministry of Health Russia'],
      mediumOfInstruction: 'English Medium',
      durationYears: 6,
      tuitionFeePerYear: 5800,
      hostelFeePerYear: 600,
      currency: 'USD',
      eligibilityCriteria: ['50% PCB Score', 'NEET UG Pass'],
      fmgePassingRate: '59%',
      usmlePreparation: false,
      features: ['World Top 400 University', 'Simulated Surgical Training Center', 'Safe Campus'],
      admissionDeadline: '31st August 2026'
    },
    {
      id: 'uoned-uk',
      name: 'University of Edinburgh Medical School',
      slug: 'university-of-edinburgh-medical-school',
      country: 'United Kingdom',
      countryCode: 'GB',
      city: 'Edinburgh',
      establishedYear: 1726,
      type: 'Public',
      logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
      gallery: ['https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80'],
      description: 'Top-tier global medical university with NHS hospital placements, cutting-edge research laboratories, and direct GMC registration.',
      ranking: { world: 22, national: 4 },
      accreditations: ['GMC', 'WHO', 'ECFMG', 'NMC'],
      mediumOfInstruction: 'English',
      durationYears: 5,
      tuitionFeePerYear: 38000,
      hostelFeePerYear: 8000,
      currency: 'USD',
      eligibilityCriteria: ['90%+ PCB score', 'UCAT Exam Passed', 'IELTS 7.5+'],
      fmgePassingRate: '92%',
      usmlePreparation: true,
      features: ['NHS Clinical Placements', 'Global Top 25 Ranking', 'GMC Registration Track'],
      admissionDeadline: '15th October 2026'
    }
  ];

  constructor(private readonly http: HttpClient) {}

  getCountries(searchQuery?: string): Observable<Country[]> {
    // Hits GET /api/v1/cse/countries or environment baseUrl + /cse/countries
    const url = `${this.baseUrl}/cse/countries`;
    let params = new HttpParams();
    if (searchQuery) {
      params = params.set('search', searchQuery);
    }

    return this.http.get<any>(url, { params }).pipe(
      map(res => {
        let rawList: any[] = [];
        if (Array.isArray(res)) rawList = res;
        else if (res && Array.isArray(res.data)) rawList = res.data;
        else rawList = this.MOCK_COUNTRIES;

        return rawList.map(c => enrichCountry(c));
      }),
      catchError(() => {
        // Fallback to local mock filter
        let list = this.MOCK_COUNTRIES;
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            (c.description && c.description.toLowerCase().includes(q))
          );
        }
        return of(list.map(c => enrichCountry(c)));
      })
    );
  }

  getCountryById(id: string): Observable<Country | undefined> {
    const url = `${this.baseUrl}/cse/countries/${encodeURIComponent(id)}`;
    return this.http.get<Country>(url).pipe(
      catchError(() => of(this.MOCK_COUNTRIES.find(c => c.id === id || c.country_id === id || c.code.toLowerCase() === id.toLowerCase())))
    );
  }

  getQuestions(): Observable<Question[]> {
    const url = `${this.baseUrl}/cse/questions`;
    return this.http.get<Question[]>(url).pipe(
      catchError(() => of(this.MOCK_QUESTIONS))
    );
  }

  getCountryQuestions(countryId: string): Observable<CseCountryQuestion[]> {
    const url = `${this.baseUrl}/cse/countries/questions`;
    const payload = { country_id: countryId };

    return this.http.post<any>(url, payload).pipe(
      map(res => {
        let rawList: any[] = [];
        if (Array.isArray(res)) {
          rawList = res;
        } else if (res && res.data && Array.isArray(res.data.questions)) {
          rawList = res.data.questions;
        } else if (res && Array.isArray(res.data)) {
          rawList = res.data;
        } else if (res && Array.isArray(res.questions)) {
          rawList = res.questions;
        }

        if (!rawList || rawList.length === 0) {
          rawList = this.getMockCountryQuestions(countryId);
        }

        const normalized = rawList.map(q => this.normalizeQuestion(q));
        return normalized.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }),
      catchError((err) => {
        console.error('Error fetching country questions:', err);
        const mock = this.getMockCountryQuestions(countryId).map(q => this.normalizeQuestion(q));
        return of(mock.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      })
    );
  }

  private normalizeQuestion(q: any): CseCountryQuestion {
    if (!q) return q;

    const questionText = q.question || q.title || q.question_text || '';

    let type = q.type || 'SINGLE_SELECT';
    const typeUpper = String(type).toUpperCase().replace(/-/g, '_');
    if (typeUpper === 'SINGLE_SELECT' || typeUpper === 'SINGLE_CHOICE' || typeUpper === 'SELECT') {
      type = 'SINGLE_SELECT';
    } else if (typeUpper === 'NUMBER' || typeUpper === 'RANGE' || typeUpper === 'INTEGER' || typeUpper === 'FLOAT') {
      type = 'NUMBER';
    } else if (typeUpper === 'BOOLEAN' || typeUpper === 'BOOL') {
      type = 'BOOLEAN';
    } else if (typeUpper === 'MULTI_SELECT' || typeUpper === 'MULTI_CHOICE' || typeUpper === 'CHECKBOX') {
      type = 'MULTI_SELECT';
    } else if (typeUpper === 'TEXT' || typeUpper === 'STRING' || typeUpper === 'TEXTAREA') {
      type = 'TEXT';
    } else if (typeUpper === 'SUBJECT_MARKS' || typeUpper === 'SUBJECTS_MARKS' || typeUpper === 'SUBJECT_MARK' || typeUpper === 'MARKS') {
      type = 'SUBJECT_MARKS';
    } else {
      type = typeUpper as any;
    }

    let rawOptions = q.options || q.choices || q.select_options;
    if (typeof rawOptions === 'string') {
      try {
        rawOptions = JSON.parse(rawOptions);
      } catch {
        rawOptions = [];
      }
    }

    const options: QuestionOptionItem[] = Array.isArray(rawOptions)
      ? rawOptions.map((opt: any, idx: number) => {
          if (opt === null || opt === undefined) return { label: '', value: '' };
          if (typeof opt === 'string' || typeof opt === 'number' || typeof opt === 'boolean') {
            return { label: String(opt), value: String(opt) };
          }
          const label = String(opt.label || opt.name || opt.text || opt.title || opt.value || `Option ${idx + 1}`);
          const value = opt.value !== undefined ? opt.value : (opt.id !== undefined ? opt.id : label);
          return {
            label,
            value,
            description: opt.description,
            badge: opt.badge,
            icon: opt.icon
          };
        })
      : [];

    return {
      _id: q._id || q.id,
      id: q._id || q.id,
      country_id: q.country_id,
      question_key: q.question_key || q.key || q.id || `q_${q.order ?? 1}`,
      question: questionText,
      title: questionText,
      question_text: questionText,
      subtitle: q.subtitle,
      type: type as any,
      required: q.required !== false,
      order: Number(q.order ?? 0),
      validation: q.validation ? {
        min: q.validation.min !== undefined ? Number(q.validation.min) : undefined,
        max: q.validation.max !== undefined ? Number(q.validation.max) : undefined
      } : undefined,
      options,
      placeholder: q.placeholder,
      status: q.status || 'ACTIVE'
    };
  }

  private getMockCountryQuestions(countryId: string): CseCountryQuestion[] {
    return [
      {
        _id: 'q1',
        country_id: countryId,
        question_key: 'academic_board',
        question: 'Which Class 12 board or equivalent did you complete?',
        title: 'Which Academic Board did you complete 12th from?',
        subtitle: 'Select your senior secondary education board.',
        type: 'SINGLE_SELECT',
        required: true,
        order: 1,
        options: [
          { label: 'CBSE', value: 'CBSE' },
          { label: 'CISCE', value: 'CISCE' },
          { label: 'State Board', value: 'STATE_BOARD' },
          { label: 'IB', value: 'IB' },
          { label: 'Other', value: 'OTHER' }
        ]
      },
      {
        _id: 'q2',
        country_id: countryId,
        question_key: 'pcb_percentage',
        question: 'What is your Physics, Chemistry and Biology percentage?',
        title: 'What is your Class 12th PCB Aggregate Percentage?',
        subtitle: 'Enter your aggregate score in Physics, Chemistry, and Biology (0% - 100%).',
        type: 'NUMBER',
        required: true,
        order: 2,
        validation: { min: 0, max: 100 },
        placeholder: 'e.g. 82'
      },
      {
        _id: 'q3',
        country_id: countryId,
        question_key: 'english_proficiency',
        question: 'Can you study a medical curriculum fully in English?',
        title: 'Can you study a medical curriculum fully in English?',
        type: 'BOOLEAN',
        required: true,
        order: 3
      }
    ];
  }  getRecommendations(payload: any): Observable<{ sessionId?: string; country?: string; totalEvaluated?: number; recommendations: Recommendation[] }> {
    const url = `${this.baseUrl}/cse/recommendations`;

    return this.http.post<any>(url, payload).pipe(
      map(res => {
        let list: any[] = [];
        let countryName = '';
        let sessionId = '';
        let totalEvaluated = 0;

        if (res && res.data) {
          sessionId = res.data.session_id || '';
          countryName = res.data.country || '';
          totalEvaluated = Number(res.data.total_universities_evaluated ?? 0);

          if (Array.isArray(res.data.universities_that_fit)) {
            list = res.data.universities_that_fit;
          } else if (Array.isArray(res.data.recommendations)) {
            list = res.data.recommendations;
          } else if (Array.isArray(res.data)) {
            list = res.data;
          }
        } else if (res && Array.isArray(res.universities_that_fit)) {
          list = res.universities_that_fit;
        } else if (Array.isArray(res)) {
          list = res;
        }

        const recommendations = list.map((item, idx) => this.mapToRecommendation(item, countryName, idx));

        return {
          sessionId,
          country: countryName,
          totalEvaluated,
          recommendations
        };
      }),
      catchError(err => {
        console.error('API Error in getRecommendations, using fallback matches:', err);
        const fallbackRecs: Recommendation[] = [
          {
            id: 'rec-1',
            universityId: 'tsmu-georgia',
            universityName: 'Tbilisi State Medical University',
            universityLogo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
            universityImage: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
            country: 'Georgia',
            countryCode: 'GE',
            city: 'Tbilisi',
            matchScore: 94,
            matchReasons: ['100% English Medium', 'High FMGE Passing Rate', 'WHO & NMC Recognized'],
            keyHighlights: ['English Medium', 'EU Standard Curriculum', 'ECTS Credits'],
            annualTuition: '$8,000 / yr',
            estimatedTotalCost: '$48,000 (6-Year Package)',
            rank: 1,
            badge: 'Top Match',
            status: 'recommended',
            establishedYear: 1918,
            mediumOfInstruction: '100% English',
            durationYears: 6,
            fmgePassingRate: '68%'
          },
          {
            id: 'rec-2',
            universityId: 'ksmu-kazakhstan',
            universityName: 'Kazakh National Medical University',
            universityLogo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=200&q=80',
            universityImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
            country: 'Kazakhstan',
            countryCode: 'KZ',
            city: 'Almaty',
            matchScore: 89,
            matchReasons: ['Affordable Tuition', '5-Year Fast-Track MD', 'Indian Mess On-Campus'],
            keyHighlights: ['Ultra Affordable', 'Robotic Surgery Lab', '5-Year MD'],
            annualTuition: '$5,200 / yr',
            estimatedTotalCost: '$26,000 (5-Year Package)',
            rank: 2,
            badge: 'Best Budget',
            status: 'recommended',
            establishedYear: 1930,
            mediumOfInstruction: '100% English',
            durationYears: 5,
            fmgePassingRate: '62%'
          }
        ];
        return of({
          sessionId: 'fallback-session-1',
          country: 'Georgia',
          totalEvaluated: 18,
          recommendations: fallbackRecs
        });
      })
    );
  }

  private mapToRecommendation(item: any, defaultCountryName: string = '', idx: number = 0): Recommendation {
    const uni = item.university || {};
    const uniId = uni.id || uni._id || item.university_id || item.universityId || item._id || item.id || `uni-${idx + 1}`;
    const uniName = uni.name || item.university_name || item.universityName || 'Medical University';
    const uniLogo = uni.logo || item.university_logo || item.logo || 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80';
    const uniImage = uni.banner_image || uni.cover_image || uni.coverImage || item.university_image || item.coverImage || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80';
    const city = uni.city || item.city || '';
    const country = uni.country || item.country || defaultCountryName || '';
    const countryCode = uni.country_code || uni.countryCode || item.country_code || item.countryCode || '';
    const matchScore = item.match_score ?? item.matchScore ?? item.score ?? 85;
    const matchReasons = Array.isArray(item.match_reasons) ? item.match_reasons : (Array.isArray(item.matchReasons) ? item.matchReasons : []);

    let keyHighlights: string[] = [];
    if (Array.isArray(item.key_highlights)) {
      keyHighlights = item.key_highlights;
    } else if (Array.isArray(item.keyHighlights)) {
      keyHighlights = item.keyHighlights;
    } else if (Array.isArray(uni.medium_of_instruction)) {
      keyHighlights = uni.medium_of_instruction.map((m: string) => `${m} Medium`);
    }

    let annualTuition = '$5,000 / yr';
    if (uni.annual_tuition_fee_usd !== undefined && uni.annual_tuition_fee_usd !== null) {
      annualTuition = uni.annual_tuition_fee_usd > 0 ? `$${uni.annual_tuition_fee_usd.toLocaleString()} / yr` : 'Tuition on Request';
    } else if (item.annual_tuition || item.annualTuition) {
      annualTuition = item.annual_tuition || item.annualTuition;
    }

    let estimatedTotalCost = '';
    if (item.total_package_usd !== undefined && item.total_package_usd > 0) {
      estimatedTotalCost = `$${item.total_package_usd.toLocaleString()} (Total Package)`;
    } else if (item.estimated_total_cost || item.estimatedTotalCost) {
      estimatedTotalCost = item.estimated_total_cost || item.estimatedTotalCost;
    } else {
      estimatedTotalCost = 'Package details on consultation';
    }

    return {
      id: String(item._id || item.id || uniId),
      universityId: String(uniId),
      universityName: String(uniName),
      universityLogo: String(uniLogo),
      universityImage: String(uniImage),
      country: String(country),
      countryCode: String(countryCode),
      city: String(city),
      matchScore: Number(matchScore),
      matchReasons,
      keyHighlights,
      annualTuition,
      estimatedTotalCost,
      rank: Number(item.rank || uni.world_rank || idx + 1),
      badge: item.eligibility_status || (idx === 0 ? 'Top Match' : undefined),
      status: item.is_eligible === false ? 'reach' : 'recommended',
      establishedYear: uni.established_year || item.established_year,
      mediumOfInstruction: Array.isArray(uni.medium_of_instruction) ? uni.medium_of_instruction.join(', ') : (uni.medium_of_instruction || item.mediumOfInstruction),
      durationYears: uni.duration_years || item.duration_years,
      fmgePassingRate: uni.fmge_passing_rate || item.fmge_passing_rate
    };
  }

  getUniversities(countryCode?: string): Observable<University[]> {
    const url = `${this.baseUrl}/cse/universities`;
    let params = new HttpParams();
    if (countryCode) {
      params = params.set('country', countryCode);
    }

    return this.http.get<University[]>(url, { params }).pipe(
      catchError(() => {
        if (countryCode) {
          return of(this.MOCK_UNIVERSITIES.filter(u => u.countryCode.toLowerCase() === countryCode.toLowerCase()));
        }
        return of(this.MOCK_UNIVERSITIES);
      })
    );
  }

  getRecommendationById(id: string): Observable<Recommendation | undefined> {
    const url = `${this.baseUrl}/cse/recommendations/${encodeURIComponent(id)}`;
    return this.http.get<Recommendation>(url).pipe(
      catchError(() => of(undefined))
    );
  }

  getUniversityById(id: string): Observable<University | undefined> {
    const url = `${this.baseUrl}/cse/universities/${encodeURIComponent(id)}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        let uniData: any = null;
        if (res && res.data && res.data.university) {
          uniData = {
            ...res.data.university,
            courses: res.data.mbbs_courses || res.data.courses
          };
        } else if (res && res.data) {
          uniData = res.data;
        } else if (res && res.university) {
          uniData = res.university;
        } else {
          uniData = res;
        }

        if (!uniData) return undefined;

        return {
          id: String(uniData._id || uniData.id || id),
          name: uniData.name || 'University Profile',
          slug: uniData.slug || id,
          country: uniData.country || '',
          countryCode: uniData.country_code || uniData.countryCode || '',
          city: uniData.city || '',
          establishedYear: uniData.established_year || uniData.establishedYear || 1900,
          type: uniData.type || 'Public',
          logo: uniData.logo || uniData.logo_url || 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
          coverImage: uniData.cover_image || uniData.coverImage || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
          gallery: Array.isArray(uniData.gallery) ? uniData.gallery : [],
          description: uniData.description || '',
          overviewHtml: uniData.overview_html || uniData.overviewHtml || uniData.description || '',
          ranking: uniData.ranking || { world: 1000, national: 1 },
          accreditations: Array.isArray(uniData.accreditations) ? uniData.accreditations : [],
          mediumOfInstruction: uniData.medium_of_instruction || uniData.mediumOfInstruction || 'English',
          durationYears: uniData.duration_years || uniData.durationYears || 6,
          tuitionFeePerYear: uniData.tuition_fee_per_year || uniData.tuitionFeePerYear || 5000,
          hostelFeePerYear: uniData.hostel_fee_per_year || uniData.hostelFeePerYear || 1000,
          currency: uniData.currency || 'USD',
          eligibilityCriteria: Array.isArray(uniData.eligibility_criteria || uniData.eligibilityCriteria) ? (uniData.eligibility_criteria || uniData.eligibilityCriteria) : [],
          fmgePassingRate: uniData.fmge_passing_rate || uniData.fmgePassingRate || '65%',
          usmlePreparation: !!(uniData.usmle_preparation || uniData.usmlePreparation),
          features: Array.isArray(uniData.features) ? uniData.features : [],
          admissionDeadline: uniData.admission_deadline || uniData.admissionDeadline || 'Rolling Admissions'
        } as University;
      }),
      catchError(() => of(undefined))
    );
  }
}
