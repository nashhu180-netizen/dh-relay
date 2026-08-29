#!/usr/bin/env node
import { copyFile, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { migrateProfileRegistry } from './identity.mjs';

function backupPath(path) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${path}.bak-dhr61-${stamp}`;
}

export async function migrateProfileRegistryFile(path) {
  const absolute = resolve(path);
  const before = await readFile(absolute, 'utf8');
  const source = JSON.parse(before);
  const migrated = migrateProfileRegistry(source);
  const after = `${JSON.stringify(migrated, null, 2)}\n`;
  if (JSON.stringify(source) === JSON.stringify(migrated)) return { changed: false, path: absolute, backup: null };

  const backup = backupPath(absolute);
  await copyFile(absolute, backup);
  const temporary = `${absolute}.dhr61.tmp`;
  await writeFile(temporary, after, 'utf8');
  await rename(temporary, absolute);
  return { changed: true, path: absolute, backup };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('usage: node profiles/migrate-profile-registry.mjs <registry-path>');
  const result = await migrateProfileRegistryFile(path);
  console.log(JSON.stringify({ changed: result.changed, path: result.path, backup: result.backup }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`ERROR ${error.message}`); process.exitCode = 1; });
}
