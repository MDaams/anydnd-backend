import {
  IsEnum,
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsNotEmptyObject,
} from 'class-validator';

import { EventType } from 'src/events/models/events.model';
import { GameTurn } from 'src/game/models/turn.models';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';

export class EventResponseDto {
  @IsString()
  id!: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  asciiArt!: string;

  @IsArray()
  @IsString({ each: true })
  predefinedOptions!: string[];

  @IsOptional()
  @IsString()
  characterId?: string;

  timestamp!: GameTurn;
}

export class ResolveEventDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  chosenOption!: string;
}

export class GenerateEventDto {
  @IsNotEmptyObject()
  gameTurn!: GameTurn;
}

export class GenerateCharacterEventDto {
  @IsNotEmpty()
  characters!: GameCharacter[];

  @IsNotEmptyObject()
  gameTurn!: GameTurn;
}
