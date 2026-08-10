import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GameService } from './game.service';
import { GameTurn } from './models/turn.models';
import { Story } from '../story/models/story.model';
import { CreateGameDto } from './dto/create-game.dto';
import { EndTurnResponseDto } from './dto/end-turn-response.dto';
import { SubmitChoiceDto } from '../events/dto/submitChoice.dto';
import { GameEvent } from '../events/models/events.model';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('turn')
  @ApiOperation({ summary: 'Get current game turn' })
  @ApiResponse({
    status: 200,
    description: 'Current game turn retrieved successfully',
    type: GameTurn,
    example: {
      step: 1,
      day: 'Monday',
      sectionOfDay: 'Morning',
    },
  })
  getTurn(): GameTurn {
    return this.gameService.getTurn();
  }

  @Post('end-turn')
  @ApiOperation({ summary: 'End the current turn and execute game events' })
  @ApiResponse({
    status: 201,
    description: 'Turn ended successfully',
    type: EndTurnResponseDto,
    example: {
      turn: {
        step: 2,
        day: 'Monday',
        sectionOfDay: 'Afternoon',
      },
      events: [],
    },
  })
  async endTurn(): Promise<EndTurnResponseDto> {
    const eventsBefore = this.gameService.getEvents().length;
    await this.gameService.endTurn();
    const eventsAfter = this.gameService.getEvents();
    const newEvents = eventsAfter.slice(eventsBefore);

    return {
      turn: this.gameService.getTurn(),
      events: newEvents,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Start a new game' })
  @ApiResponse({
    status: 201,
    description: 'New game created successfully',
    type: GameTurn,
    example: {
      step: 1,
      day: 'Monday',
      sectionOfDay: 'Morning',
    },
  })
  async newGame(@Body() createGameDto: CreateGameDto): Promise<GameTurn> {
    const story = new Story(
      createGameDto.genre,
      createGameDto.tone,
      createGameDto.year,
      createGameDto.setting,
      createGameDto.language,
    );
    await this.gameService.createNewGame(story);
    return this.gameService.getTurn();
  }

  @Put(':id/submit-choice')
  @ApiOperation({ summary: 'Submit a choice for an event' })
  @ApiBody({ type: SubmitChoiceDto })
  @ApiResponse({
    status: 200,
    description: 'Choice submitted successfully',
    type: [GameEvent],
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to submit choice (event not found or invalid choice)',
  })
  submitChoice(
    @Param('id') eventId: string,
    @Body() dto: SubmitChoiceDto,
  ): GameEvent {
    return this.gameService.submitChoice(eventId, dto.intent, dto.choice);
  }
}
