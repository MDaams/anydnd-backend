import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndTurnDto {
  @ApiProperty({ minimum: 0, maximum: 100, example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  worldEventChance: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 50 })
  @IsNumber()
  @Min(0)
  @Max(100)
  characterEventChance: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  characterCreateChance: number;

  @ApiProperty({ minimum: 0, example: 2 })
  @IsNumber()
  @Min(0)
  characterEvents: number;

  @ApiProperty({ minimum: 0, example: 2 })
  @IsNumber()
  @Min(0)
  numberOfCharactersToCreate: number;
}
