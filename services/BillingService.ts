import { Coach, Contact } from '../types';

const CONTACT_PRICE_USD = 2.5;

export const calculateBilling = (coach: Coach, newContactsCount: number): {
  totalContacts: number;
  totalBilled: number;
  newBillingAmount: number;
} => {
  const newTotalContacts = coach.billingInfo.totalContacts + newContactsCount;
  const newBillingAmount = newContactsCount * CONTACT_PRICE_USD;
  const newTotalBilled = coach.billingInfo.totalBilled + newBillingAmount;

  return {
    totalContacts: newTotalContacts,
    totalBilled: newTotalBilled,
    newBillingAmount
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const getBillingSummary = (coach: Coach): {
  totalContacts: number;
  totalBilled: string;
  lastBillingDate: string;
} => {
  return {
    totalContacts: coach.billingInfo.totalContacts,
    totalBilled: formatCurrency(coach.billingInfo.totalBilled),
    lastBillingDate: coach.billingInfo.lastBillingDate 
      ? new Date(coach.billingInfo.lastBillingDate).toLocaleDateString('es-ES')
      : 'Nunca'
  };
}; 