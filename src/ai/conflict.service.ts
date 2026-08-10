import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EndTurnConfig } from '../game/models/chanceConfig.models';
import { TurnContentDto } from './dto/turnContent.dto';
import { EventStatus, GameEvent } from '../events/models/events.model';
import { GoogleGenAI } from '@google/genai';
import { AppLogger } from '../common/logger.util';
import { GameTurn } from 'src/game/models/turn.models';
// --- Constanten (Eenmalig in het geheugen geladen bij opstarten) ---
const ATMOSPHERIC_MOODS = [
  'things feel tense and uneasy',
  'everyone seems nervous and restless',
  "there's anger and resentment brewing",
  'sadness mixes with a small bit of hope',
  'the mood feels like it could snap at any moment',
  "it's too quiet—something feels like it's coming",
  'feelings are running very high and hot',
  "people don't trust each other",
];

// Abstracte themathische drivers in plaats van specifieke mini-plots
const THEMATIC_DRIVERS = [
  'A conflict of loyalty vs self-preservation',
  'An unexpected opportunity with a hidden cost',
  'A clash between past promises and present reality',
  'An escalating dispute over scarce resources',
  'A mistake from the past catching up with someone',
  'A fragile truce being tested',
  'A choice between public duty and personal gain',
  'An awkward truth coming to light',
];

const CLASS_ORIGINS = [
  'low-level street laborer',
  'impoverished aristocrat',
  'eccentric scholar',
  'disgraced soldier',
  'itinerant merchant',
  'reclusive craftsperson',
  'ambitious lower-level official',
  'desperate outsider',
  'wandering practitioner',
  'local guild member',
];

const ABSTRACT_MOTIVES = [
  'Seeking safety and stability',
  'Chasing leverage or influence',
  'Trying to right a previous wrong',
  'Protecting a fragile secret',
  'Escaping an uncomfortable obligation',
];

const CULTURAL_BACKGROUNDS = [
  'West African (e.g., Yoruba, Akan, Wolof)',
  'East Asian (e.g., Korean, Vietnamese, Cantonese)',
  'South Asian (e.g., Punjabi, Bengali, Tamil)',
  'Central or Eastern European (e.g., Polish, Romanian, Czech)',
  'Latin American or Hispanic',
  'Middle Eastern or North African (e.g., Levantine, Maghrebi)',
  'Nordic or Scandinavian',
  'Southern European (e.g., Greek, Portuguese, Sicilian)',
  'Celtic or Irish',
  'Central Asian',
];

@Injectable()
export class ConflictAIService {
  private ai: GoogleGenAI;
  private readonly defaultModel = 'gemini-3.1-flash-lite';
  private readonly languageDifficulty = 'PG-12'; // Simple, accessible language for age 12+

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
   * Generieke geëncapsuleerde methode voor het uitvoeren van prompts die
   * een gestructureerde JSON-respons verwachten.
   */
  private async executeJsonPrompt<T>(
    prompt: string,
    temperature = 1.0,
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

      // Strippen van Markdown codeblocks voor robuuste JSON parsing
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
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
      1.1,
      'Er is een fout opgetreden bij het genereren van turn content.',
    );

    AppLogger.log(`✅ AI Service: Generated content`);
    AppLogger.log(
      `  📍 World Event: "${result.worldEvent.title}" (ASCII Art: ${result.worldEvent.asciiArt?.length || 0} chars)`,
    );
    AppLogger.log(`  👥 Characters: ${result.characters.length}`);
    AppLogger.log(
      `  ⚡ Character Events: ${result.characterEvents.length} (with ASCII Art)`,
    );

