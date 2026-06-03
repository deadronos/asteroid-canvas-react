import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.d.ts') &&
      !entry.name.endsWith('.test.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('core decoupling from Zustand', () => {
  const coreDir = join(__dirname);
  const sourceFiles = collectSourceFiles(coreDir);

  for (const filePath of sourceFiles) {
    const relativePath = relative(coreDir, filePath);
    const content = readFileSync(filePath, 'utf-8');

    it(`${relativePath} does not import from zustand or ui stores`, () => {
      expect(content).not.toMatch(/from\s+['"].*zustand/);
      expect(content).not.toMatch(/from\s+['"].*useHudStore/);
      expect(content).not.toMatch(/from\s+['"].*\/ui\//);
    });
  }
});
