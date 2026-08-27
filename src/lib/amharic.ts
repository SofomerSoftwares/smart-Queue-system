/**
 * Comprehensive Amharic (አማርኛ) & Ge'ez (ግዕዝ) Library
 * 
 * Provides:
 * 1. Ethiopic Fidel Character mappings, Latin-to-Amharic conversions & phonetics
 * 2. Arabic to Ge'ez numeral conversions (፩, ፪, ፲, ፻, ፼) and number-to-words
 * 3. Ethiopian Calendar (ባሕረ ሐሳብ) date and time formatting
 * 4. Queue and Ticket formatting, announcements, and counter voice generator
 * 5. Type-safe centralized UI localization dictionary & translator t()
 */

// ============================================================================
// 1. ETHIOPIC FIDEL & PHONETIC CONVERSIONS
// ============================================================================

export const LATIN_PREFIX_TO_AMHARIC: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'ደ',
  E: 'አ',
  F: 'ፈ',
  G: 'ገ',
  H: 'ሐ',
  I: 'ኢ',
  J: 'ጀ',
  K: 'ከ',
  L: 'ለ',
  M: 'መ',
  N: 'ነ',
  O: 'ኦ',
  P: 'ፓ',
  Q: 'ቀ',
  R: 'ረ',
  S: 'ሰ',
  T: 'ተ',
  U: 'ኡ',
  V: 'ቨ',
  W: 'ወ',
  X: 'ኀ',
  Y: 'የ',
  Z: 'ዘ'
};

