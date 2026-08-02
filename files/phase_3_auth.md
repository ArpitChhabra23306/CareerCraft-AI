# Phase 3: Authentication Feature — Full Deep Dive

> **Goal:** After reading this, you should be able to explain every single step of how a user registers, verifies their email, logs in, and resets their password in this exact codebase. Not theory — actual code.

---

## The Big Picture: All 6 Auth Routes

The entry point for all auth is [server/routes/authRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/authRoutes.js):

```javascript
import express from 'express';
import { login, register, verifyEmail, resendOTP, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);           // Step 1: Create account
router.post('/verify-email', verifyEmail);    // Step 2: Submit OTP code
router.post('/resend-otp', resendOTP);        // Optional: Request a new OTP
router.post('/login', login);                 // Step 3: Login
router.post('/forgot-password', forgotPassword); // Password Reset - Step 1
router.post('/reset-password', resetPassword);   // Password Reset - Step 2
```

**Note:** All these are `POST` because all of them send sensitive data (passwords, OTPs) in the `req.body`. You never put a password in a URL (`req.params` or `req.query`) as URLs are visible in browser history, server logs, and the address bar.

None of these routes use `verifyToken` middleware because they are all **public routes** — the user is not logged in yet when they use them.

---

## HTTP Methods Deep Dive: The 9 Standard HTTP Verbs & REST API Actions

When designing an API, we follow REST standards. In the HTTP/1.1 specification (and subsequent versions), there are **9 standard HTTP methods** (also called verbs). Each serves a distinct purpose, has specific security implications, and behaves differently regarding **Idempotency** (whether repeating the request changes the state) and **Safety** (whether the request changes database state).

Here is the master guide detailing exactly how all 9 methods operate, their parameters, and how they apply in web architectures.

---

### 1. `GET` — Read (Retrieve Data)
*   **Purpose:** Retrieve data from the server. It is strictly a read-only operation.
*   **Safe:** Yes.
*   **Idempotent:** Yes. Running `GET` 1,000 times will return the same data without altering the database.
*   **Payload (Body):** No body. Data is passed via URL Query Params (`req.query`) or Route Params (`req.params`).
*   **Codebase Example:** 
    *   **Frontend Request:** `axios.get('/docs?limit=10')`
    *   **Backend Routing:** `router.get('/', verifyToken, getDocuments);`
    *   **Database Action:** `const documents = await Document.find({ userId: req.user.id });`

---

### 2. `POST` — Create (Write New Data or Trigger Actions)
*   **Purpose:** Write new data records to the database or run processes that modify state.
*   **Safe:** No (it modifies data).
*   **Idempotent:** No. Submitting a `POST` request twice will create two separate records (e.g., uploading a duplicate PDF).
*   **Payload (Body):** Yes. Sends data inside the request body (`req.body`).
*   **Codebase Example:** 
    *   **Frontend Request:** `axios.post('/auth/register', { username, email, password })`
    *   **Backend Routing:** `router.post('/register', register);`
    *   **Database Action:** `const newUser = new User({...}); await newUser.save();`

---

### 3. `PUT` — Update/Replace (Full Overwrite)
*   **Purpose:** Overwrite an entire existing resource with a new version. If the resource does not exist, it creates it (known as "Upsert").
*   **Safe:** No (it modifies data).
*   **Idempotent:** Yes. Replacing a resource with identical data 10 times leaves it in the exact same final state.
*   **Payload (Body):** Yes. Body contains the complete updated resource.
*   **Codebase Example:** 
    *   **Frontend Request:** `axios.put('/quiz/64abc123/score', { score: 90 })`
    *   **Backend Routing:** `router.put('/quiz/:id/score', updateQuizScore);`
    *   **Database Action:** `await QuizResult.replaceOne({ _id: req.params.id }, { score: req.body.score, ...otherRequiredFields });`

---

### 4. `PATCH` — Update/Modify (Partial Update)
*   **Purpose:** Update only specific fields of a resource (e.g., changing only the theme preference on a user profile).
*   **Safe:** No (it modifies data).
*   **Idempotent:** Yes, in most REST designs.
*   **Payload (Body):** Yes. Body contains only the key-value pairs being changed.
*   **Codebase Example:** 
    *   **Frontend Request:** `axios.patch('/user/theme', { theme: 'dark' })`
    *   **Backend Routing:** `router.patch('/theme', updateTheme);`
    *   **Database Action:** `await User.findByIdAndUpdate(req.user.id, { $set: { theme: req.body.theme } });`

---

### 5. `DELETE` — Delete (Remove Data)
*   **Purpose:** Permanently delete a resource from the database.
*   **Safe:** No (it modifies data).
*   **Idempotent:** Yes. The first request deletes the document. Subsequent requests do nothing because the document is already gone (returning the same final state).
*   **Payload (Body):** Usually no body. Resource targeted via URL path parameters.
*   **Codebase Example:** 
    *   **Frontend Request:** `axios.delete('/docs/64abc123')`
    *   **Backend Routing:** `router.delete('/:id', deleteDocument);`
    *   **Database Action:** `await Document.findByIdAndDelete(req.params.id);`

---

### 6. `HEAD` — Read Metadata (Headers Only)
*   **Purpose:** Exactly identical to `GET`, but the server returns **only the HTTP headers** and completely omits the response body.
*   **Safe:** Yes.
*   **Idempotent:** Yes.
*   **Payload (Body):** No.
*   **Why use it:** Extremely useful for performance and efficiency. For example, before downloading a massive 500MB PDF from the server, the client can send a `HEAD` request to read the `Content-Length` header to see how large it is, or inspect the `Last-Modified` header to see if their local browser cache is still up-to-date, without wasting bandwidth downloading the file.

---

### 7. `OPTIONS` — Fetch Communication Permissions (CORS Preflight)
*   **Purpose:** Query the server to find out which HTTP methods, headers, and CORS security rules are allowed for a specific URL.
*   **Safe:** Yes.
*   **Idempotent:** Yes.
*   **Payload (Body):** No.
*   **Why use it (CORS Preflight):** This is the backbone of browser security. Before a browser sends a cross-origin request (e.g., React on `localhost:5173` trying to send a `DELETE` request to Express on `localhost:5000`), the browser silently sends an `OPTIONS` request first (a "Preflight request"). The server responds with headers like `Access-Control-Allow-Methods: GET, POST, DELETE`. If `DELETE` is in the allowed list, the browser proceeds to send the actual `DELETE` request. If not, the browser blocks it immediately.

