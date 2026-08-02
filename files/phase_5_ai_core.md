# Phase 5: AI Core & RAG — Full Deep Dive

> **Goal:** After reading this, you will understand how Generative AI works from first principles, how LLMs turn prompts into responses, how our app talks to OpenAI and Groq, how RAG works mathematically, and every single line of code that powers the AI features in CareerCraft-AI.

---

# PART 1: FOUNDATIONS OF GENERATIVE AI

*Before touching any code, you must understand what happens inside the AI.*

---

## 1.1 What is a Large Language Model (LLM)?

An LLM is a mathematical function trained on a massive amount of text. It learned one thing extremely well:

> **"Given this sequence of words, what is the most probable next word?"**

It is not searching Google. It is not looking things up in a database. It is **predicting** the next word, then the next, then the next — over and over — until the response is complete.

Under the hood, it is a **Transformer** architecture: a neural network with billions of parameters (weights) trained on trillions of words from the internet, books, code, and papers. When you send a prompt, these weights compute a probability distribution over all possible next words. The model samples from that distribution and picks the next word. This process is called **Autoregressive Generation**.

---

## 1.2 Tokens — Not Words, Not Characters

Before the model reads your text, it converts it into **tokens**. A token is roughly 3/4 of a word.

```
"Hello World"        → ["Hello", " World"]                → 2 tokens
"Generative AI"      → ["Generative", " AI"]              → 2 tokens
"antiestablishment"  → ["anti", "estab", "lishment"]       → 3 tokens
```

**Why does this matter in your code?**

Because LLMs have a **Context Window** — a maximum number of tokens they can process at once. GPT-4o-mini has a 128,000 token context window (~100,000 words). When we write:
```javascript
const context = text.substring(0, 50000);   // in chatWithDocument (Legacy Mode)
const context = text.substring(0, 10000);   // in createFlashcards / createQuiz
const context = text.substring(0, 30000);   // in generateDocumentSummary
```
We are truncating the text to avoid exceeding the model's token limit and avoid cost spikes. **This is why RAG exists** — instead of jamming a whole book into the context window, we surgically retrieve only the 5 most relevant paragraphs.

---

## 1.3 The Messages Array — How You Talk to an LLM

Every LLM API uses a **conversation format**. Your conversation is represented as an array of messages, each with a `role`:

| Role | Who Sends It | Purpose |
| --- | --- | --- |
| `system` | Your backend code | Secret instructions the user never sees. Sets the AI's personality, rules, and tone. |
| `user` | The human | The actual question or message. |
| `assistant` | The AI | The AI's previous response (used for multi-turn conversations). |

```javascript
// Full example of a messages array for the mock interview feature
const messages = [
    {
        role: "system",
        content: "You are an expert technical interviewer for the role of Backend Developer..."
        // ↑ This is invisible to the user. It sets EVERYTHING about how the AI behaves.
    },
    {
        role: "user",
        content: "What is a closure in JavaScript?"
        // ↑ The human's question
    }
    // If there was history, it would continue here alternating user/assistant
];
```

**The System Prompt is the most important prompt engineering tool you have.** Changing "You are a helpful assistant" to "You are a strict interviewer who never reveals answers directly" completely changes the AI's behavior without any code change.

## 1.4 LLM Parameters — Under the Hood (Logits, Sampling, and Penalties)

Every time we make a request to OpenAI or Groq, we pass configuration parameters like `temperature`, `top_p`, `presence_penalty`, `frequency_penalty`, `max_tokens`, `response_format`, and `seed`. To master prompt engineering, you must understand exactly how these parameters alter the mathematical operations inside the model's neural network during text generation.

---

### A. The Foundation: Logits & The Softmax Function
To understand parameters, you must first understand how an LLM decides what word to write next. 

1.  **Logits generation:** In the final layer of the neural network, the model computes a raw, unnormalized score for every single token in its vocabulary (typically around 100,000 possible tokens). These raw numerical scores are called **logits** ($z$).
2.  **Probability Conversion:** Logits can be any real number (e.g. -2.5, 12.1, 0.4). To turn these into actual percentages that sum to 100% (a probability distribution), they are passed through a mathematical function called **Softmax**:
    $$P(x_i) = \frac{e^{z_i}}{\sum_j e^{z_j}}$$
    *For example,* if the token `"React"` has a logit of `10` and `"banana"` has a logit of `-5`, $e^{10}$ is extremely large and $e^{-5}$ is tiny. Softmax converts this into a 99.9% probability for `"React"` and a 0.0001% probability for `"banana"`.

All LLM parameters modify either the **logits** before the Softmax step, or the **sampling mechanism** after the Softmax step.

---

### B. Temperature ($T$) — Probability Scaling
*   **What it is:** A hyperparameter ($T$) ranging from `0.0` to `2.0` that scales the logits before they run through the Softmax function:
    $$P(x_i) = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$$

```
Raw Logits: ["React": 8.0, "Node": 4.0, "Vue": 2.0]

LOW TEMP (T = 0.2)             DEFAULT TEMP (T = 1.0)           HIGH TEMP (T = 1.8)
Logits are divided by 0.2:      Logits remain unchanged:        Logits are divided by 1.8:
["React": 40, "Node": 20...]    ["React": 8, "Node": 4...]      ["React": 4.4, "Node": 2.2...]
Softmax result:                 Softmax result:                 Softmax result:
React: 99.9999%                 React: 97.96%                   React: 89.2%
Node:  0.0001%                  Node:   1.79%                   Node:   9.8%
Vue:   0.0000%                  Vue:    0.24%                   Vue:    1.0%
(Completely predictable)        (Standard generation)           (High chance of random choices)
```

*   **Low Temperature ($T \to 0$):** Dividing the logits by a small fraction makes the differences between them massive. The highest logit shoots up to near 100% probability, while all other options drop to 0%. The model becomes deterministic and always chooses the absolute top token. **Use T = 0.0 to 0.3 for factual RAG, code output, and JSON validation.**
*   **High Temperature ($T > 1$):** Dividing the logits by a large number shrinks the differences between them. The probability distribution flattens out (becomes "smoother"). The gap between the most likely word and the least likely word narrows, allowing the model to select lower-probability tokens. **Use T = 1.0 to 1.5 for creative writing, brainstorming, and simulation features.**

---

### C. Top_p (Nucleus Sampling) — Vocabulary Cutoff
*   **What it is:** An alternative to temperature that limits the token selection pool based on **cumulative probability** rather than scaling logits.
*   **How it works:**
    1.  The model generates probabilities for all vocabulary tokens.
    2.  It sorts the tokens from highest probability to lowest.
    3.  It adds up their probabilities one by one starting from the top.
    4.  The moment the cumulative sum reaches $P$ (e.g. `0.9` or 90%), the model **discards** all remaining lower-probability tokens.
    5.  It samples the next word *only* from that top 90% pool.

```
Sorted Probabilities:
1. "React" (70%) ── Cumulative: 70%
2. "Node"  (15%) ── Cumulative: 85%
3. "Vue"   (10%) ── Cumulative: 95%  <── CUTOFF HIT! (top_p = 0.9)
----------------------------------------
4. "Java"  (3%)  ── Discarded
5. "HTML"  (2%)  ── Discarded
```

*   **Why not change both `temperature` and `top_p`?** Because they both alter the sampling pool in conflicting ways. Changing both makes it extremely difficult to predict or debug output behavior. It is best practice to keep one at its default value (`1.0`) and adjust the other.

---

### D. Presence Penalty vs. Frequency Penalty — Repetition Blockers
Both of these parameters modify the raw logits ($z$) of tokens *as they are being generated* to prevent the AI from repeating itself. The mathematical adjustment is:
$$z'_i = z_i - (c_i \times \alpha_f) - (p_i \times \alpha_p)$$
Where:
*   $c_i$ is the count of how many times that token has already appeared in the generated response.
*   $\alpha_f$ is the `frequency_penalty` value (`-2.0` to `2.0`).
*   $p_i$ is a binary indicator (`1` if the token has appeared at least once, `0` if not).
*   $\alpha_p$ is the `presence_penalty` value (`-2.0` to `2.0`).

#### 1. Frequency Penalty ($\alpha_f$)
*   **Math:** The penalty scales dynamically with the frequency count ($c_i$). If a token appears 5 times, its logit is reduced by $5 \times \alpha_f$.
*   **Effect:** Actively discourages the model from repeating **exact words, sentences, or phrases**. If the model keeps writing `"React"` over and over, its logit drops lower and lower, forcing the model to choose synonyms.

#### 2. Presence Penalty ($\alpha_p$)
*   **Math:** The penalty is a flat deduction applied to *any* token that has appeared at least once ($p_i = 1$). It does not matter if the token has appeared once or a hundred times—the penalty is the same.
*   **Effect:** Discourages the model from staying on the **same topic**. By penalizing all words related to the current subject once they have been introduced, it forces the network to pivot to new subjects, promoting a wider variety of ideas.

---

### E. Max Tokens — The Hard Loop Break
*   **How it works:** Under the hood, LLM text generation is a `while` loop that runs on the server:
    ```javascript
    let loopCount = 0;
    while (loopCount < max_tokens) {
        const nextToken = sampleNextToken(modelOutput);
        if (nextToken === END_OF_TEXT_TOKEN) break;
        outputText += nextToken;
        loopCount++;
    }
    ```
*   **Effect:** If the loop count reaches `max_tokens`, the generation is forcefully broken mid-loop. The server immediately packages whatever text it has generated up to that point and returns it with a `finish_reason: "length"`.
*   **Cost Management:** Always set a sensible `max_tokens` for user-facing features to prevent run-away AI loops from exhausting your API budget.

---

### F. Response Format: JSON Mode (`{ type: "json_object" }`)
*   **How it works:** This does not simply ask the model to write JSON; it uses a technique called **constrained decoding (grammar-guided sampling)**.
*   **Deep Mechanics:** The sampling engine monitors the syntax of the text as it is generated. It actively parses the generated output character-by-character. If the model has just written:
    `{ "name": `
    The engine knows that JSON syntax rules *only* allow a string, a number, `[`, `{`, or `null` to follow a colon. The engine automatically **masks** the logits of all invalid tokens (like commas, brackets, or random letters) by setting their logit values to $-\infty$. This forces the Softmax output for those invalid characters to 0%, making it physically impossible for the model to generate syntax-violating JSON.

---

### G. Seed — Determinism in Parallel Computing
*   **The Problem:** Normally, even with `temperature: 0.0`, GPUs are not 100% deterministic. Because modern GPUs execute thousands of mathematical calculations in parallel, floating-point rounding errors happen in slightly different orders depending on hardware thread scheduling. This can result in minor differences in the logits.
*   **How Seed Works:** By specifying an integer `seed` (e.g. `12345`), the server forces the GPU to use deterministic arithmetic execution paths and initializes the pseudo-random number generator (PRNG) with a static state. This ensures that you get identical token outputs for identical inputs, making it invaluable for automated tests and system debugging.

---

## 1.5 What is RAG? (Retrieval-Augmented Generation)

RAG is a pattern that solves the LLM's biggest problem: **hallucination and outdated knowledge**.

A raw LLM doesn't know what's in your PDF. If you ask "What is my GPA?", it has no idea — it will make something up. RAG fixes this by:

1. **Storing your document's text as mathematical vectors** (numbers that represent the *meaning* of text)
2. **When a question arrives, converting it into the same vector format**
3. **Finding the stored vectors most *mathematically similar* to the question vector** (this finds the most relevant paragraphs)
4. **Injecting those paragraphs directly into the prompt** sent to the LLM

Now the LLM can answer from real evidence. It is grounded in your actual document.

```
WITHOUT RAG:
  User: "What is my GPA?"
  LLM: (invents answer) "Your GPA is 3.5." ← HALLUCINATION

WITH RAG:
  User: "What is my GPA?"
  System retrieves from your PDF: "John Doe, GPA: 3.9 / 4.0"
  LLM receives: "Answer from this context: [John Doe, GPA: 3.9 / 4.0]. Question: What is my GPA?"
  LLM: "Your GPA is 3.9 out of 4.0." ← GROUNDED IN REALITY
```

---

## 1.5.1 The RAG Ingestion Pipeline — Deep Theory (Small vs. Enterprise Scale)

To make a document searchable by a Vector Database, we cannot just throw a 100-page PDF at it. We must run it through the **Ingestion Pipeline**. This is the process of extracting, cutting, transforming, and saving unstructured document text into structured vector coordinates.

```
[Raw PDF Document]
       │
       ▼  Step 1: Document Parsing & Layout Extraction (pdf-parse)
[Raw text stream string]
       │
       ▼  Step 2: Cleaning & Normalization (collapsing spaces, line breaks)
[Cleaned text string]
       │
       ▼  Step 3: Text Chunking / Splitting (Recursive Character Splitter)
[Array of 500-character string segments (chunks)]
       │
       ▼  Step 4: Vector Embedding Generation (Jina AI Passage API)
[Array of 1024-dimensional floating point vectors]
       │
       ▼  Step 5: Indexing & Storage (MongoDB Atlas DocumentChunk collection)
[Vector Index / HNSW Graph ready for query search]
```

---

### A. Step 1 & 2: Parsing and Cleaning
*   **The Problem:** PDFs are visual drawing instructions, not text files. A PDF tells the computer: *"Draw character 'A' at coordinate (X, Y) on page 3."* It has no concept of paragraphs, columns, headers, or footnotes.
*   **The Solution:** Parsers (like `pdf-parse` in Node or `PyPDF` in Python) read the drawing commands sequentially to reconstruct the text stream. Cleaning filters out junk like duplicate white space (`/ {3,}/`), tabs, and corrects line endings (`\r\n` to `\n`) to ensure the text flows naturally before splitting.

---

### B. Step 3: Text Chunking Strategies
Why can't we embed a whole page or a whole document at once?
1.  **Semantic Resolution:** If you embed a 10-page document as a single vector, the vector represents the "average" meaning of the whole file. Specific details (like a single phone number or a specific tech skill) get washed out.
2.  **Context Limitations:** If we find a match, we must send the matching text to the LLM. If our chunks are too big, we will exceed the LLM's context window.

There are three primary chunking methods:

#### 1. Recursive Character Chunking (Our Method)
*   **How it works:** It uses a list of separators (typically `\n\n`, `\n`, `.` (sentence ends), `" "` (words)) in priority order. It tries to split the text by paragraph first. If a paragraph is larger than `500` characters, it tries to split it by sentence. If a sentence is too long, it splits by word.
*   **Pro:** Highly reliable, preserves sentence boundaries, simple.
*   **Con:** Ignores the actual visual structure of the document (like tables or columns).

#### 2. Semantic Chunking (Advanced Vector Splitting)
*   **How it works:** Instead of cutting by character count, it reads the document sentence by sentence. It generates an embedding vector for each sentence and calculates the cosine distance between consecutive sentences. If the meaning shifts significantly (a spike in cosine distance), it places a chunk boundary there.
*   **Pro:** Chunks are grouped strictly by topical consistency.
*   **Con:** Computationally slow and expensive (requires embedding every sentence individually).

