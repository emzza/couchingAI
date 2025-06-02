export interface Coach {
  id: string;
  name: string;
  email: string;
  billingInfo: {
    totalContacts: number;
    totalBilled: number;
    lastBillingDate: string | null;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
}

export interface Phrase {
  id: string;
  text: string;
  coachName: string;
  sendDateTime: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  timezone: string;
}

export type Platform = 'telegram' | 'whatsapp';

export interface Contact {
  id: string;
  name: string;
  telegramId?: string;
  whatsappNumber?: string;
  platform: Platform;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastInteractionAt?: string;
  timezone: string;
}

export enum AppView {
  CoachLogin = 'COACH_LOGIN',
  Dashboard = 'DASHBOARD',
  ManagePhrases = 'MANAGE_PHRASES',
  ManageContacts = 'MANAGE_CONTACTS',
  SimulateSend = 'SIMULATE_SEND',
  Settings = 'SETTINGS',
  Payments = 'PAYMENTS'
}