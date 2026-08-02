# Phase 4: Document Management & Text Extraction — Full Deep Dive

> **Goal:** After reading this, you should be able to explain every single step of how a PDF is uploaded, stored in the cloud, retrieved, lazy-parsed into plain text, cached in MongoDB, and deleted in this exact codebase.

---

## The Big Picture: All 4 Document Routes

The entry point for all document operations is [server/routes/documentRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/documentRoutes.js):

```javascript
import express from 'express';
import { uploadDocument, getDocuments, deleteDocument, getDocumentContent } from '../controllers/documentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { checkDocumentLimit } from '../middleware/usageMiddleware.js';

const router = express.Router();

router.post('/upload',      verifyToken, checkDocumentLimit, upload.single('file'), uploadDocument);
router.get('/',             verifyToken, getDocuments);
router.get('/:id/content',  verifyToken, getDocumentContent);
router.delete('/:id',       verifyToken, deleteDocument);

export default router;
```

**Important contrast with Phase 3 (Auth):** All auth routes had NO `verifyToken` because the user was not logged in yet. All document routes REQUIRE `verifyToken` because:
- You must be logged in to upload, view, or delete your documents.
- The middleware sets `req.user.id`, which every controller uses to identify whose documents to work with.
- Without the token check, any user could read or delete another user's private PDFs.

---

## Why Each HTTP Method Is Used

### Route 1: `POST /documents/upload`
*   **Why POST?** Because uploading a file is a **create** operation — it creates a new Document record in MongoDB and stores a new binary file in Cloudinary. POST is the REST verb for creating new resources.
*   **Why `multipart/form-data` instead of JSON?** JSON can only carry text. A PDF file is raw binary bytes. `multipart/form-data` is the browser encoding format designed specifically for mixed payloads — it can carry both text fields AND binary file data in the same request body.

### Route 2: `GET /documents/`
*   **Why GET?** Because we are **reading** a list of documents. No data is being created or changed.
*   **Idempotency:** GET is idempotent — calling it multiple times returns the same list without modifying database state.

### Route 3: `GET /documents/:id/content`
*   **Why GET?** Because we are **reading** the text content of a specific document. The document ID goes in the URL path (`req.params.id`).
*   **Why a separate route from Route 2?** Because parsed text can be enormous (a 100-page PDF might have 100,000+ characters). Route 2 (`GET /`) returns only metadata for all documents. Including full text in the list response would be catastrophically slow. We only fetch the text content on-demand, when someone actually opens a specific document.

### Route 4: `DELETE /documents/:id`
*   **Why DELETE?** Because we are **permanently removing** a resource. DELETE is the correct REST verb for this. The document ID goes in the URL path (`req.params.id`) — this is standard REST design.

---

## The MongoDB Document Model

### `Document.js` — Metadata for one uploaded PDF

```javascript
import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    //          ↑ ObjectId reference to the User who uploaded this
    //          required: true means a Document cannot exist without an owner

    filename:   { type: String, required: true },
    //          ↑ The original file name from the user's computer e.g. "resume.pdf"

    fileUrl:    { type: String, required: true },
    //          ↑ The full HTTPS Cloudinary URL where the PDF binary is stored
    //          e.g. "https://res.cloudinary.com/dxyz/raw/upload/v1234.../document-1234.pdf"

    publicId:   { type: String },
    //          ↑ Cloudinary's internal identifier for this file
    //          e.g. "careercraft-documents/document-1720342712341-874591823"
    //          This is needed to DELETE the file from Cloudinary later

    fileSize:   { type: Number },
    //          ↑ File size in bytes (received from Multer)

    summary:    { type: String },
    //          ↑ Optional field — reserved for AI-generated summaries

    parsedText: { type: String },
    //          ↑ LAZY CACHE — stores the extracted plain text from pdf-parse
    //          Starts as null. Only populated on first GET /documents/:id/content call
    //          After that, all subsequent calls return this cached value instantly

    isEmbedded: { type: Boolean, default: false },
    //          ↑ Handled in Phase 5: RAG. Tracks if this document has been chunked/embedded.

    chunkCount: { type: Number, default: 0 },
    //          ↑ Handled in Phase 5: RAG. Number of vector chunks created.

    uploadDate: { type: Date, default: Date.now }
    //          ↑ Auto-set to current timestamp when document is created
});

export default mongoose.model('Document', DocumentSchema);
```