#### 3. Structure-Aware / Layout Chunking
*   **How it works:** Parses the document's visual tree (Markdown headers, tables, charts, sections). It groups table rows together and keeps bulleted lists intact, treating document divisions as natural boundaries.
*   **Pro:** Essential for parsing complex spreadsheets, financial charts, and textbooks.
*   **Con:** Requires highly sophisticated visual layout analysis engines.

---

### C. Step 4 & 5: High-Dimensional Embeddings & Vector Space
When we send a chunk of text to Jina AI, it returns an array of **1,024 floating point numbers**. 

Imagine a 3D graph with an X, Y, and Z axis. A point on this graph is defined by 3 coordinates: `[x, y, z]`.
An embedding is the exact same thing, but on a graph with **1,024 axes**. This is a **1,024-dimensional vector space**. 

*   Each coordinate (dimension) represents an abstract semantic concept (e.g., gender, tense, technicality, emotion, programming context).
*   During model training, the embedding network positions words and concepts that share similar meanings close to one another in this space.
*   **Cosine Similarity** calculates the angle between these 1,024-dimensional lines. If the angle is 0 degrees, their direction is identical, meaning their similarity score is `1.0` (closest semantic match).

---

### D. The Search Index: How HNSW Graph Indexing Works
If you have 10,000 documents, you might end up with **1,000,000 chunks**. When a user asks a question, calculating the cosine similarity of the question against all 1,000,000 chunks sequentially takes too much time (an $O(N)$ operation). 

To solve this, vector databases build an **HNSW (Hierarchical Navigable Small World)** index.

```
Layer 2 (Express Expressway) ─────► [Node A] ────────────────────────► [Node G]
                                        │                                │
Layer 1 (State Highway) ───────► [Node A] ─────► [Node C] ──────────► [Node G] ───► [Node J]
                                    │               │                    │           │
Layer 0 (Local Streets - Raw Chunks)► [A] ──► [B] ──► [C] ──► [D] ──► [E] ──► [F] ──► [G] ──► [H] ──► [I] ──► [J]
```

#### The HNSW Logic:
1.  **Graph Layers:** HNSW builds a multi-layered graph similar to a "Skip List." 
2.  **Top Layers (Coarse):** Have fewer nodes and long connections. The search query jumps rapidly across wide semantic gaps (like jumping between "Sports" and "Technology").
3.  **Bottom Layers (Fine):** Contain all vector nodes close together. Once the query lands near the correct topical cluster in the top layers, it descends to the bottom layer to do a localized search for the exact matching chunks.
4.  This reduces search time from $O(N)$ (scanning everything) to $O(\log N)$ (navigating the graph), returning matches in milliseconds.

---

### E. Small Scale (Our Setup) vs. Enterprise Scale RAG Ingestion

As a developer, you must know how to scale RAG from a local prototype to an enterprise-grade engine.

| Pipeline Phase | Small Scale Setup (CareerCraft-AI) | Enterprise Production Scale (Large Corp) |
| :--- | :--- | :--- |
| **Parsing Engine** | `pdf-parse` (Extracts simple, raw sequential text stream). | **Layout OCR Engines** (e.g. *Azure Document Intelligence*, *Unstructured.io*, *Amazon Textract*). They parse document tables as clean HTML, maintain page layouts, and OCR scanned images. |
| **Chunking Logic** | **Static Character Splitter:** Cuts text every 500 characters, ignoring structural document shifts. | **Semantic & Structural Splitters:** Splitting occurs exactly at Markdown headers (`#`, `##`), document page boundaries, or when semantic topic shifts are detected. |
| **Inference Broker** | Direct Cloud API calls in the main application request loop (blocking). | **Asynchronous Job Queues:** (e.g. *Celery*, *BullMQ*, *Apache Spark*). Large PDFs are pushed to background workers to process chunks and generate embeddings in parallel using self-hosted local engines (*vLLM*, *Triton*). |
| **Vector Database** | **Relational Extension:** MongoDB Atlas Vector Search (Simple HNSW index sitting on top of a standard database). | **Dedicated Distributed Vector Store:** (*Pinecone*, *Qdrant*, *Milvus*, *Weaviate*). Optimized for sharded, high-write environments, supporting billions of vectors and metadata filtering at scale. |
| **Retrieval Strategy** | **Simple Vector Match:** Embed the query and return the top 5 chunks with highest Cosine Similarity. | **Hybrid Search + Reranking:** <br>1. Queries are run using *Hybrid Search* (Dense Vector similarity + Sparse Keyword BM25 match) to find exact keywords. <br>2. Results are sent to a *Reranker* model (like *Cohere Rerank* or *BGE-Reranker*) which re-evaluates the matches using a slow, ultra-accurate cross-encoder model to return only the best 3 chunks. |

---

## 1.6 Embeddings — Turning Text into Math

An **embedding** is a fixed-length array of floating-point numbers that represents the *semantic meaning* of a piece of text.

```
"My GPA is 3.9"         → [0.23, -0.87, 0.45, 0.12, ...]  (1024 numbers)
"What is my grade?"     → [0.21, -0.85, 0.47, 0.14, ...]  (1024 numbers — very similar!)
"I love pizza"          → [-0.76, 0.33, -0.89, 0.44, ...]  (very different numbers)
```

The key idea: **similar meaning → similar numbers**. This allows us to find relevant text using math instead of keyword matching.

**Cosine Similarity** is the math used to compare two vectors:
- Result of **1.0** = identical meaning
- Result of **0.0** = completely unrelated
- Result of **-1.0** = opposite meaning

MongoDB Atlas's `$vectorSearch` computes cosine similarity between your question vector and every stored chunk vector, then returns the top K most similar.

---

## 1.7 Two LLMs: OpenAI (GPT-4o-mini) vs Groq (Llama 3.3 70B)

Our app uses two different AI providers for different tasks:

| Feature | OpenAI — `gpt-4o-mini` | Groq — `llama-3.3-70b-versatile` |
| --- | --- | --- |
| **Used for** | Flashcards, Quizzes, Summaries, Chat (Legacy Mode), Interviews | Chat (RAG Mode only) |
| **Strength** | Consistent quality, JSON mode, reliable | Ultra-fast inference (~500 tokens/second) |
| **Cost** | Pay-per-token | Very cheap / free tier available |
| **API Compatibility** | OpenAI SDK | OpenAI-compatible SDK (same message format) |
| **Speed** | ~2-5 seconds | ~0.5-1 second |
| **Temperature** | Default (not set explicitly) | 0.3 (strict, factual) |

**Why use Groq for RAG?** Because RAG chat is the most latency-sensitive feature. The user typed a question and is waiting for an answer. Groq's free tier is blazing fast — the same Llama 3.3 70B model but served on Groq's custom hardware (LPU chips) that is 10-20x faster than OpenAI.

---

# PART 2: THE ROUTES

All AI routes are registered in [server/routes/aiRoutes.js](file:///E:/Projects/CareerCraft-AI/server/routes/aiRoutes.js):

```javascript
import express from 'express';
import { chatWithDocument, generateDocumentSummary, createFlashcards, createQuiz,
         getDecks, getQuizzes, updateQuizScore, generateText, embedDocument }
         from '../controllers/aiController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { checkChatLimit, checkQuizLimit, checkFlashcardLimit } from '../middleware/usageMiddleware.js';

const router = express.Router();

router.post('/chat',              verifyToken, checkChatLimit,      chatWithDocument);
router.post('/summary',           verifyToken, checkChatLimit,      generateDocumentSummary);
router.post('/generate',          verifyToken, checkChatLimit,      generateText);
router.post('/embed',             verifyToken,                      embedDocument);
router.get('/flashcards',         verifyToken,                      getDecks);
router.post('/flashcards',        verifyToken, checkFlashcardLimit, createFlashcards);
router.get('/quiz',               verifyToken,                      getQuizzes);
router.post('/quiz',              verifyToken, checkQuizLimit,      createQuiz);
router.put('/quiz/:id/score',     verifyToken,                      updateQuizScore);
```

---

## Why Each HTTP Method Is Used

---

### 1. `POST /ai/chat`

#### A. Data Sent & Technical Format
*   **Request Headers:** 
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String, required to extract `req.user.id`).
    *   `Content-Type`: `application/json` (Tells Express to parse the body using `express.json()`).
