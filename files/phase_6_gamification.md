# Phase 6: Gamification & Leaderboard — Engagement Engine Deep Dive

> **Goal:** After reading this, you will be able to explain every function that makes CareerCraft-AI addictive — how XP is awarded, how daily streaks are tracked using date math, how milestone bonuses fire, how the leaderboard rank is calculated, and how all of this is surfaced in the React frontend. Not theory — actual code from this project.

---

## The Big Picture: All Functions & Files In This Phase

Before diving into any code, understand exactly what we are studying and where each piece lives.

### Functions We Will Study (in order):

| # | Function Name | File | What It Does |
|---|---|---|---|
| 1 | `XP_VALUES` (constant) | `gamificationService.js` | Single source of truth for all XP reward amounts |
| 2 | `awardXP()` | `gamificationService.js` | Adds XP to a user's total. Called from every other controller. |
| 3 | `updateStreak()` | `gamificationService.js` | Updates the daily streak using date math. Called after any activity. |
| 4 | `claimDailyLogin()` | `gamificationService.js` | Claims the daily +10 XP bonus. Has its own streak logic. |
| 5 | `awardDocumentChatXP()` | `gamificationService.js` | Awards +5 XP per chat message, but caps at 25/day. |
| 6 | `getUserRank()` | `gamificationService.js` | Counts how many users have more XP than you → rank = that count + 1 |
| 7 | `getLeaderboard()` | `gamificationController.js` | Fetches top 100 users sorted by XP. Public route, no auth. |
| 8 | `getGamificationStats()` | `gamificationController.js` | Fetches your personal XP, rank, streak, and daily claim status. |
| 9 | `claimDailyLoginBonus()` | `gamificationController.js` | Controller that calls `claimDailyLogin()` and formats the HTTP response. |

### Helper Functions (used internally by the above):

| Function | File | What It Does |
|---|---|---|
| `isSameDay(date1, date2)` | `gamificationService.js` | Returns `true` if two dates are the same calendar day |
| `isYesterday(date1, date2)` | `gamificationService.js` | Returns `true` if `date1` is exactly one day before `date2` |

### Routes (the HTTP endpoints):

| Method | Path | Auth? | Controller Called |
|---|---|---|---|
| `GET` | `/gamification/leaderboard` | ❌ Public | `getLeaderboard()` |
| `GET` | `/gamification/stats` | ✅ `verifyToken` | `getGamificationStats()` |
| `POST` | `/gamification/daily-login` | ✅ `verifyToken` | `claimDailyLoginBonus()` |

### Frontend Components:

| Component | File | What It Does |
|---|---|---|
| `GamificationCard` | `client/src/components/GamificationCard.jsx` | Dashboard sidebar widget: shows XP, streak, rank, daily claim button |
| `Leaderboard` | `client/src/pages/Leaderboard.jsx` | Full leaderboard page: top 3 podium + ranked table |

### Database Fields (on the User document):

| Field | Type | What It Tracks |
|---|---|---|
| `xp` | Number | Lifetime accumulated XP |
| `currentStreak` | Number | Days in the current active streak |
| `longestStreak` | Number | The user's all-time best streak |
| `lastActivityDate` | Date | Timestamp of the last activity (quiz, chat, upload…) |
| `lastLoginDate` | Date | Timestamp of the last daily login claim |
| `dailyLoginClaimed` | Boolean | Was the daily login bonus claimed today? |
| `dailyChatXP` | Number | XP earned via document chat today (resets daily, capped at 25) |

---

## Why Gamification Exists (The Product Reasoning)

A technically brilliant app that users open only once is a failure. Gamification solves **user retention** with three psychological mechanisms:

1. **Variable Reward (XP)**: Every action awards a different amount of XP. The variation triggers the same neurological loop as a slot machine — users complete "one more quiz" just to watch the number go up.
2. **Loss Aversion (Streaks)**: Once a user has a 15-day streak, the psychological cost of losing it is *more powerful* than the reward of building it. This creates a "must log in today" compulsion.
3. **Social Comparison (Leaderboard)**: Being at Rank #42, knowing Rank #41 has only 50 more XP, creates a specific and actionable competitive pull.

---

## Section 1: `XP_VALUES` — The Single Source of Truth

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

```javascript
export const XP_VALUES = {
    DAILY_LOGIN:              10,  // Claiming the daily login button
    UPLOAD_DOCUMENT:          25,  // Uploading a new PDF
    COMPLETE_QUIZ:            50,  // Finishing a quiz (score submitted)
    REVIEW_FLASHCARDS:        30,  // Generating a flashcard deck
    FINISH_INTERVIEW:         75,  // Completing a mock interview session
    DOCUMENT_CHAT:             5,  // Each document chat message sent
    DOCUMENT_CHAT_DAILY_CAP:  25  // Max XP earnable from chat per day (anti-farming)
};
```

