# CareerCraft-AI — Super Interview Prep Roadmap

> **How to use this**: This roadmap is your master index. Each phase is studied separately and in-depth one by one. Read each phase heading and bullet to understand the scope. Then tell me "Let's go deep on Phase X" and we will drill down fully.

---

## 🗂️ Master Study Order

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
 WHY?        HOW?        AUTH        DOCS        AI Core
 (Mental      (System     Feature     Feature     (RAG,
  Model)      Design)     Flow        Flow        OpenAI)
                                                    │
Phase 10 ◄── Phase 9 ◄── Phase 8 ◄── Phase 7 ◄── Phase 6
 Interview    Deploy &    Frontend    Billing &   Gamifi-
 Q&A Bank     Ops         UI Flow     Payment     cation
```

---

## 📌 Phase 1 — The "WHY" Layer (Mental Model First)
> *Before touching any file, understand why the project exists and why every major decision was made. This is what interviewers really care about.*

### What You Will Learn:
- What problem CareerCraft-AI solves
- Why it is a **MERN stack** and not Django, Laravel, or Next.js full-stack
- Why **MongoDB** and not PostgreSQL (and why that's a real trade-off)
- Why **React SPA** and not Next.js (SSR vs. CSR — when is each right?)
- Why **Vite + Rolldown** (Rust compiler) and not Webpack
- Why **Tailwind CSS v4** and not Styled Components
- Why **JWT** and not Sessions/Cookies
- Why **Cloudinary** and not storing files in the server itself
- Why **two LLMs** (OpenAI + Groq) instead of just one
- Why **Jina Embeddings** and not OpenAI's own embedding model
- Why **MongoDB Atlas Vector Search** and not Pinecone/ChromaDB

### Trade-offs to Understand for Each:
| Decision | Trade-off Summary |
|---|---|
| MongoDB over PostgreSQL | Flexible schema (user has nested gamification, subscription objects) vs. losing ACID strict relations |
| React SPA over Next.js | Dashboard app, no SEO needed for inner pages → no need for SSR overhead |
| Vite Rolldown | Rust speed, but newer ecosystem with less community support than Webpack |
| Two LLMs (OpenAI + Groq) | OpenAI for creativity/JSON output, Groq Llama for raw speed in chat RAG |
| MongoDB Vector Search | No extra DB to manage, but limited to Atlas cloud only |
| Jina over OpenAI Embeddings | Asymmetric task types (query vs. passage) give better semantic matching |

### Files to Glance at (Context Only):
- [server/package.json](file:///E:/Projects/CareerCraft-AI/server/package.json) — see all technology choices in one place
- [client/package.json](file:///E:/Projects/CareerCraft-AI/client/package.json) — see all frontend choices

---

## 📌 Phase 2 — System Architecture & Data Flow
> *Understand the big picture of how ALL parts connect before going into individual features.*

### What You Will Learn:
- The 3-tier client-server-database architecture diagram
- How a single user request travels from browser → Express → MongoDB → back
- The **7 separate routes** the server exposes and what each is responsible for
- How middleware sits between route and controller (auth guard, usage limits)
- How services are separated from controllers (why — single responsibility principle)
- The full **RAG pipeline** flow: PDF → text → chunks → vectors → MongoDB → query → LLM → response
- Environment variables and why secrets must never go to the client
- The **health-check ping** pattern for keeping free-tier servers alive

### Architecture Diagram to Master:
```
Browser → React Client
            │
            ├── Axios API call (with JWT header)
            │
            ▼
        Express Server (index.js)
            │
            ├── Morgan logs
            ├── Helmet security headers
            ├── CORS policy
            │
            ├── /auth  routes   ──► authController   ──► User model
            ├── /docs  routes   ──► documentController ─► Document model + Cloudinary
            ├── /ai    routes   ──► aiController      ──► openaiService + embeddingService
            ├── /interview      ──► interviewController ─► openaiService
            ├── /quiz           ──► quizController
            ├── /gamification   ──► gamificationService ─► User model
            └── /subscription   ──► subscriptionController ─► Razorpay + User model
                                               │
                                    ▼ all hit MongoDB Atlas
