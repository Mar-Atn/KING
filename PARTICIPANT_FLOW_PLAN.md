# Participant Flow Implementation Plan

## Current State
- ✅ WaitingRoom page exists (needs updating)
- ✅ RoleReveal page exists with animation (needs updating)
- ✅ RoleBriefing page exists (needs updating)
- ❌ Participant Dashboard needs creation
- ❌ Flow integration needs completion

## Required Flow

### 1. Participant Logs In
**Current:** Dashboard shows facilitator view
**Needed:** Detect if user is participant, check for role assignment

```typescript
// In Dashboard.tsx - Add participant section
if (profile?.role === 'participant') {
  // Check if they have an assigned role
  const role = await getRoleForUser(user.id, anyActiveRun)

  if (role && user.status === 'registered') {
    // Redirect to waiting room
    navigate(`/waiting-room/${role.run_id}`)
  } else if (role && user.status === 'role_assigned') {
    // Redirect to role reveal
    navigate(`/role-reveal/${role.run_id}`)
  } else if (role && user.status === 'active') {
    // Show participant dashboard
    // This is the main participant view
  }
}
```

### 2. Waiting Room (/waiting-room/:runId)
**What it shows:**
- Welcome message with participant name
- Participant count (how many registered for this sim)
- "Waiting for facilitator..." status
- Real-time updates via Supabase subscription

**What happens:**
- Subscribe to user status changes
- When status becomes 'role_assigned' → navigate to /role-reveal/:runId

### 3. Role Reveal (/role-reveal/:runId)
**Current:** Has animation, but uses old event_code system
**Needed:** Update to use run_id

**Stages:**
1. Modal: "Are you ready to discover your role?"
2. Dark screen fade-in sequence:
   - Avatar appears
   - Name appears
   - Position appears
   - Clan badge appears
3. "View Your Briefing →" button

### 4. Role Briefing (/role-briefing/:runId)
**Current:** Shows character details, needs clan members list
**Needed:** Complete implementation

**Shows:**
- Character avatar, name, position, age
- Background story
- Traits & interests
- Clan information
- Key priorities
- **Clan members list** (who else is in your clan)
- "I'm Ready" button → navigate to participant dashboard

### 5. Participant Dashboard (/participant-dashboard/:runId) ⭐ NEW
**Main participant interface after role assignment**

**Sections:**

#### A. Header
- Avatar, name, position
- Clan badge

#### B. Main Content (Tabs or Sections)

**Tab 1: My Role**
- Full character description
- Background
- Traits
- Interests
- Key priorities

**Tab 2: My Clan**
- Clan about/description
- Clan key priorities
- Clan members list (names, positions)
- Other clans overview (names only)

**Tab 3: Process Overview**
- Simulation phases
- Current phase indicator
- What happens in each phase

**Tab 4: Printable Materials**
- Link to download/view printable brief (same as facilitator print view)

#### C. Sidebar/Footer Actions
- 🤖 **"Talk with Induction Advisor"** button (placeholder for AI)
- Current simulation status
- Phase timer (if active)

## Database Schema Notes

### Users Table
- `status` field values:
  - `registered` → just signed up
  - `role_assigned` → has been assigned a role
  - `active` → confirmed role, participating in sim
  - `completed` → simulation finished

### Roles Table
- `assigned_user_id` → links role to user
- `run_id` → which simulation
- `clan_id` → which clan

### Get Role for User
```sql
SELECT r.*, c.*
FROM roles r
LEFT JOIN clans c ON r.clan_id = c.clan_id
WHERE r.assigned_user_id = :userId
AND r.run_id = :runId
```

## Implementation Checklist

### Phase 1: Update Existing Pages
- [x] Review WaitingRoom.tsx
- [ ] Update WaitingRoom to use run_id instead of event_code
- [ ] Update RoleReveal to use run_id
- [ ] Update RoleBriefing to use run_id
- [ ] Add real-time subscription in WaitingRoom

### Phase 2: Create Participant Dashboard
- [ ] Create ParticipantDashboard.tsx
- [ ] Add role/character section
- [ ] Add clan information section
- [ ] Add clan members list
- [ ] Add other clans overview
- [ ] Add process overview section
- [ ] Add "Talk with Induction Advisor" button (placeholder)

### Phase 3: Update Dashboard Routing
- [ ] Add participant detection in main Dashboard
- [ ] Route participants to appropriate page based on status
- [ ] Add routes to App.tsx

### Phase 4: Testing
- [ ] Test full flow: Login → Waiting → Reveal → Briefing → Dashboard
- [ ] Test real-time updates when facilitator assigns role
- [ ] Test with multiple participants
- [ ] Test clan members visibility

## Routes to Add

```typescript
// In App.tsx
<Route path="/waiting-room/:runId" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
<Route path="/role-reveal/:runId" element={<ProtectedRoute><RoleReveal /></ProtectedRoute>} />
<Route path="/role-briefing/:runId" element={<ProtectedRoute><RoleBriefing /></ProtectedRoute>} />
<Route path="/participant-dashboard/:runId" element={<ProtectedRoute><ParticipantDashboard /></ProtectedRoute>} />
```

## Next Steps

1. Update WaitingRoom to use run_id
2. Update RoleReveal to use run_id
3. Update RoleBriefing to use run_id
4. Create ParticipantDashboard
5. Update main Dashboard for participant routing
6. Test end-to-end flow
