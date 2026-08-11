import { AppLogger } from 'src/common/logger.util';

const DAYS_OF_WEEK: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const SECTIONS_OF_DAY: string[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

export class GameTurn {
  private step: number = 0;
  day: string = '';
  sectionOfDay: string = '';

  constructor(step: number) {
    this.step = step;
    this.day = this.getDay(this.step);
    this.sectionOfDay = this.getSectionOfDay(this.step);
  }

  addStep() {
    this.step = this.step + 1;
    this.day = this.getDay(this.step);
    this.sectionOfDay = this.getSectionOfDay(this.step);
    AppLogger.log(
      `Game turn advanced: Step ${this.step} - ${this.day}, ${this.sectionOfDay}`,
    );
  }

  removeStep() {
    this.step = this.step - 1;
    this.day = this.getDay(this.step);
    this.sectionOfDay = this.getSectionOfDay(this.step);
    AppLogger.log(
      `Game turn reversed: Step ${this.step} - ${this.day}, ${this.sectionOfDay}`,
    );
  }

  getStep() {
    return this.step;
  }

  getDay(step: number): string {
    return (
      DAYS_OF_WEEK[
        Math.floor((step - 1) / SECTIONS_OF_DAY.length) % DAYS_OF_WEEK.length
      ] || ''
    );
  }

  getSectionOfDay(step: number): string {
    return SECTIONS_OF_DAY[(step - 1) % SECTIONS_OF_DAY.length] || '';
  }

  clone(): GameTurn {
    return new GameTurn(this.step);
  }
}
