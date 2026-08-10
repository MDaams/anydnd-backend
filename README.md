# AI-Powered Turn-Based Game Backend

A robust, production-grade NestJS backend designed to orchestrate turn-based gameplay loops driven by external AI service integrations. This project implements clean domain separation, a centralized orchestrator pattern, and defensive error-handling with automatic state rollbacks.

# Architecture Overview

The application follows a clean modular architecture, separating **HTTP** routing (Controllers) from core workflow orchestration (GameService) and specialized domain micro-services.

GameController
    └── GameService (Orchestrator)
    ├── GameTurnService (Turn & State Management)
    ├── EventsService (World, Scene, & Character Events)
    ├── CharactersService (**NPC** Lifecycle & State)
    ├── AIService (AI Content Generation & Parsing)
    └── StoryService (Genre, Tone, & Setting Config)

## Key Features

Orchestration Pattern (GameService): Centralizes multi-step transaction loops (such as ending a turn or initializing a new game) without cluttering controllers or domain layers.

Resilient Error Recovery: Gracefully catches AI service failures (timeouts, malformed **JSON** responses) and automatically rolls back game state (debumpTurn) to prevent desynchronization.

Modular Domain Services: Strictly partitioned domains for tracking game turns, events, characters, and story metadata.

Comprehensive Testing Suite: Fully tested with Jest unit specs (covering edge cases, mocks, and failure paths) and Supertest **E2E** integration specs.

## Tech Stack

Framework: NestJS (TypeScript)

Testing: Jest, Supertest

Validation: class-validator, class-transformer

Logging: Custom logger utility (AppLogger)

# Getting Started

Prerequisites

Node.js (v18+ recommended)

npm or yarn

Installation

# Clone the repository

git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)

## Install dependencies

npm install

Running the Application

## development

npm run start

## watch mode

npm run start:dev

## production mode

npm run start:prod

## Running Tests

### unit tests

npm run test

### e2e tests

npm run test:e2e

### test coverage

npm run test:cov

# Engineering Highlights

Defensive State Management: Turns are only officially advanced (bumpTurn) once external AI generation successfully completes. If a failure occurs, the state rollback mechanism restores previous turn integrity.

Mocked Unit Boundaries: Service specs isolate business logic cleanly using customized Jest mocks for external AI wrappers and independent domain models.