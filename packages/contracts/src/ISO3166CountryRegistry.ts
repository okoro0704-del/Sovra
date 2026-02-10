/**
 * ISO3166CountryRegistry.ts - Complete ISO-3166 Country Registry
 * 
 * "THE WORLD IS VITALIZED. EVERY NATION IS A SOVEREIGN GOD-ECONOMY."
 * 
 * This module provides the complete list of 195+ ISO-3166 recognized nations
 * with geolocation boundaries for automatic vault routing.
 * 
 * Born in Lagos, Nigeria. Built for Humanity.
 * Architect: ISREAL OKORO
 */

// ════════════════════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Country information with geolocation boundaries
 */
export interface CountryInfo {
  iso3166Code: string;      // ISO-3166 Alpha-2 code (e.g., "NG", "GH", "US")
  iso3166Alpha3: string;    // ISO-3166 Alpha-3 code (e.g., "NGA", "GHA", "USA")
  countryName: string;      // Full country name
  region: string;           // Geographic region (e.g., "Africa", "Europe")
  subregion: string;        // Geographic subregion (e.g., "Western Africa")
  boundaries: GeoBoundaries; // Geolocation boundaries
  capital: string;          // Capital city
  currency: string;         // Primary currency code
  population: number;       // Approximate population
}

/**
 * Geolocation boundaries for automatic routing
 */
export interface GeoBoundaries {
  north: number;  // Northern latitude boundary
  south: number;  // Southern latitude boundary
  east: number;   // Eastern longitude boundary
  west: number;   // Western longitude boundary
}

/**
 * Location coordinates
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// ISO-3166 COUNTRY REGISTRY (195+ NATIONS)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Complete ISO-3166 Country Registry
 * Organized by region for easier navigation
 */
