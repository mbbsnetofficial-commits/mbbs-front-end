export interface FaqItem {
  id: string;
  num: string;
  question: string;
  answer: string;
  tag?: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    num: '01',
    tag: 'NEET & Eligibility',
    question: 'Is qualifying NEET mandatory to study MBBS abroad?',
    answer:
      'Yes. Under National Medical Commission (NMC) regulations, Indian students must qualify for NEET-UG to be eligible to practice in India upon graduation. In addition, you need at least 50% aggregate marks in Physics, Chemistry, and Biology (PCB) in Class 12.',
  },
  {
    id: 'faq-2',
    num: '02',
    tag: 'Degree Validity',
    question: 'Will my foreign medical degree be valid in India?',
    answer:
      'Yes, as long as your university satisfies NMC Foreign Medical Graduate Licentiate (FMGL) regulations: an English-medium curriculum, at least 54 months of medical coursework followed by a 12-month clinical internship, and a license to practice in the host country.',
  },
  {
    id: 'faq-3',
    num: '03',
    tag: 'Budget & Costs',
    question: 'What is the realistic total cost of studying medicine abroad?',
    answer:
      'Total tuition fees typically range between ₹15 Lakhs and ₹45 Lakhs across the full 5-6 year course, depending on the country. Living expenses, including hostel accommodation, meals, and health insurance, generally add ₹1.5L to ₹3L per year.',
  },
  {
    id: 'faq-4',
    num: '04',
    tag: 'Safety & Campus Life',
    question: 'How safe are foreign universities for Indian students?',
    answer:
      'Reputable medical universities provide 24/7 campus security, secure international hostels, on-site Indian mess facilities, and active Indian student communities. MBBS.NET helps you review verified safety ratings and student experiences before deciding.',
  },
  {
    id: 'faq-5',
    num: '05',
    tag: 'Platform & Guidance',
    question: 'How does MBBS.NET help me choose and apply?',
    answer:
      'MBBS.NET provides verified university profiles, transparent fee comparisons, direct regulatory checks, and personalized admission guidance—empowering you with an unbiased, direct application pathway without inflated agent commissions.',
  },
];
