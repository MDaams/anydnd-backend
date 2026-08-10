import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { App } from 'supertest/types';
import { AIService } from '../src/ai/ai.service';
import { EventStatus, GameEvent } from '../src/events/models/events.model';
import { GameTurn } from '../src/game/models/turn.models';
import { GameService } from '../src/game/game.service';
import { EventsService } from '../src/events/events.service';
import { randomUUID } from 'crypto';
import { EventAction } from '../src/events/models/action.model';
import { SubmitChoiceDto } from 'src/events/dto/submitChoice.dto';

describe('EventsController (e2e)', () => {
  let app: INestApplication<App>;
  let getServer: () => any;
  let eventsService: EventsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIService)
      .useValue({
        generateTurnContent: jest.fn(),
      })
      .overrideProvider(GameService)
      .useValue({
        getTurn: jest.fn().mockReturnValue(new GameTurn(1)),
        bumpTurn: jest.fn(),
        endTurn: jest.fn().mockResolvedValue({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    eventsService = moduleFixture.get<EventsService>(EventsService);
    getServer = () => {
      return request(app.getHttpServer());
    };
  });

  describe('GET /events', () => {
    it('should retrieve the event log', () => {
      return getServer()
        .get('/events')
        .expect(200)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });

  describe('PUT /events/:id/submit-choice', () => {
    it('should submit a choice for an event', async () => {
      const choice: string = 'Test Choice';
      const intent: string = 'Talk';

      const testEvent = {
        id: randomUUID(),
        type: 'WORLD' as any,
        title: 'Test Event',
        description: 'A test event',
        status: EventStatus.PENDING,
        createdAt: new GameTurn(1),
        action: new EventAction(choice, intent, 1),
        wasCreatedLastTurn: jest.fn(),
        wasResolvedLastTurn: jest.fn(),
      };
      eventsService.addEvent(testEvent);

      return getServer()
        .put(`/events/${testEvent.id}/submit-choice`)
        .send({ choice, intent })
        .expect(200)
        .expect((response) => {
          const updatedEvent = response.body;
          expect(updatedEvent.action.action).toBe(choice);
          expect(updatedEvent.status).toBe(EventStatus.RESOLVED);
        });
    });

    it('should return 500 when event not found', () => {
      return getServer()
        .put('/events/non-existent-id/submit-choice')
        .send({ choice: 'Option 1', intent: 'Talk' })
        .expect(500);
    });

    it('should validate choice is not empty', () => {
      return getServer()
        .put('/events/some-id/submit-choice')
        .send({ choice: '', intent: 'Talk' })
        .expect(400);
    });
  });

  describe('DELETE /events', () => {
    it('should clear the event log', () => {
      return getServer().delete('/events').expect(200);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