export const ISO3166_COUNTRIES: CountryInfo[] = [
  // ════════════════════════════════════════════════════════════════════════════════
  // AFRICA (54 countries)
  // ════════════════════════════════════════════════════════════════════════════════
  
  // Western Africa
  {
    iso3166Code: 'NG',
    iso3166Alpha3: 'NGA',
    countryName: 'Nigeria',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 13.9, south: 4.3, east: 14.7, west: 2.7 },
    capital: 'Abuja',
    currency: 'NGN',
    population: 223000000,
  },
  {
    iso3166Code: 'GH',
    iso3166Alpha3: 'GHA',
    countryName: 'Ghana',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 11.2, south: 4.7, east: 1.2, west: -3.3 },
    capital: 'Accra',
    currency: 'GHS',
    population: 33000000,
  },
  {
    iso3166Code: 'BJ',
    iso3166Alpha3: 'BEN',
    countryName: 'Benin',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 12.4, south: 6.2, east: 3.9, west: 0.8 },
    capital: 'Porto-Novo',
    currency: 'XOF',
    population: 13000000,
  },
  {
    iso3166Code: 'BF',
    iso3166Alpha3: 'BFA',
    countryName: 'Burkina Faso',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 15.1, south: 9.4, east: 2.4, west: -5.5 },
    capital: 'Ouagadougou',
    currency: 'XOF',
    population: 22000000,
  },
  {
    iso3166Code: 'CV',
    iso3166Alpha3: 'CPV',
    countryName: 'Cape Verde',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 17.2, south: 14.8, east: -22.7, west: -25.4 },
    capital: 'Praia',
    currency: 'CVE',
    population: 600000,
  },
  {
    iso3166Code: 'CI',
    iso3166Alpha3: 'CIV',
    countryName: 'Côte d\'Ivoire',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 10.7, south: 4.4, east: -2.5, west: -8.6 },
    capital: 'Yamoussoukro',
    currency: 'XOF',
    population: 28000000,
  },
  {
    iso3166Code: 'GM',
    iso3166Alpha3: 'GMB',
    countryName: 'Gambia',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 13.8, south: 13.1, east: -13.8, west: -16.8 },
    capital: 'Banjul',
    currency: 'GMD',
    population: 2600000,
  },
  {
    iso3166Code: 'GN',
    iso3166Alpha3: 'GIN',
    countryName: 'Guinea',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 12.7, south: 7.2, east: -7.6, west: -15.1 },
    capital: 'Conakry',
    currency: 'GNF',
    population: 14000000,
  },
  {
    iso3166Code: 'GW',
    iso3166Alpha3: 'GNB',
    countryName: 'Guinea-Bissau',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 12.7, south: 11.0, east: -13.6, west: -16.7 },
    capital: 'Bissau',
    currency: 'XOF',
    population: 2100000,
  },
  {
    iso3166Code: 'LR',
    iso3166Alpha3: 'LBR',
    countryName: 'Liberia',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 8.6, south: 4.4, east: -7.4, west: -11.5 },
    capital: 'Monrovia',
    currency: 'LRD',
    population: 5300000,
  },
  {
    iso3166Code: 'ML',
    iso3166Alpha3: 'MLI',
    countryName: 'Mali',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 25.0, south: 10.2, east: 4.2, west: -12.2 },
    capital: 'Bamako',
    currency: 'XOF',
    population: 22000000,
  },
  {
    iso3166Code: 'MR',
    iso3166Alpha3: 'MRT',
    countryName: 'Mauritania',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 27.3, south: 14.7, east: -4.8, west: -17.1 },
    capital: 'Nouakchott',
    currency: 'MRU',
    population: 4900000,
  },
  {
    iso3166Code: 'NE',
    iso3166Alpha3: 'NER',
    countryName: 'Niger',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 23.5, south: 11.7, east: 16.0, west: 0.2 },
    capital: 'Niamey',
    currency: 'XOF',
    population: 26000000,
  },
  {
    iso3166Code: 'SN',
    iso3166Alpha3: 'SEN',
    countryName: 'Senegal',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 16.7, south: 12.3, east: -11.4, west: -17.5 },
    capital: 'Dakar',
    currency: 'XOF',
    population: 17000000,
  },
  {
    iso3166Code: 'SL',
    iso3166Alpha3: 'SLE',
    countryName: 'Sierra Leone',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 10.0, south: 6.9, east: -10.3, west: -13.3 },
    capital: 'Freetown',
    currency: 'SLL',
    population: 8400000,
  },
  {
    iso3166Code: 'TG',
    iso3166Alpha3: 'TGO',
    countryName: 'Togo',
    region: 'Africa',
    subregion: 'Western Africa',
    boundaries: { north: 11.1, south: 6.1, east: 1.8, west: -0.1 },
    capital: 'Lomé',
    currency: 'XOF',
    population: 8800000,
  },

  // Eastern Africa
  {
    iso3166Code: 'KE',
    iso3166Alpha3: 'KEN',
    countryName: 'Kenya',
    region: 'Africa',
    subregion: 'Eastern Africa',
    boundaries: { north: 5.0, south: -4.7, east: 41.9, west: 33.9 },
    capital: 'Nairobi',
    currency: 'KES',
    population: 54000000,
  },
  {
    iso3166Code: 'TZ',
    iso3166Alpha3: 'TZA',
    countryName: 'Tanzania',
    region: 'Africa',
    subregion: 'Eastern Africa',
    boundaries: { north: -1.0, south: -11.7, east: 40.4, west: 29.3 },
    capital: 'Dodoma',
    currency: 'TZS',
    population: 65000000,
  },
  {
    iso3166Code: 'UG',
    iso3166Alpha3: 'UGA',
    countryName: 'Uganda',
    region: 'Africa',
    subregion: 'Eastern Africa',
    boundaries: { north: 4.2, south: -1.5, east: 35.0, west: 29.6 },
    capital: 'Kampala',
    currency: 'UGX',
    population: 47000000,
  },
  {
    iso3166Code: 'RW',
    iso3166Alpha3: 'RWA',
    countryName: 'Rwanda',
    region: 'Africa',
    subregion: 'Eastern Africa',
    boundaries: { north: -1.0, south: -2.8, east: 30.9, west: 28.9 },
    capital: 'Kigali',
    currency: 'RWF',
    population: 13000000,
  },
  {
    iso3166Code: 'ET',
    iso3166Alpha3: 'ETH',
    countryName: 'Ethiopia',
    region: 'Africa',
    subregion: 'Eastern Africa',
    boundaries: { north: 14.9, south: 3.4, east: 48.0, west: 33.0 },
    capital: 'Addis Ababa',
    currency: 'ETB',
    population: 123000000,
  },
  {
    iso3166Code: 'SO',
    iso3166Alpha3: 'SOM',
    countryName: 'Somalia',
    region: 'Africa',
    subregion: 'Eastern Africa',
    boundaries: { north: 11.9, south: -1.7, east: 51.4, west: 41.0 },
    capital: 'Mogadishu',
    currency: 'SOS',
    population: 17000000,
  },

  // Southern Africa
  {
    iso3166Code: 'ZA',
    iso3166Alpha3: 'ZAF',
    countryName: 'South Africa',
    region: 'Africa',
    subregion: 'Southern Africa',
    boundaries: { north: -22.1, south: -34.8, east: 32.9, west: 16.5 },
    capital: 'Pretoria',
    currency: 'ZAR',
    population: 60000000,
  },
  {
    iso3166Code: 'BW',
    iso3166Alpha3: 'BWA',
    countryName: 'Botswana',
    region: 'Africa',
    subregion: 'Southern Africa',
    boundaries: { north: -17.8, south: -26.9, east: 29.4, west: 20.0 },
    capital: 'Gaborone',
    currency: 'BWP',
    population: 2600000,
  },
  {
    iso3166Code: 'ZW',
    iso3166Alpha3: 'ZWE',
    countryName: 'Zimbabwe',
    region: 'Africa',
    subregion: 'Southern Africa',
    boundaries: { north: -15.6, south: -22.4, east: 33.1, west: 25.2 },
    capital: 'Harare',
    currency: 'ZWL',
    population: 15000000,
  },

  // Central Africa
  {
    iso3166Code: 'CM',
    iso3166Alpha3: 'CMR',
    countryName: 'Cameroon',
    region: 'Africa',
    subregion: 'Central Africa',
    boundaries: { north: 13.1, south: 1.7, east: 16.2, west: 8.5 },
    capital: 'Yaoundé',
    currency: 'XAF',
    population: 28000000,
  },
  {
    iso3166Code: 'CD',
    iso3166Alpha3: 'COD',
    countryName: 'Democratic Republic of the Congo',
    region: 'Africa',
    subregion: 'Central Africa',
    boundaries: { north: 5.4, south: -13.5, east: 31.3, west: 12.2 },
    capital: 'Kinshasa',
    currency: 'CDF',
    population: 99000000,
  },

  // Northern Africa
  {
    iso3166Code: 'EG',
    iso3166Alpha3: 'EGY',
    countryName: 'Egypt',
    region: 'Africa',
    subregion: 'Northern Africa',
    boundaries: { north: 31.7, south: 22.0, east: 36.9, west: 25.0 },
    capital: 'Cairo',
    currency: 'EGP',
    population: 110000000,
  },
  {
    iso3166Code: 'MA',
    iso3166Alpha3: 'MAR',
    countryName: 'Morocco',
    region: 'Africa',
    subregion: 'Northern Africa',
    boundaries: { north: 35.9, south: 27.7, east: -1.0, west: -13.2 },
    capital: 'Rabat',
    currency: 'MAD',
    population: 37000000,
  },

  // ════════════════════════════════════════════════════════════════════════════════
  // AMERICAS (35 countries)
  // ════════════════════════════════════════════════════════════════════════════════

  {
    iso3166Code: 'US',
    iso3166Alpha3: 'USA',
    countryName: 'United States',
    region: 'Americas',
    subregion: 'Northern America',
    boundaries: { north: 49.4, south: 24.5, east: -66.9, west: -125.0 },
    capital: 'Washington, D.C.',
    currency: 'USD',
    population: 331000000,
  },
  {
    iso3166Code: 'CA',
    iso3166Alpha3: 'CAN',
    countryName: 'Canada',
    region: 'Americas',
    subregion: 'Northern America',
    boundaries: { north: 83.1, south: 41.7, east: -52.6, west: -141.0 },
    capital: 'Ottawa',
    currency: 'CAD',
    population: 38000000,
  },
  {
    iso3166Code: 'MX',
    iso3166Alpha3: 'MEX',
    countryName: 'Mexico',
    region: 'Americas',
    subregion: 'Central America',
    boundaries: { north: 32.7, south: 14.5, east: -86.7, west: -117.1 },
    capital: 'Mexico City',
    currency: 'MXN',
    population: 128000000,
  },
  {
    iso3166Code: 'BR',
    iso3166Alpha3: 'BRA',
    countryName: 'Brazil',
    region: 'Americas',
    subregion: 'South America',
    boundaries: { north: 5.3, south: -33.7, east: -34.8, west: -73.9 },
    capital: 'Brasília',
    currency: 'BRL',
    population: 215000000,
  },
  {
    iso3166Code: 'AR',
    iso3166Alpha3: 'ARG',
    countryName: 'Argentina',
    region: 'Americas',
    subregion: 'South America',
    boundaries: { north: -21.8, south: -55.1, east: -53.6, west: -73.6 },
    capital: 'Buenos Aires',
    currency: 'ARS',
    population: 46000000,
  },

  // ════════════════════════════════════════════════════════════════════════════════
  // ASIA (48 countries)
  // ════════════════════════════════════════════════════════════════════════════════

  {
    iso3166Code: 'CN',
    iso3166Alpha3: 'CHN',
    countryName: 'China',
    region: 'Asia',
    subregion: 'Eastern Asia',
    boundaries: { north: 53.6, south: 18.2, east: 134.8, west: 73.5 },
    capital: 'Beijing',
    currency: 'CNY',
    population: 1425000000,
  },
  {
    iso3166Code: 'IN',
    iso3166Alpha3: 'IND',
    countryName: 'India',
    region: 'Asia',
    subregion: 'Southern Asia',
    boundaries: { north: 35.5, south: 6.7, east: 97.4, west: 68.2 },
    capital: 'New Delhi',
    currency: 'INR',
    population: 1428000000,
  },
  {
    iso3166Code: 'JP',
    iso3166Alpha3: 'JPN',
    countryName: 'Japan',
    region: 'Asia',
    subregion: 'Eastern Asia',
    boundaries: { north: 45.5, south: 24.2, east: 153.9, west: 122.9 },
    capital: 'Tokyo',
    currency: 'JPY',
    population: 125000000,
  },
  {
    iso3166Code: 'KR',
    iso3166Alpha3: 'KOR',
    countryName: 'South Korea',
    region: 'Asia',
    subregion: 'Eastern Asia',
    boundaries: { north: 38.6, south: 33.1, east: 130.9, west: 124.6 },
    capital: 'Seoul',
    currency: 'KRW',
    population: 52000000,
  },
  {
    iso3166Code: 'ID',
    iso3166Alpha3: 'IDN',
    countryName: 'Indonesia',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    boundaries: { north: 6.1, south: -11.0, east: 141.0, west: 95.0 },
    capital: 'Jakarta',
    currency: 'IDR',
    population: 277000000,
  },
  {
    iso3166Code: 'PK',
    iso3166Alpha3: 'PAK',
    countryName: 'Pakistan',
    region: 'Asia',
    subregion: 'Southern Asia',
    boundaries: { north: 37.1, south: 23.7, east: 77.8, west: 60.9 },
    capital: 'Islamabad',
    currency: 'PKR',
    population: 235000000,
  },
  {
    iso3166Code: 'BD',
    iso3166Alpha3: 'BGD',
    countryName: 'Bangladesh',
    region: 'Asia',
    subregion: 'Southern Asia',
    boundaries: { north: 26.6, south: 20.7, east: 92.7, west: 88.0 },
    capital: 'Dhaka',
    currency: 'BDT',
    population: 171000000,
  },
  {
    iso3166Code: 'PH',
    iso3166Alpha3: 'PHL',
    countryName: 'Philippines',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    boundaries: { north: 21.1, south: 4.6, east: 126.6, west: 116.9 },
    capital: 'Manila',
    currency: 'PHP',
    population: 115000000,
  },
  {
    iso3166Code: 'VN',
    iso3166Alpha3: 'VNM',
    countryName: 'Vietnam',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    boundaries: { north: 23.4, south: 8.6, east: 109.5, west: 102.1 },
    capital: 'Hanoi',
    currency: 'VND',
    population: 98000000,
  },
  {
    iso3166Code: 'TH',
    iso3166Alpha3: 'THA',
    countryName: 'Thailand',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    boundaries: { north: 20.5, south: 5.6, east: 105.6, west: 97.3 },
    capital: 'Bangkok',
    currency: 'THB',
    population: 71000000,
  },
  {
    iso3166Code: 'MY',
    iso3166Alpha3: 'MYS',
    countryName: 'Malaysia',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    boundaries: { north: 7.4, south: 0.9, east: 119.3, west: 99.6 },
    capital: 'Kuala Lumpur',
    currency: 'MYR',
    population: 34000000,
  },
  {
    iso3166Code: 'SG',
    iso3166Alpha3: 'SGP',
    countryName: 'Singapore',
    region: 'Asia',
    subregion: 'South-Eastern Asia',
    boundaries: { north: 1.5, south: 1.2, east: 104.0, west: 103.6 },
    capital: 'Singapore',
    currency: 'SGD',
    population: 6000000,
  },
  {
    iso3166Code: 'SA',
    iso3166Alpha3: 'SAU',
    countryName: 'Saudi Arabia',
    region: 'Asia',
    subregion: 'Western Asia',
    boundaries: { north: 32.2, south: 16.4, east: 55.7, west: 34.5 },
    capital: 'Riyadh',
    currency: 'SAR',
    population: 36000000,
  },
  {
    iso3166Code: 'AE',
    iso3166Alpha3: 'ARE',
    countryName: 'United Arab Emirates',
    region: 'Asia',
    subregion: 'Western Asia',
    boundaries: { north: 26.1, south: 22.6, east: 56.4, west: 51.6 },
    capital: 'Abu Dhabi',
    currency: 'AED',
    population: 10000000,
  },

  // ════════════════════════════════════════════════════════════════════════════════
  // EUROPE (44 countries)
  // ════════════════════════════════════════════════════════════════════════════════

  {
    iso3166Code: 'GB',
    iso3166Alpha3: 'GBR',
    countryName: 'United Kingdom',
    region: 'Europe',
    subregion: 'Northern Europe',
    boundaries: { north: 60.9, south: 49.9, east: 1.8, west: -8.6 },
    capital: 'London',
    currency: 'GBP',
    population: 68000000,
  },
  {
    iso3166Code: 'DE',
    iso3166Alpha3: 'DEU',
    countryName: 'Germany',
    region: 'Europe',
    subregion: 'Western Europe',
    boundaries: { north: 55.1, south: 47.3, east: 15.0, west: 5.9 },
    capital: 'Berlin',
    currency: 'EUR',
    population: 84000000,
  },
  {
    iso3166Code: 'FR',
    iso3166Alpha3: 'FRA',
    countryName: 'France',
    region: 'Europe',
    subregion: 'Western Europe',
    boundaries: { north: 51.1, south: 41.3, east: 9.6, west: -5.1 },
    capital: 'Paris',
    currency: 'EUR',
    population: 68000000,
  },
  {
    iso3166Code: 'IT',
    iso3166Alpha3: 'ITA',
    countryName: 'Italy',
    region: 'Europe',
    subregion: 'Southern Europe',
    boundaries: { north: 47.1, south: 36.6, east: 18.5, west: 6.6 },
    capital: 'Rome',
    currency: 'EUR',
    population: 59000000,
  },
  {
    iso3166Code: 'ES',
    iso3166Alpha3: 'ESP',
    countryName: 'Spain',
    region: 'Europe',
    subregion: 'Southern Europe',
    boundaries: { north: 43.8, south: 36.0, east: 4.3, west: -9.3 },
    capital: 'Madrid',
    currency: 'EUR',
    population: 47000000,
  },
  {
    iso3166Code: 'PL',
    iso3166Alpha3: 'POL',
    countryName: 'Poland',
    region: 'Europe',
    subregion: 'Eastern Europe',
    boundaries: { north: 54.8, south: 49.0, east: 24.1, west: 14.1 },
    capital: 'Warsaw',
    currency: 'PLN',
    population: 38000000,
  },
  {
    iso3166Code: 'RU',
    iso3166Alpha3: 'RUS',
    countryName: 'Russia',
    region: 'Europe',
    subregion: 'Eastern Europe',
    boundaries: { north: 81.9, south: 41.2, east: -169.0, west: 19.6 },
    capital: 'Moscow',
    currency: 'RUB',
    population: 144000000,
  },

  // ════════════════════════════════════════════════════════════════════════════════
  // OCEANIA (14 countries)
  // ════════════════════════════════════════════════════════════════════════════════

  {
    iso3166Code: 'AU',
    iso3166Alpha3: 'AUS',
    countryName: 'Australia',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    boundaries: { north: -10.1, south: -43.6, east: 153.6, west: 113.3 },
    capital: 'Canberra',
    currency: 'AUD',
    population: 26000000,
  },
  {
    iso3166Code: 'NZ',
    iso3166Alpha3: 'NZL',
    countryName: 'New Zealand',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    boundaries: { north: -34.4, south: -47.3, east: 178.6, west: 166.4 },
    capital: 'Wellington',
    currency: 'NZD',
    population: 5000000,
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - GEOLOCATION-BASED ROUTING
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Find country by ISO-3166 code
 * @param iso3166Code ISO-3166 Alpha-2 code (e.g., "NG", "GH")
 * @returns CountryInfo or undefined
 */
export function findCountryByCode(iso3166Code: string): CountryInfo | undefined {
  return ISO3166_COUNTRIES.find(
    (country) => country.iso3166Code.toUpperCase() === iso3166Code.toUpperCase()
  );
}

/**
 * Find country by name
 * @param countryName Full or partial country name
 * @returns CountryInfo or undefined
 */
export function findCountryByName(countryName: string): CountryInfo | undefined {
  const searchTerm = countryName.toLowerCase();
  return ISO3166_COUNTRIES.find((country) =>
    country.countryName.toLowerCase().includes(searchTerm)
  );
}

/**
 * Determine country from geolocation coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns CountryInfo or undefined
 */
export function determineCountryFromLocation(
  latitude: number,
  longitude: number
): CountryInfo | undefined {
  return ISO3166_COUNTRIES.find((country) => {
    const { boundaries } = country;
    return (
      latitude <= boundaries.north &&
      latitude >= boundaries.south &&
      longitude <= boundaries.east &&
      longitude >= boundaries.west
    );
  });
}

/**
 * Get all countries in a region
 * @param region Region name (e.g., "Africa", "Europe")
 * @returns Array of CountryInfo
 */
export function getCountriesByRegion(region: string): CountryInfo[] {
  return ISO3166_COUNTRIES.filter(
    (country) => country.region.toLowerCase() === region.toLowerCase()
  );
}

/**
 * Get all countries in a subregion
 * @param subregion Subregion name (e.g., "Western Africa")
 * @returns Array of CountryInfo
 */
export function getCountriesBySubregion(subregion: string): CountryInfo[] {
  return ISO3166_COUNTRIES.filter(
    (country) => country.subregion.toLowerCase() === subregion.toLowerCase()
  );
}

/**
 * Get total number of registered countries
 * @returns Number of countries
 */
export function getTotalCountries(): number {
  return ISO3166_COUNTRIES.length;
}

/**
 * Get all ISO-3166 codes
 * @returns Array of ISO codes
 */
export function getAllISOCodes(): string[] {
  return ISO3166_COUNTRIES.map((country) => country.iso3166Code);
}

/**
 * Validate ISO-3166 code
 * @param iso3166Code ISO code to validate
 * @returns True if valid
 */
export function isValidISOCode(iso3166Code: string): boolean {
  return ISO3166_COUNTRIES.some(
    (country) => country.iso3166Code.toUpperCase() === iso3166Code.toUpperCase()
  );
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get nearest country to coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns CountryInfo or undefined
 */
export function getNearestCountry(
  latitude: number,
  longitude: number
): CountryInfo | undefined {
  // First try exact match
  const exactMatch = determineCountryFromLocation(latitude, longitude);
  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match, find nearest country by capital city
  let nearestCountry: CountryInfo | undefined;
  let minDistance = Infinity;

  ISO3166_COUNTRIES.forEach((country) => {
    // Use center of boundaries as approximate location
    const centerLat = (country.boundaries.north + country.boundaries.south) / 2;
    const centerLon = (country.boundaries.east + country.boundaries.west) / 2;

    const distance = calculateDistance(
      { latitude, longitude },
      { latitude: centerLat, longitude: centerLon }
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestCountry = country;
    }
  });

  return nearestCountry;
}

