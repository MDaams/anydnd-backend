/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { AIService } from 'src/ai/ai.service';
import { CharactersService } from 'src/characters/characters.service';

describe('CharactersController (e2e)', () => {
  let app: INestApplication<App>;
  let getServer: () => any;
  let moduleFixture: TestingModule;
  let charactersService: CharactersService;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIService)
      .useValue({
        generateRandomCharacter: jest.fn().mockResolvedValue({
          id: 'char-123',
          name: 'test',
          summary: 'Test Summary',
        }),
        generateTurnContent: jest.fn().mockResolvedValue({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    charactersService = moduleFixture.get<CharactersService>(CharactersService);
    getServer = () => {
      return request(app.getHttpServer());
    };
  });

  it('/characters (GET)', () => {
    const expected = [];
    return getServer().get('/characters').expect(200).expect(expected);
  });

  it('/characters (DELETE) - clear all', async () => {
    // Add a character using the real service
    charactersService.addCharacter({
      id: 'char-1',
      name: 'Test Character',
      summary: 'A test character',
      eventLog: [],
    });

    let charactersResponse = await getServer().get('/characters').expect(200);
    expect(charactersResponse.body.length).toEqual(1);

    await getServer().delete('/characters').expect(200);
    charactersResponse = await getServer().get('/characters').expect(200);
    expect(charactersResponse.body.length).toEqual(0);
  });

  afterEach(async () => {
    await app.close();
  });
});
