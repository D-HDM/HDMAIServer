require('./dnsSet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const readline = require('readline');
const config = require('../config');
const AiProviderKey = require('../models/AiProviderKey');
const ProjectKey = require('../models/ProjectKey');
const { hashApiKey } = require('../utils/token');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const SEED_AI_KEYS = [
  { module: 'chat', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY, model: 'openai/gpt-oss-20b' },
  { module: 'chat', provider: 'gemini', apiKey: process.env.DEFAULT_GEMINI_API_KEY, model: 'gemini-2.5-flash' },
  { module: 'learn', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_LEARN, model: 'openai/gpt-oss-20b' },
  { module: 'completion', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_COMPLETION, model: 'openai/gpt-oss-20b' },
  { module: 'completion', provider: 'groq_backup', apiKey: process.env.DEFAULT_GROQ_API_KEY_COMPLETION_BACKUP, model: 'openai/gpt-oss-20b' },
];

const SEED_PROJECT_KEYS = [
  { project: 'chat', key: process.env.DEFAULT_HDM_CHAT_KEY, name: 'Default Chat' },
  { project: 'completion', key: process.env.DEFAULT_HDM_COMPLETION_KEY, name: 'Default Completion' },
];

const DEFAULT_SETTINGS = {
  defaultProvider: 'groq',
  defaultModel: 'openai/gpt-oss-20b',
  temperature: 0.7,
  maxTokens: 4096,
  maxApiKeysPerUser: 3,
};

async function connect() {
  await mongoose.connect(config.mongodbUrl);
  console.log('Connected to MongoDB\n');
}

function showMenu() {
  console.log('═══════════════════════════════════');
  console.log('       HDM AI — Seed Script');
  console.log('═══════════════════════════════════');
  console.log('  1. Seed All');
  console.log('  2. Seed AI Provider Keys');
  console.log('  3. Seed Project Keys');
  console.log('  4. Seed Default Settings');
  console.log('  5. View AI Keys');
  console.log('  6. View Project Keys');
  console.log('  7. View Settings');
  console.log('  0. Exit');
  console.log('═══════════════════════════════════');
}

async function seedAll() {
  await seedAiKeys();
  await seedProjectKeys();
  await seedSettings();
}

async function seedAiKeys() {
  let count = 0;
  for (const k of SEED_AI_KEYS) {
    if (!k.apiKey) continue;
    const exists = await AiProviderKey.findOne({ module: k.module, provider: k.provider });
    if (!exists) {
      await AiProviderKey.create({
        module: k.module, provider: k.provider,
        encryptedKey: AiProviderKey.encryptKey(k.apiKey), model: k.model,
      });
      count++;
    }
  }
  console.log(`AI keys seeded: ${count} new\n`);
}

async function seedProjectKeys() {
  let count = 0;
  for (const k of SEED_PROJECT_KEYS) {
    if (!k.key) continue;
    const exists = await ProjectKey.findOne({ keyHash: hashApiKey(k.key) });
    if (!exists) {
      await ProjectKey.create({
        userId: null, project: k.project, name: k.name,
        keyPrefix: k.key.slice(0, 12) + '...', keyHash: hashApiKey(k.key),
      });
      count++;
    }
  }
  console.log(`Project keys seeded: ${count} new\n`);
}

async function seedSettings() {
  const col = mongoose.connection.db.collection('settings');
  const exists = await col.findOne({ type: 'ai_config' });
  if (!exists) {
    await col.insertOne({ type: 'ai_config', ...DEFAULT_SETTINGS, createdAt: new Date() });
    console.log('Settings seeded\n');
  } else {
    console.log('Settings already exist\n');
  }
}

async function viewAiKeys() {
  const keys = await AiProviderKey.find().sort('module provider');
  keys.forEach(k => console.log(`  ${k.module.padEnd(12)} ${k.provider.padEnd(14)} ${k.model}`));
  console.log('');
}

async function viewProjectKeys() {
  const keys = await ProjectKey.find().sort('project');
  keys.forEach(k => console.log(`  ${k.project.padEnd(12)} ${k.name.padEnd(20)} ${k.keyPrefix}`));
  console.log('');
}

async function viewSettings() {
  const col = mongoose.connection.db.collection('settings');
  const s = await col.findOne({ type: 'ai_config' });
  if (s) console.log(`  Provider: ${s.defaultProvider}\n  Model: ${s.defaultModel}\n  Max Tokens: ${s.maxTokens}\n`);
}

async function main() {
  await connect();
  while (true) {
    showMenu();
    const choice = await ask('\nSelect option: ');
    switch (choice) {
      case '1': await seedAll(); break;
      case '2': await seedAiKeys(); break;
      case '3': await seedProjectKeys(); break;
      case '4': await seedSettings(); break;
      case '5': await viewAiKeys(); break;
      case '6': await viewProjectKeys(); break;
      case '7': await viewSettings(); break;
      case '0':
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      default:
        console.log('Invalid option\n');
    }
  }
}

main();