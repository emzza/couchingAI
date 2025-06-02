export type Platform = 'telegram' | 'whatsapp';

export interface Contact {
  id: string;
  name: string;
  telegramId?: string;
  whatsappNumber?: string;
  platform: Platform;
  createdAt: string;
} 