export const AMHARIC_TO_LATIN_PHONETIC: Record<string, string> = {
  'ሀ': 'Ha', 'ሁ': 'Hu', 'ሂ': 'Hi', 'ሃ': 'Haa', 'ሄ': 'He', 'ህ': 'H', 'ሆ': 'Ho',
  'ለ': 'Le', 'ሉ': 'Lu', 'ሊ': 'Li', 'ላ': 'Laa', 'ሌ': 'Lee', 'ል': 'L', 'ሎ': 'Lo',
  'ሐ': 'Hha', 'ሑ': 'Hhu', 'ሒ': 'Hhi', 'ሓ': 'Hhaa', 'ሔ': 'Hhee', 'ሕ': 'Hh', 'ሖ': 'Hho',
  'መ': 'Me', 'ሙ': 'Mu', 'ሚ': 'Mi', 'ማ': 'Maa', 'ሜ': 'Mee', 'ም': 'M', 'ሞ': 'Mo',
  'ሠ': 'Se', 'ሡ': 'Su', 'ሢ': 'Si', 'ሣ': 'Saa', 'ሤ': 'See', 'ሥ': 'S', 'ሦ': 'So',
  'ረ': 'Re', 'ሩ': 'Ru', 'ሪ': 'Ri', 'ራ': 'Raa', 'ሬ': 'Ree', 'ር': 'R', 'ሮ': 'Ro',
  'ሰ': 'Se', 'ሱ': 'Su', 'ሲ': 'Si', 'ሳ': 'Saa', 'ሴ': 'See', 'ስ': 'S', 'ሶ': 'So',
  'ሸ': 'She', 'ሹ': 'Shu', 'ሺ': 'Shi', 'ሻ': 'Shaa', 'ሼ': 'Shee', 'ሽ': 'Sh', 'ሾ': 'Sho',
  'ቀ': 'Ke', 'ቁ': 'Ku', 'ቂ': 'Ki', 'ቃ': 'Kaa', 'ቄ': 'Kee', 'ቅ': 'K', 'ቆ': 'Ko',
  'በ': 'Be', 'ቡ': 'Bu', 'ቢ': 'Bi', 'ባ': 'Baa', 'ቤ': 'Bee', 'ብ': 'B', 'ቦ': 'Bo',
  'ቨ': 'Ve', 'ቩ': 'Vu', 'ቪ': 'Vi', 'ቫ': 'Vaa', 'ቬ': 'Vee', 'ቭ': 'V', 'ቮ': 'Vo',
  'ተ': 'Te', 'ቱ': 'Tu', 'ቲ': 'Ti', 'ታ': 'Taa', 'ቴ': 'Tee', 'ት': 'T', 'ቶ': 'To',
  'ቸ': 'Che', 'ቹ': 'Chu', 'ቺ': 'Chi', 'ቻ': 'Chaa', 'ቼ': 'Chee', 'ች': 'Ch', 'ቾ': 'Cho',
  'ኀ': 'Hhe', 'ኁ': 'Hhu', 'ኂ': 'Hhi', 'ኃ': 'Hhaa', 'ኄ': 'Hhee', 'ኅ': 'Hh', 'ኆ': 'Hho',
  'ነ': 'Ne', 'ኑ': 'Nu', 'ኒ': 'Ni', 'ና': 'Naa', 'ኔ': 'Nee', 'ን': 'N', 'ኖ': 'No',
  'ኘ': 'Nye', 'ኙ': 'Nyu', 'ኚ': 'Nyi', 'ኛ': 'Nyaa', 'ኜ': 'Nyee', 'ኝ': 'Ny', 'ኞ': 'Nyo',
  'አ': 'Ah', 'ኡ': 'Oo', 'ኢ': 'Ee', 'ኣ': 'Aah', 'ኤ': 'Ay', 'እ': 'Ih', 'ኦ': 'Oh',
  'ከ': 'Ke', 'ኩ': 'Ku', 'ኪ': 'Ki', 'ካ': 'Kaa', 'ኬ': 'Kee', 'ክ': 'K', 'ኮ': 'Ko',
  'ወ': 'We', 'ዉ': 'Wu', 'ዊ': 'Wi', 'ዋ': 'Waa', 'ዌ': 'Wee', 'ው': 'W', 'ዎ': 'Wo',
  'ዐ': 'Ah', 'ዑ': 'Oo', 'ዒ': 'Ee', 'ዓ': 'Aah', 'ዔ': 'Ay', 'ዕ': 'Ih', 'ዖ': 'Oh',
  'ዘ': 'Ze', 'ዙ': 'Zu', 'ዚ': 'Zi', 'ዛ': 'Zaa', 'ዜ': 'Zee', 'ዝ': 'Z', 'ዞ': 'Zo',
  'ዠ': 'Zhe', 'ዡ': 'Zhu', 'ዢ': 'Zhi', 'ዣ': 'Zhaa', 'ዤ': 'Zhee', 'ዥ': 'Zh', 'ዦ': 'Zho',
  'የ': 'Ye', 'ዩ': 'Yu', 'ዪ': 'Yi', 'ያ': 'Yaa', 'ዬ': 'Yee', 'ይ': 'Y', 'ዮ': 'Yo',
  'ደ': 'De', 'ዱ': 'Du', 'ዲ': 'Di', 'ዳ': 'Daa', 'ዴ': 'Dee', 'ድ': 'D', 'ዶ': 'Do',
  'ጀ': 'Je', 'ጁ': 'Ju', 'ጂ': 'Ji', 'ጃ': 'Jaa', 'ጄ': 'Jee', 'ጅ': 'J', 'ጆ': 'Jo',
  'ገ': 'Ge', 'ጉ': 'Gu', 'ጊ': 'Gi', 'ጋ': 'Gaa', 'ጌ': 'Gee', 'ግ': 'G', 'ጎ': 'Go',
  'ጠ': 'Tte', 'ጡ': 'Ttu', 'ጢ': 'Tti', 'ጣ': 'Ttaa', 'ጤ': 'Ttee', 'ጥ': 'Tt', 'ጦ': 'Tto',
  'ጨ': 'Chte', 'ጩ': 'Chtu', 'ጪ': 'Chti', 'ጫ': 'Chtaa', 'ጬ': 'Chtee', 'ጭ': 'Cht', 'ጮ': 'Chto',
  'ጰ': 'Ppe', 'ጱ': 'Ppu', 'ጲ': 'Ppi', 'ጳ': 'Ppaa', 'ጴ': 'Ppee', 'ጵ': 'Pp', 'ጶ': 'Ppo',
  'ጸ': 'Tse', 'ጹ': 'Tsu', 'ጺ': 'Tsi', 'ጻ': 'Tsaa', 'ጼ': 'Tsee', 'ጽ': 'Ts', 'ጾ': 'Tso',
  'ፀ': 'Tse', 'ፁ': 'Tsu', 'ፂ': 'Tsi', 'ፃ': 'Tsaa', 'ፄ': 'Tsee', 'ፅ': 'Ts', 'ፆ': 'Tso',
  'ፈ': 'Fe', 'ፉ': 'Fu', 'ፊ': 'Fi', 'ፋ': 'Faa', 'ፌ': 'Fee', 'ፍ': 'F', 'ፎ': 'Fo',
  'ፓ': 'Pa', 'ፑ': 'Pu', 'ፒ': 'Pi', 'ፔ': 'Pee', 'ፕ': 'P', 'ፖ': 'Po'
};

