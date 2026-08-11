import { GameService } from './game.service';
import { GameTurnService } from './game-turn.service';
import { CharactersService } from 'src/characters/characters.service';
import { EventsService } from 'src/events/events.service';
import { AIService } from 'src/ai/ai.service';
import { StoryService } from 'src/story/story.service';
import * as helpersUtils from 'src/common/helpers.utils';
import { Story } from 'src/story/models/story.model';

jest.mock('src/common/helpers.utils');

describe('GameService', () => {
  let service: GameService;
  let gameTurnService: jest.Mocked<GameTurnService>;
  let charactersService: jest.Mocked<CharactersService>;
  let eventsService: jest.Mocked<EventsService>;
  let aiService: jest.Mocked<AIService>;
  let storyService: jest.Mocked<StoryService>;

  beforeEach(() => {
    // Create a reusable mock turn object with clone method
    const mockTurn = {
      day: 'Monday',
      sectionOfDay: 'Morning',
      step: 1,
      clone: jest.fn(function () {
        return {
          day: 'Monday',
          sectionOfDay: 'Morning',
          step: 1,
          clone: jest.fn(),
        };
      }),
    };

    // Use mocked GameTurnService including debumpTurn for rollbacks
    gameTurnService = {
      getTurn: jest.fn().mockReturnValue(mockTurn),
      bumpTurn: jest.fn(),
      debumpTurn: jest.fn(), // Added to support rollbacks
      resetTurns: jest.fn(),
    } as any;

    charactersService = {
      clearCharacters: jest.fn(),
      createCharacter: jest.fn(),
      addCharacter: jest.fn(),
      getCharacters: jest.fn().mockReturnValue([
        {
          id: 'char-1',
          name: 'Test Character 1',
          summary: 'A test character',
          eventLog: [],
        },
        {
          id: 'char-2',
          name: 'Test Character 2',
          summary: 'Another test character',
          eventLog: [],
        },
      ]),
    } as any;

    eventsService = {
      addEvent: jest.fn(),
      clearEventLog: jest.fn(),
      generateCharacterEvent: jest.fn().mockResolvedValue([]),
      generateWorldEvent: jest.fn().mockResolvedValue([]),
      hasPendingEvent: jest.fn().mockReturnValue(false),
      getEventLog: jest.fn().mockReturnValue([]),
    } as any;

    aiService = {
      generateTurnContent: jest.fn().mockResolvedValue({
        worldEvent: {
          title: 'Test World Event',
          description: 'A test world event describing the atmosphere.',
        },
        characters: [
          {
            id: 'char-new-1',
            name: 'New Character',
            role: 'Test Role',
            traits: ['trait1', 'trait2', 'trait3'],
            summary: 'A test character summary.',
          },
        ],
        characterEvents: [
          {
            title: 'Test Character Event 1',
            description: 'A test character event.',
            predefinedOptions: ['Option 1', 'Option 2'],
            characterId: 'char-1',
          },
          {
            title: 'Test Character Event 2',
            description: 'Another test character event.',
            predefinedOptions: ['Action A', 'Action B'],
            characterId: 'char-2',
          },
        ],
      }),
    } as any;

    storyService = {
      getStory: jest.fn().mockReturnValue({
        id: 'story-1',
        title: 'Test Story',
        genre: 'Drama',
        tone: 'Tense',
        year: 1920,
        setting: 'Prison',
      }),
      setStory: jest.fn(),
    } as any;

    // Inject mocked dependencies with GameTurnService first
    service = new GameService(
      gameTurnService,
      eventsService,
      charactersService,
      aiService,
      storyService,
    );
  });

  describe('Ends turn', () => {
    it('should call generate turn content', async () => {
      jest
        .spyOn(helpersUtils, 'randomNumber')
        .mockImplementation((max: number, min: number = 0) => {
          return min; // Return min to guarantee chance conditions pass
        });

      await service.endTurn();

      expect(aiService.generateTurnContent).toHaveBeenCalledTimes(1);
      expect(storyService.getStory).toHaveBeenCalledTimes(1);
      expect(eventsService.addEvent).toHaveBeenCalledTimes(3);
      expect(charactersService.addCharacter).toHaveBeenCalledTimes(1);
    });
  });

  describe('new game', () => {
    beforeEach(async () => {
      const story: Story = new Story();
      await service.createNewGame(story);
    });

    it('clears characters', () => {
      expect(charactersService.clearCharacters).toHaveBeenCalledTimes(1);
    });
    it('clears events', () => {
      expect(eventsService.clearEventLog).toHaveBeenCalledTimes(1);
    });
    it('resets story', () => {
      expect(storyService.setStory).toHaveBeenCalledTimes(1);
    });
    it('resets game turn', () => {
      expect(gameTurnService.resetTurns).toHaveBeenCalledTimes(1);
    });

    it('calls aiservice to generate a turn', () => {
      expect(aiService.generateTurnContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling in endTurn', () => {
    it('should handle connection timeout errors from AI service', async () => {
      const timeoutError = new Error('TIMEOUT: Connection exceeded');
      aiService.generateTurnContent.mockRejectedValueOnce(timeoutError);

      await expect(service.endTurn()).rejects.toThrow(
        'TIMEOUT: Connection exceeded',
      );
      expect(gameTurnService.bumpTurn).toHaveBeenCalled();
      expect(gameTurnService.resetTurns).not.toHaveBeenCalled();
    });

    it('should handle JSON parse errors from AI service', async () => {
      const jsonError = new Error('JSON Parse Error: Invalid JSON response');
      aiService.generateTurnContent.mockRejectedValueOnce(jsonError);

      await expect(service.endTurn()).rejects.toThrow(
        'JSON Parse Error: Invalid JSON response',
      );
      expect(gameTurnService.bumpTurn).toHaveBeenCalled();
    });

    it('should rollback turn on AI service failure', async () => {
      const error = new Error('AI Service unavailable');
      aiService.generateTurnContent.mockRejectedValueOnce(error);

      try {
        await service.endTurn();
      } catch (e) {
        // Expected to throw
      }

      // Verify that bumpTurn happened followed by the rollback (debumpTurn)
      expect(gameTurnService.bumpTurn).toHaveBeenCalled();
      expect(gameTurnService.debumpTurn).toHaveBeenCalledTimes(1);
    });

    it('should not add events when AI service fails', async () => {
      const error = new Error('AI Service error');
      aiService.generateTurnContent.mockRejectedValueOnce(error);

      try {
        await service.endTurn();
      } catch (e) {
        // Expected to throw
      }

      // addEvent should not be called after bumpTurn (only internal setup calls)
      const addEventCallCount = eventsService.addEvent.mock.calls.length;
      expect(addEventCallCount).toBe(0);
    });
  });
});