*   **Request Body (`req.body`):** JSON object containing:
    *   `documentId`: String (24-character hexadecimal MongoDB ObjectId representing the PDF).
    *   `question`: String (The user's query text, e.g., *"What is my GPA?"*).
    *   `useRAG`: Boolean (Flag indicating whether to retrieve vector context or read the whole document).
*   **Response Body (`res.json`):** JSON object:
    *   `answer`: String (The text response generated by Llama 3.3 or GPT-4o-mini).
    *   `mode`: String (Indicates the backend engine used: `"rag-groq"` or `"openai"`).
    *   `xpAwarded`: Number (The XP points granted by the gamification system).

#### B. REST Philosophy: Why `POST` is the Perfect Fit
*   **JSON Payload Capacity vs. URL Limitations:** A user's query (`question`) can be extremely long, sometimes containing paragraphs of text. In REST, `GET` requests must pass their parameters inside the URL query string (e.g., `/ai/chat?question=abc...`). However, browsers, reverse proxies, and servers enforce strict URL length limits (typically 2,048 characters). If a query exceeds this, the browser will truncate the URL, resulting in a syntax error or incomplete data. `POST` sends parameters inside the HTTP Request Body (`req.body`), which has no practical length limit.
*   **Database Mutation (Side Effects):** Under the HTTP/1.1 specification (RFC 7231), `GET` must be a "safe" and "idempotent" operation—it must not alter the state of the database. However, chatting with a document triggers a state mutation: it increments the user's `usage.aiChatQueries` counter, awards XP to their profile, and updates their last activity date to maintain their streak. 
*   **Security Logs & Privacy:** URLs are routinely written to browser history, proxy server logs, and backend server access logs (like Nginx or Apache logs). If a user asks a highly confidential question about their resume or financial document, a `GET` URL would leak this private data into these plain-text logs. `POST` bodies travel in the request payload, which is encrypted under HTTPS and never written to access logs.
*   **Avoiding Stale Caches:** Browsers and CDNs aggressively cache `GET` responses. If the user asks the same question multiple times, the browser might serve a stale, cached answer instead of querying the backend. `POST` requests are never cached by default, ensuring a fresh AI execution for every prompt.

---

### 2. `POST /ai/summary`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
    *   `Content-Type`: `application/json`.
*   **Request Body (`req.body`):** JSON object containing:
    *   `documentId`: String (24-hex ObjectId of the target PDF).
*   **Response Body (`res.json`):** JSON object:
    *   `summary`: String (The AI-generated summary of the PDF).

#### B. REST Philosophy: Why `POST` is the Perfect Fit
*   **State Modification (Side Effect):** This endpoint does not just fetch data; it performs a **write operation** to the database. Once OpenAI generates the summary, the controller saves it directly to the Document record:
    ```javascript
    doc.summary = summary;
    await doc.save();
    ```
    This changes the state of the document resource on the server. Since it modifies database state, `POST` is the correct semantic verb.
*   **Preventing Search Crawler Abuse:** Search engine bots and browser pre-fetchers actively scan `GET` links to index pages. If this route were a `GET` (e.g. `GET /ai/summary/:id`), crawlers could accidentally hit this endpoint, triggering expensive API calls to OpenAI and depleting your budget. `POST` endpoints are ignored by crawlers.

---

### 3. `POST /ai/generate`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
    *   `Content-Type`: `application/json`.
*   **Request Body (`req.body`):** JSON object containing:
    *   `prompt`: String (The instructions or questions).
    *   `systemInstruction`: String (Optional system guidance).
*   **Response Body (`res.json`):** JSON object:
    *   `text`: String (Generated response).

#### B. REST Philosophy: Why `POST` is the Perfect Fit
*   **Processing Arbitrary Operations:** This is a utility endpoint designed to run generic AI tasks (such as spelling correction, text expansion, or resume tailoring). In REST API design, when you are invoking an "action" or a "remote procedure call" (RPC) rather than reading a specific resource, `POST` is the designated verb because it signals an active calculation.
*   **Safety of Secret Instructions:** System instructions might contain proprietary formatting codes or secret system rules. Putting these in the URL of a `GET` request makes them vulnerable to exposure. Sending them via `POST` keeps the prompt content private.

---

### 4. `POST /ai/embed`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
    *   `Content-Type`: `application/json`.
*   **Request Body (`req.body`):** JSON object containing:
    *   `documentId`: String (24-hex ObjectId).
*   **Response Body (`res.json`):** JSON object:
    *   `message`: String (e.g., `"Document embedded successfully"`).
    *   `chunkCount`: Number (Total chunks created).
    *   `isEmbedded`: Boolean (`true`).

#### B. REST Philosophy: Why `POST` is the Perfect Fit
*   **Heaviest Database Write Event:** This route initiates the entire RAG ingestion pipeline. It deletes existing vector records and writes hundreds of new `DocumentChunk` documents. In REST semantics, creating nested sub-resources (i.e. creating chunks *belonging* to a document) is always mapped to a `POST` request.
*   **Long-Running Server Calculations:** Chunking and embedding a document takes several seconds and involves external network calls to Jina AI. `POST` is the appropriate method because it is used for executing expensive "actions" that start long-running tasks on the server.

---

### 5. `GET /ai/flashcards`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
*   **Request Body:** Completely Empty.
*   **Response Body (`res.json`):** JSON Array of existing flashcard deck objects:
    ```json
    [
      {
        "_id": "64deck123",
        "user": "64user456",
        "title": "Deck: resume.pdf",
        "cards": [{ "front": "Q", "back": "A", "pinned": false }],
        "createdAt": "2024-07-09T00:00:00.000Z"
      }
    ]
    ```

#### B. REST Philosophy: Why `GET` is the Perfect Fit
*   **Pure Read-Only Access:** This route does not call external AI APIs, calculate embeddings, or write to MongoDB. It queries MongoDB and returns the list of decks. 
*   **Idempotency & Safety:** Because it is read-only, it is perfectly safe to call thousands of times. It does not modify server state. In REST, any resource retrieval operation *must* use `GET` to enable HTTP cache-control and browser pre-fetching optimization.

---

### 6. `POST /ai/flashcards`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
    *   `Content-Type`: `application/json`.
*   **Request Body (`req.body`):** JSON object containing:
    *   `documentId`: String (24-hex ObjectId).
    *   `deckTitle`: String (Optional name for the deck).
*   **Response Body (`res.json`):** JSON object representing the newly created deck:
    ```json
    {
      "_id": "64deck123",
      "user": "64user456",
      "document": "64doc789",
      "title": "React Interview Prep",
      "cards": [{ "front": "What is state?", "back": "An object that holds component data." }],
      "xpAwarded": 20
    }
    ```

#### B. REST Philosophy: Why `POST` is the Perfect Fit
*   **Creating a New Resource:** This route generates and saves a **brand-new resource** (a `FlashcardDeck` document) into the MongoDB collection. According to REST standards, creating a new resource where the database assigns the unique identifier (`_id`) must use `POST`.

---

### 7. `GET /ai/quiz`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
*   **Request Body:** Empty.
*   **Response Body (`res.json`):** JSON Array of existing Quiz documents.

#### B. REST Philosophy: Why `GET` is the Perfect Fit
*   **Read-Only Collection Retrieval:** Same as `GET /ai/flashcards`. It retrieves historical quiz attempts. Since it only reads data and makes no database changes, `GET` is the correct semantic verb.

---

### 8. `POST /ai/quiz`

#### A. Data Sent & Technical Format
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
    *   `Content-Type`: `application/json`.
*   **Request Body (`req.body`):** JSON object containing:
    *   `documentId`: String (24-hex ObjectId).
    *   `numQuestions`: Number (Optional, quantity of questions to generate).
    *   `questions`: Array (Optional, array of pre-built questions to skip AI generation).
*   **Response Body (`res.json`):** JSON object of the newly created Quiz resource:
    ```json
    {
      "_id": "64quiz123",
      "user": "64user456",
      "title": "Quiz: Node.js Guide",
      "questions": [{ "question": "...", "options": ["..."], "correctAnswer": "...", "explanation": "..." }],
      "score": 0,
      "totalQuestions": 5
    }
    ```

#### B. REST Philosophy: Why `POST` is the Perfect Fit
*   **Creating a Resource:** It creates a new `Quiz` document. It also consumes OpenAI resources to generate the questions and answers. Because it writes a new record into MongoDB, it uses the standard creation verb `POST`.

---

### 9. `PUT /ai/quiz/:id/score`

#### A. Data Sent & Technical Format
*   **URL Path Parameter (`req.params`):**
    *   `:id` = The 24-character hex ObjectId of the *existing* Quiz (e.g. `/ai/quiz/64quiz123/score`).
*   **Request Headers:**
    *   `Authorization`: `Bearer <JWT_TOKEN>` (String).
    *   `Content-Type`: `application/json`.
*   **Request Body (`req.body`):** JSON object containing:
    *   `score`: Number (The user's final score, e.g., `4`).
*   **Response Body (`res.json`):** The updated Quiz object showing the saved score, plus `xpAwarded` field.

#### B. REST Philosophy: Why `PUT` is the Perfect Fit vs. `POST` or `PATCH`
*   **Updating an Existing Resource:** We are modifying an already existing Quiz document that was created earlier in the lifecycle (the user was served the questions via `POST /ai/quiz`, completed the quiz locally, and is now sending the results).
*   **Idempotency of Updates:** In REST standards, `PUT` is designed to update an existing resource such that repeated identical requests produce the same state. If React sends `PUT /ai/quiz/64quiz123/score` with `{ score: 4 }` multiple times (e.g., due to a slow network connection or clicking the submit button twice), the quiz score is updated to `4` each time. The database state remains identical. This matches the idempotency rule of `PUT`.
*   **Why not `PATCH`?** While `PATCH` is for partial updates (updating only the `score` field), `PUT` is commonly used in APIs to submit a replacement payload for a specific sub-resource path (in this case, updating the `/score` sub-resource of the quiz). Either `PUT` or `PATCH` is semantically correct, but `PUT` makes the replacement of the score value explicit.
*   **Path Identification:** The specific quiz instance is identified directly in the URL path (`/quiz/:id/score`), which is the standard REST pattern for targeting an update on a specific resource, unlike `POST` which typically targets the root collections (like `/quiz`).

---

# PART 3: THE SERVICES

## The OpenAI Service (`openaiService.js`)

### The Client Setup

```javascript
import OpenAI from 'openai';
// ↑ The official OpenAI Node.js SDK
//   This SDK wraps all HTTP calls to api.openai.com into simple function calls
//   Without it, you'd have to write raw fetch() calls with headers, body parsing, etc.

import dotenv from 'dotenv';
dotenv.config();
// ↑ Loads OPENAI_API_KEY from .env file into process.env

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("⚠️ OPENAI_API_KEY is not configured in .env!");
}
// ↑ Early warning — if the key is missing, ALL AI features will silently fail

const openai = new OpenAI({ apiKey: apiKey });
// ↑ Creates the singleton OpenAI client
// All service functions use this one client — no need to create a new connection per request
// This is the Singleton pattern: one shared instance for the life of the server process
```

---

### `retryWithBackoff()` — The Reliability Layer

This is the most important utility in the entire AI layer. Every single AI call goes through this function.

```javascript
const retryWithBackoff = async (fn, fallbackValue, retries = 3, delay = 2000) => {
    // fn            = the actual async function to run (wraps the OpenAI call)
    // fallbackValue = what to return if ALL retries fail (mock data for UI)
    // retries       = how many times to retry before giving up (default 3)
    // delay         = milliseconds to wait before first retry (default 2000ms = 2 seconds)

    try {
        return await fn();
        // ↑ First attempt: run the function immediately
        //   If it succeeds, return the result and we're done — retries never trigger
    } catch (error) {
        const status = error.status || (error.response && error.response.status);
        // ↑ Extract the HTTP status code from the error
        //   OpenAI SDK errors have .status property
        //   Some older error formats have .response.status

        const errorMessage = error.message || '';

        const isRateLimit = status === 429
            || errorMessage.includes('429')
            || errorMessage.includes('Quota')
            || errorMessage.includes('Too Many Requests');
        // ↑ 429 = "Too Many Requests" — we've exceeded our API rate limit
        //   OpenAI rate limits are per-minute and per-day token counts
        //   We check both the status code AND message string to be safe

        const isTransient = (status >= 500 && status < 600)
            || errorMessage.includes('503')
            || errorMessage.includes('Overloaded');
        // ↑ 5xx = server-side errors at OpenAI's end (their servers are temporarily down)
        //   503 = Service Unavailable (OpenAI is overloaded)
        //   These are worth retrying because they resolve on their own

        if (retries > 0 && (isRateLimit || isTransient)) {
            console.warn(`[OpenAI] Retrying due to status ${status}. Retries left: ${retries}`);

            await new Promise(resolve => setTimeout(resolve, delay));
            // ↑ Wait for `delay` milliseconds before retrying
            //   First retry waits 2 seconds
            //   new Promise + setTimeout is the standard async sleep pattern in Node.js

            return retryWithBackoff(fn, fallbackValue, retries - 1, delay * 2);
            // ↑ Recursive call with:
            //   retries - 1 → decrements the counter
            //   delay * 2   → doubles the wait time (Exponential Backoff)
            //   Backoff pattern: wait 2s → wait 4s → wait 8s
            //   WHY Exponential? If OpenAI is overloaded, hammering it every second makes it worse.
            //   Increasing wait gives the service time to recover.
        }

        if (isRateLimit) {
            console.warn("[OpenAI] Rate limit exhausted. Using Mock Data fallback.");
            return fallbackValue;
            // ↑ After ALL retries fail on a rate limit, return mock data
            //   This keeps the UI usable — user sees sample flashcards, not an error screen
            //   This is the GRACEFUL DEGRADATION pattern
        }

        console.error("Non-retriable OpenAI Error:", errorMessage);
        throw error;
        // ↑ Re-throw errors that are NOT worth retrying:
        //   400 Bad Request = our code sent invalid data (bug in our prompt)
        //   401 Unauthorized = API key is wrong (configuration problem)
        //   These are developer errors — retrying won't fix them
    }
};
```

**Exponential Backoff Timeline:**
```
Attempt 1: immediate → fails (429)
Wait 2 seconds
Attempt 2: retries=2, delay=2000 → fails again (429)
Wait 4 seconds
Attempt 3: retries=1, delay=4000 → fails again (429)
Wait 8 seconds
Attempt 4: retries=0 → falls through to fallbackValue
Returns mock data
```

---

### `summarizeText()` — Simple Prompt, Simple Response

```javascript
export const summarizeText = async (text) => {
    return retryWithBackoff(async () => {
        const prompt = `Summarize the following text concisely, highlighting key points:\n\n${text}`;
        // ↑ Template literal builds the prompt by injecting the text
        //   \n\n creates a blank line between the instruction and the actual text
        //   This blank line helps the LLM understand where instruction ends and content begins

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            // ↑ gpt-4o-mini is the cheapest and fastest OpenAI model
            //   It is GPT-4 quality but 10x cheaper than gpt-4o
            //   Ideal for text processing tasks like summarization

            messages: [{ role: "user", content: prompt }]
            // ↑ Simple single-turn conversation
            //   No system prompt needed — the task is self-contained in the user message
        });

        return response.choices[0]?.message?.content || "";
        // ↑ response.choices is an array because the API can return multiple alternatives
        //   We always use index [0] — the first (and usually only) response
        //   .message.content = the text the AI generated
        //   || "" = fallback to empty string if content is somehow null
    }, "This is a simulated summary because the AI service is currently unavailable...");
    // ↑ The second argument is the fallback mock value if all retries fail
};
```

---

### `generateFlashcards()` — Structured JSON Output

This is more complex because we need the AI to return data in a specific JSON format, not just free-form text.

```javascript
export const generateFlashcards = async (text) => {
    return retryWithBackoff(async () => {
        const prompt = `Create 5 flashcards from the following text. You MUST return a JSON object with a single "cards" key containing an array of objects: { "front": string, "back": string }.\n\nText: ${text}`;
        // ↑ PROMPT ENGINEERING: We are explicitly telling the AI the exact JSON structure
        //   We use "You MUST" to be forceful — without this, the AI sometimes returns
        //   prose text saying "Here are your flashcards..." followed by JSON
        //   The "cards" key is required because response_format:json_object must have a root object,
        //   not a root array (JSON spec quirk that OpenAI enforces)

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful study assistant. You output structured JSON data only. The root element must be a valid JSON object."
                    // ↑ System prompt reinforces JSON-only behavior
                    //   "root element must be a valid JSON object" prevents the AI from
                    //   wrapping its JSON in a root array []
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
            // ↑ This is OpenAI's "JSON mode" — a special feature that GUARANTEES
            //   the AI will always output valid, parseable JSON
            //   Without this, the AI might add explanatory text around the JSON
            //   which would break JSON.parse() and crash our app
        });

        const content = response.choices[0]?.message?.content || "{}";
        // ↑ Default to "{}" (empty object) if content is null

        const parsed = JSON.parse(content);
        // ↑ Parse the JSON string into a JavaScript object
        //   JSON.parse throws a SyntaxError if the string is not valid JSON
        //   This would be caught by retryWithBackoff and trigger a retry or fallback

        return parsed.cards || [];
        // ↑ Extract the "cards" array
        //   || [] = if the AI returned a JSON object without a "cards" key, return empty array
        //   This prevents "undefined is not iterable" crashes downstream

    }, [
        { front: "What is the status of the AI?", back: "It is currently rate-limited." },
        { front: "What is this?", back: "This is a mock flashcard." },
        // ↑ Fallback mock data: a complete array of card objects
        //   React can render these exactly like real flashcards
        //   User sees a working UI even when OpenAI is down
    ]);
};
```

---

### `generateQuiz()` — Same Pattern, Different Structure

```javascript
export const generateQuiz = async (text, numQuestions = 5) => {
    return retryWithBackoff(async () => {
        const prompt = `Generate ${numQuestions} multiple-choice questions from the text. You MUST return a JSON object with a single "questions" key containing an array of objects: { "question": string, "options": string[], "correctAnswer": string, "explanation": string }.\n\nText: ${text}`;
        // ↑ numQuestions is dynamic — caller can request 3, 5, or 10 questions
        //   The JSON schema in the prompt is very specific:
        //   - "options": string[]  →  array of 4 answer choices
        //   - "correctAnswer"      →  must match one of the options exactly
        //   - "explanation"        →  why the correct answer is correct (learning value)

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful study assistant. You output structured JSON data only. The root element must be a valid JSON object." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        return parsed.questions || [];
    }, [/* mock questions array as fallback */]);
};
```

---

### `getInterviewResponse()` — Multi-Turn Conversation + System Prompt Engineering

This is the most sophisticated prompt in the app — it builds a full multi-turn interview conversation.

```javascript
export const getInterviewResponse = async (history, message, role, difficulty, company = "", skills = []) => {
    return retryWithBackoff(async () => {
        const skillsStr = skills && skills.length > 0 ? `Skills to assess: ${skills.join(", ")}.` : "";
        const companyStr = company ? `Target Company: ${company}. (Adopt the interview style of this company if known).` : "";
        // ↑ Dynamic prompt building — conditionally adds company and skills context
        //   If no company is provided, we don't inject a misleading placeholder

        const systemInstruction = `You are an expert technical interviewer for the role of ${role}. Difficulty: ${difficulty}.
        ${companyStr}
        ${skillsStr}
        Conduct a technical interview. Ask questions one by one. 
        Start by introducing yourself and testing the candidate on the specified skills.
        Provide feedback if the user answers incorrectly. 
        Keep responses professional but encouraging.
        
        IMPORTANT: Format your responses using Markdown for better readability:
        - Use **bold** for emphasis and key terms.
        - Use bullet points for lists.
        - Use code blocks for code snippets.
        - Keep paragraphs short and readable.`;

        // The history is already in standard OpenAI schema: [{ role: 'user'|'assistant', content: string }]
        // Spreading it directly preserves conversation state so the AI retains context
        const messages = [
            { role: 'system', content: systemInstruction },
            ...history,
            { role: 'user', content: message }
        ];
        // Full messages array example for a 2-turn conversation:
        // [
        //   { role: 'system', content: 'You are an interviewer...' },
        //   { role: 'user', content: 'I am ready' },
        //   { role: 'assistant', content: 'Great! First question: What is a closure?' },
        //   { role: 'user', content: 'A closure is...' }     ← current message
        // ]

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 500
            // ↑ max_tokens caps the response length at ~375 words
            //   Interview responses should be focused, not essays
            //   Also controls cost: longer responses cost more tokens
        });

        return response.choices[0]?.message?.content || "";
    }, "I apologize, but I am currently experiencing high traffic...");
};
```

---

## The Groq Service (`groqService.js`) — RAG-Powered Chat

```javascript
import Groq from 'groq-sdk';
// ↑ Groq's official SDK — it uses the same API interface as OpenAI
//   This means the messages format, roles, and parameters are identical

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';
// ↑ Meta's Llama 3.3 — 70 billion parameters
//   "versatile" = fine-tuned for general tasks (chat, QA, summarization)
//   "70b" = 70 billion parameters (much larger than gpt-4o-mini's ~8B estimated params)
//   Runs on Groq's LPU (Language Processing Unit) hardware → ultra-fast inference

export const generateRAGResponse = async (question, contextChunks, docTitle = '') => {
    const contextText = contextChunks
        .map((chunk, i) => `[Section ${i + 1}]\n${chunk.content}`)
        .join('\n\n');
    // ↑ contextChunks = array of { content: string, score: number } from $vectorSearch
    //   Example contextText:
    //   "[Section 1]\nJohn Doe - GPA: 3.9 / 4.0\n\n[Section 2]\nSkills: React, Node.js, MongoDB"
    //
    //   WHY label them [Section N]?
    //   It helps the AI understand boundaries between different parts of the document
    //   When the AI references "Section 2", we know it found the skills section

    const systemPrompt = `You are an intelligent study assistant for the document "${docTitle}".
Your job is to answer the user's question using ONLY the provided context sections from the document.

Rules:
- Answer accurately based on the context provided.
- If the context doesn't contain enough information to answer, say so clearly.
- Use clear formatting: bullet points, bold for key terms, and short paragraphs.
- Do NOT make up information that isn't in the context.
- Keep your answer concise but thorough.`;
    // ↑ Critical system prompt for RAG grounding:
    //   "using ONLY the provided context" — prevents hallucination
    //   "if context doesn't contain enough, say so" — prevents making things up
    //   "Do NOT make up information" — explicit prohibition of hallucination
    //   This three-rule combination is industry-standard RAG prompt engineering

    const userPrompt = `**Context from document:**
${contextText}

**Question:** ${question}

Answer the question using only the context above.`;
    // ↑ The user message combines the retrieved context AND the actual question
    //   Markdown bold (**) improves structure — the model understands Markdown and
    //   uses it as a hint about the structure of the request
    //   "Answer the question using only the context above" = the critical grounding instruction

    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        // ↑ Low temperature → factual, conservative answers
        //   We want the AI to stick to what's in the context, not get creative

        max_tokens: 1024,
        // ↑ Generous limit for detailed answers (about 750 words)

        top_p: 0.9
        // ↑ Nucleus sampling — the model only considers tokens that together
        //   account for 90% of the probability mass
        //   Combined with low temperature, this makes answers very focused
        //   top_p: 0.9 is a common "safe" setting that prevents degenerate outputs
    });

    return {
        answer: completion.choices[0]?.message?.content || 'No answer generated.',
        model: MODEL,
        usage: completion.usage
        // ↑ usage = { prompt_tokens: 342, completion_tokens: 215, total_tokens: 557 }
        //   Returned so controllers can log cost/usage data if needed
    };
};
```

---

## The Embedding Service (`embeddingService.js`) — RAG Data Pipeline

Before looking at the code, you must understand the mathematical theory behind the embedding generation and retrieval metrics.

---

### What Are Embeddings? — The Full Foundation

#### The Core Problem: Computers Cannot Read
A computer is fundamentally a machine that only understands numbers. It can compare `5 > 3` but it cannot compare `"Node.js" is more similar to "Express" than to "pizza"`. Text is meaningless to a CPU. We need a way to convert words and sentences into numbers so that mathematical comparisons like **similarity** and **proximity** become possible.

The old way to do this was called **One-Hot Encoding**:

```
Vocabulary: ["cat", "dog", "pizza", "Python", "JavaScript"]

"cat"        → [1, 0, 0, 0, 0]
"dog"        → [0, 1, 0, 0, 0]
"pizza"      → [0, 0, 1, 0, 0]
"Python"     → [0, 0, 0, 1, 0]
"JavaScript" → [0, 0, 0, 0, 1]
```

Every word gets a unique vector with a single `1` in its position. But this has a **fatal flaw**:  
Mathematically, `"dog"` is equally far from `"cat"` as it is from `"JavaScript"`. The math does not know that dogs and cats are both animals. The vectors carry zero information about meaning.

---

#### The Breakthrough: Distributed Representations (Neural Embeddings)
In 2013, Google researchers published **Word2Vec**, which changed everything. Instead of assigning a fixed slot to each word, they trained a neural network to **predict neighboring words in a sentence**. 

The core idea is called the **Distributional Hypothesis**:
> *"A word is characterized by the company it keeps."* — J.R. Firth, 1957

Words that appear in similar contexts will be pushed toward similar coordinate positions in the vector space during training. The model does not need to be told that "dog" and "cat" are related. By reading millions of sentences where both words appear near words like "pet", "food", "vet", and "play", the model's training algorithm (Stochastic Gradient Descent) naturally pushes their vectors close together.

---

#### The Geometry of Meaning — The King/Queen Example
This is the most famous demonstration of how embeddings capture real-world relationships as geometric structure:

```
vec("King")   - vec("Man")   + vec("Woman")   ≈   vec("Queen")
vec("Paris")  - vec("France") + vec("Italy")  ≈   vec("Rome")
vec("walked") - vec("walk")                   ≈   vec("talked") - vec("talk")
```

```
        ROYAL ▲
              │
   "Queen" ───┼─────── "King"
              │
              │
   "Woman" ───┼─────── "Man"
              │
──────────────┼──────────────────► GENDER
         FEMALE             MALE
```

This means **arithmetic on meaning is possible**. You can literally add and subtract concepts, and the result is a real, meaningful word in the vector space. This is not programmed by hand. It **emerges automatically** from reading enough text.

---

#### From Word2Vec to Sentence Embeddings
Word2Vec only embeds single words. But our chunks are **paragraphs** of 500 characters. For document RAG, we need entire sentences and paragraphs embedded as a single vector.

Modern embedding models (like Jina AI v3, OpenAI `text-embedding-3-large`, or Cohere Embed v3) are built on the **Transformer architecture** (the same architecture behind GPT). They process an entire sentence at once, attending to the relationships between every word and every other word (Self-Attention), and produce a single pooled vector for the entire input.

```
Input: "John Doe graduated from IIT with a GPA of 3.9 in Computer Science."

Transformer Encoder:
  ┌─────────────────────────────────┐
  │  Token: "John"     → [0.2, 0.7...]  │
  │  Token: "Doe"      → [0.3, 0.1...]  │   Self-Attention mixes ALL
  │  Token: "GPA"      → [0.9, -0.2...] │   tokens together so "GPA"
  │  Token: "3.9"      → [0.8, -0.1...] │   knows it belongs to "John Doe"
  │  Token: "Computer" → [0.5, 0.8...]  │
  └─────────────────────────────────┘
              │
              ▼  Mean Pooling
  [0.51, 0.22, -0.14, 0.87, 0.03, ...]  ← Single 1,024-float vector
  ↑ This vector represents the FULL MEANING of the entire sentence
```

The pooled vector represents the combined semantic meaning of every word in context, including how each word modifies every other word. This is why embedding models are so much more powerful than keyword search.

---

#### Why Embeddings? — The 4 Real-World Reasons

| Reason | Keyword Search (Old Way) | Embedding Search (Our Way) |
| :--- | :--- | :--- |
| **Synonyms** | `"GPA"` will NOT find `"grade point average"` | Both are positioned near each other in the vector space — finds it! |
| **Meaning Without Keywords** | `"How well did he study?"` finds nothing | Understands the intent is academic performance → finds GPA chunks |
| **Multilingual** | English query finds only English text | Jina v3 supports 89 languages. A Hindi query can find English chunks with similar meaning |
| **Conceptual Proximity** | `"backend developer"` will NOT match `"Node.js Express REST API"` | Both concepts are clustered together in the vector space — finds it! |

Embeddings are the core infrastructure behind every modern AI feature: **semantic search**, **recommendation engines**, **question answering (RAG)**, **duplicate detection**, **clustering and classification**.

---

### A. Deep Theory: Vector Similarity Metrics
Once Jina AI converts our text chunks and search queries into 1,024-dimensional floating point vectors, MongoDB Atlas must calculate how close they are. It supports three math formulas:

#### 1. Cosine Similarity (Our System's Metric)
*   **Formula:**
    $$\text{Cosine Similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
*   **What it does:** Measures the **cosine of the angle** between two vectors. It completely ignores the length (magnitude) of the vectors and only cares about their direction.
*   **Why use it:** If you have a short sentence `"React state management"` and a long document chunk `"This guide explains React state management in detail..."`, their vector lengths will differ, but their direction in the semantic space is identical. Cosine similarity ensures they match, scoring them near `1.0`.

#### 2. Dot Product (Inner Product)
*   **Formula:**
    $$\mathbf{A} \cdot \mathbf{B} = \sum_{i=1}^{n} A_i B_i$$
*   **What it does:** Multiplies corresponding coordinates and sums them up. It measures **both angle and magnitude (length)**.
*   **Why use it:** If your embedding vectors are **normalized** (mathematically scaled so that their length is exactly `1.0`), Dot Product is mathematically identical to Cosine Similarity but runs much faster because it avoids doing the square root division.

#### 3. Euclidean Distance (L2 Distance)
*   **Formula:**
    $$d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{n} (A_i - B_i)^2}$$
*   **What it does:** Measures the **straight-line distance** between the tips of the two vectors.
*   **Why use it:** If you are clustering data (e.g., grouping users by age and income), L2 distance is perfect. It is rarely used for text RAG because longer passages naturally sit further away from short queries in distance, even if they share the same meaning.

---

### B. Asymmetric Embedding Tasks (Jina AI v3)
Normally, models use the same embedding rules for queries and documents. However, **asymmetric search** recognizes that a user's question and a document's answer look completely different.
*   **Query (Short, questioning):** *"Where do I look up my grades?"*
*   **Passage (Long, factual, answering):** *"Students can view their grades by logging into the student portal and clicking Academics."*

Jina AI v3 solves this by training separate projection headers inside the model for different tasks:

1.  `task: "retrieval.passage"`: Used when saving document chunks. It optimizes the vector to represent a **factual target** that is ready to be found.
2.  `task: "retrieval.query"`: Used when a user enters a question. It optimizes the vector to represent a **questioning agent** looking for a target.

Using different tasks for indexing vs searching increases RAG accuracy by up to 20% compared to models that treat queries and passages identically.

---

### C. Dimensionality & Matryoshka Embeddings
Jina v3 generates **1,024 float numbers** per vector.
*   **Why 1024?** It provides a high-resolution semantic map. It can capture subtle relationships (like coding style, tone, and technical details).
*   **Matryoshka Representation Learning (MRL):** Jina v3 is trained like a Russian nesting doll. The most important semantic concepts are squeezed into the first 128 coordinates, then more details in the next 256, and so on up to 1024. This allows enterprise systems to truncate the vector (e.g. store only the first 256 floats) to save 75% on database storage costs while keeping 95% of the accuracy. In our system, we store the full 1024 dimensions for maximum precision.

---

### RAG Step 1: Text Cleaning — Full Deep Dive

Text Cleaning is the **first real RAG step**. It runs before chunking, before embedding, and before any AI touches the data.

#### Why is Cleaning Necessary?

When `pdf-parse` extracts text from a PDF, the output is raw and messy. PDFs are designed for visual display, not data processing. The extracted text stream is full of noise that will corrupt your chunks and reduce embedding quality if not cleaned first.

Here is what a raw extracted text looks like before cleaning:

```
"John   Doe\r\n\r\n\r\nSoftware   Engineer\r\n
Skills:   Node.js,   React\r\n\r\n\r\n\r\nEducation\r\n\r\n
IIT   Delhi   —   B.Tech  Computer  Science\r\n"
```

And here is what it looks like after cleaning:

```
"John Doe\n\nSoftware Engineer\nSkills: Node.js, React\n\nEducation\nIIT Delhi — B.Tech Computer Science"
```

The cleaned version is compact, consistent, and ready for splitting.

---

#### Cleaning Method 1: Windows Line Ending Normalization

```javascript
.replace(/\r\n/g, '\n')
```

**The Problem:**
Different operating systems use different characters to mark the end of a line:
- **Windows:** `\r\n` (Carriage Return + Line Feed — 2 characters)
- **Linux/Mac:** `\n` (Line Feed only — 1 character)
- **Old Mac:** `\r` (Carriage Return only — 1 character)

PDF parsers often preserve whatever line endings were baked into the PDF at creation time. A PDF created on Windows will have `\r\n` everywhere. If you then check for `\n\n` (paragraph boundary) during chunking, it will never match because the actual text contains `\r\n\r\n`.

**What happens if you skip it:**
```
Raw:     "Node.js is fast.\r\n\r\nIt uses an event loop."
Check for '\n\n': NOT FOUND  ← chunker misses paragraph boundary!
Result:  One huge chunk instead of two smaller, precise ones
```

**The Fix:**
Replace all `\r\n` with `\n` so the entire document uses one consistent line ending standard.

---

#### Cleaning Method 2: Whitespace Collapse

```javascript
.replace(/[ \t]+/g, ' ')
```

**The Problem:**
PDF layout engines use extra spaces and tab characters to visually align text into columns, tables, and indentation. When extracted, this alignment becomes raw text with multiple consecutive spaces.

```
Before:  "Skills:   Node.js,      React,       MongoDB"
After:   "Skills: Node.js, React, MongoDB"
```

**What happens if you skip it:**
Multiple spaces are meaningful to the chunker's separator hierarchy. The chunk boundary detection tries to split at `' '` (single space) as a last resort. If your text has `'   '` (three spaces), the `lastIndexOf(' ')` call will match in random positions, creating inconsistent chunk boundaries. Even worse, when embedded, the vector for `"Node.js"` (single space before) and `"  Node.js"` (two spaces before) will be slightly different, reducing retrieval precision.

**Regex Explained:**
- `[ \t]+` matches one or more spaces OR tab characters
- `g` flag means replace ALL occurrences globally, not just the first one

---

#### Cleaning Method 3: Excessive Newline Reduction

```javascript
.replace(/\n{3,}/g, '\n\n')
```

**The Problem:**
PDF pages often have large whitespace gaps between sections (chapter headings, page separators, footer/header areas). When extracted, these gaps become 4, 5, or even 10 consecutive newline characters.

```
Before:  "Introduction\n\n\n\n\n\nChapter 1: Node.js"
After:   "Introduction\n\nChapter 1: Node.js"
```

**What happens if you skip it:**
The chunker's separator priority tries `'\n\n'` first (paragraph break). But `'\n\n\n\n\n'` is not the same string as `'\n\n'` — `lastIndexOf('\n\n')` would still match somewhere, but the logic gets confused about where the actual paragraph boundary is. More critically, leaving 10 consecutive newlines wastes characters inside your 500-char chunk window — you burn your character budget on blank lines instead of real content.

**Regex Explained:**
- `\n{3,}` matches 3 or more consecutive newline characters
- Replaces ALL of them with exactly `\n\n` — the standard paragraph separator we use in our chunker's separator hierarchy

---

#### Cleaning Method 4: Trim

```javascript
.trim()
```

**The Problem:**
After all the replacements above, the string may still start or end with whitespace characters (spaces, newlines). This is trivial but important — if the first character is a `\n`, the chunker starts reading from a blank position.

**What it does:**
Removes all leading and trailing whitespace (spaces, tabs, newlines) from the string.

---

#### Cleaning Approaches — Our Method vs What Else Exists

| Approach | What it handles | Used In |
| :--- | :--- | :--- |
| **Basic Regex (Our Method)** | Line endings, whitespace collapse, excessive newlines | Our project, LangChain default |
| **Unicode Normalization** | Special characters like `é`, `ü`, `–` (em dash), Smart Quotes (`"` → `"`). Converts to standard ASCII representation. | Enterprise multilingual RAG |
| **HTML Tag Stripping** | Removing `<p>`, `<br>`, `<div>` tags if the source is a web page or HTML document instead of PDF | Web scraping pipelines |
| **Header/Footer Removal** | Detecting and removing repeated page numbers, document titles at the top of every page, watermarks | Legal document RAG |
| **Table Extraction** | Instead of treating table rows as plain text, converting them to `Row: Col1=X, Col2=Y` structured format | Financial/spreadsheet RAG |
| **Spell Correction** | Running OCR output through a dictionary to fix `"Nod3.js"` → `"Node.js"` | Scanned document RAG |

Our system only needs the 3 basic Regex operations because we deal with clean, digitally-created PDFs (resumes, reports). If this were an enterprise system processing scanned government documents, we would layer in Unicode normalization, OCR correction, and HTML stripping on top.

---

#### The Complete Cleaning Pipeline Visualized

```
Raw PDF Text (output of pdf-parse):
"John   Doe\r\n\r\n\r\nSoftware   Engineer\r\n\r\n\r\n\r\n"

         │
         ▼  Step A: .replace(/\r\n/g, '\n')
"John   Doe\n\n\nSoftware   Engineer\n\n\n\n"

         │
         ▼  Step B: .replace(/[ \t]+/g, ' ')
"John Doe\n\n\nSoftware Engineer\n\n\n\n"

         │
         ▼  Step C: .replace(/\n{3,}/g, '\n\n')
"John Doe\n\nSoftware Engineer\n\n"

         │
         ▼  Step D: .trim()
"John Doe\n\nSoftware Engineer"

         │
         ▼  Ready for Chunking
```

---

### RAG Step 2: Chunking Methods — Full Deep Dive

Chunking is the process of breaking the cleaned text into smaller, self-contained pieces before embedding them.

#### Why Can't We Embed the Whole Document?

Two hard reasons:

**1. Semantic Dilution:**
If you embed a 10-page document as one single vector, that vector represents the "average" meaning of 10 pages. It is a blurry, generalized fingerprint. When a user asks *"What is Arpit's GPA?"*, the query vector is very specific. Comparing a specific query against a blurry 10-page average produces a low, useless similarity score.

Smaller chunks = more precise, specific vectors = better matches.

**2. Context Window Budget:**
When a chunk matches the query, we inject it into the LLM prompt. If we stored the whole document as one chunk, injecting it would consume the entire context window (100k+ tokens), leaving no room for the system prompt, conversation history, or the user's question.

The goal of chunking is to find the **smallest meaningful unit** that is still self-contained enough to answer a question.

---

#### Chunking Method 1: Fixed Size Chunking

**How it works:**
The simplest possible approach. Cut the text every exactly N characters. No exceptions, no logic, no separator awareness.

```
Text: "Node.js is a runtime. It uses an event loop. Express is a web framework."
ChunkSize = 40

Chunk 1: "Node.js is a runtime. It uses an eve"   ← sentence cut mid-word!
Chunk 2: "nt loop. Express is a web framework."
```

**Tradeoffs:**
| | |
| :--- | :--- |
| **Speed** | Extremely fast — no separator scanning needed |
| **Simplicity** | Trivial to implement in 3 lines of code |
| **Quality** | Poor — routinely cuts mid-sentence or mid-word, fragmenting meaning |
| **When to Use** | Only for quick proof-of-concept prototypes where accuracy doesn't matter |

**The Core Problem:**
The model embedding `"It uses an eve"` will produce a meaningless vector because the word "event" is incomplete. Retrieval quality degrades significantly.

---

#### Chunking Method 2: Recursive Character Text Splitter ← Our Method

**How it works:**
Uses a **priority-ordered list of separators**. It tries the "best" natural boundary first. If that boundary doesn't appear in the window, it falls down to the next option. It only does a hard character cut as an absolute last resort.

```javascript
// Separator priority order (best → worst):
const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
```

**Step-by-step logic for each chunk:**
```
cleanText = "Node.js is a JavaScript runtime.\n\nIt was created by Ryan Dahl in 2009.\nIt uses V8."
start = 0, chunkSize = 50

1. Take window: cleanText.substring(0, 50)
   = "Node.js is a JavaScript runtime.\n\nIt was created"

2. Try '\n\n' (paragraph break):
   lastIndex = 33. Is 33 > 50 * 0.4 = 20? YES!
   bestBreak = 0 + 33 + 2 = 35

3. Chunk 1 = "Node.js is a JavaScript runtime."   ✅ Clean sentence end!

4. Next start = 35 - overlap(10) = 25
   (Goes back 10 chars so next chunk gets the tail end for context continuity)
```

**The 40% Rule:**
The separator is only accepted if it falls **past 40% of the chunk window**. This prevents absurdly tiny first halves like splitting after 2 characters, which would waste almost the entire chunk on overlap.

**The Overlap:**
```
Chunk 1: "...the event loop processes callbacks sequentially."
Chunk 2:         "processes callbacks sequentially. It is not multi-threaded."
                  ◄───────── overlap ──────────►
```
Without overlap, a key sentence at the boundary is split in half. The overlap ensures every sentence is fully present in at least one chunk, so no meaning is lost at boundaries.

**Tradeoffs:**
| | |
| :--- | :--- |
| **Speed** | Fast — linear scan, no external API calls |
| **Quality** | Good — preserves sentence and paragraph boundaries |
| **Simplicity** | Moderate — ~80 lines of code |
| **When to Use** | Standard RAG on clean text documents — resumes, reports, articles |
| **Limitation** | Ignores the document's visual layout (tables, columns, headers) |

---

#### Chunking Method 3: Sentence-Level Chunking

**How it works:**
Uses a real **NLP sentence tokenizer** (like `nltk.sent_tokenize` in Python or `compromise` in Node) to first split the entire text into individual grammatically-correct sentences. It then groups N sentences together into a chunk.

```
Text: "Node.js is a runtime. It uses V8. Express is a framework. It handles HTTP."
N = 2 sentences per chunk

Chunk 1: "Node.js is a runtime. It uses V8."
Chunk 2: "Express is a framework. It handles HTTP."
```

**Tradeoffs:**
| | |
| :--- | :--- |
| **Quality** | Very good — every chunk boundary is a proper sentence end |
| **Consistency** | Predictable chunk sizes (measured in sentences, not chars) |
| **Limitation** | Sentence tokenizers are brittle on noisy PDF text — they can confuse "B.Tech." or "Node.js" periods as sentence ends |
| **When to Use** | Clean, well-structured prose text (news articles, academic papers) |

---

#### Chunking Method 4: Semantic Chunking (Advanced)

**How it works:**
This method **embeds every individual sentence first**, then splits based on where the topic changes. It calculates the **cosine distance** between consecutive sentence embeddings. A sudden jump in distance = a topic shift = a natural chunk boundary.

```
Sentences and their cosine distances from the next sentence:
S1: "Node.js is a JavaScript runtime."       → dist to S2: 0.08  (same topic)
S2: "It was created by Ryan Dahl in 2009."   → dist to S3: 0.09  (same topic)
S3: "It uses Chrome's V8 engine."            → dist to S4: 0.71  ← SPIKE! Topic change
S4: "Express.js is a web framework."         → dist to S5: 0.06  (same topic)
S5: "It simplifies HTTP routing."

Chunk 1: S1 + S2 + S3   (Node.js core)
Chunk 2: S4 + S5         (Express.js — new topic)
```

**Tradeoffs:**
| | |
| :--- | :--- |
| **Quality** | Excellent — chunks are coherent topical units |
| **Semantic Accuracy** | Highest of all methods |
| **Cost** | Very expensive — requires embedding N sentences individually before ingestion. A 100-sentence document = 100 API calls just to chunk |
| **Speed** | Slow — not suitable for real-time or large volume ingestion |
| **When to Use** | High-value, slow-changing documents (legal contracts, research papers) where accuracy is critical and ingestion is done once |

---

#### Chunking Method 5: Layout-Aware / Structural Chunking

**How it works:**
Instead of reading text as a flat stream, a layout parser understands the **visual document structure** — headers, paragraphs, tables, lists, page numbers, footers. It treats each structural element as a natural chunk boundary.

```
Resume PDF visual layout:

┌─────────────────────────────┐
│ JOHN DOE                    │ ← Title
│ Software Engineer           │ ← Subtitle
├─────────────────────────────┤
│ SKILLS                      │ ← Section Header    → Chunk Boundary
│ • React  • Node.js  • AWS   │
├─────────────────────────────┤
│ EXPERIENCE                  │ ← Section Header    → Chunk Boundary
│ Google — Senior SWE         │
│ Built distributed systems   │
└─────────────────────────────┘

Chunk 1: "JOHN DOE — Software Engineer"
Chunk 2: "SKILLS: React, Node.js, AWS"
Chunk 3: "EXPERIENCE: Google — Senior SWE. Built distributed systems."
```

**Tradeoffs:**
| | |
| :--- | :--- |
| **Quality** | Excellent for structured documents — each chunk is logically complete |
| **Table Handling** | Can preserve table row data instead of fragmenting it mid-row |
| **Cost** | Requires heavy layout analysis engines (Azure Document Intelligence, Unstructured.io) — expensive API calls |
| **Complexity** | High — not simple to implement from scratch |
| **When to Use** | Financial reports, legal documents, forms, spreadsheets where table and section boundaries matter |

---

#### Chunking Method 6: Agentic / Proposition Chunking (Cutting Edge)

**How it works:**
Instead of splitting the raw text, an **LLM first rewrites the entire document** as a series of atomic, self-contained factual propositions. Each proposition becomes one chunk.

```
Original text:
"John Doe graduated from IIT Delhi in 2022 with a GPA of 3.9 out of 4.0 in Computer Science."

LLM rewrites to atomic propositions:
→ "John Doe graduated from IIT Delhi."
→ "John Doe graduated in the year 2022."
→ "John Doe's GPA is 3.9 out of 4.0."
→ "John Doe studied Computer Science."
→ "John Doe attended IIT Delhi."
```

Each proposition is then embedded individually. This makes retrieval incredibly precise.

**Tradeoffs:**
| | |
| :--- | :--- |
| **Retrieval Precision** | The highest of any method — each fact is independently searchable |
| **Cost** | Extremely expensive — requires running an LLM over the entire document just to chunk it |
| **Speed** | Very slow — not suitable for real-time |
| **When to Use** | Enterprise knowledge bases where retrieval accuracy justifies the ingestion cost |

---

#### When to Choose Which Method — Decision Guide

```
Is your document clean, digital text (PDF, Word, Markdown)?
  └─ YES:
      Is it large (>100 pages) and topic-heavy?
        └─ YES → Semantic Chunking (boundary on topic shift)
        └─ NO  → Recursive Character Splitter ← (Our Choice — best balance)

  └─ NO (scanned, HTML, or complex layout):
      Does it have tables, headers, or columns?
        └─ YES → Layout-Aware / Structural Chunking
        └─ NO  → Pre-process with OCR, then Recursive Character Splitter

Is maximum retrieval precision required (legal, medical, financial)?
  └─ YES → Proposition / Agentic Chunking (LLM rewrites to atomic facts)
  └─ NO  → Recursive Character Splitter
```

#### Quick Comparison Table

| Method | Boundary Type | Quality | Speed | Cost | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Fixed Size | Character count | Poor | Fastest | Free | Prototype only |
| **Recursive Character** | **Best available separator** | **Good** | **Fast** | **Free** | **Our project — standard RAG** |
| Sentence | Grammatical sentence end | Very Good | Fast | Free | Clean prose text |
| Semantic | Topic shift (vector distance) | Excellent | Slow | Medium (embed sentences) | Research papers |
| Layout-Aware | Document visual structure | Excellent | Slow | High (layout API) | Tables, forms, spreadsheets |
| Agentic/Proposition | LLM atomic fact rewrite | Best | Slowest | Very High (LLM per doc) | Enterprise knowledge bases |

---

### `chunkText()` — The Text Splitter

```javascript
const CHUNK_SIZE = 500;    // Each chunk is ~500 characters
const CHUNK_OVERLAP = 100; // Each chunk shares 100 chars with the next one

export const chunkText = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
    // Step 1: Clean and normalize the raw text
    const cleanText = text
        .replace(/\r\n/g, '\n')       // Windows line endings → Unix
        .replace(/[ \t]+/g, ' ')      // Multiple spaces/tabs → single space
        .replace(/\n{3,}/g, '\n\n')   // 3+ newlines → double newline (paragraph break)
        .trim();

    // Step 2: Separator hierarchy — try best break first, fall back progressively
    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
    // Priority order (best sentence boundary → worst):
    // '\n\n' = paragraph break
    // '\n'   = line break
    // '. '   = sentence end (space after period is important — avoids splitting "U.S.A.")
    // ' '    = word boundary (last resort — at least no mid-word cuts)

    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        let end = start + chunkSize;
        let bestBreak = -1;

        for (const sep of separators) {
            const segment = cleanText.substring(start, end);
            const lastIdx = segment.lastIndexOf(sep);

            if (lastIdx > chunkSize * 0.4) {
                // Only accept if the break is past 40% of the chunk
                // WHY 40%? To avoid chunks of 50 chars + 450 chars (lopsided)
                bestBreak = start + lastIdx + sep.length;
                break;
            }
        }

        if (bestBreak === -1) bestBreak = end; // Hard cut as last resort

        const chunk = cleanText.substring(start, bestBreak).trim();
        if (chunk.length > 30) chunks.push(chunk);

        start = bestBreak - overlap;
        // ↑ The key to overlap: we go BACK 100 characters
        //   So chunk 2 starts 100 chars before chunk 1 ended
        //   This ensures boundary sentences appear in BOTH chunks
    }

    return chunks;
};
```

**Why is overlap so important?**

```
Document text: "...The company was founded in 1994. Its headquarters is in Seattle..."

WITHOUT OVERLAP:
  Chunk 1: "...The company was founded in 1994."
  Chunk 2: "Its headquarters is in Seattle..."

  User asks: "Where was the company that was founded in 1994 headquartered?"
  → Vector search may return Chunk 1 (mentions 1994) OR Chunk 2 (mentions Seattle)
  → Never both — so the AI might miss the connection

WITH OVERLAP (100 chars):
  Chunk 1: "...The company was founded in 1994. Its head"  ← boundary overlaps into chunk 2
  Chunk 2: "...founded in 1994. Its headquarters is in Seattle..."  ← has full context

  → Chunk 2 now contains BOTH facts and will answer the compound question correctly
```

---

---

### RAG Step 3: generateEmbeddings() — Mechanics and Ingestion Pipeline

Once our text chunks are cleaned and sliced, we need to convert them into mathematical coordinate vectors. This is handled by `generateEmbeddings()`.

#### The 3 Core Operations Inside `generateEmbeddings`

This function is not just a simple API fetch; it acts as an ingestion pipeline controller that manages API constraints, network efficiency, and data integrity:

```
[Input: Array of 100 text chunks]
               │
               ▼  1. Batching (groups of 32)
  [Batch 1: 0-31]   [Batch 2: 32-63]   [Batch 3: 64-95]   [Batch 4: 96-99]
               │
               ▼  2. HTTP Parallel Call (Jina API: task='retrieval.passage')
[Out-of-Order Vectors: {index: 2}, {index: 0}, {index: 1}...]
               │
               ▼  3. Sorting (realigning returned indices back to 0, 1, 2...)
[In-Order Vectors: {index: 0}, {index: 1}, {index: 2}...]
               │
               ▼
[Output: Array of 100 aligned 1024-d vectors]
```

---

#### 1. Why We Use Batching (`BATCH_SIZE = 32`)
If a resume has 100 text chunks, we could send 100 individual HTTP requests to Jina AI. However:
*   **Network Overhead:** Opening 100 TCP/HTTP connections sequentially takes up to **10–15 seconds** due to SSL handshakes and network latency.
*   **Rate Limits:** Calling the API 100 times in 1 second will trigger the API rate limiter, causing errors.
*   **Batching Solution:** We slice the chunks into groups of 32 (`BATCH_SIZE`). For 100 chunks, we only make **4 parallel API calls** instead of 100, dropping the ingestion time down to under **1 second**.

---

#### 2. The HTTP Payload Design
We send a `POST` request to Jina AI's endpoint with a structured JSON body:
*   `model: "jina-embeddings-v3"`: The model name.
*   `input: batch`: The array of 32 text strings.
*   `task: "retrieval.passage"`: This parameter is critical. It tells Jina's neural network: *"Generate these vectors to be stored as factual knowledge targets in a database."* This optimizes the vector coordinates for retrieval.

---

#### 3. The Critical Fix: Index Sorting
This is the most important line of logic in the function:
```javascript
const sorted = data.data.sort((a, b) => a.index - b.index);
```

**The Danger of Asynchronous Execution:**
When Jina AI receives a batch of 32 texts, its GPU cluster processes them in parallel across different threads to save time. Because some sentences take longer to process than others, the API returns the results in the order they finished computing, not the order we sent them!

If we sent:
*   `Input 0`: *"John Doe"*
*   `Input 1`: *"Software Engineer"*
*   `Input 2`: *"React Experience"*

The API might return them out of order:
*   `[ {index: 1, embedding: [...]}, {index: 2, embedding: [...]}, {index: 0, embedding: [...]} ]`

**What happens if you skip sorting:**
If you don't sort, you will push the embedding for *"Software Engineer"* (index 1) into index 0. In MongoDB, the vector for *"Software Engineer"* gets mapped to the text *"John Doe"*. 
Your RAG database becomes **conceptually scrambled**. A search for developers will return the text for something completely unrelated because the vectors mismatch the text.

**The Fix:**
We sort the array by the `index` property (`a.index - b.index`) before mapping. This forces the coordinates to align **1-to-1** with our text chunk array before saving to MongoDB!

---

### `generateEmbeddings()` — Jina AI Passage Encoder

```javascript
export const generateEmbeddings = async (texts) => {
    const BATCH_SIZE = 32;
    // ↑ Jina AI's API limit is 32 texts per call
    //   If we have 100 chunks, we make ceil(100/32) = 4 API calls

    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        // ↑ texts.slice(0, 32) → first batch
        //   texts.slice(32, 64) → second batch
        //   texts.slice(64, 96) → third batch

        const response = await fetch('https://api.jina.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JINA_API_KEY}`
            },
            body: JSON.stringify({
                model: 'jina-embeddings-v3',
                // ↑ Jina's state-of-the-art embedding model
                //   Produces 1024-dimensional vectors (1024 float numbers per text)
                //   Trained on multilingual data — works well with technical documents

                input: batch,
                // ↑ Array of text strings to embed

                task: 'retrieval.passage'
                // ↑ CRITICAL: Jina uses ASYMMETRIC embeddings
                //   'retrieval.passage' = optimized for BEING FOUND (document chunks)
                //   'retrieval.query'   = optimized for FINDING (user questions)
                //
                //   WHY ASYMMETRIC?
                //   "GPA 3.9" (the answer in the document) and "What is my GPA?" (the question)
                //   are semantically related but phrased completely differently.
                //   Symmetric embeddings would give these a low similarity score.
                //   Asymmetric training teaches the model that these are complementary,
                //   dramatically improving retrieval accuracy.
            })
        });

        const data = await response.json();
        const sorted = data.data.sort((a, b) => a.index - b.index);
        // ↑ Jina processes batches in parallel and may return embeddings out of order
        //   Sort by original index to ensure embedding[0] matches texts[0]

        allEmbeddings.push(...sorted.map(d => d.embedding));
        // ↑ Extract just the float arrays from the response objects
    }

    return allEmbeddings;
    // ↑ Returns: [[1024 floats], [1024 floats], ...] — one array per input text
};
```

---

### `generateQueryEmbedding()` — The Other Side of Asymmetric Search

```javascript
export const generateQueryEmbedding = async (queryText) => {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: { /* same as above */ },
        body: JSON.stringify({
            model: 'jina-embeddings-v3',
            input: [queryText],
            // ↑ Single query — just one text to embed

            task: 'retrieval.query'
            // ↑ Different task from passage embedding!
            //   This tells Jina: "This is a question that needs to FIND information"
            //   The model applies a different internal transform to the vector
            //   so that it lands near relevant passages in the vector space
        })
    });

    const data = await response.json();
    return data.data[0].embedding;
    // ↑ Returns just the single 1024-d float array for the query
};
```

---

### `ingestDocument()` — The Full RAG Indexing Pipeline

```javascript
export const ingestDocument = async (documentId) => {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error('Document not found');
    if (!doc.parsedText) throw new Error('Document has no parsed text. Open it first to trigger parsing.');
    // ↑ Prerequisite: parsedText must exist (Phase 4's lazy cache must have run first)

    // ─────────────────────
    // Step 1: Wipe old chunks (support re-ingestion cleanly)
    // ─────────────────────
    await DocumentChunk.deleteMany({ document: documentId });
    // ↑ If user triggers embed twice, we start fresh
    //   Without this: old + new chunks both appear in search = duplicate results

    // ─────────────────────
    // Step 2: Split text into chunks
    // ─────────────────────
    const chunks = chunkText(doc.parsedText);
    // ↑ A 50-page resume → ~40-80 chunks
    //   A 200-page textbook → ~400-600 chunks

    // ─────────────────────
    // Step 3: Convert chunks to vectors
    // ─────────────────────
    const embeddings = await generateEmbeddings(chunks);
    // ↑ Makes ceil(chunks.length / 32) API calls to Jina AI
    //   embeddings[0] = the vector for chunks[0]
    //   embeddings[47] = the vector for chunks[47]

    // ─────────────────────
    // Step 4: Store chunks + vectors in MongoDB
    // ─────────────────────
    const chunkDocs = chunks.map((content, index) => ({
        document: new mongoose.Types.ObjectId(documentId),
        // ↑ Links to the parent Document (enables filtering in $vectorSearch)

        chunkIndex: index,
        // ↑ Preserves original order (0, 1, 2, ...)

        content: content,
        // ↑ The raw text — sent to the LLM as context in the final prompt

        embedding: embeddings[index]
        // ↑ The 1024-float vector — used by $vectorSearch for similarity matching
    }));

    await DocumentChunk.insertMany(chunkDocs);
    // ↑ One MongoDB round-trip to write ALL chunks
    //   100x more efficient than calling .save() in a loop

    // ─────────────────────
    // Step 5: Mark document as AI-ready
    // ─────────────────────
    doc.isEmbedded = true;
    doc.chunkCount = chunks.length;
    await doc.save();
    // ↑ React reads isEmbedded to show the "AI Ready" badge on the document card

    return chunks.length;
};
```

---

---

### RAG Step 5: Document Retrieval — MongoDB Aggregation Pipelines

When the user asks a question, we cannot use a normal database lookup. We must run a specialized search using MongoDB's **Aggregation Pipeline**.

---

#### 1. What is an Aggregation Pipeline (`.aggregate()`)?
A normal query (`.find()`) is like looking up a word in a dictionary index—it's simple, fast, and does one thing. 

An **Aggregation Pipeline** is like an **assembly line in a factory**. You feed raw documents into the pipeline, and they pass through different stations (called **stages**). Each stage modifies, filters, or transforms the data, and passes the result to the next stage until the final product is ready.

```
[Raw DocumentChunks (All in DB)]
               │
               ▼  Stage 1: $vectorSearch
