import { ApiProperty } from '@nestjs/swagger';
import { CharacterEvent } from 'src/events/models/events.model';
import { Item } from '../models/item.models';

export class CharacterDto {
  @ApiProperty({ example: 'uuid-string' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'A brief summary of the character' })
  summary!: string;

  @ApiProperty({ type: [Object], description: 'Log of game events' })
  eventLog!: CharacterEvent[];

  @ApiProperty({ type: [Object], description: 'Collection of items' })
  inventory!: Item[];

  @ApiProperty({ type: Boolean, description: 'true' })
  isMainCharacter!: boolean;
}