export const AMHARIC_WORDS_PHONETIC_MAP: Record<string, string> = {
  'ቲኬት': 'Ticket',
  'ቁጥር': 'Kutir',
  'ያላችሁ': 'yalachu',
  'ደንበኛ': 'denbenya',
  'እባክዎ': 'ibakiwo',
  'እባኮን': 'ibakon',
  'ወደ': 'wode',
  'መስኮት': 'meskot',
  'ይሂዱ': 'yihidu',
  'ይቅረቡ': 'yikrebu',
  'አዲስ': 'Addis',
  'ማመልከቻ': 'mamelkecha',
  'ክፍያ': 'kifiya',
  'ምዝገባ': 'mizgeba',
  'ማረጋገጫ': 'maregagecha',
  'ፈጣን': 'fetan',
  'አገልግሎት': 'ageliglot',
  'መስተንግዶ': 'mestengdo',
  'ተጠናቋል': 'tetennakwal'
};

/**
 * Transliterates an Amharic or mixed phrase into smooth readable Latin phonetic text
 */
export function transliterateToPhonetic(text: string): string {
  if (!text) return '';
  let result = text;

  // 1. Replace known full words first
  Object.keys(AMHARIC_WORDS_PHONETIC_MAP).forEach((word) => {
    result = result.split(word).join(AMHARIC_WORDS_PHONETIC_MAP[word]);
  });

  // 2. Replace individual Ethiopic characters
  const chars = Array.from(result);
  const transformed = chars.map((char) => AMHARIC_TO_LATIN_PHONETIC[char] || char);
  return transformed.join('');
}

// ============================================================================
// 2. GE'EZ NUMERALS & NUMBER-TO-WORDS CONVERTER (የግዕዝ ቁጥሮች)
// ============================================================================

const GEEZ_ONES = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
const GEEZ_TENS = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];
const GEEZ_HUNDRED = '፻';
const GEEZ_TEN_THOUSAND = '፼';

/**
 * Converts standard Arabic integers (1 - 999,999) into authentic Ge'ez numerals.
 * Example: 1 -> ፩, 15 -> ፲፭, 100 -> ፻, 105 -> ፻፭, 2026 -> ፳፻፳፮
 */
export function arabicToGeez(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return num.toString();
  if (num > 999999) return num.toString();

  const convertTwoDigits = (n: number): string => {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return (GEEZ_TENS[tens] || '') + (GEEZ_ONES[ones] || '');
  };

  let result = '';

  // Handle 10,000s (፼)
  if (num >= 10000) {
    const myriad = Math.floor(num / 10000);
    num %= 10000;
    const myriadStr = myriad === 1 ? '' : convertTwoDigits(myriad);
    result += myriadStr + GEEZ_TEN_THOUSAND;
  }

  // Handle 100s (፻)
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    num %= 100;
    const hundredStr = hundred === 1 ? '' : convertTwoDigits(hundred);
    result += hundredStr + GEEZ_HUNDRED;
  }

  // Handle remainder 1..99
  if (num > 0) {
    result += convertTwoDigits(num);
  }

  return result || '፩';
}

const AMHARIC_ONES_WORDS = [
  '', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'
];

const AMHARIC_TEENS_WORDS = [
  'አስር', 'አስራ አንድ', 'አስራ ሁለት', 'አስራ ሶስት', 'አስራ አራት',
  'አስራ አምስት', 'አስራ ስድስት', 'አስራ ሰባት', 'አስራ ስምንት', 'አስራ ዘጠኝ'
];

const AMHARIC_TENS_WORDS = [
  '', 'አስር', 'ሃያ', 'ሰላሳ', 'አርባ', 'ሃምሳ', 'ስልሳ', 'ሰባ', 'ሰማንያ', 'ዘጠና'
];

/**
 * Converts a positive integer to full spoken Amharic words.
 * Example: 1 -> "አንድ", 15 -> "አስራ አምስት", 102 -> "አንድ መቶ ሁለት", 1500 -> "አንድ ሺህ አምስት መቶ"
 */
