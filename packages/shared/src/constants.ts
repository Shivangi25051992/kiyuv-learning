export const KID_IDS = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'] as const;
export type KidId = (typeof KID_IDS)[number];

export const MAX_KIDS_PER_FAMILY = 6;
export const MAX_COUNT_VALUE = 100_000_000;
export const MAX_BADGES = 100;
export const MAX_TOPICS = 1000;
export const WRITE_SPACING_MS = 5500;
export const PIN_FRESH_PARENT_MS = 5 * 60 * 1000; // 5 minutes
export const PIN_FRESH_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
export const IDLE_PICKER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export const FAV_COLORS = [
  'blue',
  'rose',
  'green',
  'orange',
  'purple',
  'teal',
  'red',
  'yellow',
] as const;
export type FavColor = (typeof FAV_COLORS)[number];

export interface ColorTheme {
  key: FavColor;
  label: string;
  hex: string;
  accent: string;
  bgLight: string;
  border: string;
}

export const FAV_COLOR_THEMES: Record<FavColor, ColorTheme> = {
  blue: {
    key: 'blue',
    label: 'Ocean Blue',
    hex: '#2563eb',
    accent: '#4f8bff',
    bgLight: '#eff6ff',
    border: '#93c5fd',
  },
  rose: {
    key: 'rose',
    label: 'Berry Rose',
    hex: '#be185d',
    accent: '#ff86c8',
    bgLight: '#fdf2f8',
    border: '#f9a8d4',
  },
  green: {
    key: 'green',
    label: 'Emerald Green',
    hex: '#047857',
    accent: '#3ddc97',
    bgLight: '#ecfdf5',
    border: '#6ee7b7',
  },
  orange: {
    key: 'orange',
    label: 'Sunset Orange',
    hex: '#c2410c',
    accent: '#ff9f43',
    bgLight: '#fffbeb',
    border: '#fcd34d',
  },
  purple: {
    key: 'purple',
    label: 'Royal Purple',
    hex: '#7c3aed',
    accent: '#c084fc',
    bgLight: '#f5f3ff',
    border: '#c4b5fd',
  },
  teal: {
    key: 'teal',
    label: 'Lagoon Teal',
    hex: '#0f766e',
    accent: '#14b8a6',
    bgLight: '#f0fdfa',
    border: '#5eead4',
  },
  red: {
    key: 'red',
    label: 'Ruby Red',
    hex: '#c62828',
    accent: '#ff6b6b',
    bgLight: '#fef2f2',
    border: '#fca5a5',
  },
  yellow: {
    key: 'yellow',
    label: 'Sunshine Gold',
    hex: '#b45309',
    accent: '#f59e0b',
    bgLight: '#fefce8',
    border: '#fde047',
  },
};

export const AVATAR_PRESETS = [
  '🧒',
  '👦',
  '👧',
  '🦁',
  '🐼',
  '🦊',
  '🦄',
  '🐸',
  '🚀',
  '🦋',
  '🐬',
  '🐯',
] as const;

export const AGE_BANDS = ['2-4', '5-7', '8-10', '11-13'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const TRACKS = ['early', 'primary'] as const;
export type Track = (typeof TRACKS)[number];

export interface CountryOption {
  code: string;
  name: string;
  states: readonly string[];
}

export const COUNTRIES: readonly CountryOption[] = [
  {
    code: 'IN',
    name: 'India',
    states: [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chandigarh',
      'Chhattisgarh',
      'Delhi',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jammu & Kashmir',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Ladakh',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Puducherry',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
    ],
  },
  {
    code: 'US',
    name: 'United States',
    states: [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'California',
      'Colorado',
      'Connecticut',
      'Delaware',
      'Florida',
      'Georgia',
      'Hawaii',
      'Idaho',
      'Illinois',
      'Indiana',
      'Iowa',
      'Kansas',
      'Kentucky',
      'Louisiana',
      'Maine',
      'Maryland',
      'Massachusetts',
      'Michigan',
      'Minnesota',
      'Mississippi',
      'Missouri',
      'Montana',
      'Nebraska',
      'Nevada',
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
      'North Carolina',
      'North Dakota',
      'Ohio',
      'Oklahoma',
      'Oregon',
      'Pennsylvania',
      'Rhode Island',
      'South Carolina',
      'South Dakota',
      'Tennessee',
      'Texas',
      'Utah',
      'Vermont',
      'Virginia',
      'Washington',
      'Washington D.C.',
      'West Virginia',
      'Wisconsin',
      'Wyoming',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  },
  {
    code: 'AU',
    name: 'Australia',
    states: [
      'Australian Capital Territory',
      'New South Wales',
      'Northern Territory',
      'Queensland',
      'South Australia',
      'Tasmania',
      'Victoria',
      'Western Australia',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    states: [
      'Alberta',
      'British Columbia',
      'Manitoba',
      'New Brunswick',
      'Newfoundland and Labrador',
      'Nova Scotia',
      'Ontario',
      'Prince Edward Island',
      'Quebec',
      'Saskatchewan',
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    states: ['Central', 'East', 'North', 'North-East', 'West'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    states: ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'],
  },
  {
    code: 'DE',
    name: 'Germany',
    states: ['Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'North Rhine-Westphalia', 'Other'],
  },
  {
    code: 'FR',
    name: 'France',
    states: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Other'],
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    states: ['Auckland', 'Canterbury', 'Waikato', 'Wellington', 'Other'],
  },
];

export const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));