---

### 8. `CONNECT` — Establish Tunnel (Proxy Connections)
*   **Purpose:** Establish a two-way network tunnel with the destination server, typically used to convert a standard proxy connection into a secure HTTPS tunnel (SSL/TLS).
*   **Safe:** No.
*   **Idempotent:** No.
*   **Payload (Body):** No.
*   **How it works:** When your browser connects to a website through an HTTP proxy using HTTPS, the browser sends a `CONNECT server.com:443 HTTP/1.1` to the proxy. The proxy establishes a raw TCP connection to the destination server and pipes the raw, encrypted SSL/TLS data back and forth without reading it.

---

### 9. `TRACE` — Echo Request (Diagnostics)
*   **Purpose:** Perform a loop-back test. The server receives the request and sends the exact same request back to the client as the response body.
*   **Safe:** Yes.
*   **Idempotent:** Yes.
*   **Payload (Body):** No.
*   **Why use it:** Used strictly for debugging network paths. It allows the developer to see if any intermediate proxy servers, load balancers, or firewalls along the network route are modifying request headers before they reach the backend.
*   **Security Alert:** In production environments, `TRACE` is almost always **disabled** on servers. If enabled, it is vulnerable to **Cross-Site Tracing (XST)** attacks, where an attacker bypasses the HttpOnly cookie flag by forcing a script to make a `TRACE` request, which echoes back the cookies in the response body.

---### Why do we sometimes use `POST` for actions that feel like "getting" data?

You might ask: *"Wait, when I log in (`POST /auth/login`), isn't the server just fetching/reading my user profile? Why isn't that a GET?"*

There are two major reasons:
1. **Security (URL Exposure):** In a `GET` request, the request body is not allowed by HTTP specifications. All data must be appended to the URL query parameters (e.g., `?email=arpit@gmail.com&password=123`). URLs are recorded in browser histories, firewall logs, and server logs. Using `POST` lets us package credentials inside `req.body`, which remains hidden in network logs.
2. **Operations with State Changes (Side Effects):** Authentic login often triggers side-effects, like updating the user's `lastLoginDate` or incrementing daily streaks in the database. Because it modifies database records, it violates the "read-only/safe" rule of `GET`, making `POST` the correct REST verb.

---

## How the 9 HTTP Methods Map to Our CareerCraft-AI Codebase

It is highly impressive in an interview to explain *exactly* how your own code deals with all 9 of these verbs. Here is the operational breakdown inside CareerCraft-AI:

### 1. The Explicit Routes (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
These five verbs are **explicitly mapped to controllers** in our Express router files:
*   **`GET`**: Declared as `router.get('/', ...)` in `documentRoutes.js` to fetch list of PDFs.
*   **`POST`**: Declared as `router.post('/register', ...)` in `authRoutes.js` to create accounts.
*   **`PUT`**: Declared as `router.put('/quiz/:id/score', ...)` in `aiRoutes.js` to fully replace quiz records.
*   **`PATCH`**: Declared as `router.patch('/profile', ...)` in `userRoutes.js` to modify specific user bio/theme fields.
*   **`DELETE`**: Declared as `router.delete('/:id', ...)` in `documentRoutes.js` to delete documents by ID.

### 2. The Browser Security Guard (`OPTIONS`)
We do **not** write `router.options('/...', ...)` in our code. Instead, it is handled globally:
*   **How it is used:** Every time the React client (on port `5173`) wants to make a `DELETE` or `POST` request to our server (on port `5000`), the user's browser silently sends a preflight `OPTIONS` request first.
*   **How we handle it:** In `server/index.js`, we register the **`cors()` middleware** (`app.use(cors())`). This middleware automatically intercepts all incoming `OPTIONS` requests and immediately responds with the proper CORS headers (like `Access-Control-Allow-Origin` and `Access-Control-Allow-Methods`) so the browser knows the cross-origin connection is safe and authorized.

### 3. The Implicit Supporter (`HEAD`)
We do **not** explicitly register `router.head()` routes in our codebase.
*   **How it is handled:** Express has built-in support for `HEAD`. If a client sends a `HEAD /docs` request, Express will automatically run our `GET /docs` route controller. However, right before the server sends the response back over the network, Express intercepts it, strips the entire body, and transmits only the response headers. This happens implicitly with zero extra code from us.

