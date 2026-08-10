import { ApiProperty } from '@nestjs/swagger';
import { GameTurn } from '../models/turn.models';
import { BaseGameEvent } from '../../events/models/events.model';

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
    type: () => [BaseGameEvent],
    description: 'The events that occurred during this turn',
    example: [],
  })
  events!: BaseGameEvent[];
}
