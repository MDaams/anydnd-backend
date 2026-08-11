import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { GameTurnService } from 'src/game/game-turn.service';
import { EventType, EventStatus, CharacterEvent } from './models/events.model';
import { GameTurn } from 'src/game/models/turn.models';

describe('EventsController', () => {
  let controller: EventsController;
  let mockService: Partial<jest.Mocked<EventsService>>;
  let mockGameTurnService: Partial<jest.Mocked<GameTurnService>>;

  const mockGameTurn = new GameTurn(1);

  const mockGameEvents: CharacterEvent[] = [
    {
      id: '123',
      type: EventType.CHARACTER,
      status: EventStatus.PENDING,
      title: 'Test Event',
      description: 'A test event',
      predefinedOptions: ['Option 1', 'Option 2'],
      createdAt: mockGameTurn,
    },
  ];

  beforeEach(async () => {
    mockService = {
      getEventLog: jest.fn(() => mockGameEvents),
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
