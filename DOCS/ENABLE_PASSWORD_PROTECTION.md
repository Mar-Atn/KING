# Enable Leaked Password Protection

**Status**: ⚠️ **ACTION REQUIRED** - Manual Configuration Needed
**Priority**: High (Security Feature)
**Last Checked**: 2025-10-28

---

## Overview

Supabase Security Advisor has flagged that **leaked password protection is not enabled** for this project. This feature protects users from using compromised passwords that have appeared in data breaches.

---

## What is Leaked Password Protection?

This security feature checks user passwords against the [HaveIBeenPwned](https://haveibeenpwned.com/) database during:
- User registration
- Password changes
- Password resets

If a password has been found in known data breaches, the system will:
- Reject the password
- Show an error message to the user
- Require them to choose a different password

---

## How to Enable

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **The New King SIM**

### Step 2: Navigate to Auth Settings

1. In the left sidebar, click **Authentication**
2. Click **Policies** or **Settings** tab (depending on dashboard version)
3. Look for **Password Protection** or **Security** section

### Step 3: Enable the Feature

1. Find the toggle for **"Check passwords against HaveIBeenPwned database"**
2. Enable the toggle
3. Save changes

### Step 4: Verify

After enabling, test the feature:

```typescript
// Try to register with a known compromised password
const { error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'  // Known compromised password
});

// Should receive error:
// "Password has appeared in a data breach. Please choose a different password."
```

---

## Alternative: Supabase CLI (If Available)

If using Supabase CLI with local config:

```toml
# supabase/config.toml
[auth]
enable_leaked_password_protection = true
```

Then push config:
```bash
supabase db push
```

**Note**: This project uses cloud Supabase without local config, so dashboard configuration is required.

---

## Expected Behavior After Enabling

### During Registration
```typescript
// User tries to register with "password"
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Error response:
{
  "error": {
    "message": "Password has appeared in a data breach",
    "status": 422
  }
}
```

### User Experience
- Registration form shows clear error message
- User is prompted to choose a stronger, unique password
- No registration until password passes breach check

---

## Impact Assessment

### Security Improvement
- ✅ Prevents use of commonly compromised passwords
- ✅ Reduces risk of credential stuffing attacks
- ✅ Improves overall account security

### User Experience
- ⚠️ Some users may need to try multiple passwords
- ⚠️ Requires clear error messaging in UI
- ✅ Protects users from their own weak password choices

### Performance
- ✅ Minimal impact (async API call to HaveIBeenPwned)
- ✅ Only runs during registration/password change
- ✅ Does not affect login performance

---

## UI Implementation Recommendations

Update registration form error handling:

```typescript
// src/components/RegisterForm.tsx (example)
const handleRegister = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { ... }
  });

  if (error) {
    if (error.message.includes('data breach')) {
      // Show specific message for leaked password
      setError('This password has been found in a data breach and is not secure. Please choose a different password.');
    } else {
      setError(error.message);
    }
  }
};
```

---

## Verification Checklist

After enabling in dashboard:

- [ ] Feature toggle enabled in Supabase Dashboard
- [ ] Test registration with known compromised password (should fail)
- [ ] Test registration with strong unique password (should succeed)
- [ ] Update UI error messaging to handle breach detection
- [ ] Update user documentation about password requirements
- [ ] Mark this task as complete in Phase 1 checklist

---

## Related Documentation

- [Supabase Auth Security Guide](https://supabase.com/docs/guides/auth/auth-security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Status Tracking

**Current Status**: ⚠️ Not Enabled

**Action Owner**: Project Administrator with Supabase Dashboard access

**Estimated Time**: 5 minutes (dashboard configuration)

**Phase 1 Completion**: This is the final task before Phase 1 is complete

---

**After completing this task, update**:
1. Mark task as completed in todo list
2. Update this document status to ✅ Enabled
3. Verify Supabase Security Advisor shows 0 warnings
4. Proceed to Phase 2: Comprehensive Testing Infrastructure