This is exported so controllers across the entire codebase import it:

```javascript
// In aiController.js (quiz completion):
import { awardXP, XP_VALUES } from '../services/gamificationService.js';
await awardXP(req.user.id, XP_VALUES.COMPLETE_QUIZ, 'quiz_completion');
//                                   ↑ 50 XP

// In aiController.js (flashcard creation):
await awardXP(req.user.id, XP_VALUES.REVIEW_FLASHCARDS, 'flashcard_creation');
//                                   ↑ 30 XP
```

**Why export a constant object instead of hardcoding numbers?**
If the business team changes quiz XP from 50 to 75, you change it in **one place** — `XP_VALUES.COMPLETE_QUIZ`. Every controller that imports it automatically uses the new value. No hunting through 6 controller files to find the number 50.

**Streak Milestone Bonuses (defined inline, not in XP_VALUES):**
```javascript
const STREAK_BONUSES = {
    7:   50,   // 7-day streak  → +50 XP bonus
    30: 200,   // 30-day streak → +200 XP bonus
    100: 500   // 100-day streak → +500 XP bonus
};
```

---

## Section 2: `awardXP()` — The Core XP Writer

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

**When called:** After completing a quiz, generating flashcards, uploading a document, finishing an interview. It is the universal function that adds XP.

```javascript
export const awardXP = async (userId, amount, reason = 'activity') => {
    try {
        const user = await User.findById(userId);
        // ↑ Fresh read from MongoDB — not using req.userDoc from memory.
        //   This is important because if two concurrent requests both try to
        //   award XP (e.g., quiz completion + flashcard generation at the same time),
        //   reading from DB gives us the latest committed XP value.

        if (!user) throw new Error('User not found');

        let bonusXP = 0;
        user.xp += amount;
        // ↑ Direct field increment on the in-memory Mongoose document.

        await user.save();
        // ↑ Mongoose writes the entire User document back to MongoDB.

        console.log(`[Gamification] User ${userId} awarded ${amount} XP for ${reason}. Total: ${user.xp}`);

        return { xpAwarded: amount, totalXP: user.xp, bonusXP };

    } catch (error) {
        console.error('[Gamification] Error awarding XP:', error.message);
        throw error; // Re-thrown so calling controller can handle it
    }
};
```

**How it is called from controllers (non-blocking pattern):**
```javascript
// In aiController.js → createFlashcards():
let xpResult = null;
try {
    xpResult = await awardXP(req.user.id, XP_VALUES.REVIEW_FLASHCARDS, 'flashcard_creation');
    await updateStreak(req.user.id);
} catch (xpErr) {
    console.error('XP Award Error (non-blocking):', xpErr.message);
    // ↑ CRITICAL DESIGN DECISION:
    // If gamification DB write fails (momentary lock, replica lag),
    // the user STILL gets their flashcards. A secondary engagement feature
    // must NEVER abort a primary product feature.
}
res.status(201).json({ ...newDeck.toObject(), xpAwarded: xpResult?.xpAwarded || 0 });
```

**Race Condition Warning (Senior Interview Topic):**

The current code does a **read-modify-write**:
```javascript
user.xp += amount; // read + modify in memory
await user.save(); // write back
```
If two requests hit simultaneously (quiz completes AND flashcard generated for same user), both could read `xp: 100`, both add their amounts, and the slower write wins — one XP award is silently lost.

**Production fix:**
```javascript
// Atomic operation — MongoDB reads and increments in a single step, no race condition
await User.findByIdAndUpdate(userId, { $inc: { xp: amount } });
```

---

## Section 3: The Two Date Helper Functions

These two private helper functions power the entire streak algorithm. They must be understood before reading `updateStreak()` or `claimDailyLogin()`.

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

### `isSameDay(date1, date2)`

```javascript
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth()    === d2.getMonth()    &&
           d1.getDate()     === d2.getDate();
};
```

**Why NOT compare milliseconds (`d1.getTime() === d2.getTime()`)?**

Because 11:59 PM Jan 1 and 12:01 AM Jan 2 are only 2 minutes apart in milliseconds, but they are **different calendar days**. Comparing year + month + day integers is the only safe way to check "is this the same day?".

```
Date 1: Jan 1 at 11:59 PM  →  getDate() = 1
Date 2: Jan 2 at 12:01 AM  →  getDate() = 2
Result: 1 !== 2  →  NOT the same day ✅ Correct
```

### `isYesterday(date1, date2)`

