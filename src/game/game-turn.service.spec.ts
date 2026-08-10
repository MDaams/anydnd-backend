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
      expect(turn.getStep()).toBe(0);
      expect(turn.day).toBe('');
      expect(turn.sectionOfDay).toBe('');
    });

    it('should return the same turn object on multiple calls', () => {
      const turn1 = service.getTurn();
      const turn2 = service.getTurn();

      expect(turn1).toStrictEqual(turn2);
    });
  });

  describe('bumpTurn', () => {
    beforeEach(() => {
      service.resetTurns();
    });

    it('should increment the turn', () => {
      const initialStep = service.getTurn().getStep();

      service.bumpTurn();

      expect(service.getTurn().getStep()).toBe(initialStep + 1);
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

  describe('debumpTurn', () => {
    beforeEach(() => {
      service.resetTurns();
    });

    it('should remove one turn', () => {
      const initialStep = service.getTurn().getStep();

      service.debumpTurn();

      expect(service.getTurn().getStep()).toBe(initialStep - 1);
    });

    it('should progress through sections of the day', () => {
      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Morning');

      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Afternoon');

      service.debumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Morning');

      service.bumpTurn();
      expect(service.getTurn().sectionOfDay).toBe('Afternoon');
    });

    it('should go back to the previous day after morning', () => {
      expect(service.getTurn().day).toBe('');
      expect(service.getTurn().sectionOfDay).toBe('');

      // Bump through all sections of Monday
      service.bumpTurn(); // Morning
      service.bumpTurn(); // Afternoon
      service.bumpTurn(); // Evening
      service.bumpTurn(); // Night
      service.bumpTurn(); // Next day Morning
      service.debumpTurn(); // Prev day Night

      expect(service.getTurn().day).toBe('Monday');
      expect(service.getTurn().sectionOfDay).toBe('Night');
    });
  });

  describe('resetTurns', () => {
    it('should set it to turn 0', () => {
      service.resetTurns();

      expect(service.getTurn().getStep()).toBe(0);
    });
  });
});
