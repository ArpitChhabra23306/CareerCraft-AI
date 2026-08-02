# Phase 2: System Architecture & Data Flow

> **Interview Pro-Tip:** Being able to trace a single request from the browser all the way to the database and back, without hesitating, is a senior-level skill. You should be able to draw this on a whiteboard.

---

## 1. The Big Picture — 3-Tier Architecture

CareerCraft-AI is a classic **3-Tier Application**. Every production web app follows this fundamental structure:

```
┌────────────────────────────────────────────────────────────────────┐
│  TIER 1: Presentation Layer (Client)                               │
│  React SPA running in the user's browser                          │
│  React Router, Axios, TailwindCSS, Framer Motion                  │
│  Deployed on: Vercel / Netlify                                     │
└────────────────────┬───────────────────────────────────────────────┘
                     │  HTTP Requests (Axios + JWT in headers)
                     │  Port 5000
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  TIER 2: Application Layer (Server)                                │
│  Express.js running on Node.js                                     │
│  Handles business logic, auth, AI orchestration, payments          │
│  Deployed on: Render / Railway                                     │
└────────────────────┬───────────────────────────────────────────────┘
                     │  Mongoose queries (TCP connection)
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  TIER 3: Data Layer (Database)                                     │
│  MongoDB Atlas (Cloud) + Cloudinary (File Storage)                 │
│  Stores users, documents, vectors, sessions, quiz results          │
└────────────────────────────────────────────────────────────────────┘
```

**Why 3 tiers?** Each tier can be scaled, deployed, and maintained independently. If the server crashes, the database keeps running. If the client is slow, you redeploy only the client.

---

## 2. Inside the Server — How index.js Boots Up

