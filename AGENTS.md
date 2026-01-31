# AGENTS.md

Guidelines for AI coding agents working in the NeXusTC codebase.

## Project Overview

NeXusTC is a full-stack TypeScript monorepo with TanStack Start (React + SSR), oRPC for type-safe APIs, Turborepo, Drizzle ORM (PostgreSQL), Better-Auth, and Redis. Package manager: **bun@1.3.0**.

## Build/Lint/Test Commands

```bash
# Development
bun run dev              # Start all apps (web on port 3000)
bun run dev:web          # Start web app only
bun install              # Install dependencies

# Building
bun run build            # Build all packages/apps
bun run web:build        # Build web app only
bun run check-types      # Type-check all packages

# Code Quality (Ultracite/Biome)
bun run check            # Run linter/formatter with auto-fix

# Testing
bun run test             # Run all tests
bun run test:watch       # Run API tests in watch mode (in packages/api)

# Single test file:
bun run test -- path/to/file.test.ts
# or within a package:
cd packages/api && bun run test -- src/routers/user.test.ts

# Database
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate migrations from schema
```

## Code Style Guidelines

### TypeScript

- Use explicit types for function parameters/returns when it enhances clarity
- Prefer `unknown` over `any`
- Use const assertions (`as const`) for immutable values
- Prefer `type` over `interface` for type definitions

### Naming Conventions

- Variables/functions: camelCase (`getUserProfile`)
- Components: PascalCase (`UserProfile`)
- Constants: UPPER_SNAKE_CASE for true constants
- Files: kebab-case for utilities, PascalCase for components
- Database tables/columns: snake_case in schema

### Imports & Formatting

- Use specific imports over namespace imports
- Group imports: external libs first, then internal (`@repo/*`), then relative
- No barrel files (index re-exports)
- Use `const` by default, `let` only when reassignment needed
- Arrow functions for callbacks and short functions

### Modern Patterns

- `for...of` over `.forEach()` and indexed loops
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Template literals over string concatenation
- Destructuring for objects/arrays
- Early returns over nested conditionals

### React

- Function components only (no class components)
- Hooks at top level only, never conditionally
- Specify all dependencies in hook arrays correctly
- Use `key` prop with unique IDs (not indices)
- React 19: use ref as prop, not `React.forwardRef`
- Semantic HTML and ARIA attributes for accessibility

### Async/Await

- Always `await` promises in async functions
- Use `async/await` over promise chains
- Proper error handling with try-catch
- Don't use async functions as Promise executors

### Error Handling

- Remove `console.log`, `debugger`, `alert` from production code
- Throw `Error` objects with descriptive messages
- Use try-catch meaningfully - don't catch just to rethrow
- Prefer early returns for error cases

### Security

- Add `rel="noopener"` when using `target="_blank"`
- Validate and sanitize user input
- Avoid `dangerouslySetInnerHTML` unless necessary

### Performance

- Avoid spread in accumulators within loops
- Use top-level regex literals
- Prefer specific imports over namespace imports

### Comments

- Never comment obvious code - it must be self-explanatory
- Use comments only for complex logic that needs explanation

## Testing Guidelines

- Test files: `*.test.ts` or `*.spec.ts`
- Web tests: Vitest with happy-dom environment
- API tests: Vitest with node environment
- Use async/await, never done callbacks
- Don't commit `.only` or `.skip` in tests
- Keep test suites flat - avoid excessive `describe` nesting

## Architecture Patterns

### API (oRPC)

- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated-only
- Use `permissionProcedure([permissions])` for role-based access
- Routers organized by domain in `packages/api/src/routers/`

### Database (Drizzle)

- Schema in `packages/db/src/schema/app.ts`
- Use re-exported operators (`eq`, `and`, `or`) from `@repo/db`
- Redis singleton via `getRedis()`

### Frontend (TanStack Start)

- File-based routing in `apps/web/src/routes/`
- Components in `apps/web/src/components/`
- Use `orpc` client for API calls with TanStack Query
- Routes auto-generated - don't manually edit `routeTree.gen.ts`

## Environment Variables

Required: `DATABASE_URL`, `REDIS_URL`
Build-time: `VITE_TURNSTILE_SITE_KEY`, `VITE_ASSETS_BUCKET_URL`

Always run `bun run check` before committing to ensure code passes Ultracite/Biome rules.
