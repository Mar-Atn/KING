/**
 * Create 20 mock test users with Supabase Auth
 * Password for each user = their email
 * Run with: npx tsx scripts/createMockUsers.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key for auth admin

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const mockUsers = [
  { email: 'alex.thompson@test.com', displayName: 'Alex Thompson', fullName: 'Alexander Thompson' },
  { email: 'maria.garcia@test.com', displayName: 'Maria Garcia', fullName: 'Maria Elena Garcia' },
  { email: 'john.smith@test.com', displayName: 'John Smith', fullName: 'John Michael Smith' },
  { email: 'sophia.chen@test.com', displayName: 'Sophia Chen', fullName: 'Sophia Wei Chen' },
  { email: 'david.kumar@test.com', displayName: 'David Kumar', fullName: 'David Raj Kumar' },
  { email: 'emma.johnson@test.com', displayName: 'Emma Johnson', fullName: 'Emma Rose Johnson' },
  { email: 'lucas.martinez@test.com', displayName: 'Lucas Martinez', fullName: 'Lucas Antonio Martinez' },
  { email: 'olivia.brown@test.com', displayName: 'Olivia Brown', fullName: 'Olivia Grace Brown' },
  { email: 'noah.davis@test.com', displayName: 'Noah Davis', fullName: 'Noah James Davis' },
  { email: 'ava.wilson@test.com', displayName: 'Ava Wilson', fullName: 'Ava Elizabeth Wilson' },
  { email: 'ethan.lee@test.com', displayName: 'Ethan Lee', fullName: 'Ethan Christopher Lee' },
  { email: 'isabella.martin@test.com', displayName: 'Isabella Martin', fullName: 'Isabella Marie Martin' },
  { email: 'mason.anderson@test.com', displayName: 'Mason Anderson', fullName: 'Mason Alexander Anderson' },
  { email: 'mia.taylor@test.com', displayName: 'Mia Taylor', fullName: 'Mia Sophia Taylor' },
  { email: 'liam.thomas@test.com', displayName: 'Liam Thomas', fullName: 'Liam Patrick Thomas' },
  { email: 'charlotte.white@test.com', displayName: 'Charlotte White', fullName: 'Charlotte Grace White' },
  { email: 'james.harris@test.com', displayName: 'James Harris', fullName: 'James William Harris' },
  { email: 'amelia.clark@test.com', displayName: 'Amelia Clark', fullName: 'Amelia Rose Clark' },
  { email: 'benjamin.lewis@test.com', displayName: 'Benjamin Lewis', fullName: 'Benjamin Joseph Lewis' },
  { email: 'harper.walker@test.com', displayName: 'Harper Walker', fullName: 'Harper Olivia Walker' },
]

async function createMockUsers() {
  console.log('🎭 Creating 20 mock test users...\n')

  let successCount = 0
  let skipCount = 0

  for (const user of mockUsers) {
    try {
      // Create user with Supabase Auth (password = email)
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: user.displayName,
          full_name: user.fullName
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`⏭️  ${user.displayName} - Already exists, skipping`)
          skipCount++
        } else {
          throw error
        }
      } else {
        // Update users table with additional info
        await supabase
          .from('users')
          .update({
            display_name: user.displayName,
            full_name: user.fullName,
            role: 'participant',
            status: 'registered'
          })
          .eq('id', data.user.id)

        console.log(`✅ ${user.displayName} - Created (${user.email})`)
        successCount++
      }
    } catch (err: any) {
      console.error(`❌ ${user.displayName} - Error: ${err.message}`)
    }
  }

  console.log('\n========================================')
  console.log('MOCK USER CREATION COMPLETE')
  console.log('========================================')
  console.log(`✅ Created: ${successCount}`)
  console.log(`⏭️  Skipped: ${skipCount}`)
  console.log(`📧 Password for all users = their email`)
  console.log('========================================\n')
}

createMockUsers()
