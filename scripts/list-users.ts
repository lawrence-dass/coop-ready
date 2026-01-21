#!/usr/bin/env tsx
/**
 * List all users in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function listUsers() {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`\n📋 Total users: ${data.users.length}\n`)

  data.users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log(`   Email confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`)
    console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`)
    console.log('')
  })
}

listUsers()
