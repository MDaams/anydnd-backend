import { Injectable } from '@nestjs/common';
import { GameTurn } from './models/turn.models';
import { AppLogger } from '../common/logger.util';

@Injectable()
export class GameTurnService {
  private gameTurn: GameTurn = new GameTurn(0);

  getTurn(): GameTurn {
    return this.gameTurn.clone();
  }

  resetTurns() {
    this.gameTurn = new GameTurn(0);
  }

  bumpTurn() {
    this.gameTurn.addStep();
    AppLogger.log(
      `📅 Turn bumped to: Day ${this.gameTurn.day} ${this.gameTurn.sectionOfDay} (Step ${this.gameTurn.getStep()})`,
    );
  }

  debumpTurn() {
    this.gameTurn.removeStep();
    AppLogger.log(
      `📅 Turn debumped to: Day ${this.gameTurn.day} ${this.gameTurn.sectionOfDay} (Step ${this.gameTurn.getStep()})`,
    );
  }
}
