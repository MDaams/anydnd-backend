import { ApiProperty } from '@nestjs/swagger';
import { CharacterEvent } from 'src/events/models/events.model';

export class GameCharacter {
  @ApiProperty({ example: 'char-123' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'A brief summary of the character' })
  summary!: string;

  @ApiProperty({
    type: [Object],
    description: 'Log of events relevant for this character',
  })
  eventLog!: CharacterEvent[];

  @ApiProperty({
    type: Boolean,
    description: 'Signals if character is main character',
  })
  isMainCharacter: boolean = false;
}
