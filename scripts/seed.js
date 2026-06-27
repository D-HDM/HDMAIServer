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

const SEED_KEYS = [
  { module: 'general', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
  { module: 'erp', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_ERP, model: 'llama-3.3-70b-versatile' },
  { module: 'smartpos', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_SMARTPOS, model: 'llama-3.3-70b-versatile' },
  { module: 'spark', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_SPARK, model: 'llama-3.3-70b-versatile' },
  { module: 'vibe', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_SPARK, model: 'llama-3.3-70b-versatile' },
  { module: 'vault', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_SPARK, model: 'llama-3.3-70b-versatile' },
  { module: 'widget', provider: 'groq', apiKey: process.env.DEFAULT_GROQ_API_KEY_SPARK, model: 'llama-3.3-70b-versatile' },
  { module: 'general', provider: 'gemini', apiKey: process.env.DEFAULT_GEMINI_API_KEY, model: 'gemini-2.5-flash' },
];

const SEED_PROJECT_KEYS = [
  { project: 'general', key: process.env.DEFAULT_HDM_GENERAL_KEY, name: 'Default General' },
  { project: 'smartpos', key: process.env.DEFAULT_HDM_SMARTPOS_KEY, name: 'Default SmartPOS' },
  { project: 'spark', key: process.env.DEFAULT_HDM_SPARK_KEY, name: 'Default Spark' },
  { project: 'vibe', key: process.env.DEFAULT_HDM_VIBE_KEY, name: 'Default Vibe' },
  { project: 'vault', key: process.env.DEFAULT_HDM_VAULT_KEY, name: 'Default Vault' },
  { project: 'erp', key: process.env.DEFAULT_HDM_ERP_KEY, name: 'Default ERP' },
  { project: 'widget', key: process.env.DEFAULT_HDM_WIDGET_KEY, name: 'Default Widget' },
];

const DEFAULT_SETTINGS = {
  defaultProvider: 'groq',
  defaultModel: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 1024,
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
  console.log('  1. Seed All (keys + project keys + settings)');
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
  console.log('\nSeeding all...');
  await seedKeys();
  await seedProjectKeys();
  await seedSettings();
  console.log('Done.\n');
}

async function seedKeys() {
  let count = 0;
  for (const k of SEED_KEYS) {
    if (!k.apiKey) continue;
    const exists = await AiProviderKey.findOne({ module: k.module, provider: k.provider });
    if (!exists) {
      await AiProviderKey.create({
        module: k.module,
        provider: k.provider,
        encryptedKey: AiProviderKey.encryptKey(k.apiKey),
        model: k.model,
      });
      count++;
    }
  }
  console.log(`\n✓ AI keys seeded: ${count} new (${SEED_KEYS.length - count} already existed)\n`);
}

async function seedProjectKeys() {
  let count = 0;
  for (const k of SEED_PROJECT_KEYS) {
    if (!k.key) continue;
    const exists = await ProjectKey.findOne({ keyHash: hashApiKey(k.key) });
    if (!exists) {
      await ProjectKey.create({
        userId: null,
        project: k.project,
        name: k.name,
        keyPrefix: k.key.slice(0, 12) + '...',
        keyHash: hashApiKey(k.key),
      });
      count++;
    }
  }
  console.log(`\n✓ Project keys seeded: ${count} new (${SEED_PROJECT_KEYS.length - count} already existed)\n`);
}

async function seedSettings() {
  const collection = mongoose.connection.db.collection('settings');
  const exists = await collection.findOne({ type: 'ai_config' });
  if (!exists) {
    await collection.insertOne({ type: 'ai_config', ...DEFAULT_SETTINGS, createdAt: new Date() });
    console.log('\n✓ Default settings seeded.\n');
  } else {
    console.log('\n⚠ Settings already exist.\n');
  }
}

async function viewKeys() {
  const keys = await AiProviderKey.find().sort('module provider');
  if (keys.length === 0) return console.log('\nNo AI keys found.\n');
  console.log('\n┌──────────────────────────────────────────────────────────────────┐');
  console.log('│  Module      Provider    Model                        Active     │');
  console.log('├──────────────────────────────────────────────────────────────────┤');
  for (const k of keys) {
    const active = k.isActive ? '✓' : '✗';
    console.log(`│  ${k.module.padEnd(11)} ${k.provider.padEnd(10)} ${(k.model || 'N/A').padEnd(27)} ${active.padEnd(10)}│`);
  }
  console.log('└──────────────────────────────────────────────────────────────────┘\n');
}

async function viewProjectKeys() {
  const keys = await ProjectKey.find().sort('project');
  if (keys.length === 0) return console.log('\nNo project keys found.\n');
  console.log('\n┌──────────────────────────────────────────────────────────────────────┐');
  console.log('│  Project     Name                 Prefix            Active            │');
  console.log('├──────────────────────────────────────────────────────────────────────┤');
  for (const k of keys) {
    const active = k.isActive ? '✓' : '✗';
    console.log(`│  ${k.project.padEnd(11)} ${(k.name || 'N/A').padEnd(19)} ${k.keyPrefix.padEnd(17)} ${active.padEnd(17)}│`);
  }
  console.log('└──────────────────────────────────────────────────────────────────────┘\n');
}

async function viewSettings() {
  const collection = mongoose.connection.db.collection('settings');
  const settings = await collection.findOne({ type: 'ai_config' });
  if (!settings) return console.log('\nNo settings found.\n');
  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│  Default AI Settings                         │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│  Provider:    ${settings.defaultProvider.padEnd(33)}│`);
  console.log(`│  Model:       ${settings.defaultModel.padEnd(33)}│`);
  console.log(`│  Temperature: ${String(settings.temperature).padEnd(33)}│`);
  console.log(`│  Max Tokens:  ${String(settings.maxTokens).padEnd(33)}│`);
  console.log('└──────────────────────────────────────────────┘\n');
}

async function main() {
  await connect();

  while (true) {
    showMenu();
    const choice = await ask('\nSelect option: ');

    switch (choice) {
      case '1': await seedAll(); break;
      case '2': await seedKeys(); break;
      case '3': await seedProjectKeys(); break;
      case '4': await seedSettings(); break;
      case '5': await viewKeys(); break;
      case '6': await viewProjectKeys(); break;
      case '7': await viewSettings(); break;
      case '0':
        console.log('\nExiting...');
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
      default:
        console.log('\nInvalid option. Try again.\n');
    }
  }
}

main();