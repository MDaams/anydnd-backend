import { NestFactory } from '@nestjs/core';
import { ModulesContainer } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'dummy-key-for-docs-generation';
}

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

  const isValidComponent = (name: string) => {
    return (
      name &&
      !ignoredNames.has(name) &&
      !name.startsWith('_') &&
      isNaN(Number(name))
    );
  };

  for (const [_, moduleRef] of modulesContainer.entries()) {
    if (moduleRef.controllers) {
      for (const [_, controller] of moduleRef.controllers.entries()) {
        const ctrlClass = controller.metatype;
        if (!ctrlClass) continue;
        const ctrlName = ctrlClass.name;
        if (!isValidComponent(ctrlName)) continue;

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

  const mermaidCode = mermaidLines.join('\n');

  let readmeContent = fs.readFileSync('README.md', 'utf8');

  const targetPattern = /```mermaid\s*[\s\S]*?```/;

  const replacement = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;

  if (targetPattern.test(readmeContent)) {
    readmeContent = readmeContent.replace(targetPattern, replacement);
  } else {
    readmeContent += `\n\n## Generated Architecture\n${replacement}\n`;
  }

  fs.writeFileSync('README.md', readmeContent);

  await app.close();
  console.log(
    'README.md successfully updated with live NestJS dependency graph!',
  );
}

generateMermaid();
