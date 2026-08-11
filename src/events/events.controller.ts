import { Controller, Get, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { BaseGameEvent } from './models/events.model';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events from event log' })
  @ApiResponse({
    status: 200,
    description: 'Event log retrieved successfully',
    type: [BaseGameEvent],
  })
  getEventLog(): Promise<Array<BaseGameEvent>> {
    return Promise.resolve(this.service.getEventLog());
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