### 4. The Network Level Wrapper (`CONNECT`)
We do **not** write any code for `CONNECT`.
*   **How it is used:** When our application is deployed to production (e.g., Render, Railway, or AWS), users connect over secure HTTPS. The browser establishes an SSL/TLS tunnel using `CONNECT` at the network proxy/load balancer layer (handled by Render's routing mesh or Nginx reverse proxies), which passes the secure, decrypted traffic down to our Node.js server.

### 5. The Locked Security Vulnerability (`TRACE`)
`TRACE` is a security risk (Cross-Site Tracing) and is disabled.
*   **How we handle it:** In `server/index.js`, we use the **`helmet()` middleware** (`app.use(helmet())`). Helmet automatically disables `TRACE` requests and configures headers (such as `X-Content-Type-Options`) to prevent browsers from responding to or initiating trace debug cycles. If someone tries to send a `TRACE` request to our server, Express or Helmet blocks/denies it.

---

## Auth Route Architecture & Interview FAQ

Here is the exact explanation of why auth routes behave this way, the strict security reasons behind it, and the very important exceptions you must know for interviews.

### 1. Do all auth routes ALWAYS use `POST` (even exceptions)?
In your current codebase, **yes, all 6 routes use `POST`**. 

In the broader world of web development, **95% of auth routes use `POST`**, but there are some important exceptions.

#### Why do we use `POST`?
We use `POST` because of **URLs and logs**. 
* If you use a `GET` request, the data must be sent in the URL (like `/login?email=arpit@gmail.com&password=123`). 
* Browsers history, router logs, and server logs (like Morgan logs) **always record the full URL**. If you used `GET` for login, your user's password would be printed in plain text inside server log files, browser history, and proxy servers.
* `POST` sends data securely inside the **HTTP Request Body** (`req.body`). The body is encrypted if you are using HTTPS, and it is never recorded in standard URL log files.

#### The Exceptions (Auth routes that use `GET` or `DELETE`):
There are two common auth routes in modern web apps that do **not** use `POST`:
1.  **`GET /auth/me` (or `/auth/status`)**: Checks if the user is currently logged in. The frontend sends this request when the app first loads. It sends the JWT in the headers, and the server returns the user's profile info. Because it's just "reading" data and doesn't send a password, it uses `GET`.
2.  **`POST` vs `DELETE` for Logout**: Some architectures use `DELETE /auth/logout` because you are "deleting" the session. However, most developers still stick to `POST` to prevent CSRF attacks.

### 2. Where are `POST` methods used in Auth?
Any endpoint that creates an account, changes database states, or handles credentials uses `POST`:
*   `POST /auth/register` (creates a user)
*   `POST /auth/login` (submits credentials)
*   `POST /auth/verify-email` (submits OTP code)
*   `POST /auth/resend-otp` (submits email to generate a new database record)
*   `POST /auth/forgot-password` (generates a database reset token)
*   `POST /auth/reset-password` (submits new password to overwrite the old one)

### 3. Do Auth routes not need middleware because the user is not verified?

This is **mostly true, but not 100%**. 

We divide auth routes into two categories: **Public Entry routes** and **Protected Account routes**.

#### Category A: Public Entry Routes (NO Middleware)
These routes **must not** have `verifyToken` middleware:
*   `register`, `login`, `verifyEmail`, `forgotPassword`, `resetPassword`.
*   **Why:** If you protect the `/login` route with `verifyToken`, the user can never log in! They don't have a token yet because they haven't logged in. It’s a Catch-22. These must remain open to the public.

#### Category B: Protected Account Routes (DOES Need Middleware)
These are auth routes that can only run if the user is **already logged in**. They must have `verifyToken` middleware:
*   **`POST /auth/change-password`**: When a logged-in user goes to their settings page and wants to update their password. We must verify their token to know *whose* password to change.
*   **`GET /auth/me`**: To fetch the logged-in user's profile on reload.
*   **`POST /auth/logout`**: If the backend keeps a database blacklist of logged-out tokens, we must verify the token before invalidating it.

---

## The User Model — What Gets Saved in MongoDB

Before looking at the controllers, you need to understand what fields are in a User document in MongoDB. This comes from [server/models/User.js](file:///E:/Projects/CareerCraft-AI/server/models/User.js):

```javascript
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // --- Core Identity ---
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },  // ⚠️ Always stored HASHED, never plain text
    bio:      { type: String, default: '' },
    avatar:   { type: String, default: '' },
    theme:    { type: String, default: 'light' },
    createdAt:{ type: Date,   default: Date.now },

    // --- Email Verification (used during registration) ---
    isVerified:             { type: Boolean, default: false },
    verificationOTP:        { type: String,  default: null },  // The 6-digit code
    verificationOTPExpires: { type: Date,    default: null },  // Expires in 10 minutes

    // --- Password Reset (used in forgot-password flow) ---
    resetPasswordToken:   { type: String, default: null },  // A random 64-char hex string
    resetPasswordExpires: { type: Date,   default: null },  // Expires in 1 hour

    // ... Gamification, Subscription, Usage fields (covered in later phases)
});

export default mongoose.model('User', UserSchema);
```

### Key things to note:
- `unique: true` on email and username means MongoDB will auto-reject duplicate signups at the database level. This is a safety net on top of the manual check in the controller.
- `isVerified: false` is the default — every new user starts as unverified.
- `verificationOTP` and `verificationOTPExpires` are **temporary fields**. They get set during registration and wiped to `null` after successful verification.
- `password` is never stored as plain text. It goes through bcrypt hashing first (explained below).

---

## Flow 1: Registration (`POST /auth/register`)

### What the frontend sends:
```javascript
// From Register.jsx using Axios:
axios.post('/auth/register', {
    username: "arpit123",
    email: "arpit@gmail.com",
    password: "mypassword123"
})
```

### The controller: [authController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/authController.js) `register()`

```javascript
// Helper at top of controller file — generates random 6-digit number
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
// Math.floor(100000 + Math.random() * 900000)
// Math.random() → a float between 0 and 1 (e.g. 0.731...)
// * 900000 → scales it to between 0 and 900000
// + 100000 → shifts range to between 100000 and 999999 (always 6 digits)
// .toString() → converts number to string so it can be stored and compared as text

export const register = async (req, res) => {
    try {
        // Step 1: Destructure the incoming body
        const { username, email, password } = req.body;

        // Step 2: Basic validation - reject empty fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Step 3: Check if user already exists (checks both email AND username in one query)
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        // $or is a MongoDB operator — finds a document where email matches OR username matches

        if (existingUser) {
            // Edge case: user exists but never verified their email
            // Instead of refusing, we re-send a fresh OTP
            if (existingUser.email === email && !existingUser.isVerified) {
                const otp = generateOTP();
                existingUser.verificationOTP = otp;
                existingUser.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
                // Date.now() = current timestamp in milliseconds
                // 10 * 60 * 1000 = 10 minutes expressed in milliseconds
                await existingUser.save();

                try { await sendVerificationEmail(email, otp); } catch (e) { console.error(e.message); }
                // The try-catch around email send is important:
                // If the email fails, we don't crash the whole request.
                // The user was saved — the email failure is logged and we move on.

                return res.status(200).json({
                    message: 'Verification email re-sent. Please check your inbox.',
                    email,
                    requiresVerification: true
                });
            }

            // User exists and IS verified → reject with specific field name
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }

        // Step 4: Hash the password using bcrypt
        const salt = await bcrypt.genSalt();
        // bcrypt.genSalt() generates a cryptographic "salt" — a random string that is mixed into the password
        // before hashing to ensure that two users with the same password get different hashes.
        // Default cost factor is 10 — this means bcrypt runs its hashing algorithm 2^10 = 1024 times.
        // More rounds = harder to crack, but slower to compute.

        const passwordHash = await bcrypt.hash(password, salt);
        // This produces something like: "$2b$10$Ks3Vg9R7hSQcfpLy8pHq2e4eFkM..."
        // This is a one-way hash — it CANNOT be decrypted back to "mypassword123"

        // Step 5: Generate a 6-digit OTP
        const otp = generateOTP();

        // Step 6: Create the new User document in memory (not saved to DB yet)
        const newUser = new User({
            username,
            email,
            password: passwordHash, // Hashed version, never the raw password
            isVerified: false,       // Must verify OTP before they can login
            verificationOTP: otp,
            verificationOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 mins
        });

        // Step 7: Save to MongoDB
        await newUser.save();
        // .save() actually writes the document to the MongoDB collection.
        // If `unique: true` is violated (concurrent duplicate registration),
        // this line throws a MongoDB error with code 11000 (caught below).

        // Step 8: Send the verification email (wrapped in try-catch — non-blocking)
        try { await sendVerificationEmail(email, otp); } catch (e) { console.error(e.message); }

        // Step 9: Respond to the frontend — no JWT yet! User must verify OTP first.
        res.status(201).json({
            message: 'Registration successful! Please check your email.',
            email,
            requiresVerification: true
        });

    } catch (err) {
        // MongoDB duplicate key error (race condition)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0]; // Tells you WHICH field caused the duplicate
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
```

### What happens in MongoDB after `/register`:
```json
{
  "_id": "64abc123...",
  "username": "arpit123",
  "email": "arpit@gmail.com",
  "password": "$2b$10$Ks3Vg9R7hSQcfp...",
  "isVerified": false,
  "verificationOTP": "847291",
  "verificationOTPExpires": "2026-07-03T17:26:00Z",
  "xp": 0,
  "subscription": { "plan": "free" }
}
```

---

## The Email Service — How OTP Emails Are Sent

The controller calls `sendVerificationEmail(email, otp)` which lives in [server/utils/emailService.js](file:///E:/Projects/CareerCraft-AI/server/utils/emailService.js).

```javascript
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = process.env.SENDER_EMAIL || 'arpitchhara369@gmail.com';
const FROM_NAME = 'CareerCraft AI';

// Base function — sends ANY email by calling Brevo's REST API directly
const sendEmail = async (to, subject, htmlContent) => {
    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY, // Secret key from .env
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: FROM_NAME, email: FROM_EMAIL },
            to: [{ email: to }],
            subject,
            htmlContent,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Brevo API error: ${response.status}`);
    }
    return response.json();
};

