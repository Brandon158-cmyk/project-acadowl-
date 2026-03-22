// Seed data constants and helpers for comprehensive test data generation

// ── Zambian Names ──
export const MALE_NAMES = [
  'Bwalya','Chileshe','Mwamba','Chanda','Musonda','Kalaba','Tembo','Zulu',
  'Mumba','Ngosa','Kapembwa','Mulenga','Kabwe','Lungu','Sinkala','Changala',
  'Katongo','Nkonde','Sakala','Kondwani','Mpundu','Chansa','Lubinda','Kanyanta',
  'Mainza','Hakainde','Mubanga','Chimuka','Chewe','Mutinta','Chalwe','Mwila',
  'Kangwa','Chipili','Mwansa','Kampamba','Lupiya','Mwape','Kasongo','Mwelwa',
];
export const FEMALE_NAMES = [
  'Mwansa','Chilufya','Mutale','Bupe','Natasha','Thandiwe','Chipo','Monde',
  'Miyanda','Naomi','Esther','Grace','Faith','Hope','Ruth','Brenda','Mary',
  'Agnes','Charity','Joyce','Precious','Gift','Towela','Mapalo','Luse',
  'Temwani','Wezi','Nchimunya','Nakamba','Chimwemwe','Bwalya','Mwaka','Nsama',
  'Mwangala','Chibesa','Inonge','Namukolo','Kasonde','Chama','Mwandu',
];
export const LAST_NAMES = [
  'Banda','Phiri','Mwale','Tembo','Zulu','Mwamba','Chanda','Musonda','Ngosa',
  'Mumba','Kalaba','Lungu','Kabwe','Sinkala','Daka','Simukonda','Bwalya',
  'Kapembwa','Nkonde','Changala','Sakala','Katongo','Mulenga','Zimba','Moyo',
  'Nyirenda','Chilufya','Mbewe','Kaunda','Chisanga','Siame','Mukuka','Chela',
  'Mwewa','Kasoma','Chipimo','Nkombo','Mutale','Kangwa','Chishimba',
];

export const SUBJECTS_SECONDARY = [
  { name: 'Mathematics', code: 'MATH', isCore: true, cat: 'core' as const },
  { name: 'English Language', code: 'ENG', isCore: true, cat: 'core' as const },
  { name: 'Integrated Science', code: 'SCI', isCore: true, cat: 'core' as const },
  { name: 'Social Studies', code: 'SS', isCore: true, cat: 'core' as const },
  { name: 'Civic Education', code: 'CE', isCore: true, cat: 'core' as const },
  { name: 'Biology', code: 'BIO', isCore: false, cat: 'elective' as const },
  { name: 'Physics', code: 'PHY', isCore: false, cat: 'elective' as const },
  { name: 'Chemistry', code: 'CHEM', isCore: false, cat: 'elective' as const },
  { name: 'Geography', code: 'GEO', isCore: false, cat: 'elective' as const },
  { name: 'History', code: 'HIST', isCore: false, cat: 'elective' as const },
  { name: 'Computer Studies', code: 'CS', isCore: false, cat: 'elective' as const },
  { name: 'Religious Education', code: 'RE', isCore: false, cat: 'elective' as const },
];

export const SUBJECTS_COLLEGE = [
  { name: 'Business Studies', code: 'BUS', isCore: true, cat: 'core' as const },
  { name: 'Information Technology', code: 'IT', isCore: true, cat: 'core' as const },
  { name: 'Communication Skills', code: 'COM', isCore: true, cat: 'core' as const },
  { name: 'Accounting', code: 'ACC', isCore: false, cat: 'elective' as const },
  { name: 'Economics', code: 'ECON', isCore: false, cat: 'elective' as const },
  { name: 'Marketing', code: 'MKT', isCore: false, cat: 'elective' as const },
  { name: 'Human Resource Management', code: 'HRM', isCore: false, cat: 'elective' as const },
  { name: 'Public Administration', code: 'PA', isCore: false, cat: 'elective' as const },
  { name: 'Statistics', code: 'STAT', isCore: false, cat: 'elective' as const },
  { name: 'Law', code: 'LAW', isCore: false, cat: 'elective' as const },
];

