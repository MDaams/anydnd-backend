import { Injectable } from '@nestjs/common';
import { GameCharacter } from './models/gameCharacter.model';
import { AppLogger } from 'src/common/logger.util';

@Injectable()
export class CharactersService {
  private characters: GameCharacter[] = [];

  getCharacters(): GameCharacter[] {
    AppLogger.log(`Retrieving ${this.characters.length} characters`);
    return this.characters;
  }

  clearCharacters(): void {
    AppLogger.log(
      `Clearing all characters (${this.characters.length} removed)`,
    );
    this.characters = [];
  }

  addCharacter(character: GameCharacter) {
    const existingCharacter = this.characters.find(
      (c) => c.name === character.name,
    );
    if (existingCharacter) {
      AppLogger.log(
        `Character with name "${character.name}" already exists. Skipping.`,
      );
      return;
    }
    AppLogger.log(
      `Adding new character: "${character.name}" (ID: ${character.id})`,
    );
    this.characters = [...this.characters, character];
  }
}
