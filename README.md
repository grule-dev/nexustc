# NeXusTC

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - Full-stack Framework powered by TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Have a PostgreSQL database set up.

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the web application.

## Project Structure

```
ntc-cf/
├── apps/
│   ├── web/            # FullStack application (React + TanStack Start)
└── packages/
    ├── api/            # API layer / business logic
    ├── auth/           # Authentication configuration & logic
    ├── db/             # Database schema & queries
    ├── env/            # Type-safe environment variables
    ├── shared/         # Shared schemas, types, constants
    └── transactional/  # E-mail templates
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
