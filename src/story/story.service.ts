import { Injectable } from '@nestjs/common';
import { Story } from './models/story.model';
@Injectable()
export class StoryService {
  private story: Story = new Story(
    'Crime drama',
    'Gonzo',
    '1895',
    'Dovstojevskis st. petersburg',
    'English-UK',
  );

  setStory(story: Story) {
    this.story = story;
    return this.getStory();
  }

  getStory(): Story {
    return this.story;
  }
}
