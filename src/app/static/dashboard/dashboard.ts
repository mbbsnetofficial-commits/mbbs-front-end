import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
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

  protected readonly megaMenus = {
    universities: {
      title: 'Universities',
      description:
        'Explore recognised medical universities and compare the details that matter before applying.',
      image:
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85',
      imageAlt: 'University campus building',
      links: [
        'Featured universities',
        'Study MBBS abroad',
        'University recognition',
        'Tuition & living costs',
        'Clinical exposure',
        'Application guidance',
      ],
    },
    neet: {
      title: 'NEET',
      description:
        'Prepare confidently and follow the latest result, counselling and medical-admission guidance.',
      image: '/images/ucat-exam-omr.png',
      imageAlt: 'Student writing a medical entrance examination',
      links: [
        'NEET 2026 updates',
        'Results & rank',
        'Counselling guide',
        'Marks vs rank',
        'Required documents',
        'AIQ vs state quota',
      ],
    },
  } as const;

  protected openMegaMenu(menu: 'universities' | 'neet'): void {
    this.activeMegaMenu.set(menu);
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
