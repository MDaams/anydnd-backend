import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SceneEventDto {
  @ApiProperty({ example: 'Vork in het pad' })
  title!: string;

  @ApiProperty({ example: 'Het pad splitst zich bij een oud stenen kruis...' })
  description!: string;

  @ApiPropertyOptional({
    example: '  /\\ \n /  \\',
    description: 'ASCII art van de locatie of situatie',
  })
  asciiArt?: string;

  @ApiProperty({
    example: [
      'Neem het modderige bosspoor',
      'Volg het verharde pad naar de rivier',
    ],
    type: [String],
  })
  predefinedOptions!: string[];
}
