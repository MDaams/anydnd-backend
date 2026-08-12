import { Injectable } from '@nestjs/common';
import { GameTurn } from './models/turn.models';
import { GameTurnService } from './game-turn.service';
import { EventsService } from 'src/events/events.service';
import { CharactersService } from 'src/characters/characters.service';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import { AIService } from 'src/ai/ai.service';
import { StoryService } from 'src/story/story.service';
import { AppLogger } from 'src/common/logger.util';
import {
  BaseGameEvent,
  EventStatus,
  EventType,
  GameEventFactory,
} from 'src/events/models/events.model';
import { EndTurnConfig } from './models/chanceConfig.models';
import { TurnContentDto } from 'src/ai/dto/turnContent.dto';
import { randomUUID } from 'crypto';
import { randomNumber } from 'src/common/helpers.utils';
import { Story } from 'src/story/models/story.model';

@Injectable()
export class GameService {
  private readonly characterEventChance = 30;
  private readonly characterCreateChance = 10;
  private worldSummary: string = '';

  constructor(
    private readonly gameTurnService: GameTurnService,
    private readonly eventsService: EventsService,
    private readonly characterService: CharactersService,
    private readonly aiService: AIService,
    private readonly storyService: StoryService,
  ) {}

  getTurn(): GameTurn {
    return this.gameTurnService.getTurn();
  }

  getEvents(): BaseGameEvent[] {
    return this.eventsService.getEventLog();
  }

  bumpTurn() {
    this.gameTurnService.bumpTurn();
  }

  private debumpTurn() {
    AppLogger.log(`⚠️  Attempting to rollback turn due to error`);
    this.gameTurnService.debumpTurn();
  }

  private shouldCreateCharacterEvent(): boolean {
    return randomNumber(100) <= this.characterEventChance;
  }

  private shouldCreateCharacter(): boolean {
    return randomNumber(100) <= this.characterCreateChance;
  }

  private loadStorySettings(config: EndTurnConfig) {
    config.storySettings = this.storyService.getStory();
    AppLogger.log(
      `📖 Story Settings loaded: ${config.storySettings.genre} | ${config.storySettings.tone}`,
    );
  }

  private loadExistingGameCharacters(config: EndTurnConfig) {
    config.characters = this.characterService.getCharacters();
    AppLogger.log(
      `👥 Existing characters loaded: ${config.characters.length} characters`,
    );
  }

  private loadPastEvents(config: EndTurnConfig) {
    const allGameEvents: BaseGameEvent[] = this.eventsService.getEventLog();
    config.pastCharacterEvents = allGameEvents.filter((e) => {
      return e.status == EventStatus.RESOLVED && e.type == EventType.CHARACTER;
    });
    config.pastWorldEvents = allGameEvents.filter((e) => {
      return e.type == EventType.WORLD;
    });
    config.pastSceneEvents = allGameEvents.filter((e) => {
      return e.type == EventType.SCENE && e.status == EventStatus.RESOLVED;
    });
    AppLogger.log(
      `📜 Resolved events loaded: ${config.pastCharacterEvents.length} character events, ${config.pastWorldEvents.length} world events`,
    );
  }

  private setNumberOfCharactersToGenerate(config: EndTurnConfig) {
    config.numberOfCharactersToCreate = 0;
    if (config.characters.length == 0) {
      config.numberOfCharactersToCreate = 1;
      AppLogger.log(`✨ No characters exist - will create 1 character`);
      return;
    }

    if (this.shouldCreateCharacter()) {
      config.numberOfCharactersToCreate = 1;
      AppLogger.log(
        `✨ Character creation roll succeeded - will create 1 character`,
      );
    } else {
      AppLogger.log(
        `✨ Character creation roll failed - will create 0 characters`,
      );
    }
  }

  private setNumberOfCharacterEventsToCreate(config: EndTurnConfig) {
    const availableCharacters = config.characters.filter((c) => {
      return !this.eventsService.hasPendingEvent(c);
    });

    const charactersToCreateFor: GameCharacter[] = [];

    availableCharacters.forEach((c) => {
      if (this.shouldCreateCharacterEvent()) {
        charactersToCreateFor.push(c);
      }
    });

    config.charactersToCreateEventsFor = charactersToCreateFor;
    config.numberOfCharacterEventToCreate = charactersToCreateFor.length;
    AppLogger.log(
      `⚡ Character events to create: ${config.numberOfCharacterEventToCreate} for characters [${charactersToCreateFor.map((c) => c.name || 'Unknown').join(', ')}]`,
    );
  }

  private setWorldSummary(worldSummary: string) {
    this.worldSummary = worldSummary;
  }

  private addWorldSummary(endTurnConfig: EndTurnConfig): EndTurnConfig {
    endTurnConfig.worldSummary = this.worldSummary;

    return endTurnConfig;
  }

