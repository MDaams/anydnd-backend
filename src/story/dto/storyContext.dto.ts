import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StoryContextDto {
  @ApiProperty({ example: 'Crime Drama' })
  @IsNotEmpty()
  @IsString()
  genre!: string;

  @ApiProperty({ example: 'dark' })
  @IsNotEmpty()
  @IsString()
  tone!: string;

  @ApiProperty({ example: '2024' })
  @IsNotEmpty()
  @IsString()
  year!: string;

  @ApiProperty({ example: 'A rural town in England.' })
  @IsNotEmpty()
  @IsString()
  setting!: string;

  @ApiProperty({
    example: 'The language in which the story should be written.',
  })
  @IsNotEmpty()
  @IsString()
  language!: string;
}