    return result;
  }

  /**
   * 2. DATA PREPARATIE
   */
  private prepareTurnData(endTurnConfig: EndTurnConfig) {
    const getRandom = <T>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];

    const recentCharacterEvents =
      endTurnConfig.pastCharacterEvents &&
      endTurnConfig.pastCharacterEvents.length > 0
        ? endTurnConfig.pastCharacterEvents.filter((e) => {
            return e.wasResolvedLastTurn(endTurnConfig.gameTurn);
          })
        : 'No recent character events';

    const recentWorldEventsContext =
      endTurnConfig.pastWorldEvents && endTurnConfig.pastWorldEvents.length > 0
        ? endTurnConfig.pastWorldEvents.filter((e) => {
            return e.wasCreatedLastTurn(endTurnConfig.gameTurn);
          })
        : 'No recent events';

    const characterContext =
      endTurnConfig.characters && endTurnConfig.characters.length > 0
        ? endTurnConfig.characters
            .map(
              (c) => `ID: ${c.id} | Name: ${c.name} | Backstory: ${c.summary}`,
            )
            .join('\n')
        : 'No characters yet';

    // Opgeloste keuzes uit de vorige turn ophalen
    const lastTurnResolvedCharacterEvents = (
      endTurnConfig.pastCharacterEvents || []
    ).filter(
      (e) =>
        e.status === EventStatus.RESOLVED &&
        e.action &&
        e.wasResolvedLastTurn(endTurnConfig.gameTurn),
    );

    const lastTurnCreatedWorldEvents = (
      endTurnConfig.pastWorldEvents || []
    ).filter(
      (e) =>
        e.status === EventStatus.RESOLVED &&
        e.action &&
        e.wasCreatedLastTurn(endTurnConfig.gameTurn),
    );

    const lastTurnResolvedEvents = [
      ...lastTurnCreatedWorldEvents,
      ...lastTurnResolvedCharacterEvents,
    ];

    const playerChoicesContext =
      lastTurnResolvedEvents.length > 0
        ? lastTurnResolvedEvents
            .map((e) => {
              const target = e.characterId
                ? `Character (${e.characterId})`
                : 'World Event';
              return `- [${target}] Event: "${e.title}" -> Player Chose: "${e.action?.getAction()}"`;
            })
            .join('\n')
        : 'No choices were made last turn.';

    // Genereer inspiraties voor nieuwe karakters
    const characterInspirations = Array.from(
      { length: endTurnConfig.numberOfCharactersToCreate },
      () => ({
        seed: randomUUID(),
        origin: getRandom(CLASS_ORIGINS),
        motive: getRandom(ABSTRACT_MOTIVES),
        culture: getRandom(CULTURAL_BACKGROUNDS),
      }),
    );

    const characterInspirationText = characterInspirations
      .map(
        (char, index) => `
    Character ${index + 1} (ID: "${char.seed}"):
    - Background: ${char.origin}
    - Primary Drive: ${char.motive}
    - Cultural Background: ${char.culture}`,
      )
      .join('\n');

    const allCharacterIds = [
      ...(endTurnConfig.charactersToCreateEventsFor?.map((c) => c.id) || []),
      ...characterInspirations.map((c) => c.seed),
    ];

    const lastTurnChoices: GameEvent[] =
      endTurnConfig.pastCharacterEvents.filter((e) =>
        e.wasResolvedLastTurn(endTurnConfig.gameTurn),
      );

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
              return `- Character (ID: "${e.characterId}") | Action: "${e.action?.getAction()}" | Roll Outcome: [${outcome}]`;
            })
            .join('\n')
        : 'No character decisions made last turn.';

    let outputLanguage: string | undefined =
      endTurnConfig.storySettings.language;
    if (!outputLanguage) outputLanguage = 'English';

    const playerRole = "I am neo from 'the matrix'.";

    return {
      recentCharacterEvents,
      recentWorldEventsContext,
      characterContext,
      playerChoicesContext,
      randomMood: getRandom(ATMOSPHERIC_MOODS),
      thematicDriver: getRandom(THEMATIC_DRIVERS),
      characterInspirationText,
      allCharacterIds,
      outputLanguage,
      lastTurnChoices,
      lastTurnChoicesText,
      playerRole,
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
    console.log('End turn config Arguments passed for prompt: ', endTurnConfig);
    console.log('-----------------------------------');
    console.log('DATA Arguments passed for prompt: ', data);

    return `
  You are an AI narrative engine creating the next turn of a story game.

  CRITICAL LANGUAGE REQUIREMENT:
  - All generated content MUST be strictly in ${data.outputLanguage}.
  - Every field (titles, descriptions, character names, dialogue, options) MUST use ONLY ${data.outputLanguage}. Do NOT mix languages.

  PLAYER IDENTITY & PERSPECTIVE ANCHOR (STRICT 2ND PERSON):
  - THE PLAYER IS "YOU": You are writing a story about the player character.
  - PLAYER ROLE / IDENTITY: ${data.playerRole || 'Traveler'}
  - PERSPECTIVE RULE: Always address the player as "You" (e.g., "You enter...", "You see..."). 
  - NO ROLE-SWAPPING: NPCs are NEVER the protagonists or the active choice-makers in the descriptions. Options MUST ALWAYS represent actions that YOU (the ${data.playerRole || 'player'}) can take.
  - NEVER write descriptions where an NPC is deciding or acting as the player.

  WORLD SETTING:
  - Genre: ${genre} | Tone: ${tone} | Setting: ${setting}
  - Time: Day ${endTurnConfig.gameTurn.day}, ${endTurnConfig.gameTurn.sectionOfDay} (Year ${year})
  - CURRENT OVERALL MOOD: ${data.randomMood}

  --------------------------------------------------
  RESOLVED PLAYER ACTIONS FROM PREVIOUS TURN (MANDATORY CONTINUITY):
  The player made the following decisions on previous events:
  ${data.playerChoicesContext}
  --------------------------------------------------

  PAST EVENTS HISTORY:
  Recent World Events:
  ${data.recentWorldEventsContext}
   
  Recent Character Events:
  ${data.recentCharacterEvents}

  Last turn player choices & calculated Roll Outcomes:
  ${data.lastTurnChoicesText}

  ACTIVE CHARACTERS IN SCENE:
  ${data.characterContext}

  --------------------------------------------------
  CORE NARRATIVE RULES FOR THIS TURN:

  1. CAUSE AND EFFECT (WORLD EVENT - MANDATORY STATE CHANGE):
     - The World Event MUST describe the IMMEDIATE PHYSICAL OUTCOME and direct aftermath of the player's resolved action: "${data.playerChoicesContext}".
     - IF the player fled, escaped, or relocated: The World Event MUST establish the NEW environment the player just arrived at, explicitly acknowledging their movement and surroundings.
     - NEVER output a static or generic background description that ignores where the player just ran or what they achieved.

  2. MECHANICAL ROLL RESOLUTION & FAILURE MANDATE (STRICT EXECUTION):
     - For any character or action resolved in the previous turn:
       a) IF Roll Outcome is [SUCCESS]: The player achieves their immediate intent in their role as ${data.playerRole || 'the protagonist'}.
       b) IF Roll Outcome is [FAILURE]: THE INTENDED GOAL DOES NOT HAPPEN. Do NOT accommodate the player.
          - Example: If the player tried to force an NPC out, escape, or bluff, and FAILED: The NPC REFUSES, escalates the scene, shoves the player back, or blocks the path. The obstacle remains active.
     - New options generated for this turn MUST deal directly with the unresolved conflict or immediate backlash of this outcome.

  3. DIRECT DIALOGUE & INFORMATION PAYLOAD (NO STALLING):
     - When the player explicitly asks an NPC for information, secrets, or item contents:
       a) The NPC MUST reveal actual concrete facts, names, locations, or secrets immediately in their dialogue/description.
       b) Do NOT stall, delay, or repeat vague warnings (e.g., "I have a secret..."). Give the actual secret NOW.

  4. THEMATIC FOCUS:
     The underlying narrative theme for this turn is: "${data.thematicDriver}".
  --------------------------------------------------

  GENERATION REQUIREMENTS FOR THIS TURN:

  1. ONE WORLD EVENT (type: WORLD):
     - Atmospheric event describing the immediate result of previous actions on the environment from the perspective of YOU (the ${data.playerRole || 'player'}).
     - NO player choices or options allowed for this event.

  2. NEW CHARACTERS (${endTurnConfig.numberOfCharactersToCreate}):
     ${data.characterInspirationText || 'No new characters required.'}

  3. INTERACTIVE EVENTS (STRICT CONDITIONAL):
     - IF ${endTurnConfig.numberOfCharacterEventToCreate} > 0 AND character list is NOT empty:
       Generate ${endTurnConfig.numberOfCharacterEventToCreate} "characterEvents" entry/entries. Assign to character IDs from: [${data.allCharacterIds.map((id) => `"${id}"`).join(', ')}].
       Options MUST describe how YOU (the ${data.playerRole || 'player'}) choose to interact with or respond to that NPC.
       Set "sceneEvent" to null.

     - IF ${endTurnConfig.numberOfCharacterEventToCreate} == 0 OR character list is EMPTY (e.g., player fled on a horse, traveling alone, or no NPCs present):
       Set "characterEvents" to an EMPTY array [].
       You MUST generate the "sceneEvent" object. A sceneEvent is an interactive event focused purely on environment, navigation, survival, or situational choices for YOU (the ${data.playerRole || 'player'}) WITHOUT requiring an NPC.

  OPTION DESIGN RULES:
  - Options MUST feel grounded, believable, and human for someone in the role of ${data.playerRole || 'the protagonist'}.
  - Options MUST present a meaningful dilemma between two valid approaches (e.g., Caution vs. Direct Action).
  - Write options in clear, natural sentence case (e.g., "Examine the seal closely", NOT "INSPECT THE DOCUMENT").

  TIME & EVENT EXECUTION RULES (STRICT MANDATE):

  1. ABSOLUTE PRESENT TIME LOCK:
    - You MUST ONLY describe what happens in the CURRENT time of day and day number provided in the state.
    - You are NEVER allowed to fast-forward the time or skip hours within a single narrative response unless explicitly instructed by the backend state.

  2. DELAYED / FUTURE ACTIONS (CRITICAL):
    - If the player expresses an intention to do something in the future (e.g., "I will go to the tavern tomorrow morning"):
      a) DO NOT transition the scene to that location or time yet.
      b) Keep the player in their CURRENT location and CURRENT time.
      c) Describe only the IMMEDIATE action (e.g., preparing to leave or acknowledging the decision).

  3. ERA & ANACHRONISM CHECK:
    - All environmental descriptions, travel durations, and events MUST strictly match the technological and social constraints of the specified YEAR/ERA.

  ASCII ART RULES:
  - Create EVOCATIVE SCENERY, ATMOSPHERIC ENVIRONMENTS, or DETAILED DRAMATIC SCENES.
  - NEVER generate basic stick figures, generic signposts, or simple icons.
  - Dimensions MUST be between 8 to 12 lines high and maximum 45 characters wide.
  - Use shading and depth with standard ASCII characters (/, \, |, _, ., -, *, #, @, ~, =, +).

  WRITING RULES:
  - Use CONCRETE DETAILS, actions, and dialogue instead of abstract emotions.
  - Keep tone strictly like '${tone}'.
  - Character names MUST match their specified cultural background and year ${year}.
  - DO NOT use forbidden words: "formerly", "greedy", "petty", "obsessed", "suddenly", "mysterious", "chaos", "happened", "driven by", "ex-".

  JSON RESPONSE SCHEMA:
  {
    "worldEvent": {
      "title": "Short title (3-6 words)",
      "description": "2-3 sentences. Clear cause-and-effect of the player's chosenOption from the perspective of 'You'.",
      "asciiArt": "Small ASCII art (5-8 lines)"
    },
    "characters": [
      {
        "id": "MUST match the assigned UUID string from inspiration input",
        "name": "Full name",
        "role": "Job or position",
        "summary": "2-3 sentences describing who they are."
      }
    ],
    "characterEvents": [
      {
        "title": "Short title (3-6 words)",
        "description": "2-3 sentences showing a conflict between YOU (the ${data.playerRole || 'player'}) and the character.",
        "asciiArt": "Small ASCII art (5-8 lines)",
        "predefinedOptions": [
          "Plausible approach A for You",
          "Plausible approach B for You"
        ],
        "characterId": "Single characterId string from the available list"
      }
    ],
    "sceneEvent": {
      "title": "Short title (3-6 words, e.g. Fork in the Road)",
      "description": "2-3 sentences describing a situational dilemma for YOU without NPCs.",
      "asciiArt": "Small ASCII art (5-8 lines)",
      "predefinedOptions": [
        "Environmental choice A",
        "Environmental choice B"
      ]
    }
  }
`;
  }
}
