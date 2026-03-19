# CareerCraft AI

CareerCraft AI is an intelligent, gamified learning and career preparation platform. It leverages advanced Large Language Models (LLMs) to provide automated mock interviews, instantly generate contextual study materials (such as quizzes and interactive flashcards) directly from uploaded documents, and offers interactive document chat capabilities for deep research.

## Features and Capabilities

### Document Management and Chat Analysis
- **Secure File Processing**: Users can securely upload their study materials in PDF format. The files are parsed extracting semantic text while the original documents are stored reliably via Cloudinary integration.
- **Conversational Document Retrieval**: Features an AI-powered conversational interface designed to query the uploaded documents directly. Users can extract insights, ask specific domain questions, and receive precisely constructed answers from within the document's context.
- **Automated Summarization**: Automatically processes long-form content to extract the most critical insights, returning concise bulleted summaries for rapid reading.

### Dynamic Generation of Study Materials
- **Flashcard Extraction**: The AI Engine intelligently scans technical or academic documents to extract key concepts, definitions, and formulas, instantly transforming them into interactive, 3D-animated study flashcard decks.
- **Contextual Quizzes**: Automatically constructs multiple-choice assessment tests mapped to the specific content of the user documents. The platform provides real-time scoring and detailed AI-generated explanations for both correct and incorrect answers to foster active learning.

### AI-Simulated Mock Interviews
- **Role-Specific Scenarios**: Users can initialize mock interviews tailored specifically to their desired job roles (e.g., Frontend Developer, Data Scientist), target companies, and preferred difficulty tiers.
- **Real-Time Interactive Feedback**: The AI functions as a strict but constructive hiring manager. It conducts a multi-turn conversational interview, asking subsequent technical questions dynamically and evaluating user responses on-the-fly.

### Gamification Engine and Progression
- **Experience Points (XP) Architecture**: An integrated progression system that records user activity. Users earn distinct XP rewards for taking quizzes, studying flashcard decks, engaging with mock interviews, and uploading new study materials.
- **Streaks and Retention**: A streak tracking system encourages daily engagement. By claiming a daily streak, users boost their rank.
- **Global Leaderboard**: A competitive environment that displays the top 100 users ranked by accumulated XP, fostering a community-driven learning atmosphere.

### Authentication and Security 
- **Verifiable Registration**: Features a robust JWT-based authentication protocol backed by secure, transactional OTP (One Time Password) email verification flows (integrated with the Brevo HTTP API).
- **Secure Password Reclamation**: Provides a standard timed-token reset flow for password recovery.

---

## Technical Architecture

### Frontend Layer
- **Core Technology**: React.js bundled via Vite.
- **Routing**: Client-side routing implemented through React Router DOM (v6).
- **Styling Architecture**: Designed entirely with Tailwind CSS, utilizing a custom design system focusing on micro-interactions, dark/light mode parity, and responsive UI components.
- **State and Interactions**: Framer Motion handles complex, physics-based transitions, ensuring a premium "application-like" feel over typical web pages.
- **Deployment Strategy**: Deployed natively on Vercel utilizing configured dynamic route rewrites (`vercel.json`).

### Backend Layer
- **Core Engine**: Node.js and Express.js forming the REST mapping and server logic.
- **Persistent Storage**: MongoDB Atlas utilizing Mongoose ORM for structured, schemas-based document storage (Users, Documents, FlashcardDecks, InterviewSessions).
- **AI Integration**: Implements the official Google GenAI SDK to interact directly with the `gemini-2.5-flash` language model and `text-embedding-004` embedding model.
- **External Communications**: Email deliveries override standard SMTP constraints (beneficial for environments like Render) by invoking the Brevo HTTP API via custom abstraction layers.
- **Media Hosting**: Integration with Cloudinary for handling and parsing PDF buffers securely.

---

## Planned Implementation: Retrieval-Augmented Generation (RAG)

To significantly scale the application's ability to "read" and comprehend massive documents (potentially hundreds of pages long) without sacrificing speed or exceeding model context limits, a complete RAG (Retrieval-Augmented Generation) infrastructure is scheduled for implementation.

### Architectural Flow of the RAG Implementation:
1. **Document Ingestion and Parsing**: When a PDF is uploaded, the native text parser processes the file buffer.
2. **Semantic Chunking**: Instead of truncating documents at a static character limit, the text is sliced into logical, overlapping chunks (approximately 500-1000 characters each). This prevents cutting off important contextual sentences.
3. **Vector Embeddings via Gemini**: Every individual chunk is passed asynchronously through Gemini's lightweight `text-embedding-004` model. This transforms human-readable text into a 768-dimensional mathematical vector representing its pure semantic meaning.
4. **Vector Storage**: These vectors and their corresponding text payloads are pushed to MongoDB Atlas Vector Search inside a new `DocumentChunk` collection, complete with established search indexing.
5. **Retrieval**: When a user queries a document within the chat interface, the system first embeds their search query into a vector. Using cosine similarity algorithms, MongoDB Atlas instantly filters and retrieves only the top 5 most highly correlated chunks.
6. **Augmented Generation**: The system builds an optimized prompt containing the user's question and the specific focused text chunks, ensuring the final Gemini response is hyper-accurate, hallucination-resistant, and entirely scalable irrespective of the source document's length.

---

## Project Structure

```text
CareerCraft-AI/
├── client/                 # React Frontend (Vite)
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Layout, Cards, Forms)
│   │   ├── context/        # Global React Context providers (AuthContext)
│   │   ├── pages/          # Application Views (Dashboard, Interview, Quizzes)
│   │   ├── utils/          # Interceptor-equipped Axios configs and API wrappers
│   │   ├── App.jsx         # Application router component
│   │   └── index.css       # Global stylesheet and Tailwind entry definitions
│   └── vercel.json         # Vercel deployment and routing overrides
├── server/                 # Node.js Express Backend
│   ├── config/             # External service initializations (MongoDB, Cloudinary)
│   ├── controllers/        # Request handling and business logic layers
│   ├── middleware/         # Authentication and rate/usage limiting interceptors
│   ├── models/             # Standardized Mongoose data schemas
│   ├── routes/             # RESTful API endpoint definitions
│   ├── services/           # Abstractions for 3rd party APIs (GenAI, Gamification)
│   ├── utils/              # General helper functions and utilities (Email)
│   └── index.js            # Server entry and middleware bootstrapping
└── README.md
```

---

## Setup and Installation

### Required Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Atlas cluster URL
- Cloudinary developer credentials
- Google Gemini Developer API Key
- Brevo Account API Key

### 1. Preparing the Backend Environment
Navigate into the server directory and install dependencies:
```bash
git clone https://github.com/yourusername/CareerCraft-AI.git
cd CareerCraft-AI/server
npm install
```

Create a `.env` file at the root of the `server/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_secure_randomly_generated_string
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_verified_sender_email
CLIENT_URL=http://localhost:5173
```
Start the local API development server:
```bash
npm run dev
```

### 2. Preparing the Frontend Environment
In a new terminal split, navigate to the client directory:
```bash
cd CareerCraft-AI/client
npm install
```

Create a `.env` file at the root of the `client/` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the React development server:
```bash
npm run dev
```

The localized environment will be ready. Access the application at `http://localhost:5173`.

---

## Licensing
This software is provided under the terms of the MIT License.
