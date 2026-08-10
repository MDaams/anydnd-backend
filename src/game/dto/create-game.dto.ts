import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameDto {
  @ApiProperty({
    description: 'The genre of the game story',
    example: 'Thriller',
  })
  @IsNotEmpty()
  @IsString()
  genre: string;

  @ApiProperty({
    description: 'The tone of the game story',
    example: 'Dark',
  })
  @IsNotEmpty()
  @IsString()
  tone: string;

  @ApiProperty({
    description: 'The year setting of the game story',
    example: '2024',
  })
  @IsNotEmpty()
  @IsString()
  year: string;

  @ApiProperty({
    description: 'The location/setting of the game story',
    example: 'The Matrix',
  })
  @IsNotEmpty()
  @IsString()
  setting: string;

  @ApiProperty({
    description: 'The language for the AI generated content.',
    example: 'English',
  })
  @IsNotEmpty()
  @IsString()
  language: string;
}
