import { Module } from '@nestjs/common';
import { CharactersController } from './characters/characters.controller';
import { CharactersService } from './characters/characters.service';
import { AIService } from './ai/ai.service';
import { StoryService } from './story/story.service';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { GameService } from './game/game.service';
import { GameController } from './game/game.controller';
import { GameTurnService } from './game/game-turn.service';

@Module({
  imports: [],
  controllers: [CharactersController, EventsController, GameController],
  providers: [
    CharactersService,
    StoryService,
    EventsService,
    AIService,
    GameTurnService,
    GameService,
  ],
})
export class AppModule {}
