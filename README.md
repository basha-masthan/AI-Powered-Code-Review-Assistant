# AI-Powered Code Review Assistant

A full-stack application that enables developers to upload source code via ZIP and receive structured AI-generated code reviews using configurable AI models (OpenAI, LM Studio, Ollama).

## Features
- **Authentication**: JWT-based secure user registration and login.
- **Project Management**: Organize code reviews by projects.
- **Code Explorer**: Upload ZIP files and browse source code with syntax highlighting.
- **AI Review Engine**: Run Security, Performance, and Code Quality reviews on the codebase.
- **AI Chat**: Ask questions about the codebase using the context of uploaded files.
- **Configurable AI Providers**: Support for local and cloud models.
- **Bonus**: Documentation Generator and Unit Test Generator built into the review engine API endpoints.

## Technology Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Axios
- **Backend**: NestJS, TypeScript, Prisma ORM, Passport JWT
- **Database**: PostgreSQL

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker (for PostgreSQL)

### 1. Database Setup
Start the PostgreSQL database using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```
The backend will run on `http://localhost:3001`.

**Environment Variables** (`backend/.env`):
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/codereview?schema=public"
JWT_SECRET="super-secret-jwt-key-change-in-production"
PORT=3001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`. Open it in your browser.

## How to use
1. Register a new account.
2. Go to **Settings** and add an AI Provider. For testing with OpenAI, provide `https://api.openai.com/v1`, your API key, and `gpt-4o`. For local models like LM Studio, use `http://localhost:1234/v1` and leave the API key blank.
3. Create a **New Project** in the Dashboard.
4. Click **Upload ZIP** and upload a small to medium-sized codebase.
5. Explore the code in the **Code Explorer** tab.
6. Switch to **AI Reviews**, select your provider and template, and click **Start Review**.
7. Switch to **AI Chat** to ask questions about the code.
