import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../shared/ui/icon/icon';
import { CseService } from '../../../shared/services/cse.service';
import { GroupedCountryUniversities } from '../../../shared/models/admin-university.model';

export interface MegaMenuLink {
  label: string;
  href?: string;
  routerLink?: string;
  isPortal?: boolean;
}

export interface MegaMenuSection {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  links: MegaMenuLink[];
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  /**
   * Isolated Hero Media Configuration (Phase 1)
   * Easily replace with final MBBS.NET brand assets without modifying template structure.
   */
  protected readonly heroVideoUrl = '/assets/videos/218955.mp4';

  protected readonly heroVideo = viewChild<ElementRef<HTMLVideoElement>>('heroVideo');
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cseService = inject(CseService);
  private videoInitialized = false;

  protected readonly isScrolled = signal(false);
  protected readonly mobileNavOpen = signal(false);

  // Grouped Universities from API (Project B architecture)
  protected readonly groupedUniversities = signal<GroupedCountryUniversities[]>([]);
  protected readonly loadingUniversities = signal(false);
  protected readonly universitiesError = signal<string | null>(null);
  protected readonly activeCountryTab = signal<string | null>(null);

  // Scroll-driven Journey Section (Section 2)
  protected readonly activeJourneyStep = signal<number>(1);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.initHeroVideo();
        this.loadGroupedUniversities();
        this.updateJourneyProgress();
      });
    }
  }

  public loadGroupedUniversities(): void {
    if (this.groupedUniversities().length > 0 || this.loadingUniversities()) {
      return;
    }
    this.loadingUniversities.set(true);
    this.universitiesError.set(null);
    this.cseService.getGroupedUniversities().subscribe({
      next: (data) => {
        const groups = data || [];
        this.groupedUniversities.set(groups);
        if (groups.length > 0 && !this.activeCountryTab()) {
          this.activeCountryTab.set(groups[0].countryId);
        }
        this.loadingUniversities.set(false);
      },
      error: (err) => {
        console.error('Failed to load universities:', err);
        this.universitiesError.set('Unable to load universities');
        this.loadingUniversities.set(false);
      },
    });
  }

  protected selectCountryTab(countryId: string | null): void {
    this.activeCountryTab.set(countryId);
  }

  protected getFlagUrl(countryCode: string): string {
    if (!countryCode) return '';
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  }

  protected onFlagError(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  protected onVideoCanPlay(): void {
    this.initHeroVideo();
  }

  private initHeroVideo(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const videoEl = this.heroVideo()?.nativeElement;
    if (!videoEl) return;

    videoEl.muted = true;
    videoEl.defaultMuted = true;

    if (videoEl.paused && typeof videoEl.play === 'function') {
      try {
        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Autoplay policy or media loading pending, retry on user interaction or next readyState
          });
        }
      } catch {
        // Environment does not support play()
      }
    }
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 30);
      this.updateJourneyProgress();
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (typeof window !== 'undefined') {
      this.updateJourneyProgress();
    }
  }

  /**
   * Scroll-Driven Progression for Section 2 (Your Journey)
   * Progressive reveal:
   * Step 0: Enter section (intro only, cards hidden)
   * Step 1: 01 EXPLORE active
   * Step 2: 02 PREPARE active (lime accent, 01 dimmed)
   * Step 3: 03 APPLY active (01 & 02 dimmed)
   */
  protected updateJourneyProgress(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') return;
    const section = document.getElementById('guidance');
    if (!section) return;

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const stages = section.querySelectorAll<HTMLElement>('.pathway-stage');
      if (!stages.length) return;
      const triggerY = window.innerHeight * 0.58;
      let currentActive = 1;
      stages.forEach((stage, idx) => {
        const rect = stage.getBoundingClientRect();
        if (rect.top <= triggerY) {
          currentActive = idx + 1;
        }
      });
      this.activeJourneyStep.set(currentActive);
      return;
    }

    const rect = section.getBoundingClientRect();
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    // Progress from 0 (section top aligns with viewport top) to 1 (section scrolled to bottom)
    const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);

    if (progress < 0.38) {
      this.activeJourneyStep.set(1); // Step 1 — 01 EXPLORE active
    } else if (progress < 0.72) {
      this.activeJourneyStep.set(2); // Step 2 — 02 PREPARE active (featured)
    } else {
      this.activeJourneyStep.set(3); // Step 3 — 03 APPLY active
    }
  }

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => {
      const next = !open;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = next ? 'hidden' : '';
      }
      return next;
    });
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  protected readonly helpOpen = signal(false);
  protected readonly helpTab = signal<'home' | 'messages' | 'help'>('home');
  protected readonly helpSearch = signal('');
  protected readonly activeMegaMenu = signal<'universities' | 'neet' | null>(null);
  protected readonly contactState = signal<'idle' | 'sending' | 'success' | 'error'>('idle');
  protected readonly contactFeedback = signal('');

  protected submitContact(event: SubmitEvent, form: HTMLFormElement): void {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const subject = String(formData.get('subject') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const emailBody = [`Name: ${name}`, `Email: ${email}`, '', 'Message:', message].join('\n');
    const gmailComposeUrl =
      'https://mail.google.com/mail/?view=cm&fs=1' +
      `&to=${encodeURIComponent('mbbs.net.official@gmail.com')}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(emailBody)}`;

    this.contactState.set('success');
    this.contactFeedback.set('Opening Gmail. Review the prepared email and press Send.');
    window.location.assign(gmailComposeUrl);
  }

  protected readonly helpTopics = [
    'How do I contact the MBBS.net guidance team?',
    'How can I compare medical universities?',
    'Where can I find NEET counselling guidance?',
    'What documents are required for admission?',
  ];

  protected get filteredHelpTopics(): string[] {
    const query = this.helpSearch().trim().toLowerCase();
    return query
      ? this.helpTopics.filter((topic) => topic.toLowerCase().includes(query))
      : this.helpTopics;
  }

  protected openHelpTab(tab: 'home' | 'messages' | 'help'): void {
    this.helpTab.set(tab);
  }

  protected readonly megaMenus: Record<'universities' | 'neet', MegaMenuSection> = {
    universities: {
      title: 'Universities',
      description:
        'Explore recognised medical universities and compare the details that matter before applying.',
      image:
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85',
      imageAlt: 'University campus building',
      links: [
        { label: 'Explore Universities', href: '#destinations' },
        { label: 'Study MBBS Abroad', href: '#destinations' },
        { label: 'University Recognition', href: '#destinations' },
        { label: 'Tuition & Living Costs', href: '#destinations' },
        { label: 'Application Guidance', href: '#guidance' },
      ],
    },
    neet: {
      title: 'NEET',
      description:
        'Prepare confidently and follow the latest result, counselling and medical-admission guidance.',
      image: '/images/ucat-exam-omr.png',
      imageAlt: 'Student writing a medical entrance examination',
      links: [
        { label: 'NEET 2026 updates', href: '#guidance' },
        { label: 'Results & rank', href: '#guidance' },
        { label: 'Counselling guide', href: '#guidance' },
        { label: 'Marks vs rank', href: '#guidance' },
        { label: 'Required documents', href: '#guidance' },
        { label: 'AIQ vs state quota', href: '#guidance' },
      ],
    },
  };

  protected openMegaMenu(menu: 'universities' | 'neet'): void {
    this.activeMegaMenu.set(menu);
    if (menu === 'universities') {
      this.loadGroupedUniversities();
    }
  }

  protected closeMegaMenu(): void {
    this.activeMegaMenu.set(null);
  }

  protected readonly featuredUniversities = [
    { university: 'Semmelweis University', logo: '/images/universities/semmelweis.svg' },
    {
      university: 'University of Nicosia Medical School',
      logo: '/images/universities/nicosia.svg',
    },
    { university: 'University of Pécs Medical School', logo: '/images/universities/pecs.svg' },
    { university: 'Charles University', logo: '/images/universities/charles.svg' },
    {
      university: 'Lithuanian University of Health Sciences',
      logo: '/images/universities/lsmu.svg',
    },
    { university: 'Rīga Stradiņš University', logo: '/images/universities/riga-stradins.svg' },
    { university: 'Palacký University Olomouc', logo: '/images/universities/palacky.svg' },
  ];

  protected readonly mbbsCountries = [
    {
      name: 'Hungary',
      tag: 'Central Europe',
      description: 'Historic universities and respected English-taught medical programmes.',
      image:
        'https://images.unsplash.com/photo-1551867633-194f125bddfa?auto=format&fit=crop&w=900&q=85',
      imageAlt: 'Budapest cityscape beside the Danube in Hungary',
    },
    {
      name: 'Georgia',
      tag: 'Caucasus',
      description: 'Modern medical education in a welcoming, culturally rich destination.',
      image:
        'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=900&q=85',
      imageAlt: 'Historic architecture and mountains in Georgia',
    },
    {
      name: 'United Kingdom',
      tag: 'Global leader',
      description: 'Renowned clinical training and an internationally recognised pathway.',
      image:
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=85',
      imageAlt: 'London skyline and Westminster in the United Kingdom',
    },
    {
      name: 'Russia',
      tag: 'Established choice',
      description: 'Long-standing medical institutions with extensive academic facilities.',
      image:
        'https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=900&q=85',
      imageAlt: 'Saint Basil Cathedral in Moscow, Russia',
    },
    {
      name: 'Kyrgyzstan',
      tag: 'Student friendly',
      description: 'Accessible medical programmes surrounded by dramatic mountain landscapes.',
      image:
        'https://images.unsplash.com/photo-1569531955323-33c6b2dca44b?auto=format&fit=crop&w=900&q=85',
      imageAlt: 'Mountain landscape in Kyrgyzstan',
    },
    {
      name: 'Kazakhstan',
      tag: 'Emerging hub',
      description: 'Growing universities, contemporary campuses and diverse student communities.',
      image:
        'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=900&q=85',
      imageAlt: 'Modern city architecture in Kazakhstan',
    },
  ];

  protected readonly creativeTeamMembers = [
    {
      image: 'https://images.cnippet.dev/image/upload/v1770400411/a1.jpg',
      name: 'Patrick Stewart',
      role: 'Director of Medical Education',
    },
    {
      image: 'https://images.cnippet.dev/image/upload/v1770400411/a2.jpg',
      name: 'Alena Rosser',
      role: 'MBBS Admissions Advisor',
    },
    {
      image: 'https://images.cnippet.dev/image/upload/v1770400411/a3.jpg',
      name: 'Fletch Skinner',
      role: 'Clinical Education Mentor',
    },
    {
      image: 'https://images.cnippet.dev/image/upload/v1770400411/a4.jpg',
      name: 'Marc Spector',
      role: 'Medical Career Counsellor',
    },
    {
      image: 'https://images.cnippet.dev/image/upload/v1770400411/a5.jpg',
      name: 'Natalia Skinner',
      role: 'University Research Advisor',
    },
    {
      image: 'https://images.cnippet.dev/image/upload/v1770400411/a6.jpg',
      name: 'David Kim',
      role: 'Student Support Lead',
    },
  ];
}