---

## The Middleware Files (Line by Line)

### `uploadMiddleware.js` — Multer + CloudinaryStorage

```javascript
import multer from 'multer';
// ↑ Multer is the Node.js middleware for handling multipart/form-data
// Without this, Express cannot read binary file data from req.body

import { CloudinaryStorage } from 'multer-storage-cloudinary';
// ↑ Multer storage adapter for Cloudinary. Streams files directly to the cloud.

import cloudinary from '../config/cloudinary.js';

// ─────────────────────────────────────────────
// STEP 1: Configure WHERE files go (Cloudinary)
// ─────────────────────────────────────────────
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    // ↑ Pass the configured cloudinary instance so CloudinaryStorage knows which account to use

    params: {
        folder: 'careercraft-documents',
        // ↑ Files are organized inside this Cloudinary folder

        resource_type: 'raw',
        // ↑ CRITICAL: Cloudinary's default resource type is 'image'
        // PDFs are NOT images — they are binary documents
        // 'raw' tells Cloudinary: "store this file as-is, don't try to transform it"

        allowed_formats: ['pdf'],
        // ↑ Cloudinary-level format whitelist — only PDF files accepted

        public_id: (req, file) => {
            // ↑ Generates a unique filename for each upload in Cloudinary
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            return `document-${uniqueSuffix}`;
            // → e.g., "document-1720342712341-874591823"
        }
    }
});

// ─────────────────────────────────────────────
// STEP 2: File type validation (fileFilter)
// ─────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Only PDF files are allowed!'), false); // Reject
    }
};

// ─────────────────────────────────────────────
// STEP 3: Assemble Multer with both config pieces
// ─────────────────────────────────────────────
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Maximum 10MB limit
});

export default upload;
```

---

### `checkDocumentLimit` — `usageMiddleware.js`

```javascript
export const checkDocumentLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        // ↑ req.user.id was set by verifyToken() in the previous middleware

        if (!user) return res.status(404).json({ message: 'User not found' });

        await resetMonthlyUsageIfNeeded(user);
        // ↑ Resets usage counters if we crossed into a new calendar month

        const plan = user.subscription?.plan || 'free';
        const limits = getPlanLimits(plan);
        // ↑ Looks up plan limits (free: 3 docs, pro: 50 docs, enterprise: unlimited)

        const currentDocs = user.usage?.documentsUploaded || 0;

        if (isLimitExceeded(currentDocs, limits.documents)) {
            return res.status(403).json({
                message: 'Document upload limit reached',
                upgradeRequired: true,
                currentPlan: plan,
                limit: limits.documents,
                usage: currentDocs
            });
            // ↑ 403 Forbidden — stops the upload request before Multer is invoked
        }

        req.userDoc = user;
        // ↑ Attach the database user document to the request to avoid duplicate queries
        next();
    } catch (error) {
        console.error('[UsageMiddleware] Document limit check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
```

---

## All 4 Controllers (Line by Line)

### Flow 1: Upload Document (`POST /documents/upload`)

```javascript
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // ↑ Guard: req.file is populated by Multer after streaming to Cloudinary

        const userId = req.user.id;

        // Cloudinary returns path (URL) and filename in req.file
        const newDoc = new Document({
            user: userId,
            filename: req.file.originalname, // e.g. "resume.pdf"
            fileUrl: req.file.path,           // Cloudinary HTTPS URL
            publicId: req.file.filename,       // Cloudinary public_id
            fileSize: req.file.size
        });
        // Note: parsedText is NOT set here — it starts as null (lazy cache)

        const savedDoc = await newDoc.save();
        // ↑ Commits the Document record to MongoDB

        // ─────────────────────────────────────────
        // GAMIFICATION: Award XP (non-blocking)
        // ─────────────────────────────────────────
        let xpResult = null;
        try {
            xpResult = await awardXP(userId, XP_VALUES.UPLOAD_DOCUMENT, 'document_upload');
            await updateStreak(userId);
            await incrementUsage(userId, 'documentsUploaded');
        } catch (xpErr) {
            console.error('XP Award Error (non-blocking):', xpErr.message);
            // ↑ Non-blocking try-catch: XP issues should never fail a successful file upload
        }

        res.status(201).json({
            ...savedDoc.toObject(),
            xpAwarded: xpResult?.xpAwarded || 0
        });

    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
};
```