```

### Key Files:
- [server/index.js](file:///E:/Projects/CareerCraft-AI/server/index.js) — entry point, middleware registration, route mounting
- [server/routes/](file:///E:/Projects/CareerCraft-AI/server/routes) — all 8 route files
- [server/middleware/](file:///E:/Projects/CareerCraft-AI/server/middleware) — auth guard + usage limiter

---

## 📌 Phase 3 — Authentication Feature (Full Flow)
> *Auth is the gate to everything. Know this flow front-to-back.*

### What You Will Learn:
- **Registration Flow**: form → API call → password hashing (bcrypt) → save User → send OTP email → return JWT
- **OTP Email Verification**: how OTP is generated, stored with expiry, and verified
- **Login Flow**: email/password → compare hash → sign JWT → return token → client stores token
- **JWT Deep Dive**: what is in the payload, how `jsonwebtoken.sign()` and `.verify()` works, why it is stateless
- **Forgot Password Flow**: token generation → email link → token validation → password reset
- **Auth Middleware**: how `req.headers.authorization` is parsed, how `req.user` is set
- **Protected vs. Public Routes**: `ProtectedRoute` and `PublicRoute` in React Router
- **Email Services**: Why Brevo + Nodemailer both exist (primary + fallback)

### Feature Flow Diagram:
```
Register ──► Hash password (bcrypt) ──► Save to MongoDB ──► Send OTP (Brevo) ──► Verify OTP ──► Login ──► Get JWT ──► Store in client
```

### Key Files:
- [server/routes/authRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/authRoutes.js)
- [server/controllers/authController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/authController.js)
- [server/models/User.js](file:///E:/Projects/CareerCraft-AI/server/models/User.js)
- [server/utils/emailService.js](file:///E:/Projects/CareerCraft-AI/server/utils/emailService.js)
- [server/middleware/authMiddleware.js](file:///E:/Projects/CareerCraft-AI/server/middleware/authMiddleware.js)
- [client/src/pages/Login.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Login.jsx)
- [client/src/pages/Register.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Register.jsx)
- [client/src/pages/VerifyEmail.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/VerifyEmail.jsx)
- [client/src/context/AuthContext.jsx](file:///E:/Projects/CareerCraft-AI/client/src/context/AuthContext.jsx)

---

## 📌 Phase 4 — Document Management Feature (Full Flow)
> *Understand how PDFs are uploaded, stored, parsed, and made searchable.*

### What You Will Learn:
- How **Multer** handles multipart form uploads in Express
- How **Multer-Cloudinary storage** directly pipes uploads to the cloud (not to disk first)
- What Cloudinary returns (a secure URL) and how it's stored in MongoDB
- How **pdf-parse** extracts raw text from a PDF binary buffer
- Why the parsed text is **cached** in MongoDB (performance optimization — avoid re-downloading and re-parsing on every request)
- What happens when a user opens a document for the first time (lazy text extraction)
- How `Document` and `DocumentChunk` models are related (one-to-many)

### Feature Flow Diagram:
```
User picks PDF ──► Multer captures file ──► Cloudinary stores it ──► URL saved in MongoDB Document
                                                                         │
                                              User opens document ──► PDF downloaded from Cloudinary
                                                                     ──► pdf-parse extracts text
                                                                     ──► parsedText cached in Document
