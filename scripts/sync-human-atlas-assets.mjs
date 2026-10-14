#!/usr/bin/env node
/**
 * Copie les données d'atlas Human-Atlas réellement nécessaires depuis le clone
 * épinglé (vendor/human-atlas-upstream) vers public/models/ de l'hôte.
 *
 * Ne copie QUE : les 2 manifestes JSON + les chunks .bin.gz (le loader amont
 * préfère .gz quand DecompressionStream existe ; les .bin bruts, 113 Mo, ne
 * sont pas distribués). Consigne les empreintes SHA-256 dans
 * public/models/SHA256SUMS.txt pour la traçabilité (cahier technique §10).
 *
 * Usage : node scripts/sync-human-atlas-assets.mjs
 * Prérequis : git clone https://github.com/slorksmo/Human-Atlas.git vendor/human-atlas-upstream
 * Révision attendue (figée à l'audit) : 5bb5713aab18d7fe9380c3339eb09f173491ea06
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const UPSTREAM = path.join(ROOT, 'vendor', 'human-atlas-upstream');
const SOURCE = path.join(UPSTREAM, 'public', 'models');
const TARGET = path.join(ROOT, 'public', 'models');
const EXPECTED_SHA = '5bb5713aab18d7fe9380c3339eb09f173491ea06';

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

let sha;
try {
  sha = execSync('git rev-parse HEAD', { cwd: UPSTREAM, encoding: 'utf8' }).trim();
} catch {
  fail(
    'clone amont introuvable. Exécuter :\n' +
      '  git clone https://github.com/slorksmo/Human-Atlas.git vendor/human-atlas-upstream',
  );
}
if (sha !== EXPECTED_SHA) {
  fail(
    `révision amont ${sha} ≠ révision auditée ${EXPECTED_SHA}.\n` +
      'Revenir au SHA audité (git checkout) ou mettre à jour l’audit.',
  );
}

const files = (await readdir(SOURCE)).filter(
  (name) => name.endsWith('.json') || name.endsWith('.bin.gz'),
);
if (files.length === 0) fail('aucun fichier source trouvé dans vendor/human-atlas-upstream/public/models');

await mkdir(TARGET, { recursive: true });
const sums = [];
for (const name of files) {
  const from = path.join(SOURCE, name);
  const to = path.join(TARGET, name);
  await copyFile(from, to);
  const digest = createHash('sha256').update(await readFile(from)).digest('hex');
  sums.push(`${digest}  ${name}`);
  console.log(`✓ ${name}`);
}
await writeFile(
  path.join(TARGET, 'SHA256SUMS.txt'),
  `# Données Human-Atlas — révision amont ${sha}\n# Licence données : CC BY 4.0 (cf. docs/anatomy-data-sources.md)\n${sums.join('\n')}\n`,
);
console.log(
  `\n${files.length} fichiers copiés vers public/models/ — empreintes consignées dans SHA256SUMS.txt`,
);
