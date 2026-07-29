import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements AfterViewInit {
  @ViewChild('layeredHero') private layeredHero?: ElementRef<HTMLElement>;
  protected helpOpen = false;
  protected helpTab: 'home' | 'messages' | 'help' = 'home';
  protected helpSearch = '';
  protected activeMegaMenu: 'universities' | 'neet' | 'ucat' | null = null;

  ngAfterViewInit(): void {
    const element = this.layeredHero?.nativeElement;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      element.classList.add('is-revealed');
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.classList.add('is-revealed');
      observer.disconnect();
    }, { threshold: 0.3 });

    observer.observe(element);
  }

  protected readonly helpTopics = [
    'How do I contact the MBBS.net guidance team?',
    'How can I compare medical universities?',
    'Where can I find NEET counselling guidance?',
    'How do I access UCAT preparation resources?',
    'What documents are required for admission?'
  ];

  protected get filteredHelpTopics(): string[] {
    const query = this.helpSearch.trim().toLowerCase();
    return query
      ? this.helpTopics.filter((topic) => topic.toLowerCase().includes(query))
      : this.helpTopics;
  }

  protected openHelpTab(tab: 'home' | 'messages' | 'help'): void {
    this.helpTab = tab;
  }

  protected readonly megaMenus = {
    universities: {
      title: 'Universities',
      description: 'Explore recognised medical universities and compare the details that matter before applying.',
      image: '/images/medical-university-students.png',
      imageAlt: 'Medical students walking outside a university campus',
      links: ['Featured universities', 'Study MBBS abroad', 'University recognition', 'Tuition & living costs', 'Clinical exposure', 'Application guidance']
    },
    neet: {
      title: 'NEET',
      description: 'Prepare confidently and follow the latest result, counselling and medical-admission guidance.',
      image: '/images/neet-preparation.png',
      imageAlt: 'Student preparing for the NEET examination',
      links: ['NEET 2026 updates', 'Results & rank', 'Counselling guide', 'Marks vs rank', 'Required documents', 'AIQ vs state quota']
    },
    ucat: {
      title: 'UCAT Exam',
      description: 'Understand the UCAT format, build an effective preparation plan and improve your test-day readiness.',
      image: '/images/ucat-preparation.png',
      imageAlt: 'Medical-school applicant preparing for the UCAT exam',
      links: ['UCAT overview', 'Test format', 'Preparation strategy', 'Practice questions', 'Scoring guide', 'Test-day advice']
    }
  } as const;

  protected openMegaMenu(menu: 'universities' | 'neet' | 'ucat'): void {
    this.activeMegaMenu = menu;
  }

  protected closeMegaMenu(): void {
    this.activeMegaMenu = null;
  }

  protected readonly featuredUniversities = [
    { university: 'Semmelweis University', logo: '/images/universities/semmelweis.svg' },
    { university: 'University of Nicosia Medical School', logo: '/images/universities/nicosia.svg' },
    { university: 'University of Pécs Medical School', logo: '/images/universities/pecs.svg' },
    { university: 'Charles University', logo: '/images/universities/charles.svg' },
    { university: 'Lithuanian University of Health Sciences', logo: '/images/universities/lsmu.svg' },
    { university: 'Rīga Stradiņš University', logo: '/images/universities/riga-stradins.svg' },
    { university: 'Palacký University Olomouc', logo: '/images/universities/palacky.svg' },
  ];

  protected readonly layeredHeroLines = [
    { top: '\u00a0', bottom: 'YOUR DREAM' },
    { top: 'YOUR DREAM', bottom: 'OUR GUIDANCE' },
    { top: 'OUR GUIDANCE', bottom: 'GLOBAL EDUCATION' },
    { top: 'GLOBAL EDUCATION', bottom: 'LIMITLESS OPPORTUNITIES' },
    { top: 'LIMITLESS OPPORTUNITIES', bottom: 'START YOUR JOURNEY' },
    { top: 'START YOUR JOURNEY', bottom: 'TODAY' },
    { top: 'TODAY', bottom: '\u00a0' }
  ];
}
