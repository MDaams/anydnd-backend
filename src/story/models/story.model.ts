import { randomUUID } from 'crypto';

export class Story {
  id?: string;
  genre?: string;
  tone?: string;
  year?: string;
  language?: string;
  setting?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(
    genre?: string,
    tone?: string,
    year?: string,
    setting?: string,
    language?: string,
  ) {
    this.id = randomUUID();
    this.genre = genre;
    this.tone = tone;
    this.year = year;
    this.setting = setting;
    this.language = language;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