```

### Key Files:
- [server/routes/documentRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/documentRoutes.js)
- [server/controllers/documentController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/documentController.js)
- [server/models/Document.js](file:///E:/Projects/CareerCraft-AI/server/models/Document.js)
- [server/models/DocumentChunk.js](file:///E:/Projects/CareerCraft-AI/server/models/DocumentChunk.js)
- [client/src/pages/Documents.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Documents.jsx)
- [client/src/pages/DocumentView.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/DocumentView.jsx)

---

## 📌 Phase 5 — AI Core (Full AI Feature Suite)
> *Deep Dive Document:* [files/phase_5_ai_core.md](file:///E:/Projects/CareerCraft-AI/files/phase_5_ai_core.md)
> *The most technically impressive part of the project. This phase covers ALL AI-powered features: RAG pipeline, Document Chat, Flashcard generation, Quiz generation, and Mock Interviews.*

### What You Will Learn:
- **Chunking Algorithm**: recursive splitter — splits on `\n\n` → `\n` → `. ` → ` ` (in priority order), with 100-char overlap between chunks, and why overlap prevents context loss
- **Jina Embeddings v3**: what embeddings are (numbers representing meaning), what 1024-dimensional means, why `retrieval.passage` vs `retrieval.query` (asymmetric search) gives better results than symmetric search
- **MongoDB Atlas Vector Search**: how `$vectorSearch` aggregation works, what `numCandidates` and `limit` mean, how the vector index is configured (cosine similarity)
- **RAG vs. Legacy Mode**: when each is used — Legacy truncates text and sends it to OpenAI directly; RAG retrieves only the relevant chunks via semantic search, then sends to Groq
- **Why Groq for RAG**: sub-second latency on Llama 3.3 70B vs. OpenAI response times
- **OpenAI JSON Mode** (`response_format: { type: "json_object" }`): constrained decoding, the root-object rule, and why arrays can't be the root
- **Flashcards**: how parsed text → OpenAI JSON mode → `{ "cards": [...] }` → `FlashcardDeck` in MongoDB
- **Quizzes**: MCQ generation, score submission, `QuizResult` snapshot persistence
- **Mock Interviews**: stateful multi-turn conversation — system prompt engineering, MongoDB history → OpenAI messages array format, `max_tokens: 500`
- **The retryWithBackoff pattern**: exponential backoff, what 429 means, what mock fallbacks do

### Feature Flow (RAG Mode):
```
User types question
    ──► Query embedded with Jina (retrieval.query task)
    ──► $vectorSearch in MongoDB (filter by documentId)
    ──► Top 5 matching chunks retrieved
    ──► Chunks + Question sent to Groq Llama 3.3
    ──► Factual answer returned
    ──► XP awarded to user
```

### Feature Flow (Flashcards):
```
User clicks "Generate Flashcards"
    ──► Parsed text fetched (first 10,000 chars)
    ──► OpenAI called with JSON mode prompt
    ──► Model returns: { "cards": [{ front, back }] }
    ──► Array extracted from wrapper object
    ──► Saved to FlashcardDeck in MongoDB → XP awarded
```

### Feature Flow (Mock Interview):
```
User sets: role, company, difficulty, skills
    ──► System prompt constructed
    ──► OpenAI called with "Start interview" seed message
    ──► AI greeting saved to InterviewSession in MongoDB
    ──► User sends reply → All previous messages fetched from MongoDB
    ──► Formatted into OpenAI messages array → AI replies
    ──► After 5+ exchanges: 75 XP awarded (once)