---

### Flow 2: Get All Documents (`GET /documents/`)

```javascript
export const getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;

        const docs = await Document.find({ user: userId }).sort({ uploadDate: -1 });
        // ↑ Queries MongoDB for all documents owned by this user
        //   .sort({ uploadDate: -1 }) sorts them newest-first

        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

---

### Flow 3: Get Document Content (`GET /documents/:id/content`)
*(Lazy Text Extraction + Lazy Cache Pattern)*

```javascript
export const getDocumentContent = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findById(id);

        if (!doc) return res.status(404).json({ message: 'Document not found' });

        // OWNERSHIP GUARD: Ensure the logged-in user owns this document
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // ↑ .toString() converts the Mongoose ObjectId into a plain string to match req.user.id

        // ─────────────────────────────────────
        // LAZY CACHE CHECK
        // ─────────────────────────────────────
        if (doc.parsedText) {
            return res.status(200).json({ content: doc.parsedText });
        }
        // ↑ CACHE HIT: Returns cached text instantly, avoiding Cloudinary fetch + pdf-parse

        // ─────────────────────────────────────
        // CACHE MISS: First time this document is opened
        // ─────────────────────────────────────
        const response = await fetch(doc.fileUrl);
        // ↑ Downloads the PDF binary from the Cloudinary URL

        if (!response.ok) {
            return res.status(404).json({ message: 'File not found on cloud storage' });
        }

        const arrayBuffer = await response.arrayBuffer();
        // ↑ Reads downloaded response as raw binary bytes

        const dataBuffer = Buffer.from(arrayBuffer);
        // ↑ Converts ArrayBuffer to a Node.js Buffer for pdf-parse

        const data = await pdf(dataBuffer);
        // ↑ pdf-parse extracts plain text from the PDF binary

        // ─────────────────────────────────────
        // CACHE SET: Store text in MongoDB for future calls
        // ─────────────────────────────────────
        doc.parsedText = data.text;
        await doc.save();

        res.status(200).json({ content: data.text });
    } catch (err) {
        console.error('Get Content Error:', err);
        res.status(500).json({ error: err.message });
    }
};
```

---

### Flow 4: Delete Document (`DELETE /documents/:id`)

```javascript
export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findById(id);

        if (!doc) return res.status(404).json({ message: 'Document not found' });

        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // ↑ Ownership guard check

        // ─────────────────────────────────────
        // STEP 1: Delete from Cloudinary
        // ─────────────────────────────────────
        if (doc.publicId) {
            try {
                await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'raw' });
                // ↑ Removes PDF file from Cloudinary storage
                //   { resource_type: 'raw' } is mandatory to delete PDFs successfully
            } catch (cloudErr) {
                console.warn('Cloudinary deletion warning:', cloudErr.message);
                // ↑ Non-fatal warning: keep deleting MongoDB record even if Cloudinary fails
            }
        }

        // ─────────────────────────────────────
        // STEP 2: Delete vector chunks (Handled in Phase 5: RAG)
        // ─────────────────────────────────────
        // [NOTE: Handled here to ensure no orphan chunks remain in MongoDB Atlas]
        // In Phase 5, we import DocumentChunk and run:
        // await DocumentChunk.deleteMany({ document: id });

        // ─────────────────────────────────────
        // STEP 3: Delete Document Metadata Record
        // ─────────────────────────────────────
        await Document.findByIdAndDelete(id);

        res.status(200).json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