export function numberToAmharicWords(num: number): string {
  if (num === 0) return 'ዜሮ';
  if (num < 0) return `ኔጌቲቭ ${numberToAmharicWords(Math.abs(num))}`;

  let words = '';

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    words += `${numberToAmharicWords(thousands)} ሺህ `;
  }

  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    num %= 100;
    const prefix = hundreds === 1 ? 'አንድ ' : `${AMHARIC_ONES_WORDS[hundreds]} `;
    words += `${prefix}መቶ `;
  }

  // Tens and ones
  if (num >= 20) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    words += `${AMHARIC_TENS_WORDS[tens]} `;
    if (ones > 0) {
      words += `${AMHARIC_ONES_WORDS[ones]} `;
    }
  } else if (num >= 10) {
    words += `${AMHARIC_TEENS_WORDS[num - 10]} `;
  } else if (num > 0) {
    words += `${AMHARIC_ONES_WORDS[num]} `;
  }

  return words.trim();
}

/**
 * Returns an ordinal representation in Amharic (e.g. 1ኛ / አንደኛ)
 */
export function toAmharicOrdinal(num: number, fullWord = false): string {
  const ordinals: Record<number, string> = {
    1: 'አንደኛ',
    2: 'ሁለተኛ',
    3: 'ሶስተኛ',
    4: 'አራተኛ',
    5: 'አምስተኛ',
    6: 'ስድስተኛ',
    7: 'ሰባተኛ',
    8: 'ስምንተኛ',
    9: 'ዘጠነኛ',
    10: 'አስረኛ'
  };

  if (fullWord && ordinals[num]) {
    return ordinals[num];
  }
  return `${num}ኛ`;
}

// ============================================================================
// 3. QUEUE & TICKET AMHARIC UTILITIES
// ============================================================================

/**
 * Formats standard ticket strings like "A-001" to Amharic equivalents "ሀ-001 (፩)"
 */
export function formatTicketNumberAmharic(ticketNumber: string): string {
  if (!ticketNumber) return '';
  const parts = ticketNumber.split('-');
  if (parts.length === 2) {
    const prefix = parts[0].toUpperCase();
    const numPart = parseInt(parts[1], 10);
    const amharicLetter = LATIN_PREFIX_TO_AMHARIC[prefix] || prefix;
    return `${amharicLetter}-${parts[1]}`;
  }
  return ticketNumber;
}

/**
 * Generates an official spoken announcement text in Amharic
 */
export function buildAmharicAnnouncement(ticketNumber: string, counterNumber: number | string, serviceName?: string): string {
  const ticketAmharic = formatTicketNumberAmharic(ticketNumber);
  const counterStr = counterNumber.toString().padStart(2, '0');
  const servicePart = serviceName ? ` ለ${serviceName}` : '';
  return `ቲኬት ቁጥር ${ticketAmharic}${servicePart} እባክዎ ወደ መስኮት ${counterStr} ይሂዱ።`;
}

/**
 * Generates an official spoken announcement text in English
 */
export function buildEnglishAnnouncement(ticketNumber: string, counterNumber: number | string, serviceName?: string): string {
  const counterStr = counterNumber.toString().padStart(2, '0');
  const servicePart = serviceName ? ` for ${serviceName}` : '';
  return `Ticket number ${ticketNumber}${servicePart}, please proceed to counter ${counterStr}.`;
}

// ============================================================================
// 4. ETHIOPIAN CALENDAR & DATE TIME LOCALIZATION (ባሕረ ሐሳብ)
// ============================================================================

export const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
];

export const ETHIOPIAN_DAYS = [
  'እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'አርብ', 'ቅዳሜ'
];

export interface EthiopianDate {
  year: number;
  month: number;
  monthName: string;
  day: number;
  dayName: string;
  geezDay: string;
  geezYear: string;
}

/**
 * Converts a Gregorian JavaScript Date to Ethiopian Calendar Date
 */
export function gregorianToEthiopianDate(date: Date = new Date()): EthiopianDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const dayOfWeek = date.getDay();

  // Julian Day Number Calculation
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  const jdn = gd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Ethiopian Era base offset (JD 1723856 is 1 Meskerem 1 EE)
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  
  const ethYear = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const validMonth = Math.min(Math.max(ethMonth, 1), 13);
  const monthName = ETHIOPIAN_MONTHS[validMonth - 1] || 'መስከረም';
  const dayName = ETHIOPIAN_DAYS[dayOfWeek] || 'እሁድ';

  return {
    year: ethYear,
    month: validMonth,
    monthName,
    day: ethDay,
    dayName,
    geezDay: arabicToGeez(ethDay),
    geezYear: arabicToGeez(ethYear)
  };
}

