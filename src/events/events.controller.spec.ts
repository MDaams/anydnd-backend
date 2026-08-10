import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { GameTurnService } from '../game/game-turn.service';
import { GameEvent, EventType, EventStatus } from './models/events.model';
import { GameTurn } from '../game/models/turn.models';

describe('EventsController', () => {
  let controller: EventsController;
  let mockService: any;
  let mockGameTurnService: any;

  const mockGameTurn = new GameTurn(1);

  const mockGameEvents: GameEvent[] = [
    {
      id: '123',
      type: EventType.WORLD,
      status: EventStatus.PENDING,
      title: 'Test Event',
      description: 'A test event',
      predefinedOptions: ['Option 1', 'Option 2'],
      createdAt: mockGameTurn,
    } as GameEvent,
  ];

  beforeEach(async () => {
    mockService = {
      getEventLog: jest.fn(() => mockGameEvents),
      generateWorldEvent: jest.fn().mockResolvedValue(mockGameEvents),
      generateCharacterEvent: jest.fn().mockResolvedValue(mockGameEvents),
      submitChoice: jest.fn().mockResolvedValue(mockGameEvents),
      clearEventLog: jest.fn(),
    };

    mockGameTurnService = {
      getTurn: jest.fn(() => mockGameTurn),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockService },
        { provide: GameTurnService, useValue: mockGameTurnService },
      ],
    }).compile();

    controller = app.get<EventsController>(EventsController);
  });

  describe('GET /events', () => {
    it('should return event log', async () => {
      const result = await controller.getEventLog();
      expect(result).toStrictEqual(mockGameEvents);
    });

    it('should call getEventLog', async () => {
      await controller.getEventLog();
      expect(mockService.getEventLog).toHaveBeenCalled();
    });
  });

  describe('DELETE /events', () => {
    it('should clear event log', () => {
      controller.clearEventLog();
      expect(mockService.clearEventLog).toHaveBeenCalled();
    });
  });
});