// OTP-specific wrapper — builds the HTML template and calls sendEmail()
export const sendVerificationEmail = async (email, otp) => {
    await sendEmail(email, 'Verify your CareerCraft AI account', `
        <div style="...">
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">
                ${otp}  ← The 6-digit code is injected directly into the HTML
            </div>
            <p>This code expires in <strong>10 minutes</strong></p>
        </div>
    `);
};
```

### Why Brevo and not Nodemailer?
- **Brevo (formerly Sendinblue)** is a dedicated transactional email service.
- It handles deliverability, spam prevention, and email reputation management for you.
- **Nodemailer** requires you to set up an SMTP server yourself.
- Using a service like Brevo, you call their REST API with a simple `fetch()` — no SMTP configuration needed.

---

## Flow 2: OTP Verification (`POST /auth/verify-email`)

### What the frontend sends:
```javascript
axios.post('/auth/verify-email', {
    email: "arpit@gmail.com",
    otp: "847291"  // The 6-digit code the user typed in
})
```

### The controller: `verifyEmail()`

```javascript
export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Step 1: Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Step 2: Already verified? Don't let them verify twice
        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Step 3: Check if OTP code matches
        if (user.verificationOTP !== otp) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        // Simple string comparison — both are stored/sent as strings ("847291" === "847291")

        // Step 4: Check if OTP has expired
        if (user.verificationOTPExpires < new Date()) {
            // new Date() = current time
            // If current time is AFTER the expiry time, the OTP is dead
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }

        // Step 5: Mark user as verified and wipe the OTP from the database
        user.isVerified = true;
        user.verificationOTP = null;           // OTP is no longer needed — clear it
        user.verificationOTPExpires = null;     // Clear the expiry too
        await user.save();

        // Step 6: Send a welcome email (fire-and-forget pattern)
        sendWelcomeEmail(email, user.username).catch(err => {
            console.error('Welcome email failed:', err.message);
        });
        // Notice: NO await here. We don't wait for the welcome email to send before responding.
        // .catch() handles failures silently. This is a "fire-and-forget" pattern.
        // The user gets their JWT instantly. If the welcome email fails, it doesn't matter.

        // Step 7: Auto-login — sign a JWT and return it immediately
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        // jwt.sign(payload, secret) — creates an encrypted token containing { id: "64abc..." }
        // No expiration is set here — the token never expires.
        // This is a design choice. An expiry (e.g., '7d') would force re-login after 7 days.

        // Step 8: Build safe user object (strip sensitive fields before sending)
        const userToSend = user.toObject();
        // .toObject() converts the Mongoose document (which has extra Mongoose-specific methods)
        // into a plain JavaScript object that can be safely serialized to JSON

        delete userToSend.password;
        delete userToSend.verificationOTP;
        delete userToSend.verificationOTPExpires;
        // We NEVER send the password hash or OTP fields to the client
        // delete removes a property from an object permanently

        res.status(200).json({
            message: 'Email verified successfully!',
            token,       // JWT token — client stores this in localStorage
            user: userToSend // Safe user object without sensitive fields
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
```

### What the MongoDB document looks like AFTER verification:
```json
{
  "_id": "64abc123...",
  "email": "arpit@gmail.com",
  "isVerified": true,
  "verificationOTP": null,        ← Cleared
  "verificationOTPExpires": null  ← Cleared
}
```

---

## Flow 3: Resend OTP (`POST /auth/resend-otp`)

This prevents OTP spam — a 60-second cooldown is enforced:

```javascript
export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.isVerified) { /* handle edge cases */ }

        // Cooldown check — was the last OTP sent less than 60 seconds ago?
        if (user.verificationOTPExpires) {
            // verificationOTPExpires was set to: Date.now() + 10 minutes
            // So: verificationOTPExpires - 10 minutes = the time when the OTP was CREATED
            const timeSinceLastOTP = Date.now() - (user.verificationOTPExpires.getTime() - 10 * 60 * 1000);
            if (timeSinceLastOTP < 60 * 1000) { // Less than 60 seconds ago
                const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastOTP) / 1000);
                return res.status(429).json({ // 429 = Too Many Requests
                    message: `Please wait ${waitSeconds} seconds before requesting a new code`,
                    retryAfter: waitSeconds
                });
            }
        }

        // Generate new OTP and update DB
        const otp = generateOTP();
        user.verificationOTP = otp;
        user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendVerificationEmail(email, otp);

        res.status(200).json({ message: 'New verification code sent!' });
    } catch (err) { /* ... */ }
};
```

> **Interview note:** HTTP `429 Too Many Requests` is the correct status code for rate limiting. This is a real-world production pattern to prevent OTP abuse/email spam.

---

## Flow 4: Login (`POST /auth/login`)

### What the frontend sends:
```javascript
axios.post('/auth/login', {
    email: "arpit@gmail.com",
    password: "mypassword123"
})
```

### The controller: `login()`

```javascript
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Step 1: Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User does not exist' });
        // ⚠️ Security note: In high-security systems, you'd return the same error for both
        // "user not found" and "wrong password" to prevent email enumeration attacks.
        // (Knowing "that email doesn't exist" is itself information for attackers.)

        // Step 2: Compare the submitted plain text password against the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        // bcrypt.compare() is magic — it runs the same hashing algorithm on the plain password
        // using the salt embedded in the stored hash, then compares results.
        // This is why you can verify without ever storing the plain text.
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Step 3: Block unverified users from logging in
        if (!user.isVerified) {
            // Auto-send a fresh OTP instead of just rejecting
            const otp = generateOTP();
            user.verificationOTP = otp;
            user.verificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
            await sendVerificationEmail(email, otp);

            return res.status(403).json({
                message: 'Email not verified. A new verification code has been sent.',
                requiresVerification: true,
                email
            });
        }

        // Step 4: Everything checks out — sign and return a JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        // jwt.sign() takes a payload { id: user._id } and the JWT_SECRET from .env
        // and produces a cryptographically signed string like:
        // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YWJjMTIzLi4uIn0.abc123..."

        // Step 5: Strip sensitive fields before sending to client
        const userToSend = user.toObject();
        delete userToSend.password;
        delete userToSend.verificationOTP;
        delete userToSend.verificationOTPExpires;
        delete userToSend.resetPasswordToken;
        delete userToSend.resetPasswordExpires;

        // Step 6: Respond with token + user data
        res.status(200).json({ token, user: userToSend });
        // The client (React) stores this `token` in localStorage.
        // Every subsequent request attaches it: Authorization: "Bearer eyJhbGci..."

    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
