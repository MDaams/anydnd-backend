import { NestFactory } from '@nestjs/core';
import { ModulesContainer } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

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

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const isDataModel = (name: string) => {
  return (
    name.endsWith('Dto') ||
    name.endsWith('Model') ||
    name.endsWith('Entity') ||
    name.endsWith('Repository') ||
    name.endsWith('Event')
  );
};

const isValidComponent = (name: string) => {
  return (
    name &&
    !ignoredNames.has(name) &&
    !name.startsWith('_') &&
    isNaN(Number(name))
  );
};

async function generateMermaid() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const modulesContainer = app.get(ModulesContainer);

  const allRelations = new Set<string>();

  // 1. Gather runtime DI connections
  for (const [_, moduleRef] of modulesContainer.entries()) {
    const processEntries = (entries: Map<any, any> | undefined) => {
      if (!entries) return;
      for (const [_, item] of entries.entries()) {
        const cls = item.metatype;
        if (!cls) continue;
        const clsName = cls.name;
        if (!isValidComponent(clsName)) continue;

        const dependencies = Reflect.getMetadata('design:paramtypes', cls) || [];
        for (const dep of dependencies) {
          const depName = dep.name;
          if (isValidComponent(depName)) {
            allRelations.add(`    ${clsName} --> ${depName}`);
          }
        }
      }
    };

    processEntries(moduleRef.controllers);
    processEntries(moduleRef.providers);
  }

  // 2. Statically scan source files for type/interface/class references
  const srcDir = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    const allFiles = getAllTsFiles(srcDir);
    const fileContentMap = new Map<string, { content: string; defined: string[] }>();
    const symbolToFile = new Map<string, string>();

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(/(?:class|interface|type)\s+([A-Za-z0-9_]+)/g) || [];
      const definedSymbols = matches.map((m) => 
        m.replace(/class|interface|type/, '').trim()
      );
      
      fileContentMap.set(file, { content, defined: definedSymbols });
      for (const sym of definedSymbols) {
        symbolToFile.set(sym, file);
      }
    }

    for (const [file, { content, defined }] of fileContentMap.entries()) {
      for (const sourceSymbol of defined) {
        if (!isValidComponent(sourceSymbol)) continue;

        for (const [targetSymbol, _] of symbolToFile.entries()) {
          if (isDataModel(targetSymbol) && sourceSymbol !== targetSymbol) {
            const regex = new RegExp(`\\b${targetSymbol}\\b`, 'g');
            if (regex.test(content)) {
              allRelations.add(`    ${sourceSymbol} --> ${targetSymbol}`);
            }
          }
        }
      }
    }
  }

  const mermaidContent = [
    'graph TD',
    ...Array.from(allRelations),
  ].join('\n');

  const markdownContent = `# Full System Architecture\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\`\n`;
  fs.writeFileSync('full-architecture.md', markdownContent);

  await app.close();
  console.log('full-architecture.md successfully generated as a flat, unified graph!');
}

generateMermaid();