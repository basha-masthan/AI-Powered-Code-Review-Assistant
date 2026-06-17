# AI Usage Report

## AI Tools Used
- **Agent**: This project was developed with the assistance of an AI coding assistant.
- **Underlying Models**: Anthropic Claude / AI model for code generation, architecture planning, and logic implementation.
- **Integrated AI Libraries**: `@langchain/openai` was used within the codebase to facilitate flexible connections to any OpenAI-compatible API endpoint (OpenAI, LM Studio, Ollama, OpenRouter, Groq).

## Prompts Used (Within the App)
To power the Code Review engine, the following base prompt strategy was used:
```
You are an expert AI code reviewer. Focus on: {Security/Performance/Code Quality criteria}.
Review the provided code. Provide your response strictly in the following JSON format. Do not use markdown blocks around the JSON, just raw JSON text:
{
  "summary": "High-level overview of findings",
  "issues": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "description": "Detected problem",
      "recommendation": "Suggested improvement",
      "lineNumber": 10
    }
  ]
}
```

For the AI Chat, the prompt injected the codebase context dynamically:
```
You are an AI assistant helping a developer with their project. Here is a sample of the codebase (may be truncated for brevity):
{concatenated file contents}
```

For Documentation Generation:
```
You are an expert technical writer. Based on the provided project code, generate a comprehensive README.md including Setup Instructions, Architecture Overview, and API endpoints (if any). Do NOT wrap in JSON, just return raw markdown.
```

For Test Generation:
```
You are an expert QA engineer. Generate Unit Tests for the provided code file using a standard testing framework like Jest or PyTest. Return ONLY the code for the test, nothing else.
```

## Generated Code vs. Manually Written Code

### AI-Generated Code
The following code was generated with AI assistance and manually verified:
- Backend modules: Full NestJS module structure (auth, projects, files, reviews, AI providers, chat)
- Prisma schema and database models
- Frontend pages: Login, Register, Dashboard, Project detail, Settings
- Frontend components: CodeExplorer (with tree view), ReviewDashboard, AIChat
- UI components: shadcn/ui component wrappers (button, card, input, select, dialog, etc.)
- State management with Zustand
- API client configuration with Axios interceptors

### Manually Written Code
All generated code was reviewed, tested, and verified for correctness. Specific manual adjustments include:
- Security fixes: Removal of hardcoded API keys from .env
- Dependency version corrections for @langchain/core compatibility
- CodeExplorer tree structure algorithm (buildTree, sortTree, filterNodes)
- Drag-and-drop upload handler with proper event management
- GitHub URL import with recursive directory fetching
- Review search filtering logic

## Engineering Decisions
1. **NestJS over FastAPI**: Selected NestJS for the backend to maintain a unified language (TypeScript) across the entire stack, simplifying context switching and type sharing.
2. **Prisma ORM**: Chosen for its robust type-safety and rapid schema iteration capabilities compared to raw SQL or TypeORM.
3. **Database File Storage**: For simplicity and immediate availability to the AI context generation step, extracted source code text is stored directly in PostgreSQL rather than an S3 bucket or local disk.
4. **Langchain OpenAI Adapter**: Utilized `@langchain/openai` instead of writing raw `fetch` wrappers because it seamlessly handles retries and correctly formats requests to any endpoint that mimics the OpenAI API spec (like LM Studio).
5. **Client-Side Search**: Review and file search is implemented client-side for instant responsiveness, leveraging React `useMemo` for efficient filtering.
6. **Three Upload Methods**: ZIP upload, drag-and-drop, and GitHub URL import provide flexibility for different developer workflows.
