import { ApiProperty } from '@nestjs/swagger';
import { GameTurn } from '../models/turn.models';
import { GameEvent } from '../../events/models/events.model';

export class EndTurnResponseDto {
  @ApiProperty({
    type: () => GameTurn,
    description: 'The current game turn after ending the turn',
    example: {
      step: 2,
      day: 'Monday',
      sectionOfDay: 'Afternoon',
    },
  })
  turn!: GameTurn;

  @ApiProperty({
    type: () => [GameEvent],
    description: 'The events that occurred during this turn',
    example: [],
  })
  events!: GameEvent[];
}
