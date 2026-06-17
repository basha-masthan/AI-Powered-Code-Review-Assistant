# Architecture Overview

## Frontend Architecture
The frontend is built using **Next.js 15 (App Router)** with **TypeScript**.
- **State Management**: Zustand is used for managing the global authentication state across the application without prop-drilling.
- **UI Components**: Built using **shadcn/ui** (Base UI) and **Tailwind CSS**. This combination allows for highly customizable, accessible, and beautiful UI components out of the box, with full dark-mode support.
- **API Communication**: A centralized `axios` instance (`src/lib/api.ts`) is configured to handle base URLs and automatically attach the JWT token to request headers.
- **Pages**: `/login`, `/register`, `/dashboard` (project list), `/projects/[id]` (code explorer, reviews, chat tabs), `/settings` (AI provider management).
- **Components**: `CodeExplorer` (file tree + syntax highlighting), `ReviewDashboard` (trigger reviews, history, bonus tools), `AIChat` (conversational Q&A about code).

## Backend Architecture
The backend leverages **NestJS**, a progressive Node.js framework providing a robust, highly testable, and scalable structure.
- **Modules**: The application is divided into domain-driven modules: `Auth`, `Projects`, `Files`, `Reviews`, `AI-Providers`, and `Chat`.
- **Validation**: DTOs and `class-validator` are used extensively to ensure payload integrity at the API boundary.
- **Authentication**: Custom `AuthGuard` validates JWT tokens from the `Authorization` header on protected routes.
- **File Processing**: ZIP uploads are parsed with `adm-zip`, filtering out binaries and common ignored directories. GitHub imports use the GitHub REST API to fetch repository contents recursively.

## Database Design
**PostgreSQL** is managed via **Prisma ORM**.
- **User**: Stores authenticated users with bcrypt-hashed passwords.
- **Project**: Represents a logical grouping of code uploaded by a user.
- **File**: Stores extracted text-based source files associated with a project.
- **AIProvider**: Stores user-configured endpoints and API keys per user.
- **Review** & **ReviewIssue**: Stores AI analysis summaries and structured issues with severity ratings.
- **ChatSession** & **ChatMessage**: Stores historical chat contexts for the code chat assistant.

## AI Integration Flow
1. **Configuration**: The user defines custom AI providers via the Settings page (base URL, API key, model name).
2. **Context Gathering**: Upon triggering a review or chat, the backend fetches associated Project files from PostgreSQL (with truncation for large files).
3. **Prompt Construction**: The backend builds a `SystemMessage` detailing the task (Security, Performance, Code Quality, or Chat context).
4. **Execution**: `@langchain/openai` is used as a generic adapter to call the configured `baseURL` and `modelName`.
5. **Parsing**: Review output is requested in JSON format, which the backend parses and stores into structured PostgreSQL tables.
6. **Status Tracking**: Reviews transition from `PENDING` to `COMPLETED` or `FAILED` based on AI response success.

## File Upload Architecture
Three upload methods are supported:
1. **ZIP Upload**: Multipart file upload, parsed server-side with `adm-zip`.
2. **Drag & Drop**: Client-side file drop handling, posts ZIP data to the same upload endpoint.
3. **GitHub Import**: Backend fetches repository contents via `api.github.com`, supports both root-level and subdirectory imports.
