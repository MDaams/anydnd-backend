import { GameTurn } from '../../game/models/turn.models';

export enum ActionIntent {
  ESCAPE = 'Escape',
  TALK = 'Talk',
  ATTACK = 'Attack',
  DO = 'Do',
}

export class EventAction {
  private intent: ActionIntent;
  private createdAt: GameTurn;
  private action: string;

  constructor(action: string, intent: string, createdAtStep: number) {
    this.action = action;
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

  getAction(): string {
    return this.action;
  }

  getCreatedAtStep(): number {
    return this.createdAt.getStep();
  }
}