```

### How bcrypt.compare() works (deep dive):
```
Password stored in DB: "$2b$10$Ks3Vg9R7hSQcfpLy8pHq2eXhwS4GeTEIJ8LYKT9XSZ"
                        ──┬──  ─┬─   ─────────────────────────────────────────
                          │     │           ↑
                          │     │    22 chars = the SALT (embedded in the hash)
                          │   cost factor (10 rounds)
                       algorithm (bcrypt v2b)

When verifying:
1. bcrypt reads the embedded salt from the stored hash
2. It hashes the plain-text password using that same salt and cost factor
3. It compares the resulting hash with the stored hash
4. If they match → isMatch = true
```

---

## Flow 5: Forgot Password (`POST /auth/forgot-password`)

### The controller: `forgotPassword()`

```javascript
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // ⭐ Security pattern: ALWAYS return the same success message
        // whether the email exists or not. This prevents "email enumeration":
        // attackers can't use this endpoint to discover which emails are registered.
        if (!user) {
            return res.status(200).json({
                message: 'If an account with this email exists, a password reset link has been sent.'
            });
        }

        // Generate a cryptographically secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        // crypto is Node.js's built-in cryptography module
        // crypto.randomBytes(32) generates 32 random bytes
        // .toString('hex') converts those bytes to a 64-character hexadecimal string
        // e.g.: "a3f9e2c1b0d8..."
        // This is MUCH more secure than Math.random() which is not cryptographically safe

        // Save token + expiry to the user's MongoDB document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        // Send email containing a link with the token embedded in it
        await sendPasswordResetEmail(email, resetToken);
        // Inside emailService.js, the reset URL is built like this:
        // `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        // e.g.: https://careercraftai.com/reset-password/a3f9e2c1b0d8...

        res.status(200).json({
            message: 'If an account with this email exists, a password reset link has been sent.'
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
```

---

## Flow 6: Reset Password (`POST /auth/reset-password`)

The user clicks the link in their email → lands on the reset page → submits a new password.

### What the frontend sends:
```javascript
axios.post('/auth/reset-password', {
    token: "a3f9e2c1b0d8...",  // Extracted from the URL by React Router
    password: "mynewpassword456"
})
```

### The controller: `resetPassword()`

```javascript
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find user by token AND check it hasn't expired — all in one MongoDB query
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
            // $gt = "greater than" — the expiry must be in the FUTURE (> current time)
            // If the token is expired, this query returns null
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(password, salt);

        // Clean up — invalidate the reset token so it can't be reused
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.isVerified = true; // Bonus: also verifies email if somehow unverified
        await user.save();

        res.status(200).json({ message: 'Password reset successful! You can now log in.' });
        // Note: No JWT returned here. User must login again with their new password.

    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
```

---

## JWT Deep Dive — What Is Inside The Token?

When we call `jwt.sign({ id: user._id }, process.env.JWT_SECRET)`, the resulting token is a string with 3 dot-separated parts:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← HEADER (base64 encoded)
.
eyJpZCI6IjY0YWJjMTIzZTRiMDEyMzQ1Njc4OWFiYyJ9  ← PAYLOAD (base64 encoded)
.
sVf9mQ3Xh2LkN8PaR1Ty5cBzFgJ0WoKmEuD7ViStXqA   ← SIGNATURE (cryptographic hash)
```

**Decoded Header:**
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Decoded Payload:**
```json
{ "id": "64abc123e4b0123456789abc" }
```

**The Signature** is created by: `HMAC_SHA256(base64(Header) + "." + base64(Payload), JWT_SECRET)`

> **Critical interview point:** The payload is **NOT encrypted** — it is only base64-encoded. Anyone can decode it to see the user ID. The SIGNATURE is what makes it secure — it proves the token was created by someone with the `JWT_SECRET`. If you tamper with the payload, the signature breaks and `jwt.verify()` will reject it.

---

## Complete Auth System — Unified Flow Skeleton

One single diagram. Every user journey, every branch, every edge case, and every cross-flow connection — from first visit to password reset and daily re-access.

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                        CAREERCRAFT-AI — COMPLETE AUTHENTICATION SYSTEM FLOW                             ║
║                        From first-ever visit → registration → access → recovery                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝

                              ┌──────────────────────┐
                              │   USER VISITS APP     │
                              │   (First time ever)   │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  React checks         │
                              │  localStorage.        │
                              │  getItem('token')     │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┴───────────────────────┐
                    │ Token exists?                               │
                    ▼ NO                                          ▼ YES
        ┌───────────────────────┐                 ┌──────────────────────────┐
        │  Show Landing Page    │                 │  Axios auto-attaches     │
        │  (Login / Register)   │                 │  Authorization: Bearer   │
        └──────────┬────────────┘                 │  <token> to all requests │
                   │                              └──────────────┬───────────┘
                   │                                             │
          ─ ─ ─ ─ ─┴─ ─ ─ ─ ─                      ┌──────────▼───────────┐
         │  Which action?   │                        │  verifyToken()        │
          ─ ─ ─ ─ ─ ─ ─ ─ ─                         │  middleware runs      │
         │                  │                        │  jwt.verify(token,    │
      REGISTER             LOGIN                     │  JWT_SECRET)          │
         │                  │                        └──────────┬───────────┘
         │                  │                                   │
         │                  │                    ┌──────────────┴───────────────┐
         │                  │                    │ Token valid?                  │
         │                  │                    ▼ YES             ▼ NO/EXPIRED  │
         │                  │         ┌──────────────────┐  ┌─────────────────┐ │
         │                  │         │  req.userId set   │  │ Return 401      │ │
         │                  │         │  Dashboard loads  │  │ React clears    │ │
         │                  │         │  protected routes │  │ localStorage    │ │
         │                  │         │  accessible ✅    │  │ → Login screen  │ │
         │                  │         └──────────────────┘  └────────┬────────┘ │
         │                  │                                         │          │
         │                  └─────────────────────────────────────────┘
         │
╔════════▼═══════════════════════════════════════════════════════════════════════════════════════════════╗
║  FLOW 1 · POST /auth/register · register() · authController.js                                        ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  Payload: { username, email, password }                                                                ║
║                                                                                                        ║
║  Step 1 ─ Input Guard                                                                                  ║
║    │  username/email/password missing?  ──► 400 "All fields required"  ✗ STOP                         ║
║    │  password.length < 6?              ──► 400 "Min 6 characters"     ✗ STOP                         ║
║    ▼                                                                                                   ║
║  Step 2 ─ DB Lookup: User.findOne({ $or: [{ email }, { username }] })                                  ║
║    │                                                                                                   ║
║    ├─► [Found + isVerified === true]  ──► 400 "User already exists"    ✗ STOP                         ║
║    │                                                                                                   ║
║    ├─► [Found + isVerified === false]  ◄─ UNVERIFIED DUPLICATE EDGE CASE                              ║
║    │       │  generateOTP() → new 6-digit code                                                        ║
║    │       │  user.verificationOTP = newOtp                                                            ║
║    │       │  user.verificationOTPExpires = now + 10 mins                                             ║
║    │       │  user.save() → MongoDB updated                                                            ║
║    │       │  sendVerificationEmail(email, newOtp) → Brevo API                                        ║
║    │       └──► 200 "Verification email re-sent. Check inbox"  → redirect to /verify-email            ║
║    │                                                                                                   ║
║    └─► [Not found] ─ Continue as NEW user ──────────────────────────────────────────────────┐         ║
║                                                                                              ▼         ║
║  Step 3 ─ Hash Password: bcrypt.genSalt(10) → bcrypt.hash(password, salt)                             ║
║  Step 4 ─ Generate OTP: generateOTP() → "847291"                                                      ║
║  Step 5 ─ Save to DB: new User({ username, email, hashedPwd,                                          ║
║               isVerified: false, verificationOTP: "847291",                                           ║
║               verificationOTPExpires: now + 10 mins }).save()                                         ║
║  Step 6 ─ Dispatch Email: sendVerificationEmail(email, "847291") via Brevo REST API                   ║
║                                                                                                        ║
║  ◄─── Response: 201 Created { message: "Check your email" }                                           ║
║  ◄─── React: Redirects user to /verify-email screen                                                   ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝
                                         │
                         ┌───────────────▼─────────────────┐
                         │   User is on /verify-email        │
                         │   Inbox opens → reads OTP code    │
                         │                                   │
                         │   Did OTP expire? (>10 mins?)     │
                         └──────────────┬────────────────────┘
                                        │
                     ┌──────────────────┴──────────────────────┐
                     │ OTP still fresh?                          │
                     ▼ YES                                       ▼ NO (expired)
              User types OTP                              User clicks "Resend Code"
              and submits                                         │
                     │                       ╔═════════════════════▼═════════════════════════╗
                     │                       ║  FLOW 3 · POST /auth/resend-otp               ║
                     │                       ║  resendOTP() · authController.js              ║
                     │                       ╠═══════════════════════════════════════════════╣
                     │                       ║  Step 1 ─ DB Lookup: User.findOne({ email })  ║
                     │                       ║  Step 2 ─ Cooldown Guard:                     ║
                     │                       ║    timeSinceLastOTP =                         ║
                     │                       ║      Date.now() -                             ║
                     │                       ║      (verificationOTPExpires - 10mins)        ║
                     │                       ║    If < 60 secs ──► 429 "Wait cooldown" ✗    ║
                     │                       ║  Step 3 ─ generateOTP() → new code            ║
                     │                       ║  Step 4 ─ DB Update: new OTP + new expiry     ║
                     │                       ║  Step 5 ─ sendVerificationEmail() → Brevo     ║
                     │                       ║                                               ║
                     │                       ║  ◄─ 200 OK → React resets 60s UI timer       ║
                     │                       ╚══════════════════════════════╦════════════════╝
                     │                                                      │
                     │                                         User receives new OTP
                     │                                         and re-submits
                     │                                                      │
                     └──────────────────────────────────────────────────────┘
                                         │
╔════════════════════════════════════════▼═══════════════════════════════════════════════════════════════╗
║  FLOW 2 · POST /auth/verify-email · verifyEmail() · authController.js                                 ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  Payload: { email, otp }                                                                               ║
║                                                                                                        ║
║  Step 1 ─ Input Guard: email or otp missing? ──► 400 "Both required" ✗ STOP                          ║
║  Step 2 ─ DB Lookup: User.findOne({ email })                                                           ║
║    │  Not found?          ──► 400 "User not found"         ✗ STOP                                     ║
║    │  isVerified already? ──► 400 "Already verified"       ✗ STOP                                     ║
║    │  OTP mismatch?       ──► 400 "Invalid code"           ✗ STOP                                     ║
║    │  OTP expired?        ──► 400 "Code expired. Resend."  ✗ STOP → goes back to Flow 3               ║
║    ▼                                                                                                   ║
║  Step 3 ─ Mark Verified:                                                                               ║
║               user.isVerified = true                                                                   ║
║               user.verificationOTP = null                                                              ║
║               user.verificationOTPExpires = null                                                       ║
║               user.save() → MongoDB updated                                                            ║
║  Step 4 ─ Welcome Email: sendWelcomeEmail() → Brevo API (fire-and-forget, non-blocking)               ║
║  Step 5 ─ Sign JWT: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })                       ║
║  Step 6 ─ Sanitize Payload: user.toObject()                                                            ║
║               delete userToSend.password                                                               ║
║               delete userToSend.verificationOTP                                                        ║
║               delete userToSend.verificationOTPExpires                                                 ║
║                                                                                                        ║
║  ◄─── Response: 200 OK { token, user: { _id, username, email, isVerified, ... } }                     ║
║  ◄─── React: localStorage.setItem('token', token) → redirect to /dashboard  ✅                        ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝
                                         │
                                         │  AUTO-LOGGED IN — User is on Dashboard
                                         │
                         ┌───────────────▼─────────────────────────┐
                         │   ★  AUTHENTICATED SESSION ACTIVE  ★     │
                         │                                          │
                         │   Every protected API call:             │
                         │   Axios Header → Authorization: Bearer   │
                         │   <token>  →  verifyToken() middleware   │
                         │   → jwt.verify() → req.userId loaded     │
                         │   → Request proceeds to controller        │
                         └───────────────┬──────────────────────────┘
                                         │
                         ─ ─ ─ ─ ─ ─ ─ ─┴─ ─ ─ ─ ─ ─ ─ ─
                        │  Next time user visits the app   │
                         ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                        │ (closes browser, comes back later) │
                         ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                         React checks localStorage('token')
                                         │
                    ┌────────────────────┴─────────────────────┐
                    │ Token still there?                         │
                    ▼ YES (within 7-day expiry)                  ▼ NO (cleared / expired)
    ┌───────────────────────────────┐               ┌───────────────────────────────────┐
    │ Dashboard auto-loads ✅       │               │ /login screen shown               │
    │ verifyToken() passes silently │               └──────────────┬────────────────────┘
    └───────────────────────────────┘                              │
                                                                   │
                                               ╔═══════════════════▼══════════════════════════════╗
                                               ║  FLOW 4 · POST /auth/login                       ║
                                               ║  login() · authController.js                     ║
                                               ╠══════════════════════════════════════════════════╣
                                               ║  Payload: { email, password }                    ║
                                               ║                                                  ║
                                               ║  Step 1 ─ DB Lookup: User.findOne({ email })     ║
                                               ║    │  Not found? ──► 400 "User does not exist"   ║
                                               ║    ▼                                             ║
                                               ║  Step 2 ─ Password Check:                        ║
                                               ║    bcrypt.compare(plainPwd, user.password)       ║
                                               ║    │  No match? ──► 400 "Invalid credentials"    ║
                                               ║    ▼                                             ║
                                               ║  Step 3 ─ Verified Guard:                        ║
                                               ║    user.isVerified === false?                    ║
                                               ║    │                                             ║
                                               ║    ├─► YES (unverified):                         ║
                                               ║    │    generateOTP() → code                     ║
                                               ║    │    user.verificationOTP = code              ║
                                               ║    │    user.save() → MongoDB                    ║
                                               ║    │    sendVerificationEmail() → Brevo          ║
                                               ║    │    ──► 403 { requiresVerification: true }   ║
                                               ║    │    React → redirects to /verify-email       ║
                                               ║    │    ──────────────────────────► Flow 2       ║
                                               ║    │                                             ║
                                               ║    └─► NO (verified): Continue ─────────────┐   ║
                                               ║                                              ▼   ║
                                               ║  Step 4 ─ Sign JWT:                             ║
                                               ║    jwt.sign({ id: user._id }, JWT_SECRET)        ║
                                               ║  Step 5 ─ Sanitize Payload: user.toObject()      ║
                                               ║    delete password / verificationOTP /           ║
                                               ║    resetPasswordToken / resetPasswordExpires      ║
                                               ║                                                  ║
                                               ║  ◄─ 200 OK { token, user }                       ║
                                               ║  ◄─ React: localStorage.setItem('token',token)   ║
                                               ║  ◄─ Dashboard loads ✅                           ║
                                               ╚══════════════════════════════════════════════════╝

                         ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                        │  User is logged in, using app for weeks.   │
                        │  One day they FORGET their password.       │
                         ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                         │
                            User clicks "Forgot Password?"
                            on the /login screen
                                         │