```javascript
const isYesterday = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Strip time component from both dates (set to midnight)
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    // ↑ Without this: Jan 1 at 11:59 PM vs Jan 2 at 12:01 AM
    //   diffTime = 2 minutes = 0.0014 days → diffDays !== 1 → WRONG result
    // With this: Jan 1 at midnight vs Jan 2 at midnight
    //   diffTime = 86,400,000 ms → diffDays = exactly 1.0 → CORRECT ✅

    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays === 1;
};
```

---

## Section 4: `updateStreak()` — The Streak Algorithm

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

**When called:** After any meaningful activity — quiz, flashcard, document chat, document upload. It determines whether the activity continues, starts, or resets the streak.

```javascript
export const updateStreak = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const now = new Date();
        let streakBonusAwarded = 0;

        // STEP 1: Reset dailyChatXP if today is a new calendar day
        if (!isSameDay(user.lastActivityDate, now)) {
            user.dailyChatXP = 0;
        }

        // STEP 2: Idempotency guard — if already had activity TODAY, do nothing
        if (isSameDay(user.lastActivityDate, now)) {
            return {
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                streakBonusAwarded: 0
            };
            // ↑ If user takes 10 quizzes in one day, streak still only increments ONCE.
            //   This prevents inflation and is the correct behavior.
        }

        // STEP 3: Determine the streak state based on when they last had activity
        if (isYesterday(user.lastActivityDate, now)) {
            user.currentStreak += 1;
            // ↑ Last activity was yesterday → streak CONTINUES, increment it

        } else if (!user.lastActivityDate) {
            user.currentStreak = 1;
            // ↑ Very first activity ever → start streak at 1

        } else {
            user.currentStreak = 1;
            // ↑ Last activity was 2+ days ago → streak BROKEN, reset to 1
            //   (not 0 — the current action itself counts as Day 1 of a new streak)
        }

        // STEP 4: Track the user's lifetime best streak
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        // STEP 5: Check if this streak number earns a milestone bonus
        const STREAK_BONUSES = { 7: 50, 30: 200, 100: 500 };
        if (STREAK_BONUSES[user.currentStreak]) {
            const bonus = STREAK_BONUSES[user.currentStreak];
            user.xp += bonus;
            streakBonusAwarded = bonus;
        }

        // STEP 6: Stamp the activity date and save to MongoDB
        user.lastActivityDate = now;
        await user.save();

        return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, streakBonusAwarded };

    } catch (error) {
        console.error('[Gamification] Error updating streak:', error.message);
        throw error;
    }
};
```

**Decision Tree (What happens when `updateStreak()` is called):**

```
updateStreak(userId) called after any activity
                │
                ▼
  isSameDay(lastActivityDate, now)?
     YES → Return current streak unchanged. (Idempotent. Done.) ✅
     NO  → Continue below
                │
                ▼
  isYesterday(lastActivityDate, now)?
     YES → currentStreak += 1            (Streak continues ✅)
     NO  → Was lastActivityDate null?
             YES → currentStreak = 1     (Brand new user, day 1 ✅)
             NO  → currentStreak = 1     (Streak broken 💔, restart from 1)
                │
                ▼
  currentStreak in STREAK_BONUSES { 7:50, 30:200, 100:500 }?
     YES → user.xp += bonus
     NO  → No bonus
                │
                ▼
  user.lastActivityDate = now
  await user.save()
```

---

## Section 5: `claimDailyLogin()` — The Daily Retention Hook

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

**When called:** User clicks the "Claim Daily Login (+10 XP)" button on the dashboard. This is the **explicit daily hook** — the user must manually click it. Unlike `updateStreak()` which fires automatically, this is intentional and user-initiated.

**Key difference from `updateStreak()`:** Uses `lastLoginDate` (not `lastActivityDate`) and checks `dailyLoginClaimed` flag to prevent double-claiming.

