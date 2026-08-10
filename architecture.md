# System Architecture

```mermaid
graph TD
    CharactersController --> CharactersService
    EventsController --> EventsService
    EventsController --> GameTurnService
    GameController --> GameService
    CharactersService --> StoryService
    GameService --> GameTurnService
    GameService --> EventsService
    GameService --> CharactersService
    GameService --> AIService
    GameService --> StoryService
```
