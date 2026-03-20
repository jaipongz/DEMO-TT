#!/usr/bin/env node

const bcrypt = require('bcrypt');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(`\nPassword: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log(`\nUse this hash in auth-init.sql`);
}

const password = process.argv[2] || 'P@ssw0rd123';
generateHash(password);