The file [server/index.js](file:///E:/Projects/CareerCraft-AI/server/index.js) is the **entry point** of the entire backend. When you run `node index.js`, it does these things in order:

```javascript
// 1. Load environment variables from .env FIRST (before anything uses them)
dotenv.config();

// 2. Create the Express app instance
const app = express();

// 3. Register global middleware (runs on EVERY request)
app.use(express.json());   // Parses JSON body so req.body works
app.use(cors());           // Allows the React client to talk to this server
app.use(helmet({...}));    // Adds security HTTP headers automatically
app.use(morgan('common')); // Logs every request to the terminal

// 4. Mount the 8 route groups
app.use('/auth', authRoutes);
app.use('/docs', documentRoutes);
app.use('/ai', aiRoutes);
app.use('/interview', interviewRoutes);
app.use('/quiz', quizRoutes);
app.use('/user', userRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/subscription', subscriptionRoutes);

// 5. Connect to MongoDB
connectMongoDB(process.env.MONGO_URI);

// 6. Start listening for requests
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
```

> **Interview Question:** "Why does `dotenv.config()` have to be called first?"
> Because if any module is imported and uses `process.env.SOME_KEY` at import time (not inside a function), and dotenv hasn't run yet, that key will be `undefined`. By calling `dotenv.config()` before anything else, we guarantee all environment variables are loaded into `process.env` before any code reads them.

---

## 3. Global Middleware — The 4 Guards on Every Request

Every single request that hits the server passes through these 4 middlewares in order, before it even reaches a route.

### 3.1 How Frontend Sends Data (`req.body`, `req.params`, `req.query`)
Before we understand the body parser, you must know the **3 main ways** the frontend sends data to the Express backend:

1.  **`req.body` (The Request Body):**
    *   **When used:** Sending large, structured, or sensitive data (JSON objects, passwords) in `POST`, `PUT`, or `PATCH` requests.
    *   **Frontend sends:** `axios.post('/auth/login', { email: 'john@a.com', password: '123' })`
    *   **Backend receives:** `const { email, password } = req.body;`
2.  **`req.params` (URL/Route Parameters):**
    *   **When used:** Targeting a specific resource by ID directly in the path.
    *   **Frontend sends:** `axios.put('/quiz/64abc123/score', { score: 80 })`
    *   **Backend matches:** `router.put('/quiz/:id/score', ...)`
    *   **Backend receives:** `const quizId = req.params.id;` (Gets "64abc123")
3.  **`req.query` (Query Parameters):**
    *   **When used:** Sorting, filtering, searching, or pagination at the end of a URL after `?`.
    *   **Frontend sends:** `axios.get('/docs?plan=free&limit=10')`
    *   **Backend receives:** `const plan = req.query.plan;` (Gets "free")

### 3.1.5 `express.json()` — The Body Parser Middleware
*   **The Problem with `req.body`:** HTTP transmits the JSON body as a raw, unformatted text stream over the network. Express, by default, does not know how to read or format this text stream.
*   **What `express.json()` does:** It is a built-in middleware that intercepts incoming requests, reads the raw text stream, verifies the `Content-Type` is `application/json`, parses the text into a native JS object, and attaches it as **`req.body`**.
*   **Without it:** If you do not write `app.use(express.json())`, then `req.body` is `undefined`. Your server will crash when trying to read `req.body.email`.

---

### 3.2 `cors()` — The Cross-Origin Resource Sharing Guard
*   **The Same-Origin Policy (SOP):** Browsers enforce a critical security rule: a script running on Domain A (`http://localhost:5173`) cannot request data from Domain B (`http://localhost:5000`) unless Domain B explicitly gives permission. If they try, the browser blocks the response, throwing a "CORS error" in the console.
*   **What `cors()` does:** It is an Express middleware that automatically appends the necessary CORS response headers to every outgoing response, signaling to the browser that cross-origin communication is permitted.
*   **CORS Variations & Configurations:**
    1.  **Wildcard CORS (Allow Everything):**
        ```javascript
        app.use(cors()); // Default configuration
        // Sets header: Access-Control-Allow-Origin: *
        // Good for public APIs, but insecure for private applications with cookies/credentials.
        ```
    2.  **Restricted Origin CORS (Production Pattern):**
        ```javascript
        app.use(cors({
            origin: 'https://careercraftai.com' // Only allow requests from our frontend domain
        }));
        ```
    3.  **Dynamic Origin Whitelisting:**
        ```javascript
        const whitelist = ['http://localhost:5173', 'https://careercraftai.com'];
        app.use(cors({
            origin: function (origin, callback) {
                if (!origin || whitelist.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Blocked by CORS'));
                }
            }
        }));
        ```
    4.  **CORS with Credentials (Cookies/Auth Headers):**
        ```javascript
        app.use(cors({
            origin: 'http://localhost:5173',
            credentials: true, // Allows clients to send cookies, authorization headers, TLS client certificates
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        ```

---

### 3.3 `helmet()` — The Security Headers Shield
*   **What it does:** Web security relies heavily on telling the browser how it should behave. `helmet()` acts as an umbrella middleware that configures 15 individual HTTP headers to harden your Express server against common attacks (like Clickjacking, XSS, and Sniffing).
*   **Key Headers set by Helmet:**
    1.  **`X-Content-Type-Options: nosniff`**: Tells browsers to strictly respect the `Content-Type` header sent by the server. It stops browsers from "guessing" the MIME type of a file (e.g. running an uploaded `.txt` file as a `.js` script).
    2.  **`X-Frame-Options: SAMEORIGIN`**: Prevents your website from being embedded inside an `<iframe>` on another website, stopping **Clickjacking** attacks (where attackers trick users into clicking buttons they can't see).
    3.  **`Strict-Transport-Security (HSTS)`**: Forces the browser to connect to the server *only* via secure HTTPS, never raw HTTP.
    4.  **`X-XSS-Protection`**: Directs older browsers to stop loading pages when they detect reflected cross-site scripting (XSS) attacks.

*   **Our Configuration & Trade-offs:**
    ```javascript
    // server/index.js
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        xFrameOptions: false
    }));
    ```
    *   **`contentSecurityPolicy: false`**: We disabled Content Security Policy (CSP). If enabled, CSP dictates exactly which domains the browser can download assets (like fonts, images, scripts) from. Since this app downloads images and PDFs directly from Cloudinary CDNs (`res.cloudinary.com`), an unmodified default CSP would block those external URLs and break image/PDF loading.
    *   **`crossOriginEmbedderPolicy: false`**: Disabling COEP prevents the browser from blocking resources (like PDFs) that do not explicitly opt-in to cross-origin resource sharing, which is needed to load PDFs from various external CDN sources.

---

### 3.4 `morgan('common')` — The Request Logger
*   **What it does:** Prints a formatted log line to the console for every single HTTP request received.
*   **Why it matters:** It is your server's black box recorder. You can immediately see when a request arrived, what path it hit, its HTTP method (`GET`, `POST`), and whether it succeeded (`200`) or crashed (`500`).

---

## 4. The 8 Route Groups — The "Receptionist" Analogy

Every single API request the React frontend makes lands exactly at `server/index.js` first. Think of `index.js` as the **Receptionist** at the front desk of a massive corporate building. Everyone enters through the front door (Port 5000).

**How the Routing Works (The Hand-off):**
1.  **Frontend sends:** `POST http://localhost:5000/ai/chat`
2.  **Receptionist (`index.js`):** Looks at the URL, sees the `/ai` prefix. It says, *"I don't know how AI works, but I know all AI requests go to the `aiRoutes.js` department!"* It strips the `/ai` part and hands the rest (`/chat`) to that file.
3.  **Department (`aiRoutes.js`):** Receives the request. It looks at its internal list of routes and sees: `router.post('/chat', chatWithDocument);`
4.  **Action:** It executes the `chatWithDocument` controller function.

By doing this, `index.js` stays incredibly clean. It doesn't hold the code for 50 endpoints; it just acts as a traffic cop directing requests to the right files.

| URL Prefix | Router File | Responsibility |
| :--- | :--- | :--- |
| `/auth` | authRoutes.js | Registration, Login, OTP, Password Reset |
| `/docs` | documentRoutes.js | PDF Upload, Fetch, Delete |
| `/ai` | aiRoutes.js | Chat, Flashcards, Quiz, Embedding |
| `/interview` | interviewRoutes.js | Mock Interview Sessions |
| `/quiz` | quizRoutes.js | Quiz history fetching |
| `/user` | userRoutes.js | Get/Update user profile |
| `/gamification` | gamificationRoutes.js | XP, Streaks, Leaderboard |
| `/subscription` | subscriptionRoutes.js | Razorpay Payment, Plan Upgrade |

---

## 5. Route-Level Middleware — The Per-Feature Pipeline

Not all routes need the same guards. Some are public (login, register). Most need authentication. Some need usage quota checks too.

Routes compose middleware like a **pipeline** — each function either calls `next()` to pass to the next step, or returns a response to stop the request dead.

### Real Example — `/ai/chat` from the codebase:
```javascript
// from server/routes/aiRoutes.js
router.post('/chat', verifyToken, checkChatLimit, chatWithDocument);
//                   ──────────  ─────────────   ─────────────────
//                   Step 1:     Step 2:          Step 3:
//                   Is JWT      Have they hit     Run the actual
//                   valid?      their AI limit?   AI chat logic
```

- If **Step 1** fails → Request dies with `{ error: "Invalid Token" }`. Steps 2 and 3 never run.
- If **Step 2** fails → Request dies with `{ message: "Monthly AI chat limit reached" }`. Step 3 never runs.
- Only if all guards pass does the real controller (`chatWithDocument`) execute.

### The Full Middleware Pipeline for a Chat Request:
```
POST /ai/chat (Authorization: "Bearer eyJ...")
       │
       ▼
[Global] express.json()    → Body parsed into req.body ✅
[Global] cors()            → Origin check passed ✅
[Global] helmet()          → Security headers attached ✅
[Global] morgan()          → Request logged to terminal ✅
       │
Express matches prefix /ai → hands off to aiRoutes.js
       │
       ▼
[Route] verifyToken        → jwt.verify() decodes token
                           → req.user = { id, email }
                           → next() ✅
       │
       ▼
[Route] checkChatLimit     → User.findById(req.user.id)
                           → Checks usage vs plan limit
                           → next() ✅
       │
       ▼
[Controller] chatWithDocument() → Runs RAG logic, returns AI answer
```

---

## 6. How `verifyToken` Works Line by Line

```javascript
// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken'; // Cryptographic library to sign/verify tokens

export const verifyToken = (req, res, next) => {
    try {
        // 1. Read the Authorization header from the request
        let token = req.header('Authorization');

        // 2. If no header exists at all, deny access immediately
        if (!token) {
            return res.status(403).json({ message: 'Access Denied' });
        }

        // 3. Strip the "Bearer " prefix if present (leaves just the raw token)
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length).trimLeft();
        }

        // 4. Cryptographically verify the token using our secret key
        //    If valid, 'verified' = decoded payload: { id, email, iat, exp }
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach the decoded user info to the request for future middlewares/controllers
        req.user = verified;

        // 6. Pass control to the next step in the pipeline
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        res.status(401).json({ error: "Invalid Token" });
    }
};
```

### 🔍 Deep Dive Breakdown:
*   **`jwt.verify(token, secret)`**: This does a cryptographic verification. If a user tries to modify the data payload (e.g. change the user ID to steal someone else's account), the verification fails because the signature will not match our `JWT_SECRET`. It throws an error that drops straight to the `catch` block.
*   **`req.user = verified`**: Creates a temporary property on the shared request object. This is a very common Express pattern to pass user identity forward without database checks on every single middleware step.
*   **401 vs 403 HTTP Statuses:**
    *   **`401 Unauthorized`**: Sent in the `catch` block when verification fails. Means "I don't know who you are (fake/expired token)".
    *   **`403 Forbidden`**: Sent when the header is missing or in the quota check. Means "I know who you are, but you are not allowed to access this resource".

---

## 7. How `checkChatLimit` Works Line by Line

```javascript
// server/middleware/usageMiddleware.js
import User from '../models/User.js'; // Mongoose Database Model
import { PLANS } from '../controllers/subscriptionController.js'; // Limits config

// Helper: Fetches limits for a plan (defaults to 'free')
const getPlanLimits = (plan) => PLANS[plan]?.limits || PLANS.free.limits;

// Helper: Compares usage vs limit (returns true if exceeded; -1 is unlimited)
const isLimitExceeded = (current, limit) => limit !== -1 && current >= limit;

// Helper: Resets quota counts if calendar month has changed
const resetMonthlyUsageIfNeeded = async (user) => {
    const now = new Date();
    const resetDate = new Date(user.usage?.usageResetDate || now);

    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
        user.usage = {
            ...user.usage,
            aiChatQueries: 0,
            interviewsThisMonth: 0,
            usageResetDate: now
        };
        await user.save(); // Commits changes to MongoDB
        return true;
    }
    return false;
};

// Main middleware check
export const checkChatLimit = async (req, res, next) => {
    try {
        // 1. Fetch user document from database using ID attached by verifyToken
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 2. Perform calendar month reset check
        await resetMonthlyUsageIfNeeded(user);

        // 3. Extract user subscription plan
        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        const currentQueries = user.usage?.aiChatQueries || 0;

        // 4. Validate limit
        if (isLimitExceeded(currentQueries, limits.aiChatQueries)) {
            return res.status(403).json({
                message: 'Monthly AI chat limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.aiChatQueries,
                usage: currentQueries
            });
        }

        // 5. Attach document to req.userDoc to skip DB query in the controller
        req.userDoc = user;
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Chat limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
```

### 🔍 Deep Dive Breakdown:
*   **`User.findById(req.user.id)`**: Executes a Mongoose query to find the document in MongoDB. The ID string comes directly from `req.user.id` which was verified and attached by `verifyToken` in the step before this.
*   **`resetMonthlyUsageIfNeeded(user)`**: Checks if the current machine date has a different month/year than the `usageResetDate` stored on the user's MongoDB record. If so, it resets limits back to `0` and updates the database.
*   **`req.userDoc = user`**: This is a major optimization. The database query to fetch the user takes time and computing resources. Since we *already* did it to verify limits, we save the user document in the request object. The next controller in the route pipeline can write `const user = req.userDoc` and immediately use it without hitting the database a second time!

---

## 8. Controller-Service Separation (Single Responsibility Principle)

A core architectural pattern in this app is that business logic is split between **Controllers** and **Services**. This follows the **Single Responsibility Principle (SRP)**.

```
Request → Route → Middleware → Controller → Service → External API / DB
```

| Layer | Job | Example File |
| :--- | :--- | :--- |
| **Route** | Map a URL + HTTP method to a controller | `aiRoutes.js` |
| **Controller** | Orchestrate: validate inputs, call services, format response | `aiController.js` |
| **Service** | Pure functionality — talk to one external system | `openaiService.js` |

**Why this matters for interviews:**
- If OpenAI changes their API, you only edit `openaiService.js`. The controller doesn't change at all.
- If you want to swap OpenAI for another LLM, you write a new service file. The controller just imports a different service.
- Services can be tested in isolation without spinning up an entire Express server.
- Controllers can be tested by mocking the service.

---

## 9. Environment Variables — Why Secrets Must Never Touch the Client

The [server/.env](file:///E:/Projects/CareerCraft-AI/server/.env) file holds every secret the application needs:

```
MONGO_URI=mongodb+srv://...       # Database connection string
JWT_SECRET=ReplaceWithStrong...   # Used to sign/verify all JWTs
OPENAI_API_KEY=sk-proj-...        # If leaked, anyone can bill your account
CLOUDINARY_API_SECRET=...         # Can delete all uploaded files
RAZORPAY_KEY_SECRET=...           # Can create fake payment orders
BREVO_API_KEY=...                 # Can send unlimited emails as you
GROQ_API_KEY=gsk_...              # Can drain your Groq quota
JINA_API_KEY=jina_...             # Can drain your embedding quota
```

**The Golden Rule:** Every secret lives ONLY in `server/.env`. Never, ever in the React client.

**Why?** The entire React `bundle.js` is downloaded directly into the user's browser. Anyone can open Chrome DevTools → Sources → `bundle.js` → `Ctrl+F` → type `sk-proj` and find your OpenAI key in seconds.

**The Secure Flow:**
```
Client ──► POST /ai/chat (just sends text) ──► Server uses API key internally
                                                 ──► Calls OpenAI API
                                                 ──► Returns AI response to client
```
The raw API key never leaves the server. Only the processed result (the AI's answer) travels back to the client.

**`.gitignore` is critical:** The `.env` file is in `.gitignore`, which means Git will never commit it to the repository. If you accidentally push secrets to a public GitHub repo, automated bots scan new commits within seconds and will steal/sell your keys.

---

## 10. Health-Check Pattern — Keeping Free Servers Alive

```javascript
// server/index.js

// Health check endpoint for keep-alive pings
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
```

**Why this exists:**
- Free hosting platforms like Render's free tier **spin down** (sleep) your server after 15 minutes of inactivity.
- When the server is asleep, the first user request takes **30–90 seconds** to wake it up. It looks like the app is broken.
- **The fix:** An external service (UptimeRobot, cron job) pings `GET /health` every 14 minutes, 24/7. The server always receives a request before the 15-minute inactivity timeout, so it never sleeps.
- `process.uptime()` returns how many seconds the Node.js process has been running — useful for monitoring if the server crashed and restarted unexpectedly.

---

## 11. One-Time Migration Pattern

Notice this block inside `connectMongoDB()` in index.js:

```javascript
// One-time migration: mark existing users as verified
const result = await User.updateMany(
    { isVerified: { $exists: false } },  // Find users WITHOUT the isVerified field
    { $set: { isVerified: true } }        // Add it, set to true
);
```

**The story behind this:** When the `isVerified` email verification feature was added to the app after it had already launched, existing users in MongoDB didn't have the `isVerified` field at all. If the login logic checks `user.isVerified === true` to allow access, all existing users would get locked out.

**The pattern:** On every server boot, `updateMany` checks if any users are missing `isVerified`. If it finds them, it sets the field to `true`. On every subsequent boot after the migration completes, the filter `{ isVerified: { $exists: false } }` matches zero documents — the `updateMany` effectively becomes a no-op with zero cost.

This is a **self-healing, zero-downtime data migration** that runs safely on every startup.

---

## 12. Full End-to-End Request Journey (Concrete Example)

Let's trace a user asking a question about their uploaded PDF:

```
USER TYPES: "Explain recursion from my uploaded PDF"

──── STEP 1: REACT CLIENT ────────────────────────────────────────────
Axios reads JWT from localStorage
Sends: POST http://localhost:5000/ai/chat
Headers: { Authorization: "Bearer eyJhbGci..." }
Body:    { documentId: "64abc...", message: "Explain recursion" }

──── STEP 2: GLOBAL MIDDLEWARE ───────────────────────────────────────
express.json()   → req.body = { documentId: "64abc...", message: "..." } ✅
cors()           → Origin allowed ✅
helmet()         → Security headers added to response ✅
morgan()         → "POST /ai/chat" printed to terminal ✅
URL /ai matched  → Express passes to aiRoutes.js

──── STEP 3: ROUTE MIDDLEWARE ────────────────────────────────────────
verifyToken:
  → token = "eyJhbGci..."
  → jwt.verify(token, JWT_SECRET) → { id: "64abc", email: "user@..." }
  → req.user = { id: "64abc", email: "user@..." }
  → next() ✅

checkChatLimit:
  → User.findById("64abc") → fetches user from MongoDB
  → user.usage.aiChatQueries = 45, plan limit = 50
  → 45 < 50, limit not exceeded
  → req.userDoc = user (attached for controller to use)
  → next() ✅

──── STEP 4: CONTROLLER (aiController.js → chatWithDocument) ─────────
  → Reads req.body.documentId, req.body.message
  → Fetches Document from MongoDB (gets parsedText + vectors status)
  → Decides: RAG mode (vectors embedded) vs Legacy mode (raw text)
  → Calls embeddingService.embedQuery("Explain recursion")
  → Gets 1024-dim vector for the query
  → Calls embeddingService.searchSimilarChunks(vector, "64abc")
  → MongoDB $vectorSearch returns top 5 relevant text chunks
  → Calls groqService.chat(chunks, "Explain recursion")
  → Groq Llama 3.3 returns: "Recursion is when a function calls itself..."
  → Calls gamificationService.awardXP(userId, 'documentChat')
  → Increments user.usage.aiChatQueries from 45 to 46 in MongoDB

──── STEP 5: RESPONSE ────────────────────────────────────────────────
  res.status(200).json({ response: "Recursion is when a function calls itself..." })

──── STEP 6: REACT CLIENT ────────────────────────────────────────────
  Axios receives JSON response
  Updates chatMessages state with the new AI message
  React re-renders ChatInterface component
  User sees the AI answer appear on screen instantly
```
