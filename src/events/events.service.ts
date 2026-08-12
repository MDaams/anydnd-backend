import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CharacterEvent,
  eventFromPlain,
  EventStatus,
  EventUtils,
  GameEvent,
  WorldEvent,
} from './models/events.model';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import { GameTurn } from 'src/game/models/turn.models';
import { isEmpty } from 'class-validator';
import { chanceRollToHundred } from '@src/common/chance.utils';

@Injectable()
export class EventsService {
  private eventLog: Array<GameEvent> = [];

  constructor() {}

  private handleEmptyChoice(): never {
    throw new UnprocessableEntityException('Choice is an empty string.');
  }

  private handleEventNotFound(eventId: string): never {
    throw new InternalServerErrorException(
      `Event with id ${eventId} not found`,
    );
  }

  private handleCannotSubmitOnWorldEvent(): never {
    throw new UnprocessableEntityException(
      'Tried to submit a choice on an event with type World.',
    );
  }

  private findById(eventId: string): GameEvent | undefined {
    return this.eventLog.find((event) => event.id === eventId);
  }

  private updateEvent(
    eventToUpdate: GameEvent,
    eventToUpdateWith: GameEvent,
  ): GameEvent {
    const updateIndex: number = this.eventLog.indexOf(eventToUpdate);

    this.eventLog[updateIndex] = eventToUpdateWith;

    return this.eventLog[updateIndex];
  }

  private isAWorldEvent(event: GameEvent): event is WorldEvent {
    return EventUtils.isWorldEvent(event);
  }

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

  getEventLog(): Array<GameEvent> {
    return this.eventLog;
  }

  submitChoice(
    eventId: string,
    intent: string,
    choice: string,
    currentTurn: GameTurn,
  ): GameEvent {
    if (isEmpty(choice)) this.handleEmptyChoice();
    const event = this.findById(eventId);

    if (!event) this.handleEventNotFound(eventId);
    if (this.isAWorldEvent(event)) this.handleCannotSubmitOnWorldEvent();

    const resolvableEvent = event;

    resolvableEvent.submitChoice(
      choice,
      intent,
      currentTurn,
      chanceRollToHundred(),
    );

    return this.updateEvent(event, resolvableEvent);
  }

  addEvent(event: GameEvent): void {
    this.eventLog = [...this.eventLog, event];
  }
}
