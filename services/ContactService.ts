import Contact, { IContact } from '../models/Contact';
import { Contact as ContactType } from '../types';

class ContactService {
  async createContact(contactData: Omit<ContactType, 'id'>): Promise<IContact> {
    const contact = new Contact(contactData);
    return await contact.save();
  }

  async getContactByTelegramId(telegramId: string): Promise<IContact | null> {
    return await Contact.findOne({ telegramId });
  }

  async getContactByWhatsappNumber(whatsappNumber: string): Promise<IContact | null> {
    return await Contact.findOne({ whatsappNumber });
  }

  async getContactById(id: string): Promise<IContact | null> {
    return await Contact.findById(id);
  }

  async updateContact(id: string, updateData: Partial<ContactType>): Promise<IContact | null> {
    return await Contact.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await Contact.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllContacts(): Promise<IContact[]> {
    return await Contact.find().sort({ createdAt: -1 });
  }

  async getContactsByPlatform(platform: 'telegram' | 'whatsapp'): Promise<IContact[]> {
    return await Contact.find({ platform }).sort({ createdAt: -1 });
  }
}

export const contactService = new ContactService(); 