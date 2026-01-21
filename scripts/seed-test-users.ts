#!/usr/bin/env tsx
/**
 * Seed Test Users Script
 *
 * Creates test users in Supabase Auth for development and testing.
 * Uses the Admin API to properly create users with all required metadata.
 *
 * Usage:
 *   npm run seed:users
 *   # or
 *   tsx scripts/seed-test-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure .env.local is configured correctly.')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test users to create
const testUsers = [
  {
    email: 'lawrence.dass@outlook.in',
    password: 'test123',
    metadata: {
      full_name: 'Lawrence Dass',
      role: 'admin'
    }
  },
  {
    email: 'test@example.com',
    password: 'test123',
    metadata: {
      full_name: 'Test User',
      role: 'user'
    }
  }
]

async function seedUsers() {
  console.log('🌱 Seeding test users...\n')

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const exists = existingUsers?.users.find(u => u.email === user.email)

      if (exists) {
        console.log(`⚠️  User already exists: ${user.email}`)
        console.log(`   User ID: ${exists.id}`)
        console.log(`   Created: ${new Date(exists.created_at).toLocaleString()}`)
        continue
      }

      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: user.metadata
      })

      if (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message)
        continue
      }

      console.log(`✅ Created user: ${user.email}`)
      console.log(`   User ID: ${data.user.id}`)
      console.log(`   Metadata:`, user.metadata)
    } catch (err) {
      console.error(`❌ Error creating ${user.email}:`, err)
    }

    console.log('') // Blank line between users
  }

  console.log('✨ Seeding complete!\n')
  console.log('You can now login with:')
  testUsers.forEach(u => {
    console.log(`   Email: ${u.email}`)
    console.log(`   Password: ${u.password}`)
    console.log('')
  })
}

// Run the seed
seedUsers().catch(console.error)