╔════════════════════════════════════════▼═══════════════════════════════════════════════════════════════╗
║  FLOW 5 · POST /auth/forgot-password · forgotPassword() · authController.js                           ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  Payload: { email }                                                                                    ║
║                                                                                                        ║
║  Step 1 ─ DB Lookup: User.findOne({ email })                                                           ║
║    │  NOT found?                                                                                       ║
║    │  ──► Still return 200 "If this email exists, a reset link has been sent"                          ║
║    │  WHY? Email enumeration attack prevention — attacker cannot probe which emails exist              ║
║    ▼                                                                                                   ║
║  Step 2 ─ Cryptographic Token: crypto.randomBytes(32).toString('hex')                                  ║
║    → 64-char secure random hex string: "a3f9e2b1c7d84..." (NOT a JWT, NOT an OTP)                     ║
║    → Unique per request, unguessable, single-use                                                       ║
║                                                                                                        ║
║  Step 3 ─ Write to DB:                                                                                 ║
║               user.resetPasswordToken = "a3f9e2b1c7d84..."                                            ║
║               user.resetPasswordExpires = Date.now() + 3600000  (1 hour from now)                     ║
║               user.save() → MongoDB committed                                                          ║
║                                                                                                        ║
║  Step 4 ─ Dispatch Reset Email: sendPasswordResetEmail(email, resetToken) → Brevo API                 ║
║               Email contains link:                                                                     ║
║               https://careercraft.ai/reset-password/a3f9e2b1c7d84...                                  ║
║                                                                                                        ║
║  ◄─── Response: 200 OK { message: "Reset link sent" }                                                 ║
║  ◄─── React: Shows "Check your inbox" banner                                                           ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝
                                         │
                         User opens email, clicks reset link
                         Browser loads: /reset-password/a3f9e2b1c7d84...
                         React Router: const { token } = useParams()
                         User enters new password and submits
                                         │
