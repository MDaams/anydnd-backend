import { CharactersService } from './characters.service';
import { StoryService } from 'src/story/story.service';
import { GameCharacter } from './models/gameCharacter.model';

describe('CharactersService', () => {
  let service: CharactersService;
  let storyServiceMock: jest.Mocked<StoryService>;

  beforeEach(() => {
    storyServiceMock = {
      getStory: jest.fn().mockResolvedValue({
        genre: 'test',
        tone: 'test',
        year: '1984',
      }),
    } as unknown as jest.Mocked<StoryService>;

    service = new CharactersService(storyServiceMock);
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
});