/**
 * Formats an Ethiopian Date String (e.g. "ማክሰኞ፣ ጳጉሜን ፩ ቀን ፳፻፲፮ ዓ.ም")
 */
export function formatEthiopianDateString(date: Date = new Date(), options?: { useGeez?: boolean }): string {
  const eth = gregorianToEthiopianDate(date);
  const dayStr = options?.useGeez ? `${eth.geezDay} (${eth.day})` : eth.day.toString();
  const yearStr = options?.useGeez ? eth.geezYear : eth.year.toString();
  return `${eth.dayName}፣ ${eth.monthName} ${dayStr} ቀን ${yearStr} ዓ.ም`;
}

/**
 * Formats relative elapsed time in Amharic (e.g. "ከ 5 ደቂቃ በፊት", "አሁን")
 */
export function formatAmharicRelativeTime(minutesAgo: number): string {
  if (minutesAgo <= 0) return 'አሁን';
  if (minutesAgo === 1) return 'ከ 1 ደቂቃ በፊት';
  if (minutesAgo < 60) return `ከ ${minutesAgo} ደቂቃ በፊት`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours === 1) return 'ከ 1 ሰዓት በፊት';
  return `ከ ${hours} ሰዓት በፊት`;
}

// ============================================================================
// 5. CENTRALIZED LOCALIZATION DICTIONARY & TRANSLATION ENGINE (i18n)
// ============================================================================

export type SupportedLanguage = 'AMHARIC' | 'ENGLISH';

export const AMHARIC_DICTIONARY = {
  // Navigation & General
  'app.name': { am: 'የወረፋ አስተዳደር ስርዓት', en: 'Smart Queue Management' },
  'nav.display': { am: 'የስክሪን እይታ', en: 'TV Public Display' },
  'nav.reception': { am: 'መስተንግዶ ዴስክ', en: 'Reception Desk' },
  'nav.officer': { am: 'የአገልግሎት መስኮት', en: 'Officer Counter Station' },
  'nav.customer': { am: 'የደንበኛ መከታተያ', en: 'Mobile Tracker' },
  'nav.admin': { am: 'አስተዳደር ማዕከል', en: 'Admin Control' },
  'nav.reports': { am: 'ትንታኔ እና ሪፖርት', en: 'Analytics & Reports' },
  'nav.login': { am: 'የሰራተኛ መግቢያ', en: 'Staff Login' },
  'nav.collapse': { am: 'አሳንስ', en: 'Collapse' },

  // Queue Status
  'status.waiting': { am: 'በመጠባበቅ ላይ', en: 'Waiting' },
  'status.serving': { am: 'በማስተናገድ ላይ', en: 'Serving' },
  'status.completed': { am: 'የተጠናቀቀ', en: 'Completed' },
  'status.noShow': { am: 'ያልቀረበ', en: 'No-Show' },
  'status.transferred': { am: 'የተላለፈ', en: 'Transferred' },
  'status.cancelled': { am: 'የተሰረዘ', en: 'Cancelled' },

  // Actions
  'action.callNext': { am: 'ቀጣይ ጥራ', en: 'Call Next' },
  'action.recall': { am: 'እንደገና ጥራ', en: 'Recall' },
  'action.startService': { am: 'አገልግሎት ጀምር', en: 'Start Service' },
  'action.complete': { am: 'አጠናቅቅ', en: 'Complete' },
  'action.markNoShow': { am: 'አልቀረበም', en: 'No Show' },
  'action.transfer': { am: 'አስተላልፍ', en: 'Transfer' },
  'action.cancel': { am: 'ሰርዝ', en: 'Cancel' },
  'action.save': { am: 'አስቀምጥ', en: 'Save' },
  'action.print': { am: 'አትም', en: 'Print' },
  'action.refresh': { am: 'አድስ', en: 'Refresh' },
  'action.enableAudio': { am: 'ድምፅ አንቃ', en: 'Enable Audio' },
  'action.musicOn': { am: 'ሙዚቃ በርቷል', en: 'Music On' },
  'action.musicOff': { am: 'ሙዚቃ አጥፋ', en: 'Music Off' },

  // Counter & Screen
  'screen.nowServing': { am: 'አሁን የሚስተናገደው', en: 'Now Serving' },
  'screen.counter': { am: 'መስኮት', en: 'Counter' },
  'screen.ticket': { am: 'ቲኬት', en: 'Ticket' },
  'screen.service': { am: 'አገልግሎት', en: 'Service' },
  'screen.waitingList': { am: 'ቀጣይ ተረኞች', en: 'Upcoming Waiting List' },
  'screen.noActiveCall': { am: 'በአሁኑ ሰዓት የተጠራ ቲኬት የለም', en: 'No active ticket called' },
  'screen.liveDisplay': { am: 'የቀጥታ ስክሪን', en: 'Live Display' },

  // Voice & AI
  'voice.addisAi': { am: 'አዲስ AI ድምፅ', en: 'Addis AI Voice' },
  'voice.officialVoice': { am: 'ይፋዊ የአማርኛ ድምፅ ስርዓት', en: 'Official Amharic Audio System' },
  'voice.selectVoice': { am: 'የአማርኛ ድምፅ ይምረጡ', en: 'Select Amharic Voice' },
  'voice.testVoice': { am: 'ድምፅ ፈትን', en: 'Test Voice' },

  // Mobile / Customer
  'customer.yourPosition': { am: 'የእርስዎ የወረፋ ደረጃ', en: 'Your Queue Position' },
  'customer.estimatedWait': { am: 'ግምታዊ የጥበቃ ጊዜ', en: 'Estimated Wait Time' },
  'customer.peopleAhead': { am: 'ከእርስዎ በፊት ያሉ ደንበኞች', en: 'Customers Ahead' },
  'customer.minutes': { am: 'ደቂቃዎች', en: 'Minutes' },
  'customer.proceedToCounter': { am: 'እባክዎ ወደተመደበልዎት መስኮት ይሂዱ', en: 'Please proceed to your assigned counter' }
} as const;

