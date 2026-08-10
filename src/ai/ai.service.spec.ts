import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { EndTurnConfig } from 'src/game/models/chanceConfig.models';
import { GameTurn } from 'src/game/models/turn.models';
import { Story } from 'src/story/models/story.model';

describe('AIService', () => {
  let service: AIService;

  beforeEach(async () => {
    // Mock the environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [AIService],
    }).compile();

    service = module.get<AIService>(AIService);

    // Mock the executeJsonPrompt private method to avoid actual API calls
    jest.spyOn(service as any, 'executeJsonPrompt').mockResolvedValue({
      worldEvent: {
        title: 'Test World Event',
        description: 'A test world event',
        asciiArt: 'ASCII art here',
      },
      characters: [
        {
          id: 'char-1',
          name: 'Test Character',
          role: 'Test Role',
          summary: 'Test summary',
        },
      ],
      characterEvents: [
        {
          title: 'Test Character Event',
          description: 'A test character event',
          asciiArt: 'ASCII art here',
          predefinedOptions: ['Option 1', 'Option 2'],
          characterId: 'char-1',
        },
      ],
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('prepareTurnData', () => {
    it('should prepare turn data with all required fields', () => {
      const endTurnConfig = new EndTurnConfig();
      endTurnConfig.gameTurn = new GameTurn(1);
      endTurnConfig.storySettings = {
        genre: 'Crime Drama',
        tone: 'Gritty',
        year: '2024',
        setting: 'Modern Prison',
        language: 'Dutch',
      } as Story;
      endTurnConfig.characters = [];
      endTurnConfig.pastCharacterEvents = [];
      endTurnConfig.pastWorldEvents = [];
      endTurnConfig.numberOfCharactersToCreate = 1;
      endTurnConfig.numberOfCharacterEventToCreate = 1;
      endTurnConfig.charactersToCreateEventsFor = [];

      // Call private method through any type casting
      const preparedData = (service as any).prepareTurnData(endTurnConfig);

      expect(preparedData).toBeDefined();
      expect(preparedData).toHaveProperty('recentCharacterEvents');
      expect(preparedData).toHaveProperty('recentWorldEventsContext');
      expect(preparedData).toHaveProperty('characterContext');
      expect(preparedData).toHaveProperty('playerChoicesContext');
      expect(preparedData).toHaveProperty('outputLanguage');
    });

    it('should handle empty events arrays', () => {
      const endTurnConfig = new EndTurnConfig();
      endTurnConfig.gameTurn = new GameTurn(1);
      endTurnConfig.storySettings = {
        genre: 'Crime Drama',
        tone: 'Gritty',
        year: '2024',
        setting: 'Modern Prison',
      } as Story;
      endTurnConfig.characters = [];
      endTurnConfig.pastCharacterEvents = [];
      endTurnConfig.pastWorldEvents = [];
      endTurnConfig.numberOfCharactersToCreate = 0;
      endTurnConfig.numberOfCharacterEventToCreate = 0;
      endTurnConfig.charactersToCreateEventsFor = [];

      const preparedData = (service as any).prepareTurnData(endTurnConfig);

      expect(preparedData.recentCharacterEvents).toBe(
        'No recent character events',
      );
      expect(preparedData.recentWorldEventsContext).toBe('No recent events');
      expect(preparedData.characterContext).toBe(
        'No active characters in scene',
      );
    });
  });

  describe('buildTurnPrompt', () => {
    it('should build a prompt with ASCII art requirements', () => {
      const endTurnConfig = new EndTurnConfig();
      endTurnConfig.gameTurn = new GameTurn(1);
      endTurnConfig.storySettings = {
        genre: 'Crime Drama',
        tone: 'Gritty',
        year: '2024',
        setting: 'Modern Prison',
      } as Story;
      endTurnConfig.characters = [];
      endTurnConfig.pastCharacterEvents = [];
      endTurnConfig.pastWorldEvents = [];
      endTurnConfig.numberOfCharactersToCreate = 1;
      endTurnConfig.numberOfCharacterEventToCreate = 1;
      endTurnConfig.charactersToCreateEventsFor = [];

      const preparedData = (service as any).prepareTurnData(endTurnConfig);
      const prompt = (service as any).buildTurnPrompt(
        endTurnConfig,
        preparedData,
      );

      expect(prompt).toBeDefined();
      expect(prompt).toContain('asciiArt');
      expect(prompt).toContain('ASCII art');
      expect(prompt).toContain('"asciiArt"');
    });

    it('should include JSON schema for asciiArt in world events', () => {
      const endTurnConfig = new EndTurnConfig();
      endTurnConfig.gameTurn = new GameTurn(1);
      endTurnConfig.storySettings = {
        genre: 'Crime Drama',
        tone: 'Gritty',
        year: '2024',
        setting: 'Modern Prison',
      } as Story;
      endTurnConfig.characters = [];
      endTurnConfig.pastCharacterEvents = [];
      endTurnConfig.pastWorldEvents = [];
      endTurnConfig.numberOfCharactersToCreate = 0;
      endTurnConfig.numberOfCharacterEventToCreate = 0;
      endTurnConfig.charactersToCreateEventsFor = [];

      const preparedData = (service as any).prepareTurnData(endTurnConfig);
      const prompt = (service as any).buildTurnPrompt(
        endTurnConfig,
        preparedData,
      );

      expect(prompt).toContain('"worldEvent"');
      expect(prompt).toContain('"asciiArt"');
    });

    it('should include JSON schema for asciiArt in character events', () => {
      const endTurnConfig = new EndTurnConfig();
      endTurnConfig.gameTurn = new GameTurn(1);
      endTurnConfig.storySettings = {
        genre: 'Crime Drama',
        tone: 'Gritty',
        year: '2024',
        setting: 'Modern Prison',
      } as Story;
      endTurnConfig.characters = [];
      endTurnConfig.pastCharacterEvents = [];
      endTurnConfig.pastWorldEvents = [];
      endTurnConfig.numberOfCharactersToCreate = 0;
      endTurnConfig.numberOfCharacterEventToCreate = 1;
      endTurnConfig.charactersToCreateEventsFor = [];

      const preparedData = (service as any).prepareTurnData(endTurnConfig);
      const prompt = (service as any).buildTurnPrompt(
        endTurnConfig,
        preparedData,
      );

      expect(prompt).toContain('"characterEvents"');
      expect(prompt).toContain('"asciiArt"');
    });

    it('should specify ASCII art dimensions', () => {
      const endTurnConfig = new EndTurnConfig();
      endTurnConfig.gameTurn = new GameTurn(1);
      endTurnConfig.storySettings = {
        genre: 'Crime Drama',
        tone: 'Gritty',
        year: '2024',
        setting: 'Modern Prison',
      } as Story;
      endTurnConfig.characters = [];
      endTurnConfig.pastCharacterEvents = [];
      endTurnConfig.pastWorldEvents = [];
      endTurnConfig.numberOfCharactersToCreate = 0;
      endTurnConfig.numberOfCharacterEventToCreate = 0;
      endTurnConfig.charactersToCreateEventsFor = [];

      const preparedData = (service as any).prepareTurnData(endTurnConfig);
      const prompt = (service as any).buildTurnPrompt(
        endTurnConfig,
        preparedData,
      );

      expect(prompt).toContain('8-12 lines high');
      expect(prompt).toContain('max 45 chars wide');
    });
  });
});