export const SUBJECTS_PRIMARY = [
  { name: 'Mathematics', code: 'MATH', isCore: true, cat: 'core' as const },
  { name: 'English', code: 'ENG', isCore: true, cat: 'core' as const },
  { name: 'Science & Technology', code: 'SCI', isCore: true, cat: 'core' as const },
  { name: 'Social Studies', code: 'SS', isCore: true, cat: 'core' as const },
  { name: 'Creative & Technology Studies', code: 'CTS', isCore: true, cat: 'core' as const },
  { name: 'Zambian Languages', code: 'ZL', isCore: true, cat: 'core' as const },
  { name: 'Physical Education', code: 'PE', isCore: false, cat: 'elective' as const },
  { name: 'Home Economics', code: 'HE', isCore: false, cat: 'elective' as const },
];

export const ECZ_GRADING_SCALE = [
  { name: '1 - Distinction', code: '1', minScore: 75, maxScore: 100, gradeLabel: '1', points: 1, remarks: 'Distinction' },
  { name: '2 - Merit', code: '2', minScore: 60, maxScore: 74, gradeLabel: '2', points: 2, remarks: 'Merit' },
  { name: '3 - Credit', code: '3', minScore: 50, maxScore: 59, gradeLabel: '3', points: 3, remarks: 'Credit' },
  { name: '4 - Pass', code: '4', minScore: 40, maxScore: 49, gradeLabel: '4', points: 4, remarks: 'Pass' },
  { name: '9 - Fail', code: '9', minScore: 0, maxScore: 39, gradeLabel: '9', points: 9, remarks: 'Fail' },
];

export const GPA_GRADING_SCALE = [
  { name: 'A - Excellent', code: 'A', minScore: 80, maxScore: 100, gradeLabel: 'A', points: 4, remarks: 'Excellent' },
  { name: 'B+ - Very Good', code: 'B+', minScore: 70, maxScore: 79, gradeLabel: 'B+', points: 3.5, remarks: 'Very Good' },
  { name: 'B - Good', code: 'B', minScore: 60, maxScore: 69, gradeLabel: 'B', points: 3, remarks: 'Good' },
  { name: 'C+ - Above Average', code: 'C+', minScore: 50, maxScore: 59, gradeLabel: 'C+', points: 2.5, remarks: 'Above Average' },
  { name: 'C - Average', code: 'C', minScore: 40, maxScore: 49, gradeLabel: 'C', points: 2, remarks: 'Average' },
  { name: 'D - Below Average', code: 'D', minScore: 30, maxScore: 39, gradeLabel: 'D', points: 1, remarks: 'Below Average' },
  { name: 'F - Fail', code: 'F', minScore: 0, maxScore: 29, gradeLabel: 'F', points: 0, remarks: 'Fail' },
];

export const FEE_TYPES_TEMPLATE = [
  { id: 'tuition', name: 'Tuition Fee', description: 'Termly tuition fee', isRecurring: true, isOptional: false, appliesToBoarding: 'all' as const, zraVatCategory: 'exempt' as const, isActive: true, order: 1 },
  { id: 'boarding', name: 'Boarding Fee', description: 'Boarding and accommodation', isRecurring: true, isOptional: false, appliesToBoarding: 'boarding_only' as const, zraVatCategory: 'exempt' as const, isActive: true, order: 2 },
  { id: 'transport', name: 'Transport Fee', description: 'School bus transport', isRecurring: true, isOptional: true, appliesToBoarding: 'day_only' as const, zraVatCategory: 'standard' as const, isActive: true, order: 3 },
  { id: 'library', name: 'Library Fee', description: 'Library access and resources', isRecurring: true, isOptional: false, appliesToBoarding: 'all' as const, zraVatCategory: 'exempt' as const, isActive: true, order: 4 },
  { id: 'computer', name: 'Computer Lab Fee', description: 'ICT lab usage', isRecurring: true, isOptional: false, appliesToBoarding: 'all' as const, zraVatCategory: 'standard' as const, isActive: true, order: 5 },
  { id: 'exam', name: 'Examination Fee', description: 'Internal examinations', isRecurring: true, isOptional: false, appliesToBoarding: 'all' as const, zraVatCategory: 'exempt' as const, isActive: true, order: 6 },
  { id: 'pta', name: 'PTA Levy', description: 'Parent-Teacher Association levy', isRecurring: true, isOptional: false, appliesToBoarding: 'all' as const, zraVatCategory: 'levy' as const, isActive: true, order: 7 },
  { id: 'building', name: 'Building Fund', description: 'Infrastructure development', isRecurring: false, isOptional: false, appliesToBoarding: 'all' as const, zraVatCategory: 'exempt' as const, isActive: true, order: 8 },
];

