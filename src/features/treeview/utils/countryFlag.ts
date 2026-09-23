import { hasFlag } from 'country-flag-icons';

interface Country {
  name: string;
  flagCode?: string;
}

// Names follow the US Census state list and Canada's official province/territory list.
const US_REGIONS = new Set([
  'alabama',
  'alaska',
  'arizona',
  'arkansas',
  'california',
  'colorado',
  'connecticut',
  'delaware',
  'district of columbia',
  'florida',
  'georgia',
  'hawaii',
  'idaho',
  'illinois',
  'indiana',
  'iowa',
  'kansas',
  'kentucky',
  'louisiana',
  'maine',
  'maryland',
  'massachusetts',
  'michigan',
  'minnesota',
  'mississippi',
  'missouri',
  'montana',
  'nebraska',
  'nevada',
  'new hampshire',
  'new jersey',
  'new mexico',
  'new york',
  'north carolina',
  'north dakota',
  'ohio',
  'oklahoma',
  'oregon',
  'pennsylvania',
  'rhode island',
  'south carolina',
  'south dakota',
  'tennessee',
  'texas',
  'utah',
  'vermont',
  'virginia',
  'washington',
  'west virginia',
  'wisconsin',
  'wyoming',
]);

const US_CITY_ALIASES = new Set(['los angeles']);

const CANADIAN_REGIONS = new Set([
  'alberta',
  'british columbia',
  'manitoba',
  'new brunswick',
  'newfoundland and labrador',
  'northwest territories',
  'nova scotia',
  'nunavut',
  'ontario',
  'prince edward island',
  'quebec',
  'saskatchewan',
  'yukon',
]);

const displayNames = new Intl.DisplayNames(['en'], {
  type: 'region',
  fallback: 'none',
});
const countryCodesByName = createCountryCodesByName();

function normalizeLocationName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('en');
}

function createCountryCodesByName(): Map<string, string> {
  const codesByName = new Map<string, string>();

  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);
      if (name && hasFlag(code)) {
        codesByName.set(normalizeLocationName(name), code);
      }
    }
  }

  codesByName.set('usa', 'US');
  codesByName.set('united states of america', 'US');
  codesByName.set('uk', 'GB');
  codesByName.set('the netherlands', 'NL');
  codesByName.set('russian federation', 'RU');
  return codesByName;
}

function countryFromLocation(location?: string): Country {
  const parts = location
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const region = parts?.at(-1);
  if (!region) return { name: 'Unknown country' };

  const normalized = normalizeLocationName(region);
  const usLocation =
    US_CITY_ALIASES.has(normalized) ||
    (US_REGIONS.has(normalized) &&
      (normalized !== 'georgia' || (parts?.length ?? 0) > 1));
  const code =
    (usLocation ? 'US' : undefined) ??
    (CANADIAN_REGIONS.has(normalized) ? 'CA' : undefined) ??
    countryCodesByName.get(normalized);

  return code
    ? { name: displayNames.of(code) ?? region, flagCode: code }
    : { name: region };
}

export function countryNameFromLocation(location?: string): string {
  return countryFromLocation(location).name;
}

export function countryFlagCodeFromLocation(
  location?: string,
): string | undefined {
  return countryFromLocation(location).flagCode;
}
