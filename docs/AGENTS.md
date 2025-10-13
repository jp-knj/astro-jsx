# Repository Guidelines

## Project Structure & Module Organization
- Core runtime lives in `src/runtime/jsx-runtime.ts`, which houses factories, config helpers, and exported types; keep related tests in `src/runtime/jsx-runtime.test.ts`.
- TypeScript configuration (`tsconfig.json`) outputs build artifacts to `dist/` (ignored in git); do not check in compiled files.
- Tooling configuration (`biome.json`) defines linting/formatting rules; keep project-level settings in the root.
- Use the workspace package manager (`pnpm`) and Node.js >= 18.14.1 per `package.json` engines.

## Build, Test, and Development Commands
- `pnpm install` — install dependencies; run after cloning or when lockfile changes.
- `pnpm build` — compile TypeScript with declarations into `dist/`.
- `pnpm dev` — watch mode for local iteration; rebuilds on save.
- `pnpm typecheck` — run `tsc --noEmit` to validate types without writing files.
- `pnpm lint` / `pnpm format` — enforce Biome rules; run before committing to avoid CI friction.
- `bun test` — execute Bun's built-in test runner against the colocated `*.test.ts` files.

## Coding Style & Naming Conventions
- Follow Biome defaults: 2-space indentation, single quotes for strings, and trailing commas where possible.
- Prefer named exports; reserve default exports for Astro-facing entry points.
- File names should be lowercase kebab-case; TypeScript interfaces, types, and components use PascalCase (`RuntimeConfig`).
- Keep modules small and colocate helpers next to the runtime code they extend.

## Testing Guidelines
- Add unit tests alongside source files (e.g., `src/runtime/jsx-runtime.test.ts`); `tsconfig.json` already excludes `*.test.ts` from builds.
- Prefer Bun's built-in test runner (`bun test`) for fast feedback; note alternative frameworks if you introduce them.
- Exercise SSR edge cases (fragments, async children) and ensure type-level assertions via `tsd` or compile-time checks when practical.
- Aim for meaningful coverage on new features; include reproduction fixtures under `examples/` if integration cases are needed.

## Commit & Pull Request Guidelines
- Follow short, imperative commit messages (`add jsx fragment support`); group related changes together.
- Reference issues in the footer (`Refs #123`) when applicable and keep commits logically scoped.
- Pull requests should include: summary of changes, testing notes (commands run), screenshots when behavior affects rendered markup, and any follow-up tasks.
- Ensure `pnpm lint` and `pnpm build` pass before requesting review; mention breaking changes prominently in the PR description.