  private createConfig(): EndTurnConfig {
    AppLogger.log(`\n🎮 === CREATING END TURN CONFIG ===`);
    const endTurnConfig = new EndTurnConfig();
    endTurnConfig.gameTurn = this.gameTurnService.getTurn();
    this.loadStorySettings(endTurnConfig);
    this.loadExistingGameCharacters(endTurnConfig);
    this.loadPastEvents(endTurnConfig);
    this.setNumberOfCharactersToGenerate(endTurnConfig);
    this.setNumberOfCharacterEventsToCreate(endTurnConfig);
    this.addWorldSummary(endTurnConfig);
    AppLogger.log(`✅ Config creation complete\n`);
    return endTurnConfig;
  }

  submitChoice(eventId: string, intent: string, choice: string): BaseGameEvent {
    return this.eventsService.submitChoice(
      eventId,
      intent,
      choice,
      this.gameTurnService.getTurn(),
    );
  }

  async endTurn() {
    AppLogger.log(`\n═══════════════════════════════════`);
    AppLogger.log(`🎯 STARTING END TURN SEQUENCE`);
    AppLogger.log(`═══════════════════════════════════\n`);
    this.bumpTurn();
    const endTurnConfig: EndTurnConfig = this.createConfig();

    AppLogger.log(`🤖 Calling AI service to generate content...`);
    let response: TurnContentDto | undefined;
    try {
      response = await this.aiService.generateTurnContent(endTurnConfig);
    } catch (error) {
      const errorName =
        error instanceof Error ? error.constructor.name : 'UnknownError';
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      AppLogger.error(`❌ Exception caught: [${errorName}] ${errorMessage}`);

      if (
        errorMessage.includes('TIMEOUT') ||
        errorMessage.includes('timeout')
      ) {
        AppLogger.error(`❌ Connection timeout: ${errorMessage}`);
        throw new Error(`TIMEOUT: ${errorMessage}`);
      }

      if (errorMessage.includes('JSON') || errorMessage.includes('json')) {
        AppLogger.error(`❌ JSON parse error: ${errorMessage}`);
        throw new Error(`JSON Parse Error: ${errorMessage}`);
      }

      throw error;
    } finally {
      if (!response) {
        this.debumpTurn();
      }
    }

    if (!response) {
      AppLogger.error(`❌ AI service returned empty response`);
      throw new Error('AI service returned empty response');
    }

    AppLogger.log(
      `✅ AI service returned: 1 world event, ${response.characters.length} characters, ${response.characterEvents.length} character events\n`,
    );

    const {
      worldSummary,
      worldEvent,
      characterEvents,
      characters,
      sceneEvent,
    } = response;

    AppLogger.log(
      `📝 Adding world event: ${worldEvent.description?.substring(0, 50)}...`,
    );

    const currentTurn: GameTurn = this.gameTurnService.getTurn().clone();
    this.eventsService.addEvent(
      GameEventFactory.fromPlain({
        id: randomUUID(),
        type: EventType.WORLD,
        status: EventStatus.PENDING,
        createdAt: currentTurn.clone(),
        ...worldEvent,
      }),
    );

    AppLogger.log(`⚡ Adding ${characterEvents.length} character events`);
    characterEvents.forEach((e) => {
      this.eventsService.addEvent(
        GameEventFactory.fromPlain({
          id: randomUUID(),
          type: EventType.CHARACTER,
          status: EventStatus.PENDING,
          createdAt: currentTurn.clone(),
          title: e.title,
          description: e.description,
          asciiArt: e.asciiArt,
          predefinedOptions: e.predefinedOptions,
          characterId: e.characterId,
        }),
      );
    });

    if (sceneEvent) {
      AppLogger.log(`⚡ Adding scene event`);
      this.eventsService.addEvent(
        GameEventFactory.fromPlain({
          id: randomUUID(),
          type: EventType.SCENE,
          status: EventStatus.PENDING,
          createdAt: currentTurn.clone(),
          ...sceneEvent,
        }),
      );
    }

    AppLogger.log(`👥 Adding ${characters.length} new characters`);
    characters.forEach((c) => {
      this.characterService.addCharacter({
        ...c,
      });
    });

    this.setWorldSummary(worldSummary);

    AppLogger.log(`\n═══════════════════════════════════`);
    AppLogger.log(`✅ END TURN SEQUENCE COMPLETE`);
    AppLogger.log(`═══════════════════════════════════\n`);
  }

  async createNewGame(story: Story) {
    this.gameTurnService.resetTurns();
    this.storyService.setStory(story);
    this.characterService.clearCharacters();
    this.eventsService.clearEventLog();
    this.characterService.generateMainCharacter();
    await this.endTurn();
  }
}
