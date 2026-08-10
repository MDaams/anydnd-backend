import { StoryContextDto } from './dto/storyContext.dto';
import { Story } from './models/story.model';
import { StoryService } from './story.service';

describe('StoryService', () => {
  let service: StoryService;

  beforeEach(() => {
    service = new StoryService();
  });

  it('Should set the story attributes', () => {
    const genre = 'test';
    const tone = 'test';
    const year = '1984';
    const setting = 'this is a setting';

    const story: Story = new Story(genre, tone, year, setting);

    let result = service.setStory(story);
    expect(result.genre).toStrictEqual(genre);
    expect(result.tone).toStrictEqual(tone);
    expect(result.year).toStrictEqual(year);
    expect(result.setting).toStrictEqual(setting);

    result = service.getStory();
    expect(result.genre).toStrictEqual(genre);
    expect(result.tone).toStrictEqual(tone);
    expect(result.year).toStrictEqual(year);
    expect(result.setting).toStrictEqual(setting);
  });

  it('Should get the default story attributes', () => {
    const { genre, tone, year, setting } = new Story(
      'Crime drama',
      'Gonzo',
      '1895',
      'Dovstojevskis st. petersburg',
    );

    const result = service.getStory();

    expect(result.genre).toStrictEqual(genre);
    expect(result.tone).toStrictEqual(tone);
    expect(result.year).toStrictEqual(year);
    expect(result.setting).toStrictEqual(setting);
  });
});
