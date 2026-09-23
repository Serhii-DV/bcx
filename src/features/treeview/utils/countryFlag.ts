import { hasFlag } from 'country-flag-icons';

const countryCodesByName = createCountryCodesByName();

function createCountryCodesByName(): Map<string, string> {
  const displayNames = new Intl.DisplayNames(['en'], {
    type: 'region',
    fallback: 'none',
  });
  const codesByName = new Map<string, string>();

  for (let first = 65; first <= 90; first++) {
    for (let second = 65; second <= 90; second++) {
      const code = String.fromCharCode(first, second);
      const name = displayNames.of(code);
      if (name && hasFlag(code)) {
        codesByName.set(name.toLocaleLowerCase('en'), code);
      }
    }
  }

  codesByName.set('usa', 'US');
  codesByName.set('united states of america', 'US');
  codesByName.set('uk', 'GB');
  return codesByName;
}

export function countryFlagCodeFromLocation(
  location?: string,
): string | undefined {
  const country = location?.split(',').at(-1)?.trim();
  return country
    ? countryCodesByName.get(country.toLocaleLowerCase('en'))
    : undefined;
}
