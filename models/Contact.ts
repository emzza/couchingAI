import mongoose, { Schema, Document } from 'mongoose';
import { Contact } from '../types';

export interface IContact extends Omit<Contact, 'id'>, Document {}

const ContactSchema: Schema = new Schema({
  name: { type: String, required: true },
  telegramId: { type: String },
  whatsappNumber: { type: String },
  platform: { 
    type: String, 
    enum: ['telegram', 'whatsapp'],
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date },
  lastInteractionAt: { type: Date },
  timezone: { type: String, default: 'UTC' }
}, {
  timestamps: true
});

// Middleware para actualizar lastInteractionAt
ContactSchema.pre('save', function(next) {
  this.lastInteractionAt = new Date();
  next();
});

// Índices para búsquedas rápidas
ContactSchema.index({ telegramId: 1 });
ContactSchema.index({ whatsappNumber: 1 });
ContactSchema.index({ platform: 1 });
ContactSchema.index({ lastMessageAt: -1 });
ContactSchema.index({ lastInteractionAt: -1 });

export default mongoose.model<IContact>('Contact', ContactSchema); 