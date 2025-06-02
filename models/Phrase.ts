import mongoose, { Schema, Document } from 'mongoose';
import { Phrase } from '../types';

export interface IPhrase extends Omit<Phrase, 'id'>, Document {}

const PhraseSchema: Schema = new Schema({
  text: { type: String, required: true },
  coachName: { type: String, required: true },
  sendDateTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  timezone: { type: String, default: 'UTC' }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
PhraseSchema.index({ coachName: 1 });
PhraseSchema.index({ sendDateTime: 1 });
PhraseSchema.index({ createdAt: 1 });
PhraseSchema.index({ status: 1 });
PhraseSchema.index({ sentAt: 1 });

export default mongoose.model<IPhrase>('Phrase', PhraseSchema); 