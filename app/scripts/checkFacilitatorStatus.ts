import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkFacilitatorStatus() {
  console.log('\n🔍 CHECKING FACILITATOR STATUS\n')
  console.log('=' .repeat(60))

  // 1. Check current auth session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.log('❌ Not authenticated - please log in through the app first')
    return
  }

  const userId = session.user.id
  console.log(`\n1️⃣ Current User ID: ${userId}`)
  console.log(`   Email: ${session.user.email}`)

  // 2. Check user's role in users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, display_name, role, status')
    .eq('id', userId)
    .single()

  console.log(`\n2️⃣ User Record in Database:`)
  if (userError) {
    console.log(`   ❌ Error: ${userError.message}`)
  } else if (!userData) {
    console.log(`   ⚠️  NO RECORD FOUND in users table!`)
    console.log(`   ⚠️  This is the problem - auth.users exists but public.users doesn't`)
  } else {
    console.log(`   Email: ${userData.email}`)
    console.log(`   Display Name: ${userData.display_name}`)
    console.log(`   Role: ${userData.role}`)
    console.log(`   Status: ${userData.status}`)

    if (userData.role !== 'facilitator') {
      console.log(`   ❌ PROBLEM: Role is "${userData.role}" but should be "facilitator"`)
    } else {
      console.log(`   ✅ Role is correctly set to "facilitator"`)
    }
  }

  // 3. Test is_facilitator() function
  const { data: funcResult, error: funcError } = await supabase
    .rpc('is_facilitator')

  console.log(`\n3️⃣ is_facilitator() Function Result:`)
  if (funcError) {
    console.log(`   ❌ Error: ${funcError.message}`)
  } else {
    console.log(`   Result: ${funcResult}`)
    if (funcResult === false) {
      console.log(`   ❌ Function returns FALSE - RLS will block facilitator actions`)
    } else {
      console.log(`   ✅ Function returns TRUE - RLS should allow facilitator actions`)
    }
  }

  // 4. Show all facilitators
  const { data: allFacilitators, error: facError } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('role', 'facilitator')

  console.log(`\n4️⃣ All Facilitators in System:`)
  if (facError) {
    console.log(`   ❌ Error: ${facError.message}`)
  } else if (!allFacilitators || allFacilitators.length === 0) {
    console.log(`   ⚠️  NO FACILITATORS FOUND in users table`)
  } else {
    console.log(`   Found ${allFacilitators.length} facilitator(s):`)
    allFacilitators.forEach((fac, idx) => {
      const isCurrent = fac.id === userId ? ' ← YOU' : ''
      console.log(`   ${idx + 1}. ${fac.email} (${fac.display_name})${isCurrent}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n💡 DIAGNOSIS:\n')

  if (!userData) {
    console.log('❌ Your user record is missing from the public.users table!')
    console.log('   This happens when handle_new_user() trigger fails during registration.')
    console.log('')
    console.log('🔧 FIX: Manually insert your user record with facilitator role:')
    console.log(`   INSERT INTO users (id, email, display_name, role, status)`)
    console.log(`   VALUES ('${userId}', '${session.user.email}', 'Your Name', 'facilitator', 'registered');`)
  } else if (userData.role !== 'facilitator') {
    console.log(`❌ Your role is "${userData.role}" but it should be "facilitator"!`)
    console.log('')
    console.log('🔧 FIX: Update your role to facilitator:')
    console.log(`   UPDATE users SET role = 'facilitator' WHERE id = '${userId}';`)
  } else {
    console.log('✅ Everything looks correct! is_facilitator() should be working.')
    console.log('   If you still have issues, check:')
    console.log('   1. Browser console for auth errors')
    console.log('   2. Supabase logs for RLS policy rejections')
    console.log('   3. Try logging out and back in')
  }

  console.log('')
}

checkFacilitatorStatus().catch(console.error)
