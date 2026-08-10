import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventStatus, GameEvent } from './models/events.model';
import { GameCharacter } from '../characters/models/gameCharacter.model';
import { randomNumber } from '../common/helpers.utils';
import { GameTurn } from 'src/game/models/turn.models';
import { EventAction } from './models/action.model';

@Injectable()
export class EventsService {
  private eventLog: Array<GameEvent> = [];

  constructor() {}

  hasPendingEvent(character: GameCharacter) {
    return (
      this.eventLog.filter((event) => {
        return (
          event.characterId == character.id &&
          event.status == EventStatus.PENDING
        );
      }).length > 0
    );
  }

  clearEventLog(): void {
    this.eventLog = [];
  }

  getEventLog(): Array<GameEvent> {
    return this.eventLog;
  }

  submitChoice(
    eventId: string,
    intent: string,
    choice: string,
    currentTurn: GameTurn,
  ): GameEvent {
    const eventIndex = this.eventLog.findIndex((event) => event.id === eventId);

    if (choice === '')
      throw new UnprocessableEntityException('Choice is an empty string.');
    if (eventIndex === -1) {
      throw new InternalServerErrorException(
        `Event with id ${eventId} not found`,
      );
    }

    const event = this.eventLog[eventIndex];

    // Update the event with the chosen option and mark as resolved
    const updatedEvent = new GameEvent();
    Object.assign(updatedEvent, event, {
      ...event,
      action: new EventAction(choice, intent, currentTurn.getStep()),
      status: EventStatus.RESOLVED,
      chosenOptionSucces: randomNumber(100) <= 50,
      choiceAt: currentTurn.clone(),
    });

    this.eventLog[eventIndex] = updatedEvent;

    return updatedEvent;
  }

  addEvent(event: GameEvent): void {
    this.eventLog = [...this.eventLog, event];
  }
}
