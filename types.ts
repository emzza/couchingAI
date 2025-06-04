export interface Coach {
  id: string;
  name: string;
  email: string;
  billingInfo: {
    totalContacts: number;
    totalBilled: number;
    lastBillingDate: string | null;
  };
}

export interface Phrase {
  id: string;
  text: string;
  coachName: string;
  sendDateTime: string; 
  createdAt: string;
}

export type Platform = 'telegram' | 'whatsapp';

export interface Contact {
  id: string;
  name: string;
  telegramId?: string;
  whatsappNumber?: string;
  platform: Platform;
  createdAt: string;
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