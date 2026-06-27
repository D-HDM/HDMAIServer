require('./dnsSet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const readline = require('readline');
const config = require('../config');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

async function connect() {
  await mongoose.connect(config.mongodbUrl);
  console.log('Connected to MongoDB\n');
}

function showMenu() {
  console.log('═══════════════════════════════════');
  console.log('      HDM AI — Admin CLI');
  console.log('═══════════════════════════════════');
  console.log('  1. List Super Admins');
  console.log('  2. Create Admin');
  console.log('  3. Manage Admin');
  console.log('  4. Delete Admin');
  console.log('  5. List DB Collections');
  console.log('  6. Drop Collection');
  console.log('  7. Drop Entire Database');
  console.log('  0. Exit');
  console.log('═══════════════════════════════════');
}

async function listSuperAdmins() {
  const admins = await Admin.find({ role: 'super' });
  if (admins.length === 0) return console.log('\nNo super admins found.\n');
  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│  Email                     Username       Status             │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  for (const a of admins) {
    const status = a.isActive ? 'Active' : 'Inactive';
    console.log(`│  ${a.email.padEnd(25)} ${a.username.padEnd(13)} ${status.padEnd(18)}│`);
  }
  console.log('└──────────────────────────────────────────────────────────────┘\n');
}

async function createAdmin() {
  console.log('\n--- Create Admin ---');
  const email = await ask('Email: ');
  if (!email) return console.log('Cancelled.\n');
  const username = await ask('Username: ');
  if (!username) return console.log('Cancelled.\n');
  const password = await ask('Password: ');
  if (!password) return console.log('Cancelled.\n');
  const role = await ask('Role (super/admin) [admin]: ') || 'admin';

  const exists = await Admin.findOne({ email });
  if (exists) return console.log('\n⚠ Admin with that email already exists.\n');

  const admin = await Admin.create({ email, username, passwordHash: password, role });
  console.log(`\n✓ Admin created: ${admin.email} (${admin.role})\n`);

  const send = await ask('Send welcome email? (y/n): ');
  if (send.toLowerCase() === 'y') {
    try {
      await emailService.sendWelcomeEmail(admin.email, admin.username);
      console.log('✓ Welcome email sent.\n');
    } catch (err) {
      console.log('✗ Email failed:', err.message, '\n');
    }
  }
}

async function manageAdmin() {
  const admins = await Admin.find().sort('email');
  if (admins.length === 0) return console.log('\nNo admins found.\n');

  console.log('\nAll Admins:');
  admins.forEach((a, i) => {
    const status = a.isActive ? 'Active' : 'Inactive';
    console.log(`  ${i + 1}. ${a.email} (${a.role}) — ${status}`);
  });

  const idx = parseInt(await ask('\nSelect number (0 to cancel): '), 10);
  if (!idx || !admins[idx - 1]) return console.log('Cancelled.\n');

  const admin = admins[idx - 1];
  console.log(`\nManaging: ${admin.email} (${admin.role})`);
  console.log('  1. Toggle Active Status');
  console.log('  2. Change Role');
  console.log('  3. Reset Password');
  console.log('  0. Back');

  const action = await ask('\nAction: ');

  switch (action) {
    case '1':
      admin.isActive = !admin.isActive;
      await admin.save();
      console.log(`\n✓ Status: ${admin.isActive ? 'Active' : 'Inactive'}\n`);
      break;
    case '2':
      admin.role = admin.role === 'super' ? 'admin' : 'super';
      await admin.save();
      console.log(`\n✓ Role: ${admin.role}\n`);
      break;
    case '3':
      const newPass = await ask('New password: ');
      if (!newPass) return console.log('Cancelled.\n');
      admin.passwordHash = newPass;
      await admin.save();
      console.log('\n✓ Password reset.\n');
      break;
    default:
      console.log('Cancelled.\n');
  }
}

async function deleteAdmin() {
  const admins = await Admin.find().sort('email');
  if (admins.length === 0) return console.log('\nNo admins found.\n');

  console.log('\nSelect admin to delete:');
  admins.forEach((a, i) => console.log(`  ${i + 1}. ${a.email} (${a.role})`));

  const idx = parseInt(await ask('\nNumber (0 to cancel): '), 10);
  if (!idx || !admins[idx - 1]) return console.log('Cancelled.\n');

  const admin = admins[idx - 1];
  const confirm = await ask(`Type "${admin.email}" to confirm delete: `);
  if (confirm !== admin.email) return console.log('Cancelled.\n');

  await Admin.findByIdAndDelete(admin._id);
  console.log(`\n✓ Admin deleted: ${admin.email}\n`);
}

async function listCollections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│  Collection               Documents          │');
  console.log('├──────────────────────────────────────────────┤');
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`│  ${col.name.padEnd(24)} ${String(count).padEnd(18)}│`);
  }
  console.log('└──────────────────────────────────────────────┘\n');
}

async function dropCollection() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  if (collections.length === 0) return console.log('\nNo collections found.\n');

  console.log('\nSelect collection to drop:');
  collections.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`));

  const idx = parseInt(await ask('\nNumber (0 to cancel): '), 10);
  if (!idx || !collections[idx - 1]) return console.log('Cancelled.\n');

  const name = collections[idx - 1].name;
  const confirm = await ask(`Type "${name}" to confirm DROP: `);
  if (confirm !== name) return console.log('Cancelled.\n');

  await mongoose.connection.db.dropCollection(name);
  console.log(`\n✓ Dropped: ${name}\n`);
}

async function dropEntireDB() {
  console.log('\n⚠ WARNING: This will delete ALL data permanently.');
  const confirm = await ask('Type "DELETE ALL DATA" to confirm: ');
  if (confirm !== 'DELETE ALL DATA') return console.log('Cancelled.\n');

  const second = await ask('Are you sure? Type "YES" to proceed: ');
  if (second !== 'YES') return console.log('Cancelled.\n');

  await mongoose.connection.db.dropDatabase();
  console.log('\n✓ Database dropped.\n');
}

async function main() {
  await connect();

  while (true) {
    showMenu();
    const choice = await ask('\nSelect option: ');

    switch (choice) {
      case '1': await listSuperAdmins(); break;
      case '2': await createAdmin(); break;
      case '3': await manageAdmin(); break;
      case '4': await deleteAdmin(); break;
      case '5': await listCollections(); break;
      case '6': await dropCollection(); break;
      case '7': await dropEntireDB(); break;
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