import { NestFactory } from '@nestjs/core';
import { ModulesContainer } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'dummy-key-for-docs-generation';
}

// Lijst met NestJS interne typen/woorden die we willen negeren
const ignoredNames = new Set([
  'ModuleRef',
  'Reflector',
  'ConfigService',
  'EventEmitter',
  'AppModule',
  'InternalCoreModule',
]);

async function generateMermaid() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const modulesContainer = app.get(ModulesContainer);

  const mermaidLines: string[] = ['graph TD'];
  const addedRelations = new Set<string>();

  // Helper om te controleren of een naam valide is
  const isValidComponent = (name: string) => {
    return (
      name &&
      !ignoredNames.has(name) &&
      !name.startsWith('_') &&
      isNaN(Number(name))
    );
  };

  for (const [_, moduleRef] of modulesContainer.entries()) {
    // Haal alle controllers op van deze module
    if (moduleRef.controllers) {
      for (const [_, controller] of moduleRef.controllers.entries()) {
        const ctrlClass = controller.metatype;
        if (!ctrlClass) continue;
        const ctrlName = ctrlClass.name;

        if (!isValidComponent(ctrlName)) continue;

        // Vraag via Reflect de constructor parameters (dependencies) op
        const dependencies =
          Reflect.getMetadata('design:paramtypes', ctrlClass) || [];

        for (const dep of dependencies) {
          const depName = dep.name;
          if (isValidComponent(depName)) {
            const line = `    ${ctrlName} --> ${depName}`;
            if (!addedRelations.has(line)) {
              addedRelations.add(line);
              mermaidLines.push(line);
            }
          }
        }
      }
    }

    // Haal ook de providers (services) op om te kijken of *zij* andere services aanroepen
    if (moduleRef.providers) {
      for (const [_, provider] of moduleRef.providers.entries()) {
        const providerClass = provider.metatype;
        if (!providerClass) continue;
        const providerName = providerClass.name;

        if (!isValidComponent(providerName)) continue;

        const dependencies =
          Reflect.getMetadata('design:paramtypes', providerClass) || [];

        for (const dep of dependencies) {
          const depName = dep.name;
          if (isValidComponent(depName)) {
            const line = `    ${providerName} --> ${depName}`;
            if (!addedRelations.has(line)) {
              addedRelations.add(line);
              mermaidLines.push(line);
            }
          }
        }
      }
    }
  }

  const markdownContent = `# System Architecture\n\n\`\`\`mermaid\n${mermaidLines.join('\n')}\n\`\`\`\n`;
  fs.writeFileSync('architecture.md', markdownContent);

  await app.close();
  console.log(
    'Architecture.md successfully updated with clean dependency graph!',
  );
}

generateMermaid();
