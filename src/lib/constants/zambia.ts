// Zambian provinces and their districts
export const PROVINCES: Record<string, string[]> = {
  Central: ['Chibombo', 'Chisamba', 'Chitambo', 'Itezhi-Tezhi', 'Kabwe', 'Kapiri Mposhi', 'Mkushi', 'Mumbwa', 'Ngabwe', 'Serenje', 'Shibuyunji'],
  Copperbelt: ['Chililabombwe', 'Chingola', 'Kalulushi', 'Kitwe', 'Luanshya', 'Lufwanyama', 'Masaiti', 'Mpongwe', 'Mufulira', 'Ndola'],
  Eastern: ['Chadiza', 'Chipangali', 'Chipata', 'Kasenengwa', 'Katete', 'Lundazi', 'Mambwe', 'Nyimba', 'Petauke', 'Sinda', 'Vubwi'],
  Luapula: ['Chembe', 'Chiengi', 'Chifunabuli', 'Chipili', 'Kawambwa', 'Lunga', 'Mansa', 'Milenge', 'Mwansabombwe', 'Mwense', 'Nchelenge', 'Samfya'],
  Lusaka: ['Chilanga', 'Chongwe', 'Kafue', 'Luangwa', 'Lusaka', 'Rufunsa'],
  Muchinga: ['Chama', 'Chinsali', 'Isoka', 'Kanchibiya', 'Lavushimanda', 'Mafinga', 'Mpika', 'Nakonde', 'Shiwang\'andu'],
  Northern: ['Chilubi', 'Kaputa', 'Kasama', 'Luwingu', 'Mbala', 'Mporokoso', 'Mpulungu', 'Mungwi', 'Nsama'],
  'North-Western': ['Chavuma', 'Ikelenge', 'Kabompo', 'Kalumbila', 'Kasempa', 'Manyinga', 'Mufumbwe', 'Mushindamo', 'Mwinilunga', 'Solwezi', 'Zambezi'],
  Southern: ['Chikankata', 'Choma', 'Gwembe', 'Kalomo', 'Kazungula', 'Livingstone', 'Mazabuka', 'Monze', 'Namwala', 'Pemba', 'Siavonga', 'Sinazongwe', 'Zimba'],
  Western: ['Kalabo', 'Kaoma', 'Limulunga', 'Luampa', 'Lukulu', 'Mitete', 'Mongu', 'Mulobezi', 'Mwandi', 'Nalolo', 'Nkeyema', 'Senanga', 'Sesheke', 'Shangombo', 'Sikongo', 'Sioma'],
};

// Flat list of provinces
export const PROVINCE_NAMES = Object.keys(PROVINCES);

// Get districts for a province
export function getDistrictsForProvince(province: string): string[] {
  return PROVINCES[province] ?? [];
}

export const ZAMBIA_SMS_PREFIX_MAP = {
  airtel: ['0971', '0961', '260971', '260961'],
  mtn: ['0976', '0966', '260976', '260966'],
} as const;

export type ZambiaSmsCarrier = keyof typeof ZAMBIA_SMS_PREFIX_MAP;

export function normalizeZambianPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('260')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `260${digits.slice(1)}`;
  }

  return digits;
}

export function detectZambianSmsCarrier(value: string): ZambiaSmsCarrier | null {
  const normalized = normalizeZambianPhoneNumber(value);

  if (ZAMBIA_SMS_PREFIX_MAP.airtel.some((prefix) => normalized.startsWith(prefix))) {
    return 'airtel';
  }

  if (ZAMBIA_SMS_PREFIX_MAP.mtn.some((prefix) => normalized.startsWith(prefix))) {
    return 'mtn';
  }

  return null;
}