```

### Key Files:
- [server/services/embeddingService.js](file:///E:/Projects/CareerCraft-AI/server/services/embeddingService.js) ⭐ *Most important file*
- [server/services/groqService.js](file:///E:/Projects/CareerCraft-AI/server/services/groqService.js)
- [server/services/openaiService.js](file:///E:/Projects/CareerCraft-AI/server/services/openaiService.js)
- [server/controllers/aiController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/aiController.js)
- [server/controllers/interviewController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/interviewController.js)
- [server/routes/aiRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/aiRoutes.js)
- [server/models/FlashcardDeck.js](file:///E:/Projects/CareerCraft-AI/server/models/FlashcardDeck.js)
- [server/models/Quiz.js](file:///E:/Projects/CareerCraft-AI/server/models/Quiz.js)
- [server/models/QuizResult.js](file:///E:/Projects/CareerCraft-AI/server/models/QuizResult.js)
- [server/models/InterviewSession.js](file:///E:/Projects/CareerCraft-AI/server/models/InterviewSession.js)
- [client/src/components/ChatInterface.jsx](file:///E:/Projects/CareerCraft-AI/client/src/components/ChatInterface.jsx)
- [client/src/pages/Flashcards.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Flashcards.jsx)
- [client/src/pages/Quiz.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Quiz.jsx)
- [client/src/pages/Interview.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Interview.jsx)

---

## 📌 Phase 6 — Gamification + Leaderboard (Engagement Engine)
> *Deep Dive Document:* [files/phase_6_gamification.md](file:///E:/Projects/CareerCraft-AI/files/phase_6_gamification.md)
> *Understand how the app keeps users coming back daily.*

### What You Will Learn:
- The XP values for each action (login: 10, upload: 25, quiz: 50, flashcard: 30, interview: 75)
- **Streak algorithm**: date comparison math — `isSameDay()` and `isYesterday()` to determine if streak continues or resets
- **Streak milestone bonuses**: 7-day (+50 XP), 30-day (+200 XP), 100-day (+500 XP)
- **Daily XP caps**: document chat is capped at 25 XP per day (anti-farming)
- **Leaderboard ranking**: `countDocuments({ xp: { $gt: user.xp } })` — simple and effective
- How the `dailyLoginClaimed` flag prevents double-claiming XP in same day
- XP is awarded **non-blocking** — if XP fails, the main feature still succeeds (try-catch isolation)
- The `Promise.all` parallel fetch pattern used in `Leaderboard.jsx`

### Feature Flow:
```
User performs action (quiz, flashcard, upload, chat...)
    ──► Controller calls awardXP(userId, XP_VALUES.COMPLETE_QUIZ, 'quiz_completion')
    ──► Controller calls updateStreak(userId)
    ──► isSameDay(lastActivityDate, now)? → No streak change (idempotent)
    ──► isYesterday(lastActivityDate, now)? → currentStreak++
    ──► STREAK_BONUSES[currentStreak]? → xp += milestone bonus
    ──► user.save() → rank recomputed on next leaderboard fetch
```

### Key Files:
- [server/services/gamificationService.js](file:///E:/Projects/CareerCraft-AI/server/services/gamificationService.js) ⭐
- [server/controllers/gamificationController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/gamificationController.js)
- [server/routes/gamificationRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/gamificationRoutes.js)
- [server/models/User.js](file:///E:/Projects/CareerCraft-AI/server/models/User.js) — gamification fields
- [client/src/pages/Leaderboard.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Leaderboard.jsx)
- [client/src/components/GamificationCard.jsx](file:///E:/Projects/CareerCraft-AI/client/src/components/GamificationCard.jsx)

---

## 📌 Phase 7 — Billing & Payment (Subscription Layer)
> *Understand how the app monetizes and enforces feature limits.*

### What You Will Learn:
- The 3 subscription tiers: **Free**, **Pro (₹299/mo)**, **Enterprise (₹999/mo)**
- The feature limits per plan (docs, queries, quizzes, interviews)
- **Razorpay payment flow**: create order → client pays → verify signature → upgrade user plan
- **HMAC-SHA256 signature verification**: why and how payment integrity is validated server-side
- **Usage Middleware**: how quota checks intercept before AI routes run
- **Webhook handling**: Razorpay sends events (`payment.captured`, `payment.failed`) and how we respond
- What happens at subscription cancellation (period-end cancel vs. immediate)

### Razorpay Flow:
```
User clicks "Upgrade to Pro"
    ──► POST /subscription/order ──► Razorpay creates order ──► orderId returned to client
    ──► Client opens Razorpay checkout modal
    ──► User pays ──► Razorpay returns payment_id + signature
    ──► Client sends: order_id + payment_id + signature to server
    ──► Server: HMAC-SHA256 verify signature
    ──► If valid: User.subscription.plan = 'pro' saved in MongoDB
