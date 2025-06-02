import Phrase, { IPhrase } from '../models/Phrase';
import { Phrase as PhraseType } from '../types';

class PhraseService {
  async createPhrase(phraseData: Omit<PhraseType, 'id'>): Promise<IPhrase> {
    const phrase = new Phrase(phraseData);
    return await phrase.save();
  }

  async getPhraseById(id: string): Promise<IPhrase | null> {
    return await Phrase.findById(id);
  }

  async getPhrasesByCoach(coachName: string): Promise<IPhrase[]> {
    return await Phrase.find({ coachName }).sort({ sendDateTime: -1 });
  }

  async getPhrasesByDateRange(startDate: Date, endDate: Date): Promise<IPhrase[]> {
    return await Phrase.find({
      sendDateTime: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ sendDateTime: -1 });
  }

  async updatePhrase(id: string, updateData: Partial<PhraseType>): Promise<IPhrase | null> {
    return await Phrase.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deletePhrase(id: string): Promise<boolean> {
    const result = await Phrase.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllPhrases(): Promise<IPhrase[]> {
    return await Phrase.find().sort({ sendDateTime: -1 });
  }
}

export const phraseService = new PhraseService(); 