╔════════════════════════════════════════▼═══════════════════════════════════════════════════════════════╗
║  FLOW 6 · POST /auth/reset-password · resetPassword() · authController.js                             ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  Payload: { token: "a3f9e2b1c7d84...", password: "myNewSecurePass" }                                  ║
║                                                                                                        ║
║  Step 1 ─ Input Guard:                                                                                 ║
║    │  token or password missing?  ──► 400 ✗ STOP                                                      ║
║    │  password.length < 6?        ──► 400 ✗ STOP                                                      ║
║    ▼                                                                                                   ║
║  Step 2 ─ Token Lookup:                                                                                ║
║    User.findOne({                                                                                      ║
║      resetPasswordToken: token,                   ← must match exactly                                ║
║      resetPasswordExpires: { $gt: Date.now() }    ← must not be expired                               ║
║    })                                                                                                  ║
║    │  Not found / expired? ──► 400 "Invalid or expired reset link" ✗ STOP                            ║
║    ▼                                                                                                   ║
║  Step 3 ─ Hash New Password:                                                                           ║
║               bcrypt.genSalt(10) → bcrypt.hash("myNewSecurePass", salt)                              ║
║                                                                                                        ║
║  Step 4 ─ Overwrite & Invalidate:                                                                      ║
║               user.password = hashedNewPassword                                                        ║
║               user.resetPasswordToken = null    ← SINGLE-USE: destroyed after use                    ║
║               user.resetPasswordExpires = null  ← Link is now dead forever                           ║
║               user.isVerified = true            ← Safety net if they reset via email                 ║
║               user.save() → MongoDB committed                                                          ║
║                                                                                                        ║
║  ◄─── Response: 200 OK { message: "Password updated successfully" }                                   ║
║  ◄─── React: Redirects to /login                                                                       ╠══════════╗
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝          ║
                                         │                                                                         ║
                         User is back at /login screen                                                             ║
                         They type their new password                                                              ║
                         ────────────────────────────► Flow 4 (login())                                 ══════════╝
                                         │
                    ╔════════════════════▼══════════════════════════╗
                    ║  DASHBOARD — FULLY AUTHENTICATED ✅            ║
                    ║                                               ║
                    ║  Every API request carries JWT in header:     ║
                    ║  Authorization: Bearer <token>                ║
                    ║                                               ║
                    ║  verifyToken() middleware:                    ║
                    ║    jwt.verify(token, JWT_SECRET)              ║
                    ║    → Decodes payload { id: "64abc..." }       ║
                    ║    → User.findById(id) → req.userDoc          ║
                    ║    → next() → Controller runs                 ║
                    ║                                               ║
                    ║  Protected routes now accessible:             ║
                    ║    /api/documents   (upload, manage PDFs)     ║
                    ║    /api/chat        (AI Q&A, RAG pipeline)    ║
                    ║    /api/flashcards  (study tools)             ║
                    ║    /api/quiz        (mock quizzes)            ║
                    ║    /api/interview   (AI mock interviews)      ║
                    ╚═══════════════════════════════════════════════╝

