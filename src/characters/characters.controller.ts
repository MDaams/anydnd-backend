import { Controller, Get, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CharactersService } from './characters.service';
import { CharacterDto } from './dto/characters.dto';
import { GameCharacter } from './models/gameCharacter.model';

@ApiTags('characters')
@Controller()
export class CharactersController {
  constructor(private readonly service: CharactersService) {}

  @Get('/characters')
  @ApiOperation({ summary: 'Get all characters' })
  @ApiResponse({
    status: 200,
    description: 'List of all characters retrieved successfully',
    type: [CharacterDto],
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getCharacters(): GameCharacter[] {
    return this.service.getCharacters();
  }

  @Delete('/characters')
  @ApiOperation({ summary: 'Clear all characters' })
  @ApiResponse({
    status: 200,
    description: 'Characters cleared successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  clearCharacters(): void {
    return this.service.clearCharacters();
  }
}