```

---

## Complete Document System — Unified Flow Skeleton

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║              CAREERCRAFT-AI — DOCUMENT UPLOAD & PARSING SYSTEM FLOW                                     ║
║              From raw PDF upload → cloud storage → text extraction & lazy caching                       ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
  CONNECTION WITH PHASE 3 (Auth): Every document request starts here
═══════════════════════════════════════════════════════════════════════════════

  [React Frontend]
       │  Axios auto-sends: Authorization: Bearer <JWT token> (from localStorage)
       ▼
  verifyToken() middleware — authMiddleware.js
       │  jwt.verify(token, JWT_SECRET) → decodes user ID
       │  req.user = { id: "64abc..." }
       ├── INVALID/MISSING token ──► 401 "Unauthorized" → React redirects to /login
       └── VALID token ──► next() → document-specific middleware runs

════════════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW 1 — POST /documents/upload
  Middleware Chain: verifyToken → checkDocumentLimit → upload.single('file') → uploadDocument()
════════════════════════════════════════════════════════════════════════════════════════════════════════

  [React: user selects resume.pdf, clicks Upload]
  FormData.append('file', selectedFile)
  Axios POST /documents/upload (Content-Type: multipart/form-data)
       │
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  GATE 1 — verifyToken()  [Authentication]                                                            ║
║  req.user.id = "64abc..."  ──► next()                                                               ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  GATE 2 — checkDocumentLimit()  [Quota authorization check]                                          ║
║    plan = user.subscription?.plan || 'free'                                                         ║
║    limits = PLANS[plan].limits (free: 3 docs, pro: 50 docs)                                         ║
║    isLimitExceeded(currentCount, limit)?                                                            ║
║        ├── YES ──► 403 { upgradeRequired: true }  ✗ STOP (Before streaming file to cloud)           ║
║        └── NO  ──► req.userDoc = user ──► next()                                                     ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  GATE 3 — upload.single('file')  [Multer + Cloudinary upload]                                        ║
║    fileFilter: check application/pdf. Not PDF? ──► cb(Error) → 400 ✗ STOP                           ║
║    fileSize: size > 10MB? ──► Multer error → 413 ✗ STOP                                             ║
║    CloudinaryStorage: Streams binary PDF directly to Cloudinary folder 'careercraft-documents'      ║
║    Cloudinary responds: URL (fileUrl) + publicId                                                    ║
║    req.file is populated ──► next()                                                                 ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  CONTROLLER — uploadDocument()                                                                      ║
║    new Document({ user, filename, fileUrl, publicId, fileSize })                                    ║
║    await newDoc.save() → Saves metadata record to MongoDB (parsedText starts as null)               ║
║    [Gamification & Usage (non-blocking)]: awardXP(+25 XP), increment documentsUploaded count        ║
║    ◄─ 201 Created { ...savedDoc.toObject(), xpAwarded: 25 }                                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW 2 — GET /documents/
════════════════════════════════════════════════════════════════════════════════════════════════════════

  Axios GET /documents/
       │
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER — getDocuments()                                                                        ║
║    Document.find({ user: req.user.id }).sort({ uploadDate: -1 })                                    ║
║    ◄─ 200 OK → Array of Document metadata objects (parsedText is null)                              ║
║    ◄─ React renders: list of document cards showing filename, size, upload date                     ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW 3 — GET /documents/:id/content (Lazy Text Extraction & Cache)
════════════════════════════════════════════════════════════════════════════════════════════════════════

  [React: user clicks card to open / read the PDF]
  Axios GET /documents/64abc.../content
       │
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER — getDocumentContent()                                                                  ║
║    doc = Document.findById(id)                                                                      ║
║    Ownership check: doc.user.toString() !== req.user.id? ──► 403 ✗ STOP                             ║
║                                                                                                     ║
║    [Cache Hit Check]: doc.parsedText exists?                                                        ║
║        ├── YES ──► 200 { content: doc.parsedText } (Instant response!) ✅                           ║
║        └── NO  ──► [Cache Miss - Download & Parse]:                                                 ║
║                      fetch(doc.fileUrl) → Download PDF binary from Cloudinary                       ║
║                      Buffer.from(arrayBuffer) → Node.js Buffer                                      ║
║                      pdf(dataBuffer) → Extracts text using pdf-parse                                ║
║                      doc.parsedText = data.text                                                     ║
║                      await doc.save() → Cache text in MongoDB                                       ║
║                      ◄─ 200 { content: data.text }                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW 4 — DELETE /documents/:id
════════════════════════════════════════════════════════════════════════════════════════════════════════

  Axios DELETE /documents/64abc...
       │
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER — deleteDocument()                                                                      ║
║    doc = Document.findById(id)                                                                      ║
║    Ownership check: doc.user.toString() !== req.user.id? ──► 403 ✗ STOP                             ║
║    Step 1 ──► cloudinary.uploader.destroy(doc.publicId, { resource_type: 'raw' })                   ║
║    Step 2 ──► Deletes related AI chunks (Handled in Phase 5: RAG details)                           ║
║    Step 3 ──► Document.findByIdAndDelete(id)                                                        ║
║    ◄─ 200 { message: "Document deleted" }                                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

────────────────────────────────────────────────────────────────────────────────────────
  REAL USER LIFECYCLE TIMELINE
────────────────────────────────────────────────────────────────────────────────────────

  DAY 1 — FIRST UPLOAD
  ─────────────────────────────────────────────────────────
  User logs in (JWT token stored in localStorage)
  User uploads resume.pdf
  POST /documents/upload:
    checkDocumentLimit: User is under limit → OK ✅
    Multer streams file directly to Cloudinary
    uploadDocument: Saves metadata (parsedText starts as null)
    Gamification: +25 XP awarded
  GET /documents/ → library shows resume.pdf (no text content loaded yet)

  DAY 1 — FIRST OPEN (Lazy Extraction)
  ─────────────────────────────────────────────────────────
  User clicks to open resume.pdf card
  GET /documents/64abc.../content:
    parsedText is null (CACHE MISS)
    Server fetches binary from Cloudinary → extracts text via pdf-parse
    Saves extracted text to doc.parsedText cache in MongoDB
    Returns text to React to render the PDF reader UI

  DAY 2 — RETURNING USER (Cache works)
  ─────────────────────────────────────────────────────────
  User opens resume.pdf again
  GET /documents/64abc.../content:
    parsedText exists (CACHE HIT) → Server returns it instantly.
    No Cloudinary fetch, no pdf-parse processing time.

  DAY 3 — AI CONSUMPTION (Phase 5 Connection)
  ─────────────────────────────────────────────────────────
  User clicks "Generate Quiz" or "Create Flashcards"
  POST /ai/quiz:
    Server fetches parsedText from MongoDB (instant Cache Hit)
    Takes `.substring(0, 10000)` of the text
    Sends it to OpenAI to generate quiz questions
  
  WHEN USER DELETES FILE
  ─────────────────────────────────────────────────────────
  DELETE /documents/64abc...:
    Deletes PDF from Cloudinary using publicId
    Deletes metadata from MongoDB Document collection
    Deletes related AI vector chunks (if RAG was initialized)
```

