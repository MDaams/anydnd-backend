import { GameTurn } from 'src/game/models/turn.models';

export enum ActionIntent {
  ESCAPE = 'Escape',
  TALK = 'Talk',
  ATTACK = 'Attack',
  DO = 'Do',
}

export class EventAction {
  private intent: ActionIntent;
  private createdAt: GameTurn;
  private input: string;

  constructor(input: string, intent: string, createdAtStep: number) {
    this.input = input;
    this.intent = this.getIntentType(intent);
    this.createdAt = new GameTurn(createdAtStep);
  }

  private getIntentType(intent: string): ActionIntent {
    switch (intent) {
      case 'Escape':
        return ActionIntent.ESCAPE;
      case 'Talk':
        return ActionIntent.TALK;
      case 'Attack':
        return ActionIntent.ATTACK;
      case 'Do':
        return ActionIntent.DO;
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }

  getIntent(): ActionIntent {
    return this.intent;
  }

  getInput(): string {
    return this.input;
  }

  getCreatedAtStep(): number {
    return this.createdAt.getStep();
  }

  toString(): string {
    switch (this.intent) {
      case ActionIntent.TALK:
        return `Said out loud: "${this.input}"`;
      case ActionIntent.ESCAPE:
        return `Attempted to escape by: "${this.input}"`;
      case ActionIntent.ATTACK:
        return `Attempted a physical attack: "${this.input}"`;
      case ActionIntent.DO:
        return `Attempted the following action: "${this.input}"`;
      default:
        return `Attempted: "${this.input}"`;
    }
  }
}
