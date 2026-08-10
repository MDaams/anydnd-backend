import { GameTurnService } from './game-turn.service';
import { GameTurn } from './models/turn.models';

describe('GameTurnService', () => {
  let service: GameTurnService;

  beforeEach(() => {
    service = new GameTurnService();
    service.resetTurns();
  });

  describe('getTurn', () => {
    it('should return the current game turn', () => {
      const turn = service.getTurn();

      expect(turn).toBeInstanceOf(GameTurn);
      expect(turn.step).toBe(0);
      expect(turn.day).toBe('');
      expect(turn.sectionOfDay).toBe('');
    });

    it('should return the same turn object on multiple calls', () => {
      const turn1 = service.getTurn();
      const turn2 = service.getTurn();

      expect(turn1).toBe(turn2);
    });
  });

  describe('bumpTurn', () => {
    beforeEach(() => {
      service.resetTurns();
    });

    it('should increment the turn', () => {
      const initialStep = service.getTurn().step;

      service.bumpTurn();

      expect(service.getTurn().step).toBe(initialStep + 1);
    });

    it('should progress through sections of the day', () => {
      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Morning');

      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Afternoon');

      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Evening');

      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Night');
    });

    it('should advance to the next day after night', () => {
      expect(service.getTurn().day).toBe('');
      expect(service.getTurn().sectionOfDay).toBe('');

      // Bump through all sections of Monday
      service.bumpTurn(); // Morning
      service.bumpTurn(); // Afternoon
      service.bumpTurn(); // Evening
      service.bumpTurn(); // Night
      service.bumpTurn(); // Next day Morning

      expect(service.getTurn().day).toBe('Tuesday');
      expect(service.getTurn().sectionOfDay).toBe('Morning');
    });
  });

  describe('resetTurns', () => {
    it('should set it to turn 0', () => {
      service.resetTurns();

      expect(service.getTurn().step).toBe(0);
    });
  });
});
