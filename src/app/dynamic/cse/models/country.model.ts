export interface Country {
  _id?: string;
  id: string;
  country_id?: string;
  name: string;
  code: string;
  country_code?: string;
  slug?: string;
  flagUrl?: string;
  heroImage?: string;
  description?: string;
  popularCourses?: string[];
  averageTuitionFee?: string;
  currency?: string;
  livingCost?: string;
  language?: string;
  duration?: string;
  advantages?: string[];
  recognition?: string[];
  isPopular?: boolean;
  totalUniversities?: number;
  is_active?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  display_order?: number;
}

export interface CountryFilter {
  searchQuery?: string;
  maxTuition?: number;
  popularOnly?: boolean;
}

export interface CountryResponse {
  success: boolean;
  data: Country[];
  message?: string;
}

export const COUNTRY_LOOKUP: Record<string, {
  code: string;
  flagUrl: string;
  heroImage: string;
  averageTuitionFee: string;
  duration: string;
  language: string;
  recognition: string[];
  advantages: string[];
  totalUniversities: number;
  description: string;
  isPopular?: boolean;
}> = {
  'australia': {
    code: 'AU',
    flagUrl: 'https://flagcdn.com/w160/au.png',
    heroImage: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$20,000 - $35,000 / yr',
    duration: '5 - 6 Years',
    language: 'English',
    recognition: ['AMC', 'WHO', 'ECFMG', 'NMC'],
    advantages: ['World Top 50 Universities', 'AMC Recognized', 'High Clinical Standards', 'Post-Study Work Visa'],
    totalUniversities: 18,
    description: 'Premier medical education with world-class clinical training hospitals and AMC registration path.',
    isPopular: true
  },
  'austria': {
    code: 'AT',
    flagUrl: 'https://flagcdn.com/w160/at.png',
    heroImage: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$4,000 - $9,000 / yr',
    duration: '6 Years',
    language: 'English / German',
    recognition: ['EU', 'WHO', 'NMC', 'WFME'],
    advantages: ['European Union Standard', 'High Quality Research', 'Public University Subsidies', 'Central Europe Location'],
    totalUniversities: 12,
    description: 'Highly acclaimed European medical degrees with advanced clinical research infrastructure.',
    isPopular: true
  },
  'belgium': {
    code: 'BE',
    flagUrl: 'https://flagcdn.com/w160/be.png',
    heroImage: 'https://images.unsplash.com/photo-1559140022-7935f8d07cfc?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$5,000 - $11,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['EU', 'WHO', 'NMC', 'ECFMG'],
    advantages: ['EU Accredited MD', 'International Medical Hub', 'State-of-the-Art Labs', 'Multilingual Environment'],
    totalUniversities: 14,
    description: 'Heart of Europe medical institutes offering top clinical rotations and EU medical licensure.',
    isPopular: false
  },
  'bosnia and herzegovina': {
    code: 'BA',
    flagUrl: 'https://flagcdn.com/w160/ba.png',
    heroImage: 'https://images.unsplash.com/photo-1563282270-f925f44840ec?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$3,500 - $6,500 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG', 'WFME'],
    advantages: ['Very Affordable Fees', '100% English Medium', 'ECTS European Credit System', 'Safe European Country'],
    totalUniversities: 10,
    description: 'Affordable English-medium European medical education with strong practical hospital exposure.',
    isPopular: false
  },
  'bosnia': {
    code: 'BA',
    flagUrl: 'https://flagcdn.com/w160/ba.png',
    heroImage: 'https://images.unsplash.com/photo-1563282270-f925f44840ec?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$3,500 - $6,500 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG', 'WFME'],
    advantages: ['Very Affordable Fees', '100% English Medium', 'ECTS European Credit System', 'Safe European Country'],
    totalUniversities: 10,
    description: 'Affordable English-medium European medical education with strong practical hospital exposure.',
    isPopular: false
  },
  'bulgaria': {
    code: 'BG',
    flagUrl: 'https://flagcdn.com/w160/bg.png',
    heroImage: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$7,500 - $9,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['EU', 'WHO', 'NMC', 'GMC'],
    advantages: ['GMC (UK) & EU Recognized', '100% English Medium', 'High FMGE & USMLE Pass Rates', 'Direct EU License'],
    totalUniversities: 15,
    description: 'Prestigious European medical universities with direct GMC (UK) eligibility and EU practice rights.',
    isPopular: true
  },
  'croatia': {
    code: 'HR',
    flagUrl: 'https://flagcdn.com/w160/hr.png',
    heroImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$8,000 - $12,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['EU', 'WHO', 'NMC', 'ECFMG'],
    advantages: ['Top European State Universities', '100% English Track', 'High Clinical Patient Ratio', 'Schengen Country'],
    totalUniversities: 11,
    description: 'High-ranking European medical programs offering excellent hospital rotations and EU credit transfer.',
    isPopular: false
  },
  'georgia': {
    code: 'GE',
    flagUrl: 'https://flagcdn.com/w160/ge.png',
    heroImage: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$4,500 - $8,000 / yr',
    duration: '6 Years',
    language: '100% English',
    recognition: ['WHO', 'NMC', 'ECFMG', 'WFME'],
    advantages: ['100% English Medium', 'High FMGE/NMC Pass Rate', 'EU Curriculum Standard', 'No Entrance Exam'],
    totalUniversities: 18,
    description: 'Affordable European medical education with 100% English medium programs.',
    isPopular: true
  },
  'kazakhstan': {
    code: 'KZ',
    flagUrl: 'https://flagcdn.com/w160/kz.png',
    heroImage: 'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$3,800 - $5,500 / yr',
    duration: '5 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG'],
    advantages: ['Ultra Affordable', '5-Year Fast-Track', 'Indian Mess Facilities', 'Modern Simulated Labs'],
    totalUniversities: 12,
    description: 'Modern state medical universities with low tuition and high FMGE coaching.',
    isPopular: true
  },
  'russia': {
    code: 'RU',
    flagUrl: 'https://flagcdn.com/w160/ru.png',
    heroImage: 'https://images.unsplash.com/photo-1513326718677-b964603b136d?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$4,000 - $6,500 / yr',
    duration: '6 Years',
    language: 'English / Russian',
    recognition: ['WHO', 'NMC', 'UNESCO', 'ECFMG'],
    advantages: ['Government Universities', 'Advanced Research Centers', 'Low Living Costs', 'Subsidized Fees'],
    totalUniversities: 45,
    description: 'Longstanding medical heritage with top government universities and state subsidies.',
    isPopular: true
  },
  'united kingdom': {
    code: 'GB',
    flagUrl: 'https://flagcdn.com/w160/gb.png',
    heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$28,000 - $42,000 / yr',
    duration: '5 - 6 Years',
    language: 'English',
    recognition: ['GMC', 'WHO', 'ECFMG', 'NMC'],
    advantages: ['GMC Approved', 'NHS Clinical Rotations', 'Global Recognition', 'Post-Study Work Visa'],
    totalUniversities: 34,
    description: 'World-renowned clinical training with prestigious GMC registration path.',
    isPopular: true
  },
  'uk': {
    code: 'GB',
    flagUrl: 'https://flagcdn.com/w160/gb.png',
    heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$28,000 - $42,000 / yr',
    duration: '5 - 6 Years',
    language: 'English',
    recognition: ['GMC', 'WHO', 'ECFMG', 'NMC'],
    advantages: ['GMC Approved', 'NHS Clinical Rotations', 'Global Recognition', 'Post-Study Work Visa'],
    totalUniversities: 34,
    description: 'World-renowned clinical training with prestigious GMC registration path.',
    isPopular: true
  },
  'philippines': {
    code: 'PH',
    flagUrl: 'https://flagcdn.com/w160/ph.png',
    heroImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$5,000 - $7,500 / yr',
    duration: '5.5 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG', 'CHED'],
    advantages: ['American MD Curriculum', '99% English Speaking Nation', 'USMLE Focused Training', 'Tropical Climate'],
    totalUniversities: 15,
    description: 'US-based BS-MD curriculum with highest USMLE & FMGE success rates in Asia.',
    isPopular: false
  },
  'uzbekistan': {
    code: 'UZ',
    flagUrl: 'https://flagcdn.com/w160/uz.png',
    heroImage: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$3,200 - $4,800 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'Ministry of Health'],
    advantages: ['Safe Environment', 'High FMGE Results', 'Proximity to India', 'English Medium'],
    totalUniversities: 10,
    description: 'Rapidly emerging hub for international medical students with brand-new campuses.',
    isPopular: false
  },
  'egypt': {
    code: 'EG',
    flagUrl: 'https://flagcdn.com/w160/eg.png',
    heroImage: 'https://images.unsplash.com/photo-1572252821143-0259e2b10168?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$6,000 - $8,000 / yr',
    duration: '5 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG'],
    advantages: ['Historical Medical Faculties', 'High Patient Inflow', 'English Track', '5-Year Duration'],
    totalUniversities: 14,
    description: 'Prestigious North African medical faculties with massive clinical teaching hospitals.',
    isPopular: false
  },
  'armenia': {
    code: 'AM',
    flagUrl: 'https://flagcdn.com/w160/am.png',
    heroImage: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$4,000 - $6,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG'],
    advantages: ['Affordable Living', '100% English Medium', 'High Practical Training', 'Safe Environment'],
    totalUniversities: 8,
    description: 'Compact European-standard medical education with low living expenditure.',
    isPopular: false
  },
  'kyrgyzstan': {
    code: 'KG',
    flagUrl: 'https://flagcdn.com/w160/kg.png',
    heroImage: 'https://images.unsplash.com/photo-1569420038-04f8b0fa3129?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$3,000 - $4,500 / yr',
    duration: '5 Years',
    language: 'English',
    recognition: ['WHO', 'NMC', 'ECFMG'],
    advantages: ['Lowest Tuition Fees', 'Indian Mess Facilities', '5-Year Program', 'Easy Admission'],
    totalUniversities: 9,
    description: 'Budget-friendly 5-year MBBS option with dedicated FMGE screening support.',
    isPopular: false
  },
  'poland': {
    code: 'PL',
    flagUrl: 'https://flagcdn.com/w160/pl.png',
    heroImage: 'https://images.unsplash.com/photo-1519197924294-4ac991a135fe?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$12,000 - $16,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['EU', 'WHO', 'NMC', 'ECFMG'],
    advantages: ['Top Tier EU Medical Schools', 'Schengen Visa', 'USMLE & EU License Track', 'Advanced Labs'],
    totalUniversities: 16,
    description: 'Premier EU medical degrees with world-standard simulation centers.',
    isPopular: true
  },
  'hungary': {
    code: 'HU',
    flagUrl: 'https://flagcdn.com/w160/hu.png',
    heroImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$14,000 - $18,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['EU', 'WHO', 'NMC', 'ECFMG'],
    advantages: ['Nobel Prize Winning Medical Heritage', 'Stipendium Hungaricum Scholarships', 'EU Recognition'],
    totalUniversities: 6,
    description: 'Historic Hungarian medical faculties recognized across Europe, USA, and India.',
    isPopular: false
  },
  'czech republic': {
    code: 'CZ',
    flagUrl: 'https://flagcdn.com/w160/cz.png',
    heroImage: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$15,000 - $21,000 / yr',
    duration: '6 Years',
    language: 'English',
    recognition: ['EU', 'WHO', 'NMC', 'ECFMG'],
    advantages: ['Charles University Tradition', 'Highest EU Clinical Standards', 'Global Medical Mobility'],
    totalUniversities: 8,
    description: 'Prestigious Central European medical training with centuries of academic excellence.',
    isPopular: false
  },
  'germany': {
    code: 'DE',
    flagUrl: 'https://flagcdn.com/w160/de.png',
    heroImage: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80',
    averageTuitionFee: '$1,000 - $5,000 / yr',
    duration: '6 Years',
    language: 'German / English',
    recognition: ['EU', 'WHO', 'NMC', 'ECFMG'],
    advantages: ['Zero/Low Tuition in Public Unis', 'Top European Healthcare System', 'Permanent Residency Path'],
    totalUniversities: 36,
    description: 'World-renowned medical training in Europe’s strongest healthcare economy.',
    isPopular: true
  }
};

