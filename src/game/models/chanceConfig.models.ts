import { Story } from 'src/story/models/story.model';
import { GameTurn } from './turn.models';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import { GameEvent } from 'src/events/models/events.model';

export class EndTurnConfig {
  gameTurn!: GameTurn;
  storySettings!: Story;
  characters!: GameCharacter[];
  charactersToCreateEventsFor!: GameCharacter[];
  pastCharacterEvents!: GameEvent[];
  pastWorldEvents!: GameEvent[];
  pastSceneEvents!: GameEvent[];
  numberOfCharactersToCreate!: number;
  numberOfCharacterEventToCreate!: number;
  worldSummary!: string;
}
