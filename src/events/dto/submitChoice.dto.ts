import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitChoiceDto {
  @ApiProperty({
    example: 'Call for reinforcements',
    description: 'The choice option selected by the user',
  })
  @IsString()
  @IsNotEmpty()
  choice!: string;

  @ApiProperty({
    example: 'Talk',
    description: 'The intent selected by the user',
  })
  @IsString()
  @IsNotEmpty()
  intent!: string;
}
