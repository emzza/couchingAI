import Coach, { ICoach } from '../models/Coach';
import { Coach as CoachType } from '../types';

class CoachService {
  async createCoach(coachData: Omit<CoachType, 'id'>): Promise<ICoach> {
    const coach = new Coach(coachData);
    return await coach.save();
  }

  async getCoachByEmail(email: string): Promise<ICoach | null> {
    return await Coach.findOne({ email });
  }

  async getCoachById(id: string): Promise<ICoach | null> {
    return await Coach.findById(id);
  }

  async updateCoach(id: string, updateData: Partial<CoachType>): Promise<ICoach | null> {
    return await Coach.findByIdAndUpdate(id, updateData, { new: true });
  }

  async updateBillingInfo(id: string, billingInfo: CoachType['billingInfo']): Promise<ICoach | null> {
    return await Coach.findByIdAndUpdate(
      id,
      { $set: { billingInfo } },
      { new: true }
    );
  }

  async deleteCoach(id: string): Promise<boolean> {
    const result = await Coach.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllCoaches(): Promise<ICoach[]> {
    return await Coach.find().sort({ createdAt: -1 });
  }
}

export const coachService = new CoachService(); 