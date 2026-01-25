/**
 * Environment Variables Check Script
 *
 * Run this to verify your .env.local is properly configured
 * Usage: node scripts/check-env.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found');
  console.log('\n💡 Solution: Copy .env.example to .env.local');
  console.log('   cp .env.example .env.local\n');
  process.exit(1);
}

// Simple env loader
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
  }
});

console.log('🔍 Checking environment variables...\n');

const checks = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    isPublic: true,
    validate: (v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return 'Must be a valid URL';
      }
    },
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    isPublic: true,
    validate: (v) => v && v !== 'your-anon-key-here',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    isPublic: false,
    validate: (v) => v && v !== 'your-service-role-key-here',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: true,
    isPublic: false,
    validate: (v) => {
      if (!v || v === 'your-anthropic-api-key-here' || v === 'sk-ant-api-key-here') {
        return 'Must be a real Anthropic API key';
      }
      if (!v.startsWith('sk-ant-')) {
        return 'Must start with sk-ant-';
      }
      return true;
    },
  },
];

let hasErrors = false;

checks.forEach((check) => {
  const value = env[check.name];
  const hasValue = value && value.length > 0;

  if (!hasValue && check.required) {
    console.log(`❌ ${check.name}`);
    console.log(`   Missing required variable\n`);
    hasErrors = true;
    return;
  }

  if (hasValue && check.validate) {
    const validation = check.validate(value);
    if (validation !== true) {
      console.log(`❌ ${check.name}`);
      console.log(`   ${validation || 'Invalid value'}\n`);
      hasErrors = true;
      return;
    }
  }

  const visibility = check.isPublic ? '(public)' : '(server-only ⚠️)';
  console.log(`✅ ${check.name} ${visibility}`);
  if (value.includes('127.0.0.1') || value.includes('localhost')) {
    console.log(`   Using local development value`);
  }
  console.log();
});

if (hasErrors) {
  console.log('❌ Environment configuration has errors');
  console.log('\n💡 Please update your .env.local file\n');
  process.exit(1);
}

console.log('✅ All environment variables are properly configured!');
console.log('\n🚀 You can now run: npm run dev\n');
