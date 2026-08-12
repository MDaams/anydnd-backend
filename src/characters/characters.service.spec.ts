import { CharactersService } from './characters.service';
import { GameCharacter } from './models/gameCharacter.model';

describe('CharactersService', () => {
  let service: CharactersService;

  beforeEach(() => {
    service = new CharactersService();
  });

  it('Should return the characters', () => {
    const result = service.getCharacters();
    expect(result.length).toEqual(0);
  });

  it('Should clear the characters', async () => {
    service.addCharacter(new GameCharacter());
    expect(service.getCharacters().length).toEqual(1);

    service.clearCharacters();
    expect(service.getCharacters().length).toEqual(0);
  });

  describe('Add character', () => {
    it('Unsets main character is true', () => {
      const character: GameCharacter = new GameCharacter();
      character.isMainCharacter = true;

      service.addCharacter(character);

      expect(service.getCharacters().length).toBe(1);
      expect(service.getCharacters()[0].isMainCharacter).toBe(false);
    });
  });

  describe('Generate Main Character', () => {
    it('create new main character', () => {
      service.generateMainCharacter();

      expect(service.getCharacters().length).toBe(1);
      expect(service.getCharacters()[0].isMainCharacter).toBe(true);
    });

    it('does not generate new main character if one exists', () => {
      service.addCharacter({ isMainCharacter: true } as GameCharacter);
      service.generateMainCharacter();

      expect(service.getCharacters().length).toBe(1);
    });

    it('has values', () => {
      service.generateMainCharacter();

      const mainCharacter: GameCharacter = service.getCharacters()[0];

      expect(mainCharacter.id).toBeDefined();
      expect(mainCharacter.name).toStrictEqual('The player');
      expect(mainCharacter.summary).toStrictEqual('Is Neo in the matrix.');
      expect(mainCharacter.eventLog).toStrictEqual([]);
      expect(mainCharacter.isMainCharacter).toBeTruthy();
    });
  });
});
