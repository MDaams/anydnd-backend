import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BaseGameEvent,
  CharacterEvent,
  EventStatus,
  SceneEvent,
} from './models/events.model';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import { randomNumber } from 'src/common/helpers.utils';
import { GameTurn } from 'src/game/models/turn.models';
import { EventAction } from './models/action.model';
import { AppLogger } from '@src/common/logger.util';

@Injectable()
export class EventsService {
  private eventLog: Array<BaseGameEvent> = [];

  constructor() {}

  hasPendingEvent(character: GameCharacter) {
    return (
      this.eventLog.filter((event) => {
        if (event instanceof CharacterEvent) {
          return (
            event.characterId == character.id &&
            event.status == EventStatus.PENDING
          );
        }
      }).length > 0
    );
  }

  clearEventLog(): void {
    this.eventLog = [];
  }

  getEventLog(): Array<BaseGameEvent> {
    return this.eventLog;
  }

  submitChoice(
    eventId: string,
    intent: string,
    choice: string,
    currentTurn: GameTurn,
  ): BaseGameEvent {
    const eventIndex = this.eventLog.findIndex((event) => event.id === eventId);

    if (choice === '')
      throw new UnprocessableEntityException('Choice is an empty string.');
    if (eventIndex === -1) {
      throw new InternalServerErrorException(
        `Event with id ${eventId} not found`,
      );
    }

    const event = this.eventLog[eventIndex];

    if (event instanceof CharacterEvent || event instanceof SceneEvent) {
      event.action = new EventAction(choice, intent, currentTurn.getStep());
      event.status = EventStatus.RESOLVED;
      const succesRoll = randomNumber(100);
      AppLogger.log(`🎲 Chosen option succes roll: ${succesRoll}`);
      event.chosenOptionSucces = succesRoll <= 75;
      event.createdAt = currentTurn.clone();
      this.eventLog[eventIndex] = event;
      return event;
    }

    throw new UnprocessableEntityException(
      'Cannot submit a choice for a Worldevent',
    );
  }

  addEvent(event: BaseGameEvent): void {
    this.eventLog = [...this.eventLog, event];
  }
}
