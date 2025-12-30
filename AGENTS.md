# AGENTS.md - Coding Agent Guidelines

This document provides essential information for AI coding agents working in this repository.

## Project Overview

Monorepo built with Turborepo, using:

- **Frontend**: React 19, TanStack Router, TailwindCSS, shadcn/ui
- **Backend**: Hono, oRPC (type-safe APIs)
- **Database**: Drizzle ORM with SQLite/Turso
- **Auth**: Better-Auth
- **Runtime**: Bun (package manager & runtime)
- **Linting/Formatting**: Biome with Ultracite preset

## Build/Test/Lint Commands

### Root Level Commands

```bash
bun install                    # Install all dependencies
bun run dev                    # Start all apps in dev mode
bun run build                  # Build all apps
bun run check                  # Format and lint with Biome (auto-fix)
bun run check-types            # Type check all apps
```

### Package-Specific Commands

```bash
# Web app (Vite + React)
bun run dev:web                # Start web app on port 3001
turbo -F web build             # Build web app
turbo -F web test              # Run all tests in web app
turbo -F web test:run          # Run tests once (no watch)
turbo -F web check-types       # Type check web app

# Server (Hono API)
bun run dev:server             # Start server on port 3000
turbo -F server build          # Build server
turbo -F server check-types    # Type check server

# Database
bun run db:push                # Apply schema changes
bun run db:generate            # Generate migrations
turbo -F @repo/db db:push      # Direct db commands
```

### Linting/Formatting

```bash
biome check --write .          # Format and lint with Biome (auto-fix)
```

## Code Style Guidelines

This project uses **Ultracite** (zero-config Biome preset). Most formatting/linting issues are auto-fixed.

### Import Organization

- Group imports: external packages → workspace packages → relative imports
- Use type imports: `import type { AppRouter } from "@repo/api"`
- Prefer named imports over default imports for clarity
- Use path aliases: `@/*` for `./src/*` in apps/web

Example:

```typescript
import { createORPCClient } from "@orpc/client";
import type { AppRouterClient } from "@repo/api/routers/index";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { link } from "@/utils/orpc";
```

### TypeScript Conventions

- **Strict mode enabled**: All strict TypeScript checks are on
- **Explicit types**: Add types for function parameters and return values when they enhance clarity
- **No `any`**: Use `unknown` instead when type is genuinely unknown
- **Type safety**: Leverage TypeScript's type narrowing instead of type assertions
- **Const assertions**: Use `as const` for immutable values and literal types
- **No unused vars**: `noUnusedLocals` and `noUnusedParameters` are enforced

### Naming Conventions

- **Files**: kebab-case (e.g., `use-debounce-effect.ts`, `age-verification-dialog.tsx`)
- **Components**: PascalCase (e.g., `AgeVerificationDialog`)
- **Functions/Variables**: camelCase (e.g., `createORPCClient`, `queryClient`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DOCUMENT_STATUSES`, `TAXONOMIES`)
- **Types/Interfaces**: PascalCase (e.g., `AppRouter`, `RouterAppContext`)

### Code Organization

- **Monorepo structure**:
  - `apps/web` - Frontend React app
  - `apps/server` - Backend Hono API
  - `packages/api` - API routers and business logic
  - `packages/db` - Database schema and queries
  - `packages/auth` - Authentication config
  - `packages/shared` - Shared schemas, types, constants
- **Component structure**: Keep components focused and under reasonable complexity
- **Early returns**: Prefer early returns over nested conditionals
- **Extract complexity**: Extract complex conditions into well-named boolean variables

### React Conventions

- **Function components only**: No class components
- **Hooks**: Call at top level only, never conditionally
- **Dependencies**: Specify all hook dependencies correctly
- **Keys**: Use unique IDs for list items (prefer over array indices)
- **Ref as prop**: Use ref as a prop (React 19+ pattern), not `forwardRef`
- **No component nesting**: Don't define components inside other components

### Error Handling

- **Throw Error objects**: Use `throw new Error("message")`, not strings
- **Try-catch**: Use meaningfully, don't catch just to rethrow
- **Async errors**: Handle with try-catch blocks in async functions
- **Early returns**: Use for error cases to reduce nesting

### Modern JavaScript/TypeScript

- **Arrow functions**: Use for callbacks and short functions
- **Const/let**: Use `const` by default, `let` only when reassignment needed, never `var`
- **For...of**: Prefer over `.forEach()` and indexed `for` loops
- **Optional chaining**: Use `?.` for safer property access
- **Nullish coalescing**: Use `??` instead of `||` for default values
- **Template literals**: Prefer over string concatenation
- **Destructuring**: Use for object and array assignments
- **Async/await**: Use instead of promise chains for readability

### Validation & Schemas

- **Zod schemas**: Define in `packages/shared/src/schemas.ts`
- **Transform**: Chain `.trim()` and `.transform()` for string sanitization
- **Numeric separators**: Use underscores for readability (e.g., `65_535`)

Example:

```typescript
export const postCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform((val) => val.trim()),
  content: z
    .string()
    .trim()
    .max(65_535)
    .transform((val) => val.trim()),
});
```

### Testing (Vitest)

- **File naming**: `*.test.ts` or `*.test.tsx`
- **Structure**: Use `describe`, `it`/`test`, `beforeEach`, `afterEach`
- **Async tests**: Use async/await, not done callbacks
- **No .only/.skip**: Don't commit tests with `.only` or `.skip`
- **Mocking**: Use `vi.fn()`, `vi.mock()`, `vi.useFakeTimers()`
- **React testing**: Use `@testing-library/react` with `renderHook`, `render`

### Security

- **Links**: Add `rel="noopener"` when using `target="_blank"`
- **No dangerouslySetInnerHTML**: Avoid unless absolutely necessary
- **No eval()**: Never use eval or similar dynamic code execution
- **Input validation**: Always validate and sanitize user input

### Performance

- **No spread in loops**: Avoid spread syntax in accumulators within loops
- **Regex literals**: Use top-level regex literals instead of creating in loops
- **Specific imports**: Prefer specific imports over namespace imports
- **No barrel files**: Avoid index files that re-export everything

## Environment Setup

- **Node version**: Uses Bun as package manager (`bun@1.3.0`)
- **TypeScript**: v5.8+
- **Module system**: ESM only (`"type": "module"`)
- **Module resolution**: `bundler` mode

## Database Operations

```bash
bun run db:push                # Apply schema changes (no migrations)
bun run db:generate            # Generate migration files
cd packages/db && drizzle-kit studio  # Open Drizzle Studio
```

## Common Patterns

### oRPC Router Definition

```typescript
export const appRouter = {
  comic,
  post,
  term,
  user,
  file,
  extras,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
```

### TanStack Router Route

```typescript
export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [{ title: "App Title" }],
  }),
});
```

## Key Reminders

1. **Always run `bun run check` before committing** - Auto-fixes most issues
2. **Use workspace packages**: Import from `@repo/*` for shared code
3. **Type safety**: Export and import types properly across packages
4. **No console.log**: Remove debugging statements before committing
5. **Path aliases**: Use `@/*` imports in web app for cleaner imports
6. **Bun runtime**: Use `bun` commands, not `npm` or `yarn`
