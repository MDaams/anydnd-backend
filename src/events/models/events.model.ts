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

class BaseGameEvent {
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

class ResolvableGameEvent extends BaseGameEvent {
  @ApiProperty({ type: [String], required: false })
  predefinedOptions?: string[];

  @ApiProperty({ example: true, required: false })
  chosenOptionSucces?: boolean;

  @ApiProperty({ type: () => EventAction, required: false })
  action?: EventAction;

  submitChoice(
    input: string,
    intent: string,
    currentTurn: GameTurn,
    succesRoll: number,
  ): void {
    this.action = new EventAction(input, intent, currentTurn.getStep());
    this.status = EventStatus.RESOLVED;
    this.chosenOptionSucces = succesRoll <= 75;
    this.createdAt = currentTurn.clone();
  }
}

export class CharacterEvent extends ResolvableGameEvent {
  @ApiProperty({ example: 'char-123', required: false })
  characterId?: string;

  @ApiProperty({
    example: 'The riot was successfully contained',
    required: false,
  })
  resolutionOutcome?: string;

  override toString(): string {
    return `Event: "${this.title}" | ${this.action?.toString()}`;
  }
}

export class SceneEvent extends ResolvableGameEvent {
  override toString(): string {
    return `Event: "${this.title}" | ${this.action?.toString()}`;
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

  isWorldEvent(e: GameEvent): e is WorldEvent {
    return e.type === EventType.WORLD;
  },

  isSceneEvent(e: GameEvent): e is SceneEvent {
    return e.type == EventType.SCENE;
  },

  isCharacterEvent(e: GameEvent): e is CharacterEvent {
    return e.type == EventType.CHARACTER;
  },
};

export function eventFromPlain(
  data: BaseGameEvent,
): WorldEvent | SceneEvent | CharacterEvent {
  const rawData = data as unknown as {
    type: EventType;
    [key: string]: unknown;
  };

  switch (rawData.type) {
    case EventType.WORLD:
      return Object.assign(new WorldEvent(), rawData);
    case EventType.CHARACTER:
      return Object.assign(new CharacterEvent(), rawData);
    case EventType.SCENE:
      return Object.assign(new SceneEvent(), rawData);
    default:
      return data;
  }
}

export type GameEvent = WorldEvent | SceneEvent | CharacterEvent;
