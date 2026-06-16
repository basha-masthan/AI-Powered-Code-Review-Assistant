# Architecture Overview

## Frontend Architecture
The frontend is built using **Next.js 15 (App Router)** with **TypeScript**.
- **State Management**: Zustand is used for managing the global authentication state across the application without prop-drilling.
- **UI Components**: Built using **shadcn/ui** and **Tailwind CSS**. This combination allows for highly customizable, accessible, and beautiful UI components out of the box, with full dark-mode support.
- **API Communication**: A centralized `axios` instance (`src/lib/api.ts`) is configured to handle base URLs and automatically attach the JWT token to request headers.

## Backend Architecture
The backend leverages **NestJS**, a progressive Node.js framework providing a robust, highly testable, and scalable structure.
- **Modules**: The application is divided into domain-driven modules: `Auth`, `Projects`, `Files`, `Reviews`, `AI-Providers`, and `Chat`.
- **Validation**: DTOs and `class-validator` are used extensively to ensure payload integrity at the API boundary.
- **Authentication**: Implementing Passport JWT strategy to secure endpoints via `AuthGuard`.

## Database Design
**PostgreSQL** is managed via **Prisma ORM**.
- **User**: Stores authenticated users.
- **Project**: Represents a logical grouping of code uploaded by a user.
- **File**: Stores extracted text-based source files associated with a project.
- **AIProvider**: Stores user-configured endpoints and API keys.
- **Review** & **ReviewIssue**: Stores AI analysis summaries and structured line-by-line issues.
- **ChatSession** & **ChatMessage**: Stores historical chat contexts for the code chat assistant.

## AI Integration Flow
1. **Configuration**: The user defines custom AI providers (e.g., local LM Studio or OpenAI).
2. **Context Gathering**: Upon triggering a review or chat, the backend fetches associated Project files from PostgreSQL.
3. **Prompt Construction**: The backend builds a `SystemMessage` detailing the task (Security, Performance, Chat context).
4. **Execution**: `@langchain/openai` is used as a generic adapter to call the configured `baseURL` and `modelName`.
5. **Parsing**: The AI output is explicitly requested in JSON format, which the backend parses and stores into structured PostgreSQL tables.
