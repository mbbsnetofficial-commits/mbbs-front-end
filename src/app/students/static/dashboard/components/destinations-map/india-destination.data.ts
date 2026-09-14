import { AdminCountry, AdminUniversity } from '../../../../../shared/models/admin-university.model';

export const INDIA_FALLBACK_COUNTRY: AdminCountry = {
  _id: 'c_in',
  name: 'India',
  slug: 'india',
  country_code: 'IN',
  currency: 'INR',
  status: 'ACTIVE',
  display_order: 10,
};

export const INDIA_FALLBACK_UNIVERSITIES: AdminUniversity[] = [
  {
    _id: 'u_in1',
    country_id: 'c_in',
    name: 'AIIMS New Delhi',
    short_name: 'AIIMS',
    type: 'Institute of National Importance',
    status: 'ACTIVE',
    city: 'New Delhi',
    state: 'Delhi',
    official_website: 'https://www.aiims.edu',
    description:
      'All India Institute of Medical Sciences, New Delhi — Established as an institution of national importance by an Act of Parliament, AIIMS New Delhi is India’s apex medical institute and ranked #1 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Delhi',
        cities: ['New Delhi'],
      },
    ],
  },
  {
    _id: 'u_in2',
    country_id: 'c_in',
    name: 'PGIMER Chandigarh',
    short_name: 'PGIMER',
    type: 'Institute of National Importance',
    status: 'ACTIVE',
    city: 'Chandigarh',
    state: 'Chandigarh',
    official_website: 'https://pgimer.edu.in',
    description:
      'Postgraduate Institute of Medical Education & Research, Chandigarh — Premier medical and research institute established in 1962, ranked #2 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Chandigarh',
        cities: ['Chandigarh'],
      },
    ],
  },
  {
    _id: 'u_in3',
    country_id: 'c_in',
    name: 'CMC Vellore',
    short_name: 'CMC',
    type: 'Private Autonomous Medical College',
    status: 'ACTIVE',
    city: 'Vellore',
    state: 'Tamil Nadu',
    official_website: 'https://www.cmch-vellore.edu',
    description:
      'Christian Medical College, Vellore — Founded in 1900 by Dr. Ida S. Scudder, CMC Vellore is one of India’s most prestigious medical teaching institutions, ranked #3 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Tamil Nadu',
        cities: ['Vellore'],
      },
    ],
  },
  {
    _id: 'u_in4',
    country_id: 'c_in',
    name: 'NIMHANS Bengaluru',
    short_name: 'NIMHANS',
    type: 'Institute of National Importance',
    status: 'ACTIVE',
    city: 'Bengaluru',
    state: 'Karnataka',
    official_website: 'https://nimhans.ac.in',
    description:
      'National Institute of Mental Health & Neurosciences, Bengaluru — Apex center for mental health and neuroscience education, ranked #4 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Karnataka',
        cities: ['Bengaluru'],
      },
    ],
  },
  {
    _id: 'u_in5',
    country_id: 'c_in',
    name: 'JIPMER Puducherry',
    short_name: 'JIPMER',
    type: 'Institute of National Importance',
    status: 'ACTIVE',
    city: 'Puducherry',
    state: 'Puducherry',
    official_website: 'https://jipmer.edu.in',
    description:
      'Jawaharlal Institute of Postgraduate Medical Education & Research, Puducherry — Tracing its origin to 1823, JIPMER is an institute of national importance and ranked #5 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Puducherry',
        cities: ['Puducherry'],
      },
    ],
  },
  {
    _id: 'u_in6',
    country_id: 'c_in',
    name: 'Amrita Vishwa Vidyapeetham School of Medicine',
    short_name: 'Amrita',
    type: 'Deemed University Medical College',
    status: 'ACTIVE',
    city: 'Kochi',
    state: 'Kerala',
    official_website: 'https://www.amrita.edu/school/medicine/',
    description:
      'Amrita Institute of Medical Sciences & School of Medicine, Kochi — Super-specialty medical institute and teaching hospital, ranked #6 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Kerala',
        cities: ['Kochi'],
      },
    ],
  },
  {
    _id: 'u_in7',
    country_id: 'c_in',
    name: 'SGPGI Lucknow',
    short_name: 'SGPGI',
    type: 'State University Institute',
    status: 'ACTIVE',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    official_website: 'https://sgpgims.org.in',
    description:
      'Sanjay Gandhi Postgraduate Institute of Medical Sciences, Lucknow — Premier tertiary medical care and postgraduate training institute on Raebareli Road, ranked #7 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Uttar Pradesh',
        cities: ['Lucknow'],
      },
    ],
  },
  {
    _id: 'u_in8',
    country_id: 'c_in',
    name: 'BHU Institute of Medical Sciences',
    short_name: 'IMS-BHU',
    type: 'Central University Medical Institute',
    status: 'ACTIVE',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    official_website: 'https://new.bhu.ac.in/Site/UnitHome/ims',
    description:
      'Institute of Medical Sciences, Banaras Hindu University, Varanasi — Constituent medical school of BHU established in 1960, ranked #8 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Uttar Pradesh',
        cities: ['Varanasi'],
      },
    ],
  },
  {
    _id: 'u_in9',
    country_id: 'c_in',
    name: 'Kasturba Medical College, Manipal',
    short_name: 'KMC Manipal',
    type: 'Constituent Medical College',
    status: 'ACTIVE',
    city: 'Manipal',
    state: 'Karnataka',
    official_website: 'https://manipal.edu/kmc-manipal.html',
    description:
      'Kasturba Medical College, Manipal (MAHE) — Established in 1953 as India’s first self-financing medical college, ranked #9 in NIRF Medical 2024.',
    locations: [
      {
        state: 'Karnataka',
        cities: ['Manipal'],
      },
    ],
  },
  {
    _id: 'u_in10',
    country_id: 'c_in',
    name: 'King George\'s Medical University',
    short_name: 'KGMU',
    type: 'State Medical University',
    status: 'ACTIVE',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    official_website: 'https://kgmu.org',
    description:
      'King George’s Medical University, Lucknow — Historic medical institution founded in 1905 in Chowk, Lucknow, ranked top-tier in NIRF Medical 2024.',
    locations: [
      {
        state: 'Uttar Pradesh',
        cities: ['Lucknow'],
      },
    ],
  },
];