---

## Key Interview Questions & Answers

**Q: What does Multer do and why is it necessary?**
A: Multer is Express middleware that parses `multipart/form-data` requests — the encoding browsers use when uploading files. Without it, `req.body` and `req.file` would be empty for file uploads because Express's built-in `express.json()` only handles JSON. Combined with `CloudinaryStorage`, Multer streams the binary file directly to Cloudinary without writing it to local disk.

**Q: What is the Lazy Cache pattern and why is it used for parsedText?**
A: The PDF text is not extracted at upload time. Instead, it is extracted on the first `GET /documents/:id/content` call and cached in MongoDB. Subsequent calls return the cached text instantly. This is lazy because the work only happens on-demand. The reason is efficiency: many uploaded documents are never opened. Parsing eagerly at upload would slow down every upload for no benefit in those cases.

**Q: Why must you call `doc.user.toString()` before comparing with `req.user.id`?**
A: `doc.user` is stored in MongoDB as an ObjectId (a binary type). `req.user.id` is a plain string from the JWT. Comparing them directly with `!==` would always evaluate to `true` (different types) even if they represent the same user ID. `.toString()` converts the ObjectId to its 24-character hex string so the comparison works correctly.

**Q: Why use `resource_type: 'raw'` for PDFs in Cloudinary?**
A: Cloudinary's default resource type is `'image'`. PDFs are binary documents, not images. Without `resource_type: 'raw'`, Cloudinary attempts to process the PDF as an image and rejects it. The `resource_type` used for deletion **must match** the one used for upload — if you omit it on the delete call, Cloudinary looks in the image folder, can't find the file, and leaves it orphaned in cloud storage.

**Q: How does the subscription limit check work efficiently?**
A: `checkDocumentLimit` runs BEFORE Multer. This means if a user is over their limit, we return 403 immediately — Multer never processes the file and nothing is sent to Cloudinary. This is cost-efficient: we never make a Cloudinary API call for a rejected upload. The user document is also attached to `req.userDoc` to avoid a duplicate MongoDB query in the controller.
