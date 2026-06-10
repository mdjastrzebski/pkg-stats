# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript ESM CLI for displaying npm package download stats. Source lives in `src/`; `src/bin.ts` is the CLI entry, `src/index.ts` exports the library surface, `src/npm-api.ts` handles registry access, and `src/mode/` contains command modes such as package stats and package comparison. Formatting, colors, option parsing, and stats helpers are split into focused files under `src/`.

Tests live in `src/__tests__/` and use Vitest. Documentation assets, including example screenshots used by `README.md`, are in `docs/public/`. Build output goes to `dist/` and is ignored by ESLint.

## Build, Test, and Development Commands

Use Node 24 via `.nvmrc` for local development and CI. The package supports Node `>=22.13.0`.

Use pnpm 11.x, as pinned in `package.json`.

- `pnpm install` installs dependencies from `pnpm-lock.yaml`.
- `pnpm build` runs `tsc` and emits `dist/`.
- `pnpm typecheck` runs TypeScript without emitting files.
- `pnpm lint` runs ESLint across the project.
- `pnpm test` runs Vitest in watch mode.
- `pnpm test -- --no-watch` runs tests once for CI-style validation.
- `pnpm validate` runs linting, type checking, and tests.

For local CLI checks after building, run examples such as `node bin.js react` or `node bin.js moment date-fns dayjs`.

## Coding Style & Naming Conventions

Keep modules small and named by responsibility, using kebab-case filenames such as `cli-options.ts` and `compare-packages.ts`. Prefer explicit TypeScript types at public boundaries and preserve the ESM import style with `.js` extensions in relative imports.

ESLint uses `typescript-eslint` strict rules, `@typescript-eslint/consistent-type-imports`, and `eslint-plugin-simple-import-sort`. Run `pnpm lint` before submitting changes. Follow the existing two-space indentation and concise function naming patterns.

## Testing Guidelines

Add focused Vitest tests under `src/__tests__/` with `*.test.ts` names. Prefer deterministic tests for formatting, parsing, and mode behavior. Inline snapshots are acceptable for stable CLI output fragments. Run `pnpm test -- --no-watch` for a single validation pass, and use `pnpm validate` before larger changes.

## Commit & Pull Request Guidelines

Git history follows Conventional Commit-style messages, for example `feat: dynamic chart width`, `fix: improve color generation`, and `chore: release v0.6.0`. Use concise imperative subjects with an appropriate type such as `feat`, `fix`, `refactor`, `test`, or `chore`.

Pull requests should describe the user-visible change, note validation commands run, link related issues when available, and include updated screenshots when CLI output or README examples change.

## Security & Configuration Tips

Do not commit npm tokens, registry credentials, or generated release artifacts. Keep network-facing code in `src/npm-api.ts` small and easy to validate, and handle registry failures with clear user-facing errors.