[Top 5 closest matching chunks of documentId]
               │
               ▼  Stage 2: $project (Filters fields, strips embeddings)
[Clean output array of chunks with content, index, and similarity score]
```

In our code, we use a **two-stage pipeline**:

---

#### Stage 1: The `$vectorSearch` Stage
This stage is responsible for running the geometric comparison in our 1,024-dimensional space.

```javascript
$vectorSearch: {
    index: 'vector_index',
    path: 'embedding',
    queryVector: queryEmbedding,
    numCandidates: topK * 20,
    limit: topK,
    filter: { document: new mongoose.Types.ObjectId(documentId) }
}
```

*   **`index: 'vector_index'`**: Tells MongoDB to use the HNSW graph index we built in the Atlas Cloud UI.
*   **`path: 'embedding'`**: Specifies the field where the vectors are stored.
*   **`queryVector`**: The vector of the user's question (e.g. `[0.21, -0.85, 0.47...]`).
*   **`numCandidates`**: How many nearest nodes the search visits during the graph navigation. By setting it to `topK * 20` (100 candidates), the search finds the 100 closest points first, and then calculates the exact cosine similarity on only those 100. This keeps the query execution time under **5ms**.
*   **`limit: topK`**: Cuts the results down, returning only the top 5 absolute closest matches.
*   **`filter` (Pre-filtering)**: This is a critical security step. There are two ways databases filter data:
    1.  *Post-filtering (Bad):* Compute vectors on everything in the database, get the top 5 matches, and then throw away matches that don't belong to our `documentId`. This is slow and can return 0 matches if other documents have higher similarity.
    2.  *Pre-filtering (Our Method):* MongoDB first isolates only the chunks matching the `documentId`, and then runs the vector similarity math **only on those matching chunks**. This is secure, fast, and guarantees you get 5 matches from *your* document.

---

#### Stage 2: The `$project` Stage
This stage is responsible for cleaning up the output fields before they leave the database.

```javascript
$project: {
    content: 1,
    chunkIndex: 1,
    score: { $meta: 'vectorSearchScore' }
}
```

*   **Why we need it:** By default, MongoDB returns the entire document chunk, including the massive array of 1,024 float numbers (`embedding`). Sending 5 arrays of 1,024 floats over the network wastes server memory and bandwidth.
*   **What it does:** Setting `content: 1` and `chunkIndex: 1` tells MongoDB: *"Send only these two fields."* Because we did not mention `embedding`, it is excluded.
*   **`score: { $meta: 'vectorSearchScore' }`**: This creates a virtual field in the output called `score`. MongoDB reads the math calculation metadata and retrieves the exact cosine similarity score (a decimal number like `0.93`, meaning 93% match).

---

#### 2. Three Types of Search Queries in MongoDB

As a developer, you must know when to use the three different query types:

| Query Type | Method | Index Type | Match Style | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Exact Query** | `find({ status: 'active' })` | B-Tree Index | **Exact Value / Range** (Numbers, IDs, exact string matching). | Standard operations: finding a user, loading an interview session, matching IDs. |
| **Text Search** | `$text` / `$search` | Lucene Text Index | **Keyword Matches** (Finds words using stemming and wildcard matching). | E-commerce search, Q&A banks where exact keyword hits (like "React") are key. |
| **Vector Search** | `$vectorSearch` | HNSW Index | **Semantic Meaning** (Calculates distance between high-dimensional vector coordinates). | RAG, finding synonyms, question-answering systems where words differ but intent is identical. |

---

### `searchSimilarChunks()` — Real-Time Vector Search

```javascript
export const searchSimilarChunks = async (query, documentId, topK = 5) => {
    // ─────────────────────
    // Step 1: Convert the user's question to a vector
    // ─────────────────────
    const queryEmbedding = await generateQueryEmbedding(query);
    // ↑ "What is my GPA?" → [0.21, -0.85, 0.47, ...]  (1024 floats)

    // ─────────────────────
    // Step 2: Find the K most similar chunks using MongoDB Atlas
    // ─────────────────────
    const results = await DocumentChunk.aggregate([
        {
            $vectorSearch: {
                index: 'vector_index',
                // ↑ Pre-built index in MongoDB Atlas UI (must be manually configured)
                //   Settings: field='embedding', dimensions=1024, similarity='cosine'
                //   This creates a specialized HNSW (Hierarchical Navigable Small World) index
                //   which enables fast approximate nearest-neighbor search

                path: 'embedding',
                // ↑ The field in DocumentChunk that contains the stored 1024-d vectors

                queryVector: queryEmbedding,
                // ↑ The 1024-d vector of the user's question
                //   MongoDB computes cosine similarity: (query · stored) / (|query| × |stored|)
                //   Ranges from 0 (no relation) to 1 (identical meaning)

                numCandidates: topK * 20,
                // ↑ topK=5 → numCandidates=100
                //   MongoDB's ANN (Approximate Nearest Neighbor) algorithm:
                //   1. Quickly scans 100 "candidate" chunks (fast, approximate)
                //   2. Computes exact similarity on those 100
                //   3. Returns the best 5
                //   WHY not scan ALL chunks? 10,000 chunks × cosine similarity = slow
                //   topK*20 is the industry-standard sweet spot for recall vs speed

                limit: topK,
                // ↑ Return only the 5 best matching chunks

                filter: { document: new mongoose.Types.ObjectId(documentId) }
                // ↑ SECURITY-CRITICAL: Only search chunks belonging to THIS document
                //   Without this, the search returns chunks from ALL users' documents
                //   This would be a massive privacy breach
            }
        },
        {
            $project: {
                content: 1,
                // ↑ Include chunk text (sent to LLM as context)
                chunkIndex: 1,
                // ↑ Include position (for debugging/logging)
                score: { $meta: 'vectorSearchScore' }
                // ↑ $meta is MongoDB's special syntax to access search metadata
                //   vectorSearchScore = the cosine similarity value (0-1)
                //   e.g. score: 0.94 means 94% semantic similarity to the query
            }
        }
    ]);

    return results;
    // ↑ Returns: [{ content: "GPA 3.9...", chunkIndex: 14, score: 0.94 }, ...]
};
```

---

# PART 4: THE CONTROLLERS (Line by Line)

All AI features are in [server/controllers/aiController.js](file:///E:/Projects/CareerCraft-AI/server/controllers/aiController.js).

---

### `getDocumentText()` — Internal Helper (Not a Route)

This is a private function used by multiple controllers. It is the same lazy cache pattern from Phase 4, duplicated here so the AI controllers are self-contained.

```javascript
const getDocumentText = async (doc) => {
    if (doc.parsedText) {
        return doc.parsedText;
        // ↑ Cache hit — text was already extracted. Return immediately.
    }

    // Cache miss — download PDF from Cloudinary and parse it
    const response = await fetch(doc.fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);
    const data = await pdf(dataBuffer);

    doc.parsedText = data.text;
    await doc.save();
    // ↑ Cache the text so future calls are instant

    return data.text;
};
```

---

### `chatWithDocument()` — The Dual-Mode AI Chat

This is the most architecturally interesting controller in the app. It has two completely different code paths based on a single flag: `useRAG`.

```javascript
export const chatWithDocument = async (req, res) => {
    try {
        const { documentId, question, useRAG } = req.body;
        // ↑ documentId = which PDF to chat with
        //   question    = the user's typed message
        //   useRAG      = boolean flag: true = precision mode, false = legacy mode

        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        let answer;
        let mode = 'gemini';
        // ↑ mode is included in the response so the React UI can show
        //   "Answered by RAG" vs "Answered by GPT-4"

        // ─────────────────────────────────────
        // PATH A: RAG MODE (Vector Search + Groq)
        // ─────────────────────────────────────
        if (useRAG && doc.isEmbedded) {
            // ↑ BOTH conditions must be true:
            //   useRAG = true    → user explicitly requested RAG mode
            //   doc.isEmbedded   → the document has already been chunked + embedded
            //   If document isn't embedded yet and user requests RAG, we fall through
            //   to the legacy mode (better UX than crashing)

            const chunks = await searchSimilarChunks(question, documentId, 5);
            // ↑ Step 1: Convert question to vector, find 5 most similar document sections
            //   This call goes to Jina AI (question embedding) then MongoDB $vectorSearch
            //   Returns: [{ content: "...", score: 0.94 }, ...]

            if (chunks.length === 0) {
                return res.status(400).json({ message: 'No relevant content found. Try a different question.' });
                // ↑ Edge case: document may be too short or question too unrelated
                //   Better to tell the user than to send an empty context to the LLM
                //   (which would result in a hallucinated answer)
            }

            const result = await generateRAGResponse(question, chunks, doc.filename);
            // ↑ Step 2: Build the grounded prompt and call Groq (Llama 3.3 70B)
            //   The chunks become the "context" in the system prompt
            //   result = { answer: string, model: string, usage: object }

            answer = result.answer;
            mode = 'rag-groq';

        // ─────────────────────────────────────
        // PATH B: LEGACY MODE (Truncated text + OpenAI)
        // ─────────────────────────────────────
        } else {
            const text = await getDocumentText(doc);
            // ↑ Get full document text (from cache or Cloudinary download)

            const context = text.substring(0, 50000);
            // ↑ Truncate to first 50,000 characters (~12,500 tokens)
            //   GPT-4o-mini supports 128k tokens, but we limit to avoid excessive cost
            //   50,000 chars covers roughly 35-40 pages of dense text

            answer = await explainConcept(question, context);
            // ↑ Sends the question and document context to GPT-4o-mini
            //   The full text goes in the prompt as one big blob
            //   This works for short documents but loses precision for long ones
        }

        // ─────────────────────────────────────
        // GAMIFICATION: Award XP (non-blocking)
        // ─────────────────────────────────────
        let xpResult = null;
        try {
            xpResult = await awardDocumentChatXP(req.user.id);
            // ↑ awardDocumentChatXP has a daily cap: first 5 chat messages award +5 XP each
            //   After 5 messages, no more XP for that day (prevents XP farming)

            await updateStreak(req.user.id);
            await incrementUsage(req.user.id, 'aiChatQueries');
            // ↑ Increments: user.usage.aiChatQueries += 1
            //   This counter is checked by checkChatLimit on the next request
        } catch (xpErr) {
            console.error('XP Award Error (non-blocking):', xpErr.message);
            // ↑ Non-blocking: XP failure never fails the chat response
        }

        res.json({ answer, mode, xpAwarded: xpResult?.xpAwarded || 0 });
        // ↑ React uses:
        //   answer     → display the AI response text
        //   mode       → show "RAG" or "GPT-4" badge in the UI
        //   xpAwarded  → show "+5 XP" toast notification

    } catch (err) {
        console.error('Chat Error:', err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('Quota')) {
            return res.status(429).json({ message: 'AI Usage Limit Reached. Please wait a minute and try again.' });
            // ↑ Explicit 429 handling: the OpenAI SDK may not always throw with status 429
            //   We check the error message string too as a safety net
        }
        res.status(500).json({ error: err.message });
    }
};
```

---

### `embedDocument()` — Trigger RAG Ingestion

```javascript
export const embedDocument = async (req, res) => {
    try {
        const { documentId } = req.body;
        // ↑ Receives the document ID from React

        if (!documentId) return res.status(400).json({ message: 'documentId is required' });

        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // ↑ Same ownership guard — can only embed documents you own

        if (!doc.parsedText) {
            await getDocumentText(doc);
        }
        // ↑ Prerequisite: text must be extracted before chunking
        //   If parsedText is null, trigger the lazy extraction first
        //   This means embedDocument is fully self-contained:
        //   React can call POST /ai/embed directly without calling GET /documents/:id/content first

        const chunkCount = await ingestDocument(documentId);
        // ↑ Runs the full pipeline:
        //   1. chunkText()          → split into 500-char segments
        //   2. generateEmbeddings() → Jina AI → 1024-d vectors
        //   3. DocumentChunk.insertMany() → save to MongoDB
        //   4. doc.isEmbedded = true, doc.chunkCount = N → save

        res.json({
            message: `Document embedded successfully`,
            chunkCount,
            isEmbedded: true
        });
        // ↑ React reads isEmbedded: true → updates the document card to show "AI Ready" badge

    } catch (err) {
        console.error('Embed Error:', err);
        res.status(500).json({ error: err.message });
    }
};
```

---

### `generateDocumentSummary()` — Simple AI Summary

```javascript
export const generateDocumentSummary = async (req, res) => {
    try {
        const { documentId } = req.body;
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const text = await getDocumentText(doc);
        // ↑ Get text from cache or extract fresh

        const summary = await summarizeText(text.substring(0, 30000));
        // ↑ Sends first 30,000 chars to OpenAI for summarization
        //   summarizeText() wraps this in retryWithBackoff for resilience
        //   30,000 chars ≈ 7,500 tokens ≈ 20-25 pages

        doc.summary = summary;
        await doc.save();
        // ↑ Cache the summary in MongoDB
        //   Unlike parsedText, we don't check for an existing summary before generating
        //   (The user may want to regenerate if the document changed)

        res.json({ summary });
    } catch (err) { /* ... */ }
};
```

---

### `createFlashcards()` — AI Study Cards

```javascript
export const createFlashcards = async (req, res) => {
    try {
        const { documentId, deckTitle } = req.body;
        const doc = await Document.findById(documentId);

        const text = await getDocumentText(doc);
        const cardsData = await generateFlashcards(text.substring(0, 10000));
        // ↑ Only first 10,000 chars to keep the JSON response manageable
        //   Sending 100,000 chars would generate too many cards and hit token limits
        //   cardsData = [{ front: "Q", back: "A" }, ...]

        const newDeck = new FlashcardDeck({
            user: req.user.id,
            document: documentId,
            // ↑ Optional link to the source document for traceability

            title: deckTitle || `Deck: ${doc.filename}`,
            // ↑ User can provide a custom deck name, otherwise default to filename

            cards: cardsData
            // ↑ Mongoose validates this against CardSchema: { front, back, pinned }
        });

        await newDeck.save();
        // ↑ Creates a FlashcardDeck document in MongoDB

        // Gamification + usage tracking (non-blocking)
        try {
            xpResult = await awardXP(req.user.id, XP_VALUES.REVIEW_FLASHCARDS, 'flashcard_creation');
            await updateStreak(req.user.id);
            await incrementUsage(req.user.id, 'flashcardDecks');
            // ↑ incrementUsage: user.usage.flashcardDecks += 1
            //   Checked by checkFlashcardLimit on next creation request
        } catch (xpErr) { /* non-blocking */ }

        res.status(201).json({ ...newDeck.toObject(), xpAwarded: xpResult?.xpAwarded || 0 });
        // ↑ 201 Created — returns the full deck so React can immediately render it
    } catch (err) { /* ... */ }
};
```

---

### `createQuiz()` — AI-Generated MCQ Quiz

```javascript
export const createQuiz = async (req, res) => {
    try {
        const { documentId, numQuestions, questions } = req.body;
        // ↑ questions = optional array — if provided, skip AI generation and use these directly
        //   This allows React to pass pre-built questions (e.g. from a question bank)

        const doc = await Document.findById(documentId);

        let quizData;

        if (questions && Array.isArray(questions) && questions.length > 0) {
            quizData = questions;
            // ↑ BYPASS MODE: Use provided questions directly
            //   Useful for: question banks, manual quiz creation, retakes
        } else {
            const text = await getDocumentText(doc);
            quizData = await generateQuiz(text.substring(0, 10000), numQuestions || 5);
            // ↑ AI MODE: Generate questions from document text
            //   numQuestions defaults to 5 if not provided
        }

        const newQuiz = new Quiz({
            user: req.user.id,
            document: documentId,
            title: `Quiz: ${doc.filename}`,
            questions: quizData,
            // ↑ Mongoose validates against QuestionSchema:
            //   { question, options: [string], correctAnswer, explanation }

            totalQuestions: quizData.length
            // ↑ Stored for quick percentage calculation without querying questions array length
        });

        await newQuiz.save();
        // ↑ The quiz is saved WITHOUT a score initially (score defaults to 0)
        //   The user takes the quiz, then PATCH /ai/quiz/:id/score updates it

        res.status(201).json(newQuiz);
    } catch (err) { /* ... */ }
};
```

---

### `updateQuizScore()` — Submit Quiz Results

```javascript
export const updateQuizScore = async (req, res) => {
    try {
        const { id } = req.params;
        // ↑ Quiz _id from the URL: PUT /ai/quiz/64abc123/score

        const { score } = req.body;
        // ↑ The number of correct answers (e.g. 4 out of 5)

        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        if (quiz.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // ↑ Ownership guard — cannot submit a score for someone else's quiz

        quiz.score = score;
        await quiz.save();
        // ↑ Updates the score on the existing Quiz document

        const percentage = quiz.totalQuestions > 0 ? (score / quiz.totalQuestions) * 100 : 0;
        // ↑ Example: score=4, totalQuestions=5 → percentage = 80
        //   Guard against division by zero with > 0 check

        await QuizResult.create({
            user: req.user.id,
            score: score,
            totalQuestions: quiz.totalQuestions,
            percentage: percentage,
            quizTitle: quiz.title
        });
        // ↑ Creates a SEPARATE QuizResult record — a permanent historical log
        //   WHY separate from Quiz?
        //   A user might retake the same quiz multiple times with different scores
        //   The Quiz document only holds the latest score, but QuizResult has ALL attempts
        //   The progress analytics page reads QuizResult to show performance trends over time

        let xpResult = null;
        try {
            xpResult = await awardXP(req.user.id, XP_VALUES.COMPLETE_QUIZ, 'quiz_completion');
            await updateStreak(req.user.id);
        } catch (xpErr) { /* non-blocking */ }

        res.json({ ...quiz.toObject(), xpAwarded: xpResult?.xpAwarded || 0 });
    } catch (err) { /* ... */ }
};
```

---

### `getDecks()` and `getQuizzes()` — Simple List Reads

```javascript
export const getDecks = async (req, res) => {
    try {
        const decks = await FlashcardDeck.find({ user: req.user.id }).sort({ createdAt: -1 });
        // ↑ Fetch all flashcard decks for the logged-in user, newest first
        res.json(decks);
    } catch (err) { /* ... */ }
};

export const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.id }).sort({ attemptedAt: -1 });
        // ↑ attemptedAt = when the quiz was started (the date of the Quiz document creation)
        //   Sort newest-first so recent quizzes appear at the top
        res.json(quizzes);
    } catch (err) { /* ... */ }
};
```

---

# PART 5: THE MONGODB MODELS

### `FlashcardDeck.js`

```javascript
const CardSchema = new mongoose.Schema({
    front: { type: String, required: true },   // The question side of the card
    back:  { type: String, required: true },   // The answer side of the card
    pinned: { type: Boolean, default: false }  // User can pin important cards (future feature)
});

