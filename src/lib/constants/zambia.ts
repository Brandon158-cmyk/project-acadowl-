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
