import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorldEventDto } from './worldEvent.dto';
import { CharacterEventDto } from './characterEvent.dto';
import { SceneEventDto } from './sceneEvent.dto';
import { CharacterDto } from 'src/characters/dto/characters.dto';

export class TurnContentDto {
  @ApiProperty({ type: WorldEventDto })
  worldEvent!: WorldEventDto;

  @ApiProperty({ type: [CharacterDto] })
  characters!: CharacterDto[];

  @ApiProperty({ type: [CharacterEventDto] })
  characterEvents!: CharacterEventDto[];

  @ApiPropertyOptional({
    type: SceneEventDto,
    nullable: true,
    description:
      'Interactive environment event generated when no characters are present',
  })
  sceneEvent?: SceneEventDto | null;

  @ApiProperty({ example: 'The world just began...', type: String })
  worldSummary!: string;
}