export type TranslationKey = keyof typeof AMHARIC_DICTIONARY;

/**
 * Universal translation helper t()
 * Returns Amharic or English based on selected language, with optional default fallback or variable replacements.
 * 
 * Example:
 *   t('screen.counter', 'AMHARIC') => "መስኮት"
 *   t('screen.counter', 'ENGLISH') => "Counter"
 */
export function t(
  key: TranslationKey | string,
  lang: SupportedLanguage = 'AMHARIC',
  defaultTextOrParams?: string | Record<string, string | number>,
  params?: Record<string, string | number>
): string {
  const dictionaryKey = key as TranslationKey;
  const item = (AMHARIC_DICTIONARY as Record<string, { am: string; en: string }>)[key];

  let text: string;
  let actualParams: Record<string, string | number> | undefined;

  if (item) {
    text = lang === 'AMHARIC' ? item.am : item.en;
    if (typeof defaultTextOrParams === 'object' && defaultTextOrParams !== null) {
      actualParams = defaultTextOrParams;
    } else {
      actualParams = params;
    }
  } else {
    if (typeof defaultTextOrParams === 'string') {
      text = defaultTextOrParams;
    } else {
      text = key;
    }
    if (typeof defaultTextOrParams === 'object' && defaultTextOrParams !== null) {
      actualParams = defaultTextOrParams;
    } else {
      actualParams = params;
    }
  }

  if (actualParams) {
    Object.keys(actualParams).forEach((paramKey) => {
      text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(actualParams![paramKey]));
    });
  }

  return text;
}

/**
 * Export unified Amharic Library instance
 */
export const AmharicLib = {
  fidel: {
    latinToAmharic: LATIN_PREFIX_TO_AMHARIC,
    amharicToLatin: AMHARIC_TO_LATIN_PHONETIC,
    transliterateToPhonetic
  },
  numbers: {
    toGeez: arabicToGeez,
    toWords: numberToAmharicWords,
    toOrdinal: toAmharicOrdinal
  },
  calendar: {
    months: ETHIOPIAN_MONTHS,
    days: ETHIOPIAN_DAYS,
    toEthiopianDate: gregorianToEthiopianDate,
    formatDateString: formatEthiopianDateString,
    relativeTime: formatAmharicRelativeTime
  },
  queue: {
    formatTicket: formatTicketNumberAmharic,
    buildAmharicAnnouncement,
    buildEnglishAnnouncement
  },
  i18n: {
    dictionary: AMHARIC_DICTIONARY,
    t
  }
};

export default AmharicLib;
