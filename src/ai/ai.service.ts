import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AppLogger } from 'src/common/logger.util';
import { EndTurnConfig } from 'src/game/models/chanceConfig.models';
import {
  EventStatus,
  EventType,
  EventUtils,
} from 'src/events/models/events.model';
import { TurnContentDto } from './dto/turnContent.dto';
import { GameCharacter } from '@src/characters/models/gameCharacter.model';

@Injectable()
export class AIService {
  private ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-3.1-flash-lite';
  private readonly languageDifficulty = 'PG-12';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is niet gevonden in process.env! Check of dotenv goed geladen wordt.',
      );
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generieke geëncapsuleerde methode met robuuste JSON-reiniging om
   * SyntaxErrors door onverwachte trailing tekens te voorkomen.
   */
  private async executeJsonPrompt<T>(
    prompt: string,
    temperature = 0.7,
    errorMessage = 'Er is een fout opgetreden bij de AI-generatie.',
  ): Promise<T> {
    AppLogger.log('Ai Service has been called.');
    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      });

      const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new InternalServerErrorException(
          'Geen tekst ontvangen van de AI-service.',
        );
      }

      let cleanJson = rawText.replace(/```json|```/g, '').trim();
      const firstOpenBrace = cleanJson.indexOf('{');
      const lastCloseBrace = cleanJson.lastIndexOf('}');

      if (
        firstOpenBrace !== -1 &&
        lastCloseBrace !== -1 &&
        lastCloseBrace > firstOpenBrace
      ) {
        cleanJson = cleanJson.substring(firstOpenBrace, lastCloseBrace + 1);
      }

      AppLogger.log('AIService generated json: ' + cleanJson.substring(0, 200));
      return JSON.parse(cleanJson) as T;
    } catch (error) {
      AppLogger.error(`AI Service Error [${errorMessage}]:`, error);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  /**
   * 1. EXECUTIE (Main Orchestrator)
   */
  async generateTurnContent(
    endTurnConfig: EndTurnConfig,
  ): Promise<TurnContentDto> {
    AppLogger.log(`🤖 AI Service: Generating turn content...`);
    const preparedData = this.prepareTurnData(endTurnConfig);
    const prompt = this.buildTurnPrompt(endTurnConfig, preparedData);

    const result = await this.executeJsonPrompt<TurnContentDto>(
      prompt,
      0.7,
      'Er is een fout opgetreden bij het genereren van turn content.',
    );

    AppLogger.log(`✅ AI Service: Generated content`);
    AppLogger.log(
      `  📍 World Event: "${result.worldEvent.title}" (ASCII Art: ${result.worldEvent.asciiArt?.length || 0} chars)`,
    );
    AppLogger.log(`  👥 Characters: ${result.characters.length}`);
    AppLogger.log(
      `  ⚡ Character Events: ${result.characterEvents?.length || 0} | Scene Event: ${result.sceneEvent ? 'Yes' : 'No'}`,
    );

    return result;
  }

  /**
   * 2. DATA PREPARATIE
   */
  private prepareTurnData(endTurnConfig: EndTurnConfig) {
    const mainCharacter: GameCharacter | undefined =
      endTurnConfig.characters.find((c) => {
        return c.isMainCharacter;
      });

    if (!mainCharacter)
      throw new InternalServerErrorException('No main character exists');

    const otherCharacters: GameCharacter[] = endTurnConfig.characters.filter(
      (c) => c.id != mainCharacter.id,
    );
    const recentCharacterEvents =
      endTurnConfig.pastCharacterEvents &&
      endTurnConfig.pastCharacterEvents.length > 0
        ? endTurnConfig.pastCharacterEvents.filter((e) =>
            EventUtils.wasResolvedLastTurn(e, endTurnConfig.gameTurn),
          )
        : 'No recent character events';

    const recentWorldEventsContext =
      endTurnConfig.pastWorldEvents && endTurnConfig.pastWorldEvents.length > 0
        ? endTurnConfig.pastWorldEvents.filter((e) =>
            EventUtils.wasCreatedLastTurn(e, endTurnConfig.gameTurn),
          )
        : 'No recent events';

    const characterContext =
      otherCharacters && otherCharacters.length > 0
        ? otherCharacters
            .map(
              (c) => `ID: ${c.id} | Name: ${c.name} | Backstory: ${c.summary}`,
            )
            .join('\n')
        : 'No active characters in scene';

    const lastTurnResolvedCharacterAndSceneEvents = [
      ...(endTurnConfig.pastCharacterEvents || []),
      ...(endTurnConfig.pastSceneEvents || []),
    ].filter(
      (e) =>
        e.status === EventStatus.RESOLVED &&
        e.action &&
        EventUtils.wasResolvedLastTurn(e, endTurnConfig.gameTurn),
    );

    const lastTurnCreatedWorldEvents = (
      endTurnConfig.pastWorldEvents || []
    ).filter(
      (e) =>
        EventType.WORLD == e.type &&
        EventUtils.wasCreatedLastTurn(e, endTurnConfig.gameTurn),
    );

    const lastTurnResolvedEvents = [
      ...lastTurnCreatedWorldEvents,
      ...lastTurnResolvedCharacterAndSceneEvents,
    ];

    const noChoiceText: string = 'No choices were made last turn';
    const playerChoicesContext =
      lastTurnResolvedEvents.length > 0
        ? lastTurnResolvedEvents
            .filter((e) => !EventUtils.isWorldEvent(e))
            .map((e) => {
              const target = EventUtils.isCharacterEvent(e)
                ? `Character (${e.characterId})`
                : 'Scene / Environment';

              return `- [${target}] ${e.toString()}`;
            })
            .join('\n')
        : noChoiceText;

    const lastTurnChoices = endTurnConfig.pastCharacterEvents.filter((e) =>
      EventUtils.wasResolvedLastTurn(e, endTurnConfig.gameTurn),
    );

    // Hier voegen we expliciet de harde succes/failure uitkomst toe als dwingende instructie voor de AI
    const lastTurnChoicesText =
      lastTurnChoices.length > 0
        ? lastTurnChoices
            .map((e) => {
              const outcome =
                e.chosenOptionSucces === undefined
                  ? 'N/A'
                  : e.chosenOptionSucces
                    ? 'SUCCESS'
                    : 'FAILURE';
              const intent = e.action?.getIntent() ?? 'Unknown';
              return `- Character (ID: "${e.characterId}") | Intent: [${intent}] | Action: "${e.action?.getAction()}" | Roll Outcome: [${outcome}]`;
            })
            .join('\n')
        : 'No character decisions made last turn.';

    const outputLanguage: string =
      endTurnConfig.storySettings.language || 'English';

    return {
      recentCharacterEvents,
      recentWorldEventsContext,
      characterContext,
      playerChoicesContext,
      outputLanguage,
      lastTurnChoicesText,
      languageDifficulty: this.languageDifficulty,
      currentWorldSummary: endTurnConfig.worldSummary,
      mainCharacter,
    };
  }

  /**
   * 3. PROMPT DEFINITIE
   */
  private buildTurnPrompt(
    endTurnConfig: EndTurnConfig,
    data: ReturnType<typeof this.prepareTurnData>,
  ): string {
    const { genre, tone, year, setting } = endTurnConfig.storySettings;

    return `
You are an AI narrative engine creating the next turn of a story game.

CRITICAL LANGUAGE & READABILITY REQUIREMENTS:
- All generated content MUST be strictly in ${data.outputLanguage}.
- LANGUAGE LEVEL (${data.languageDifficulty}): Write in clear, straightforward, and accessible language that a 12-year-old can easily understand. Avoid overly complex, archaic, or dense literary words. Keep sentences concise, punchy, and engaging.

PLAYER PERSPECTIVE (STRICT 2ND PERSON):
- Address the player as "You" (e.g., "You enter...", "You see...").
- Options MUST always represent actions that YOU (${data.mainCharacter.name}, the ${data.mainCharacter.summary}) can take. Never let an NPC decide or act as the player.

WORLD SETTING:
- Genre: ${genre} | Tone: ${tone} | Setting: ${setting}
- Time: Day ${endTurnConfig.gameTurn.day}, ${endTurnConfig.gameTurn.sectionOfDay} (Year ${year})

CURRENT WORLD SUMMARY (CONTINUITY STATE):
${data.currentWorldSummary}
*Instructions on Summary:* Update this summary based on what happened this turn. Explicitly track who is dead, major environmental changes (like bombed locations), and the current narrative status.

PREVIOUS TURN CONTEXT (PLAYER INTENTS & ACTIONS):
${data.playerChoicesContext}

ROLL OUTCOMES & HARD OVERWRITE RULES (CRITICAL):
${data.lastTurnChoicesText}
*NOTE ON ROLL OUTCOMES:* 
- If a roll outcome is [SUCCESS], the player's action MUST unconditionally succeed. The world and characters must react with a successful outcome, even if it involves absurd actions (like miniguns, nukes, or hitting targets). Do not block or jam it unless a FAILURE roll dictates otherwise.
- If a roll outcome is [FAILURE], the player's action MUST fail, jam, miss, or backfire, regardless of what they tried to do.

CURRENT KNOWN CHARACTERS:
${data.characterContext}

GENERATION REQUIREMENTS:

1. WORLD SUMMARY UPDATE:
- Provide an updated, concise summary of the overall story state (3-5 sentences) in the "worldSummary" field, strictly maintaining who is dead and what destruction has occurred.

2. WORLD EVENT (type: WORLD):
- Describe the immediate physical aftermath and consequences of the player's specific intent and action from the perspective of "You", strictly respecting the SUCCESS or FAILURE roll outcome provided above.
- IMPORTANT: Check the history and summary. If the player killed or stabbed someone previously, they are DEAD and must stay dead. Do not magically revive dead characters.
- No options allowed for this event.

3. DYNAMIC CHARACTER MANAGEMENT & CREATION:
- You have total freedom to manage the cast. If a character was killed in previous turns, do not use them anymore. 
- If the action calls for new faces (e.g. vengeful relatives, new guards), invent them dynamically and include them in the "characters" array with a unique string ID.

4. AUTONOMOUS CHARACTER INTERACTIONS:
- LOOK AT THE LIVING CHARACTERS AND THE PLAYER'S PREVIOUS INTENT/ACTION.
- Fill "characterEvents" with meaningful interactions or reactions based on what the player just did and whether they succeeded or failed.
- Leave "characterEvents" as [] if no characters are around, and use "sceneEvent" instead if needed.

RULES:
- Keep the tone strictly like '${tone}'.
- ASCII art: Evocative scenery, 8-12 lines high, max 45 chars wide.

JSON RESPONSE SCHEMA:
{
  "worldSummary": "Updated 3-5 sentence summary of the ongoing story state, dead characters, and world changes.",
  "worldEvent": {
    "title": "Short title (3-6 words)",
    "description": "2-3 clear sentences. Cause-and-effect of the player's action, strictly adhering to the SUCCESS/FAILURE roll outcome and respecting who is alive or dead.",
    "asciiArt": "ASCII art (5-8 lines)"
  },
  "characters": [
    {
      "id": "Unique string ID",
      "name": "Full name",
      "role": "Job or position",
      "summary": "2-3 clear sentences description."
    }
  ],
  "characterEvents": [
    {
      "title": "Short title (3-6 words)",
      "description": "2-3 sentences where a living character reacts to the player's success or failure.",
      "asciiArt": "ASCII art (5-8 lines)",
      "predefinedOptions": ["Option A for You", "Option B for You"],
      "characterId": "Matching character ID"
    }
  ],
  "sceneEvent": null
}
`;
  }
}
