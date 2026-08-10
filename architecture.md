# System Architecture

```mermaid
graph TD
    CharactersController --> CharactersService
    EventsController --> EventsService
    GameController --> GameService
    GameService --> GameTurnService
    GameService --> EventsService
    GameService --> CharactersService
    GameService --> AIService
    GameService --> StoryService
```
