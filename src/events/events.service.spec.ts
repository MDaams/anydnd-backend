import { EventsService } from './events.service';
import {
  GameEvent,
  EventStatus,
  EventType,
} from '../events/models/events.model';
import {
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as helpersUtils from '../common/helpers.utils';
import { GameTurn } from '../game/models/turn.models';
import { ActionIntent } from './models/action.model';

jest.mock('../common/helpers.utils');

describe('EventsService', () => {
  let service: EventsService;
  let mockGameTurn: GameTurn;

  beforeEach(() => {
    service = new EventsService();
    mockGameTurn = new GameTurn(1);
    mockGameTurn.addStep();
  });

  it('should clear events', async () => {
    const characterEvent = new GameEvent();
    characterEvent.type = EventType.CHARACTER;
    service.addEvent(characterEvent);
    service.addEvent(characterEvent);
    service.addEvent(characterEvent);

    let result: Array<GameEvent> = service.getEventLog();
    expect(result.length).toBe(3);

    service.clearEventLog();

    result = service.getEventLog();
    expect(result.length).toBe(0);
  });

  describe('Submit Choice', () => {
    let eventId: string;

    beforeEach(() => {
      const event: GameEvent = new GameEvent();
      event.id = randomUUID();
      event.status = EventStatus.PENDING;
      service.addEvent(event);
      eventId = event.id;
    });

    it('should submit a valid choice for an event', () => {
      const result = service.submitChoice(eventId, 'Talk', 'Yes', mockGameTurn);

      expect(result).toBeDefined();
      expect(result?.action?.getAction()).toBe('Yes');
      expect(result?.status).toBe(EventStatus.RESOLVED);
      expect(result?.action?.getCreatedAtStep()).toBe(2);
      expect(result?.action?.getIntent()).toBe(ActionIntent.TALK);
    });

    it('should do a succes action roll for the chosen option', () => {
      jest.spyOn(helpersUtils, 'randomNumber').mockImplementation(() => {
        return 0; // Return min to guarantee chance conditions pass
      });
      const result: GameEvent = service.submitChoice(
        eventId,
        'Talk',
        'Yes',
        mockGameTurn,
      );

      expect(result).toBeDefined();
      expect(result.chosenOptionSucces).toBe(true);
    });

    it('should throw error when event not found', () => {
      const invalidId = 'non-existent-id';

      expect(() =>
        service.submitChoice(invalidId, 'Talk', 'Yes', mockGameTurn),
      ).toThrow(InternalServerErrorException);
    });

    it('should throw error when choice is empty', () => {
      expect(() =>
        service.submitChoice(eventId, 'Talk', '', mockGameTurn),
      ).toThrow(UnprocessableEntityException);
    });

    it('should update event status to RESOLVED after choice submission', () => {
      const initialEvent = service.getEventLog().find((e) => e.id === eventId);
      expect(initialEvent?.status).toBe(EventStatus.PENDING);

      service.submitChoice(eventId, 'Talk', 'Yes', new GameTurn(1));

      const updatedEvent = service.getEventLog().find((e) => e.id === eventId);
      expect(updatedEvent?.status).toBe(EventStatus.RESOLVED);
    });

    it('should return updated event', () => {
      const actionIntent: string = 'Talk';
      const action: string = 'Yes';
      const gameTurn: GameTurn = new GameTurn(1);
      const result = service.submitChoice(
        eventId,
        actionIntent,
        action,
        gameTurn,
      );

      expect(result.action?.getIntent()).toBe(actionIntent);
      expect(result.action?.getCreatedAtStep()).toBe(gameTurn.getStep());
      expect(result.action?.getAction()).toBe(action);
    });
  });
});
