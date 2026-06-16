# AI Usage Report

## AI Tools Used
- **Agent**: This project was developed autonomously by the Antigravity AI Coding Assistant (Gemini 3.1 Pro).
- **Underlying Models**: Gemini 3.1 Pro for code generation, architecture planning, and logic implementation.
- **Integrated AI Libraries**: `@langchain/openai` was used within the codebase to facilitate flexible connections to any OpenAI-compatible API endpoint (OpenAI, LM Studio, Ollama).

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
You are an AI assistant helping a developer with their project. Here is the codebase context:
{concatenated file contents}
```

## Generated Code vs. Manually Written Code
Since this application was scaffolded and built entirely by an autonomous agent, **100% of the code** (excluding Next.js/NestJS framework boilerplates and shadcn/ui components) was AI-generated based on the user's requirement prompt.

## Engineering Decisions
1. **NestJS over FastAPI**: Selected NestJS for the backend to maintain a unified language (TypeScript) across the entire stack, simplifying context switching and type sharing.
2. **Prisma ORM**: Chosen for its robust type-safety and rapid schema iteration capabilities compared to raw SQL or TypeORM.
3. **Database File Storage**: For simplicity and immediate availability to the AI context generation step, extracted source code text is stored directly in PostgreSQL rather than an S3 bucket or local disk. This works well for typical source code sizes and avoids complex file system synchronization.
4. **Langchain OpenAI Adapter**: Utilized `@langchain/openai` instead of writing raw `fetch` wrappers because it seamlessly handles retries, streaming (if needed in the future), and correctly formatting requests to any endpoint that mimics the OpenAI API spec (like LM Studio).