export const BOOK_TITLES = [
  { title: 'Things Fall Apart', author: 'Chinua Achebe', category: 'Literature', isbn: '978-0-385-47454-2' },
  { title: 'The River Between', author: 'Ngugi wa Thiongo', category: 'Literature', isbn: '978-0-435-90534-6' },
  { title: 'Weep Not Child', author: 'Ngugi wa Thiongo', category: 'Literature', isbn: '978-0-435-90830-9' },
  { title: 'A Grain of Wheat', author: 'Ngugi wa Thiongo', category: 'Literature', isbn: '978-0-435-90043-3' },
  { title: 'New School Physics', author: 'M.W. Anyakoha', category: 'Science', isbn: '978-978-123-456-0' },
  { title: 'New General Mathematics Book 3', author: 'J.B. Channon', category: 'Mathematics', isbn: '978-0-582-31000-1' },
  { title: 'New General Mathematics Book 4', author: 'J.B. Channon', category: 'Mathematics', isbn: '978-0-582-31001-8' },
  { title: 'Oxford English Dictionary', author: 'Oxford Press', category: 'Reference', isbn: '978-0-19-861186-8' },
  { title: 'Biology for IGCSE', author: 'Mary Jones', category: 'Science', isbn: '978-0-521-01545-0' },
  { title: 'Chemistry Matters', author: 'G.C.E. Cheng', category: 'Science', isbn: '978-981-271-456-2' },
  { title: 'Zambian History for Schools', author: 'M. Kaunda', category: 'History', isbn: '978-978-000-111-0' },
  { title: 'Geography of Zambia', author: 'P. Banda', category: 'Geography', isbn: '978-978-000-222-1' },
  { title: 'Computer Studies Made Simple', author: 'T. Tembo', category: 'ICT', isbn: '978-978-000-333-2' },
  { title: 'Civic Education for Secondary', author: 'M. Phiri', category: 'Social Studies', isbn: '978-978-000-444-3' },
  { title: 'Integrated Science Book 3', author: 'ZEPH', category: 'Science', isbn: '978-978-000-555-4' },
  { title: 'Social Studies Atlas', author: 'ZEPH', category: 'Social Studies', isbn: '978-978-000-666-5' },
  { title: 'Introduction to Accounting', author: 'Frank Wood', category: 'Business', isbn: '978-0-273-75930-2' },
  { title: 'Business Studies for Beginners', author: 'K. Mwale', category: 'Business', isbn: '978-978-000-777-6' },
  { title: 'Economics Principles', author: 'N.G. Mankiw', category: 'Business', isbn: '978-1-305-58512-6' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Literature', isbn: '978-0-7432-7356-5' },
];

export const PROVINCES = ['Lusaka', 'Copperbelt', 'Southern', 'Central', 'Eastern', 'Northern', 'Luapula', 'Western', 'North-Western', 'Muchinga'];
export const DISTRICTS_LUSAKA = ['Lusaka', 'Kafue', 'Chongwe', 'Chilanga', 'Luangwa'];
export const DISTRICTS_COPPERBELT = ['Ndola', 'Kitwe', 'Mufulira', 'Luanshya', 'Chingola'];

// ── Helper Functions ──
export const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export const pickN = <T>(a: T[], n: number): T[] => {
  const s = [...a];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s.slice(0, Math.min(n, s.length));
};

export const phone = () => `+2609${Math.floor(60000000 + Math.random() * 39999999)}`;

export const ts = (dateStr: string) => new Date(dateStr).getTime();

let _uidCounter = 0;
export const seedUid = () => `seed|user-${++_uidCounter}-${Date.now()}`;
export const resetUidCounter = () => { _uidCounter = 0; };

export const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const randScore = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

export const getEczGrade = (score: number): string => {
  if (score >= 75) return '1';
  if (score >= 60) return '2';
  if (score >= 50) return '3';
  if (score >= 40) return '4';
  return '9';
};

export const getGpaGrade = (score: number): string => {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  if (score >= 30) return 'D';
  return 'F';
};

// Generate school days (Mon-Fri) between two dates
export const getSchoolDays = (startStr: string, endStr: string): string[] => {
  const days: string[] = [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) {
      days.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

// Generate invoice number
let _invCounter = 0;
export const nextInvoiceNumber = (schoolCode: string) => {
  _invCounter++;
  return `${schoolCode}-INV-${String(_invCounter).padStart(5, '0')}`;
};
export const resetInvCounter = () => { _invCounter = 0; };

let _receiptCounter = 0;
export const nextReceiptNumber = (schoolCode: string) => {
  _receiptCounter++;
  return `${schoolCode}-REC-${String(_receiptCounter).padStart(5, '0')}`;
};
export const resetReceiptCounter = () => { _receiptCounter = 0; };

let _creditNoteCounter = 0;
export const nextCreditNoteNumber = (schoolCode: string) => {
  _creditNoteCounter++;
  return `${schoolCode}-CN-${String(_creditNoteCounter).padStart(4, '0')}`;
};

// Staff role configs per school type
export const STAFF_CONFIGS = {
  secondary_boarding: [
    { role: 'school_admin' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'deputy_head' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'bursar' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'teacher' as const, cat: 'teaching' as const, count: 8 },
    { role: 'matron' as const, cat: 'non_teaching' as const, count: 2 },
    { role: 'librarian' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'driver' as const, cat: 'non_teaching' as const, count: 2 },
  ],
  combined: [
    { role: 'school_admin' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'deputy_head' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'bursar' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'teacher' as const, cat: 'teaching' as const, count: 10 },
    { role: 'matron' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'librarian' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'driver' as const, cat: 'non_teaching' as const, count: 2 },
  ],
  college: [
    { role: 'school_admin' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'deputy_head' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'bursar' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'teacher' as const, cat: 'teaching' as const, count: 8 },
    { role: 'librarian' as const, cat: 'non_teaching' as const, count: 1 },
    { role: 'driver' as const, cat: 'non_teaching' as const, count: 1 },
  ],
};

// Grade configs per school type
export const GRADE_CONFIGS = {
  secondary_boarding: [
    { name: 'Grade 8', level: 8 },
    { name: 'Grade 9', level: 9, isEczExamYear: true },
    { name: 'Grade 10', level: 10 },
    { name: 'Grade 11', level: 11 },
    { name: 'Grade 12', level: 12, isEczExamYear: true, graduationGrade: true },
  ],
  combined: [
    { name: 'Grade 1', level: 1 },
    { name: 'Grade 2', level: 2 },
    { name: 'Grade 3', level: 3 },
    { name: 'Grade 4', level: 4 },
    { name: 'Grade 5', level: 5 },
    { name: 'Grade 6', level: 6 },
    { name: 'Grade 7', level: 7, isEczExamYear: true },
    { name: 'Grade 8', level: 8 },
    { name: 'Grade 9', level: 9, isEczExamYear: true },
  ],
  college: [
    { name: 'Year 1', level: 1 },
    { name: 'Year 2', level: 2 },
    { name: 'Year 3', level: 3, graduationGrade: true },
  ],
};

// Fee amounts per grade level (ZMW)
export const FEE_AMOUNTS: Record<string, Record<string, number>> = {
  tuition: { low: 2500, mid: 4500, high: 8000 },
  boarding: { low: 3000, mid: 5000, high: 7500 },
  transport: { low: 800, mid: 1200, high: 1800 },
  library: { low: 150, mid: 250, high: 400 },
  computer: { low: 200, mid: 350, high: 500 },
  exam: { low: 300, mid: 500, high: 800 },
  pta: { low: 100, mid: 200, high: 350 },
  building: { low: 500, mid: 800, high: 1200 },
};

// Attendance status distribution (weighted)
export const attendanceStatus = (): 'present' | 'absent' | 'late' | 'excused' => {
  const r = Math.random();
  if (r < 0.82) return 'present';
  if (r < 0.90) return 'late';
  if (r < 0.96) return 'absent';
  return 'excused';
};
