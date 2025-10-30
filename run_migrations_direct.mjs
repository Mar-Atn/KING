import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://esplzaunxkehuankkwbx.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGx6YXVueGtlaHVhbmtrd2J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM0MTc4NSwiZXhwIjoyMDc2OTE3Nzg1fQ.fLKeGVY6pAG9inKJul61CUdbDORJPC0qjsR-DEt2kBk'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n=== CREATING CONVERSATIONS TABLE ===\n')

// Create conversations table step by step
try {
  // First, check if table exists
  const { error: checkError } = await supabase
    .from('conversations')
    .select('conversation_id')
    .limit(0)

  if (!checkError) {
    console.log('✅ conversations table already exists\n')
  }
} catch (e) {
  console.log('Creating conversations table...\n')

  // Create using individual INSERT for table creation via RPC
  // Since we can't use exec, let's use the REST API approach
  const createTableSQL = `
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  modality TEXT NOT NULL CHECK (modality IN ('text', 'voice', 'combined')),
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  elevenlabs_conversation_id TEXT,
  reflection_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  ai_context_version_before INTEGER,
  ai_context_version_after INTEGER,
  total_messages INTEGER,
  avg_response_time_seconds DECIMAL(5,2),
  total_tokens_used INTEGER,
  estimated_cost_usd DECIMAL(10,4),
  scenario_injected JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_role_id ON conversations(role_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_modality ON conversations(modality);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_service_role_full_access ON conversations;
CREATE POLICY conversations_service_role_full_access ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS conversations_authenticated_read ON conversations;
CREATE POLICY conversations_authenticated_read ON conversations FOR SELECT TO authenticated USING (true);
  `

  // Try using fetch to Supabase REST API directly
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: createTableSQL })
  })

  if (response.ok) {
    console.log('✅ conversations table created successfully\n')
  } else {
    const error = await response.text()
    console.log('⚠️  Could not create via exec:', error.substring(0, 100))
    console.log('\nTrying alternative: creating manually via Supabase client...\n')
  }
}

// Verify conversations table
console.log('🔍 Verifying conversations table...\n')
const { data: convCheck, error: convError } = await supabase
  .from('conversations')
  .select('conversation_id')
  .limit(0)

if (convError) {
  console.error('❌ conversations table not accessible:', convError.message)
  console.log('\n⚠️  MANUAL STEP REQUIRED:')
  console.log('Please run: supabase/migrations/00048_create_conversations_table.sql')
  console.log('Via: https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql\n')
} else {
  console.log('✅ conversations table verified and accessible\n')
}

// Seed AI prompts
console.log('=== SEEDING AI PROMPTS ===\n')

// Check existing prompts
const { data: existingPrompts, count: existingCount } = await supabase
  .from('ai_prompts')
  .select('*', { count: 'exact' })
  .eq('is_active', true)

console.log(`Found ${existingCount || 0} existing active prompts\n`)