const FlashcardDeckSchema = new mongoose.Schema({
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    document:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document'  },
    // ↑ Optional link to source document. Not required because decks can be created manually too.
    title:     { type: String, required: true },
    cards:     [CardSchema],
    // ↑ Array of embedded CardSchema subdocuments
    //   MongoDB stores them as a nested array inside the FlashcardDeck document
    //   No separate collection — they are part of the same document
    createdAt: { type: Date, default: Date.now }
});
```

### `Quiz.js`

```javascript
const QuestionSchema = new mongoose.Schema({
    question:      { type: String, required: true },
    options:       [{ type: String, required: true }], // Array of 4 answer choices
    correctAnswer: { type: String, required: true },   // Must match one of the options
    explanation:   { type: String }                    // Why the correct answer is correct
});

const QuizSchema = new mongoose.Schema({
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    document:       { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title:          { type: String,  required: true },
    questions:      [QuestionSchema],   // Embedded question subdocuments
    score:          { type: Number,  default: 0 },     // Updated by updateQuizScore()
    totalQuestions: { type: Number,  default: 0 },     // Set at creation time
    attemptedAt:    { type: Date,    default: Date.now }
});
```

### `QuizResult.js` — The History Log

```javascript
const QuizResultSchema = new mongoose.Schema({
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score:          { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage:     { type: Number, required: true },
    quizTitle:      { type: String, default: 'General Quiz' },
    createdAt:      { type: Date,   default: Date.now }
});
// ↑ One QuizResult is created per quiz attempt
//   Multiple attempts on the same quiz = multiple QuizResult records
//   Enables historical performance charts without losing past data
```

### `DocumentChunk.js` — The Vector Store

```javascript
const DocumentChunkSchema = new mongoose.Schema({
    document:   { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    // ↑ index: true creates a regular MongoDB B-tree index for fast lookups by document
    //   Combined with $vectorSearch filtering, this is critical for performance

    chunkIndex: { type: Number, required: true },
    content:    { type: String, required: true },    // Raw text of this chunk
    embedding:  { type: [Number], required: true },  // 1024 floats from Jina AI
    createdAt:  { type: Date, default: Date.now }
});

DocumentChunkSchema.index({ document: 1, chunkIndex: 1 });
// ↑ Compound index: covers queries that filter by document AND sort by chunkIndex
//   MongoDB uses this when you do: DocumentChunk.find({ document: id }).sort({ chunkIndex: 1 })
```

---

# PART 6: UNIFIED SKELETON DIAGRAM

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║            CAREERCRAFT-AI — COMPLETE AI CORE & RAG SYSTEM FLOW                                          ║
║            From User Question → LLM Response (Both Simple & RAG Modes)                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝

══════════════════════════════════════════════════════════════════════════════
  PHASE 3 CONNECTION: ALL AI ROUTES START WITH AUTH
══════════════════════════════════════════════════════════════════════════════

  [React Frontend] → Authorization: Bearer <JWT>
       ▼
  verifyToken() → req.user.id = "64abc..."
  usageMiddleware → checkChatLimit / checkQuizLimit / checkFlashcardLimit
       ▼ (passes both gates) → controller runs

═══════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW A — POST /ai/embed    (RAG Ingestion — Do This ONCE Before Chatting)
  Middleware Chain: verifyToken → embedDocument()
═══════════════════════════════════════════════════════════════════════════════════════════════════

  [React: user clicks "Make AI Ready" on document card]
  POST /ai/embed { documentId: "64abc..." }
       │
╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER: embedDocument()                                                                    ║
║    doc.parsedText missing? → getDocumentText(doc) → Cloudinary fetch + pdf-parse               ║
║         ↓                                                                                       ║
║    [embeddingService.js — ingestDocument(documentId)]                                           ║
║         ↓                                                                                       ║
║    Step 1 → chunkText(parsedText, 500, 100)                                                     ║
║                Separators: \n\n → \n → '. ' → ' ' (best boundary found first)                 ║
║                Overlap: each chunk shares last 100 chars with next                              ║
║                Result: e.g. 47 chunks                                                           ║
║         ↓                                                                                       ║
║    Step 2 → generateEmbeddings(47 chunks)                                                       ║
║                POST https://api.jina.ai/v1/embeddings                                           ║
║                task: 'retrieval.passage' (optimized to BE FOUND)                               ║
║                Batch: 32 chunks per API call → ceil(47/32) = 2 API calls                       ║
║                Returns: [[1024 floats], [1024 floats], ...] — 1 vector per chunk               ║
║         ↓                                                                                       ║
║    Step 3 → DocumentChunk.insertMany(47 records) — 1 MongoDB write                             ║
║                Each record: { document, chunkIndex, content, embedding[1024] }                 ║
║         ↓                                                                                       ║
║    Step 4 → doc.isEmbedded = true, doc.chunkCount = 47 → doc.save()                           ║
║         ↓                                                                                       ║
║    ◄─ 200 { chunkCount: 47, isEmbedded: true }                                                 ║
║    ◄─ React: document card shows "AI Ready" ✅ badge                                            ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW B — POST /ai/chat   (Dual-Mode Chat — RAG or Legacy)
  Middleware Chain: verifyToken → checkChatLimit → chatWithDocument()
═══════════════════════════════════════════════════════════════════════════════════════════════════

  [React: user types "What is my GPA?" and selects RAG mode]
  POST /ai/chat { documentId, question, useRAG: true }
       │
╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║  checkChatLimit: user.usage.aiChatQueries < plan.limits.aiChatQueries?                         ║
║    └── Exceeded: 403 { upgradeRequired: true } ✗ STOP                                          ║
║    └── OK: next()                                                                               ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════╣
║  CONTROLLER: chatWithDocument()                                                                 ║
║                                                                                                 ║
║  if (useRAG && doc.isEmbedded):                                                                 ║
║  ═══════════════════════════════════════════════════════                                        ║
║  ║  PATH A — RAG MODE                                 ║                                        ║
║  ║                                                     ║                                        ║
║  ║  searchSimilarChunks("What is my GPA?", docId, 5)  ║                                        ║
║  ║    → generateQueryEmbedding("What is my GPA?")     ║                                        ║
║  ║        POST Jina AI, task: 'retrieval.query'        ║                                        ║
║  ║        Returns: [1024 floats] (question vector)     ║                                        ║
║  ║    → DocumentChunk.aggregate([                      ║                                        ║
║  ║         $vectorSearch: {                            ║                                        ║
║  ║           index: 'vector_index',                    ║                                        ║
║  ║           queryVector: [1024 floats],               ║                                        ║
║  ║           numCandidates: 100,                       ║                                        ║
║  ║           limit: 5,                                 ║                                        ║
║  ║           filter: { document: ObjectId(docId) }     ║ ← SECURITY: your doc only             ║
║  ║         }                                           ║                                        ║
║  ║       ])                                            ║                                        ║
║  ║    Returns: top 5 matching chunks (score 0-1)       ║                                        ║
║  ║                                                     ║                                        ║
║  ║  generateRAGResponse(question, chunks, filename)    ║                                        ║
║  ║    → systemPrompt: "Answer ONLY from context..."    ║                                        ║
║  ║    → userPrompt: "[Section 1]\n{chunk1}\n\n..."     ║                                        ║
║  ║                  "Question: What is my GPA?"        ║                                        ║
║  ║    → Groq llama-3.3-70b  temperature:0.3           ║                                        ║
║  ║    → Returns: "Your GPA is 3.9 out of 4.0"         ║                                        ║
║  ║    mode = 'rag-groq'                                ║                                        ║
║  ═══════════════════════════════════════════════════════                                        ║
║                                                                                                 ║
║  else (useRAG=false OR doc.isEmbedded=false):                                                   ║
║  ═══════════════════════════════════════════════════════                                        ║
║  ║  PATH B — LEGACY MODE                               ║                                        ║
║  ║                                                     ║                                        ║
║  ║  getDocumentText(doc)                               ║                                        ║
║  ║    → parsedText cache hit → instant return          ║                                        ║
║  ║    → cache miss → Cloudinary fetch + pdf-parse      ║                                        ║
║  ║  context = text.substring(0, 50000) (first 50k)    ║                                        ║
║  ║  explainConcept(question, context)                  ║                                        ║
║  ║    → GPT-4o-mini (via openaiService)                ║                                        ║
║  ║    → retryWithBackoff (3 attempts, 2s→4s→8s)        ║                                        ║
║  ║    mode = 'openai'                                  ║                                        ║
║  ═══════════════════════════════════════════════════════                                        ║
║                                                                                                 ║
║  [Gamification — non-blocking]:                                                                 ║
║    awardDocumentChatXP(userId) → +5 XP (capped at 25 XP/day)                                  ║
║    updateStreak(userId)                                                                         ║
║    incrementUsage(userId, 'aiChatQueries') → counter +1                                        ║
║                                                                                                 ║
║  ◄─ 200 { answer: "Your GPA is 3.9", mode: 'rag-groq', xpAwarded: 5 }                        ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW C — POST /ai/flashcards   (Simple AI Mode: No RAG)
  Middleware Chain: verifyToken → checkFlashcardLimit → createFlashcards()
═══════════════════════════════════════════════════════════════════════════════════════════════════

  [React: user clicks "Generate Flashcards"]
  POST /ai/flashcards { documentId, deckTitle }
       │
╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER: createFlashcards()                                                                 ║
║    getDocumentText(doc) → parsedText cache hit or lazy extraction                              ║
║    generateFlashcards(text.substring(0, 10000))                                                 ║
║        → Builds prompt: "Create 5 flashcards. Return JSON { cards: [...] }"                   ║
║        → OpenAI gpt-4o-mini, response_format: json_object                                     ║
║        → JSON.parse(response) → returns parsed.cards array                                     ║
║        → retryWithBackoff (3 retries, fallback to mock cards)                                  ║
║    new FlashcardDeck({ user, document, title, cards: cardsData })                              ║
║    newDeck.save() → MongoDB FlashcardDeck collection                                           ║
║    [Gamification]: awardXP(REVIEW_FLASHCARDS) → incrementUsage(flashcardDecks)                 ║
║    ◄─ 201 { ...deckObject, xpAwarded }                                                         ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW D — POST /ai/quiz + PUT /ai/quiz/:id/score   (Quiz Generation + Scoring)
  Middleware Chain: verifyToken → checkQuizLimit → createQuiz()
═══════════════════════════════════════════════════════════════════════════════════════════════════

  PHASE 1 — GENERATION:
  POST /ai/quiz { documentId, numQuestions: 5 }
       │
╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER: createQuiz()                                                                       ║
║    if (questions provided by React) → skip AI, use provided questions directly                  ║
║    else:                                                                                        ║
║        getDocumentText(doc)                                                                     ║
║        generateQuiz(text.substring(0, 10000), 5)                                               ║
║            → Prompt: "Generate 5 MCQ questions. Return JSON { questions: [...] }"              ║
║            → OpenAI gpt-4o-mini, response_format: json_object                                 ║
║            → Each question: { question, options[4], correctAnswer, explanation }               ║
║    new Quiz({ user, document, title, questions, totalQuestions: 5 })                           ║
║    quiz.save() → MongoDB Quiz collection                                                       ║
║    incrementUsage(quizzesToday)                                                                 ║
║    ◄─ 201 { quiz object with all questions }                                                    ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════╝

  [React: user takes the quiz and answers all questions]
  [React: submits score]

  PHASE 2 — SCORING:
  PUT /ai/quiz/64abc.../score { score: 4 }
       │
╔═════════════════════════════════════════════════════════════════════════════════════════════════╗
║  CONTROLLER: updateQuizScore()                                                                  ║
║    quiz = Quiz.findById(req.params.id)                                                          ║
║    Ownership guard: quiz.user.toString() !== req.user.id? → 403 ✗                              ║
║    quiz.score = 4 → quiz.save() → updates Quiz document                                        ║
║    percentage = (4 / 5) * 100 = 80                                                             ║
║    QuizResult.create({ user, score: 4, totalQuestions: 5, percentage: 80, title })             ║
║        WHY separate? → permanent history for analytics (retakes create multiple results)        ║
║    awardXP(COMPLETE_QUIZ) → updateStreak                                                       ║
║    ◄─ 200 { ...quiz, xpAwarded }                                                               ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════════════════════
  FLOW E — GET Routes (Read-Only, No AI Calls)
═══════════════════════════════════════════════════════════════════════════════════════════════════

  GET /ai/flashcards  → FlashcardDeck.find({ user: req.user.id }).sort({ createdAt: -1 })
  GET /ai/quiz        → Quiz.find({ user: req.user.id }).sort({ attemptedAt: -1 })

═══════════════════════════════════════════════════════════════════════════════════════════════════
  CROSS-SYSTEM INTERACTION MAP
═══════════════════════════════════════════════════════════════════════════════════════════════════

  Phase 3 Auth (verifyToken)  ────────────────────────────► All 9 AI routes → req.user.id
  Phase 4 Documents           ────────────────────────────► getDocumentText() (parsedText cache)
  usageMiddleware (limits)    ────────────────────────────► checkChatLimit, checkFlashcardLimit
  openaiService (GPT-4o-mini) ────────────────────────────► flashcards, quiz, summary, legacy chat
  groqService (Llama 3.3 70B) ────────────────────────────► RAG chat only
  embeddingService (Jina AI)  ────────────────────────────► embed route → chatWithDocument (RAG)
  MongoDB DocumentChunk       ────────────────────────────► $vectorSearch → RAG context retrieval
  MongoDB FlashcardDeck       ────────────────────────────► createFlashcards → getDecks
  MongoDB Quiz + QuizResult   ────────────────────────────► createQuiz → updateQuizScore
  gamificationService         ────────────────────────────► XP + streak updates (all features)

═══════════════════════════════════════════════════════════════════════════════════════════════════
  REAL USER JOURNEY — COMPLETE AI LIFECYCLE
═══════════════════════════════════════════════════════════════════════════════════════════════════

  DAY 1 — Document uploaded (Phase 4 complete)
  isEmbedded = false, parsedText = null

  USER OPENS DOCUMENT:
    GET /documents/:id/content → pdf-parse → parsedText cached ✅

  USER CLICKS "MAKE AI READY":
    POST /ai/embed →
      chunkText → 47 chunks
      Jina AI (passage task) → 47 vectors
      DocumentChunk.insertMany → MongoDB Atlas
      isEmbedded = true ✅

  USER GENERATES FLASHCARDS:
    POST /ai/flashcards →
      parsedText[:10000] → GPT-4o-mini (JSON mode) →
      [{ front, back }...] → FlashcardDeck saved ✅
      +XP awarded

  USER GENERATES QUIZ:
    POST /ai/quiz →
      parsedText[:10000] → GPT-4o-mini (JSON mode) →
      [{ question, options, correctAnswer, explanation }...] →
      Quiz saved (score=0) ✅

  USER TAKES QUIZ AND SUBMITS:
    PUT /ai/quiz/:id/score { score: 4 } →
      quiz.score = 4, quiz.save()
      QuizResult.create({ percentage: 80 }) → history log
      +XP awarded ✅

  USER CHATS (LEGACY MODE):
    POST /ai/chat { useRAG: false } →
      parsedText[:50000] → GPT-4o-mini →
      answer (holistic but may miss details in long docs)

  USER CHATS (RAG MODE — PRECISION):
    POST /ai/chat { useRAG: true } →
      question → Jina AI (query task) → query vector
      $vectorSearch → 5 most relevant chunks
      chunks + question → Groq Llama 3.3 70B (temp: 0.3) →
      answer (grounded in specific document section) ✅
```

---

# PART 7: KEY INTERVIEW QUESTIONS & ANSWERS

**Q: What is the difference between RAG mode and Legacy mode in chatWithDocument?**
A: Legacy mode sends the entire document text (truncated to 50,000 characters) as context to GPT-4o-mini. It is simple but imprecise for long documents. RAG mode uses MongoDB Atlas vector search to find the 5 most semantically similar document chunks to the user's question, then sends only those chunks as context to Groq. RAG is more accurate, faster, and cheaper because it sends far fewer tokens to the LLM.

**Q: What is a token and why does it matter?**
A: A token is roughly 3/4 of a word — the smallest unit an LLM processes. LLMs have a context window limit (how many tokens they can process at once). The text truncations in our code (`substring(0, 10000)`) exist to avoid exceeding this limit and to control API cost, since pricing is per-token.

**Q: Why does `retryWithBackoff` double the delay on each retry?**
A: This is the Exponential Backoff pattern. When an API service returns 429 (rate limit) or 503 (overloaded), repeatedly retrying immediately would make the problem worse by hammering the server. Doubling the wait time (2s → 4s → 8s) gives the server time to recover and spreads our retry load over time.

**Q: What is `response_format: { type: "json_object" }` and why use it?**
A: It is OpenAI's JSON mode — a guarantee that the model's output will always be valid, parseable JSON. Without it, the model might add explanatory text around the JSON ("Here are your flashcards: {...}") which would break `JSON.parse()`. JSON mode also prevents malformed JSON (missing brackets, trailing commas) that would crash the application.

**Q: Why does `generateEmbeddings` use `retrieval.passage` while `generateQueryEmbedding` uses `retrieval.query`?**
A: Jina AI v3 uses asymmetric embeddings. Document chunks (passages) are optimized to be *found* by a search. Questions (queries) are optimized to *find* matching passages. Using the same task for both significantly reduces retrieval accuracy because questions and their answers are phrased very differently even though they share the same meaning.

**Q: Why is `QuizResult` a separate model from `Quiz`?**
A: A user can retake the same quiz multiple times. The `Quiz` document only stores the latest score. `QuizResult` creates a permanent, immutable record of every attempt. This enables the analytics/progress dashboard to show performance trends over time (e.g. "Your average quiz score improved from 60% to 85% over the last month").

**Q: What happens if OpenAI returns a 429 rate limit error on the third retry?**
A: After three retries with exponential backoff (waiting 2s, 4s, and 8s), the `retryWithBackoff` function falls through to the `fallbackValue`. For flashcards, this is a set of mock card objects. For quizzes, it is mock questions. The app continues functioning normally — the user sees sample content rather than an error screen. This is the graceful degradation pattern.

**Q: What does `numCandidates: topK * 20` do in $vectorSearch?**
A: MongoDB's vector search uses an Approximate Nearest Neighbor (ANN) algorithm. It first quickly identifies `numCandidates` (100) approximate matches from the index. Then it computes exact cosine similarity on those 100 candidates and returns the best `topK` (5). Scanning all chunks exactly would be very slow for large collections. `topK * 20` is the industry-standard ratio for balancing recall (finding the truly best chunks) with search speed.
