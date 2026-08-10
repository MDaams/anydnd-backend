import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { App } from 'supertest/types';
import { AIService } from '../src/ai/ai.service';
import { GameTurn } from '../src/game/models/turn.models';
import { GameService } from '../src/game/game.service';
import { EventsService } from '../src/events/events.service';

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

 

  describe('DELETE /events', () => {
    it('should clear the event log', () => {
      return getServer().delete('/events').expect(200);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
