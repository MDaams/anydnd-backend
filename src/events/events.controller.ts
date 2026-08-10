import { Controller, Get, Delete, Body, Put, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { GameEvent } from './models/events.model';
import { SubmitChoiceDto } from './dto/submitChoice.dto';
import { GameTurnService } from '../game/game-turn.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly gameTurnService: GameTurnService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all events from event log' })
  @ApiResponse({
    status: 200,
    description: 'Event log retrieved successfully',
    type: [GameEvent],
  })
  getEventLog(): Promise<Array<GameEvent>> {
    return Promise.resolve(this.service.getEventLog());
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
    const currentTurn = this.gameTurnService.getTurn();
    return this.service.submitChoice(
      eventId,
      dto.intent,
      dto.choice,
      currentTurn,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all events from the event log' })
  @ApiResponse({
    status: 200,
    description: 'Event log cleared successfully',
  })
  clearEventLog(): void {
    this.service.clearEventLog();
  }
}