```

### Key Files:
- [server/routes/subscriptionRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/subscriptionRoutes.js)
- [server/controllers/subscriptionController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/subscriptionController.js) ⭐
- [server/middleware/usageMiddleware.js](file:///E:/Projects/CareerCraft-AI/server/middleware/usageMiddleware.js)
- [server/models/User.js](file:///E:/Projects/CareerCraft-AI/server/models/User.js) — subscription fields
- [client/src/pages/Pricing.jsx](file:///E:/Projects/CareerCraft-AI/client/src/pages/Pricing.jsx)

---

## 📌 Phase 8 — Frontend UI Flow
> *Understand the React client architecture: routing, protected routes, context, and the overall UI experience.*

### What You Will Learn:
- How `App.jsx` defines all client-side routes with React Router DOM v7
- How `ProtectedRoute` and `PublicRoute` wrappers enforce auth state using `AuthContext`
- How `AuthContext` stores the JWT and exposes `user`, `login()`, and `logout()` across the whole app
- How `Layout.jsx` provides the persistent sidebar, dark/light mode toggle, and page wrapper
- How Framer Motion `AnimatePresence` produces smooth page transitions on route changes
- How Axios interceptors automatically attach the JWT `Authorization` header to every request
- The Tailwind CSS v4 design system and CSS custom property tokens

### Key Files:
- [client/src/App.jsx](file:///E:/Projects/CareerCraft-AI/client/src/App.jsx)
- [client/src/context/AuthContext.jsx](file:///E:/Projects/CareerCraft-AI/client/src/context/AuthContext.jsx)
- [client/src/components/Layout.jsx](file:///E:/Projects/CareerCraft-AI/client/src/components/Layout.jsx)
- [client/src/utils/api.js](file:///E:/Projects/CareerCraft-AI/client/src/utils/api.js)
- [client/src/index.css](file:///E:/Projects/CareerCraft-AI/client/src/index.css)
- [client/vercel.json](file:///E:/Projects/CareerCraft-AI/client/vercel.json)

---

## 📌 Phase 9 — Deploy & Ops
> *Understand how the app is deployed, how free-tier servers stay alive, and how environment config is managed.*

### What You Will Learn:
- How the React client is deployed to **Vercel** (SPA rewrite rules in `vercel.json`)
- How the Node.js server is deployed to **Render** (free tier spin-down problem)
- The **health-check ping pattern** — a cron job that pings the server every 14 minutes to prevent spin-down
- How environment variables are configured in Render and Vercel dashboards (never commit `.env`)
- CORS configuration: why `CLIENT_URL` must exactly match the Vercel deployment URL
- MongoDB Atlas network access: IP allowlist for Render's outbound IP addresses

### Key Files:
- [client/vercel.json](file:///E:/Projects/CareerCraft-AI/client/vercel.json) — SPA routing rewrites
- [server/.env](file:///E:/Projects/CareerCraft-AI/server/.env) — local env vars template
- [server/index.js](file:///E:/Projects/CareerCraft-AI/server/index.js) — CORS origin configuration

---

## 📌 Phase 10 — Interview Q&A Battle-Ready Deep Dive
> *Prepare answers for every hard question an interviewer can ask about this project.*

### Questions You Will Be Able to Answer:
1. Walk me through the RAG pipeline in detail
2. Why did you use MongoDB for vector storage instead of Pinecone?
3. How does JWT work and what are its security trade-offs?
4. How do you handle LLM API failures without breaking the user experience?
5. Why use two LLMs — OpenAI AND Groq?
6. How did you guarantee structured JSON output from the LLM?
7. How does the streak tracking algorithm work?
8. How do you verify Razorpay payments securely?
9. What is the difference between `retrieval.query` and `retrieval.passage` task types in Jina?
10. How does your usage middleware prevent quota abuse?
11. Why did you use Framer Motion in a production app?
12. How is the interview session's conversation history managed across multiple requests?

### Key Files for This Phase:
- All previous files — this phase synthesizes everything

---

## 📊 Quick Priority Matrix

| Phase | Topic | Difficulty | Interview Weight | Study First? |
|---|---|---|---|---|
| Phase 1 | WHY Layer | Easy | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Phase 2 | Architecture | Easy | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Phase 3 | Auth | Medium | ⭐⭐⭐⭐ | ✅ Yes |
| Phase 5 | AI Core (RAG + All AI) | Hard | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Phase 7 | Billing & Payments | Medium | ⭐⭐⭐⭐ | ✅ Yes |
| Phase 6 | Gamification | Easy | ⭐⭐⭐ | After above |
| Phase 4 | Docs Upload | Easy | ⭐⭐ | Anytime |
| Phase 8 | Frontend UI Flow | Medium | ⭐⭐⭐ | After above |
| Phase 9 | Deploy & Ops | Medium | ⭐⭐⭐ | After above |
| Phase 10 | Q&A Bank | Synthesis | ⭐⭐⭐⭐⭐ | Last |
