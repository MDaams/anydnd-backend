import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameTurn } from './models/turn.models';
import { CreateGameDto } from './dto/create-game.dto';
import { GameEvent } from 'src/events/models/events.model';
import { EndTurnResponseDto } from './dto/end-turn-response.dto';

describe('GameController', () => {
  let controller: GameController;
  let mockGameService: any;

  const mockGameTurn: GameTurn = {
    step: 1,
    day: 'Monday',
    sectionOfDay: 'Morning',
  } as any;
  const mockEvents: GameEvent[] = [];

  beforeEach(async () => {
    mockGameService = {
      getTurn: jest.fn(() => mockGameTurn),
      endTurn: jest.fn(),
      createNewGame: jest.fn().mockReturnValue({ step: 1 }),
      getEvents: jest.fn().mockReturnValue([]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [{ provide: GameService, useValue: mockGameService }],
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
        events: mockEvents,
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
      const expectedMockEvents: GameEvent[] = [];
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
      expect(response.step).toBe(1);
    });
  });
});
