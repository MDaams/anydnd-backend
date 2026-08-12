import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BaseGameEvent,
  CharacterEvent,
  EventStatus,
  EventUtils,
  GameEventFactory,
  SceneEvent,
} from './models/events.model';
import { GameCharacter } from 'src/characters/models/gameCharacter.model';
import { GameTurn } from 'src/game/models/turn.models';
import { isEmpty } from 'class-validator';

@Injectable()
export class EventsService {
  private eventLog: Array<BaseGameEvent> = [];

  constructor() {}

  private handleEmptyChoice(): never {
    throw new UnprocessableEntityException('Choice is an empty string.');
  }

  private handleEventNotFound(eventId: string): never {
    throw new InternalServerErrorException(
      `Event with id ${eventId} not found`,
    );
  }

  private handleCannotSubmitOnWorldEvent() {
    throw new UnprocessableEntityException(
      'Tried to submit a choice on an event with type World.',
    );
  }

  private findById(eventId: string): BaseGameEvent | undefined {
    return this.eventLog.find((event) => event.id === eventId);
  }

  private updateEvent(
    eventToUpdate: BaseGameEvent,
    eventToUpdateWith: BaseGameEvent,
  ): BaseGameEvent {
    const updateIndex: number = this.eventLog.indexOf(eventToUpdate);

    this.eventLog[updateIndex] = eventToUpdateWith;

    return this.eventLog[updateIndex];
  }

  private isAWorldEvent(event: BaseGameEvent) {
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

  getEventLog(): Array<BaseGameEvent> {
    return this.eventLog;
  }
  submitChoice(
    eventId: string,
    intent: string,
    choice: string,
    currentTurn: GameTurn,
  ): BaseGameEvent {
    if (isEmpty(choice)) this.handleEmptyChoice();
    const event: BaseGameEvent | undefined = this.findById(eventId);

    if (!event) this.handleEventNotFound(eventId);
    if (this.isAWorldEvent(event)) this.handleCannotSubmitOnWorldEvent();

    const updatedEvent: SceneEvent | CharacterEvent =
      GameEventFactory.fromPlain(event);

    GameEventFactory.submitChoice(event, choice, intent, currentTurn);

    return this.updateEvent(event, updatedEvent);
  }

  addEvent(event: BaseGameEvent): void {
    this.eventLog = [...this.eventLog, event];
  }
}
