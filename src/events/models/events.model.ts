import { ApiProperty } from '@nestjs/swagger';
import { GameTurn } from '../../game/models/turn.models';
import { ActionIntent, EventAction } from './action.model';

export enum EventType {
  WORLD = 'WORLD',
  SCENE = 'SCENE',
  CHARACTER = 'CHARACTER',
}

export enum EventStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
}

export class GameEvent {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: EventType, example: EventType.WORLD })
  type!: EventType;

  @ApiProperty({ example: 'Prison Riot Breaks Out' })
  title!: string;

  @ApiProperty({ example: 'A major riot has erupted in the prison...' })
  description!: string;

  @ApiProperty({
    example: ['Call for reinforcements', 'Evacuate sector'],
    type: [String],
  })
  predefinedOptions?: string[];

  @ApiProperty({
    example: '  /\\_/\\\\\n |_=_|\n  (°_°)',
    description: 'ASCII art representation of the event scene',
    required: false,
  })
  asciiArt?: string;

  @ApiProperty({ enum: EventStatus, example: EventStatus.PENDING })
  status!: EventStatus;

  @ApiProperty({ example: 'char-123', required: false })
  characterId?: string;

  @ApiProperty({
    example: true,
    required: false,
  })
  chosenOptionSucces?: boolean;

  @ApiProperty({
    example: 'The riot was successfully contained',
    required: false,
  })
  resolutionOutcome?: string;

  @ApiProperty({
    type: () => GameTurn,
    description: 'The game turn when this event was created',
    example: {
      step: 1,
      day: 'Monday',
      sectionOfDay: 'Morning',
    },
    required: true,
  })
  createdAt!: GameTurn;

  @ApiProperty({
    type: () => EventAction,
    description: 'The action take by the player',
    example: {
      action: 'How are you doing?',
      intent: 'Talk',
      createdAt: {
        step: 1,
        day: 'Monday',
        sectionOfDay: 'Morning',
      },
    },
  })
  action?: EventAction;

  /**
   * Factory method to create a GameEvent instance from a plain object
   */
  static from(data: Partial<GameEvent>): GameEvent {
    const event = new GameEvent();
    Object.assign(event, data);
    return event;
  }

  wasResolvedLastTurn(currentTurn: GameTurn) {
    if (!this.action?.getCreatedAtStep()) {
      return false;
    }
    return currentTurn.getStep() - 1 === this.action.getCreatedAtStep();
  }

  wasCreatedLastTurn(currentTurn: GameTurn) {
    if (!this.createdAt) {
      return false;
    }
    return currentTurn.getStep() - 1 === this.createdAt.getStep();
  }
}
