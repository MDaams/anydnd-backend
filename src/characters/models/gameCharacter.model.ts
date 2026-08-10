import { ApiProperty } from '@nestjs/swagger';
import { GameEvent } from '../../events/models/events.model';

export class GameCharacter {
  @ApiProperty({ example: 'char-123' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'A brief summary of the character' })
  summary!: string;

  @ApiProperty({ type: [Object], description: 'Log of game events' })
  eventLog!: GameEvent[];
}
