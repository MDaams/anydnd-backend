import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { AIService } from 'src/ai/ai.service';
import { CreateGameDto } from 'src/game/dto/create-game.dto';
import { randomUUID } from 'crypto';
import { EventAction } from 'src/events/models/action.model';
import { EventStatus } from 'src/events/models/events.model';
import { GameTurn } from 'src/game/models/turn.models';
import { EventsService } from 'src/events/events.service';

describe('GameController (e2e)', () => {
  let app: INestApplication<App>;
  let getServer: () => any;
  let eventsService: EventsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIService)
      .useValue({
        generateTurnContent: jest.fn().mockResolvedValue({
          worldEvent: {
            title: 'Test World Event',
            description: 'A test world event describing the atmosphere.',
            asciiArt: '    /\\\\\n   |  |\n   |  |\n   |__|\n    ||',
          },
          characters: [],
          characterEvents: [],
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    eventsService = app.get(EventsService);
    getServer = () => request(app.getHttpServer());
  });

  describe('GET /game/turn', () => {
    it('should return game turn step 0 of no new game has been started', () => {
      return getServer()
        .get('/game/turn')
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveProperty('step');
          expect(response.body).toHaveProperty('day');
          expect(response.body).toHaveProperty('sectionOfDay');
          expect(response.body.step).toBe(0);
          expect(response.body.day).toBe('');
          expect(response.body.sectionOfDay).toBe('');
        });
    });

    it('should retrieve the current game turn', async () => {
      const dto: CreateGameDto = {
        genre: 'test',
        tone: 'test',
        year: '2000',
        setting: 'setting',
        language: 'English',
      };
      await getServer().post('/game').send(dto);
      return getServer()
        .get('/game/turn')
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveProperty('step');
          expect(response.body).toHaveProperty('day');
          expect(response.body).toHaveProperty('sectionOfDay');
          expect(response.body.step).toBe(1);
          expect(response.body.day).toBe('Monday');
          expect(response.body.sectionOfDay).toBe('Morning');
        });
    });
  });

  describe('POST /game/end-turn', () => {
    it('should end the turn and advance to next section', async () => {
      const dto: CreateGameDto = {
        genre: 'test',
        tone: 'test',
        year: '2000',
        setting: 'setting',
        language: 'English',
      };
      await getServer().post('/game').send(dto);

      return getServer()
        .post('/game/end-turn')
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('turn');
          expect(response.body).toHaveProperty('events');
          expect(response.body.turn.step).toBe(2);
          expect(response.body.turn.day).toBe('Monday');
          expect(response.body.turn.sectionOfDay).toBe('Afternoon');
          expect(Array.isArray(response.body.events)).toBe(true);
        });
    });

    it('should advance through multiple turns', async () => {
      const dto: CreateGameDto = {
        genre: 'test',
        tone: 'test',
        year: '2000',
        setting: 'setting',
        language: 'English',
      };
      await getServer().post('/game').send(dto);

      // First turn
      let response = await getServer().post('/game/end-turn').expect(201);
      expect(response.body.turn.step).toBe(2);
      expect(response.body.turn.sectionOfDay).toBe('Afternoon');
      const firstTurnEventCount = response.body.events.length;

      // Second turn - should only return new events, not accumulated
      response = await getServer().post('/game/end-turn').expect(201);
      expect(response.body.turn.step).toBe(3);
      expect(response.body.turn.sectionOfDay).toBe('Evening');
      expect(response.body.events.length).toBe(firstTurnEventCount);

      // Third turn
      response = await getServer().post('/game/end-turn').expect(201);
      expect(response.body.turn.step).toBe(4);
      expect(response.body.turn.sectionOfDay).toBe('Night');
      expect(response.body.events.length).toBe(firstTurnEventCount);

      // Fourth turn (should move to next day)
      response = await getServer().post('/game/end-turn').expect(201);
      expect(response.body.turn.step).toBe(5);
      expect(response.body.turn.day).toBe('Tuesday');
      expect(response.body.turn.sectionOfDay).toBe('Morning');
      expect(response.body.events.length).toBe(firstTurnEventCount);
    });

    it('should include ASCII art in world event when ending turn', async () => {
      const response = await getServer().post('/game/end-turn').expect(201);

      const worldEvent = response.body.events.find(
        (event: any) => event.type === 'WORLD',
      );
      expect(worldEvent).toBeDefined();
      expect(worldEvent).toHaveProperty('asciiArt');
      expect(worldEvent.asciiArt).toBeDefined();
      expect(worldEvent.asciiArt.length).toBeGreaterThan(0);
    });

    it('should include ASCII art in character events when ending turn', async () => {
      await getServer().post('/game/end-turn').expect(201);

      const eventsResponse = await getServer().get('/events').expect(200);
      const response = await getServer().post('/game/end-turn').expect(201);

      const characterEvents = response.body.events;
      // Verify all character events have ASCII art
      characterEvents.forEach((event: any) => {
        expect(event).toHaveProperty('asciiArt');
        expect(event.asciiArt).toBeDefined();
        expect(event.asciiArt.length).toBeGreaterThan(0);
      });
    });
  });

  describe('POST /game', () => {
    it('should retrieve the current game turn', () => {
      const dto: CreateGameDto = {
        genre: 'genre',
        tone: 'tone',
        year: '2000',
        setting: 'setting',
        language: 'English',
      };
      return getServer()
        .post('/game')
        .send(dto)
        .expect(201)
        .expect((response) => {
          expect(response.body).toHaveProperty('step');
          expect(response.body).toHaveProperty('day');
          expect(response.body).toHaveProperty('sectionOfDay');
          expect(response.body.step).toBe(1);
          expect(response.body.day).toBe('Monday');
          expect(response.body.sectionOfDay).toBe('Morning');
        });
    });

    [
      {
        dto: {
          genre: '',
          tone: 'tone',
          year: '2000',
          setting: 'setting',
        },
        reason: 'Genre is empty',
      },
      {
        dto: {
          genre: 'genre',
          tone: '',
          year: '2000',
          setting: 'setting',
        },
        reason: 'Tone is empty',
      },
      {
        dto: {
          genre: 'genre',
          tone: 'tone',
          year: '',
          setting: 'setting',
        },
        reason: 'Year is empty',
      },
      {
        dto: {
          genre: 'genre',
          tone: 'tone',
          year: '2000',
          setting: '',
        },
        reason: 'Setting is empty',
      },
    ].forEach(({ dto, reason }) => {
      it(`should fail when ${reason}`, () => {
        return getServer().post('/game').send(dto).expect(400);
      });
    });
  });

  describe('PUT /events/:id/submit-choice', () => {
    it('should submit a choice for an event', async () => {
      const choice: string = 'Test Choice';
      const intent: string = 'Talk';

      const testEvent = {
        id: randomUUID(),
        type: 'SCENE' as any,
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
        .put(`/game/${testEvent.id}/submit-choice`)
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
        .put('/game/non-existent-id/submit-choice')
        .send({ choice: 'Option 1', intent: 'Talk' })
        .expect(500);
    });

    it('should validate choice is not empty', () => {
      return getServer()
        .put('/game/some-id/submit-choice')
        .send({ choice: '', intent: 'Talk' })
        .expect(400);
    });

    it('should throw a 422 when WorldEvent is passed', () => {
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
        .put(`/game/${testEvent.id}/submit-choice`)
        .send({ choice, intent })
        .expect(422);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
