import mongoose, { Schema, Document } from 'mongoose';
import { Coach } from '../types';

export interface ICoach extends Omit<Coach, 'id'>, Document {}

const CoachSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  billingInfo: {
    totalContacts: { type: Number, default: 0 },
    totalBilled: { type: Number, default: 0 },
    lastBillingDate: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  lastActivityAt: { type: Date }
}, {
  timestamps: true
});

// Middleware para actualizar lastActivityAt
CoachSchema.pre('save', function(next) {
  this.lastActivityAt = new Date();
  next();
});

export default mongoose.model<ICoach>('Coach', CoachSchema); 