────────────────────────────────────────────────────────────────────
  CROSS-FLOW INTERACTION MAP  (which flow calls which, and when)
────────────────────────────────────────────────────────────────────

  register() ──[duplicate+unverified]──────────────────► verifyEmail()
      │                                                       ▲
      └────────[new user]────────────────────────────────────►│
                                                              │
  resendOTP() ──[new code generated]────────────────────────►│
      ▲                                                       │
      │ called when OTP expired during verifyEmail()          │
      └──────────────────────────────────────────────────────┘

  login() ──[unverified user attempts login]──► auto OTP ──► verifyEmail()
      │
      └────[verified user]──────────────────────────────────► Dashboard

  forgotPassword() ──[writes reset token]──► email link ──► resetPassword()
                                                                   │
                                                             nullifies token
                                                                   │
                                                                   └──► login() ──► Dashboard

  verifyToken() (middleware) ──► runs before EVERY protected route
      │  Valid  ──► next() → controller
      └  Invalid ──► 401 → React clears localStorage → /login
```

---

---

## Key Interview Questions & Answers

**Q: Why do you not store the plain text password?**
A: Because if the database is ever leaked, attackers cannot extract actual passwords. Bcrypt hashes are one-way — you cannot reverse them. Attackers would have to brute-force each hash which takes years with bcrypt's cost factor.

**Q: Why do you delete password from `userToSend` before sending to the frontend?**
A: Even though it's a hash, the hash is still sensitive. If it leaks to the client, attackers could attempt offline brute-force attacks on it. Sensitive fields should never cross the wire unnecessarily.

**Q: Why does the forgot-password endpoint always return the same success message?**
A: To prevent email enumeration. If we returned "Email not found" vs "Email sent", attackers could use this endpoint to discover which emails are registered in our system.

**Q: What is the difference between the OTP and the password reset token?**
A: The OTP (`847291`) is a short 6-digit number for quick manual entry by the user. The password reset token (`crypto.randomBytes(32).toString('hex')`) is a 64-character cryptographically secure random string embedded in a link — it's longer and harder to guess because it only needs to be clicked, not typed.

**Q: What happens if `sendVerificationEmail` throws an error?**
A: It is wrapped in a `try-catch` and the error is only logged to the console. The user's account is already saved to MongoDB. They can request a new OTP via `/auth/resend-otp`. This is a **resilient design** — a transient email provider failure does not break account creation.
