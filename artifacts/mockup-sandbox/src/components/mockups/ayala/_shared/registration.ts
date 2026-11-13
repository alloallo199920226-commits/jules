// Form rules, not prefilled user/account data.
export const registrationRules = {
  resendDelaySeconds: 120,
  minimumPasswordLength: 6,
  otpLength: 6,
} as const;

export const dialingCountries = [
  { id: 'BJ', name: 'Bénin', dialCode: '+229' },
  { id: 'BF', name: 'Burkina Faso', dialCode: '+226' },
  { id: 'CM', name: 'Cameroun', dialCode: '+237' },
  { id: 'CI', name: 'Côte d’Ivoire', dialCode: '+225' },
  { id: 'FR', name: 'France', dialCode: '+33' },
  { id: 'GN', name: 'Guinée', dialCode: '+224' },
  { id: 'ML', name: 'Mali', dialCode: '+223' },
  { id: 'NE', name: 'Niger', dialCode: '+227' },
  { id: 'SN', name: 'Sénégal', dialCode: '+221' },
  { id: 'TG', name: 'Togo', dialCode: '+228' },
];

export function invitationFromSearch(search: string) {
  const params = new URLSearchParams(search);
  return (params.get('invitation') ?? params.get('invitationCode') ?? params.get('invite') ?? params.get('code') ?? '').trim();
}

export function isPhoneValid(countryId: string, phone: string) {
  const country = dialingCountries.find((entry) => entry.id === countryId);
  return !!country && /^\d{6,14}$/.test(phone) &&
    country.dialCode.length - 1 + phone.length <= 15;
}

// Only for the local preview; never an authentication or SMS verification method.
export function generateDemoOtp() {
  const values = crypto.getRandomValues(new Uint32Array(registrationRules.otpLength));
  return Array.from(values, (value) => String(value % 10)).join('');
}