```javascript
export const claimDailyLogin = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const now = new Date();

        // GUARD 1: Already claimed today? Return early without double-awarding XP
        if (user.lastLoginDate && isSameDay(user.lastLoginDate, now) && user.dailyLoginClaimed) {
            return { success: false, xpAwarded: 0, alreadyClaimed: true };
        }

        // GUARD 2: New day → reset the claim flag and daily chat XP counter
        if (!isSameDay(user.lastLoginDate, now)) {
            user.dailyLoginClaimed = false;
            user.dailyChatXP = 0;
        }

        // STREAK LOGIC (same algorithm as updateStreak but keyed on lastLoginDate)
        let streakBonusAwarded = 0;
        if (user.lastLoginDate && isYesterday(user.lastLoginDate, now)) {
            user.currentStreak += 1;               // Streak continues
        } else if (!user.lastLoginDate || !isSameDay(user.lastLoginDate, now)) {
            user.currentStreak = 1;                // First login ever OR missed a day → reset
        }

        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        // Check milestone bonuses
        const STREAK_BONUSES = { 7: 50, 30: 200, 100: 500 };
        if (STREAK_BONUSES[user.currentStreak]) {
            streakBonusAwarded = STREAK_BONUSES[user.currentStreak];
            user.xp += streakBonusAwarded;
        }

        // Claim the daily XP
        user.xp               += XP_VALUES.DAILY_LOGIN;  // +10 XP
        user.dailyLoginClaimed  = true;                   // Mark as claimed
        user.lastLoginDate      = now;                    // Stamp today's date
        user.lastActivityDate   = now;                    // Also counts as activity
        await user.save();

        return {
            success: true,
            xpAwarded: XP_VALUES.DAILY_LOGIN + streakBonusAwarded,
            // e.g., on day 7: 10 + 50 = 60 XP total
            alreadyClaimed: false,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            streakBonusAwarded
        };

    } catch (error) {
        console.error('[Gamification] Error claiming daily login:', error.message);
        throw error;
    }
};
```

**Interview Edge Case:** "What if user claims at 11:59 PM and tries again at 12:01 AM?"
- At 12:01 AM: `isSameDay(lastLoginDate, now)` = **false** (new calendar day)
- `dailyLoginClaimed` is reset to `false`
- `isYesterday(lastLoginDate, now)` = **true** (11:59 PM yesterday IS yesterday relative to 12:01 AM today)
- Result: Streak increments, daily XP is claimed again ✅ Correct behavior.

---

## Section 6: `awardDocumentChatXP()` — The Anti-Farming Cap

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

**When called:** Every time a user sends a message in Document Chat. Without a cap, a user could spam messages to farm unlimited XP at +5 per message.

```javascript
export const awardDocumentChatXP = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const now = new Date();

        // Reset daily chat XP counter if it's a new calendar day
        if (!isSameDay(user.lastActivityDate, now) && !isSameDay(user.lastLoginDate, now)) {
            user.dailyChatXP = 0;
        }

        // Already at the 25 XP daily cap? Award nothing, return capped = true
        if (user.dailyChatXP >= XP_VALUES.DOCUMENT_CHAT_DAILY_CAP) {
            return { xpAwarded: 0, capped: true };
        }

        // Award up to 5 XP, but clamp to remaining daily allowance
        const xpToAward = Math.min(
            XP_VALUES.DOCUMENT_CHAT,                               // 5 XP requested
            XP_VALUES.DOCUMENT_CHAT_DAILY_CAP - user.dailyChatXP  // Remaining headroom
        );
        // Example: dailyChatXP = 23 → Math.min(5, 25-23) = Math.min(5, 2) = 2 XP

        user.xp          += xpToAward;
        user.dailyChatXP += xpToAward;
        await user.save();

        return { xpAwarded: xpToAward, capped: user.dailyChatXP >= XP_VALUES.DOCUMENT_CHAT_DAILY_CAP };

    } catch (error) {
        console.error('[Gamification] Error awarding document chat XP:', error.message);
        throw error;
    }
};
```

**The Daily Cap Visualized:**
```
Chat message 1:  dailyChatXP = 0  → +5 XP  → dailyChatXP = 5
Chat message 2:  dailyChatXP = 5  → +5 XP  → dailyChatXP = 10
Chat message 3:  dailyChatXP = 10 → +5 XP  → dailyChatXP = 15
Chat message 4:  dailyChatXP = 15 → +5 XP  → dailyChatXP = 20
Chat message 5:  dailyChatXP = 20 → +5 XP  → dailyChatXP = 25  ← Cap hit
Chat message 6:  dailyChatXP = 25 → +0 XP  (capped: true)
Chat message 7+: dailyChatXP = 25 → +0 XP  (capped: true)
```

---

## Section 7: `getUserRank()` — The Leaderboard Position Calculator

