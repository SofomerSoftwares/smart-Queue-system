/**
 * Amharic & Ge'ez Library for Backend Services & Routes
 */

export const LATIN_PREFIX_TO_AMHARIC: Record<string, string> = {
  A: 'ኤ',
  B: 'ቢ',
  C: 'ሲ',
  D: 'ዲ',
  E: 'ኢ',
  F: 'ኤፍ',
  G: 'ጂ',
  H: 'ኤች',
  I: 'አይ',
  J: 'ጄ',
  K: 'ኬ',
  L: 'ኤል',
  M: 'ኤም',
  N: 'ኤን',
  O: 'ኦ',
  P: 'ፒ',
  Q: 'ኪው',
  R: 'አር',
  S: 'ኤስ',
  T: 'ቲ',
  U: 'ዩ',
  V: 'ቪ',
  W: 'ደብልዩ',
  X: 'ኤክስ',
  Y: 'ዋይ',
  Z: 'ዜድ'
};

export const AMHARIC_WORDS_PHONETIC_MAP: Record<string, string> = {
  'ቲኬት': 'Ticket',
  'ቁጥር': 'Kutir',
  'ያላችሁ': 'yalachu',
  'ደንበኛ': 'denbenya',
  'እባክዎ': 'ibakiwo',
  'እባኮን': 'ibakon',
  'ወደ': 'wode',
  'ቆጣሪ': 'kotari',
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
  'ተጠናቋል': 'tetennakwal',
  'ኤ-': 'A-',
  'ቢ-': 'B-',
  'ሲ-': 'C-',
  'ዲ-': 'D-',
  'ኢ-': 'E-',
  'ኤፍ-': 'F-',
  'ጂ-': 'G-',
  'ኤች-': 'H-',
  'አይ-': 'I-',
  'ጄ-': 'J-',
  'ኬ-': 'K-',
  'ኤል-': 'L-',
  'ኤም-': 'M-',
  'ኤን-': 'N-',
  'ኦ-': 'O-',
  'ፒ-': 'P-',
  'ኪው-': 'Q-',
  'አር-': 'R-',
  'ኤስ-': 'S-',
  'ቲ-': 'T-',
  'ዩ-': 'U-',
  'ቪ-': 'V-',
  'ደብልዩ-': 'W-',
  'ኤክስ-': 'X-',
  'ዋይ-': 'Y-',
  'ዜድ-': 'Z-',
  '፩': '1',
  '፪': '2',
  '፫': '3',
  '፬': '4',
  '፭': '5',
  '፮': '6',
  '፯': '7',
  '፰': '8',
  '፱': '9',
  '፲': '10'
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

const GEEZ_ONES = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
const GEEZ_TENS = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];
const GEEZ_HUNDRED = '፻';
const GEEZ_TEN_THOUSAND = '፼';

export function arabicToGeez(num: number): string {
  if (num <= 0 || !Number.isInteger(num)) return num.toString();
  if (num > 999999) return num.toString();

  const convertTwoDigits = (n: number): string => {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return (GEEZ_TENS[tens] || '') + (GEEZ_ONES[ones] || '');
  };

  let result = '';
  if (num >= 10000) {
    const myriad = Math.floor(num / 10000);
    num %= 10000;
    const myriadStr = myriad === 1 ? '' : convertTwoDigits(myriad);
    result += myriadStr + GEEZ_TEN_THOUSAND;
  }
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    num %= 100;
    const hundredStr = hundred === 1 ? '' : convertTwoDigits(hundred);
    result += hundredStr + GEEZ_HUNDRED;
  }
  if (num > 0) {
    result += convertTwoDigits(num);
  }
  return result || '፩';
}

export function transliterateToPhonetic(text: string): string {
  if (!text) return '';
  let result = text;
  Object.keys(AMHARIC_WORDS_PHONETIC_MAP).forEach((word) => {
    result = result.split(word).join(AMHARIC_WORDS_PHONETIC_MAP[word]);
  });
  const chars = Array.from(result);
  return chars.map((char) => AMHARIC_TO_LATIN_PHONETIC[char] || char).join('');
}

export function formatTicketNumberAmharic(ticketNumber: string): string {
  if (!ticketNumber) return '';
  const parts = ticketNumber.split('-');
  if (parts.length === 2) {
    const prefix = parts[0].toUpperCase();
    const amharicLetter = LATIN_PREFIX_TO_AMHARIC[prefix] || prefix;
    return `${amharicLetter}-${parts[1]}`;
  }
  return ticketNumber;
}

export function buildAmharicAnnouncement(ticketNumber: string, counterNumber: number | string, serviceName?: string): string {
  const ticketAmharic = formatTicketNumberAmharic(ticketNumber);
  const counterNum = typeof counterNumber === 'number' ? counterNumber : parseInt(counterNumber, 10) || counterNumber;
  const servicePart = serviceName && serviceName.trim().length > 0 ? ` ለ${serviceName.trim()}` : '';
  return `ቲኬት ቁጥር ${ticketAmharic}${servicePart} እባክዎ ወደ መስኮት ${counterNum} ይቅረቡ።`;
}

export function buildEnglishAnnouncement(ticketNumber: string, counterNumber: number | string, serviceName?: string): string {
  const counterNum = typeof counterNumber === 'number' ? counterNumber : parseInt(counterNumber, 10) || counterNumber;
  const servicePart = serviceName && serviceName.trim().length > 0 ? ` for ${serviceName.trim()}` : '';
  return `Ticket number ${ticketNumber}${servicePart}, please proceed to counter ${counterNum}.`;
}

export function buildBilingualAnnouncement(ticketNumber: string, counterNumber: number | string, serviceNameAmharic?: string, serviceNameEnglish?: string): { amharic: string; english: string; combined: string } {
  const am = buildAmharicAnnouncement(ticketNumber, counterNumber, serviceNameAmharic);
  const en = buildEnglishAnnouncement(ticketNumber, counterNumber, serviceNameEnglish);
  return {
    amharic: am,
    english: en,
    combined: `${am} ${en}`
  };
}
