import { Test, TestingModule } from '@nestjs/testing';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';

describe('CharactersController', () => {
  let controller: CharactersController;
  let mockService;

  beforeEach(async () => {
    mockService = {
      getCharacters: jest.fn().mockReturnValue([]),
      createCharacter: jest.fn().mockReturnValue([]),
      clearCharacters: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController],
      providers: [{ provide: CharactersService, useValue: mockService }],
    }).compile();

    controller = app.get<CharactersController>(CharactersController);
  });

  describe('characters', () => {
    it('should return list of characters', () => {
      const expected = [];
      expect(controller.getCharacters()).toStrictEqual(expected);
    });

    it('should clear all characters', () => {
      controller.clearCharacters();

      expect(mockService.clearCharacters).toHaveBeenCalled();
    });
  });
});
