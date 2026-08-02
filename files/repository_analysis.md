# CareerCraft-AI: Codebase & Tech Stack Analysis

This document provides a comprehensive breakdown of the architecture, key features, technology stack, and modern software design patterns implemented within the **CareerCraft-AI** repository.

---

## 🏗️ 1. Architecture Overview

CareerCraft-AI is built on a modern **MERN (MongoDB, Express, React, Node)** architecture, split cleanly into:
1. **`/client`**: A highly interactive, responsive SPA built with **React 19** and **Vite (Rolldown compiler)**.
2. **`/server`**: A Node.js REST API using **Express v5** and **Mongoose v9** for data modeling, integration, and AI logic orchestration.

---

## 💻 2. Technology Stack

### Frontend (`/client`)
- **React 19**: Leverages modern React capabilities (concurrent rendering features, cleaner APIs).
- **Vite (with Rolldown)**: Configured with `rolldown-vite` (a Rust-based port of Rollup), enabling near-instant compilation and building.
- **Tailwind CSS v4 & PostCSS**: Integrates the latest Tailwind CSS v4, which delivers a CSS-first configuration and extremely fast build times.
- **Framer Motion v12**: Powering smooth page transitions (`AnimatePresence`) and premium card/modal hover micro-animations.
- **React Router DOM v7**: Provides standard client-side routing, protected routes, and state transition handling.
- **React Markdown v10 & Remark GFM**: Renders rich AI responses (markdown formatting, tables, lists, and code blocks) dynamically.
- **Axios**: Manages HTTP calls to the backend REST endpoints.

### Backend (`/server`)
- **Express v5**: Incorporates native async router handling, simplifying error propagation.
- **Mongoose v9**: Object Data Modeling (ODM) for MongoDB.
- **OpenAI Node SDK (`openai`)**: Interacts with OpenAI's API (specifically ChatGPT `gpt-4o-mini`) for prompt handling, structured json formats, and chat sessions.
- **Groq SDK**: Connects with Groq's high-speed inference engine for low-latency completions.
- **Cloudinary & Multer**: Handles binary resume/document file uploads, storing files securely on the cloud.
- **pdf-parse**: Extracts raw text contents from uploaded PDFs for downstream summarization, search, and quiz creation.
- **Razorpay SDK**: Handles payments, subscription plans, and verification signature validation.
- **Security & Logging**: `helmet` (hardens HTTP headers), `cors` (cross-origin controls), and `morgan` (log formats).

---

## 🚀 3. Core Features

### 🔐 1. Authentication & Security
- **JWT & Passwords**: JWT-based session tokens with `bcryptjs` password hashing.
- **Verification OTP**: Integrates Brevo, Resend, and Nodemailer to send OTP verification codes to confirm email accounts on registration.
- **Password Recovery**: Secure token generation and verification for password reset flows.

### 📄 2. Document & Resume Management
- Uploads PDFs to Cloudinary.
- Automatically extracts content using `pdf-parse`.
- Caches the parsed text in MongoDB (`parsedText`) to avoid repeatedly downloading and parsing PDFs.
- Supports two chat modes:
  - **Legacy Mode**: Passes a truncated section (up to 50,000 characters) directly to OpenAI ChatGPT (`gpt-4o-mini`).
  - **RAG Mode**: Performs vector search over document chunks and utilizes Llama 3.3.

### 🔍 3. Vector Embeddings & RAG Pipeline
CareerCraft-AI features a highly sophisticated Retrieval-Augmented Generation (RAG) pipeline:
- **Chunking**: Uses a recursive splitter (`chunkText`) that segments text by paragraph, newline, sentence, or word boundaries (`CHUNK_SIZE = 500`, `CHUNK_OVERLAP = 100`) to maintain context continuity.
- **Jina Embeddings v3**: Generates high-quality vector embeddings via Jina's `jina-embeddings-v3` model. It separates tasks explicitly using Jina's asymmetric task types:
  - `retrieval.passage` for indexing document chunks.
  - `retrieval.query` for search queries.
- **MongoDB Atlas Vector Search**: Performs vector similarity search directly in MongoDB using the `$vectorSearch` aggregation stage, complete with metadata filtering on `documentId`.
- **Groq LLM**: Feeds matching chunks into `llama-3.3-70b-versatile` with low temperature settings (`0.3`) for highly accurate, hallucination-free answers.

### 🧑‍🏫 4. Study & Assessment Tools
- **Flashcards Generator**: Takes extracted PDF text and calls OpenAI ChatGPT with `response_format: { type: "json_object" }` to output perfectly formatted JSON cards (`{ "cards": [{ "front", "back" }] }`) without markdown clutter.
- **Interactive Quizzes**: Generates MCQs dynamically from document content and scores them while saving results (`QuizResult`).

### 🗣️ 5. AI Mock Interviewer
- Starts interactive interview sessions based on target role, difficulty, company, and specific skills.
- Simulates conversational chat using OpenAI's chat completions with history memory mapped dynamically from Mongoose documents.
- Adopts customized interviewer personas based on target configuration.

### 🏆 6. Gamification System
Features designed to increase user retention:
- **XP Awards**: Standard points granted for daily login (+10), document uploads (+25), completing quizzes (+50), studying flashcards (+30), and mock interviews (+75).
- **Streak Tracker**: Tracks consecutive days of activity, awarding milestone bonuses (e.g., +50 XP for a 7-day streak, +200 XP for 30 days).
- **Leaderboards**: Ranks users globally using fast MongoDB aggregation logic.

### 💳 7. Subscription Tiering & Payment
- Implements 3 plans: **Free**, **Pro**, and **Enterprise** with monthly feature quotas.
- Integrates Razorpay payment orders, client-side checkout scripts, and signature verification.
- **Usage Middleware**: Express interceptors verify quotas before invoking AI endpoints (e.g., checking daily quiz counts or monthly mock interview limits).

---

## ⚡ 4. Modern Technologies & Best Practices

1. **Rust-Powered Frontend Tooling (Rolldown + Tailwind v4)**: Speeds up development cycle and client bundles using the modern Rust replacements for traditional JS tools.
2. **OpenAI Chat Completions & Model Tiering**: Uses the fast, cost-effective `gpt-4o-mini` model for rapid client feedback loops and general text assistance.
3. **Structured Outputs**: Forces LLMs to output strict JSON schemas (`response_format: { type: "json_object" }`) preventing runtime JSON parsing failures.
4. **Resilient AI Fallbacks**: Employs an exponential backoff retry wrapper (`retryWithBackoff`) that intercepts rate limits (HTTP 429) or transient overloads (HTTP 500/503) and gracefully falls back to pre-defined mock datasets, ensuring the app remains functional.
5. **Asymmetric Vector Embeddings**: Uses Jina's specialized task descriptors (`retrieval.passage` / `retrieval.query`) to maximize factual correctness during semantic searches.
6. **Express v5 Async Routes**: Avoids wrapper libraries or manual try-catch blocks for asynchronous endpoints by relying on Express 5's improved error handling mechanism.
