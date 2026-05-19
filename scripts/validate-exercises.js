#!/usr/bin/env node
/**
 * Validates exercise definitions and curriculum alignment.
 * Run: node scripts/validate-exercises.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const EXERCISE_DIR = path.join(ROOT, 'assets', 'exercises');
const REQUIRED = ['id', 'title', 'points', 'instructions', 'starter', 'validate'];

const exerciseFiles = fs.readdirSync(EXERCISE_DIR)
  .filter((name) => /^\d{2}-.+\.js$/.test(name))
  .sort();

const context = {
  window: { exerciseTopics: [] },
  console: { log() {}, warn() {}, error() {} },
};

vm.createContext(context);

for (const file of exerciseFiles) {
  const source = fs.readFileSync(path.join(EXERCISE_DIR, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}

const curriculumSource = fs.readFileSync(path.join(ROOT, 'assets', 'app', 'curriculum.js'), 'utf8');
vm.runInContext(curriculumSource, context, { filename: 'curriculum.js' });

const checksSource = fs.readFileSync(path.join(ROOT, 'assets', 'app', 'exercise-checks.js'), 'utf8');
vm.runInContext(checksSource, context, { filename: 'exercise-checks.js' });

const { topics, exercises } = context.window.Curriculum.build();
const checksById = context.window.exerciseChecksById || {};

let errors = 0;
let warnings = 0;

function fail(message) {
  console.error(`✗ ${message}`);
  errors += 1;
}

function warn(message) {
  console.warn(`⚠ ${message}`);
  warnings += 1;
}

const seenIds = new Map();

for (const topic of context.window.exerciseTopics) {
  for (const exercise of topic.exercises) {
    if (seenIds.has(exercise.id)) {
      warn(`Duplicate id "${exercise.id}" (later definition overrides in ${topic.id})`);
    }
    seenIds.set(exercise.id, path.basename(topic.id));
  }
}

for (const exercise of exercises) {
  for (const field of REQUIRED) {
    if (exercise[field] === undefined || exercise[field] === null) {
      fail(`Exercise "${exercise.id}" is missing required field "${field}"`);
    }
  }

  if (typeof exercise.validate !== 'function') {
    fail(`Exercise "${exercise.id}" must have validate as a function`);
  }

  if (!Array.isArray(exercise.instructions) || exercise.instructions.length === 0) {
    fail(`Exercise "${exercise.id}" must have at least one instruction`);
  }

  const checks = exercise.checks || checksById[exercise.id];
  if (!checks || checks.length === 0) {
    fail(`Exercise "${exercise.id}" has no validation checks (exercise-checks.js)`);
  } else {
    for (const check of checks) {
      if (typeof check.test !== 'function' || typeof check.message !== 'string') {
        fail(`Exercise "${exercise.id}" has an invalid check entry`);
      }
    }
  }
}

const outros = topics.find((topic) => topic.id === 'outros');
if (outros && outros.exercises.length > 0) {
  fail(`Curriculum has ${outros.exercises.length} exercise(s) in "Outros": ${outros.exercises.map((e) => e.id).join(', ')} — add them to curriculum.js`);
}

const planIds = new Set();
for (const topic of context.window.Curriculum.build().topics) {
  topic.exercises.forEach((e) => planIds.add(e.id));
}

for (const id of seenIds.keys()) {
  if (!exercises.some((e) => e.id === id)) {
    warn(`Exercise file defines "${id}" but it is not in the built curriculum`);
  }
}

const interactiveOnly = ['adivinhar-numero', 'calculadora-interativa', 'cifra-interativa', 'falar'];
for (const id of interactiveOnly) {
  if (!exercises.some((e) => e.id === id)) {
    fail(`Expected interactive exercise "${id}" in curriculum (defined in 07-interativo.js)`);
  }
}

console.log(`\nValidated ${exercises.length} exercises in ${topics.length} topics.`);

if (errors > 0) {
  console.error(`\n${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`OK — ${warnings} warning(s).\n`);
