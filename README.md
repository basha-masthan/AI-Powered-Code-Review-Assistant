# AI-Powered Code Review Assistant

A full-stack application that enables developers to upload source code, repositories, or project files and receive structured AI-generated code reviews using configurable AI models (OpenAI, LM Studio, Ollama, OpenRouter, Groq, and any OpenAI-compatible endpoint).

## Features

- **Authentication**: JWT-based secure user registration and login.
- **Project Management**: Organize code reviews by projects (create, view, delete).
- **Code Upload**: Upload via ZIP, drag-and-drop, or import from GitHub URL.
- **Code Explorer**: Browse uploaded files in a folder hierarchy tree with syntax highlighting and file search.
- **AI Review Engine**: Run Security, Performance, and Code Quality reviews with severity ratings.
- **Review History**: View, search, and open past review details.
- **AI Chat**: Ask questions about the codebase with chat context retention.
- **Configurable AI Providers**: Support for OpenAI, LM Studio, Ollama, OpenRouter, Groq, and any OpenAI-compatible endpoint.
- **Bonus Tools**: Documentation Generator and Unit Test Generator built into the UI.

## Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui (Base UI), Zustand, Axios
- **Backend**: NestJS, TypeScript, Prisma ORM, Passport JWT, LangChain
- **Database**: PostgreSQL (Remote Neon for production)

## Setup Instructions

### Prerequisites
- Node.js (v18+)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env  # Edit with your settings
npm install
npx prisma db push
npm run start:dev
```
The backend will run on `http://localhost:3001`.

**Environment Variables** (`backend/.env`):
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001

# Optional: Pre-configure AI providers on registration
# OPENAI_API_KEY="sk-..."
# OPENROUTER_API_KEY="sk-or-..."
# GROQ_API_KEY="gsk_..."
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`. Open it in your browser.

## How to Use

1. **Register** a new account.
2. Go to **Settings** and add an AI Provider. For testing with OpenAI, provide `https://api.openai.com/v1`, your API key, and `gpt-4o`. For local models like LM Studio, use `http://localhost:1234/v1` and leave the API key blank.
3. Create a **New Project** in the Dashboard.
4. Click **Upload Code** and choose one of:
   - **Drag & Drop** a ZIP file
   - **Click** to browse and select a ZIP file
   - **Import from GitHub** by pasting a repository URL
5. Explore the code in the **Code Explorer** tab with folder hierarchy and file search.
6. Switch to **AI Reviews**, select your provider and template (Security, Performance, Code Quality), and click **Start Review**.
7. Use **Docs** and **Tests** bonus buttons to generate documentation and unit tests.
8. Switch to **AI Chat** to ask questions about the code.

## AI Usage Report

This project was developed with AI assistance, including code generation, architecture planning, and implementation. AI tools used include:

- **ChatGPT** for initial concept development and architecture decisions
- **Claude** for code implementation and debugging
- **GitHub Copilot** for iterative code improvements
- **Integrated AI Libraries**: `@langchain/openai` for the application's AI functionality

100% of the code (excluding framework boilerplates and shadcn/ui components) was AI-generated and manually reviewed/verified.

## Acknowledgments

- Built with **NestJS**, **Next.js**, **Prisma**, **shadcn/ui**, **Zustand**, and **Tailwind CSS**
- Uses **LangChain** for flexible AI provider integration
- Supports multiple AI providers through OpenAI-compatible endpoints
- Feature-complete production-ready code review assistant