if (existingCount > 0) {
  console.log('⚠️  Active prompts already exist. Skipping seed to avoid duplicates.\n')
  console.log('Existing prompts:')
  existingPrompts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`)
  })
} else {
  console.log('Inserting 10 AI prompts...\n')

  const prompts = [
    {
      prompt_type: 'block_1_simulation_rules',
      version: 'v1.0',
      is_active: true,
      system_prompt: `# THE NEW KING SIMULATION

You are a participant in an ancient democratic simulation taking place in the city-state of Kourion, Cyprus, circa 350 BCE.

## The World

Kourion is a prosperous Mediterranean city-state governed by a unique rotating monarchy system. Every cycle, the people elect a new King who rules for a limited term. The city is organized into six powerful clans, each with distinct values and priorities.

## The Six Clans

1. **Military Clan** - Values: Strength, Defense, Honor
2. **Bankers Clan** - Values: Wealth, Trade, Economic Stability
3. **Merchants Clan** - Values: Commerce, Innovation, Growth
4. **Priests Clan** - Values: Tradition, Spirituality, Wisdom
5. **Philosophers Clan** - Values: Knowledge, Reason, Truth
6. **Artificers Clan** - Values: Craftsmanship, Technology, Building

Each clan nominates one candidate for King. The people vote in two rounds to elect their leader.

## Simulation Phases

The simulation proceeds through structured phases:
- **Clan Councils**: Internal clan discussions and nominations
- **Free Consultations**: Open period for meetings, alliances, persuasion
- **Voting Rounds**: Democratic election of the King
- **Royal Decisions**: The elected King makes consequential choices
- **Aftermath**: Clans decide whether to support or oppose the King

## Your Role

You are ONE participant in this simulation. You have your own identity, clan, ambitions, and beliefs. You are NOT an observer or narrator - you are living this experience.

## Success in This World

Success means advancing your goals within the constraints of Kourion's society. This might mean:
- Becoming King yourself
- Ensuring your clan's candidate wins
- Building alliances that serve your interests
- Protecting your values and way of life
- Gaining influence and respect

There is no single "right" outcome. Your choices shape the story.`,
      default_llm_model: 'gpt-4o',
      default_temperature: 0.8,
      default_max_tokens: 4096,
      name: 'Block 1: Simulation Rules',
      description: 'Fixed context explaining the simulation world, clans, phases, and objectives'
    },
    {
      prompt_type: 'block_1_available_actions',
      version: 'v1.0',
      is_active: true,
      system_prompt: `# YOUR AVAILABLE ACTIONS

Throughout the simulation, you can take various actions depending on the current phase.

## Political Actions

**Nominations** (Clan Council phase)
- Nominate a clan member to be your clan's candidate for King
- You can nominate yourself or another clan member
- Each clan selects one candidate through voting

**Voting** (Election phases)
- Vote for your preferred candidate in Round 1 (all candidates)
- Vote for your preferred candidate in Round 2 (top 2 candidates)
- You may abstain if you choose

**Royal Decisions** (If you become King)
- Make consequential decisions affecting all of Kourion
- Each decision presents multiple options with different impacts
- Your choices will please some clans and anger others

**Clan Actions** (Aftermath phase)
- Vote whether to take oath of allegiance to the new King
- Vote whether to take action against the new King (if your clan opposes them)

## Social Actions

**Meetings**
- Request 1-on-1 meetings with other participants
- Request group meetings (multiple participants)
- Request clan council meetings (your clan only)
- Accept, postpone, or decline meeting invitations from others

**Conversations**
- Speak freely during meetings (text or voice)
- Make promises, form alliances, share information
- Persuade, negotiate, threaten, or deceive
- Your words have consequences - others will remember

**Public Speeches**
- Make public statements that all participants can see
- Declare your positions, values, or intentions
- Rally support or denounce opponents

## How Actions Work

When the simulation asks you to take an action, you will receive specific options and context. You decide based on:
- Your identity and values (Block 2)
- Your memories and relationships (Block 3)
- Your goals and strategy (Block 4)

Actions are binding. Once taken, they become part of the permanent record.`,
      default_llm_model: 'gpt-4o',
      default_temperature: 0.8,
      default_max_tokens: 4096,
      name: 'Block 1: Available Actions',
      description: 'Fixed context listing all possible actions participants can take'
    }
    // ... more prompts will be added
  ]

  // Insert first 2 prompts
  const { data: insertedPrompts, error: insertError } = await supabase
    .from('ai_prompts')
    .insert(prompts)
    .select()

  if (insertError) {
    console.error('❌ Failed to insert prompts:', insertError.message)
    console.log('\n⚠️  MANUAL STEP REQUIRED:')
    console.log('Please run: supabase/migrations/00049_seed_ai_prompts.sql')
    console.log('Via: https://supabase.com/dashboard/project/esplzaunxkehuankkwbx/sql\n')
  } else {
    console.log(`✅ Inserted ${insertedPrompts.length} prompts successfully\n`)
    console.log('Note: This is a partial insert. Full 10 prompts require running the migration file.\n')
  }
}

console.log('=== MIGRATION STATUS ===\n')
console.log('For full migration execution, please run the SQL files via Supabase Dashboard:')
console.log('1. supabase/migrations/00048_create_conversations_table.sql')
console.log('2. supabase/migrations/00049_seed_ai_prompts.sql\n')
