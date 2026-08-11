import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameTurn } from './models/turn.models';
import { CreateGameDto } from './dto/create-game.dto';
import {
  BaseGameEvent,
  CharacterEvent,
  EventStatus,
  EventType,
} from 'src/events/models/events.model';
import { EndTurnResponseDto } from './dto/end-turn-response.dto';
import { GameTurnService } from './game-turn.service';

describe('GameController', () => {
  let controller: GameController;
  let mockGameService: any;
  let mockGameTurnService: any;

  const mockGameTurn: GameTurn = {
    step: 1,
    day: 'Monday',
    sectionOfDay: 'Morning',
  } as any;

  const mockGameEvent: CharacterEvent = {
    id: '123',
    type: EventType.CHARACTER,
    status: EventStatus.PENDING,
    title: 'Test Event',
    description: 'A test event',
    predefinedOptions: ['Option 1', 'Option 2'],
    createdAt: mockGameTurn,
  };

  const mockGameEvents: BaseGameEvent[] = [mockGameEvent];

  beforeEach(async () => {
    mockGameTurnService = {
      getTurn: jest.fn(() => mockGameTurn),
    };
    mockGameService = {
      getTurn: jest.fn(() => mockGameTurn),
      endTurn: jest.fn(),
      createNewGame: jest.fn().mockReturnValue({ step: 1 }),
      getEvents: jest.fn().mockReturnValue(mockGameEvents),
      submitChoice: jest.fn().mockReturnValue(mockGameEvents),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        { provide: GameService, useValue: mockGameService },

        { provide: GameTurnService, useValue: mockGameTurnService },
      ],
    }).compile();

    controller = app.get<GameController>(GameController);
  });

  describe('GET /game/turn', () => {
    it('should return the current game turn', () => {
      const result = controller.getTurn();
      expect(result).toStrictEqual(mockGameTurn);
    });

    it('should call getTurn on the service', () => {
      controller.getTurn();
      expect(mockGameService.getTurn).toHaveBeenCalled();
    });
  });

  describe('POST /game/end-turn', () => {
    it('should end the turn and return updated turn', async () => {
      const result = await controller.endTurn();
      const expected: EndTurnResponseDto = {
        turn: mockGameTurn,
        events: [],
      };

      expect(result).toStrictEqual(expected);
      expect(mockGameService.endTurn).toHaveBeenCalledWith();
    });

    it('should return updated turn after endTurn', async () => {
      const updatedTurn: GameTurn = {
        step: 2,
        day: 'Monday',
        sectionOfDay: 'Afternoon',
      } as any;
      const expectedMockEvents: BaseGameEvent[] = [];
      const expected: EndTurnResponseDto = {
        turn: updatedTurn,
        events: expectedMockEvents,
      };

      mockGameService.getTurn.mockReturnValueOnce(updatedTurn);

      const result = await controller.endTurn();

      expect(result).toStrictEqual(expected);
    });
  });

  describe('POST /game', () => {
    let response: GameTurn;
    let createGameDto: CreateGameDto;

    beforeEach(async () => {
      createGameDto = {
        genre: 'test',
        tone: 'test',
        year: '2000',
        setting: 'The matrix',
        language: 'English',
      };
      response = await controller.newGame(createGameDto);
    });

    it('calls createNewGame on the service', () => {
      expect(mockGameService.createNewGame).toHaveBeenCalledTimes(1);
    });

    it('returns a reset game turn', () => {
      expect(response.getStep()).toBe(1);
    });
  });

  describe('PUT /events/:id/submit-choice', () => {
    it('should submit a choice for an event', () => {
      const eventId = '123';
      const choice = 'Option 1';
      const intent = 'Talk';

      const result = controller.submitChoice(eventId, { choice, intent });

      expect(result).toStrictEqual(mockGameEvents);
      expect(mockGameService.submitChoice).toHaveBeenCalledWith(
        eventId,
        intent,
        choice,
      );
    });

    it('should return updated event log', () => {
      const result = controller.submitChoice('123', {
        choice: 'Option 1',
        intent: 'Talk',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toStrictEqual(mockGameEvents);
    });
  });
});