**File:** [server/services/gamificationService.js](file:///e:/Projects/CareerCraft-AI/server/services/gamificationService.js)

**When called:** Inside `getGamificationStats()` controller to calculate the current user's leaderboard rank.

```javascript
export const getUserRank = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Count all users who have STRICTLY MORE XP than this user
        const usersAhead = await User.countDocuments({ xp: { $gt: user.xp } });
        // MongoDB $gt = "greater than"
        // If 41 users have more XP than you → your rank = 41 + 1 = #42

        return usersAhead + 1;

    } catch (error) {
        console.error('[Gamification] Error getting user rank:', error.message);
        throw error;
    }
};
```

**Why `countDocuments({ xp: { $gt: user.xp } })` instead of fetching all users and computing rank in JavaScript?**

```
Option A (current — efficient):
  MongoDB counts all users with higher XP internally.
  Returns: a single integer (e.g., 41)
  Cost: O(log n) with a B-Tree index on xp field
  Network transfer: 1 number

Option B (wrong approach):
  fetch ALL 10,000 user documents → sort in Node.js → find position
  Cost: O(n) memory + bandwidth
  Network transfer: 10,000 full user documents
  At scale: catastrophically slow
```

---

## Section 8: The Controllers

**File:** [server/controllers/gamificationController.js](file:///e:/Projects/CareerCraft-AI/server/controllers/gamificationController.js)

Controllers are the glue between HTTP routes and service functions. They:
1. Receive `req` (request) and `res` (response)
2. Call service functions to do the real work
3. Format and send the HTTP response

### `getLeaderboard()` — Fetch Top 100 Users

```javascript
export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find({})
            .select('username avatar xp currentStreak longestStreak')
            // ↑ Security: excludes password, email, OTP tokens, subscription IDs
            // ↑ Performance: only fetches 5 fields instead of the full 15-field document
            .sort({ xp: -1 })
            // ↑ -1 = descending (highest XP first). 1 = ascending.
            .limit(100);
            // ↑ Hard cap. Without this, every user in the database would be fetched.

        // Attach rank number based on sorted array position
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            rank: index + 1,  // index is 0-based, rank is 1-based
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            xp: user.xp,
            currentStreak: user.currentStreak
        }));

        res.json(rankedLeaderboard);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

### `getGamificationStats()` — Fetch Current User's Personal Stats

```javascript
export const getGamificationStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('xp currentStreak longestStreak lastActivityDate lastLoginDate dailyLoginClaimed');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const rank = await getUserRank(req.user.id);
        const totalUsers = await User.countDocuments({});
        // ↑ For display: "Rank #42 of 1,200 users"

        // Recompute whether daily login was genuinely claimed TODAY.
        // Why? If user claimed yesterday, dailyLoginClaimed is still `true` in DB.
        // On next day's page load, we must verify the date, not just trust the boolean.
        const now = new Date();
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        const isClaimedToday = lastLogin &&
            lastLogin.getFullYear() === now.getFullYear() &&
            lastLogin.getMonth()    === now.getMonth()    &&
            lastLogin.getDate()     === now.getDate()     &&
            user.dailyLoginClaimed;

        res.json({
            xp: user.xp,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastActivityDate: user.lastActivityDate,
            dailyLoginClaimed: isClaimedToday,
            rank,
            totalUsers,
            xpValues: XP_VALUES
            // ↑ Sent to frontend so UI hints ("Quiz +50") never hardcode numbers.
            //   If product team changes quiz XP, the UI updates automatically.
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

### `claimDailyLoginBonus()` — Handle the Daily Claim HTTP Request

```javascript
export const claimDailyLoginBonus = async (req, res) => {
    try {
        const result = await claimDailyLogin(req.user.id);
        // ↑ Calls the service function — all real logic is there.

        if (result.alreadyClaimed) {
            return res.status(200).json({
                success: false,
                message: 'Daily login already claimed today',
                xpAwarded: 0
            });
            // ↑ Why 200, not 409 Conflict?
            // 409 would make Axios throw an error → frontend catches it as an error state.
            // But "already claimed" is a NORMAL expected condition (happens every day after first claim).
            // It is not an error. So 200 OK with success: false is the correct response.
        }

        res.json({
            success: true,
            message: `You earned +${result.xpAwarded} XP for logging in today!`,
            xpAwarded: result.xpAwarded
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

---

## Section 9: Routes & HTTP Methods

**File:** [server/routes/gamificationRoutes.js](file:///e:/Projects/CareerCraft-AI/server/routes/gamificationRoutes.js)

```javascript
import express from 'express';
import { getLeaderboard, getGamificationStats, claimDailyLoginBonus } from '../controllers/gamificationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get( '/leaderboard',  getLeaderboard);                    // Route 1 — Public
router.get( '/stats',        verifyToken, getGamificationStats); // Route 2 — Private
router.post('/daily-login',  verifyToken, claimDailyLoginBonus); // Route 3 — Private

export default router;
```

Mounted in `server/index.js` as `app.use('/gamification', gamificationRoutes)`.

---

### Route 1: `GET /gamification/leaderboard` — Public

| Property | Value |
|---|---|
| HTTP Method | `GET` |
| Auth Required | ❌ No (`verifyToken` intentionally absent) |
| Safe | ✅ Yes — reads only, never modifies DB |
| Idempotent | ✅ Yes — same response every time |
| Request Body | None |
| Response | Array of 100 users with rank, username, xp, streak |

**Why public with no auth?**
- **Marketing tool:** Unauthenticated visitors see an active leaderboard → social proof → converts to signups
- **No sensitive data:** `.select()` excludes `password`, `email`, `resetPasswordToken`, `subscription` data

**Middleware chain:**
```
GET /gamification/leaderboard
    → [Global] cors() → helmet() → morgan()
    → getLeaderboard()
        → User.find({}).select('username avatar xp currentStreak').sort({xp:-1}).limit(100)
        → res.json(rankedLeaderboard)   HTTP 200
```

---

### Route 2: `GET /gamification/stats` — Private

| Property | Value |
|---|---|
| HTTP Method | `GET` |
| Auth Required | ✅ Yes — `verifyToken` middleware |
| Safe | ✅ Yes — reads only |
| Idempotent | ✅ Yes |
| Request Body | None (user identity comes from JWT) |
| Response | `{ xp, rank, currentStreak, longestStreak, dailyLoginClaimed, xpValues }` |

**Why `verifyToken` here?** This route returns *your* personal stats. Without auth, there is no `req.user.id` and `User.findById(undefined)` would crash or return null.

**Middleware chain:**
```
GET /gamification/stats
    Headers: { Authorization: "Bearer <JWT>" }
    → [Global] cors() → helmet() → morgan()
    → verifyToken()
        → jwt.verify(token, JWT_SECRET)
        → req.user = { id: "64abc...", username: "arpit" }
        → next()
    → getGamificationStats()
        → User.findById(req.user.id).select(...)
        → getUserRank()    → User.countDocuments({ xp: { $gt: user.xp } }) + 1
        → User.countDocuments({}) → totalUsers
        → Recompute dailyLoginClaimed from date (not just boolean flag)
        → res.json({ xp, rank, streak, dailyLoginClaimed, xpValues })   HTTP 200
```

---

### Route 3: `POST /gamification/daily-login` — Private

| Property | Value |
|---|---|
| HTTP Method | `POST` |
| Auth Required | ✅ Yes — `verifyToken` middleware |
| Safe | ❌ No — modifies `xp`, `currentStreak`, `dailyLoginClaimed`, `lastLoginDate` |
| Idempotent | ❌ No — first call gives XP, second call returns `alreadyClaimed: true` |
| Request Body | Empty `{}` (user identity comes from JWT, no extra data needed) |
| Response | `{ success: true/false, xpAwarded: 10 + bonus }` |

**Why `POST` and not `GET`?**
- `GET` is "safe" by HTTP spec — browsers, CDNs, and proxies may **cache or prefetch** it
- Claiming XP **writes** to the database — that is a state change, which demands `POST`
- If you used `GET /gamification/claim-daily-xp`, a browser might prefetch it automatically and claim XP without the user clicking anything

**Middleware chain:**
```
POST /gamification/daily-login
    Headers: { Authorization: "Bearer <JWT>", Content-Type: "application/json" }
    Body: {}
    → [Global] express.json() → cors() → helmet() → morgan()
    → verifyToken()
        → req.user = { id: "64abc..." }
        → next()
    → claimDailyLoginBonus()
        → claimDailyLogin(req.user.id)     [gamificationService]
            → isSameDay(lastLoginDate, now)?    → alreadyClaimed guard
            → isYesterday(lastLoginDate, now)?  → streak logic
            → STREAK_BONUSES check              → bonus XP
            → user.xp += 10
            → user.dailyLoginClaimed = true
            → user.lastLoginDate = now
            → await user.save()
        → alreadyClaimed? → res.json({ success: false }) HTTP 200
        → success?        → res.json({ success: true, xpAwarded }) HTTP 200
```

---

## Section 10: Frontend Components

### `GamificationCard.jsx` — Dashboard Sidebar Widget

**File:** [client/src/components/GamificationCard.jsx](file:///e:/Projects/CareerCraft-AI/client/src/components/GamificationCard.jsx)

On mount, fetches gamification stats and renders:
- Total XP (large number, `toLocaleString()` for commas)
- Rank #X of Y users
- Current streak (flame icon) and Longest streak (trophy icon)
- Conditional "Claim Daily Login (+10 XP)" button
- XP hint badges using `xpValues` from the server response

```javascript
// On component mount:
useEffect(() => { fetchStats(); }, []);

const fetchStats = async () => {
    const res = await api.get('/gamification/stats');
    setStats(res.data);
    setDailyLoginClaimed(res.data.dailyLoginClaimed);
};

// Daily login button handler:
const claimDailyLogin = async () => {
    if (claimingLogin || dailyLoginClaimed) return;
    // ↑ Frontend guard: prevents duplicate requests without relying on server alone

    const res = await api.post('/gamification/daily-login');
    if (res.data.success) {
        setDailyLoginClaimed(true); // Immediately flip UI
        fetchStats();               // Re-fetch to update XP number display
    }
};
```

---

### `Leaderboard.jsx` — Full Leaderboard Page

**File:** [client/src/pages/Leaderboard.jsx](file:///e:/Projects/CareerCraft-AI/client/src/pages/Leaderboard.jsx)

On mount, fires **both** API calls simultaneously with `Promise.all`:

```javascript
const fetchData = async () => {
    const [leaderboardRes, statsRes] = await Promise.all([
        api.get('/gamification/leaderboard'), // Public — top 100
        api.get('/gamification/stats')         // Private — your rank
    ]);
    // ↑ Promise.all fires BOTH requests at the same time.
    //   Sequential: ~200ms + ~200ms = ~400ms
    //   Parallel:   max(~200ms, ~200ms) = ~200ms   (2× faster page load)

    setLeaderboard(leaderboardRes.data);
    setUserStats(statsRes.data);
};
```

Detects if current user is in top 100:
```javascript
const userInLeaderboard = leaderboard.some(u => u._id === user?._id);
// If NOT in top 100, renders a pinned "Your Rank" card at the bottom
// using rank from userStats (calculated via countDocuments on the server)
```

---

## Section 11: The User Model — All Gamification Fields

**File:** [server/models/User.js](file:///e:/Projects/CareerCraft-AI/server/models/User.js)

Every user document in MongoDB has these gamification fields embedded directly:

```javascript
// Gamification fields — embedded in the User document (no separate collection)
xp:                { type: Number,  default: 0     },
currentStreak:     { type: Number,  default: 0     },
longestStreak:     { type: Number,  default: 0     },
lastActivityDate:  { type: Date,    default: null  }, // Any activity (quiz, chat, upload)
lastLoginDate:     { type: Date,    default: null  }, // Daily login claim specifically
dailyLoginClaimed: { type: Boolean, default: false }, // Was daily login claimed today?
dailyChatXP:       { type: Number,  default: 0     }, // Resets daily, capped at 25
```

**Why embedded in User instead of a separate `UserGamification` collection?**
Gamification data (xp, streak) is read on almost every page load. If it were in a separate collection, every request would require a JOIN (two DB queries). Embedding it means one query for the user gives everything.

---

## Full Feature Flow Skeleton

### Flow 1: User Completes a Quiz → XP Awarded → Streak Updated
```
User clicks "Submit Quiz"
    ──► PUT /ai/quiz/:id/score  { score: 4 }
    ──► verifyToken() → req.user = { id: "..." }
    ──► updateQuizScore() controller
            │
            ├── Quiz.findById(id)
            ├── quiz.score = 4
            ├── await quiz.save()
            ├── QuizResult.create({ user, score: 4, totalQuestions: 5, percentage: 80 })
            │       (snapshot for dashboard performance graph)
            │
            ├── [Non-blocking try-catch]
            │       awardXP(userId, 50, 'quiz_completion')
            │           → user.xp += 50 → user.save()
            │       updateStreak(userId)
            │           → isSameDay? → no change
            │           → isYesterday? → currentStreak++
            │           → STREAK_BONUSES[streak]? → xp += bonus
            │           → user.lastActivityDate = now → user.save()
            │
            └── res.json({ quiz, xpAwarded: 50 })
```

### Flow 2: User Claims Daily Login → Streak Check → Milestone Bonus
```
User clicks "Claim Daily Login (+10 XP)"
    ──► POST /gamification/daily-login  Body: {}
    ──► verifyToken() → req.user = { id: "..." }
    ──► claimDailyLoginBonus() controller
            │
            └── claimDailyLogin(userId) service
                    │
                    ├── User.findById(userId)
                    ├── isSameDay(lastLoginDate, now) && dailyLoginClaimed?
                    │       YES → return { success: false, alreadyClaimed: true }
                    │
                    ├── !isSameDay(lastLoginDate, now)?
                    │       YES → reset dailyLoginClaimed = false, dailyChatXP = 0
                    │
                    ├── isYesterday(lastLoginDate, now)?
                    │       YES → currentStreak++
                    │       NO  → currentStreak = 1 (streak broken or first time)
                    │
                    ├── STREAK_BONUSES[currentStreak]?
                    │       YES → user.xp += bonus (e.g., 50 on day 7)
                    │
                    ├── user.xp += 10 (DAILY_LOGIN)
                    ├── user.dailyLoginClaimed = true
                    ├── user.lastLoginDate = now
                    ├── await user.save()
                    │
                    └── return { success: true, xpAwarded: 60 }
                              (10 base + 50 milestone on day 7)
    ──► res.json({ success: true, xpAwarded: 60 })
    ──► Frontend: setDailyLoginClaimed(true) → fetchStats() (re-renders XP number)
```

### Flow 3: User Visits Leaderboard Page
```
User navigates to /leaderboard
    ──► Promise.all([
            GET /gamification/leaderboard  (no auth header needed)
            GET /gamification/stats        (sends Authorization: Bearer <JWT>)
        ])

    GET /gamification/leaderboard:
    ──► getLeaderboard() controller
            → User.find({})
                .select('username avatar xp currentStreak')
                .sort({ xp: -1 })
                .limit(100)
            → leaderboard.map((u, i) => ({ rank: i+1, ...u }))
            → res.json(rankedLeaderboard)

    GET /gamification/stats:
    ──► verifyToken() → req.user = { id: "..." }
    ──► getGamificationStats() controller
            → User.findById(req.user.id)
            → getUserRank()
                → User.countDocuments({ xp: { $gt: user.xp } }) + 1
            → User.countDocuments({})   → totalUsers
            → Recompute dailyLoginClaimed from date cross-check
            → res.json({ xp, rank, currentStreak, totalUsers, xpValues })

    Frontend renders:
    ──► Top 3 users as raised Podium (1st/2nd/3rd)
    ──► Users 4-100 as ranked table rows
    ──► userInLeaderboard? No → Pinned "Your Rank" card shown separately
```

### Flow 4: User Sends Document Chat Messages → Cap Enforced
```
User sends message 1 in Document Chat
    ──► POST /ai/chat  { documentId, message }
    ──► verifyToken()
    ──► chatWithDocument() controller
            ├── [RAG/Legacy mode — return AI answer]
            └── [Non-blocking] awardDocumentChatXP(userId)
                    → user.dailyChatXP = 0 (if new day)
                    → user.dailyChatXP < 25? → xpToAward = Math.min(5, 25-0) = 5
                    → user.xp += 5, user.dailyChatXP = 5
                    → await user.save()
                    → return { xpAwarded: 5, capped: false }

User sends messages 2-5 (same day):
    → xpToAward = 5 each time, dailyChatXP accumulates: 10 → 15 → 20 → 25

User sends message 6 (same day):
    → user.dailyChatXP = 25 >= 25 (cap hit!)
    → return { xpAwarded: 0, capped: true }
    → AI still answers the question, just no XP earned
```

---

## Interview Q&A

**Q1: Why use `countDocuments({ xp: { $gt: user.xp } })` for rank instead of JavaScript sorting?**
> This query executes inside MongoDB using a B-Tree index on `xp`. It returns one integer. Fetching all 10,000 user documents and sorting in Node.js would be O(n) in both memory and bandwidth. The MongoDB query is O(log n) with the index. At scale, the difference is milliseconds vs. several seconds.

**Q2: What is the race condition in `awardXP` and how would you fix it?**
> Current: `user.xp += amount; await user.save()` — a read-modify-write. Two simultaneous requests (quiz + flashcard) could both read `xp: 100`, both add their amounts independently, and the slower write wins, losing one XP award. Fix: `User.findByIdAndUpdate(userId, { $inc: { xp: amount } })`. MongoDB's `$inc` is atomic — reads and increments in one DB operation with no race condition.

**Q3: Why is daily login `POST` and not `GET`?**
> HTTP `GET` is "safe" — browsers, CDNs, and proxies may cache or prefetch it. Claiming daily XP **modifies** `user.xp`, `user.dailyLoginClaimed`, and `user.lastLoginDate`. That is a write operation. Using `GET` for a write violates REST principles and could cause the claim to be auto-triggered by browser prefetching.

**Q4: Why return HTTP 200 for "already claimed" instead of 409 Conflict?**
> A 409 status code makes Axios throw an error, forcing the frontend into error-state handling. "Already claimed" is a **normal, expected condition** (happens every day after the first claim). It is not an error. Returning `200 OK` with `{ success: false }` lets the frontend distinguish "claim successful" from "already done" without treating it as a crash.

**Q5: How does the streak algorithm handle the same-day idempotency case?**
> `updateStreak()` checks `isSameDay(lastActivityDate, now)` first. If true, it returns the current streak unchanged. This means if a user does 10 quizzes in one day, the streak counter only increments once. This is correct behavior and prevents streak inflation.