export function enrichCountry(country: any): Country {
  if (!country) return country;
  const nameKey = String(country.name || '').toLowerCase().trim();
  const codeKey = String(country.code || country.country_code || '').toLowerCase().trim();

  const lookup = COUNTRY_LOOKUP[nameKey] || Object.values(COUNTRY_LOOKUP).find(item => item.code.toLowerCase() === codeKey);

  const code = country.code || country.country_code || (lookup ? lookup.code : 'INT');
  const flagUrl = country.flagUrl || (lookup ? lookup.flagUrl : `https://flagcdn.com/w160/${code.toLowerCase()}.png`);
  const heroImage = country.heroImage || (lookup ? lookup.heroImage : 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80');
  const averageTuitionFee = country.averageTuitionFee || (lookup ? lookup.averageTuitionFee : '$4,500 - $8,500 / yr');
  const duration = country.duration || (lookup ? lookup.duration : '6 Years');
  const language = country.language || (lookup ? lookup.language : 'English');
  const recognition = (country.recognition && country.recognition.length > 0) ? country.recognition : (lookup ? lookup.recognition : ['WHO', 'NMC', 'ECFMG']);
  const advantages = (country.advantages && country.advantages.length > 0) ? country.advantages : (lookup ? lookup.advantages : ['100% English Medium', 'WHO & NMC Recognized', 'High FMGE Success', 'Clinical Rotations']);
  const totalUniversities = country.totalUniversities || (lookup ? lookup.totalUniversities : 12);
  const description = country.description || (lookup ? lookup.description : 'Accredited international medical destination with English-medium MBBS programs and global clinical pathways.');
  const isPopular = country.isPopular !== undefined ? country.isPopular : (lookup ? !!lookup.isPopular : false);

  const idVal = String(country._id || country.id || country.country_id || nameKey);

  return {
    ...country,
    _id: country._id || idVal,
    id: idVal,
    country_id: country.country_id || idVal,
    name: country.name || 'Medical Destination',
    code,
    country_code: code,
    flagUrl,
    heroImage,
    averageTuitionFee,
    duration,
    language,
    recognition,
    advantages,
    totalUniversities,
    description,
    isPopular
  };
}

