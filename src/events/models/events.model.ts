import { ApiProperty } from '@nestjs/swagger';
import { GameTurn } from 'src/game/models/turn.models';
import { EventAction } from './action.model';

export enum EventType {
  WORLD = 'WORLD',
  SCENE = 'SCENE',
  CHARACTER = 'CHARACTER',
}

export enum EventStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
}

export class BaseGameEvent {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ enum: EventType, example: EventType.WORLD })
  type!: EventType;

  @ApiProperty({ example: 'Prison Riot Breaks Out' })
  title!: string;

  @ApiProperty({ example: 'A major riot has erupted in the prison...' })
  description!: string;

  @ApiProperty({ enum: EventStatus, example: EventStatus.PENDING })
  status!: EventStatus;

  @ApiProperty({ type: () => GameTurn })
  createdAt!: GameTurn;

  toString(): string {
    return `Event: "${this.title}"`;
  }
}

export class WorldEvent extends BaseGameEvent {
  @ApiProperty({ required: false })
  asciiArt?: string;
}

export class CharacterEvent extends BaseGameEvent {
  @ApiProperty({ example: 'char-123', required: false })
  characterId?: string;

  @ApiProperty({
    example: ['Call for reinforcements', 'Evacuate sector'],
    type: [String],
  })
  predefinedOptions?: string[];

  @ApiProperty({ example: true, required: false })
  chosenOptionSucces?: boolean;

  @ApiProperty({
    example: 'The riot was successfully contained',
    required: false,
  })
  resolutionOutcome?: string;

  @ApiProperty({ type: () => EventAction, required: false })
  action?: EventAction;

  override toString(): string {
    return `Event: "${this.title}" | Player Intent: [${this.action?.getIntent() || 'Unknown'}] -> Action Taken: "${this.action?.getAction() || 'Unknown'}"`;
  }
}

export class SceneEvent extends BaseGameEvent {
  @ApiProperty({ example: ['Inspect the area', 'Ignore'], type: [String] })
  predefinedOptions?: string[];

  @ApiProperty({ example: true, required: false })
  chosenOptionSucces?: boolean;

  @ApiProperty({ type: () => EventAction, required: false })
  action?: EventAction;

  override toString(): string {
    return `Event: "${this.title}" | Player Intent: [${this.action?.getIntent() || 'Unknown'}] -> Action Taken: "${this.action?.getAction() || 'Unknown'}"`;
  }
}

export const EventUtils = {
  wasCreatedLastTurn(event: BaseGameEvent, currentTurn: GameTurn): boolean {
    if (!event.createdAt) return false;
    return currentTurn.getStep() - 1 === event.createdAt.getStep();
  },

  wasResolvedLastTurn(
    event: { action?: EventAction },
    currentTurn: GameTurn,
  ): boolean {
    if (!event.action?.getCreatedAtStep()) return false;
    return currentTurn.getStep() - 1 === event.action.getCreatedAtStep();
  },

  isWorldEvent(e: BaseGameEvent): e is WorldEvent {
    return e.type == EventType.WORLD && e instanceof WorldEvent;
  },

  isSceneEvent(e: BaseGameEvent): e is SceneEvent {
    return e.type == EventType.SCENE && e instanceof SceneEvent;
  },

  isCharacterEvent(e: BaseGameEvent): e is CharacterEvent {
    return e.type == EventType.CHARACTER && e instanceof CharacterEvent;
  },
};

export class GameEventFactory {
  static fromPlain(data: {
    type: EventType;
    [key: string]: any;
  }): BaseGameEvent {
    switch (data.type) {
      case EventType.WORLD:
        return Object.assign(new WorldEvent(), data);
      case EventType.CHARACTER:
        return Object.assign(new CharacterEvent(), data);
      case EventType.SCENE:
        return Object.assign(new SceneEvent(), data);
      default:
        return Object.assign(new BaseGameEvent(), data);
    }
  }
}
