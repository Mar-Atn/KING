import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSession() {
  console.log('\n🔍 CHECKING YOUR CURRENT SESSION\n')
  console.log('=' .repeat(60))

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    console.log('❌ No active session found')
    console.log('   Please log in through the app first')
    return
  }

  console.log('\n📱 Browser Session (JWT Token):')
  console.log(`   User ID: ${session.user.id}`)
  console.log(`   Email: ${session.user.email}`)
  console.log(`   Role in JWT: ${session.user.user_metadata?.role || 'unknown'}`)
  console.log(`   Token issued: ${new Date(session.user.created_at).toLocaleString()}`)
  console.log(`   Token expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`)

  // Check database
  const { data: userData } = await supabase
    .from('users')
    .select('id, email, role, is_facilitator')
    .eq('id', session.user.id)
    .single()

  console.log('\n💾 Database Record:')
  if (userData) {
    console.log(`   Email: ${userData.email}`)
    console.log(`   Role: ${userData.role}`)
    console.log(`   is_facilitator: ${userData.is_facilitator}`)
  } else {
    console.log('   ❌ User not found in database')
  }

  // Test is_facilitator()
  const { data: funcResult } = await supabase.rpc('is_facilitator')

  console.log('\n🔧 is_facilitator() Function:')
  console.log(`   Result: ${funcResult}`)

  console.log('\n' + '='.repeat(60))
  console.log('\n💡 DIAGNOSIS:\n')

  const jwtRole = session.user.user_metadata?.role || 'unknown'
  const dbRole = userData?.role || 'unknown'
  const dbIsFacilitator = userData?.is_facilitator || false

  if (jwtRole !== dbRole) {
    console.log('❌ MISMATCH DETECTED!')
    console.log(`   JWT token says: ${jwtRole}`)
    console.log(`   Database says: ${dbRole}`)
    console.log('')
    console.log('🔧 FIX: You MUST log out and back in to get a fresh JWT token!')
    console.log('   1. Click logout in the app')
    console.log('   2. Log back in')
    console.log('   3. Try creating a simulation again')
    console.log('')
    console.log('   OR clear browser storage:')
    console.log('   - Open DevTools (F12)')
    console.log('   - Run: localStorage.clear(); sessionStorage.clear(); location.reload()')
  } else if (dbRole === 'facilitator' && dbIsFacilitator && funcResult) {
    console.log('✅ Everything looks correct!')
    console.log('   - Database role: facilitator ✓')
    console.log('   - is_facilitator flag: true ✓')
    console.log('   - is_facilitator() function: true ✓')
    console.log('')
    console.log('   If you still get errors, check:')
    console.log('   1. Network tab for actual error response')
    console.log('   2. Supabase logs for RLS rejections')
    console.log('   3. Browser console for detailed error messages')
  } else {
    console.log('⚠️  Configuration issue detected')
    console.log(`   Database role: ${dbRole}`)
    console.log(`   is_facilitator flag: ${dbIsFacilitator}`)
    console.log(`   is_facilitator() returns: ${funcResult}`)
  }

  console.log('')
}

checkSession().catch(console.error)
