import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import i18n from '../i18n/i18n';

const currentLanguage = i18n.language;
const displayNames = new Intl.DisplayNames([currentLanguage], {
  type: 'region',
});

const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
};

export const generateCountryList = function () {
  return getCountries()
    .map((countryCode) => ({
      code: countryCode,
      name: displayNames.of(countryCode) as string,
      dialCode: `+${getCountryCallingCode(countryCode)}`,
      flag: getFlagEmoji(countryCode),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
