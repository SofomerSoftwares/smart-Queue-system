// Announcement string and phonetic formatting utilities

export const PREFIX_TO_AMHARIC: Record<string, string> = {
  A: 'ሀ',
  B: 'ለ',
  C: 'ቸ',
  D: 'ደ',
  E: 'አ',
  F: 'ፈ',
  G: 'ገ',
  H: 'ሐ',
  P: 'ፓ',
  R: 'ረ',
  S: 'ሰ',
  T: 'ተ',
  W: 'ወ',
  Z: 'ዘ'
};

export const PREFIX_TO_PHONETIC: Record<string, string> = {
  A: 'Ha',
  B: 'Le',
  C: 'Che',
  D: 'De',
  E: 'Ah',
  F: 'Fe',
  G: 'Ge',
  H: 'Hha',
  P: 'Pa',
  R: 'Re',
  S: 'Se',
  T: 'Te',
  W: 'We',
  Z: 'Ze'
};

export function getAmharicTicketNumber(ticketNumber: string): string {
  const parts = ticketNumber.split('-');
  if (parts.length === 2) {
    const prefix = parts[0].toUpperCase();
    const amharicLetter = PREFIX_TO_AMHARIC[prefix] || prefix;
    return `${amharicLetter}-${parts[1]}`;
  }
  return ticketNumber;
}

export function buildAmharicAnnouncementText(
  ticketNumber: string,
  counterNumber: number,
  serviceName?: string
): string {
  const amharicTicket = getAmharicTicketNumber(ticketNumber);
  const serviceText = serviceName ? ` (${serviceName})` : '';
  return `ቁጥር ${amharicTicket}${serviceText} ያላችሁ ደንበኛ፣ እባክዎ ወደ ቆጣሪ ${counterNumber} ይሂዱ።`;
}

export function buildEnglishAnnouncementText(
  ticketNumber: string,
  counterNumber: number,
  serviceName?: string
): string {
  const serviceText = serviceName ? ` for ${serviceName}` : '';
  return `Ticket number ${ticketNumber}${serviceText}, please proceed to counter ${counterNumber}.`;
}

export function buildPhoneticAnnouncementText(
  ticketNumber: string,
  counterNumber: number,
  serviceName?: string
): string {
  const parts = ticketNumber.split('-');
  const prefix = (parts[0] || 'A').toUpperCase();
  const numPart = parts[1] || '001';
  const prefixPhonetic = PREFIX_TO_PHONETIC[prefix] || prefix;

  const spacedDigits = numPart.split('').join(' ');
  const serviceText = serviceName ? ` for ${serviceName}` : '';

  return `Kutir ${prefixPhonetic} ${spacedDigits} yalachu denbenya, ibakiwo wode kotari ${counterNumber} yihidu. Ticket number ${parts[0]}-${numPart}${serviceText}, please proceed to counter ${counterNumber}.`;
}
