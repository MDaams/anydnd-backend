import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { EndTurnConfig } from 'src/game/models/chanceConfig.models';
import { GameTurn } from 'src/game/models/turn.models';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import { InternalServerErrorException } from '@nestjs/common';

describe('AIService', () => {
  let service: AIService;
  let defaultEndTurnConfig: EndTurnConfig;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [AIService],
    }).compile();

    service = module.get<AIService>(AIService);

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

    const mainCharacter = new GameCharacter();
    mainCharacter.isMainCharacter = true;
    defaultEndTurnConfig = new EndTurnConfig();
    defaultEndTurnConfig.gameTurn = new GameTurn(1);
    defaultEndTurnConfig.storySettings = {
      genre: 'Crime Drama',
      tone: 'Gritty',
      year: '2024',
      setting: 'Modern Prison',
      language: 'Dutch',
    };
    defaultEndTurnConfig.characters = [mainCharacter];
    defaultEndTurnConfig.pastCharacterEvents = [];
    defaultEndTurnConfig.pastWorldEvents = [];
    defaultEndTurnConfig.numberOfCharactersToCreate = 1;
    defaultEndTurnConfig.numberOfCharacterEventToCreate = 1;
    defaultEndTurnConfig.charactersToCreateEventsFor = [];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('prepareTurnData', () => {
    it('should prepare turn data with all required fields', () => {
      const preparedData = (service as any).prepareTurnData(
        defaultEndTurnConfig,
      );

      expect(preparedData).toBeDefined();
      expect(preparedData).toHaveProperty('recentCharacterEvents');
      expect(preparedData).toHaveProperty('recentWorldEventsContext');
      expect(preparedData).toHaveProperty('characterContext');
      expect(preparedData).toHaveProperty('outputLanguage');
      expect(preparedData).toHaveProperty('lastTurnChoicesText');
      expect(preparedData).toHaveProperty('languageDifficulty');
      expect(preparedData).toHaveProperty('currentWorldSummary');
      expect(preparedData).toHaveProperty('mainCharacter');
    });

    it('should handle empty events arrays', () => {
      defaultEndTurnConfig.numberOfCharactersToCreate = 0;
      defaultEndTurnConfig.numberOfCharacterEventToCreate = 0;

      const preparedData = (service as any).prepareTurnData(
        defaultEndTurnConfig,
      );

      expect(preparedData.recentCharacterEvents).toBe(
        'No recent character events',
      );
      expect(preparedData.recentWorldEventsContext).toBe('No recent events');
      expect(preparedData.characterContext).toBe(
        'No active characters in scene',
      );
    });

    it('throws internalservererror if no maincharacter exists', () => {
      defaultEndTurnConfig.characters = [];
      expect(() =>
        (service as any).prepareTurnData(defaultEndTurnConfig),
      ).toThrow(InternalServerErrorException);
    });
  });

  describe('buildTurnPrompt', () => {
    it('should build a prompt with ASCII art requirements', () => {
      const preparedData = (service as any).prepareTurnData(
        defaultEndTurnConfig,
      );
      const prompt = (service as any).buildTurnPrompt(
        defaultEndTurnConfig,
        preparedData,
      );

      expect(prompt).toBeDefined();
      expect(prompt).toContain('asciiArt');
      expect(prompt).toContain('ASCII art');
      expect(prompt).toContain('"asciiArt"');
    });

    it('should include JSON schema for asciiArt in world events', () => {
      defaultEndTurnConfig.numberOfCharactersToCreate = 0;
      defaultEndTurnConfig.numberOfCharacterEventToCreate = 0;

      const preparedData = (service as any).prepareTurnData(
        defaultEndTurnConfig,
      );
      const prompt = (service as any).buildTurnPrompt(
        defaultEndTurnConfig,
        preparedData,
      );

      expect(prompt).toContain('"worldEvent"');
      expect(prompt).toContain('"asciiArt"');
    });

    it('should include JSON schema for asciiArt in character events', () => {
      defaultEndTurnConfig.numberOfCharactersToCreate = 0;
      defaultEndTurnConfig.numberOfCharacterEventToCreate = 1;

      const preparedData = (service as any).prepareTurnData(
        defaultEndTurnConfig,
      );
      const prompt = (service as any).buildTurnPrompt(
        defaultEndTurnConfig,
        preparedData,
      );

      expect(prompt).toContain('"characterEvents"');
      expect(prompt).toContain('"asciiArt"');
    });

    it('should specify ASCII art dimensions', () => {
      defaultEndTurnConfig.numberOfCharactersToCreate = 0;
      defaultEndTurnConfig.numberOfCharacterEventToCreate = 0;

      const preparedData = (service as any).prepareTurnData(
        defaultEndTurnConfig,
      );
      const prompt = (service as any).buildTurnPrompt(
        defaultEndTurnConfig,
        preparedData,
      );

      expect(prompt).toContain('8-12 lines high');
      expect(prompt).toContain('max 45 chars wide');
    });
  });
});
