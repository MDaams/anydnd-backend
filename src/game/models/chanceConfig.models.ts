import { Story } from 'src/story/models/story.model';
import { GameTurn } from './turn.models';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import {
  CharacterEvent,
  SceneEvent,
  WorldEvent,
} from 'src/events/models/events.model';

export class EndTurnConfig {
  gameTurn!: GameTurn;
  storySettings!: Story;
  characters!: GameCharacter[];
  charactersToCreateEventsFor!: GameCharacter[];
  pastCharacterEvents!: CharacterEvent[];
  pastWorldEvents!: WorldEvent[];
  pastSceneEvents!: SceneEvent[];
  numberOfCharactersToCreate!: number;
  numberOfCharacterEventToCreate!: number;
  worldSummary!: string;
}
